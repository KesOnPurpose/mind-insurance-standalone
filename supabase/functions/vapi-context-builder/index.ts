// ============================================================================
// VAPI CONTEXT BUILDER - Build User Context for Vapi Voice AI
// ============================================================================
// Called when initiating a Vapi call. Builds complete user context and
// returns configuration for the call including assistant selection (A/B test).
//
// Flow:
// 1. Frontend calls this function before starting Vapi call
// 2. We build user context from Supabase (profile, assessment, journey)
// 3. We select assistant variant (claude/gpt4) for A/B testing
// 4. Return call config with injected context
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// CONFIGURATION
// ============================================================================

const VAPI_ASSISTANTS = {
  claude: {
    id: '2e0dcaa8-4e9c-4c72-99f6-a19d87475147',
    name: 'nette-claude',
    model: 'claude-sonnet-4-20250514',
    provider: 'anthropic'
  },
  gpt4: {
    id: 'cab72f23-7e8d-4c84-a1ed-e0895ccb5bd7',
    name: 'nette-gpt4',
    model: 'gpt-4o',
    provider: 'openai'
  }
};

// A/B test traffic split (percentage for Claude)
const CLAUDE_TRAFFIC_PERCENT = 50;

// ============================================================================
// TYPES
// ============================================================================

interface ContextRequest {
  user_id: string;
  force_variant?: 'claude' | 'gpt4'; // For testing specific variant
}

interface JourneyPhase {
  name: string;
  week_range: string;
}

interface UserContext {
  // Core identity
  first_name: string;
  tier_level: string;

  // Journey progress
  journey_day: number;
  journey_week: number;
  journey_phase: string;
  tactics_completed: number;
  total_tactics: number;
  completion_rate: number;

  // Assessment data
  readiness_level: string;
  assessment_score: number;
  target_state: string | null;
  target_demographics: string;
  ownership_model: string;
  immediate_priority: string;

  // Business context
  capital_available: string;
  licensing_familiarity: string;
  caregiving_experience: string;
  timeline: string;

  // Formatted context for injection
  context_text: string;
}

interface CallConfig {
  success: boolean;
  assistant_id: string;
  assistant_variant: 'claude' | 'gpt4';
  assistant_name: string;
  variable_values: {
    user_context: string;
  };
  user_context: UserContext;
  error?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

function getJourneyPhase(week: number): JourneyPhase {
  if (week <= 3) return { name: 'foundation', week_range: '1-3' };
  if (week <= 6) return { name: 'building', week_range: '4-6' };
  if (week <= 9) return { name: 'launching', week_range: '7-9' };
  return { name: 'operating', week_range: '10-12' };
}

function formatPopulations(populations: string[] | null): string {
  if (!populations || populations.length === 0) {
    return 'Not specified';
  }
  return populations
    .map(p => p.charAt(0).toUpperCase() + p.slice(1).replace(/-/g, ' '))
    .join(', ');
}

function selectAssistantVariant(forceVariant?: 'claude' | 'gpt4'): 'claude' | 'gpt4' {
  if (forceVariant) {
    return forceVariant;
  }
  // Random A/B test selection
  const random = Math.random() * 100;
  return random < CLAUDE_TRAFFIC_PERCENT ? 'claude' : 'gpt4';
}

function buildContextText(context: Partial<UserContext>): string {
  const lines: string[] = [];

  lines.push(`Member: ${context.first_name || 'User'} (${context.tier_level || 'foundation'} tier)`);
  lines.push(`Journey: Day ${context.journey_day || 1} of 90 (Week ${context.journey_week || 1})`);
  lines.push(`Phase: ${context.journey_phase || 'foundation'}`);
  lines.push(`Progress: ${context.completion_rate || 0}% complete (${context.tactics_completed || 0} tactics done)`);

  if (context.readiness_level) {
    lines.push(`Readiness: ${context.readiness_level.replace(/_/g, ' ')}`);
  }

  if (context.target_state) {
    lines.push(`Target State: ${context.target_state}`);
  }

  if (context.target_demographics && context.target_demographics !== 'Not specified') {
    lines.push(`Target Populations: ${context.target_demographics}`);
  }

  if (context.ownership_model && context.ownership_model !== 'not_decided') {
    lines.push(`Ownership Model: ${context.ownership_model.replace(/_/g, ' ')}`);
  }

  if (context.immediate_priority && context.immediate_priority !== 'Not specified') {
    lines.push(`Priority: ${context.immediate_priority.replace(/_/g, ' ')}`);
  }

  return lines.join('\n');
}

// ============================================================================
// DATA FETCHING
// ============================================================================

async function fetchUserProfile(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, full_name, email, tier_level, current_journey_day')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('[vapi-context-builder] Error fetching profile:', error);
    return null;
  }

  return data;
}

async function fetchAssessmentData(supabase: ReturnType<typeof createClient>, userId: string) {
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
    console.error('[vapi-context-builder] Error fetching assessment:', error);
    return null;
  }

  return data;
}

async function fetchJourneyProgress(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data, error } = await supabase
    .from('tactic_progress')
    .select('status')
    .eq('user_id', userId);

  if (error) {
    console.error('[vapi-context-builder] Error fetching progress:', error);
    return { completed: 0, total: 48 };
  }

  const completed = data?.filter((p: { status: string }) => p.status === 'completed').length || 0;

  // Get total tactics count
  const { count } = await supabase
    .from('tactics')
    .select('*', { count: 'exact', head: true });

  return {
    completed,
    total: count || 48
  };
}

async function buildUserContext(supabase: ReturnType<typeof createClient>, userId: string): Promise<UserContext> {
  console.log('[vapi-context-builder] Building context for user:', userId);

  // Fetch all data in parallel
  const [profile, assessment, progress] = await Promise.all([
    fetchUserProfile(supabase, userId),
    fetchAssessmentData(supabase, userId),
    fetchJourneyProgress(supabase, userId)
  ]);

  // Extract first name
  const firstName = profile?.full_name?.split(' ')[0] || 'User';

  // Calculate journey metrics
  const journeyDay = profile?.current_journey_day || 1;
  const journeyWeek = Math.ceil(journeyDay / 7);
  const phase = getJourneyPhase(journeyWeek);
  const completionRate = progress.total > 0
    ? Math.round((progress.completed / progress.total) * 100)
    : 0;

  const context: UserContext = {
    // Core identity
    first_name: firstName,
    tier_level: profile?.tier_level || 'foundation',

    // Journey progress
    journey_day: journeyDay,
    journey_week: journeyWeek,
    journey_phase: phase.name,
    tactics_completed: progress.completed,
    total_tactics: progress.total,
    completion_rate: completionRate,

    // Assessment data
    readiness_level: assessment?.readiness_level || 'exploring',
    assessment_score: assessment?.overall_score || 0,
    target_state: assessment?.target_state || null,
    target_demographics: formatPopulations(assessment?.target_populations),
    ownership_model: assessment?.ownership_model || 'not_decided',
    immediate_priority: assessment?.immediate_priority || 'Not specified',

    // Business context
    capital_available: assessment?.capital_available || 'unknown',
    licensing_familiarity: assessment?.licensing_familiarity || 'unknown',
    caregiving_experience: assessment?.caregiving_experience || 'unknown',
    timeline: assessment?.timeline || 'unknown',

    // Will be filled below
    context_text: ''
  };

  // Build formatted context text
  context.context_text = buildContextText(context);

  console.log('[vapi-context-builder] Built context:', {
    first_name: context.first_name,
    journey_day: context.journey_day,
    tier_level: context.tier_level,
    completion_rate: context.completion_rate
  });

  return context;
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
    // Initialize Supabase client with service role (bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[vapi-context-builder] Missing Supabase credentials');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Database not configured'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request
    const body: ContextRequest = await req.json();
    const { user_id, force_variant } = body;

    if (!user_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'user_id is required'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[vapi-context-builder] Processing request for user:', user_id);

    // Build user context
    const userContext = await buildUserContext(supabase, user_id);

    // Select assistant variant (A/B test)
    const variant = selectAssistantVariant(force_variant);
    const assistant = VAPI_ASSISTANTS[variant];

    console.log('[vapi-context-builder] Selected assistant:', {
      variant,
      assistant_id: assistant.id,
      model: assistant.model
    });

    // Build call configuration
    const callConfig: CallConfig = {
      success: true,
      assistant_id: assistant.id,
      assistant_variant: variant,
      assistant_name: assistant.name,
      variable_values: {
        // This will replace {{user_context}} in the system prompt
        user_context: userContext.context_text
      },
      user_context: userContext
    };

    // Log for debugging
    console.log('[vapi-context-builder] Returning call config:', {
      success: true,
      assistant_variant: variant,
      first_name: userContext.first_name,
      journey_day: userContext.journey_day
    });

    return new Response(
      JSON.stringify(callConfig),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[vapi-context-builder] Exception:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
