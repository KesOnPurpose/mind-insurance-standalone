/**
 * Shared Stuck Detection Logic Module
 *
 * Provides reusable functions for detecting stuck users in the
 * Grouphome course system. Used by stuck-detection-cron and
 * potentially other automation Edge Functions.
 *
 * @module stuck-detection
 * @author FEAT-GH-007
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================================
// TYPES
// ============================================================================

export interface StuckUser {
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  current_tactic_id: string | null;
  current_tactic_name: string | null;
  current_phase: number;
  last_progress_at: string;
  days_since_last_progress: number;
  stuck_threshold: 'day3' | 'day7' | 'day14' | 'day30';
  ghl_contact_id: string | null;
}

export interface StuckDetectionThresholds {
  day3: boolean;
  day7: boolean;
  day14: boolean;
  day30: boolean;
}

export interface StuckDetectionConfig {
  thresholds: StuckDetectionThresholds;
  sms_templates: {
    day3?: string;
    day7?: string;
    day14?: string;
    day30?: string;
  };
}

export type StuckThresholdKey = 'day3' | 'day7' | 'day14' | 'day30';

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Get stuck detection configuration from gh_curriculum_config
 */
export async function getStuckDetectionConfig(
  supabase: SupabaseClient
): Promise<StuckDetectionConfig> {
  const defaultConfig: StuckDetectionConfig = {
    thresholds: { day3: true, day7: true, day14: true, day30: true },
    sms_templates: {
      day3: "Hey {first_name}! It's been a few days since you worked on {current_tactic}. Ready to get back on track? {chat_link}",
      day7: "{first_name}, a week has passed since your last lesson. Your transformation journey is waiting! {chat_link}",
      day14: "{first_name}, it's been 2 weeks. Let's reconnect and reignite your progress. Book a call: {calendar_link}",
      day30: "{first_name}, we miss you! Let's schedule a call to get you back on your journey. {calendar_link}"
    }
  };

  try {
    // Get thresholds config
    const { data: thresholdsData } = await supabase
      .from('gh_curriculum_config')
      .select('config_value')
      .eq('config_key', 'stuck_detection_thresholds')
      .single();

    // Get SMS templates
    const { data: templatesData } = await supabase
      .from('gh_curriculum_config')
      .select('config_value')
      .eq('config_key', 'sms_templates')
      .single();

    return {
      thresholds: thresholdsData?.config_value || defaultConfig.thresholds,
      sms_templates: templatesData?.config_value || defaultConfig.sms_templates
    };
  } catch (error) {
    console.error('[StuckDetection] Error fetching config, using defaults:', error);
    return defaultConfig;
  }
}

// ============================================================================
// STUCK USER DETECTION
// ============================================================================

/**
 * Calculate the threshold key based on days since last progress
 */
export function getThresholdKey(daysSinceLastProgress: number): StuckThresholdKey | null {
  if (daysSinceLastProgress >= 30) return 'day30';
  if (daysSinceLastProgress >= 14) return 'day14';
  if (daysSinceLastProgress >= 7) return 'day7';
  if (daysSinceLastProgress >= 3) return 'day3';
  return null;
}

/**
 * Get users who are stuck (no progress for X+ days) filtered by threshold
 *
 * This query:
 * 1. Joins user_profiles with gh_user_tactic_progress
 * 2. Calculates days since last update
 * 3. Filters for users matching the threshold
 * 4. Excludes users who have already received this event type
 */
export async function getStuckUsers(
  supabase: SupabaseClient,
  thresholdDays: number,
  thresholdKey: StuckThresholdKey
): Promise<StuckUser[]> {
  const now = new Date();
  const thresholdDate = new Date(now.getTime() - (thresholdDays * 24 * 60 * 60 * 1000));
  const thresholdDateStr = thresholdDate.toISOString();

  console.log(`[StuckDetection] Looking for users stuck >= ${thresholdDays} days (since ${thresholdDateStr})`);

  try {
    // Get users with their most recent progress
    const { data: usersWithProgress, error } = await supabase
      .from('user_profiles')
      .select(`
        id,
        full_name,
        email,
        phone,
        ghl_contact_id,
        gh_user_tactic_progress!inner(
          tactic_id,
          updated_at,
          status
        )
      `)
      .eq('user_source', 'gh_user')
      .order('updated_at', { foreignTable: 'gh_user_tactic_progress', ascending: false });

    if (error) {
      console.error('[StuckDetection] Error fetching users:', error);
      return [];
    }

    if (!usersWithProgress || usersWithProgress.length === 0) {
      console.log('[StuckDetection] No users with progress found');
      return [];
    }

    // Process users to find stuck ones
    const stuckUsers: StuckUser[] = [];
    const processedUserIds = new Set<string>();

    for (const user of usersWithProgress) {
      // Skip if already processed (we only want each user once)
      if (processedUserIds.has(user.id)) continue;
      processedUserIds.add(user.id);

      // Get the most recent progress entry
      const progress = user.gh_user_tactic_progress;
      if (!progress || progress.length === 0) continue;

      // Find the most recent update
      const latestProgress = progress.reduce((latest: any, current: any) => {
        return new Date(current.updated_at) > new Date(latest.updated_at) ? current : latest;
      }, progress[0]);

      const lastProgressDate = new Date(latestProgress.updated_at);
      const daysSinceProgress = Math.floor(
        (now.getTime() - lastProgressDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Check if user is stuck at this threshold level
      const userThresholdKey = getThresholdKey(daysSinceProgress);
      if (userThresholdKey !== thresholdKey) continue;

      // Check if event already triggered for this user/threshold
      const alreadyTriggered = await hasEventBeenTriggered(
        supabase,
        user.id,
        `stuck_${thresholdKey}`
      );

      if (alreadyTriggered) {
        console.log(`[StuckDetection] User ${user.id} already has ${thresholdKey} event, skipping`);
        continue;
      }

      // Get current tactic name
      let tacticName = null;
      if (latestProgress.tactic_id) {
        const { data: tacticData } = await supabase
          .from('gh_tactic_instructions')
          .select('tactic_name, phase')
          .eq('tactic_id', latestProgress.tactic_id)
          .single();

        tacticName = tacticData?.tactic_name || null;
      }

      stuckUsers.push({
        user_id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        current_tactic_id: latestProgress.tactic_id,
        current_tactic_name: tacticName,
        current_phase: 1, // Will be determined from tactic
        last_progress_at: latestProgress.updated_at,
        days_since_last_progress: daysSinceProgress,
        stuck_threshold: thresholdKey,
        ghl_contact_id: user.ghl_contact_id
      });
    }

    console.log(`[StuckDetection] Found ${stuckUsers.length} stuck users at ${thresholdKey} threshold`);
    return stuckUsers;

  } catch (error) {
    console.error('[StuckDetection] Error in getStuckUsers:', error);
    return [];
  }
}

// ============================================================================
// EVENT TRACKING
// ============================================================================

/**
 * Check if an automation event has already been triggered for a user
 */
export async function hasEventBeenTriggered(
  supabase: SupabaseClient,
  userId: string,
  eventType: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('gh_automation_events')
    .select('id')
    .eq('user_id', userId)
    .eq('event_type', eventType)
    .limit(1);

  if (error) {
    console.error('[StuckDetection] Error checking event:', error);
    return false; // Safer to process than skip on error
  }

  return data && data.length > 0;
}

/**
 * Log an automation event to gh_automation_events
 */
export async function logAutomationEvent(
  supabase: SupabaseClient,
  userId: string,
  eventType: string,
  tacticId: string | null,
  actionTaken: string,
  deliveryStatus: 'pending' | 'sent' | 'failed' | 'delivered' = 'pending'
): Promise<string | null> {
  const { data, error } = await supabase
    .from('gh_automation_events')
    .insert({
      user_id: userId,
      event_type: eventType,
      tactic_id: tacticId,
      action_taken: actionTaken,
      delivery_status: deliveryStatus,
      triggered_at: new Date().toISOString()
    })
    .select('id')
    .single();

  if (error) {
    console.error('[StuckDetection] Error logging event:', error);
    return null;
  }

  return data.id;
}

/**
 * Update the delivery status of an automation event
 */
export async function updateEventDeliveryStatus(
  supabase: SupabaseClient,
  eventId: string,
  status: 'sent' | 'failed' | 'delivered',
  errorMessage?: string
): Promise<void> {
  const updateData: any = { delivery_status: status };
  if (errorMessage) {
    updateData.action_taken = `${updateData.action_taken || ''} | Error: ${errorMessage}`;
  }

  await supabase
    .from('gh_automation_events')
    .update(updateData)
    .eq('id', eventId);
}

// ============================================================================
// SMS TEMPLATE PROCESSING
// ============================================================================

/**
 * Replace placeholders in SMS template with user data
 */
export function formatSmsTemplate(
  template: string,
  user: StuckUser,
  chatLink: string = 'https://grouphome4newbies.com/chat',
  calendarLink: string = 'https://grouphome4newbies.com/book'
): string {
  return template
    .replace(/{first_name}/g, user.full_name?.split(' ')[0] || 'there')
    .replace(/{full_name}/g, user.full_name || 'there')
    .replace(/{current_tactic}/g, user.current_tactic_name || 'your current lesson')
    .replace(/{chat_link}/g, chatLink)
    .replace(/{calendar_link}/g, calendarLink)
    .replace(/{days_stuck}/g, String(user.days_since_last_progress));
}
