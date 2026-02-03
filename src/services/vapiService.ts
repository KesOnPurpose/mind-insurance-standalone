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

// Recency data for dynamic greetings
export interface RecencyData {
  minutes_ago: number;
  type: 'voice' | 'chat' | 'none';
  last_topic: string;
  greeting_style: 'continuation' | 'same_day' | 'recent' | 'reference' | 'fresh';
}

export interface VapiContextResponse {
  success: boolean;
  user_context: string;
  assistant: VapiAssistant;
  metadata: {
    user_id: string;
    variant: 'claude' | 'gpt4';
    context_snapshot: Record<string, unknown>;
    chat_context?: string;
  };
  // Recency data for dynamic, context-aware greetings
  recency?: RecencyData;
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
 * Build call configuration from local context with Edge Function recency data
 * Fetches recency data from vapi-context-builder for dynamic greetings
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

    // NEW: Fetch recency data and chat context from vapi-context-builder Edge Function
    // This enables dynamic, recency-aware greetings
    let chatContext = '';
    let recencyData: RecencyData | undefined;

    try {
      console.log('[vapiService] Fetching recency data from vapi-context-builder...');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hpyodaugrkctagkrfofj.supabase.co';
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.access_token) {
        const response = await fetch(
          `${supabaseUrl}/functions/v1/vapi-context-builder`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
              user_id: userId,
              force_variant: forceVariant
            })
          }
        );

        if (response.ok) {
          const result = await response.json();
          console.log('[vapiService] vapi-context-builder response:', {
            success: result.success,
            hasRecency: !!result.recency,
            hasChatContext: !!result.conversation_context
          });

          // Extract recency data for dynamic greetings
          if (result.recency) {
            recencyData = {
              minutes_ago: result.recency.minutes_ago,
              type: result.recency.type,
              last_topic: result.recency.last_topic,
              greeting_style: result.recency.greeting_style
            };
            console.log('[vapiService] ✅ Recency data loaded:', recencyData);
          }

          // Extract chat context for cross-channel memory
          if (result.conversation_context) {
            chatContext = result.conversation_context;
            console.log('[vapiService] ✅ Chat context loaded:', {
              length: chatContext.length,
              preview: chatContext.substring(0, 150)
            });
          }
        } else {
          const errorText = await response.text().catch(() => 'Unknown error');
          console.log('[vapiService] vapi-context-builder failed, falling back:', {
            status: response.status,
            error: errorText
          });
        }
      } else {
        console.log('[vapiService] No auth session, falling back to client-side fetch');
      }

      // Fallback: Try client-side unified_conversation_context if Edge Function failed
      if (!chatContext) {
        const { data: unifiedContext, error: unifiedError } = await supabase
          .from('unified_conversation_context')
          .select('context_for_voice')
          .eq('user_id', userId)
          .single();

        if (!unifiedError && unifiedContext?.context_for_voice) {
          chatContext = unifiedContext.context_for_voice;
          console.log('[vapiService] ✅ Chat context loaded via client fallback:', {
            length: chatContext.length
          });
        }
      }
    } catch (contextError) {
      // Non-critical - continue without recency/chat context
      console.log('[vapiService] Context fetch error (non-critical):', contextError);
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
        chat_context: chatContext
      },
      // Include recency data for dynamic greeting generation
      recency: recencyData
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
 * Assistant name variations (only for the AI assistant "Nette")
 * User names are handled dynamically via fuzzy matching — no hardcoding needed.
 */
const ASSISTANT_NAME_VARIATIONS: string[] = [
  'Nick', 'Net', 'Nat', 'Ned', 'Nett', 'Nanette', 'Annette', 'Lynette', 'Nate'
];

// ============================================================================
// UNIVERSAL FUZZY NAME MATCHING
// Works for ANY user name from the database — no hardcoded lists needed.
// Uses Levenshtein edit distance + phonetic first-letter matching to catch
// STT misheard names (e.g., "Kes" → "Cass", "Kiss", "Cash", etc.)
// ============================================================================

/**
 * Compute Levenshtein edit distance between two strings (case-insensitive)
 */
function levenshteinDistance(a: string, b: string): number {
  const la = a.toLowerCase();
  const lb = b.toLowerCase();
  const m = la.length;
  const n = lb.length;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = la[i - 1] === lb[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

/**
 * Phonetic equivalence groups — letters that STT commonly swaps.
 * If two letters share a group, they're considered "phonetically similar".
 */
const PHONETIC_GROUPS: string[][] = [
  ['k', 'c', 'g', 'q'],     // hard consonants
  ['s', 'z', 'c', 'ss'],    // sibilants
  ['v', 'b', 'f', 'w'],     // labial consonants
  ['d', 't'],                // dental stops
  ['n', 'm'],                // nasals
  ['l', 'r'],                // liquids
  ['j', 'g', 'y'],          // palatal
  ['e', 'a', 'i'],          // front vowels (STT frequently swaps)
  ['o', 'u', 'a'],          // back vowels
];

/**
 * Check if two characters are phonetically similar (commonly confused by STT)
 */
function arePhoneticallySimilar(a: string, b: string): boolean {
  const la = a.toLowerCase();
  const lb = b.toLowerCase();
  if (la === lb) return true;
  return PHONETIC_GROUPS.some(group => group.includes(la) && group.includes(lb));
}

/**
 * Common English words to NEVER replace, even if they're within edit distance.
 * This prevents false positives for short names.
 */
const COMMON_WORDS_BLOCKLIST = new Set([
  'the', 'this', 'that', 'then', 'them', 'they', 'than', 'thus',
  'was', 'has', 'his', 'her', 'she', 'and', 'are', 'but', 'not',
  'for', 'you', 'all', 'can', 'had', 'one', 'our', 'out', 'day',
  'get', 'has', 'him', 'how', 'its', 'may', 'new', 'now', 'old',
  'see', 'way', 'who', 'did', 'let', 'say', 'too', 'use', 'yes',
  'yet', 'also', 'just', 'been', 'more', 'some', 'time', 'very',
  'when', 'come', 'make', 'like', 'long', 'look', 'many', 'over',
  'such', 'take', 'into', 'year', 'back', 'give', 'most', 'only',
  'tell', 'well', 'here', 'know', 'will', 'with', 'what', 'from',
  'have', 'been', 'keep', 'help', 'went', 'need', 'kind', 'mind',
  'feel', 'life', 'work', 'good', 'your', 'were', 'much', 'each',
  'said', 'does', 'done', 'it', 'is', 'as', 'at', 'be', 'by',
  'do', 'if', 'in', 'me', 'my', 'no', 'of', 'on', 'or', 'so',
  'to', 'up', 'us', 'we', 'an', 'he', 'go', 'am', 'ok', 'hi',
  'about', 'would', 'could', 'should', 'their', 'there', 'these',
  'those', 'which', 'while', 'being', 'other', 'still', 'think',
  'start', 'first', 'great', 'right', 'thing', 'going', 'after',
  'never', 'every', 'world', 'today', 'might', 'where', 'again',
]);

/**
 * Determine the maximum allowed edit distance for fuzzy matching
 * based on the length of the target name.
 * Shorter names get tighter thresholds to avoid false positives.
 */
function getMaxEditDistance(nameLength: number): number {
  if (nameLength <= 2) return 1;
  if (nameLength <= 4) return 2;
  if (nameLength <= 6) return 2;
  return 3;
}

/**
 * Check if a word from transcript text is likely a misheard version of the user's name.
 * Uses multiple signals: edit distance, phonetic first-letter similarity, length similarity.
 * Returns true only when confident this is a name mishearing, not a common word.
 */
function isFuzzyNameMatch(word: string, targetName: string): boolean {
  const w = word.toLowerCase();
  const t = targetName.toLowerCase();

  // Exact match — not a "mishearing", just correct
  if (w === t) return false;

  // Never replace common English words
  if (COMMON_WORDS_BLOCKLIST.has(w)) return false;

  // Length must be within reasonable range (STT doesn't wildly change word length)
  const lengthDiff = Math.abs(w.length - t.length);
  if (lengthDiff > 2) return false;

  // First letter must be phonetically similar (STT preserves initial sound most of the time)
  if (!arePhoneticallySimilar(w[0], t[0])) return false;

  // Compute edit distance
  const distance = levenshteinDistance(w, t);
  const maxDistance = getMaxEditDistance(t.length);

  return distance <= maxDistance;
}

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
 * Correct TTS transcription errors in transcript text using UNIVERSAL fuzzy matching.
 * Works for ANY user name from the database — no hardcoded name lists needed.
 *
 * Strategy:
 * 1. Fix "AI"/"assistant" references → "Nette"
 * 2. Fix assistant name mishearings → "Nette" (small hardcoded list, always the same AI)
 * 3. Fix user name mishearings → actual user name (via Levenshtein fuzzy matching)
 *
 * @param text - The transcript text to correct
 * @param actualUserName - The user's actual name from their database profile
 */
export function correctTranscriptNames(text: string, actualUserName?: string): string {
  let corrected = text;

  // 1. Replace AI phrase references (e.g., "The AI noted" → "Nette noted")
  for (const { pattern, replacement } of AI_PHRASE_REPLACEMENTS) {
    corrected = corrected.replace(pattern, replacement);
  }

  // 2. Correct assistant name variations to "Nette"
  for (const variation of ASSISTANT_NAME_VARIATIONS) {
    const regex = new RegExp(`\\b${variation}\\b`, 'gi');
    corrected = corrected.replace(regex, 'Nette');
  }

  // 3. Correct user name using universal fuzzy matching
  if (actualUserName && actualUserName.length >= 2) {
    // Split text into words, check each against the user's name
    // Replace words that fuzzy-match the user's name
    corrected = corrected.replace(/\b[A-Za-z]+(?:'s)?\b/g, (match) => {
      // Handle possessives: "Kiss's" → check "Kiss", replace as "Kes's"
      const isPossessive = match.endsWith("'s");
      const baseWord = isPossessive ? match.slice(0, -2) : match;

      if (isFuzzyNameMatch(baseWord, actualUserName)) {
        // Preserve the original casing style
        const replacement = baseWord[0] === baseWord[0].toUpperCase()
          ? actualUserName.charAt(0).toUpperCase() + actualUserName.slice(1)
          : actualUserName.toLowerCase();
        return isPossessive ? `${replacement}'s` : replacement;
      }
      return match;
    });
  }

  return corrected;
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
