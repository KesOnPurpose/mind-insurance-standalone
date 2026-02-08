// ============================================================================
// MEMORY SERVICE
// Extracts, stores, and retrieves conversation memories for each user.
// This is what makes the system "remember" - connecting insights across sessions,
// recalling what techniques were tried, and threading breakthroughs over time.
//
// Two components:
//   1. Memory Extraction: After each exchange, extract memorable elements
//   2. Memory Retrieval: Before each response, fetch relevant past memories
//
// The combination creates the "you mentioned 3 weeks ago..." experience.
// ============================================================================

import { supabase } from '@/integrations/supabase/client';
import type { AffectProfile } from './affect-detection-service';

// ============================================================================
// TYPES
// ============================================================================

export type MemoryType =
  | 'insight'           // User gained a new understanding
  | 'breakthrough'      // Significant positive shift
  | 'setback'           // Regression or negative event
  | 'technique_tried'   // User attempted a recommended technique
  | 'pattern_detected'  // A relational pattern was identified
  | 'goal_set'          // User committed to a goal
  | 'trigger_identified' // A trigger was discovered
  | 'strength_observed' // A strength was noticed
  | 'context_revealed'  // New background information shared
  | 'homework_assigned'; // A task was given for between sessions

export interface ConversationMemory {
  id: string;
  user_id: string;
  session_id: string;
  memory_type: MemoryType;
  memory_text: string;
  memory_embedding: number[] | null;
  source_message: string | null;
  frameworks_referenced: string[];
  issues_referenced: string[];
  emotional_context: Record<string, unknown>;
  importance_score: number;
  is_active: boolean;
  superseded_by: string | null;
  created_at: string;
}

export interface RetrievedMemory {
  id: string;
  memory_type: MemoryType;
  memory_text: string;
  importance_score: number;
  frameworks_referenced: string[];
  issues_referenced: string[];
  emotional_context: Record<string, unknown>;
  created_at: string;
  similarity: number;
  recency_weight: number;
  combined_score: number;
}

export interface SessionSummary {
  id: string;
  user_id: string;
  session_id: string;
  session_number: number;
  summary_text: string;
  key_topics: string[];
  techniques_discussed: string[];
  homework_assigned: string[];
  homework_completed: string[];
  affect_trajectory: Record<string, unknown>;
  triage_colors_seen: string[];
  breakthrough_moment: string | null;
  message_count: number;
  created_at: string;
}

// ============================================================================
// MEMORY EXTRACTION
// ============================================================================

// Pattern-based extraction rules (fast, no LLM needed)
const MEMORY_EXTRACTION_RULES: Array<{
  type: MemoryType;
  patterns: RegExp[];
  importance: number;
}> = [
  {
    type: 'breakthrough',
    patterns: [
      /we (actually|finally) (talked|communicated|connected|listened)/i,
      /something (clicked|shifted|changed)/i,
      /for the first time/i,
      /i (realized|finally understand|see it now)/i,
      /it worked/i,
      /we made (progress|a breakthrough)/i,
    ],
    importance: 0.9,
  },
  {
    type: 'technique_tried',
    patterns: [
      /i tried (the|that|your|what you)/i,
      /we (did|tried|attempted|practiced) the/i,
      /i used (the|that) (technique|exercise|script)/i,
      /we (had|did) (a|the) (date night|check-in|conversation)/i,
    ],
    importance: 0.8,
  },
  {
    type: 'trigger_identified',
    patterns: [
      /what triggers me is/i,
      /i (get|become) (triggered|upset|angry|shut down) when/i,
      /every time (he|she|they) (does|says|mentions)/i,
      /it reminds me of/i,
      /that's (exactly|just) what my (mom|dad|ex|parent)/i,
    ],
    importance: 0.85,
  },
  {
    type: 'context_revealed',
    patterns: [
      /i (never|haven't) told (anyone|you) (this|about)/i,
      /growing up/i,
      /my (childhood|parents|family|ex)/i,
      /when i was (young|a (kid|child))/i,
      /(first|second|third) marriage/i,
      /we've been (together|married) for/i,
      /i'm (also|actually) dealing with/i,
    ],
    importance: 0.75,
  },
  {
    type: 'setback',
    patterns: [
      /we (had|got into) (another|a big) (fight|argument)/i,
      /it happened again/i,
      /(relapsed|went back|fell back)/i,
      /things (got|are getting) worse/i,
      /i (messed up|blew it|lost it)/i,
    ],
    importance: 0.7,
  },
  {
    type: 'goal_set',
    patterns: [
      /i('m going to| will| want to) (try|start|commit|work on)/i,
      /my goal is/i,
      /this week i'll/i,
      /i promise to/i,
      /we agreed to/i,
    ],
    importance: 0.7,
  },
  {
    type: 'insight',
    patterns: [
      /i (just|never|finally) (realized|noticed|understood|saw)/i,
      /it makes sense (now|why)/i,
      /maybe (i'm|i am|the reason)/i,
      /i think the pattern is/i,
      /so that's why/i,
    ],
    importance: 0.65,
  },
  {
    type: 'strength_observed',
    patterns: [
      /i'm (proud|grateful) (of|that|for)/i,
      /we (handled|managed|navigated) (that|it) (well|better)/i,
      /that's (progress|growth|improvement)/i,
      /we didn't (fight|argue|shut down) this time/i,
    ],
    importance: 0.7,
  },
];

/**
 * Extract memorable elements from a user message.
 * Returns an array of memories to be stored.
 */
export function extractMemoriesFromMessage(
  userMessage: string,
  sessionId: string,
  affect?: AffectProfile,
  frameworksDiscussed?: string[],
  issuesDetected?: string[],
): Array<Omit<ConversationMemory, 'id' | 'user_id' | 'memory_embedding' | 'is_active' | 'superseded_by' | 'created_at'>> {
  const memories: Array<Omit<ConversationMemory, 'id' | 'user_id' | 'memory_embedding' | 'is_active' | 'superseded_by' | 'created_at'>> = [];

  for (const rule of MEMORY_EXTRACTION_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(userMessage)) {
        // Extract the relevant sentence(s) containing the match
        const sentences = userMessage.split(/[.!?]+/).filter(s => s.trim().length > 10);
        const matchingSentence = sentences.find(s => pattern.test(s)) || userMessage.slice(0, 200);

        memories.push({
          session_id: sessionId,
          memory_type: rule.type,
          memory_text: matchingSentence.trim(),
          source_message: userMessage.slice(0, 500),
          frameworks_referenced: frameworksDiscussed || [],
          issues_referenced: issuesDetected || [],
          emotional_context: affect ? {
            primary_emotion: affect.primary_emotion,
            intensity: affect.emotional_intensity,
            energy: affect.energy_level,
          } : {},
          importance_score: rule.importance,
        });

        break; // One memory per rule per message
      }
    }
  }

  return memories;
}

// ============================================================================
// MEMORY STORAGE
// ============================================================================

/**
 * Store extracted memories with embeddings.
 */
export async function storeMemories(
  userId: string,
  memories: Array<Omit<ConversationMemory, 'id' | 'user_id' | 'memory_embedding' | 'is_active' | 'superseded_by' | 'created_at'>>,
  generateEmbedding: (text: string) => Promise<number[]>,
): Promise<void> {
  if (memories.length === 0) return;

  for (const memory of memories) {
    try {
      const embedding = await generateEmbedding(memory.memory_text);

      const { error } = await supabase
        .from('mio_conversation_memories')
        .insert({
          user_id: userId,
          session_id: memory.session_id,
          memory_type: memory.memory_type,
          memory_text: memory.memory_text,
          memory_embedding: JSON.stringify(embedding),
          source_message: memory.source_message,
          frameworks_referenced: memory.frameworks_referenced,
          issues_referenced: memory.issues_referenced,
          emotional_context: memory.emotional_context,
          importance_score: memory.importance_score,
        });

      if (error) {
        console.error('Failed to store memory:', error.message);
      }
    } catch (err) {
      console.error('Memory storage error:', err);
    }
  }
}

// ============================================================================
// MEMORY RETRIEVAL
// ============================================================================

/**
 * Retrieve relevant memories for a user based on the current query.
 * Uses the search_user_memories RPC for hybrid (vector + recency + importance) ranking.
 */
export async function retrieveRelevantMemories(
  userId: string,
  queryEmbedding: number[],
  options: {
    limit?: number;
    recencyDays?: number;
    minImportance?: number;
  } = {},
): Promise<RetrievedMemory[]> {
  const { data, error } = await supabase.rpc('search_user_memories', {
    p_user_id: userId,
    p_query_embedding: JSON.stringify(queryEmbedding),
    p_limit: options.limit ?? 5,
    p_recency_days: options.recencyDays ?? 90,
    p_min_importance: options.minImportance ?? 0.3,
  });

  if (error) {
    console.error('Memory retrieval error:', error.message);
    return [];
  }

  return (data || []) as RetrievedMemory[];
}

/**
 * Get recent session summaries for a user.
 */
export async function getRecentSessions(
  userId: string,
  limit: number = 3,
): Promise<SessionSummary[]> {
  const { data, error } = await supabase
    .from('mio_session_summaries')
    .select('*')
    .eq('user_id', userId)
    .order('session_number', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Session retrieval error:', error.message);
    return [];
  }

  return (data || []) as SessionSummary[];
}

/**
 * Format retrieved memories into a context block for the LLM.
 */
export function formatMemoryContext(
  memories: RetrievedMemory[],
  recentSessions: SessionSummary[],
): string {
  if (memories.length === 0 && recentSessions.length === 0) return '';

  const lines: string[] = ['=== YOUR HISTORY WITH THIS PERSON ==='];

  // Recent session summary
  if (recentSessions.length > 0) {
    const lastSession = recentSessions[0];
    lines.push(`\nLast session (#${lastSession.session_number}):`);
    lines.push(`  Topics: ${lastSession.key_topics.join(', ')}`);
    if (lastSession.techniques_discussed.length > 0) {
      lines.push(`  Techniques discussed: ${lastSession.techniques_discussed.join(', ')}`);
    }
    if (lastSession.homework_assigned.length > 0) {
      lines.push(`  Homework given: ${lastSession.homework_assigned.join(', ')}`);
    }
    if (lastSession.breakthrough_moment) {
      lines.push(`  Breakthrough: ${lastSession.breakthrough_moment}`);
    }
  }

  // Relevant memories
  if (memories.length > 0) {
    lines.push('\nRelevant memories from past sessions:');
    for (const mem of memories) {
      const daysAgo = Math.floor((Date.now() - new Date(mem.created_at).getTime()) / 86400000);
      const timeLabel = daysAgo === 0 ? 'today' : daysAgo === 1 ? 'yesterday' : `${daysAgo} days ago`;
      lines.push(`  [${mem.memory_type}] (${timeLabel}): ${mem.memory_text}`);
    }
  }

  lines.push('\n=== END HISTORY ===');
  lines.push('Use this history to personalize your response. Reference specific memories when relevant.');

  return lines.join('\n');
}

// ============================================================================
// SESSION SUMMARY GENERATION
// ============================================================================

/**
 * Create a session summary from conversation data.
 * Call at the end of a conversation session.
 */
export async function createSessionSummary(
  userId: string,
  sessionId: string,
  data: {
    summaryText: string;
    keyTopics: string[];
    techniquesDiscussed: string[];
    homeworkAssigned: string[];
    affectTrajectory: Record<string, unknown>;
    triageColorsSeen: string[];
    breakthroughMoment: string | null;
    messageCount: number;
  },
): Promise<void> {
  // Get next session number
  const { data: lastSession } = await supabase
    .from('mio_session_summaries')
    .select('session_number')
    .eq('user_id', userId)
    .order('session_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextNumber = (lastSession?.session_number ?? 0) + 1;

  const { error } = await supabase
    .from('mio_session_summaries')
    .insert({
      user_id: userId,
      session_id: sessionId,
      session_number: nextNumber,
      summary_text: data.summaryText,
      key_topics: data.keyTopics,
      techniques_discussed: data.techniquesDiscussed,
      homework_assigned: data.homeworkAssigned,
      affect_trajectory: data.affectTrajectory,
      triage_colors_seen: data.triageColorsSeen,
      breakthrough_moment: data.breakthroughMoment,
      message_count: data.messageCount,
    });

  if (error) {
    console.error('Session summary creation error:', error.message);
  }
}
