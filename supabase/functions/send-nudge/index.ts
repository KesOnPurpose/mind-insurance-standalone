/**
 * Send Nudge Edge Function
 *
 * Sends SMS nudges to users via GoHighLevel API.
 * Called by stuck-detection-cron and other automation workflows.
 *
 * Features:
 * - GoHighLevel SMS integration
 * - Phone number lookup fallback
 * - Delivery status tracking
 * - Rate limiting awareness
 *
 * @module send-nudge
 * @author FEAT-GH-007
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

// GHL credentials
const ghlPrivateToken = Deno.env.get('GHL_PRIVATE_TOKEN');
const ghlLocationId = Deno.env.get('GHL_LOCATION_ID');

// ============================================================================
// TYPES
// ============================================================================

interface NudgeRequest {
  user_id: string;
  phone?: string;
  ghl_contact_id?: string;
  message: string;
  event_id?: string;
  nudge_type: string;
}

interface NudgeResponse {
  success: boolean;
  user_id: string;
  channel: 'sms' | 'none';
  message_id?: string;
  error?: string;
}

// ============================================================================
// GHL SMS SERVICE
// ============================================================================

/**
 * Send SMS via GoHighLevel API
 */
async function sendGhlSms(
  contactId: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!ghlPrivateToken || !ghlLocationId) {
    return { success: false, error: 'GHL credentials not configured' };
  }

  try {
    const response = await fetch('https://services.leadconnectorhq.com/conversations/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ghlPrivateToken}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      body: JSON.stringify({
        type: 'SMS',
        contactId,
        locationId: ghlLocationId,
        message
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[GHL SMS] Error:', response.status, errorText);
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    const data = await response.json();
    console.log('[GHL SMS] Sent successfully to contact:', contactId);
    return { success: true, messageId: data.conversationId || data.messageId };

  } catch (error) {
    console.error('[GHL SMS] Exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Look up or create a GHL contact for a user
 */
async function getOrCreateGhlContact(
  userId: string,
  phone: string
): Promise<string | null> {
  // First check if user has ghl_contact_id
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('ghl_contact_id, email, full_name')
    .eq('id', userId)
    .single();

  if (profile?.ghl_contact_id) {
    return profile.ghl_contact_id;
  }

  // Try to find contact by phone in GHL
  if (!ghlPrivateToken || !ghlLocationId) {
    return null;
  }

  try {
    // Search for contact by phone
    const searchResponse = await fetch(
      `https://services.leadconnectorhq.com/contacts/search?locationId=${ghlLocationId}&phone=${encodeURIComponent(phone)}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${ghlPrivateToken}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        }
      }
    );

    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      if (searchData.contacts && searchData.contacts.length > 0) {
        const contactId = searchData.contacts[0].id;
        // Update user profile with the found contact ID
        await supabase
          .from('user_profiles')
          .update({ ghl_contact_id: contactId })
          .eq('id', userId);
        return contactId;
      }
    }

    // Contact not found - create new one
    const createResponse = await fetch('https://services.leadconnectorhq.com/contacts/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ghlPrivateToken}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      body: JSON.stringify({
        locationId: ghlLocationId,
        phone,
        name: profile?.full_name || 'Grouphome User',
        email: profile?.email,
        tags: ['grouphome', 'stuck-detection']
      })
    });

    if (createResponse.ok) {
      const createData = await createResponse.json();
      const newContactId = createData.contact?.id;
      if (newContactId) {
        // Save contact ID to user profile
        await supabase
          .from('user_profiles')
          .update({ ghl_contact_id: newContactId })
          .eq('id', userId);
        return newContactId;
      }
    }

    return null;

  } catch (error) {
    console.error('[GHL] Error getting/creating contact:', error);
    return null;
  }
}

/**
 * Format phone number for GHL (US format)
 */
function formatPhoneForGhl(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');

  // If 10 digits, add US country code
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  // If 11 digits starting with 1, add +
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }

  // If already has +, return as-is
  if (phone.startsWith('+')) {
    return phone;
  }

  // Default: add + prefix
  return `+${digits}`;
}

// ============================================================================
// HANDLER
// ============================================================================

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json() as NudgeRequest;
    const { user_id, phone, ghl_contact_id, message, event_id, nudge_type } = body;

    console.log(`[SendNudge] Processing for user ${user_id}, type: ${nudge_type}`);

    // Validate required fields
    if (!user_id || !message) {
      return new Response(
        JSON.stringify({
          success: false,
          user_id: user_id || 'unknown',
          channel: 'none',
          error: 'Missing required fields: user_id, message'
        } as NudgeResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get contact ID for SMS
    let contactId = ghl_contact_id;

    if (!contactId && phone) {
      // Try to get or create contact from phone
      const formattedPhone = formatPhoneForGhl(phone);
      contactId = await getOrCreateGhlContact(user_id, formattedPhone);
    }

    if (!contactId) {
      // No way to send SMS - lookup user profile for phone
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('phone, ghl_contact_id')
        .eq('id', user_id)
        .single();

      if (profile?.ghl_contact_id) {
        contactId = profile.ghl_contact_id;
      } else if (profile?.phone) {
        const formattedPhone = formatPhoneForGhl(profile.phone);
        contactId = await getOrCreateGhlContact(user_id, formattedPhone);
      }
    }

    if (!contactId) {
      console.log(`[SendNudge] No contact ID available for user ${user_id}`);
      return new Response(
        JSON.stringify({
          success: false,
          user_id,
          channel: 'none',
          error: 'No GHL contact ID or phone number available'
        } as NudgeResponse),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send SMS
    const smsResult = await sendGhlSms(contactId, message);

    // Log the result
    if (event_id && smsResult.success) {
      await supabase
        .from('gh_automation_events')
        .update({
          delivery_status: 'sent',
          action_taken: `SMS sent via GHL. Message ID: ${smsResult.messageId || 'N/A'}`
        })
        .eq('id', event_id);
    } else if (event_id && !smsResult.success) {
      await supabase
        .from('gh_automation_events')
        .update({
          delivery_status: 'failed',
          action_taken: `SMS failed: ${smsResult.error}`
        })
        .eq('id', event_id);
    }

    const response: NudgeResponse = {
      success: smsResult.success,
      user_id,
      channel: smsResult.success ? 'sms' : 'none',
      message_id: smsResult.messageId,
      error: smsResult.error
    };

    console.log(`[SendNudge] Result for ${user_id}:`, response);

    return new Response(
      JSON.stringify(response),
      {
        status: smsResult.success ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('[SendNudge] Fatal error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        user_id: 'unknown',
        channel: 'none',
        error: error instanceof Error ? error.message : 'Unknown error'
      } as NudgeResponse),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
