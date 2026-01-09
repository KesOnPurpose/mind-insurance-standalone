// ============================================================================
// SYNC GHL CONTACT - Match User to GoHighLevel Contact
// ============================================================================
// Queries GoHighLevel by email to find existing contacts and populates
// ghl_contact_id in user_profiles for SMS notification capability.
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

interface SyncRequest {
  user_id: string;
  email: string;
  phone?: string;
  full_name?: string;
  create_if_not_found?: boolean; // If true, create GHL contact if not found
  send_welcome_sms?: boolean; // If true, send welcome SMS after linking
}

interface GhlContact {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  name: string;
}

interface GhlSearchResponse {
  contacts: GhlContact[];
  meta: {
    total: number;
    count: number;
  };
}

interface SyncResponse {
  success: boolean;
  ghl_contact_id: string | null;
  source: 'existing' | 'matched' | 'created' | 'not_found';
  message?: string;
  welcome_sms_sent?: boolean;
}

// ============================================================================
// GHL API - Search Contacts
// ============================================================================

async function searchGhlContacts(
  email: string,
  locationId: string,
  privateToken: string
): Promise<GhlContact | null> {
  try {
    // Use POST /contacts/search with email filter (v2 API)
    console.log('[GHL Search] Searching for:', email, 'at location:', locationId);

    const response = await fetch('https://services.leadconnectorhq.com/contacts/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${privateToken}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      body: JSON.stringify({
        locationId,
        pageLimit: 1,
        filters: [
          {
            field: 'email',
            operator: 'eq',
            value: email
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[GHL Search] Error:', response.status, errorText);

      if (response.status === 403) {
        console.error('[GHL Search] Token may lack contacts.readonly scope or location access');
      }

      return null;
    }

    const data = await response.json();
    console.log('[GHL Search] Response:', JSON.stringify(data).slice(0, 300));

    // Response format: { contacts: [...], total: N }
    if (data.contacts && data.contacts.length > 0) {
      const contact = data.contacts[0];
      console.log('[GHL Search] Found contact:', contact.id, contact.email);
      return contact;
    }

    console.log('[GHL Search] No contact found for:', email);
    return null;
  } catch (error) {
    console.error('[GHL Search] Exception:', error);
    return null;
  }
}

// ============================================================================
// GHL API - Create Contact
// ============================================================================

async function createGhlContact(
  email: string,
  phone: string | undefined,
  fullName: string | undefined,
  locationId: string,
  privateToken: string
): Promise<GhlContact | null> {
  try {
    // Parse name
    const nameParts = fullName?.split(' ') || [];
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const requestBody = {
      locationId,
      email,
      phone: phone || undefined,
      firstName,
      lastName,
      source: 'Mind Insurance App',
      tags: [
        'mind-insurance',
        'app-signup',
        'mio-onboarding-started',
        phone ? 'mio-sms-opted-in' : undefined
      ].filter(Boolean)
    };

    console.log('[GHL Create] Creating contact with:', JSON.stringify(requestBody));

    const response = await fetch('https://services.leadconnectorhq.com/contacts/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${privateToken}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      body: JSON.stringify(requestBody)
    });

    const responseText = await response.text();
    console.log('[GHL Create] Response status:', response.status, 'Body:', responseText.slice(0, 500));

    if (!response.ok) {
      console.error('[GHL Create] Error:', response.status, responseText);
      return null;
    }

    const data = JSON.parse(responseText);
    console.log('[GHL Create] Created contact:', data.contact?.id);
    return data.contact;
  } catch (error) {
    console.error('[GHL Create] Exception:', error);
    return null;
  }
}

// ============================================================================
// GHL API - Send SMS
// ============================================================================

async function sendWelcomeSms(
  contactId: string,
  firstName: string | undefined,
  locationId: string,
  privateToken: string
): Promise<boolean> {
  try {
    const name = firstName || 'there';
    const message = `Hey ${name}! 🧠 MIO here from Mind Insurance. Your SMS notifications are now active. You'll receive protocol reminders to help you stay on track with your transformation. Reply STOP anytime to opt out.`;

    console.log('[GHL SMS] Sending welcome SMS to contact:', contactId);

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
        message
      })
    });

    const responseText = await response.text();
    console.log('[GHL SMS] Response status:', response.status, 'Body:', responseText.slice(0, 300));

    if (!response.ok) {
      console.error('[GHL SMS] Error sending welcome SMS:', response.status, responseText);
      return false;
    }

    console.log('[GHL SMS] Welcome SMS sent successfully to contact:', contactId);
    return true;
  } catch (error) {
    console.error('[GHL SMS] Exception:', error);
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

    if (!ghlPrivateToken || !ghlLocationId) {
      console.error('[Sync] Missing GHL credentials');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'GHL integration not configured'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request
    const request: SyncRequest = await req.json();
    const { user_id, email, phone, full_name, create_if_not_found, send_welcome_sms } = request;

    console.log('[Sync] Request:', { user_id, email, create_if_not_found, send_welcome_sms });

    if (!user_id || !email) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: user_id, email'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user already has ghl_contact_id
    const { data: existingProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('ghl_contact_id')
      .eq('id', user_id)
      .single();

    if (profileError) {
      console.error('[Sync] Profile query error:', profileError);
    }

    if (existingProfile?.ghl_contact_id) {
      console.log('[Sync] User already has ghl_contact_id:', existingProfile.ghl_contact_id);
      return new Response(
        JSON.stringify({
          success: true,
          ghl_contact_id: existingProfile.ghl_contact_id,
          source: 'existing',
          message: 'User already has GHL contact linked'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Search for existing GHL contact
    let ghlContact = await searchGhlContacts(email, ghlLocationId, ghlPrivateToken);

    // If not found and create_if_not_found is true, create new contact
    console.log('[Sync] Contact search result:', ghlContact ? 'found' : 'not found');
    console.log('[Sync] create_if_not_found:', create_if_not_found, 'phone:', phone ? 'provided' : 'not provided');

    if (!ghlContact && create_if_not_found && phone) {
      console.log('[Sync] Creating new GHL contact for:', email, 'with phone:', phone);
      ghlContact = await createGhlContact(email, phone, full_name, ghlLocationId, ghlPrivateToken);
      console.log('[Sync] Create result:', ghlContact ? 'success' : 'failed');
    }

    if (!ghlContact) {
      console.log('[Sync] Returning not_found response');
      return new Response(
        JSON.stringify({
          success: false,
          ghl_contact_id: null,
          source: 'not_found',
          message: 'No GHL contact found for this email. User can opt-in for SMS in settings.'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update user_profiles with ghl_contact_id
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        ghl_contact_id: ghlContact.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', user_id);

    if (updateError) {
      console.error('[Sync] Update error:', updateError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to update user profile',
          ghl_contact_id: ghlContact.id
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[Sync] Successfully linked user', user_id, 'to GHL contact', ghlContact.id);

    // Send welcome SMS if requested and contact has a phone number
    let welcomeSmsSent = false;
    if (send_welcome_sms && ghlContact.phone) {
      console.log('[Sync] Sending welcome SMS to:', ghlContact.phone);
      welcomeSmsSent = await sendWelcomeSms(
        ghlContact.id,
        ghlContact.firstName || full_name?.split(' ')[0],
        ghlLocationId,
        ghlPrivateToken
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        ghl_contact_id: ghlContact.id,
        source: create_if_not_found ? 'created' : 'matched',
        welcome_sms_sent: welcomeSmsSent,
        ghl_contact: {
          id: ghlContact.id,
          email: ghlContact.email,
          phone: ghlContact.phone,
          name: ghlContact.name || `${ghlContact.firstName} ${ghlContact.lastName}`.trim()
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Sync] Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
