// ============================================================================
// SYNC CONVERSATION CONTEXT - Cross-Channel Memory Synchronization
// ============================================================================
// Triggered after voice calls (from vapi-call-complete) and after chat
// messages (from mio-chat) to maintain unified conversation memory.
//
// This function:
// 1. Fetches recent voice calls and chat messages
// 2. Generates a unified summary using AI (Gemini)
// 3. Extracts and merges topics from both channels
// 4. Formats context for voice (Vapi variableValues) and chat (system prompt)
// 5. Upserts the unified_conversation_context record
//
// Part of: Unified Conversation Memory Architecture (Part 2)
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// TYPES
// ============================================================================

interface SyncRequest {
  user_id: string;
  source_type: 'voice_call' | 'chat_message';
  source_id: string;  // vapi_call_logs.vapi_call_id or agent_conversations.id
}

interface VoiceCallLog {
  id: string;
  vapi_call_id: string;
  summary: string | null;
  topics: string[] | null;
  transcript: unknown;
  duration_seconds: number | null;
  created_at: string;
}

interface ChatMessage {
  id: string;
  user_message: string;
  agent_response: string;
  session_id: string | null;
  created_at: string;
}

interface UnifiedContextUpdate {
  user_id: string;
  conversation_summary?: string;
  key_topics?: string[];
  last_voice_call_id?: string | null;
  last_voice_summary?: string;
  last_voice_topics?: string[];
  voice_call_count?: number;
  last_chat_session_id?: string | null;
  last_chat_preview?: string;
  last_chat_topics?: string[];
  chat_message_count?: number;
  context_for_voice?: string;
  context_for_chat?: string;
  last_voice_at?: string;
  last_chat_at?: string;
}

// Grouphome-specific topics to detect (same as vapi-call-complete)
const GROUPHOME_TOPICS = [
  'licensing', 'permits', 'zoning', 'regulations', 'compliance',
  'property', 'location', 'revenue', 'expenses', 'staffing',
  'residents', 'insurance', 'financing', 'timeline', 'strategy',
  'assessment', 'journey', 'tactics', 'progress', 'motivation'
];

// ============================================================================
// DATA FETCHERS
// ============================================================================

async function fetchRecentVoiceCalls(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  limit: number = 5
): Promise<VoiceCallLog[]> {
  const { data, error } = await supabase
    .from('vapi_call_logs')
    .select('id, vapi_call_id, summary, topics, transcript, duration_seconds, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[sync-context] Error fetching voice calls:', error);
    return [];
  }

  return data || [];
}

async function fetchRecentChatMessages(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  limit: number = 20
): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('agent_conversations')
    .select('id, user_message, agent_response, session_id, created_at')
    .eq('user_id', userId)
    .eq('agent_type', 'nette')  // Only Nette conversations for unified context
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[sync-context] Error fetching chat messages:', error);
    return [];
  }

  return data || [];
}

// ============================================================================
// AI SUMMARY GENERATION (Using Gemini for cost efficiency)
// ============================================================================

async function generateUnifiedSummary(
  voiceCalls: VoiceCallLog[],
  chatMessages: ChatMessage[],
  geminiKey: string
): Promise<{ summary: string; topics: string[] } | null> {
  // Build interaction history
  const interactions: Array<{
    type: string;
    date: string;
    content: string;
  }> = [];

  // Add voice call summaries
  for (const call of voiceCalls.slice(0, 5)) {
    if (call.summary) {
      interactions.push({
        type: 'voice_call',
        date: call.created_at,
        content: call.summary
      });
    }
  }

  // Add recent chat exchanges (summarized)
  for (const chat of chatMessages.slice(0, 10)) {
    const preview = chat.user_message.length > 150
      ? chat.user_message.slice(0, 150) + '...'
      : chat.user_message;
    interactions.push({
      type: 'chat_message',
      date: chat.created_at,
      content: `User asked: "${preview}"`
    });
  }

  // Sort by date (newest first)
  interactions.sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // If no meaningful interactions, return null
  if (interactions.length === 0) {
    console.log('[sync-context] No interactions to summarize');
    return null;
  }

  const prompt = `You are analyzing a user's recent conversations with Nette, an AI Group Home Expert.

The user has interacted via both voice calls and text chat. Create a BRIEF summary (2-3 sentences) that captures:
1. Key topics they've discussed
2. Their current stage/focus in the group home journey
3. Any specific concerns or questions they have

Also extract relevant topics from this list: ${GROUPHOME_TOPICS.join(', ')}

Recent interactions (newest first):
${JSON.stringify(interactions.slice(0, 8), null, 2)}

Respond in this EXACT JSON format:
{
  "summary": "Brief 2-3 sentence summary here",
  "topics": ["topic1", "topic2"]
}

ONLY output valid JSON, no explanation.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 300
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[sync-context] Gemini API error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.error('[sync-context] No content in Gemini response');
      return null;
    }

    // Parse JSON response
    const parsed = JSON.parse(text);

    // Validate and filter topics
    const validTopics = Array.isArray(parsed.topics)
      ? parsed.topics.filter((t: string) =>
          GROUPHOME_TOPICS.includes(t.toLowerCase())
        ).slice(0, 8)
      : [];

    console.log('[sync-context] Summary generated:', {
      summaryLength: parsed.summary?.length || 0,
      topicsCount: validTopics.length
    });

    return {
      summary: parsed.summary || '',
      topics: validTopics
    };

  } catch (error) {
    console.error('[sync-context] Error generating summary:', error);
    return null;
  }
}

// ============================================================================
// CONTEXT FORMATTERS
// ============================================================================

/**
 * Format context for Vapi voice calls (variableValues.recentChats)
 * Should be concise and voice-friendly
 */
function formatContextForVoice(
  chatMessages: ChatMessage[],
  unifiedSummary: string | null
): string {
  const lines: string[] = [];

  if (unifiedSummary) {
    lines.push('CONVERSATION OVERVIEW:');
    lines.push(unifiedSummary);
    lines.push('');
  }

  if (chatMessages.length > 0) {
    lines.push('RECENT TEXT CONVERSATIONS:');

    // Take most recent 5 chat exchanges
    for (const chat of chatMessages.slice(0, 5)) {
      const date = new Date(chat.created_at);
      const daysAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
      const timeAgo = daysAgo === 0 ? 'Today' :
                      daysAgo === 1 ? 'Yesterday' :
                      `${daysAgo} days ago`;

      const preview = chat.user_message.length > 100
        ? chat.user_message.slice(0, 100) + '...'
        : chat.user_message;

      lines.push(`- ${timeAgo}: User asked about "${preview}"`);
    }
  }

  return lines.join('\n').trim() || '';
}

/**
 * Format context for mio-chat (system prompt addition)
 * Can be slightly more detailed than voice
 */
function formatContextForChat(
  voiceCalls: VoiceCallLog[],
  unifiedSummary: string | null
): string {
  const lines: string[] = [];

  if (unifiedSummary) {
    lines.push('=== CONVERSATION HISTORY SUMMARY ===');
    lines.push(unifiedSummary);
    lines.push('');
  }

  // Get recent voice calls with summaries
  const callsWithSummary = voiceCalls.filter(c => c.summary);

  if (callsWithSummary.length > 0) {
    lines.push('=== RECENT VOICE CALLS ===');

    for (const call of callsWithSummary.slice(0, 3)) {
      const date = new Date(call.created_at);
      const daysAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
      const timeAgo = daysAgo === 0 ? 'Today' :
                      daysAgo === 1 ? 'Yesterday' :
                      `${daysAgo} days ago`;
      const duration = call.duration_seconds
        ? ` (${Math.round(call.duration_seconds / 60)} min)`
        : '';

      lines.push(`Voice call${duration} - ${timeAgo}:`);
      lines.push(call.summary!);

      if (call.topics && call.topics.length > 0) {
        lines.push(`Topics: ${call.topics.join(', ')}`);
      }
      lines.push('');
    }
  }

  return lines.join('\n').trim() || '';
}

// ============================================================================
// TOPIC MERGER
// ============================================================================

function mergeTopics(
  voiceCalls: VoiceCallLog[],
  summaryTopics: string[]
): string[] {
  const topicSet = new Set<string>();

  // Add topics from voice calls
  for (const call of voiceCalls) {
    if (call.topics) {
      for (const topic of call.topics) {
        if (GROUPHOME_TOPICS.includes(topic.toLowerCase())) {
          topicSet.add(topic.toLowerCase());
        }
      }
    }
  }

  // Add topics from summary
  for (const topic of summaryTopics) {
    topicSet.add(topic.toLowerCase());
  }

  // Return as array, limited to 10
  return Array.from(topicSet).slice(0, 10);
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
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const geminiKey = Deno.env.get('GEMINI_API_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[sync-context] Missing Supabase credentials');
      return new Response(
        JSON.stringify({ success: false, error: 'Database not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: SyncRequest = await req.json();
    const { user_id, source_type, source_id } = body;

    if (!user_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing user_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[sync-context] Processing sync:', { user_id, source_type, source_id });

    // Initialize Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch recent interactions from both channels
    const [voiceCalls, chatMessages] = await Promise.all([
      fetchRecentVoiceCalls(supabase, user_id, 5),
      fetchRecentChatMessages(supabase, user_id, 20)
    ]);

    console.log('[sync-context] Fetched data:', {
      voiceCalls: voiceCalls.length,
      chatMessages: chatMessages.length
    });

    // Generate unified summary if we have Gemini key
    let summaryResult: { summary: string; topics: string[] } | null = null;
    if (geminiKey && (voiceCalls.length > 0 || chatMessages.length > 0)) {
      summaryResult = await generateUnifiedSummary(voiceCalls, chatMessages, geminiKey);
    }

    // Merge topics from all sources
    const mergedTopics = mergeTopics(voiceCalls, summaryResult?.topics || []);

    // Format context strings for injection
    const contextForVoice = formatContextForVoice(chatMessages, summaryResult?.summary || null);
    const contextForChat = formatContextForChat(voiceCalls, summaryResult?.summary || null);

    // Get the most recent voice call
    const lastVoiceCall = voiceCalls.length > 0 ? voiceCalls[0] : null;

    // Get the most recent chat session
    const lastChatSession = chatMessages.length > 0 ? chatMessages[0] : null;

    // Extract topics from recent voice calls
    const voiceTopics = voiceCalls
      .flatMap(c => c.topics || [])
      .filter((t, i, arr) => arr.indexOf(t) === i)
      .slice(0, 8);

    // Build update payload
    const updatePayload: UnifiedContextUpdate = {
      user_id,
      conversation_summary: summaryResult?.summary || null,
      key_topics: mergedTopics,
      last_voice_call_id: lastVoiceCall?.id || null,
      last_voice_summary: lastVoiceCall?.summary || null,
      last_voice_topics: voiceTopics,
      voice_call_count: voiceCalls.length,
      last_chat_session_id: lastChatSession?.session_id || null,
      last_chat_preview: lastChatSession?.user_message?.slice(0, 200) || null,
      last_chat_topics: [], // TODO: Extract topics from chat if needed
      chat_message_count: chatMessages.length,
      context_for_voice: contextForVoice || null,
      context_for_chat: contextForChat || null,
      last_voice_at: lastVoiceCall?.created_at || null,
      last_chat_at: lastChatSession?.created_at || null
    };

    // Upsert the unified context (insert or update)
    const { error: upsertError } = await supabase
      .from('unified_conversation_context')
      .upsert(updatePayload, {
        onConflict: 'user_id'
      });

    if (upsertError) {
      console.error('[sync-context] Error upserting context:', upsertError);

      // Log the failure
      await supabase.from('conversation_sync_log').insert({
        user_id,
        source_type,
        source_id,
        context_updated: false,
        error_message: upsertError.message
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to update unified context',
          details: upsertError.message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the successful sync
    await supabase.from('conversation_sync_log').insert({
      user_id,
      source_type,
      source_id,
      summary_generated: summaryResult?.summary || null,
      topics_extracted: mergedTopics,
      context_updated: true
    });

    console.log('[sync-context] Sync completed successfully:', {
      user_id,
      hasSummary: !!summaryResult?.summary,
      topicsCount: mergedTopics.length,
      voiceContextLength: contextForVoice.length,
      chatContextLength: contextForChat.length
    });

    return new Response(
      JSON.stringify({
        success: true,
        summary_generated: !!summaryResult?.summary,
        topics_count: mergedTopics.length,
        voice_context_length: contextForVoice.length,
        chat_context_length: contextForChat.length
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[sync-context] Exception:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
