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

// ============================================================================
// RECENCY TYPES - For dynamic, context-aware greetings
// ============================================================================

type GreetingStyle = 'continuation' | 'same_day' | 'recent' | 'reference' | 'fresh';
type InteractionType = 'voice' | 'chat' | 'none';

interface RecencyData {
  minutes_ago: number;
  type: InteractionType;
  last_topic: string;
  greeting_style: GreetingStyle;
}

interface CallConfig {
  success: boolean;
  assistant_id: string;
  assistant_variant: 'claude' | 'gpt4';
  assistant_name: string;
  variable_values: {
    user_context: string;
    recentChats: string;
    // NEW: Recency-aware greeting variables
    lastInteractionMinutesAgo: string;
    lastInteractionType: string;
    lastTopicDiscussed: string;
    greetingStyle: string;
  };
  user_context: UserContext;
  conversation_context: string;
  // NEW: Recency data for frontend
  recency: RecencyData;
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
// RECENCY DETECTION - For dynamic, context-aware greetings
// ============================================================================

/**
 * Calculate recency of last interaction and determine appropriate greeting style.
 *
 * Greeting Style Tiers:
 * - continuation (< 30 min): "Picking right back up from our compliance discussion..."
 * - same_day (30 min - 2 hours): "Good to hear from you again today!"
 * - recent (2 - 24 hours): "Welcome back! Last time we talked about..."
 * - reference (1 - 7 days): "A few days ago we discussed..."
 * - fresh (> 7 days or first time): "Hi! Great to connect..."
 */
function calculateRecency(
  chatHistory: Array<{ created_at: string }>,
  voiceHistory: Array<{ created_at: string }>
): {
  minutesSinceLastInteraction: number;
  lastInteractionType: InteractionType;
  greetingStyle: GreetingStyle;
} {
  const now = new Date();

  // Find most recent interaction from either channel
  const lastChat = chatHistory[0]?.created_at ? new Date(chatHistory[0].created_at) : null;
  const lastVoice = voiceHistory[0]?.created_at ? new Date(voiceHistory[0].created_at) : null;

  let lastInteraction: Date | null = null;
  let lastInteractionType: InteractionType = 'none';

  if (lastChat && lastVoice) {
    // Compare both - pick the more recent one
    if (lastChat > lastVoice) {
      lastInteraction = lastChat;
      lastInteractionType = 'chat';
    } else {
      lastInteraction = lastVoice;
      lastInteractionType = 'voice';
    }
  } else if (lastChat) {
    lastInteraction = lastChat;
    lastInteractionType = 'chat';
  } else if (lastVoice) {
    lastInteraction = lastVoice;
    lastInteractionType = 'voice';
  }

  // No previous interactions - first time user
  if (!lastInteraction) {
    console.log('[vapi-context-builder] No previous interactions found - first time user');
    return {
      minutesSinceLastInteraction: -1,
      lastInteractionType: 'none',
      greetingStyle: 'fresh'
    };
  }

  // Calculate minutes since last interaction
  const minutesAgo = Math.floor((now.getTime() - lastInteraction.getTime()) / (1000 * 60));

  // Determine greeting style based on recency tiers
  let greetingStyle: GreetingStyle;
  if (minutesAgo < 30) {
    greetingStyle = 'continuation';  // < 30 min: Continue the conversation
  } else if (minutesAgo < 120) {
    greetingStyle = 'same_day';      // 30 min - 2 hours: Same-day follow-up
  } else if (minutesAgo < 1440) {
    greetingStyle = 'recent';        // 2 - 24 hours: Recent context
  } else if (minutesAgo < 10080) {
    greetingStyle = 'reference';     // 1 - 7 days: Reference prior
  } else {
    greetingStyle = 'fresh';         // > 7 days: Fresh start with context
  }

  console.log('[vapi-context-builder] Recency calculated:', {
    minutesAgo,
    lastInteractionType,
    greetingStyle,
    lastInteractionTime: lastInteraction.toISOString()
  });

  return {
    minutesSinceLastInteraction: minutesAgo,
    lastInteractionType,
    greetingStyle
  };
}

/**
 * Extract the main topic from the most recent conversation.
 * Priority: Voice topics > Voice summary > Chat keywords > Default
 */
function extractLastTopic(
  voiceHistory: Array<{ summary: string | null; topics: string[] | null }>,
  chatHistory: Array<{ user_message: string }>
): string {
  // Priority 1: Voice call topics array (most reliable)
  if (voiceHistory[0]?.topics && voiceHistory[0].topics.length > 0) {
    const topic = voiceHistory[0].topics[0];
    console.log('[vapi-context-builder] Topic from voice topics array:', topic);
    return topic;
  }

  // Priority 2: Extract from voice call summary
  if (voiceHistory[0]?.summary) {
    const summary = voiceHistory[0].summary;
    // Look for common patterns in summaries
    const topicPatterns = [
      /about\s+(\w+(?:\s+\w+)?)/i,
      /regarding\s+(\w+(?:\s+\w+)?)/i,
      /discussed\s+(\w+(?:\s+\w+)?)/i,
      /focused\s+on\s+(\w+(?:\s+\w+)?)/i,
      /working\s+on\s+(\w+(?:\s+\w+)?)/i
    ];

    for (const pattern of topicPatterns) {
      const match = summary.match(pattern);
      if (match) {
        console.log('[vapi-context-builder] Topic extracted from voice summary:', match[1]);
        return match[1];
      }
    }
  }

  // Priority 3: Recent chat message keywords
  if (chatHistory[0]?.user_message) {
    const msg = chatHistory[0].user_message.toLowerCase();

    // Group home industry topics (most likely for this app)
    const industryTopics = [
      { keyword: 'compliance', display: 'compliance requirements' },
      { keyword: 'licensing', display: 'licensing' },
      { keyword: 'staffing', display: 'staffing' },
      { keyword: 'funding', display: 'funding options' },
      { keyword: 'location', display: 'finding a location' },
      { keyword: 'zoning', display: 'zoning requirements' },
      { keyword: 'regulations', display: 'regulations' },
      { keyword: 'seniors', display: 'serving seniors' },
      { keyword: 'elderly', display: 'elderly care' },
      { keyword: 'veterans', display: 'serving veterans' },
      { keyword: 'disabled', display: 'disability services' },
      { keyword: 'mental health', display: 'mental health services' },
      { keyword: 'business plan', display: 'your business plan' },
      { keyword: 'marketing', display: 'marketing strategies' },
      { keyword: 'insurance', display: 'insurance requirements' },
      { keyword: 'medicaid', display: 'Medicaid reimbursement' },
      { keyword: 'training', display: 'staff training' }
    ];

    for (const { keyword, display } of industryTopics) {
      if (msg.includes(keyword)) {
        console.log('[vapi-context-builder] Topic from chat keyword:', display);
        return display;
      }
    }
  }

  // Default fallback
  console.log('[vapi-context-builder] Using default topic');
  return 'your group home journey';
}

// ============================================================================
// DATA FETCHING
// ============================================================================

// ============================================================================
// NEW: Fetch recent chat conversations from agent_conversations
// ============================================================================
async function fetchChatHistory(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data, error } = await supabase
    .from('agent_conversations')
    .select('user_message, agent_response, agent_type, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('[vapi-context-builder] Error fetching chat history:', error);
    return [];
  }

  console.log(`[vapi-context-builder] Fetched ${data?.length || 0} chat messages`);
  return data || [];
}

// ============================================================================
// NEW: Fetch previous voice call summaries from vapi_call_logs
// ============================================================================
async function fetchVoiceHistory(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data, error } = await supabase
    .from('vapi_call_logs')
    .select('summary, topics, created_at, transcript')
    .eq('user_id', userId)
    .not('summary', 'is', null)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('[vapi-context-builder] Error fetching voice history:', error);
    return [];
  }

  console.log(`[vapi-context-builder] Fetched ${data?.length || 0} voice call summaries`);
  return data || [];
}

// ============================================================================
// NEW: Build unified conversation context for voice injection
// ============================================================================
function buildConversationContext(
  chatHistory: Array<{ user_message: string; agent_response: string; agent_type: string; created_at: string }>,
  voiceHistory: Array<{ summary: string | null; topics: string[] | null; created_at: string; transcript: string | null }>
): string {
  const sections: string[] = [];

  // Voice call history (most important for voice continuity)
  if (voiceHistory && voiceHistory.length > 0) {
    sections.push('=== PREVIOUS VOICE CONVERSATIONS ===');
    voiceHistory.forEach((call, index) => {
      const callDate = new Date(call.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      sections.push(`[Voice Call ${index + 1} - ${callDate}]`);
      if (call.summary) {
        sections.push(`Summary: ${call.summary}`);
      }
      if (call.topics && call.topics.length > 0) {
        sections.push(`Topics: ${call.topics.join(', ')}`);
      }
      sections.push('---');
    });
  }

  // Chat history (recent text conversations)
  if (chatHistory && chatHistory.length > 0) {
    sections.push('=== RECENT CHAT MESSAGES ===');
    // Show most recent 5 chat messages for context
    chatHistory.slice(0, 5).forEach((msg) => {
      const msgDate = new Date(msg.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      const agentLabel = msg.agent_type?.toUpperCase() || 'NETTE';
      sections.push(`[${msgDate} - ${agentLabel}]`);
      sections.push(`User: ${msg.user_message.substring(0, 150)}${msg.user_message.length > 150 ? '...' : ''}`);
      sections.push(`Agent: ${msg.agent_response.substring(0, 200)}${msg.agent_response.length > 200 ? '...' : ''}`);
      sections.push('---');
    });
  }

  if (sections.length === 0) {
    return 'No previous conversations found. This appears to be the first interaction.';
  }

  return sections.join('\n');
}

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

interface BuildContextResult {
  userContext: UserContext;
  conversationContext: string;
  recency: RecencyData;
}

async function buildUserContext(supabase: ReturnType<typeof createClient>, userId: string): Promise<BuildContextResult> {
  console.log('[vapi-context-builder] Building context for user:', userId);

  // Fetch all data in parallel - NOW INCLUDING CHAT AND VOICE HISTORY
  const [profile, assessment, progress, chatHistory, voiceHistory] = await Promise.all([
    fetchUserProfile(supabase, userId),
    fetchAssessmentData(supabase, userId),
    fetchJourneyProgress(supabase, userId),
    fetchChatHistory(supabase, userId),    // NEW: Get recent chat messages
    fetchVoiceHistory(supabase, userId)    // NEW: Get previous voice call summaries
  ]);

  // Build conversation context for voice injection
  const conversationContext = buildConversationContext(chatHistory, voiceHistory);
  console.log('[vapi-context-builder] Built conversation context, length:', conversationContext.length);

  // NEW: Calculate recency for dynamic greetings
  const recencyCalc = calculateRecency(chatHistory, voiceHistory);
  const lastTopic = extractLastTopic(voiceHistory, chatHistory);

  const recency: RecencyData = {
    minutes_ago: recencyCalc.minutesSinceLastInteraction,
    type: recencyCalc.lastInteractionType,
    last_topic: lastTopic,
    greeting_style: recencyCalc.greetingStyle
  };

  console.log('[vapi-context-builder] Recency data:', recency);

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
    completion_rate: context.completion_rate,
    chat_messages: chatHistory.length,
    voice_calls: voiceHistory.length,
    greeting_style: recency.greeting_style,
    last_topic: recency.last_topic
  });

  return {
    userContext: context,
    conversationContext,
    recency
  };
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

    // Build user context, conversation history, AND recency data
    const { userContext, conversationContext, recency } = await buildUserContext(supabase, user_id);

    // Select assistant variant (A/B test)
    const variant = selectAssistantVariant(force_variant);
    const assistant = VAPI_ASSISTANTS[variant];

    console.log('[vapi-context-builder] Selected assistant:', {
      variant,
      assistant_id: assistant.id,
      model: assistant.model
    });

    // Build call configuration with user_context, recentChats, AND recency variables
    const callConfig: CallConfig = {
      success: true,
      assistant_id: assistant.id,
      assistant_variant: variant,
      assistant_name: assistant.name,
      variable_values: {
        // This will replace {{user_context}} in the system prompt
        user_context: userContext.context_text,
        // This will replace {{recentChats}} in the system prompt
        // Enables Voice Nette to remember ALL previous conversations
        recentChats: conversationContext,
        // NEW: Recency-aware greeting variables for dynamic openings
        // These enable context-aware greetings based on time since last interaction
        lastInteractionMinutesAgo: String(recency.minutes_ago),
        lastInteractionType: recency.type,
        lastTopicDiscussed: recency.last_topic,
        greetingStyle: recency.greeting_style
      },
      user_context: userContext,
      conversation_context: conversationContext,  // Raw context for debugging
      recency  // Structured recency data for frontend
    };

    // Log for debugging
    console.log('[vapi-context-builder] Returning call config:', {
      success: true,
      assistant_variant: variant,
      first_name: userContext.first_name,
      journey_day: userContext.journey_day,
      conversation_context_length: conversationContext.length,
      has_recent_chats: conversationContext.includes('RECENT CHAT'),
      has_voice_history: conversationContext.includes('VOICE CONVERSATIONS'),
      // NEW: Recency information for dynamic greetings
      greeting_style: recency.greeting_style,
      minutes_since_last: recency.minutes_ago,
      last_interaction_type: recency.type,
      last_topic: recency.last_topic
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
