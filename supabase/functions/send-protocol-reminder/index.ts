// ============================================================================
// SEND PROTOCOL REMINDER - Daily MIO Protocol Notifications
// ============================================================================
// Triggered by N8n workflows:
// - 7:30 AM UTC: daily_reminder (push + Day 1 SMS welcome)
// - 5:00 PM UTC: missed_2_days (SMS intervention for users who missed 2 days)
// - 3:00 PM UTC: day7_final (push + SMS fallback for Day 7 final push)
// - 7:30 AM UTC: day3_milestone (72-hour celebration SMS for Day 3 completion)
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// TYPES
// ============================================================================

interface ReminderRequest {
  trigger_type: 'daily_reminder' | 'missed_2_days' | 'day7_final' | 'day3_milestone';
  source?: string;
  user_id?: string; // Optional: target specific user
}

interface ProtocolUser {
  id: string;
  user_id: string;
  current_day: number;
  title: string;
  created_at: string;
}

interface UserProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
  ghl_contact_id: string | null;
}

interface NotificationResult {
  user_id: string;
  protocol_id: string;
  day_number: number;
  push_sent: boolean;
  sms_sent: boolean;
  error?: string;
}

// ============================================================================
// DAY-SPECIFIC NOTIFICATION COPY
// ============================================================================

const DAY_MESSAGES: Record<number, { title: string; body: string }> = {
  1: {
    title: "Day 1 Awaits",
    body: "Your transformation begins today. Your first step toward new neural pathways."
  },
  2: {
    title: "Day 2 Is Here",
    body: "Yesterday you started. Today you strengthen. Keep building momentum."
  },
  3: {
    title: "Day 3 Momentum",
    body: "You're building momentum now. The brain is starting to notice."
  },
  4: {
    title: "Day 4 - Past 72 Hours",
    body: "Past the 72-hour mark. New patterns are forming."
  },
  5: {
    title: "Day 5 Acceleration",
    body: "You're in the acceleration zone now. Keep going."
  },
  6: {
    title: "Day 6 - Almost There",
    body: "Tomorrow you complete the cycle. Today, stay focused."
  },
  7: {
    title: "Day 7 - Final Day",
    body: "Your final day. Complete the transformation."
  }
};

// 72-Hour Milestone SMS - Celebration message (behavioral science-backed dopamine hit)
const DAY3_MILESTONE_SMS = `You did it. 72 hours of new neural pathways.

The real change starts now. Your brain is literally rewiring.

Day 4 awaits: https://mymindinsurance.com/mind-insurance/coverage`;

// ============================================================================
// GHL SMS SERVICE (Direct API)
// ============================================================================

async function sendGhlSms(
  contactId: string,
  message: string,
  locationId: string,
  privateToken: string
): Promise<boolean> {
  try {
    const response = await fetch('https://services.leadconnectorhq.com/conversations/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${privateToken}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      body: JSON.stringify({
        type: 'SMS',
        contactId,
        locationId,
        message
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[GHL SMS] Error:', response.status, errorText);
      return false;
    }

    console.log('[GHL SMS] Sent successfully to contact:', contactId);
    return true;
  } catch (error) {
    console.error('[GHL SMS] Exception:', error);
    return false;
  }
}

// ============================================================================
// PUSH NOTIFICATION (Internal Call)
// ============================================================================

async function sendPushNotification(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  title: string,
  body: string,
  url: string
): Promise<boolean> {
  try {
    // Call the existing send-push-notification edge function
    const { data, error } = await supabase.functions.invoke('send-push-notification', {
      body: {
        user_id: userId,
        title,
        body,
        url,
        tag: 'protocol-reminder',
        data: { type: 'protocol_reminder' }
      }
    });

    if (error) {
      console.error('[Push] Error:', error);
      return false;
    }

    return data?.sent > 0;
  } catch (error) {
    console.error('[Push] Exception:', error);
    return false;
  }
}

// ============================================================================
// LOG NOTIFICATION
// ============================================================================

async function logNotification(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  protocolId: string,
  notificationType: 'push' | 'sms',
  triggerType: string,
  delivered: boolean,
  errorMessage?: string
): Promise<void> {
  try {
    await supabase.from('notification_logs').insert({
      user_id: userId,
      protocol_id: protocolId,
      notification_type: notificationType,
      trigger: triggerType,
      delivered,
      error_message: errorMessage
    });
  } catch (error) {
    console.error('[Log] Failed to log notification:', error);
  }
}

// ============================================================================
// TRIGGER-SPECIFIC QUERIES
// ============================================================================

/**
 * Get all active protocols for daily reminder (all users with active protocols)
 */
async function getProtocolsForDailyReminder(
  supabase: ReturnType<typeof createClient>,
  targetUserId?: string
): Promise<ProtocolUser[]> {
  let query = supabase
    .from('mio_weekly_protocols')
    .select('id, user_id, current_day, title, created_at')
    .eq('status', 'active')
    .lte('current_day', 7);

  if (targetUserId) {
    query = query.eq('user_id', targetUserId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Get protocols where users missed 2+ consecutive days
 * Logic: Protocol is active, current_day >= 3, and no completion in the last 2 days
 */
async function getProtocolsForMissed2Days(
  supabase: ReturnType<typeof createClient>,
  targetUserId?: string
): Promise<ProtocolUser[]> {
  // First get active protocols on day 3+
  let query = supabase
    .from('mio_weekly_protocols')
    .select('id, user_id, current_day, title, created_at')
    .eq('status', 'active')
    .gte('current_day', 3)
    .lte('current_day', 7);

  if (targetUserId) {
    query = query.eq('user_id', targetUserId);
  }

  const { data: protocols, error } = await query;
  if (error) throw error;
  if (!protocols || protocols.length === 0) return [];

  // For each protocol, check if they have any completion in the last 2 days
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  twoDaysAgo.setHours(0, 0, 0, 0);

  const protocolsWithMissedDays: ProtocolUser[] = [];

  for (const protocol of protocols) {
    // Check for recent completions
    const { data: recentCompletions, error: completionError } = await supabase
      .from('mio_protocol_completions')
      .select('id, completed_at')
      .eq('protocol_id', protocol.id)
      .gte('completed_at', twoDaysAgo.toISOString())
      .limit(1);

    if (completionError) {
      console.error('[Missed2Days] Error checking completions for protocol:', protocol.id, completionError);
      continue;
    }

    // If no recent completions, this user missed 2 days
    if (!recentCompletions || recentCompletions.length === 0) {
      // Also check we haven't already sent a missed_2_days notification recently
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const { data: recentNotifications } = await supabase
        .from('notification_logs')
        .select('id')
        .eq('protocol_id', protocol.id)
        .eq('trigger', 'missed_2_days')
        .eq('delivered', true)
        .gte('sent_at', oneDayAgo.toISOString())
        .limit(1);

      // Only add if we haven't sent this notification in the last 24 hours
      if (!recentNotifications || recentNotifications.length === 0) {
        protocolsWithMissedDays.push(protocol);
      }
    }
  }

  return protocolsWithMissedDays;
}

/**
 * Get protocols on Day 7 where Day 6 is complete but Day 7 hasn't started
 */
async function getProtocolsForDay7Final(
  supabase: ReturnType<typeof createClient>,
  targetUserId?: string
): Promise<ProtocolUser[]> {
  // Get protocols on day 7
  let query = supabase
    .from('mio_weekly_protocols')
    .select('id, user_id, current_day, title, created_at')
    .eq('status', 'active')
    .eq('current_day', 7);

  if (targetUserId) {
    query = query.eq('user_id', targetUserId);
  }

  const { data: protocols, error } = await query;
  if (error) throw error;
  if (!protocols || protocols.length === 0) return [];

  const eligibleProtocols: ProtocolUser[] = [];

  for (const protocol of protocols) {
    // Check if Day 6 is complete
    const { data: day6Completion, error: day6Error } = await supabase
      .from('mio_protocol_completions')
      .select('id')
      .eq('protocol_id', protocol.id)
      .eq('day_number', 6)
      .limit(1);

    if (day6Error) {
      console.error('[Day7Final] Error checking Day 6 completion:', protocol.id, day6Error);
      continue;
    }

    // Check if Day 7 is NOT started
    const { data: day7Completion, error: day7Error } = await supabase
      .from('mio_protocol_completions')
      .select('id')
      .eq('protocol_id', protocol.id)
      .eq('day_number', 7)
      .limit(1);

    if (day7Error) {
      console.error('[Day7Final] Error checking Day 7 completion:', protocol.id, day7Error);
      continue;
    }

    // Day 6 complete AND Day 7 not started
    if (day6Completion && day6Completion.length > 0 && (!day7Completion || day7Completion.length === 0)) {
      // Check we haven't already sent day7_final notification today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: recentNotifications } = await supabase
        .from('notification_logs')
        .select('id')
        .eq('protocol_id', protocol.id)
        .eq('trigger', 'day7_final')
        .eq('delivered', true)
        .gte('sent_at', today.toISOString())
        .limit(1);

      if (!recentNotifications || recentNotifications.length === 0) {
        eligibleProtocols.push(protocol);
      }
    }
  }

  return eligibleProtocols;
}

/**
 * Get protocols where users just completed Day 3 (72-hour milestone)
 * This is a celebration moment - sends SMS to congratulate on neural rewiring milestone
 *
 * Behavioral Science: 72 hours is when new habits start to form neural pathways
 * Research: Celebratory messages at milestones increase retention by 3x
 */
async function getProtocolsForDay3Milestone(
  supabase: ReturnType<typeof createClient>,
  targetUserId?: string
): Promise<ProtocolUser[]> {
  // Get protocols on day 4 or higher (meaning Day 3 should be complete)
  let query = supabase
    .from('mio_weekly_protocols')
    .select('id, user_id, current_day, title, created_at')
    .eq('status', 'active')
    .gte('current_day', 4)
    .lte('current_day', 7);

  if (targetUserId) {
    query = query.eq('user_id', targetUserId);
  }

  const { data: protocols, error } = await query;
  if (error) throw error;
  if (!protocols || protocols.length === 0) return [];

  const eligibleProtocols: ProtocolUser[] = [];

  for (const protocol of protocols) {
    // Check if Day 3 was completed within the last 24 hours
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const { data: day3Completion, error: day3Error } = await supabase
      .from('mio_protocol_completions')
      .select('id, completed_at')
      .eq('protocol_id', protocol.id)
      .eq('day_number', 3)
      .gte('completed_at', oneDayAgo.toISOString())
      .limit(1);

    if (day3Error) {
      console.error('[Day3Milestone] Error checking Day 3 completion:', protocol.id, day3Error);
      continue;
    }

    // Day 3 completed within the last 24 hours
    if (day3Completion && day3Completion.length > 0) {
      // Check we haven't already sent day3_milestone notification
      const { data: recentNotifications } = await supabase
        .from('notification_logs')
        .select('id')
        .eq('protocol_id', protocol.id)
        .eq('trigger', 'day3_milestone')
        .eq('delivered', true)
        .limit(1);

      // Only add if we haven't sent this notification before
      if (!recentNotifications || recentNotifications.length === 0) {
        eligibleProtocols.push(protocol);
      }
    }
  }

  return eligibleProtocols;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // GHL credentials
    const ghlPrivateToken = Deno.env.get('GHL_PRIVATE_TOKEN');
    const ghlLocationId = Deno.env.get('GHL_LOCATION_ID');

    // Parse request
    const request: ReminderRequest = await req.json();
    const { trigger_type, source, user_id: targetUserId } = request;

    console.log('[Reminder] Request:', { trigger_type, source, targetUserId });

    // Get protocols based on trigger type
    let protocols: ProtocolUser[];

    try {
      switch (trigger_type) {
        case 'missed_2_days':
          console.log('[Reminder] Using missed_2_days query logic');
          protocols = await getProtocolsForMissed2Days(supabase, targetUserId);
          break;
        case 'day7_final':
          console.log('[Reminder] Using day7_final query logic');
          protocols = await getProtocolsForDay7Final(supabase, targetUserId);
          break;
        case 'day3_milestone':
          console.log('[Reminder] Using day3_milestone query logic (72-hour celebration)');
          protocols = await getProtocolsForDay3Milestone(supabase, targetUserId);
          break;
        case 'daily_reminder':
        default:
          console.log('[Reminder] Using daily_reminder query logic');
          protocols = await getProtocolsForDailyReminder(supabase, targetUserId);
          break;
      }
    } catch (queryError) {
      console.error('[Reminder] Query error:', queryError);
      throw new Error('Failed to fetch protocols for trigger: ' + trigger_type);
    }

    if (!protocols || protocols.length === 0) {
      console.log('[Reminder] No active protocols found');
      return new Response(
        JSON.stringify({
          success: true,
          users_notified: 0,
          push_sent: 0,
          sms_sent: 0,
          message: 'No active protocols to notify'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[Reminder] Found', protocols.length, 'active protocols');

    // Get unique user IDs and fetch their profiles
    const userIds = [...new Set(protocols.map(p => p.user_id))];
    const { data: userProfiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, full_name, phone, ghl_contact_id')
      .in('id', userIds);

    if (profileError) {
      console.error('[Reminder] Profile query error:', profileError);
    }

    // Create a map of user profiles
    const profileMap = new Map<string, UserProfile>();
    if (userProfiles) {
      for (const profile of userProfiles) {
        profileMap.set(profile.id, profile);
      }
    }

    console.log('[Reminder] Found', profileMap.size, 'user profiles');

    // Track results
    const results: NotificationResult[] = [];
    let pushSent = 0;
    let smsSent = 0;
    const errors: string[] = [];

    // Process each protocol
    for (const protocol of protocols) {
      const dayNumber = protocol.current_day;
      const userId = protocol.user_id;
      const userProfile = profileMap.get(userId);

      // Get day-specific message
      const message = DAY_MESSAGES[dayNumber] || DAY_MESSAGES[1];

      // Add protocol title to body
      const fullBody = `${message.body}\n\nProtocol: ${protocol.title}`;
      const url = `/mind-insurance/protocol/${protocol.id}?day=${dayNumber}`;

      let pushSuccess = false;
      let smsSuccess = false;

      // Try push notification first (free)
      try {
        pushSuccess = await sendPushNotification(
          supabase,
          userId,
          message.title,
          fullBody,
          url
        );

        if (pushSuccess) {
          pushSent++;
          await logNotification(supabase, userId, protocol.id, 'push', trigger_type, true);
        }
      } catch (error) {
        console.error('[Reminder] Push error for user:', userId, error);
      }

      // For Day 1 welcome, Day 3 milestone, or if push failed and user has GHL contact, send SMS
      const shouldSendSms = (
        (trigger_type === 'daily_reminder' && dayNumber === 1) || // Day 1 welcome
        (trigger_type === 'missed_2_days') || // Missed 2 days intervention
        (trigger_type === 'day3_milestone') || // 72-hour milestone celebration
        (!pushSuccess && trigger_type === 'day7_final') // Day 7 final push
      );

      if (shouldSendSms && userProfile?.ghl_contact_id && ghlPrivateToken && ghlLocationId) {
        try {
          // Select the appropriate SMS message based on trigger type
          let smsMessage: string;
          if (trigger_type === 'missed_2_days') {
            smsMessage = `Your protocol is waiting. Pick up where you left off: https://mymindinsurance.com/mind-insurance/coverage`;
          } else if (trigger_type === 'day3_milestone') {
            smsMessage = DAY3_MILESTONE_SMS;
          } else {
            smsMessage = `${message.title}: ${message.body}\n\nStart now: https://mymindinsurance.com/mind-insurance/coverage`;
          }

          smsSuccess = await sendGhlSms(
            userProfile.ghl_contact_id,
            smsMessage,
            ghlLocationId,
            ghlPrivateToken
          );

          if (smsSuccess) {
            smsSent++;
            await logNotification(supabase, userId, protocol.id, 'sms', trigger_type, true);
          } else {
            await logNotification(supabase, userId, protocol.id, 'sms', trigger_type, false, 'SMS send failed');
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown SMS error';
          errors.push(`SMS error for ${userId}: ${errorMsg}`);
          await logNotification(supabase, userId, protocol.id, 'sms', trigger_type, false, errorMsg);
        }
      }

      results.push({
        user_id: userId,
        protocol_id: protocol.id,
        day_number: dayNumber,
        push_sent: pushSuccess,
        sms_sent: smsSuccess
      });
    }

    // Summary
    const usersNotified = results.filter(r => r.push_sent || r.sms_sent).length;
    console.log('[Reminder] Summary:', {
      users_notified: usersNotified,
      push_sent: pushSent,
      sms_sent: smsSent,
      errors: errors.length
    });

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        users_notified: usersNotified,
        push_sent: pushSent,
        sms_sent: smsSent,
        total_protocols: protocols.length,
        errors: errors.length > 0 ? errors : undefined,
        results
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Reminder] Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        users_notified: 0,
        push_sent: 0,
        sms_sent: 0
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
