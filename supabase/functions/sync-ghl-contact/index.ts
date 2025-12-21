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

// ============================================================================
// GHL API - Search Contacts
// ============================================================================

async function searchGhlContacts(
  email: string,
  locationId: string,
  privateToken: string
): Promise<GhlContact | null> {
  try {
    // Search by email
    const url = new URL('https://services.leadconnectorhq.com/contacts/search');
    url.searchParams.set('locationId', locationId);
    url.searchParams.set('query', email);
    url.searchParams.set('limit', '1');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${privateToken}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[GHL Search] Error:', response.status, errorText);
      return null;
    }

    const data: GhlSearchResponse = await response.json();

    if (data.contacts && data.contacts.length > 0) {
      // Find exact email match (search may return partial matches)
      const exactMatch = data.contacts.find(
        c => c.email?.toLowerCase() === email.toLowerCase()
      );

      if (exactMatch) {
        console.log('[GHL Search] Found exact match:', exactMatch.id, exactMatch.email);
        return exactMatch;
      }
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

    const response = await fetch('https://services.leadconnectorhq.com/contacts/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${privateToken}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      body: JSON.stringify({
        locationId,
        email,
        phone: phone || undefined,
        firstName,
        lastName,
        source: 'Mind Insurance App',
        tags: ['mind-insurance', 'app-signup']
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[GHL Create] Error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    console.log('[GHL Create] Created contact:', data.contact?.id);
    return data.contact;
  } catch (error) {
    console.error('[GHL Create] Exception:', error);
    return null;
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
    const { user_id, email, phone, full_name, create_if_not_found } = request;

    console.log('[Sync] Request:', { user_id, email, create_if_not_found });

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
    if (!ghlContact && create_if_not_found && phone) {
      console.log('[Sync] Creating new GHL contact for:', email);
      ghlContact = await createGhlContact(email, phone, full_name, ghlLocationId, ghlPrivateToken);
    }

    if (!ghlContact) {
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

    return new Response(
      JSON.stringify({
        success: true,
        ghl_contact_id: ghlContact.id,
        source: create_if_not_found && !ghlContact ? 'created' : 'matched',
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
