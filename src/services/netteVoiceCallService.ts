/**
 * Nette Voice Call Service
 *
 * Provides functionality for fetching and managing voice call data
 * for the Nette AI Voice ↔ Text Context Synchronization feature.
 *
 * @module services/netteVoiceCallService
 */

import { supabase } from '@/integrations/supabase/client';

// =====================================================
// Types
// =====================================================

export interface NetteVoiceCallLog {
  id: string;
  ghl_call_id: string;
  ghl_contact_id: string | null;
  phone: string | null;
  direction: 'inbound' | 'outbound_proactive' | 'outbound_widget';
  call_duration_seconds: number | null;
  call_status: 'completed' | 'missed' | 'voicemail' | 'failed' | 'in_progress' | null;
  full_transcript: string | null;
  parsed_messages: VoiceMessage[] | null;
  ai_summary: string | null;
  topics_discussed: string[] | null;
  context_snapshot: Record<string, unknown> | null;
  recording_url: string | null;
  trigger_type: string | null;
  detected_sentiment: string | null;
  synced_to_chat: boolean;
  synced_at: string | null;
  chat_message_id: string | null;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
}

export interface VoiceMessage {
  role: 'user' | 'nette';
  content: string;
  timestamp: string;
}

export interface VoiceCallForChat {
  id: string;
  ai_summary: string | null;
  topics_discussed: string[] | null;
  call_duration_seconds: number | null;
  direction: string;
  full_transcript: string | null;
  parsed_messages: VoiceMessage[] | null;
  recording_url: string | null;
  synced_to_chat: boolean;
  created_at: string;
}

export interface VoiceCallSummary {
  call_id: string;
  ghl_call_id: string;
  ai_summary: string | null;
  topics_discussed: string[] | null;
  call_duration_seconds: number | null;
  direction: string;
  created_at: string;
}

// =====================================================
// Service Functions
// =====================================================

/**
 * Fetch voice calls for display in chat UI
 * Returns completed calls with transcripts, optionally filtered by date
 */
export async function fetchVoiceCallsForChat(
  userId: string,
  since?: Date
): Promise<VoiceCallForChat[]> {
  try {
    const { data, error } = await supabase.rpc('get_nette_voice_calls_for_chat', {
      p_user_id: userId,
      p_since: since?.toISOString() ?? null
    });

    if (error) {
      console.error('[NetteVoiceCallService] Error fetching voice calls:', error);
      throw error;
    }

    return (data as VoiceCallForChat[]) || [];
  } catch (err) {
    console.error('[NetteVoiceCallService] fetchVoiceCallsForChat failed:', err);
    return [];
  }
}

/**
 * Fetch recent voice calls for context building
 * Used by N8n workflows to provide context to text Nette
 */
export async function fetchRecentVoiceCalls(
  userId: string,
  limit: number = 3
): Promise<VoiceCallSummary[]> {
  try {
    const { data, error } = await supabase.rpc('get_recent_nette_voice_calls', {
      p_user_id: userId,
      p_limit: limit
    });

    if (error) {
      console.error('[NetteVoiceCallService] Error fetching recent voice calls:', error);
      throw error;
    }

    return (data as VoiceCallSummary[]) || [];
  } catch (err) {
    console.error('[NetteVoiceCallService] fetchRecentVoiceCalls failed:', err);
    return [];
  }
}

/**
 * Fetch a single voice call by ID
 */
export async function fetchVoiceCallById(
  callId: string
): Promise<NetteVoiceCallLog | null> {
  try {
    const { data, error } = await supabase
      .from('nette_voice_call_logs')
      .select('*')
      .eq('id', callId)
      .single();

    if (error) {
      console.error('[NetteVoiceCallService] Error fetching voice call:', error);
      throw error;
    }

    return data as NetteVoiceCallLog;
  } catch (err) {
    console.error('[NetteVoiceCallService] fetchVoiceCallById failed:', err);
    return null;
  }
}

/**
 * Mark a voice call as synced to chat
 */
export async function markVoiceCallSynced(
  callId: string,
  chatMessageId?: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('mark_nette_voice_call_synced', {
      p_call_id: callId,
      p_chat_message_id: chatMessageId ?? null
    });

    if (error) {
      console.error('[NetteVoiceCallService] Error marking call synced:', error);
      throw error;
    }

    return data as boolean;
  } catch (err) {
    console.error('[NetteVoiceCallService] markVoiceCallSynced failed:', err);
    return false;
  }
}

/**
 * Subscribe to new voice calls for real-time updates
 * Returns an unsubscribe function
 */
export function subscribeToVoiceCalls(
  userId: string,
  onNewCall: (call: NetteVoiceCallLog) => void
): () => void {
  const channel = supabase
    .channel(`nette_voice_calls_${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'nette_voice_call_logs',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        console.log('[NetteVoiceCallService] New voice call:', payload.new);
        onNewCall(payload.new as NetteVoiceCallLog);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'nette_voice_call_logs',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        // Only notify on significant updates (transcript added, etc.)
        const call = payload.new as NetteVoiceCallLog;
        if (call.call_status === 'completed' && call.full_transcript) {
          console.log('[NetteVoiceCallService] Voice call completed:', call.id);
          onNewCall(call);
        }
      }
    )
    .subscribe();

  return () => {
    console.log('[NetteVoiceCallService] Unsubscribing from voice calls');
    supabase.removeChannel(channel);
  };
}

/**
 * Format duration in seconds to human-readable string
 */
export function formatCallDuration(seconds: number | null): string {
  if (!seconds || seconds === 0) return '0:00';

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes === 0) {
    return `${remainingSeconds}s`;
  }

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Format voice call direction to human-readable string
 */
export function formatCallDirection(direction: string): string {
  switch (direction) {
    case 'inbound':
      return 'Incoming call';
    case 'outbound_proactive':
      return 'Nette called you';
    case 'outbound_widget':
      return 'You called Nette';
    default:
      return 'Voice call';
  }
}

/**
 * Extract topics from transcript using simple keyword extraction
 * This is a fallback when AI summary is not available
 */
export function extractTopicsFromTranscript(transcript: string): string[] {
  if (!transcript) return [];

  // Common Nette/Grouphome-related topic keywords
  const topicKeywords = [
    'property', 'license', 'licensing', 'investment', 'financing',
    'location', 'zoning', 'compliance', 'regulations', 'permits',
    'revenue', 'expenses', 'cashflow', 'residents', 'staffing',
    'operations', 'marketing', 'occupancy', 'insurance', 'legal',
    'business plan', 'startup', 'growth', 'strategy', 'timeline',
    'funding', 'loan', 'equity', 'partnership', 'due diligence'
  ];

  const lowercaseTranscript = transcript.toLowerCase();
  const foundTopics: string[] = [];

  for (const keyword of topicKeywords) {
    if (lowercaseTranscript.includes(keyword)) {
      foundTopics.push(keyword);
    }
  }

  // Return unique topics, max 5
  return [...new Set(foundTopics)].slice(0, 5);
}

/**
 * Build context string for text Nette from recent voice calls
 */
export function buildVoiceContextForNette(calls: VoiceCallSummary[]): string {
  if (!calls || calls.length === 0) {
    return '';
  }

  const contextLines = ['## RECENT VOICE CALLS WITH NETTE'];

  for (const call of calls) {
    const date = new Date(call.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
    const duration = formatCallDuration(call.call_duration_seconds);
    const topics = call.topics_discussed?.join(', ') || 'general discussion';
    const summary = call.ai_summary || 'No summary available';

    contextLines.push(`- ${date}: ${summary} (${duration}, topics: ${topics})`);
  }

  return contextLines.join('\n');
}

export default {
  fetchVoiceCallsForChat,
  fetchRecentVoiceCalls,
  fetchVoiceCallById,
  markVoiceCallSynced,
  subscribeToVoiceCalls,
  formatCallDuration,
  formatCallDirection,
  extractTopicsFromTranscript,
  buildVoiceContextForNette
};
