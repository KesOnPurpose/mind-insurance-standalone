/**
 * Voice Call Service (Vapi-Only)
 *
 * Provides functionality for fetching and managing voice call data
 * for the Nette AI Voice ↔ Text Context Synchronization feature.
 *
 * UPDATED: Now uses Vapi-only system. GHL voice system has been decommissioned.
 * Queries vapi_call_logs table via get_vapi_voice_calls_for_chat RPC.
 *
 * @module services/netteVoiceCallService
 */

import { supabase } from '@/integrations/supabase/client';

// =====================================================
// Types
// =====================================================

export interface NetteVoiceCallLog {
  id: string;
  vapi_call_id: string;
  assistant_id: string | null;
  assistant_variant: string | null;
  direction: 'inbound' | 'outbound' | 'web';
  call_duration_seconds: number | null;
  call_status: 'completed' | 'in-progress' | 'failed' | 'queued' | null;
  full_transcript: string | null;
  parsed_messages: VoiceMessage[] | null;
  ai_summary: string | null;
  topics_discussed: string[] | null;
  context_snapshot: Record<string, unknown> | null;
  recording_url: string | null;
  detected_sentiment: string | null;
  synced_to_chat: boolean;
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
  vapi_call_id: string;
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
 * Returns completed Vapi calls with transcripts, optionally filtered by date
 * UPDATED: Now queries vapi_call_logs via get_vapi_voice_calls_for_chat RPC
 */
export async function fetchVoiceCallsForChat(
  userId: string,
  since?: Date
): Promise<VoiceCallForChat[]> {
  try {
    const { data, error } = await supabase.rpc('get_vapi_voice_calls_for_chat', {
      p_user_id: userId,
      p_since: since?.toISOString() ?? null
    });

    if (error) {
      console.error('[VoiceCallService] Error fetching voice calls:', error);
      throw error;
    }

    console.log('[VoiceCallService] Loaded', (data || []).length, 'voice calls');
    return (data as VoiceCallForChat[]) || [];
  } catch (err) {
    console.error('[VoiceCallService] fetchVoiceCallsForChat failed:', err);
    return [];
  }
}

/**
 * Fetch recent voice calls for context building
 * Used by N8n workflows to provide context to text Nette
 * UPDATED: Now queries vapi_call_logs via get_recent_vapi_voice_calls RPC
 */
export async function fetchRecentVoiceCalls(
  userId: string,
  limit: number = 3
): Promise<VoiceCallSummary[]> {
  try {
    const { data, error } = await supabase.rpc('get_recent_vapi_voice_calls', {
      p_user_id: userId,
      p_limit: limit
    });

    if (error) {
      console.error('[VoiceCallService] Error fetching recent voice calls:', error);
      throw error;
    }

    return (data as VoiceCallSummary[]) || [];
  } catch (err) {
    console.error('[VoiceCallService] fetchRecentVoiceCalls failed:', err);
    return [];
  }
}

/**
 * Fetch a single voice call by ID
 * UPDATED: Now queries vapi_call_logs table
 */
export async function fetchVoiceCallById(
  callId: string
): Promise<NetteVoiceCallLog | null> {
  try {
    const { data, error } = await supabase
      .from('vapi_call_logs')
      .select(`
        id,
        vapi_call_id,
        assistant_id,
        assistant_variant,
        direction,
        duration_seconds,
        status,
        transcript,
        summary,
        topics,
        recording_url,
        sentiment,
        context_snapshot,
        started_at,
        ended_at,
        created_at
      `)
      .eq('id', callId)
      .single();

    if (error) {
      console.error('[VoiceCallService] Error fetching voice call:', error);
      throw error;
    }

    // Map to NetteVoiceCallLog interface
    return {
      id: data.id,
      vapi_call_id: data.vapi_call_id,
      assistant_id: data.assistant_id,
      assistant_variant: data.assistant_variant,
      direction: data.direction || 'web',
      call_duration_seconds: data.duration_seconds,
      call_status: data.status,
      full_transcript: typeof data.transcript === 'string' ? data.transcript : null,
      parsed_messages: Array.isArray(data.transcript) ? data.transcript : null,
      ai_summary: data.summary,
      topics_discussed: data.topics,
      context_snapshot: data.context_snapshot,
      recording_url: data.recording_url,
      detected_sentiment: data.sentiment,
      synced_to_chat: false,
      created_at: data.created_at,
      started_at: data.started_at,
      ended_at: data.ended_at
    } as NetteVoiceCallLog;
  } catch (err) {
    console.error('[VoiceCallService] fetchVoiceCallById failed:', err);
    return null;
  }
}

/**
 * Mark a voice call as synced to chat
 * DEPRECATED: Vapi calls don't use the sync mechanism. This is now a no-op.
 * Kept for backward compatibility with any code that might still call it.
 */
export async function markVoiceCallSynced(
  callId: string,
  chatMessageId?: string
): Promise<boolean> {
  // Vapi doesn't use the sync mechanism - calls are already unified
  console.log('[VoiceCallService] markVoiceCallSynced is deprecated (Vapi-only system):', callId);
  return true;
}

/**
 * Subscribe to new voice calls for real-time updates
 * Returns an unsubscribe function
 * UPDATED: Now subscribes to vapi_call_logs table
 */
export function subscribeToVoiceCalls(
  userId: string,
  onNewCall: (call: NetteVoiceCallLog) => void
): () => void {
  const channel = supabase
    .channel(`vapi_voice_calls_${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'vapi_call_logs',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        console.log('[VoiceCallService] New voice call:', payload.new);
        // Map Vapi payload to NetteVoiceCallLog interface
        const vapiCall = payload.new as Record<string, unknown>;
        const mappedCall: NetteVoiceCallLog = {
          id: vapiCall.id as string,
          vapi_call_id: vapiCall.vapi_call_id as string,
          assistant_id: vapiCall.assistant_id as string | null,
          assistant_variant: vapiCall.assistant_variant as string | null,
          direction: (vapiCall.direction as 'inbound' | 'outbound' | 'web') || 'web',
          call_duration_seconds: vapiCall.duration_seconds as number | null,
          call_status: vapiCall.status as 'completed' | 'in-progress' | 'failed' | 'queued' | null,
          full_transcript: null,
          parsed_messages: vapiCall.transcript as VoiceMessage[] | null,
          ai_summary: vapiCall.summary as string | null,
          topics_discussed: vapiCall.topics as string[] | null,
          context_snapshot: vapiCall.context_snapshot as Record<string, unknown> | null,
          recording_url: vapiCall.recording_url as string | null,
          detected_sentiment: vapiCall.sentiment as string | null,
          synced_to_chat: false,
          created_at: vapiCall.created_at as string,
          started_at: vapiCall.started_at as string | null,
          ended_at: vapiCall.ended_at as string | null
        };
        onNewCall(mappedCall);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'vapi_call_logs',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        // Only notify on significant updates (call completed with transcript)
        const vapiCall = payload.new as Record<string, unknown>;
        if (vapiCall.status === 'completed' && vapiCall.transcript) {
          console.log('[VoiceCallService] Voice call completed:', vapiCall.id);
          const mappedCall: NetteVoiceCallLog = {
            id: vapiCall.id as string,
            vapi_call_id: vapiCall.vapi_call_id as string,
            assistant_id: vapiCall.assistant_id as string | null,
            assistant_variant: vapiCall.assistant_variant as string | null,
            direction: (vapiCall.direction as 'inbound' | 'outbound' | 'web') || 'web',
            call_duration_seconds: vapiCall.duration_seconds as number | null,
            call_status: vapiCall.status as 'completed' | 'in-progress' | 'failed' | 'queued' | null,
            full_transcript: null,
            parsed_messages: vapiCall.transcript as VoiceMessage[] | null,
            ai_summary: vapiCall.summary as string | null,
            topics_discussed: vapiCall.topics as string[] | null,
            context_snapshot: vapiCall.context_snapshot as Record<string, unknown> | null,
            recording_url: vapiCall.recording_url as string | null,
            detected_sentiment: vapiCall.sentiment as string | null,
            synced_to_chat: false,
            created_at: vapiCall.created_at as string,
            started_at: vapiCall.started_at as string | null,
            ended_at: vapiCall.ended_at as string | null
          };
          onNewCall(mappedCall);
        }
      }
    )
    .subscribe();

  return () => {
    console.log('[VoiceCallService] Unsubscribing from voice calls');
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
