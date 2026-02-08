// ============================================================================
// VOICE CONTEXT SERVICE
// Fetches and formats user context for Voice AI
//
// NOTE: GHL Voice AI has been decommissioned. We are now 100% Vapi.
// - syncVoiceContextToGHL is DEPRECATED (Edge Function removed)
// - fetchContextFromN8n is DEPRECATED
// - buildVoiceContext is still useful for Vapi context building
// ============================================================================

import { supabase } from "@/integrations/supabase/client";
import type {
  VoiceContextPayload,
  VoiceContextSyncResponse,
  VoiceUserProfile,
} from "@/types/voice";
import { VOICE_CONTEXT_DEFAULTS } from "@/types/voice";
import type { JourneyPhase } from "@/hooks/useJourneyContext";

// ============================================================================
// CONSTANTS
// ============================================================================

const N8N_VOICE_CONTEXT_WEBHOOK = 'https://n8n-n8n.vq00fr.easypanel.host/webhook/voice-context-fetch';

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Calculate journey phase from week number
 */
function getJourneyPhase(week: number): JourneyPhase {
  if (week <= 3) return 'foundation';
  if (week <= 6) return 'building';
  if (week <= 9) return 'launching';
  return 'operating';
}

/**
 * Format population array for display
 */
function formatPopulations(populations: string[] | null): string {
  if (!populations || populations.length === 0) {
    return 'Not specified';
  }
  return populations
    .map(p => p.charAt(0).toUpperCase() + p.slice(1).replace(/-/g, ' '))
    .join(', ');
}

/**
 * Generate personalized greeting
 */
function generateGreeting(firstName: string | null): string {
  if (!firstName) return 'Hey there';
  return `Hi ${firstName}`;
}

/**
 * Build context text block for Voice AI system prompt
 */
function buildContextForAgent(payload: Partial<VoiceContextPayload>): string {
  const lines: string[] = [];

  lines.push(`Member: ${payload.first_name || 'User'} (${payload.tier_level || 'foundation'} tier)`);
  lines.push(`Journey: Day ${payload.journey_day || 1} of 90 (Week ${payload.journey_week || 1})`);
  lines.push(`Phase: ${payload.journey_phase || 'foundation'}`);
  lines.push(`Progress: ${payload.completion_rate || 0}% complete (${payload.tactics_completed || 0} tactics done)`);

  if (payload.readiness_level) {
    lines.push(`Readiness: ${payload.readiness_level.replace(/_/g, ' ')}`);
  }

  if (payload.target_state) {
    lines.push(`Target State: ${payload.target_state}`);
  }

  if (payload.target_demographics && payload.target_demographics !== 'Not specified') {
    lines.push(`Target Populations: ${payload.target_demographics}`);
  }

  if (payload.ownership_model && payload.ownership_model !== 'not_decided') {
    lines.push(`Ownership Model: ${payload.ownership_model.replace(/_/g, ' ')}`);
  }

  if (payload.immediate_priority && payload.immediate_priority !== 'Not specified') {
    lines.push(`Priority: ${payload.immediate_priority.replace(/_/g, ' ')}`);
  }

  return lines.join('\n');
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Fetch user profile from Supabase
 */
async function fetchUserProfile(userId: string): Promise<VoiceUserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, full_name, email, tier_level, current_journey_day, ghl_contact_id, verified_phone')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('[voiceContextService] Error fetching profile:', error);
    return null;
  }

  return data;
}

/**
 * Fetch assessment data from user_onboarding table
 */
async function fetchAssessmentData(userId: string) {
  const { data, error } = await supabase
    .from('user_onboarding')
    .select(`
      capital_available,
      target_populations,
      timeline,
      caregiving_experience,
      licensing_familiarity,
      overall_score,
      readiness_level,
      ownership_model,
      target_state,
      immediate_priority
    `)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('[voiceContextService] Error fetching assessment:', error);
    return null;
  }

  return data;
}

/**
 * Fetch journey progress (tactics completed)
 */
async function fetchJourneyProgress(userId: string) {
  const { data, error } = await supabase
    .from('gh_user_tactic_progress')
    .select('status')
    .eq('user_id', userId);

  if (error) {
    console.error('[voiceContextService] Error fetching progress:', error);
    return { completed: 0, total: 48 };
  }

  const completed = data?.filter(p => p.status === 'completed').length || 0;

  // Get total tactics count from the correct table
  const { count } = await supabase
    .from('gh_tactic_instructions')
    .select('*', { count: 'exact', head: true });

  return {
    completed,
    total: count || 48
  };
}

/**
 * Build complete voice context payload from user data
 */
export async function buildVoiceContext(userId: string): Promise<VoiceContextPayload> {
  console.log('[voiceContextService] Building voice context for user:', userId);

  // Fetch all data in parallel
  const [profile, assessment, progress] = await Promise.all([
    fetchUserProfile(userId),
    fetchAssessmentData(userId),
    fetchJourneyProgress(userId)
  ]);

  // Extract first name
  const firstName = profile?.full_name?.split(' ')[0] || null;

  // Calculate journey metrics
  const journeyDay = profile?.current_journey_day || 1;
  const journeyWeek = Math.ceil(journeyDay / 7);
  const journeyPhase = getJourneyPhase(journeyWeek);
  const completionRate = progress.total > 0
    ? Math.round((progress.completed / progress.total) * 100)
    : 0;

  // Build partial payload
  const partialPayload: Partial<VoiceContextPayload> = {
    // Tier 1: Core Identity
    greeting_name: generateGreeting(firstName),
    first_name: firstName || 'User',
    tier_level: profile?.tier_level || VOICE_CONTEXT_DEFAULTS.tier_level!,

    // Tier 2: Journey Progress
    journey_day: journeyDay,
    journey_week: journeyWeek,
    journey_phase: journeyPhase,
    tactics_completed: progress.completed,
    total_tactics: progress.total,
    completion_rate: completionRate,

    // Tier 3: Assessment Context
    readiness_level: assessment?.readiness_level || VOICE_CONTEXT_DEFAULTS.readiness_level!,
    assessment_score: assessment?.overall_score || 0,
    target_state: assessment?.target_state || null,
    target_demographics: formatPopulations(assessment?.target_populations),
    ownership_model: assessment?.ownership_model || VOICE_CONTEXT_DEFAULTS.ownership_model!,
    immediate_priority: assessment?.immediate_priority || VOICE_CONTEXT_DEFAULTS.immediate_priority!,

    // Tier 4: Business Context
    capital_available: assessment?.capital_available || VOICE_CONTEXT_DEFAULTS.capital_available!,
    licensing_familiarity: assessment?.licensing_familiarity || VOICE_CONTEXT_DEFAULTS.licensing_familiarity!,
    caregiving_experience: assessment?.caregiving_experience || VOICE_CONTEXT_DEFAULTS.caregiving_experience!,
    timeline: assessment?.timeline || VOICE_CONTEXT_DEFAULTS.timeline!,
  };

  // Build full payload with context text
  const payload: VoiceContextPayload = {
    ...VOICE_CONTEXT_DEFAULTS,
    ...partialPayload,
    context_for_agent: buildContextForAgent(partialPayload),
    synced_at: new Date().toISOString(),
  } as VoiceContextPayload;

  console.log('[voiceContextService] Built voice context:', {
    greeting_name: payload.greeting_name,
    journey_day: payload.journey_day,
    tier_level: payload.tier_level,
  });

  return payload;
}

/**
 * Sync voice context to GHL contact custom fields
 * Uses Edge Function to update GHL contact
 *
 * @deprecated GHL Voice AI decommissioned. Edge Function removed. This is now a no-op.
 */
export async function syncVoiceContextToGHL(
  contactId: string,
  context: VoiceContextPayload
): Promise<VoiceContextSyncResponse> {
  // DEPRECATED: GHL Voice AI decommissioned. This is now a no-op.
  console.log('[voiceContextService] syncVoiceContextToGHL is deprecated (GHL decommissioned)');
  return {
    success: true,
    message: 'GHL sync deprecated - using Vapi-only system',
    context,
    ghl_contact_updated: false
  };
}

/**
 * Fetch context from N8n webhook (alternative method)
 * This calls the existing N8n webhook that's already configured
 */
export async function fetchContextFromN8n(
  ghlContactId: string,
  phone?: string | null
): Promise<VoiceContextPayload | null> {
  console.log('[voiceContextService] Fetching context from N8n webhook');

  try {
    const response = await fetch(N8N_VOICE_CONTEXT_WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ghl_contact_id: ghlContactId,
        phone: phone || undefined
      })
    });

    if (!response.ok) {
      console.error('[voiceContextService] N8n webhook error:', response.status);
      return null;
    }

    const data = await response.json();
    console.log('[voiceContextService] N8n response:', data);
    return data;

  } catch (err) {
    console.error('[voiceContextService] N8n fetch exception:', err);
    return null;
  }
}

/**
 * Complete voice context sync flow:
 * 1. Build context from Supabase
 * 2. Sync to GHL contact custom fields
 */
export async function syncVoiceContext(
  userId: string,
  ghlContactId: string
): Promise<VoiceContextSyncResponse> {
  console.log('[voiceContextService] Starting complete sync flow for user:', userId);

  // Step 1: Build context from database
  const context = await buildVoiceContext(userId);

  // Step 2: Sync to GHL
  const result = await syncVoiceContextToGHL(ghlContactId, context);

  return {
    ...result,
    context
  };
}
