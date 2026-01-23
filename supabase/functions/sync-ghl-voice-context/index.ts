// ============================================================================
// SYNC GHL VOICE CONTEXT - Update Contact Custom Fields for Voice AI
// ============================================================================
// Updates GoHighLevel contact custom fields with user context data so that
// the Voice AI agent can access personalized information about the caller.
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// TYPES
// ============================================================================

interface VoiceContext {
  greeting_name: string;
  first_name: string;
  tier_level: string;
  journey_day: number;
  journey_week: number;
  journey_phase: string;
  tactics_completed: number;
  total_tactics: number;
  completion_rate: number;
  readiness_level: string;
  assessment_score: number;
  target_state: string | null;
  target_demographics: string;
  ownership_model: string;
  immediate_priority: string;
  capital_available: string;
  licensing_familiarity: string;
  caregiving_experience: string;
  timeline: string;
  context_for_agent: string;
  synced_at: string;
}

interface SyncRequest {
  contact_id: string;
  context: VoiceContext;
}

// ============================================================================
// GHL CUSTOM FIELD MAPPING
// Maps context fields to GHL custom field keys
// ============================================================================

// Maps context fields to GHL custom field keys (with voice_ prefix)
// These match the custom fields created in GHL location 3KJeKktlnhQab7T0zrpM
const GHL_CUSTOM_FIELD_MAP: Record<keyof Omit<VoiceContext, 'synced_at'>, string> = {
  greeting_name: 'voice_greeting_name',
  first_name: 'voice_first_name',
  tier_level: 'voice_tier_level',
  journey_day: 'voice_journey_day',
  journey_week: 'voice_journey_week',
  journey_phase: 'voice_journey_phase',
  tactics_completed: 'voice_tactics_completed',
  total_tactics: 'voice_total_tactics',
  completion_rate: 'voice_completion_rate',
  readiness_level: 'voice_readiness_level',
  assessment_score: 'voice_assessment_score',
  target_state: 'voice_target_state',
  target_demographics: 'voice_target_demographics',
  ownership_model: 'voice_ownership_model',
  immediate_priority: 'voice_immediate_priority',
  capital_available: 'voice_capital_available',
  licensing_familiarity: 'voice_licensing_familiarity',
  caregiving_experience: 'voice_caregiving_experience',
  timeline: 'voice_timeline',
  context_for_agent: 'voice_user_context',
};

// ============================================================================
// GHL API - Update Contact Custom Fields
// ============================================================================

async function updateContactCustomFields(
  contactId: string,
  context: VoiceContext,
  locationId: string,
  privateToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Build custom fields array for GHL API
    // GHL expects customFields as key-value pairs or custom field IDs
    const customFieldUpdates: { key: string; value: string | number }[] = [];

    for (const [contextKey, ghlKey] of Object.entries(GHL_CUSTOM_FIELD_MAP)) {
      const value = context[contextKey as keyof VoiceContext];
      if (value !== null && value !== undefined) {
        customFieldUpdates.push({
          key: ghlKey,
          value: String(value)
        });
      }
    }

    // Add synced_at timestamp (matches voice_context_synced_at custom field)
    customFieldUpdates.push({
      key: 'voice_context_synced_at',
      value: context.synced_at
    });

    console.log('[GHL Update] Updating contact:', contactId, 'with', customFieldUpdates.length, 'custom fields');
    console.log('[GHL Update] Sample fields:', {
      greeting_name: context.greeting_name,
      journey_day: context.journey_day,
      tier_level: context.tier_level
    });

    // GHL API v2 - Update contact with custom fields
    // IMPORTANT: customFields must be an array of {key, field_value} objects
    const customFieldsArray = customFieldUpdates.map(field => ({
      key: field.key,
      field_value: String(field.value)
    }));

    const response = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${privateToken}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      body: JSON.stringify({
        customFields: customFieldsArray
      })
    });

    const responseText = await response.text();
    console.log('[GHL Update] Response status:', response.status, 'Body:', responseText.slice(0, 500));

    if (!response.ok) {
      // Check if custom fields don't exist yet
      if (response.status === 422 && responseText.includes('custom')) {
        console.warn('[GHL Update] Custom fields may not exist yet. Fields need to be created in GHL first.');
        return {
          success: false,
          error: 'Custom fields not configured in GHL. Please create them in GHL dashboard first.'
        };
      }

      console.error('[GHL Update] Error updating contact:', response.status, responseText);
      return {
        success: false,
        error: `GHL API error: ${response.status} - ${responseText.slice(0, 200)}`
      };
    }

    console.log('[GHL Update] Successfully updated contact custom fields');
    return { success: true };

  } catch (error) {
    console.error('[GHL Update] Exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// ============================================================================
// ALTERNATIVE: Update via customField endpoint (if main method fails)
// ============================================================================

async function updateCustomFieldsAlternative(
  contactId: string,
  context: VoiceContext,
  locationId: string,
  privateToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Alternative method: include firstName and tags for immediate access
    console.log('[GHL Update Alt] Trying alternative custom field update method');

    // Build the array format for custom fields (GHL requires array of {key, field_value})
    const customFieldsArray: { key: string; field_value: string }[] = [];

    for (const [contextKey, ghlKey] of Object.entries(GHL_CUSTOM_FIELD_MAP)) {
      const value = context[contextKey as keyof VoiceContext];
      if (value !== null && value !== undefined) {
        customFieldsArray.push({
          key: ghlKey,
          field_value: String(value)
        });
      }
    }

    customFieldsArray.push({
      key: 'voice_context_synced_at',
      field_value: context.synced_at
    });

    // Update with custom fields and also standard contact fields
    const response = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${privateToken}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      body: JSON.stringify({
        customFields: customFieldsArray,
        // Also update standard contact fields for immediate access
        firstName: context.first_name || undefined,
        tags: ['voice-context-synced', `tier-${context.tier_level}`]
      })
    });

    const responseText = await response.text();
    console.log('[GHL Update Alt] Response:', response.status, responseText.slice(0, 300));

    if (!response.ok) {
      return {
        success: false,
        error: `Alternative method failed: ${response.status}`
      };
    }

    return { success: true };

  } catch (error) {
    console.error('[GHL Update Alt] Exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
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
    // GHL credentials from environment
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
    const { contact_id, context } = request;

    console.log('[Sync] Request:', {
      contact_id,
      greeting_name: context?.greeting_name,
      journey_day: context?.journey_day
    });

    if (!contact_id || !context) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: contact_id, context'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update GHL contact custom fields
    let result = await updateContactCustomFields(contact_id, context, ghlLocationId, ghlPrivateToken);

    // If primary method fails, try alternative
    if (!result.success) {
      console.log('[Sync] Primary method failed, trying alternative...');
      result = await updateCustomFieldsAlternative(contact_id, context, ghlLocationId, ghlPrivateToken);
    }

    if (!result.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: result.error || 'Failed to update GHL contact',
          contact_id
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Voice context synced to GHL successfully',
        contact_id,
        synced_at: context.synced_at,
        fields_updated: Object.keys(GHL_CUSTOM_FIELD_MAP).length + 1 // +1 for synced_at
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
