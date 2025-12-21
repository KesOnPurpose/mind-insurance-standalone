// ============================================================================
// SEND PROTOCOL REMINDER - Daily MIO Protocol Notifications
// ============================================================================
// Triggered by N8n at 7:30 AM UTC daily. Sends push notifications (free) to
// users with active protocols. Falls back to GHL SMS for high-priority cases.
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
  trigger_type: 'daily_reminder' | 'missed_2_days' | 'day7_final';
  source?: string;
  user_id?: string; // Optional: target specific user
}

interface ProtocolUser {
  id: string;
  user_id: string;
  current_day: number;
  title: string;
  created_at: string;
  user_profile: {
    id: string;
    full_name: string | null;
    phone: string | null;
    ghl_contact_id: string | null;
  };
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

    // Query users with active protocols that need reminders today
    let query = supabase
      .from('mio_weekly_protocols')
      .select(`
        id,
        user_id,
        current_day,
        title,
        created_at,
        user_profile:user_profiles!inner (
          id,
          full_name,
          phone,
          ghl_contact_id
        )
      `)
      .eq('status', 'active')
      .lte('current_day', 7);

    // If targeting a specific user
    if (targetUserId) {
      query = query.eq('user_id', targetUserId);
    }

    const { data: protocols, error: queryError } = await query;

    if (queryError) {
      console.error('[Reminder] Query error:', queryError);
      throw new Error('Failed to fetch active protocols');
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

    // Track results
    const results: NotificationResult[] = [];
    let pushSent = 0;
    let smsSent = 0;
    const errors: string[] = [];

    // Process each protocol
    for (const protocol of protocols as unknown as ProtocolUser[]) {
      const dayNumber = protocol.current_day;
      const userId = protocol.user_id;

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

      // For Day 1 welcome OR if push failed and user has GHL contact, send SMS
      const shouldSendSms = (
        (trigger_type === 'daily_reminder' && dayNumber === 1) || // Day 1 welcome
        (trigger_type === 'missed_2_days') || // Missed 2 days intervention
        (!pushSuccess && trigger_type === 'day7_final') // Day 7 final push
      );

      if (shouldSendSms && protocol.user_profile?.ghl_contact_id && ghlPrivateToken && ghlLocationId) {
        try {
          const smsMessage = trigger_type === 'missed_2_days'
            ? `Your protocol is waiting. Pick up where you left off: https://mymindinsurance.com/protocol`
            : `${message.title}: ${message.body}\n\nStart now: https://mymindinsurance.com/protocol`;

          smsSuccess = await sendGhlSms(
            protocol.user_profile.ghl_contact_id,
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
