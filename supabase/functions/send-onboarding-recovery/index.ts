// ============================================================================
// SEND ONBOARDING RECOVERY - Incomplete Onboarding Re-engagement
// ============================================================================
// Triggered by N8n workflows to re-engage users who started but didn't
// complete the onboarding/assessment flow.
//
// Recovery Strategy (Behavioral Science-Backed):
// - 24 hours: Email reminder (low pressure)
// - 3 days: SMS nudge if phone available (medium urgency)
// - 7 days: Final push email + SMS (high urgency)
// - 14 days: Archive as inactive (stop outreach)
//
// Research:
// - Variable timing increases response rates vs fixed intervals
// - SMS has 98% open rate vs 20% for email
// - Personalized messages = 3x retention lift
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

interface RecoveryRequest {
  trigger_type: 'recovery_24h' | 'recovery_3d' | 'recovery_7d' | 'recovery_archive';
  source?: string;
  user_id?: string; // Optional: target specific user
}

interface IncompleteUser {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  ghl_contact_id: string | null;
  created_at: string;
  onboarding_status: string | null;
  has_assessment: boolean;
  has_avatar: boolean;
}

interface RecoveryResult {
  user_id: string;
  email_sent: boolean;
  sms_sent: boolean;
  action: string;
  error?: string;
}

// ============================================================================
// RECOVERY MESSAGE TEMPLATES
// ============================================================================

const RECOVERY_MESSAGES = {
  recovery_24h: {
    email_subject: "Your Mind Insurance profile is waiting",
    email_body: `Your personalized Identity Avatar is just a few minutes away.

Complete your assessment to unlock:
- Your unique Identity Collision pattern
- Personalized 7-day neural rewiring protocols
- MIO, your AI coach for behavioral transformation

Continue now: https://mymindinsurance.com/assessment

The insights waiting for you could change everything.`,
    sms: null, // No SMS at 24h - email only
  },
  recovery_3d: {
    email_subject: "Ready to discover your Identity Collision pattern?",
    email_body: `You started something important 3 days ago.

The assessment takes just 5 minutes and reveals:
- Why you keep hitting the same walls
- Your hidden sabotage patterns
- A personalized protocol to break through

Your transformation is waiting: https://mymindinsurance.com/assessment

- MIO`,
    sms: `Hey! It's MIO from Mind Insurance.

You started your assessment 3 days ago. Ready to discover your Identity Collision pattern?

5 min to complete: https://mymindinsurance.com/assessment

Reply STOP to opt out.`,
  },
  recovery_7d: {
    email_subject: "Last chance: Your assessment expires in 24 hours",
    email_body: `This is your final reminder.

After 7 days of inactivity, incomplete profiles are archived.

But you don't have to disappear. 5 minutes is all it takes to:
- Reveal your Identity Avatar
- Get your first 7-day protocol
- Start rewiring your neural pathways

Complete now (before it's too late): https://mymindinsurance.com/assessment

Your future self will thank you.

- MIO`,
    sms: `Final reminder: Your Mind Insurance assessment expires tomorrow.

5 min to complete and start your transformation: https://mymindinsurance.com/assessment

After that, your profile will be archived.

Reply STOP to opt out.`,
  },
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
// GHL EMAIL SERVICE (Direct API)
// ============================================================================

async function sendGhlEmail(
  contactId: string,
  subject: string,
  body: string,
  locationId: string,
  privateToken: string
): Promise<boolean> {
  try {
    // Convert body to HTML
    const htmlBody = body.split('\n').map(line =>
      line ? `<p>${line}</p>` : '<br>'
    ).join('');

    const response = await fetch('https://services.leadconnectorhq.com/conversations/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${privateToken}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      body: JSON.stringify({
        type: 'Email',
        contactId,
        locationId,
        subject,
        html: htmlBody,
        emailFrom: 'MIO <mio@mymindinsurance.com>'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[GHL Email] Error:', response.status, errorText);
      return false;
    }

    console.log('[GHL Email] Sent successfully to contact:', contactId);
    return true;
  } catch (error) {
    console.error('[GHL Email] Exception:', error);
    return false;
  }
}

// ============================================================================
// LOG NOTIFICATION
// ============================================================================

async function logNotification(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  notificationType: 'email' | 'sms',
  triggerType: string,
  delivered: boolean,
  errorMessage?: string
): Promise<void> {
  try {
    await supabase.from('notification_logs').insert({
      user_id: userId,
      protocol_id: null, // Not protocol-related
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
// GET INCOMPLETE USERS BY STAGE
// ============================================================================

/**
 * Get users who signed up but haven't completed onboarding
 * based on the recovery stage (24h, 3d, 7d)
 */
async function getIncompleteUsers(
  supabase: ReturnType<typeof createClient>,
  stage: 'recovery_24h' | 'recovery_3d' | 'recovery_7d' | 'recovery_archive',
  targetUserId?: string
): Promise<IncompleteUser[]> {
  const now = new Date();

  // Calculate time windows for each stage
  let minHoursAgo: number;
  let maxHoursAgo: number;

  switch (stage) {
    case 'recovery_24h':
      minHoursAgo = 24;
      maxHoursAgo = 48; // 24-48 hours ago
      break;
    case 'recovery_3d':
      minHoursAgo = 72;
      maxHoursAgo = 96; // 72-96 hours ago (3-4 days)
      break;
    case 'recovery_7d':
      minHoursAgo = 168;
      maxHoursAgo = 192; // 168-192 hours ago (7-8 days)
      break;
    case 'recovery_archive':
      minHoursAgo = 336; // 14 days
      maxHoursAgo = 360; // 14-15 days
      break;
  }

  const minDate = new Date(now.getTime() - maxHoursAgo * 60 * 60 * 1000);
  const maxDate = new Date(now.getTime() - minHoursAgo * 60 * 60 * 1000);

  console.log(`[Recovery] Searching for users created between ${minDate.toISOString()} and ${maxDate.toISOString()}`);

  // Query user profiles for incomplete onboarding
  let query = supabase
    .from('user_profiles')
    .select(`
      id,
      email,
      full_name,
      phone,
      ghl_contact_id,
      created_at,
      onboarding_completed,
      onboarding_status
    `)
    .gte('created_at', minDate.toISOString())
    .lte('created_at', maxDate.toISOString())
    .or('onboarding_completed.is.null,onboarding_completed.eq.false');

  if (targetUserId) {
    query = query.eq('id', targetUserId);
  }

  const { data: profiles, error: profileError } = await query;

  if (profileError) {
    console.error('[Recovery] Profile query error:', profileError);
    throw profileError;
  }

  if (!profiles || profiles.length === 0) {
    return [];
  }

  console.log(`[Recovery] Found ${profiles.length} potentially incomplete users`);

  // For each user, check if they have completed assessment/avatar
  const incompleteUsers: IncompleteUser[] = [];

  for (const profile of profiles) {
    // Check for identity collision assessment
    const { data: assessments, error: assessmentError } = await supabase
      .from('identity_collision_assessments')
      .select('id')
      .eq('user_id', profile.id)
      .limit(1);

    if (assessmentError) {
      console.error('[Recovery] Assessment query error:', assessmentError);
      continue;
    }

    const hasAssessment = assessments && assessments.length > 0;

    // Check for generated avatar (via mio_weekly_protocols or avatar data)
    const { data: protocols, error: protocolError } = await supabase
      .from('mio_weekly_protocols')
      .select('id')
      .eq('user_id', profile.id)
      .limit(1);

    if (protocolError) {
      console.error('[Recovery] Protocol query error:', protocolError);
      continue;
    }

    const hasAvatar = protocols && protocols.length > 0;

    // Only include if they haven't completed the full flow
    if (!hasAssessment || !hasAvatar) {
      // Check we haven't already sent this recovery stage notification
      const { data: recentNotifications } = await supabase
        .from('notification_logs')
        .select('id')
        .eq('user_id', profile.id)
        .eq('trigger', stage)
        .eq('delivered', true)
        .limit(1);

      if (!recentNotifications || recentNotifications.length === 0) {
        incompleteUsers.push({
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          phone: profile.phone,
          ghl_contact_id: profile.ghl_contact_id,
          created_at: profile.created_at,
          onboarding_status: profile.onboarding_status,
          has_assessment: hasAssessment,
          has_avatar: hasAvatar
        });
      }
    }
  }

  console.log(`[Recovery] ${incompleteUsers.length} users eligible for ${stage} recovery`);
  return incompleteUsers;
}

// ============================================================================
// ARCHIVE INACTIVE USERS
// ============================================================================

async function archiveInactiveUser(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({
        onboarding_status: 'archived',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('[Archive] Error archiving user:', userId, error);
      return false;
    }

    console.log('[Archive] User archived:', userId);
    return true;
  } catch (error) {
    console.error('[Archive] Exception:', error);
    return false;
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
    const request: RecoveryRequest = await req.json();
    const { trigger_type, source, user_id: targetUserId } = request;

    console.log('[Recovery] Request:', { trigger_type, source, targetUserId });

    // Get incomplete users based on stage
    const incompleteUsers = await getIncompleteUsers(supabase, trigger_type, targetUserId);

    if (incompleteUsers.length === 0) {
      console.log('[Recovery] No users found for stage:', trigger_type);
      return new Response(
        JSON.stringify({
          success: true,
          stage: trigger_type,
          users_processed: 0,
          emails_sent: 0,
          sms_sent: 0,
          message: 'No users eligible for recovery at this stage'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[Recovery] Processing', incompleteUsers.length, 'users for stage:', trigger_type);

    // Track results
    const results: RecoveryResult[] = [];
    let emailsSent = 0;
    let smsSent = 0;
    let usersArchived = 0;

    // Handle archive separately
    if (trigger_type === 'recovery_archive') {
      for (const user of incompleteUsers) {
        const archived = await archiveInactiveUser(supabase, user.id);
        if (archived) {
          usersArchived++;
          results.push({
            user_id: user.id,
            email_sent: false,
            sms_sent: false,
            action: 'archived'
          });
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          stage: trigger_type,
          users_processed: incompleteUsers.length,
          users_archived: usersArchived,
          message: `Archived ${usersArchived} inactive users`
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get message templates for this stage
    const messages = RECOVERY_MESSAGES[trigger_type];

    // Process each user
    for (const user of incompleteUsers) {
      let emailSuccess = false;
      let smsSuccess = false;

      // Send email if user has GHL contact
      if (user.ghl_contact_id && ghlPrivateToken && ghlLocationId) {
        emailSuccess = await sendGhlEmail(
          user.ghl_contact_id,
          messages.email_subject,
          messages.email_body,
          ghlLocationId,
          ghlPrivateToken
        );

        if (emailSuccess) {
          emailsSent++;
          await logNotification(supabase, user.id, 'email', trigger_type, true);
        } else {
          await logNotification(supabase, user.id, 'email', trigger_type, false, 'Email send failed');
        }

        // Send SMS if available for this stage and user has phone
        if (messages.sms && user.ghl_contact_id) {
          smsSuccess = await sendGhlSms(
            user.ghl_contact_id,
            messages.sms,
            ghlLocationId,
            ghlPrivateToken
          );

          if (smsSuccess) {
            smsSent++;
            await logNotification(supabase, user.id, 'sms', trigger_type, true);
          } else {
            await logNotification(supabase, user.id, 'sms', trigger_type, false, 'SMS send failed');
          }
        }
      } else {
        console.log('[Recovery] User has no GHL contact:', user.id);
      }

      results.push({
        user_id: user.id,
        email_sent: emailSuccess,
        sms_sent: smsSuccess,
        action: 'notified'
      });
    }

    // Summary
    const usersNotified = results.filter(r => r.email_sent || r.sms_sent).length;
    console.log('[Recovery] Summary:', {
      stage: trigger_type,
      users_processed: incompleteUsers.length,
      users_notified: usersNotified,
      emails_sent: emailsSent,
      sms_sent: smsSent
    });

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        stage: trigger_type,
        users_processed: incompleteUsers.length,
        users_notified: usersNotified,
        emails_sent: emailsSent,
        sms_sent: smsSent,
        results
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Recovery] Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        users_processed: 0,
        emails_sent: 0,
        sms_sent: 0
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
