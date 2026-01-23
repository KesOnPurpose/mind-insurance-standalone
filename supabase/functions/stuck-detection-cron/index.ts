/**
 * Stuck Detection Cron Edge Function
 *
 * Called by N8n workflow daily to detect users who haven't made progress.
 * Checks against configured thresholds (3/7/14/30 days) and triggers
 * appropriate nudge actions via SMS and in-app messages.
 *
 * @module stuck-detection-cron
 * @author FEAT-GH-007
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  getStuckDetectionConfig,
  getStuckUsers,
  logAutomationEvent,
  updateEventDeliveryStatus,
  formatSmsTemplate,
  StuckUser,
  StuckThresholdKey
} from "../_shared/stuck-detection.ts";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ============================================================================
// TYPES
// ============================================================================

interface CronRequest {
  /** Optional: only check specific threshold (day3, day7, day14, day30) */
  threshold?: StuckThresholdKey;
  /** Optional: dry run mode - detect but don't send */
  dry_run?: boolean;
}

interface ProcessedUser {
  user_id: string;
  full_name: string | null;
  threshold: StuckThresholdKey;
  days_stuck: number;
  event_id: string | null;
  sms_sent: boolean;
  nudge_sent: boolean;
  error?: string;
}

interface CronResponse {
  success: boolean;
  timestamp: string;
  thresholds_checked: StuckThresholdKey[];
  total_stuck_users: number;
  users_processed: ProcessedUser[];
  errors: string[];
  dry_run: boolean;
}

// ============================================================================
// NUDGE SENDING
// ============================================================================

/**
 * Send SMS nudge via GoHighLevel
 * Calls the send-nudge Edge Function
 */
async function sendSmsNudge(
  user: StuckUser,
  smsContent: string,
  eventId: string
): Promise<boolean> {
  try {
    // Call send-nudge Edge Function
    const { data, error } = await supabase.functions.invoke('send-nudge', {
      body: {
        user_id: user.user_id,
        phone: user.phone,
        ghl_contact_id: user.ghl_contact_id,
        message: smsContent,
        event_id: eventId,
        nudge_type: `stuck_${user.stuck_threshold}`
      }
    });

    if (error) {
      console.error(`[StuckCron] SMS send error for ${user.user_id}:`, error);
      await updateEventDeliveryStatus(supabase, eventId, 'failed', error.message);
      return false;
    }

    console.log(`[StuckCron] SMS sent to ${user.user_id}:`, data);
    await updateEventDeliveryStatus(supabase, eventId, 'sent');
    return true;

  } catch (error) {
    console.error(`[StuckCron] SMS exception for ${user.user_id}:`, error);
    await updateEventDeliveryStatus(
      supabase,
      eventId,
      'failed',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return false;
  }
}

/**
 * Send in-app nudge message via Nette chat
 */
async function sendInAppNudge(
  user: StuckUser,
  thresholdKey: StuckThresholdKey
): Promise<boolean> {
  try {
    // Create a nudge message in the user's Nette chat thread
    const nudgeMessages: Record<StuckThresholdKey, string> = {
      day3: `Hey ${user.full_name?.split(' ')[0] || 'there'}! I noticed you haven't worked on "${user.current_tactic_name || 'your lessons'}" in a few days. Life happens - but I'm here whenever you're ready to jump back in. What's one small step you could take today? 🌟`,
      day7: `${user.full_name?.split(' ')[0] || 'Friend'}, it's been a week since we worked together. I've been thinking about your journey and where you left off with "${user.current_tactic_name || 'your progress'}". Sometimes a pause is exactly what we need - but I want to make sure you don't lose your momentum. Ready to reconnect?`,
      day14: `${user.full_name?.split(' ')[0] || 'Hey there'}, two weeks have passed and I'm genuinely concerned. Your transformation matters, and I don't want to see you slip away. Can we talk about what's been holding you back? Sometimes the biggest breakthroughs come right after we feel like giving up.`,
      day30: `${user.full_name?.split(' ')[0] || 'Friend'}, it's been a month. I want you to know - your spot is still here, your progress is still saved, and your goals are still waiting. Whenever you're ready to restart, I'll be here. No judgment, just support. 💙`
    };

    // Get or create Nette chat thread for user
    const { data: existingThread } = await supabase
      .from('nette_chat_threads')
      .select('id')
      .eq('user_id', user.user_id)
      .limit(1)
      .single();

    let threadId = existingThread?.id;

    if (!threadId) {
      // Create new thread
      const { data: newThread, error } = await supabase
        .from('nette_chat_threads')
        .insert({
          user_id: user.user_id,
          title: 'Nette AI Coach',
          is_pinned: true
        })
        .select('id')
        .single();

      if (error) {
        console.error(`[StuckCron] Failed to create thread for ${user.user_id}:`, error);
        return false;
      }
      threadId = newThread.id;
    }

    // Insert nudge message
    const { error: msgError } = await supabase
      .from('nette_chat_messages')
      .insert({
        thread_id: threadId,
        user_id: user.user_id,
        role: 'assistant',
        content: nudgeMessages[thresholdKey],
        metadata: {
          type: 'stuck_nudge',
          threshold: thresholdKey,
          days_stuck: user.days_since_last_progress,
          tactic_id: user.current_tactic_id
        }
      });

    if (msgError) {
      console.error(`[StuckCron] Failed to insert nudge for ${user.user_id}:`, msgError);
      return false;
    }

    console.log(`[StuckCron] In-app nudge sent to ${user.user_id}`);
    return true;

  } catch (error) {
    console.error(`[StuckCron] In-app nudge exception for ${user.user_id}:`, error);
    return false;
  }
}

// ============================================================================
// MAIN PROCESSING
// ============================================================================

/**
 * Process stuck users for a specific threshold
 */
async function processThreshold(
  thresholdKey: StuckThresholdKey,
  thresholdDays: number,
  smsTemplate: string | undefined,
  dryRun: boolean
): Promise<ProcessedUser[]> {
  console.log(`[StuckCron] Processing ${thresholdKey} threshold (${thresholdDays}+ days)`);

  const stuckUsers = await getStuckUsers(supabase, thresholdDays, thresholdKey);

  if (stuckUsers.length === 0) {
    console.log(`[StuckCron] No stuck users at ${thresholdKey} threshold`);
    return [];
  }

  const processed: ProcessedUser[] = [];

  for (const user of stuckUsers) {
    const result: ProcessedUser = {
      user_id: user.user_id,
      full_name: user.full_name,
      threshold: thresholdKey,
      days_stuck: user.days_since_last_progress,
      event_id: null,
      sms_sent: false,
      nudge_sent: false
    };

    if (dryRun) {
      console.log(`[StuckCron] DRY RUN: Would process ${user.user_id} at ${thresholdKey}`);
      processed.push(result);
      continue;
    }

    try {
      // Log the automation event
      const eventId = await logAutomationEvent(
        supabase,
        user.user_id,
        `stuck_${thresholdKey}`,
        user.current_tactic_id,
        `Stuck detection triggered at ${thresholdKey} threshold`,
        'pending'
      );

      result.event_id = eventId;

      if (!eventId) {
        result.error = 'Failed to log event';
        processed.push(result);
        continue;
      }

      // Send SMS if user has phone and template exists
      if (user.phone && smsTemplate) {
        const smsContent = formatSmsTemplate(smsTemplate, user);
        result.sms_sent = await sendSmsNudge(user, smsContent, eventId);
      }

      // Always send in-app nudge
      result.nudge_sent = await sendInAppNudge(user, thresholdKey);

      // Update event with final status
      if (result.sms_sent || result.nudge_sent) {
        await updateEventDeliveryStatus(supabase, eventId, 'delivered');
      }

    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[StuckCron] Error processing ${user.user_id}:`, error);
    }

    processed.push(result);
  }

  return processed;
}

// ============================================================================
// HANDLER
// ============================================================================

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const response: CronResponse = {
    success: true,
    timestamp: new Date().toISOString(),
    thresholds_checked: [],
    total_stuck_users: 0,
    users_processed: [],
    errors: [],
    dry_run: false
  };

  try {
    // Parse request
    const body = await req.json().catch(() => ({})) as CronRequest;
    const dryRun = body.dry_run === true;
    response.dry_run = dryRun;

    console.log(`[StuckCron] Starting${dryRun ? ' (DRY RUN)' : ''}, threshold: ${body.threshold || 'all'}`);

    // Get configuration
    const config = await getStuckDetectionConfig(supabase);

    // Define thresholds to check
    const thresholdsToCheck: Array<{ key: StuckThresholdKey; days: number }> = [];

    if (body.threshold) {
      // Check specific threshold only
      const daysMap: Record<StuckThresholdKey, number> = {
        day3: 3,
        day7: 7,
        day14: 14,
        day30: 30
      };
      if (config.thresholds[body.threshold]) {
        thresholdsToCheck.push({ key: body.threshold, days: daysMap[body.threshold] });
      }
    } else {
      // Check all enabled thresholds
      if (config.thresholds.day30) thresholdsToCheck.push({ key: 'day30', days: 30 });
      if (config.thresholds.day14) thresholdsToCheck.push({ key: 'day14', days: 14 });
      if (config.thresholds.day7) thresholdsToCheck.push({ key: 'day7', days: 7 });
      if (config.thresholds.day3) thresholdsToCheck.push({ key: 'day3', days: 3 });
    }

    // Process each threshold (in order of longest to shortest to avoid duplicate processing)
    for (const { key, days } of thresholdsToCheck) {
      response.thresholds_checked.push(key);

      const processed = await processThreshold(
        key,
        days,
        config.sms_templates[key],
        dryRun
      );

      response.users_processed.push(...processed);
      response.total_stuck_users += processed.length;

      // Collect any errors
      for (const user of processed) {
        if (user.error) {
          response.errors.push(`${user.user_id}: ${user.error}`);
        }
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[StuckCron] Completed in ${duration}ms. Processed: ${response.total_stuck_users} users`);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[StuckCron] Fatal error:', error);
    response.success = false;
    response.errors.push(error instanceof Error ? error.message : 'Unknown error');

    return new Response(
      JSON.stringify(response),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
