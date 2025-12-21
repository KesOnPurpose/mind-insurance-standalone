// ============================================================================
// UPDATE GHL TAGS - Manage GoHighLevel Contact Tags
// ============================================================================
// Adds or removes tags from GHL contacts to track user lifecycle stages,
// engagement levels, and enable targeted workflows.
//
// Tag Strategy:
// - mio-onboarding-started: User signed up, hasn't completed assessment
// - mio-onboarding-complete: Completed assessment and avatar reveal
// - mio-protocol-active: Has active protocol (Day 1 started)
// - mio-protocol-complete: Completed at least one 7-day protocol
// - mio-sms-opted-in: Phone captured with SMS consent
// - mio-push-enabled: Push notifications subscribed
// - mio-high-risk-dropout: Missed 2+ consecutive days
// - mio-day3-celebration: Completed Day 3 milestone
// - mio-7day-champion: Completed full 7-day protocol
// - mio-pattern-past-prison: Past Prison pattern identified
// - mio-pattern-success-sabotage: Success Sabotage pattern identified
// - mio-pattern-compass-crisis: Compass Crisis pattern identified
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

// Valid MIO lifecycle tags
const VALID_TAGS = [
  // Lifecycle
  'mind-insurance',
  'app-signup',
  'mio-onboarding-started',
  'mio-onboarding-complete',
  'mio-protocol-active',
  'mio-protocol-complete',
  'mio-sms-opted-in',
  'mio-push-enabled',
  // Engagement
  'mio-high-risk-dropout',
  'mio-day3-celebration',
  'mio-7day-champion',
  // Patterns
  'mio-pattern-past-prison',
  'mio-pattern-success-sabotage',
  'mio-pattern-compass-crisis',
] as const;

type ValidTag = typeof VALID_TAGS[number];

interface TagUpdateRequest {
  user_id: string;
  add_tags?: string[];
  remove_tags?: string[];
}

interface TagUpdateResponse {
  success: boolean;
  contact_id?: string;
  current_tags?: string[];
  error?: string;
}

// ============================================================================
// GHL API - Add Tags to Contact
// ============================================================================

async function addTagsToContact(
  contactId: string,
  tags: string[],
  locationId: string,
  privateToken: string
): Promise<boolean> {
  try {
    console.log('[GHL Tags] Adding tags to contact:', contactId, tags);

    // Use PUT /contacts/:contactId to update tags
    const response = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${privateToken}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      body: JSON.stringify({
        locationId,
        tags
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[GHL Tags] Error adding tags:', response.status, errorText);
      return false;
    }

    console.log('[GHL Tags] Tags added successfully');
    return true;
  } catch (error) {
    console.error('[GHL Tags] Exception:', error);
    return false;
  }
}

// ============================================================================
// GHL API - Get Contact
// ============================================================================

async function getContact(
  contactId: string,
  privateToken: string
): Promise<{ tags: string[] } | null> {
  try {
    const response = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${privateToken}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[GHL Tags] Error getting contact:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    return { tags: data.contact?.tags || [] };
  } catch (error) {
    console.error('[GHL Tags] Exception:', error);
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
      console.error('[Tags] Missing GHL credentials');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'GHL integration not configured'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request
    const request: TagUpdateRequest = await req.json();
    const { user_id, add_tags = [], remove_tags = [] } = request;

    console.log('[Tags] Request:', { user_id, add_tags, remove_tags });

    if (!user_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required field: user_id'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate tags
    const invalidAddTags = add_tags.filter(t => !VALID_TAGS.includes(t as ValidTag));
    const invalidRemoveTags = remove_tags.filter(t => !VALID_TAGS.includes(t as ValidTag));

    if (invalidAddTags.length > 0 || invalidRemoveTags.length > 0) {
      console.warn('[Tags] Invalid tags:', { invalidAddTags, invalidRemoveTags });
      // Continue anyway, just log the warning
    }

    // Get user's GHL contact ID
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('ghl_contact_id')
      .eq('id', user_id)
      .single();

    if (profileError || !profile?.ghl_contact_id) {
      console.log('[Tags] User has no GHL contact:', user_id);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'User has no linked GHL contact. Cannot update tags.'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const contactId = profile.ghl_contact_id;

    // Get current tags
    const contact = await getContact(contactId, ghlPrivateToken);
    if (!contact) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to fetch contact from GHL'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate new tag set
    const currentTags = new Set(contact.tags);

    // Add new tags
    add_tags.forEach(tag => currentTags.add(tag));

    // Remove specified tags
    remove_tags.forEach(tag => currentTags.delete(tag));

    const newTags = Array.from(currentTags);

    console.log('[Tags] Tag update:', {
      previous: contact.tags,
      adding: add_tags,
      removing: remove_tags,
      result: newTags
    });

    // Update contact with new tags
    const success = await addTagsToContact(contactId, newTags, ghlLocationId, ghlPrivateToken);

    if (!success) {
      return new Response(
        JSON.stringify({
          success: false,
          contact_id: contactId,
          error: 'Failed to update tags in GHL'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        contact_id: contactId,
        current_tags: newTags
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Tags] Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
