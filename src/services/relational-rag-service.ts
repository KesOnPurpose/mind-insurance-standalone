// ============================================================================
// BILLION DOLLAR RAG SERVICE - Unified Pipeline
// ============================================================================
//
// The world-class relational coaching RAG that "reads the user's mind."
//
// Pipeline:
//   Step 0: Load user profile (persistent context)
//   Step 1: Affect detection (emotional intelligence)
//   Step 2: Triage (safety + clinical routing)
//   Step 3: Cross-pillar detection (hidden root causes)
//   Step 4: Query decomposition (multi-domain targeting)
//   Step 5: HyDE generation (hypothetical ideal answer)
//   Step 6: Embedding generation (HyDE-enhanced)
//   Step 7: Multi-vector search (main + sub-queries)
//   Step 8: Re-ranking (heuristic + diversity)
//   Step 9: Agentic gap filling (follow-up searches)
//   Step 10: Memory retrieval (past session context)
//   Step 11: Intersectionality analysis (framework integration)
//   Step 12: Context assembly (all signals → structured prompt)
//   Step 13: Profile enrichment (learn from this interaction)
//
// Post-response hooks (called separately):
//   - Memory extraction + storage
//   - Technique outcome tracking
//   - Session summary generation
//
// ============================================================================

import { supabase } from '@/integrations/supabase/client';

import {
  type TriageContext,
  type TriageDecision,
  type RelationalSearchParams,
  triageRelationalMessage,
} from './relational-triage-service';

import {
  type IntersectionalityAnalysis,
  analyzeIntersectionality,
  composeSystemPromptAugmentation,
} from './relational-intersectionality-engine';

import {
  type RelationalProfile,
  type RAGProfileContext,
  getOrCreateProfile,
  getProfileForRAG,
  enrichProfileFromMessage,
} from './relational-profile-service';

import {
  type HyDEResult,
  generateHypotheticalAnswer,
  composeEmbeddingInput,
} from './hyde-service';

import {
  type AffectProfile,
  detectAffect,
  detectEscalation,
} from './affect-detection-service';

import {
  type RetrievedMemory,
  type SessionSummary,
  extractMemoriesFromMessage,
  storeMemories,
  retrieveRelevantMemories,
  getRecentSessions,
  formatMemoryContext,
} from './memory-service';

import {
  type DecompositionResult,
  decomposeQuery,
} from './query-decomposition-service';

import {
  type CrossPillarSignals,
  detectCrossPillarFactors,
  formatCrossPillarContext,
} from './cross-pillar-detection-service';

import {
  type RerankCandidate,
  rerankHeuristic,
  diversifyResults,
} from './reranking-service';

import {
  analyzeRetrievalGaps,
  mergeSearchResults,
} from './agentic-retrieval-service';

import {
  type CulturalDetectionResult,
  detectCulturalSignals,
  formatCulturalContext,
} from './cultural-language-detector';

import {
  type PendingFollowUp,
  getPendingFollowUps,
  formatFollowUpContext,
  detectTechniqueInResponse,
  recordTechniqueAssignment,
} from './technique-outcome-service';

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
  match_threshold?: number;  // Default 0.3
  match_count?: number;      // Default 10
  include_system_prompt?: boolean; // Default true

  // Pre-generated embedding (skip OpenAI call if provided)
  query_embedding?: number[];

  // Feature flags
  enable_hyde?: boolean;         // Default true
  enable_affect?: boolean;       // Default true
  enable_memory?: boolean;       // Default true (if user_id provided)
  enable_cross_pillar?: boolean; // Default true
  enable_decomposition?: boolean; // Default true
  enable_agentic?: boolean;      // Default true
  enable_reranking?: boolean;    // Default true
}

export interface RelationalSearchResult {
  // Core results
  retrieved_chunks: RetrievedChunk[];
  chunk_count: number;

  // Analysis outputs
  triage_decision: TriageDecision;
  intersectionality: IntersectionalityAnalysis;
  affect: AffectProfile | null;
  cross_pillar: CrossPillarSignals | null;
  decomposition: DecompositionResult | null;

  // Memory context
  relevant_memories: RetrievedMemory[];
  recent_sessions: SessionSummary[];

  // Profile
  user_profile: RAGProfileContext | null;

  // Cultural detection
  cultural_context: CulturalDetectionResult | null;

  // Technique follow-ups
  pending_follow_ups: PendingFollowUp[];

  // System prompt addition (inject into MIO's system prompt)
  system_prompt_addition: string;

  // Formatted context block for LLM consumption
  context_block: string;

  // Metadata
  search_params_used: RelationalSearchParams;
  embedding_source: 'provided' | 'generated' | 'hyde' | 'none';
  hyde_result: HyDEResult | null;
  search_duration_ms: number;
  search_passes: number;

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
  // New Phase 1 fields
  granularity?: string;
  voice?: string;
  target_readiness?: string;
  cross_pillar_tags?: string[];
  effectiveness_score?: number;
  // Scoring
  similarity: number;
  relevance_score: number;
}

// ============================================================================
// EMBEDDING GENERATION
// ============================================================================

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;

async function generateQueryEmbedding(text: string): Promise<number[]> {
  // Option 1: Supabase Edge Function (preferred)
  try {
    const { data, error } = await supabase.functions.invoke('generate-embedding', {
      body: { text, model: EMBEDDING_MODEL, dimensions: EMBEDDING_DIMENSIONS },
    });

    if (!error && data?.embedding) {
      return data.embedding;
    }
    if (error) {
      console.warn('Edge function generate-embedding not available:', error.message);
    }
  } catch {
    // Fall through
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
// SUPABASE RPC CALL (Enhanced with new filters)
// ============================================================================

async function callSearchRPC(
  embedding: number[],
  queryText: string,
  params: RelationalSearchParams & {
    filter_granularity?: string[];
    filter_voice?: string[];
    filter_target_readiness?: string[];
    filter_cross_pillar?: string[];
    filter_cultural_contexts?: string[];
    filter_relationship_type?: string[];
    min_effectiveness?: number;
  },
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
    // New filters
    filter_granularity: params.filter_granularity ?? null,
    filter_voice: params.filter_voice ?? null,
    filter_target_readiness: params.filter_target_readiness ?? null,
    filter_cross_pillar: params.filter_cross_pillar ?? null,
    filter_cultural_contexts: params.filter_cultural_contexts ?? null,
    filter_relationship_type: params.filter_relationship_type ?? null,
    min_effectiveness: params.min_effectiveness ?? 0.0,
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
// READINESS → CONTENT MAPPING
// Maps affect-based readiness to content filters
// ============================================================================

function getReadinessFilters(affect: AffectProfile | null): {
  filter_target_readiness?: string[];
  filter_granularity?: string[];
  preferredVoice?: string;
} {
  if (!affect) return {};

  switch (affect.recommended_depth) {
    case 'validation_only':
      return {
        filter_target_readiness: ['flooded'],
        filter_granularity: ['validation', 'real_talk'],
        preferredVoice: 'keston', // Warm voice for flooded users
      };
    case 'psychoeducation':
      return {
        filter_target_readiness: ['processing', 'flooded'],
        filter_granularity: ['concept', 'summary', 'real_talk'],
        preferredVoice: 'conversational',
      };
    case 'framework':
      return {
        filter_target_readiness: ['ready', 'processing'],
        filter_granularity: ['concept', 'deep_dive'],
        preferredVoice: 'clinical',
      };
    case 'action':
      return {
        filter_target_readiness: ['motivated', 'ready'],
        filter_granularity: ['micro_intervention', 'deep_dive', 'case_study'],
        preferredVoice: 'script',
      };
    default:
      return {};
  }
}

// ============================================================================
// CONTEXT BLOCK FORMATTER (Enhanced)
// ============================================================================

function formatContextBlock(
  chunks: RetrievedChunk[],
  triage: TriageDecision,
  intersectionality: IntersectionalityAnalysis,
  options: {
    affect?: AffectProfile | null;
    crossPillar?: CrossPillarSignals | null;
    memories?: RetrievedMemory[];
    recentSessions?: SessionSummary[];
    profile?: RAGProfileContext | null;
  } = {},
): string {
  if (chunks.length === 0 && !options.affect && !options.crossPillar) {
    return '[No relational knowledge chunks matched the query. Respond using general coaching knowledge.]';
  }

  const lines: string[] = [];

  lines.push('=== RELATIONAL KNOWLEDGE CONTEXT ===');
  lines.push(`Triage Level: ${triage.triage_color.toUpperCase()} | Confidence: ${(triage.confidence * 100).toFixed(0)}%`);
  lines.push(`Complexity: ${intersectionality.complexity_score}/10`);

  // User profile context
  if (options.profile && options.profile.profile_completeness > 0.1) {
    lines.push('');
    lines.push('--- User Profile ---');
    if (options.profile.attachment_style !== 'unassessed') {
      lines.push(`Attachment: ${options.profile.attachment_style}`);
    }
    if (options.profile.primary_pattern !== 'unassessed') {
      lines.push(`Pattern: ${options.profile.primary_pattern.replace(/_/g, ' ')}`);
    }
    if (options.profile.readiness_stage) {
      lines.push(`Readiness: ${options.profile.readiness_stage}`);
    }
    if (options.profile.sessions_completed > 0) {
      lines.push(`Sessions: ${options.profile.sessions_completed}`);
    }
    if (options.profile.key_issues.length > 0) {
      lines.push(`Known issues: ${options.profile.key_issues.join(', ')}`);
    }
    if (options.profile.known_triggers.length > 0) {
      lines.push(`Known triggers: ${options.profile.known_triggers.join(', ')}`);
    }
  }

  // Affect context
  if (options.affect) {
    lines.push('');
    lines.push('--- Emotional State ---');
    lines.push(`Primary: ${options.affect.primary_emotion} (intensity: ${options.affect.emotional_intensity}/10)`);
    if (options.affect.secondary_emotion) {
      lines.push(`Underneath: ${options.affect.secondary_emotion} (the real emotion)`);
    }
    lines.push(`Energy: ${options.affect.energy_level} | Readiness: ${options.affect.readiness_for_change}`);
    lines.push(`Response depth: ${options.affect.recommended_depth.toUpperCase()}`);

    // Active markers
    const activeMarkers = Object.entries(options.affect.markers)
      .filter(([, v]) => v)
      .map(([k]) => k.replace(/_/g, ' '));
    if (activeMarkers.length > 0) {
      lines.push(`Linguistic markers: ${activeMarkers.join(', ')}`);
    }
  }

  // Cross-pillar context
  if (options.crossPillar) {
    const cpContext = formatCrossPillarContext(options.crossPillar);
    if (cpContext) {
      lines.push('');
      lines.push(cpContext);
    }
  }

  // Memory context
  if (options.memories || options.recentSessions) {
    const memContext = formatMemoryContext(
      options.memories || [],
      options.recentSessions || [],
    );
    if (memContext) {
      lines.push('');
      lines.push(memContext);
    }
  }

  // Focus areas
  if (intersectionality.primary_focus) {
    lines.push('');
    lines.push(`Primary Focus: ${intersectionality.primary_focus.domain} (${intersectionality.primary_focus.frameworks.join(', ')})`);
  }
  if (intersectionality.secondary_focus) {
    lines.push(`Secondary Focus: ${intersectionality.secondary_focus.domain} (${intersectionality.secondary_focus.frameworks.join(', ')})`);
  }

  // Knowledge chunks
  if (chunks.length > 0) {
    lines.push('');
    lines.push(`--- ${chunks.length} Knowledge Chunks ---`);
    lines.push('');

    // Group by framework
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
        const tags: string[] = [];
        if (chunk.granularity) tags.push(chunk.granularity);
        if (chunk.voice) tags.push(`voice:${chunk.voice}`);
        const tagStr = tags.length > 0 ? ` [${tags.join(', ')}]` : '';

        lines.push(`[${chunk.framework_section || 'general'}]${tagStr} (relevance: ${(chunk.relevance_score * 100).toFixed(0)}%)`);
        lines.push(chunk.chunk_text);
        lines.push('');
      }
    }
  }

  // Integration bridges
  if (intersectionality.integration_bridges.length > 0) {
    lines.push('--- Integration Bridges ---');
    for (const bridge of intersectionality.integration_bridges) {
      lines.push(`${bridge.from_framework} <-> ${bridge.to_framework}: ${bridge.bridge_concept}`);
      lines.push(`  Application: ${bridge.application_note}`);
    }
    lines.push('');
  }

  // Contraindications
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
// MAIN SEARCH PIPELINE (Billion Dollar RAG)
// ============================================================================

/**
 * Primary relational search function.
 * Runs the full Billion Dollar RAG pipeline:
 * Profile → Affect → Triage → Cross-Pillar → Decomposition → HyDE →
 * Embedding → Multi-Search → Rerank → Gap Fill → Memory → Compose
 */
export async function searchRelational(
  request: RelationalSearchRequest,
): Promise<RelationalSearchResult> {
  const startTime = Date.now();
  const featureFlags = {
    hyde: request.enable_hyde !== false,
    affect: request.enable_affect !== false,
    memory: request.enable_memory !== false && !!request.user_id,
    crossPillar: request.enable_cross_pillar !== false,
    decomposition: request.enable_decomposition !== false,
    agentic: request.enable_agentic !== false,
    reranking: request.enable_reranking !== false,
  };

  // ========================================================================
  // STEP 0: Load user profile (if user_id provided)
  // ========================================================================
  let profile: RelationalProfile | null = null;
  let ragProfile: RAGProfileContext | null = null;

  if (request.user_id) {
    try {
      profile = await getOrCreateProfile(request.user_id);
      ragProfile = getProfileForRAG(profile);
    } catch (err) {
      console.warn('Profile loading failed, continuing without:', err);
    }
  }

  // ========================================================================
  // STEP 0.5: Cultural language detection (fast regex, every message)
  // ========================================================================
  let culturalContext: CulturalDetectionResult | null = null;
  try {
    culturalContext = detectCulturalSignals(
      request.user_message,
      ragProfile ? { cultural_context: ragProfile.cultural_flags } : undefined,
    );
  } catch (err) {
    console.warn('Cultural detection failed:', err);
  }

  // ========================================================================
  // STEP 0.6: Pending technique follow-ups
  // ========================================================================
  let pendingFollowUps: PendingFollowUp[] = [];
  if (request.user_id) {
    try {
      pendingFollowUps = await getPendingFollowUps(request.user_id);
    } catch (err) {
      console.warn('Follow-up retrieval failed:', err);
    }
  }

  // ========================================================================
  // STEP 1: Affect detection (parallel-safe, runs independently)
  // ========================================================================
  let affect: AffectProfile | null = null;

  if (featureFlags.affect) {
    try {
      affect = await detectAffect(request.user_message, {
        useLLM: false, // Fast regex only for pipeline speed
        conversationHistory: request.conversation_history,
      });
    } catch (err) {
      console.warn('Affect detection failed:', err);
    }
  }

  // ========================================================================
  // STEP 2: Triage (safety + clinical routing)
  // Profile data enriches the triage context
  // ========================================================================
  const triageContext: TriageContext = {
    user_message: request.user_message,
    user_id: request.user_id,
    life_stage: ragProfile?.life_stage ?? request.life_stage,
    known_issue_types: ragProfile?.key_issues ?? request.known_issue_types,
    known_contraindications: ragProfile?.contraindications ?? request.known_contraindications,
    cultural_flags: ragProfile?.cultural_flags ?? request.cultural_flags,
    conversation_history: request.conversation_history,
    relationship_season: request.relationship_season,
  };

  const triageDecision = triageRelationalMessage(triageContext);

  // ========================================================================
  // STEP 3: Cross-pillar detection (parallel with decomposition)
  // ========================================================================
  let crossPillar: CrossPillarSignals | null = null;

  if (featureFlags.crossPillar) {
    try {
      crossPillar = await detectCrossPillarFactors(
        request.user_message,
        ragProfile ?? undefined,
        affect ?? undefined,
      );
    } catch (err) {
      console.warn('Cross-pillar detection failed:', err);
    }
  }

  // ========================================================================
  // STEP 4: Query decomposition
  // ========================================================================
  let decomposition: DecompositionResult | null = null;

  if (featureFlags.decomposition) {
    try {
      decomposition = await decomposeQuery(request.user_message, {
        profile: ragProfile ?? undefined,
        triage: triageDecision,
        useLLM: false, // Rule-based for speed; LLM for complex queries in future
      });
    } catch (err) {
      console.warn('Query decomposition failed:', err);
    }
  }

  // ========================================================================
  // STEP 5: HyDE generation
  // ========================================================================
  let hydeResult: HyDEResult | null = null;

  if (featureFlags.hyde) {
    try {
      hydeResult = await generateHypotheticalAnswer(
        request.user_message,
        ragProfile ?? undefined,
        triageDecision,
      );
    } catch (err) {
      console.warn('HyDE generation failed:', err);
    }
  }

  // ========================================================================
  // STEP 6: Generate embedding(s)
  // ========================================================================
  let mainEmbedding: number[] | null = null;
  let embeddingSource: 'provided' | 'generated' | 'hyde' | 'none' = 'none';

  if (request.query_embedding) {
    mainEmbedding = request.query_embedding;
    embeddingSource = 'provided';
  } else {
    try {
      // Use HyDE-enhanced text if available
      const embeddingInput = hydeResult
        ? composeEmbeddingInput(request.user_message, hydeResult)
        : request.user_message;

      mainEmbedding = await generateQueryEmbedding(embeddingInput);
      embeddingSource = hydeResult?.method === 'hyde' ? 'hyde' : 'generated';
    } catch (err) {
      console.error('Embedding generation failed:', err);
    }
  }

  // ========================================================================
  // STEP 7: Multi-vector search
  // ========================================================================
  const readinessFilters = getReadinessFilters(affect);
  const searchParams: RelationalSearchParams & Record<string, unknown> = {
    ...triageDecision.search_params,
    match_threshold: request.match_threshold ?? triageDecision.search_params.match_threshold,
    match_count: request.match_count ?? (triageDecision.search_params.match_count ?? 10),
    // Readiness-based filters (soft — don't apply to main search to avoid over-filtering)
    filter_target_readiness: null, // Applied in re-ranking instead
    filter_voice: null,
  };

  let allChunks: RetrievedChunk[] = [];
  let searchPasses = 0;

  // Pass 1: Main query search
  if (mainEmbedding) {
    try {
      const mainResults = await callSearchRPC(
        mainEmbedding,
        request.user_message,
        searchParams as RelationalSearchParams & {
          filter_granularity?: string[];
          filter_voice?: string[];
          filter_target_readiness?: string[];
          filter_cross_pillar?: string[];
          filter_cultural_contexts?: string[];
          filter_relationship_type?: string[];
          min_effectiveness?: number;
        },
      );
      allChunks = mainResults;
      searchPasses++;
    } catch (err) {
      console.error('Main vector search failed:', err);
    }
  }

  // Pass 2: Sub-query searches (from decomposition)
  if (decomposition?.is_complex && decomposition.sub_queries.length > 0 && mainEmbedding) {
    for (const subQuery of decomposition.sub_queries.slice(0, 3)) {
      try {
        const subEmbedding = await generateQueryEmbedding(subQuery.query_text);
        const subParams = {
          ...searchParams,
          filter_domains: [subQuery.target_domain],
          match_count: 5, // Fewer per sub-query
        };

        const subResults = await callSearchRPC(
          subEmbedding,
          subQuery.query_text,
          subParams as RelationalSearchParams & {
            filter_granularity?: string[];
            filter_voice?: string[];
            filter_target_readiness?: string[];
            filter_cross_pillar?: string[];
            filter_cultural_contexts?: string[];
            filter_relationship_type?: string[];
            min_effectiveness?: number;
          },
        );

        allChunks = mergeSearchResults(allChunks, subResults);
        searchPasses++;
      } catch (err) {
        console.warn(`Sub-query search failed for ${subQuery.target_domain}:`, err);
      }
    }
  }

  // Pass 3: Cross-pillar search (if cross-pillar signals detected)
  if (crossPillar?.cross_pillar_chunks_needed && mainEmbedding) {
    const cpPillars = crossPillar.detected_pillars
      .filter(p => p.pillar !== 'relational' && p.confidence >= 0.6)
      .map(p => p.pillar);

    if (cpPillars.length > 0) {
      try {
        const cpResults = await callSearchRPC(
          mainEmbedding,
          request.user_message,
          {
            ...searchParams,
            filter_cross_pillar: cpPillars,
            match_count: 5,
          } as RelationalSearchParams & {
            filter_granularity?: string[];
            filter_voice?: string[];
            filter_target_readiness?: string[];
            filter_cross_pillar?: string[];
            filter_cultural_contexts?: string[];
            filter_relationship_type?: string[];
            min_effectiveness?: number;
          },
        );
        allChunks = mergeSearchResults(allChunks, cpResults);
        searchPasses++;
      } catch (err) {
        console.warn('Cross-pillar search failed:', err);
      }
    }
  }

  // ========================================================================
  // STEP 8: Re-ranking + diversity
  // ========================================================================
  let rankedChunks = allChunks;

  if (featureFlags.reranking && allChunks.length > 0) {
    const rerankResult = rerankHeuristic(
      allChunks as RerankCandidate[],
      {
        query: request.user_message,
        profile: ragProfile ?? undefined,
        affect: affect ?? undefined,
        targetReadiness: readinessFilters.filter_target_readiness?.[0],
        preferredVoice: readinessFilters.preferredVoice,
      },
    );
    rankedChunks = diversifyResults(
      rerankResult.reranked as unknown as RetrievedChunk[] & RerankCandidate[],
      3, // Max 3 chunks per framework
      searchParams.match_count ?? 10,
    ) as RetrievedChunk[];
  }

  // ========================================================================
  // STEP 9: Agentic gap filling
  // ========================================================================
  if (featureFlags.agentic && mainEmbedding && rankedChunks.length > 0 && rankedChunks.length < 5) {
    const gaps = analyzeRetrievalGaps(
      request.user_message,
      rankedChunks,
      {
        triage: triageDecision,
        crossPillar: crossPillar ?? undefined,
        profile: ragProfile ?? undefined,
        decomposedQueries: decomposition?.sub_queries,
      },
    );

    if (gaps.has_gaps && gaps.follow_up_queries.length > 0) {
      for (const followUp of gaps.follow_up_queries.slice(0, 2)) {
        try {
          const fuEmbedding = await generateQueryEmbedding(followUp.query_text);
          const fuResults = await callSearchRPC(
            fuEmbedding,
            followUp.query_text,
            {
              ...searchParams,
              filter_domains: [followUp.target_domain],
              match_count: 3,
            } as RelationalSearchParams & {
              filter_granularity?: string[];
              filter_voice?: string[];
              filter_target_readiness?: string[];
              filter_cross_pillar?: string[];
              filter_cultural_contexts?: string[];
              filter_relationship_type?: string[];
              min_effectiveness?: number;
            },
          );
          rankedChunks = mergeSearchResults(rankedChunks, fuResults) as RetrievedChunk[];
          searchPasses++;
        } catch {
          // Agentic gap filling is best-effort
        }
      }
    }
  }

  // ========================================================================
  // STEP 10: Memory retrieval
  // ========================================================================
  let relevantMemories: RetrievedMemory[] = [];
  let recentSessions: SessionSummary[] = [];

  if (featureFlags.memory && request.user_id && mainEmbedding) {
    try {
      const [memories, sessions] = await Promise.all([
        retrieveRelevantMemories(request.user_id, mainEmbedding, {
          limit: 5,
          recencyDays: 90,
          minImportance: 0.3,
        }),
        getRecentSessions(request.user_id, 3),
      ]);
      relevantMemories = memories;
      recentSessions = sessions;
    } catch (err) {
      console.warn('Memory retrieval failed:', err);
    }
  }

  // ========================================================================
  // STEP 11: Intersectionality analysis
  // ========================================================================
  const intersectionality = analyzeIntersectionality(triageDecision, triageContext);

  // ========================================================================
  // STEP 12: Context assembly
  // ========================================================================
  const systemPromptAddition = (request.include_system_prompt !== false)
    ? composeSystemPromptAugmentation(intersectionality, triageDecision)
    : '';

  // Build cultural context addition
  const culturalAddition = culturalContext ? formatCulturalContext(culturalContext) : '';
  const followUpAddition = formatFollowUpContext(pendingFollowUps);

  const contextBlock = formatContextBlock(
    rankedChunks,
    triageDecision,
    intersectionality,
    {
      affect,
      crossPillar,
      memories: relevantMemories,
      recentSessions,
      profile: ragProfile,
    },
  ) + culturalAddition + followUpAddition;

  // ========================================================================
  // STEP 13: Profile enrichment (async, don't block response)
  // ========================================================================
  if (request.user_id && profile) {
    // Fire and forget - don't await
    enrichProfileFromMessage(request.user_id, request.user_message, triageDecision)
      .catch(err => console.warn('Profile enrichment failed:', err));
  }

  // ========================================================================
  // BUILD RESULT
  // ========================================================================
  const searchDuration = Date.now() - startTime;

  return {
    retrieved_chunks: rankedChunks,
    chunk_count: rankedChunks.length,
    triage_decision: triageDecision,
    intersectionality,
    affect,
    cross_pillar: crossPillar,
    decomposition,
    relevant_memories: relevantMemories,
    recent_sessions: recentSessions,
    user_profile: ragProfile,
    cultural_context: culturalContext,
    pending_follow_ups: pendingFollowUps,
    system_prompt_addition: systemPromptAddition,
    context_block: contextBlock,
    search_params_used: searchParams as RelationalSearchParams,
    embedding_source: embeddingSource,
    hyde_result: hydeResult,
    search_duration_ms: searchDuration,
    search_passes: searchPasses,
    is_crisis: triageDecision.triage_color === 'red',
    should_block_coaching: triageDecision.keyword_triage.should_block_coaching,
    crisis_resources: triageDecision.triage_color === 'red'
      ? triageDecision.keyword_triage.crisis_resources
      : [],
  };
}

// ============================================================================
// QUICK SEARCH (lightweight - triage only, no embedding/vector search)
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
  affect: AffectProfile | null;
}

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

  // Quick affect detection (regex only)
  let affect: AffectProfile | null = null;
  try {
    // Synchronous regex detection for quick path
    affect = null; // detectAffect is async, skip for quick path
  } catch {
    // Ignore
  }

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
    affect,
  };
}

// ============================================================================
// BATCH CONTEXT BUILDER
// ============================================================================

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
// MIO SYSTEM PROMPT COMPOSER (Primary integration point)
// ============================================================================

/**
 * Compose a complete MIO system prompt section.
 * This is the single function MIO's chat handler should call.
 */
export async function composeMIORelationalContext(
  request: RelationalSearchRequest,
): Promise<{
  system_prompt_section: string;
  triage_color: string;
  is_crisis: boolean;
  should_block_coaching: boolean;
  affect: AffectProfile | null;
  metadata: {
    chunk_count: number;
    complexity_score: number;
    primary_domain: string | null;
    evidence_floor: string;
    search_duration_ms: number;
    search_passes: number;
    embedding_source: string;
    hyde_used: boolean;
    memory_count: number;
    cross_pillar_detected: boolean;
    profile_completeness: number;
    cultural_context_detected: string | null;
    pending_follow_ups: number;
  };
}> {
  const result = await searchRelational(request);

  // Build the combined system prompt section
  const sections: string[] = [];

  // Section 1: Triage + Intersectionality instructions
  if (result.system_prompt_addition) {
    sections.push(result.system_prompt_addition);
  }

  // Section 2: Retrieved knowledge context (includes all signals)
  if (result.context_block) {
    sections.push(result.context_block);
  }

  return {
    system_prompt_section: sections.join('\n\n'),
    triage_color: result.triage_decision.triage_color,
    is_crisis: result.is_crisis,
    should_block_coaching: result.should_block_coaching,
    affect: result.affect,
    metadata: {
      chunk_count: result.chunk_count,
      complexity_score: result.intersectionality.complexity_score,
      primary_domain: result.intersectionality.primary_focus?.domain ?? null,
      evidence_floor: result.triage_decision.evidence_floor,
      search_duration_ms: result.search_duration_ms,
      search_passes: result.search_passes,
      embedding_source: result.embedding_source,
      hyde_used: result.hyde_result?.method === 'hyde',
      memory_count: result.relevant_memories.length,
      cross_pillar_detected: result.cross_pillar?.cross_pillar_chunks_needed ?? false,
      profile_completeness: result.user_profile?.profile_completeness ?? 0,
      cultural_context_detected: result.cultural_context?.primary_culture ?? null,
      pending_follow_ups: result.pending_follow_ups.length,
    },
  };
}

// ============================================================================
// POST-RESPONSE HOOKS
// Call these after generating the MIO response to learn from the interaction.
// ============================================================================

/**
 * Extract and store memories from this interaction.
 * Call after generating the assistant response.
 */
export async function postResponseMemoryHook(
  userId: string,
  sessionId: string,
  userMessage: string,
  affect: AffectProfile | null,
  frameworksDiscussed: string[],
  issuesDetected: string[],
  generateEmbedding: (text: string) => Promise<number[]>,
): Promise<void> {
  const memories = extractMemoriesFromMessage(
    userMessage,
    sessionId,
    affect ?? undefined,
    frameworksDiscussed,
    issuesDetected,
  );

  if (memories.length > 0) {
    await storeMemories(userId, memories, generateEmbedding);
  }
}

/**
 * Detect escalation across conversation history.
 * Call periodically (every 3-5 messages) to check for worsening patterns.
 */
export function checkEscalation(
  affectHistory: AffectProfile[],
): ReturnType<typeof detectEscalation> {
  return detectEscalation(affectHistory);
}

/**
 * Track technique assignments from an assistant response.
 * Call after generating the MIO response to auto-detect and record
 * any techniques/exercises that were recommended.
 */
export async function postResponseTechniqueHook(
  userId: string,
  assistantResponse: string,
  frameworksUsed: string[],
  domainUsed: string,
  chunkId?: string,
): Promise<void> {
  const technique = detectTechniqueInResponse(assistantResponse, frameworksUsed, domainUsed);
  if (technique) {
    await recordTechniqueAssignment({
      user_id: userId,
      technique_name: technique.technique_name,
      framework_name: technique.framework_name,
      framework_domain: technique.framework_domain,
      chunk_id: chunkId,
    });
  }
}
