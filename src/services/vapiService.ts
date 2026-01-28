// ============================================================================
// VAPI SERVICE
// Frontend service for Vapi Voice AI integration
// Replaces GHL Voice AI with sub-500ms latency
// ============================================================================

import { supabase } from "@/integrations/supabase/client";
import { buildVoiceContext, type VoiceContextPayload } from "./voiceContextService";

// ============================================================================
// TYPES
// ============================================================================

export interface VapiAssistant {
  id: string;
  name: string;
  model: string;
  provider: 'anthropic' | 'openai';
}

export interface VapiContextResponse {
  success: boolean;
  user_context: string;
  assistant: VapiAssistant;
  metadata: {
    user_id: string;
    variant: 'claude' | 'gpt4';
    context_snapshot: Record<string, unknown>;
  };
  error?: string;
}

export interface VapiCallConfig {
  assistantId: string;
  assistantOverrides?: {
    variableValues?: Record<string, string>;
  };
  metadata?: Record<string, unknown>;
}

export interface VapiCallSession {
  callId: string;
  assistantId: string;
  variant: 'claude' | 'gpt4';
  startedAt: Date;
  userId: string;
  contextSnapshot: Record<string, unknown>;
}

export type VapiCallStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'speaking'
  | 'listening'
  | 'ended'
  | 'error';

export interface VapiCallEvent {
  type: 'status-update' | 'transcript' | 'error' | 'ended';
  status?: VapiCallStatus;
  transcript?: string;
  role?: 'user' | 'assistant';
  error?: string;
  endReason?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const VAPI_PUBLIC_KEY = '0cf6b672-55ae-4b2a-a249-7249068835fa'; // Public key for web SDK

const VAPI_ASSISTANTS = {
  claude: {
    id: '2e0dcaa8-4e9c-4c72-99f6-a19d87475147',
    name: 'nette-claude',
    model: 'claude-sonnet-4-20250514',
    provider: 'anthropic' as const
  },
  gpt4: {
    id: 'cab72f23-7e8d-4c84-a1ed-e0895ccb5bd7',
    name: 'nette-gpt4',
    model: 'gpt-4o',
    provider: 'openai' as const
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Build context string from VoiceContextPayload for Vapi
 */
function buildContextString(context: VoiceContextPayload): string {
  const lines: string[] = [];

  lines.push(`== USER CONTEXT ==`);
  lines.push(`Name: ${context.first_name}`);
  lines.push(`Greeting: ${context.greeting_name}`);
  lines.push(`Tier: ${context.tier_level}`);
  lines.push('');
  lines.push(`== JOURNEY PROGRESS ==`);
  lines.push(`Day: ${context.journey_day} of 90`);
  lines.push(`Week: ${context.journey_week} of 12`);
  lines.push(`Phase: ${context.journey_phase}`);
  lines.push(`Tactics Completed: ${context.tactics_completed}/${context.total_tactics} (${context.completion_rate}%)`);
  lines.push('');
  lines.push(`== ASSESSMENT RESULTS ==`);
  lines.push(`Readiness Level: ${context.readiness_level?.replace(/_/g, ' ')}`);
  lines.push(`Assessment Score: ${context.assessment_score}/100`);

  if (context.target_state) {
    lines.push(`Target State: ${context.target_state}`);
  }
  if (context.target_demographics && context.target_demographics !== 'Not specified') {
    lines.push(`Target Demographics: ${context.target_demographics}`);
  }
  if (context.ownership_model && context.ownership_model !== 'not_decided') {
    lines.push(`Ownership Model: ${context.ownership_model.replace(/_/g, ' ')}`);
  }
  if (context.immediate_priority && context.immediate_priority !== 'Not specified') {
    lines.push(`Immediate Priority: ${context.immediate_priority.replace(/_/g, ' ')}`);
  }

  lines.push('');
  lines.push(`== BUSINESS CONTEXT ==`);
  lines.push(`Capital Available: ${context.capital_available?.replace(/-/g, ' ')}`);
  lines.push(`Licensing Familiarity: ${context.licensing_familiarity?.replace(/-/g, ' ')}`);
  lines.push(`Caregiving Experience: ${context.caregiving_experience?.replace(/-/g, ' ')}`);
  lines.push(`Timeline: ${context.timeline?.replace(/-/g, ' ')}`);

  return lines.join('\n');
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Fetch call configuration from Edge Function
 * This includes user context and A/B test variant selection
 */
export async function fetchVapiCallConfig(
  userId: string,
  forceVariant?: 'claude' | 'gpt4'
): Promise<VapiContextResponse> {
  console.log('[vapiService] Fetching call config for user:', userId);

  try {
    const { data, error } = await supabase.functions.invoke('vapi-context-builder', {
      body: {
        user_id: userId,
        force_variant: forceVariant
      }
    });

    if (error) {
      console.error('[vapiService] Edge function error:', error);
      throw new Error(error.message);
    }

    console.log('[vapiService] Call config received:', {
      variant: data.assistant?.name,
      contextLength: data.user_context?.length
    });

    return data as VapiContextResponse;

  } catch (err) {
    console.error('[vapiService] fetchVapiCallConfig failed:', err);
    throw err;
  }
}

/**
 * Build call configuration from local context (fallback)
 * Use this when Edge Function is not available
 */
export async function buildLocalCallConfig(
  userId: string,
  forceVariant?: 'claude' | 'gpt4'
): Promise<VapiContextResponse> {
  console.log('[vapiService] Building local call config for user:', userId);

  try {
    // Build context using existing service
    const context = await buildVoiceContext(userId);
    const userContextString = buildContextString(context);

    // NEW: Fetch unified conversation context for cross-channel memory (chat → voice)
    // This enables voice calls to know about recent chat conversations with Nette
    let chatContext = '';

    // Strategy: Try client-side first (RLS-compliant), then fallback to Edge Function
    try {
      console.log('[vapiService] Attempting client-side context fetch for user:', userId);

      const { data: unifiedContext, error: unifiedError } = await supabase
        .from('unified_conversation_context')
        .select('context_for_voice')
        .eq('user_id', userId)
        .single();

      if (!unifiedError && unifiedContext?.context_for_voice) {
        chatContext = unifiedContext.context_for_voice;
        console.log('[vapiService] ✅ Chat context loaded via client:', {
          length: chatContext.length,
          preview: chatContext.substring(0, 150),
          hasContent: chatContext.length > 0
        });
      } else {
        // Client-side fetch failed or returned empty - try Edge Function fallback
        console.log('[vapiService] ⚠️ Client-side fetch failed, trying Edge Function fallback:', {
          error: unifiedError?.message || null,
          errorCode: unifiedError?.code || null,
          userId,
          dataReceived: !!unifiedContext
        });

        // Fallback: Call Edge Function which uses service role (bypasses RLS)
        try {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hpyodaugrkctagkrfofj.supabase.co';
          const { data: { session } } = await supabase.auth.getSession();

          console.log('[vapiService] Auth session state:', {
            hasSession: !!session,
            sessionUserId: session?.user?.id || null,
            matchesRequestedUserId: session?.user?.id === userId
          });

          if (session?.access_token) {
            const response = await fetch(
              `${supabaseUrl}/functions/v1/vapi-update-assistant`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                  action: 'get_voice_context',
                  user_id: userId
                })
              }
            );

            if (response.ok) {
              const result = await response.json();
              if (result.success && result.context_for_voice) {
                chatContext = result.context_for_voice;
                console.log('[vapiService] ✅ Chat context loaded via Edge Function fallback:', {
                  length: chatContext.length,
                  preview: chatContext.substring(0, 150)
                });
              } else {
                console.log('[vapiService] Edge Function returned no context:', result);
              }
            } else {
              const errorText = await response.text().catch(() => 'Unknown error');
              console.log('[vapiService] Edge Function fallback failed:', {
                status: response.status,
                error: errorText
              });
            }
          } else {
            console.log('[vapiService] No auth session available for Edge Function call');
          }
        } catch (fallbackError) {
          console.log('[vapiService] Edge Function fallback error:', fallbackError);
        }
      }
    } catch (contextError) {
      // Non-critical - continue without chat context
      console.log('[vapiService] Chat context fetch skipped:', contextError);
    }

    // Select assistant variant (random 50/50 if not forced)
    const variant = forceVariant || (Math.random() < 0.5 ? 'claude' : 'gpt4');
    const assistant = VAPI_ASSISTANTS[variant];

    return {
      success: true,
      user_context: userContextString,
      assistant,
      metadata: {
        user_id: userId,
        variant,
        context_snapshot: context as unknown as Record<string, unknown>,
        // NEW: Include chat context for injection into variableValues
        chat_context: chatContext
      }
    };

  } catch (err) {
    console.error('[vapiService] buildLocalCallConfig failed:', err);
    throw err;
  }
}

/**
 * Get Vapi public key for web SDK initialization
 */
export function getVapiPublicKey(): string {
  return VAPI_PUBLIC_KEY;
}

/**
 * Get assistant configuration by variant
 */
export function getAssistantByVariant(variant: 'claude' | 'gpt4'): VapiAssistant {
  return VAPI_ASSISTANTS[variant];
}

/**
 * Get all assistant configurations
 */
export function getAllAssistants(): { claude: VapiAssistant; gpt4: VapiAssistant } {
  return VAPI_ASSISTANTS;
}

// ============================================================================
// NAME CORRECTION UTILITIES
// ============================================================================

/**
 * Common TTS misheard variations of names
 * Maps incorrect spellings to regex patterns for replacement
 */
const NAME_VARIATIONS: Record<string, string[]> = {
  'Keston': ['Kaston', 'Keiston', 'Keaston', 'Caston', 'Kestin', 'Kesten'],
  'Nette': ['Nick', 'Net', 'Nat', 'Ned', 'Nett', 'Nanette']
};

/**
 * Phrase replacements for AI references in summaries
 * These replace common phrases where "AI" is used instead of "Nette"
 */
const AI_PHRASE_REPLACEMENTS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\bThe AI\b/gi, replacement: 'Nette' },
  { pattern: /\bthe AI\b/gi, replacement: 'Nette' },
  { pattern: /\ban AI\b/gi, replacement: 'Nette' },
  { pattern: /\bAI assistant\b/gi, replacement: 'Nette' },
  { pattern: /\bThe assistant\b/gi, replacement: 'Nette' },
  { pattern: /\bthe assistant\b/gi, replacement: 'Nette' },
];

/**
 * Correct common TTS transcription errors in transcript text
 * Uses the actual user name from context and fixes assistant name to "Nette"
 * Also replaces generic "AI" references with "Nette"
 * @param text - The transcript text to correct
 * @param actualUserName - The user's actual name from database
 */
export function correctTranscriptNames(text: string, actualUserName?: string): string {
  let corrected = text;

  // First, replace AI phrase references (e.g., "The AI noted" -> "Nette noted")
  for (const { pattern, replacement } of AI_PHRASE_REPLACEMENTS) {
    corrected = corrected.replace(pattern, replacement);
  }

  // Then correct assistant name variations to "Nette"
  const netteVariations = NAME_VARIATIONS['Nette'] || [];
  for (const variation of netteVariations) {
    // Use word boundary to avoid replacing parts of other words
    const regex = new RegExp(`\\b${variation}\\b`, 'gi');
    corrected = corrected.replace(regex, 'Nette');
  }

  // Correct user name if provided
  if (actualUserName) {
    // Find variations for this name if we have them
    const userVariations = NAME_VARIATIONS[actualUserName] || [];

    // Also create phonetic variations dynamically
    const dynamicVariations = generatePhoneticVariations(actualUserName);
    const allVariations = [...new Set([...userVariations, ...dynamicVariations])];

    for (const variation of allVariations) {
      if (variation.toLowerCase() !== actualUserName.toLowerCase()) {
        const regex = new RegExp(`\\b${variation}\\b`, 'gi');
        corrected = corrected.replace(regex, actualUserName);
      }
    }
  }

  return corrected;
}

/**
 * Generate phonetic variations of a name that TTS might mishear
 */
function generatePhoneticVariations(name: string): string[] {
  const variations: string[] = [];
  const lower = name.toLowerCase();

  // Common vowel substitutions
  const vowelSubs: Record<string, string[]> = {
    'e': ['a', 'i'],
    'a': ['e', 'o'],
    'i': ['e', 'y'],
    'o': ['a', 'u'],
    'u': ['o']
  };

  // Generate single-vowel substitutions
  for (let i = 0; i < lower.length; i++) {
    const char = lower[i];
    if (vowelSubs[char]) {
      for (const sub of vowelSubs[char]) {
        const variant = lower.slice(0, i) + sub + lower.slice(i + 1);
        // Capitalize first letter
        variations.push(variant.charAt(0).toUpperCase() + variant.slice(1));
      }
    }
  }

  return variations;
}

/**
 * Correct transcript entries array
 */
export function correctTranscriptEntries(
  entries: Array<{ role: string; text: string; timestamp?: string }>,
  actualUserName?: string
): Array<{ role: string; text: string; timestamp?: string }> {
  return entries.map(entry => ({
    ...entry,
    text: correctTranscriptNames(entry.text, actualUserName)
  }));
}

// ============================================================================
// STATUS FORMATTING
// ============================================================================

/**
 * Format call status for display
 */
export function formatCallStatus(status: VapiCallStatus): string {
  switch (status) {
    case 'idle':
      return 'Ready to call';
    case 'connecting':
      return 'Connecting...';
    case 'connected':
      return 'Connected';
    case 'speaking':
      return 'Nette is speaking...';
    case 'listening':
      return 'Listening...';
    case 'ended':
      return 'Call ended';
    case 'error':
      return 'Call error';
    default:
      return 'Unknown';
  }
}

/**
 * Log call event to Supabase
 * Creates initial record when call starts
 */
export async function logCallStart(
  session: VapiCallSession
): Promise<string | null> {
  console.log('[vapiService] Logging call start:', session.callId);

  try {
    // Use UPSERT to handle race condition with webhook
    // The webhook may create a record before this runs, so we need to update if exists
    const { data, error } = await supabase
      .from('vapi_call_logs')
      .upsert({
        vapi_call_id: session.callId,
        user_id: session.userId,
        assistant_id: session.assistantId,
        assistant_variant: session.variant,
        direction: 'web',
        started_at: session.startedAt.toISOString(),
        status: 'in-progress',
        context_snapshot: session.contextSnapshot
      }, {
        onConflict: 'vapi_call_id'
      })
      .select('id')
      .single();

    if (error) {
      console.error('[vapiService] Error logging call start:', error);
      return null;
    }

    return data.id;

  } catch (err) {
    console.error('[vapiService] logCallStart failed:', err);
    return null;
  }
}

/**
 * Transcript entry from a call
 */
export interface TranscriptEntry {
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

/**
 * Update call log when call ends
 */
export async function logCallEnd(
  vapiCallId: string,
  transcript?: TranscriptEntry[],
  durationSeconds?: number | null,
  endReason?: string
): Promise<boolean> {
  console.log('[vapiService] Logging call end:', vapiCallId, {
    transcriptLength: transcript?.length || 0,
    durationSeconds
  });

  try {
    // Build update payload
    const updatePayload: Record<string, unknown> = {
      ended_at: new Date().toISOString(),
      status: 'completed',
      end_reason: endReason || 'user-ended'
    };

    // Add duration if provided
    if (durationSeconds !== undefined && durationSeconds !== null) {
      updatePayload.duration_seconds = durationSeconds;
    }

    // Add transcript if provided (store as JSON array)
    if (transcript && transcript.length > 0) {
      // Convert transcript to a storable format
      const transcriptForStorage = transcript.map(entry => ({
        role: entry.role,
        text: entry.text,
        timestamp: entry.timestamp.toISOString()
      }));
      updatePayload.transcript = transcriptForStorage;
    }

    const { error } = await supabase
      .from('vapi_call_logs')
      .update(updatePayload)
      .eq('vapi_call_id', vapiCallId);

    if (error) {
      console.error('[vapiService] Error logging call end:', error);
      return false;
    }

    console.log('[vapiService] Call end logged successfully with transcript');
    return true;

  } catch (err) {
    console.error('[vapiService] logCallEnd failed:', err);
    return false;
  }
}

/**
 * Call log entry from database
 */
export interface VapiCallLog {
  id: string;
  vapi_call_id: string;
  assistant_variant: string;
  direction: string;
  duration_seconds: number | null;
  status: string;
  summary: string | null;
  topics: string[] | null;
  sentiment: string | null;
  recording_url: string | null;
  transcript: Array<{ role: string; text: string; timestamp: string }> | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
}

/**
 * Fetch recent Vapi call logs for a user
 */
export async function fetchVapiCallLogs(
  userId: string,
  options: {
    limit?: number;
    offset?: number;
    includeTranscript?: boolean;
  } = {}
): Promise<VapiCallLog[]> {
  const { limit = 10, offset = 0, includeTranscript = false } = options;
  console.log('[vapiService] Fetching call logs for user:', userId, { limit, offset });

  try {
    // Build select query - transcript is large so only include when needed
    const selectFields = `
      id,
      vapi_call_id,
      assistant_variant,
      direction,
      duration_seconds,
      status,
      summary,
      topics,
      sentiment,
      recording_url,
      started_at,
      ended_at,
      created_at
      ${includeTranscript ? ',transcript' : ''}
    `;

    const { data, error } = await supabase
      .from('vapi_call_logs')
      .select(selectFields)
      .eq('user_id', userId)
      .eq('hidden_by_user', false)  // Filter out hidden calls
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[vapiService] Error fetching call logs:', error);
      throw error;
    }

    return (data || []) as VapiCallLog[];

  } catch (err) {
    console.error('[vapiService] fetchVapiCallLogs failed:', err);
    return [];
  }
}

/**
 * Fetch a single call log with full transcript
 */
export async function fetchVapiCallDetail(
  vapiCallId: string
): Promise<VapiCallLog | null> {
  console.log('[vapiService] Fetching call detail:', vapiCallId);

  try {
    const { data, error } = await supabase
      .from('vapi_call_logs')
      .select(`
        id,
        vapi_call_id,
        assistant_variant,
        direction,
        duration_seconds,
        status,
        summary,
        topics,
        sentiment,
        recording_url,
        transcript,
        started_at,
        ended_at,
        created_at
      `)
      .eq('vapi_call_id', vapiCallId)
      .single();

    if (error) {
      console.error('[vapiService] Error fetching call detail:', error);
      return null;
    }

    return data as VapiCallLog;

  } catch (err) {
    console.error('[vapiService] fetchVapiCallDetail failed:', err);
    return null;
  }
}

/**
 * Get A/B test metrics for variant comparison
 */
export async function getVariantMetrics(): Promise<{
  claude: { totalCalls: number; avgDuration: number };
  gpt4: { totalCalls: number; avgDuration: number };
} | null> {
  console.log('[vapiService] Fetching variant metrics');

  try {
    const { data, error } = await supabase
      .from('vapi_assistant_config')
      .select('assistant_name, total_calls, avg_duration_seconds')
      .in('assistant_name', ['nette-claude', 'nette-gpt4']);

    if (error) {
      console.error('[vapiService] Error fetching metrics:', error);
      return null;
    }

    const metrics = {
      claude: { totalCalls: 0, avgDuration: 0 },
      gpt4: { totalCalls: 0, avgDuration: 0 }
    };

    for (const row of data || []) {
      if (row.assistant_name === 'nette-claude') {
        metrics.claude = {
          totalCalls: row.total_calls || 0,
          avgDuration: row.avg_duration_seconds || 0
        };
      } else if (row.assistant_name === 'nette-gpt4') {
        metrics.gpt4 = {
          totalCalls: row.total_calls || 0,
          avgDuration: row.avg_duration_seconds || 0
        };
      }
    }

    return metrics;

  } catch (err) {
    console.error('[vapiService] getVariantMetrics failed:', err);
    return null;
  }
}

/**
 * Hide a call from the user's view (soft delete)
 * The call remains in the database for admin/analytics purposes
 * @param callId - The database ID of the call log (not vapi_call_id)
 * @param userId - The user ID (for security - only allow hiding own calls)
 */
export async function hideVapiCall(callId: string, userId: string): Promise<boolean> {
  console.log('[vapiService] Hiding call:', callId, 'for user:', userId);

  try {
    const { error } = await supabase
      .from('vapi_call_logs')
      .update({ hidden_by_user: true })
      .eq('id', callId)
      .eq('user_id', userId);  // Security: only allow hiding own calls

    if (error) {
      console.error('[vapiService] Error hiding call:', error);
      return false;
    }

    console.log('[vapiService] Call hidden successfully');
    return true;

  } catch (err) {
    console.error('[vapiService] hideVapiCall failed:', err);
    return false;
  }
}

export default {
  fetchVapiCallConfig,
  buildLocalCallConfig,
  getVapiPublicKey,
  getAssistantByVariant,
  getAllAssistants,
  formatCallStatus,
  logCallStart,
  logCallEnd,
  fetchVapiCallLogs,
  fetchVapiCallDetail,
  getVariantMetrics,
  correctTranscriptNames,
  correctTranscriptEntries,
  hideVapiCall
};
