// ============================================================================
// RELATIONAL RAG SERVICE
// Unified search pipeline that integrates triage, intersectionality, and
// Supabase vector search into a single call for MIO relational coaching.
//
// Pipeline:
//   User Message → Triage → Intersectionality → Embedding → Vector Search →
//   System Prompt Augmentation → Complete Context
//
// Usage:
//   const result = await searchRelational({ user_message, user_id, ... });
//   // result.system_prompt_addition → inject into MIO system prompt
//   // result.retrieved_chunks → relevant knowledge chunks
//   // result.triage_decision → routing metadata
// ============================================================================

import { supabase } from '@/integrations/supabase/client';

import {
  type TriageContext,
  type TriageDecision,
  type RelationalSearchParams,
  triageRelationalMessage,
  quickTriage,
} from './relational-triage-service';

import {
  type IntersectionalityAnalysis,
  analyzeIntersectionality,
  composeSystemPromptAugmentation,
} from './relational-intersectionality-engine';

// ============================================================================
// TYPES
// ============================================================================

export interface RelationalSearchRequest {
  // Required
  user_message: string;

  // Optional context (enriches triage + search quality)
  user_id?: string;
  life_stage?: TriageContext['life_stage'];
  known_issue_types?: TriageContext['known_issue_types'];
  known_contraindications?: TriageContext['known_contraindications'];
  cultural_flags?: string[];
  conversation_history?: string[];
  relationship_season?: string;

  // Search tuning
  match_threshold?: number;  // Default 0.65
  match_count?: number;      // Default 10
  include_system_prompt?: boolean; // Default true

  // Pre-generated embedding (skip OpenAI call if provided)
  query_embedding?: number[];
}

export interface RelationalSearchResult {
  // Core results
  retrieved_chunks: RetrievedChunk[];
  chunk_count: number;

  // Analysis outputs
  triage_decision: TriageDecision;
  intersectionality: IntersectionalityAnalysis;

  // System prompt addition (inject into MIO's system prompt)
  system_prompt_addition: string;

  // Formatted context block for LLM consumption
  context_block: string;

  // Metadata
  search_params_used: RelationalSearchParams;
  embedding_source: 'provided' | 'generated' | 'none';
  search_duration_ms: number;

  // Safety flags
  is_crisis: boolean;
  should_block_coaching: boolean;
  crisis_resources: string[];
}

export interface RetrievedChunk {
  id: string;
  chunk_text: string;
  chunk_summary: string;
  pillar: string;
  category: string;
  framework_domain: string;
  framework_name: string;
  framework_section: string;
  evidence_tier: string;
  triage_color: string;
  contraindication_tags: string[];
  integration_points: string[];
  expert_name: string;
  similarity: number;
  relevance_score: number;
}

// ============================================================================
// EMBEDDING GENERATION
// Generates embeddings via OpenAI text-embedding-3-small
// In production, this should be called from a server/edge function
// to protect the API key. The client-side version is for dev/testing.
// ============================================================================

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;

/**
 * Generate an embedding for a query string.
 * Uses the Supabase Edge Function proxy to avoid exposing the OpenAI key.
 * Falls back to direct API call if OPENAI_API_KEY env is available.
 */
async function generateQueryEmbedding(text: string): Promise<number[]> {
  // Option 1: Use Supabase Edge Function (preferred for client-side)
  try {
    const { data, error } = await supabase.functions.invoke('generate-embedding', {
      body: { text, model: EMBEDDING_MODEL, dimensions: EMBEDDING_DIMENSIONS },
    });

    if (!error && data?.embedding) {
      return data.embedding;
    }

    // Edge function not available, fall through
    if (error) {
      console.warn('Edge function generate-embedding not available:', error.message);
    }
  } catch {
    // Edge function doesn't exist yet, fall through
  }

  // Option 2: Direct OpenAI call (for server-side/scripts)
  const apiKey = typeof process !== 'undefined'
    ? (process.env?.OPENAI_API_KEY || process.env?.VITE_OPENAI_API_KEY)
    : undefined;

  if (apiKey) {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: text,
        dimensions: EMBEDDING_DIMENSIONS,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI embedding error: ${response.status}`);
    }

    const result = await response.json();
    return result.data[0].embedding;
  }

  throw new Error(
    'No embedding method available. Deploy the generate-embedding Edge Function ' +
    'or set OPENAI_API_KEY environment variable.'
  );
}

// ============================================================================
// SUPABASE RPC CALL
// Calls the search_mio_relational function defined in the migration
// ============================================================================

async function callSearchRPC(
  embedding: number[],
  queryText: string,
  params: RelationalSearchParams,
): Promise<RetrievedChunk[]> {
  const { data, error } = await supabase.rpc('search_mio_relational', {
    query_embedding: JSON.stringify(embedding),
    query_text: queryText,
    filter_domains: params.filter_domains,
    filter_frameworks: params.filter_frameworks,
    filter_evidence_tiers: params.filter_evidence_tiers,
    filter_triage_colors: params.filter_triage_colors,
    exclude_contraindications: params.exclude_contraindications,
    filter_life_stages: params.filter_life_stages,
    filter_issue_types: params.filter_issue_types,
    filter_cultural_flags: params.filter_cultural_flags,
    match_threshold: params.match_threshold,
    match_count: params.match_count,
  });

  if (error) {
    console.error('search_mio_relational RPC error:', error);
    throw new Error(`Relational search failed: ${error.message}`);
  }

  return (data || []) as RetrievedChunk[];
}

// ============================================================================
// CONTEXT BLOCK FORMATTER
// Formats retrieved chunks into a structured context block for the LLM
// ============================================================================

function formatContextBlock(
  chunks: RetrievedChunk[],
  triage: TriageDecision,
  intersectionality: IntersectionalityAnalysis,
): string {
  if (chunks.length === 0) {
    return '[No relational knowledge chunks matched the query. Respond using general coaching knowledge.]';
  }

  const lines: string[] = [];

  lines.push('=== RELATIONAL KNOWLEDGE CONTEXT ===');
  lines.push(`Triage Level: ${triage.triage_color.toUpperCase()} | Confidence: ${(triage.confidence * 100).toFixed(0)}%`);
  lines.push(`Complexity: ${intersectionality.complexity_score}/10`);

  if (intersectionality.primary_focus) {
    lines.push(`Primary Focus: ${intersectionality.primary_focus.domain} (${intersectionality.primary_focus.frameworks.join(', ')})`);
  }
  if (intersectionality.secondary_focus) {
    lines.push(`Secondary Focus: ${intersectionality.secondary_focus.domain} (${intersectionality.secondary_focus.frameworks.join(', ')})`);
  }

  lines.push('');
  lines.push(`--- ${chunks.length} Relevant Knowledge Chunks ---`);
  lines.push('');

  // Group chunks by framework for readability
  const byFramework = new Map<string, RetrievedChunk[]>();
  for (const chunk of chunks) {
    const key = chunk.framework_name || 'general';
    if (!byFramework.has(key)) byFramework.set(key, []);
    byFramework.get(key)!.push(chunk);
  }

  for (const [framework, fChunks] of byFramework) {
    const meta = fChunks[0];
    lines.push(`## ${framework} [${meta.evidence_tier}] (${meta.framework_domain})`);

    for (const chunk of fChunks) {
      lines.push(`[${chunk.framework_section || 'general'}] (relevance: ${(chunk.relevance_score * 100).toFixed(0)}%)`);
      lines.push(chunk.chunk_text);
      lines.push('');
    }
  }

  // Integration bridges
  if (intersectionality.integration_bridges.length > 0) {
    lines.push('--- Integration Bridges ---');
    for (const bridge of intersectionality.integration_bridges) {
      lines.push(`${bridge.from_framework} ↔ ${bridge.to_framework}: ${bridge.bridge_concept}`);
      lines.push(`  Application: ${bridge.application_note}`);
    }
    lines.push('');
  }

  // Contraindication warnings
  if (triage.active_contraindications.length > 0) {
    lines.push('--- CONTRAINDICATION WARNINGS ---');
    lines.push(`DO NOT use frameworks that assume: ${triage.active_contraindications.join(', ')}`);
    if (triage.excluded_frameworks.length > 0) {
      lines.push(`Excluded frameworks: ${triage.excluded_frameworks.join(', ')}`);
    }
    lines.push('');
  }

  lines.push('=== END RELATIONAL KNOWLEDGE CONTEXT ===');

  return lines.join('\n');
}

// ============================================================================
// MAIN SEARCH PIPELINE
// ============================================================================

/**
 * Primary relational search function.
 * Runs the full pipeline: Triage → Intersectionality → Embedding → Search → Format
 */
export async function searchRelational(
  request: RelationalSearchRequest,
): Promise<RelationalSearchResult> {
  const startTime = Date.now();

  // ---- Step 1: Build triage context ----
  const triageContext: TriageContext = {
    user_message: request.user_message,
    user_id: request.user_id,
    life_stage: request.life_stage,
    known_issue_types: request.known_issue_types,
    known_contraindications: request.known_contraindications,
    cultural_flags: request.cultural_flags,
    conversation_history: request.conversation_history,
    relationship_season: request.relationship_season,
  };

  // ---- Step 2: Run triage ----
  const triageDecision = triageRelationalMessage(triageContext);

  // ---- Step 3: Run intersectionality analysis ----
  const intersectionality = analyzeIntersectionality(triageDecision, triageContext);

  // ---- Step 4: Build search params (override with request-level tuning) ----
  const searchParams: RelationalSearchParams = {
    ...triageDecision.search_params,
    match_threshold: request.match_threshold ?? triageDecision.search_params.match_threshold,
    match_count: request.match_count ?? triageDecision.search_params.match_count,
  };

  // ---- Step 5: Generate or use provided embedding ----
  let embedding: number[] | null = null;
  let embeddingSource: 'provided' | 'generated' | 'none' = 'none';

  if (request.query_embedding) {
    embedding = request.query_embedding;
    embeddingSource = 'provided';
  } else {
    try {
      embedding = await generateQueryEmbedding(request.user_message);
      embeddingSource = 'generated';
    } catch (err) {
      console.error('Embedding generation failed:', err);
      // Continue without vector search — triage + intersectionality still provide value
    }
  }

  // ---- Step 6: Execute vector search (if embedding available) ----
  let chunks: RetrievedChunk[] = [];

  if (embedding) {
    try {
      chunks = await callSearchRPC(embedding, request.user_message, searchParams);
    } catch (err) {
      console.error('Vector search failed:', err);
      // Degrade gracefully — triage + intersectionality analysis still available
    }
  }

  // ---- Step 7: Compose system prompt augmentation ----
  const systemPromptAddition = (request.include_system_prompt !== false)
    ? composeSystemPromptAugmentation(intersectionality, triageDecision)
    : '';

  // ---- Step 8: Format context block ----
  const contextBlock = formatContextBlock(chunks, triageDecision, intersectionality);

  // ---- Step 9: Build result ----
  const searchDuration = Date.now() - startTime;

  return {
    retrieved_chunks: chunks,
    chunk_count: chunks.length,
    triage_decision: triageDecision,
    intersectionality,
    system_prompt_addition: systemPromptAddition,
    context_block: contextBlock,
    search_params_used: searchParams,
    embedding_source: embeddingSource,
    search_duration_ms: searchDuration,
    is_crisis: triageDecision.triage_color === 'red',
    should_block_coaching: triageDecision.keyword_triage.should_block_coaching,
    crisis_resources: triageDecision.triage_color === 'red'
      ? triageDecision.keyword_triage.crisis_resources
      : [],
  };
}

// ============================================================================
// QUICK SEARCH (lightweight — triage only, no embedding/vector search)
// Use for real-time safety checks or when embedding isn't available
// ============================================================================

export interface QuickSearchResult {
  triage_color: TriageDecision['triage_color'];
  is_crisis: boolean;
  should_block_coaching: boolean;
  crisis_resources: string[];
  recommended_domains: string[];
  recommended_frameworks: string[];
  response_template: TriageDecision['response_template'];
  system_prompt_addition: string;
}

/**
 * Lightweight search — runs triage + intersectionality without embedding/vector search.
 * Returns enough context for MIO to respond safely even without RAG chunks.
 */
export function searchRelationalQuick(
  request: Pick<RelationalSearchRequest, 'user_message' | 'life_stage' | 'known_issue_types' | 'cultural_flags' | 'conversation_history'>,
): QuickSearchResult {
  const triageContext: TriageContext = {
    user_message: request.user_message,
    life_stage: request.life_stage,
    known_issue_types: request.known_issue_types,
    cultural_flags: request.cultural_flags,
    conversation_history: request.conversation_history,
  };

  const triageDecision = triageRelationalMessage(triageContext);
  const intersectionality = analyzeIntersectionality(triageDecision, triageContext);
  const systemPromptAddition = composeSystemPromptAugmentation(intersectionality, triageDecision);

  return {
    triage_color: triageDecision.triage_color,
    is_crisis: triageDecision.triage_color === 'red',
    should_block_coaching: triageDecision.keyword_triage.should_block_coaching,
    crisis_resources: triageDecision.triage_color === 'red'
      ? triageDecision.keyword_triage.crisis_resources
      : [],
    recommended_domains: triageDecision.recommended_domains,
    recommended_frameworks: triageDecision.recommended_frameworks,
    response_template: triageDecision.response_template,
    system_prompt_addition: systemPromptAddition,
  };
}

// ============================================================================
// BATCH CONTEXT BUILDER
// Builds context from multiple messages (conversation-level analysis)
// ============================================================================

/**
 * Analyze a full conversation and return the most recent message's search results
 * with conversation-level context awareness.
 */
export async function searchRelationalWithHistory(
  messages: string[],
  request: Omit<RelationalSearchRequest, 'user_message' | 'conversation_history'>,
): Promise<RelationalSearchResult> {
  if (messages.length === 0) {
    throw new Error('At least one message is required');
  }

  const latestMessage = messages[messages.length - 1];
  const history = messages.slice(0, -1);

  return searchRelational({
    ...request,
    user_message: latestMessage,
    conversation_history: history,
  });
}

// ============================================================================
// MIO SYSTEM PROMPT COMPOSER
// Builds the complete system prompt section for relational coaching
// ============================================================================

/**
 * Compose a complete MIO system prompt section that includes:
 * 1. Triage-level routing instructions
 * 2. Intersectionality analysis
 * 3. Retrieved knowledge context
 *
 * This is the single function MIO's chat handler should call.
 */
export async function composeMIORelationalContext(
  request: RelationalSearchRequest,
): Promise<{
  system_prompt_section: string;
  triage_color: string;
  is_crisis: boolean;
  should_block_coaching: boolean;
  metadata: {
    chunk_count: number;
    complexity_score: number;
    primary_domain: string | null;
    evidence_floor: string;
    search_duration_ms: number;
  };
}> {
  const result = await searchRelational(request);

  // Build the combined system prompt section
  const sections: string[] = [];

  // Section 1: Triage + Intersectionality instructions
  if (result.system_prompt_addition) {
    sections.push(result.system_prompt_addition);
  }

  // Section 2: Retrieved knowledge context
  if (result.context_block) {
    sections.push(result.context_block);
  }

  return {
    system_prompt_section: sections.join('\n\n'),
    triage_color: result.triage_decision.triage_color,
    is_crisis: result.is_crisis,
    should_block_coaching: result.should_block_coaching,
    metadata: {
      chunk_count: result.chunk_count,
      complexity_score: result.intersectionality.complexity_score,
      primary_domain: result.intersectionality.primary_focus?.domain ?? null,
      evidence_floor: result.triage_decision.evidence_floor,
      search_duration_ms: result.search_duration_ms,
    },
  };
}
