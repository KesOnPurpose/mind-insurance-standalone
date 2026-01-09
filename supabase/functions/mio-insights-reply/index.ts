// ============================================================================
// MIO INSIGHTS REPLY - Two-Way Conversation Handler
// ============================================================================
// Handles user replies in the MIO Insights Thread with:
// - Full conversation history context
// - Variable reward system for responses
// - Protocol recommendations when appropriate
// - Push notification on MIO response
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { buildMIOReplyPrompt } from '../_shared/mio-prompts.ts';
import { rollVariableReward, getAdjustedWeights, rollWithWeights } from '../_shared/variable-reward.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// TYPES
// ============================================================================

interface InsightsReplyRequest {
  thread_id: string;
  user_id: string;
  content: string;
  in_reply_to?: string; // Optional: specific message being replied to
}

interface InsightsReplyResponse {
  success: boolean;
  user_message_id: string;
  mio_response_id: string;
  mio_response: string;
  reward_tier: string;
  patterns_detected: Array<{ pattern_name: string; confidence: number }>;
  protocol_suggested: string | null;
  push_sent: boolean;
  error?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get thread messages for conversation context
 */
async function getThreadMessages(
  supabase: any,
  threadId: string,
  limit: number = 20
): Promise<Array<{ role: string; content: string; section_type?: string; created_at: string }>> {
  const { data, error } = await supabase
    .from('mio_insights_messages')
    .select('role, content, section_type, created_at')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[Thread Messages] Error:', error);
    return [];
  }

  // Reverse to chronological order
  return (data || []).reverse();
}

/**
 * Get user context for personalization
 */
async function getUserContext(supabase: any, userId: string): Promise<any> {
  // Fetch user profile with avatar and collision patterns
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select(`
      full_name,
      avatar_type,
      collision_patterns,
      timezone
    `)
    .eq('id', userId)
    .single();

  if (profileError) {
    console.error('[User Context] Profile error:', profileError);
  }

  // Fetch recent practices for forensic context
  const { data: practices, error: practicesError } = await supabase
    .from('daily_practices')
    .select(`
      practice_type,
      completed,
      completed_at,
      points_earned,
      practice_data
    `)
    .eq('user_id', userId)
    .eq('completed', true)
    .order('completed_at', { ascending: false })
    .limit(14); // Last 14 practices

  if (practicesError) {
    console.error('[User Context] Practices error:', practicesError);
  }

  // Fetch streak info
  const { data: streak, error: streakError } = await supabase
    .from('user_streaks')
    .select('current_streak, longest_streak, last_practice_date')
    .eq('user_id', userId)
    .single();

  if (streakError && streakError.code !== 'PGRST116') {
    console.error('[User Context] Streak error:', streakError);
  }

  return {
    profile: profile || {},
    recentPractices: practices || [],
    streak: streak || { current_streak: 0, longest_streak: 0 }
  };
}

/**
 * Detect patterns in user message
 */
function detectPatterns(content: string, userContext: any): Array<{ pattern_name: string; pattern_type: string; confidence: number }> {
  const patterns: Array<{ pattern_name: string; pattern_type: string; confidence: number }> = [];
  const contentLower = content.toLowerCase();

  // Pattern detection rules
  const patternRules = [
    {
      pattern_name: 'success_sabotage',
      pattern_type: 'collision',
      keywords: ['sabotage', 'quit', 'give up', 'close to success', 'pull back', 'self-destruct'],
      confidence: 0.8
    },
    {
      pattern_name: 'past_prison',
      pattern_type: 'collision',
      keywords: ['always been', 'never could', 'i was', 'used to be', 'can\'t change', 'that\'s just me'],
      confidence: 0.75
    },
    {
      pattern_name: 'compass_crisis',
      pattern_type: 'collision',
      keywords: ['don\'t know', 'lost', 'confused', 'direction', 'purpose', 'meaning', 'what should i'],
      confidence: 0.7
    },
    {
      pattern_name: 'freeze_response',
      pattern_type: 'behavioral',
      keywords: ['frozen', 'stuck', 'can\'t move', 'paralyzed', 'overwhelmed', 'shutdown'],
      confidence: 0.8
    },
    {
      pattern_name: 'procrastination',
      pattern_type: 'behavioral',
      keywords: ['procrastinating', 'putting off', 'later', 'tomorrow', 'not now', 'avoiding'],
      confidence: 0.75
    },
    {
      pattern_name: 'impostor_syndrome',
      pattern_type: 'identity',
      keywords: ['fraud', 'impostor', 'not qualified', 'don\'t deserve', 'who am i to', 'fake'],
      confidence: 0.8
    },
    {
      pattern_name: 'breakthrough_momentum',
      pattern_type: 'positive',
      keywords: ['realized', 'i see', 'makes sense', 'clicked', 'understand now', 'i get it'],
      confidence: 0.85
    }
  ];

  for (const rule of patternRules) {
    for (const keyword of rule.keywords) {
      if (contentLower.includes(keyword)) {
        patterns.push({
          pattern_name: rule.pattern_name,
          pattern_type: rule.pattern_type,
          confidence: rule.confidence
        });
        break; // Only add pattern once
      }
    }
  }

  return patterns;
}

/**
 * Get days since last pattern breakthrough reward
 */
async function getDaysSinceLastBreakthrough(supabase: any, threadId: string): Promise<number> {
  const { data, error } = await supabase
    .from('mio_insights_messages')
    .select('created_at')
    .eq('thread_id', threadId)
    .eq('reward_tier', 'pattern_breakthrough')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    return 30; // Default to 30 if no previous breakthrough
  }

  const lastBreakthrough = new Date(data[0].created_at);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - lastBreakthrough.getTime()) / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Send push notification
 */
async function sendPushNotification(
  supabase: any,
  userId: string,
  title: string,
  body: string,
  url?: string
): Promise<boolean> {
  try {
    // Get user's push subscriptions
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error || !subscriptions || subscriptions.length === 0) {
      console.log('[Push] No active subscriptions for user:', userId);
      return false;
    }

    // Call the send-push-notification edge function
    const response = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push-notification`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: userId,
          title,
          body,
          url: url || '/mind-insurance/insights'
        })
      }
    );

    return response.ok;
  } catch (error) {
    console.error('[Push] Error sending notification:', error);
    return false;
  }
}

/**
 * Generate MIO response using AI (Direct Anthropic API)
 */
async function generateMIOResponse(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }>,
  userContext: any,
  patternsDetected: Array<{ pattern_name: string; confidence: number }>,
  rewardTier: string
): Promise<{ response: string; protocol_suggested: string | null }> {
  // Build the prompt
  const { systemPrompt, userPrompt } = buildMIOReplyPrompt(
    userMessage,
    conversationHistory,
    userContext,
    patternsDetected,
    rewardTier
  );

  // Get Anthropic API key
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!anthropicKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  // Build messages array for Anthropic API format
  // Anthropic uses alternating user/assistant roles, starting with user
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  // Add conversation history (last 10 messages)
  for (const msg of conversationHistory.slice(-10)) {
    messages.push({
      role: msg.role === 'mio' ? 'assistant' : 'user',
      content: msg.content
    });
  }

  // Add current user prompt
  messages.push({ role: 'user', content: userPrompt });

  // Determine max tokens based on reward tier
  const maxTokens = rewardTier === 'pattern_breakthrough' ? 400 :
                    rewardTier === 'bonus_insight' ? 300 : 200;

  // Call Anthropic API directly
  const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: messages
    })
  });

  if (!aiResponse.ok) {
    const errorText = await aiResponse.text();
    console.error('[AI] Anthropic API Error:', aiResponse.status, errorText);
    throw new Error(`AI API error: ${aiResponse.status}`);
  }

  const aiData = await aiResponse.json();

  // Anthropic API returns content in a different format
  const responseText = aiData.content?.[0]?.text || '';

  // Extract protocol suggestion if present
  let protocolSuggested: string | null = null;
  const protocolMatch = responseText.match(/\*\*([^*]+)\*\*\s*\((\d+)\s*min\)/);
  if (protocolMatch) {
    protocolSuggested = protocolMatch[1];
  }

  return {
    response: responseText,
    protocol_suggested: protocolSuggested
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
    // Initialize Supabase client with service role for full access
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse request
    const { thread_id, user_id, content, in_reply_to }: InsightsReplyRequest = await req.json();

    console.log('[MIO Reply] Processing reply:', { thread_id, user_id, content_length: content.length });

    // Validate request
    if (!thread_id || !user_id || !content) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: thread_id, user_id, content' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify thread exists and belongs to user
    const { data: thread, error: threadError } = await supabase
      .from('mio_insights_thread')
      .select('id, user_id')
      .eq('id', thread_id)
      .eq('user_id', user_id)
      .single();

    if (threadError || !thread) {
      return new Response(
        JSON.stringify({ success: false, error: 'Thread not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch context in parallel
    const [threadMessages, userContext, daysSinceBreakthrough] = await Promise.all([
      getThreadMessages(supabase, thread_id, 20),
      getUserContext(supabase, user_id),
      getDaysSinceLastBreakthrough(supabase, thread_id)
    ]);

    // Detect patterns in user message
    const patternsDetected = detectPatterns(content, userContext);

    // Roll for variable reward with adjustments
    const hasSignificantPatternData = patternsDetected.length > 0;
    const currentStreak = userContext.streak?.current_streak || 0;

    let rewardRoll;
    if (daysSinceBreakthrough >= 7 && currentStreak >= 5 && hasSignificantPatternData) {
      // Boost breakthrough chance for engaged users
      const adjustedWeights = getAdjustedWeights(daysSinceBreakthrough, currentStreak, hasSignificantPatternData);
      rewardRoll = rollWithWeights(adjustedWeights);
      console.log('[Reward] Boosted weights applied:', adjustedWeights);
    } else {
      rewardRoll = rollVariableReward();
    }

    console.log('[Reward] Roll result:', rewardRoll.tier, 'probability:', rewardRoll.probability);

    // Step 1: Insert user message
    const { data: userMessage, error: userMsgError } = await supabase
      .from('mio_insights_messages')
      .insert({
        thread_id,
        user_id,
        role: 'user',
        content,
        in_reply_to,
        reward_tier: 'standard', // User messages are always standard
        delivered_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (userMsgError) {
      console.error('[User Message] Insert error:', userMsgError);
      throw new Error('Failed to save user message');
    }

    // Step 2: Generate MIO response
    const conversationHistory = threadMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    const { response: mioResponseText, protocol_suggested } = await generateMIOResponse(
      content,
      conversationHistory,
      userContext,
      patternsDetected,
      rewardRoll.tier
    );

    // Step 3: Insert MIO response
    const { data: mioMessage, error: mioMsgError } = await supabase
      .from('mio_insights_messages')
      .insert({
        thread_id,
        user_id,
        role: 'mio',
        content: mioResponseText,
        section_type: 'breakthrough', // Replies are tagged as breakthrough type
        reward_tier: rewardRoll.tier,
        reward_probability: rewardRoll.probability,
        patterns_detected: patternsDetected,
        protocol_suggested: null, // Would link to mio_weekly_protocols if implemented
        in_reply_to: userMessage.id,
        delivered_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (mioMsgError) {
      console.error('[MIO Message] Insert error:', mioMsgError);
      throw new Error('Failed to save MIO response');
    }

    // Step 4: Update activity tracking
    await supabase
      .from('mio_user_activity_tracking')
      .upsert({
        user_id,
        last_app_open_at: new Date().toISOString(),
        inactive_days: 0,
        is_at_risk: false,
        last_reengagement_responded: true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    // Step 5: Send push notification (optional, for when user has app closed)
    let pushSent = false;
    if (rewardRoll.tier === 'pattern_breakthrough') {
      pushSent = await sendPushNotification(
        supabase,
        user_id,
        `${rewardRoll.icon} Pattern Breakthrough`,
        'MIO detected something significant in your message',
        `/mind-insurance/insights?message=${mioMessage.id}`
      );
    }

    // Build response
    const response: InsightsReplyResponse = {
      success: true,
      user_message_id: userMessage.id,
      mio_response_id: mioMessage.id,
      mio_response: mioResponseText,
      reward_tier: rewardRoll.tier,
      patterns_detected: patternsDetected.map(p => ({
        pattern_name: p.pattern_name,
        confidence: p.confidence
      })),
      protocol_suggested,
      push_sent: pushSent
    };

    console.log('[MIO Reply] Success:', {
      user_message_id: userMessage.id,
      mio_response_id: mioMessage.id,
      reward_tier: rewardRoll.tier,
      patterns_count: patternsDetected.length
    });

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[MIO Reply] Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
