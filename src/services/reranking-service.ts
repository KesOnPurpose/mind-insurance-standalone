// ============================================================================
// RE-RANKING SERVICE
// After initial vector search returns ~20 candidate chunks, this service
// re-scores them using Claude-based cross-encoder logic. This catches
// semantically relevant chunks that vector similarity alone might miss.
//
// Method: Score each chunk against the original query using a lightweight
// Claude prompt that returns a relevance score (0-1). Re-order by score.
//
// Cost: ~$0.001 per re-rank batch (20 chunks, ~4K tokens)
// Latency: ~300ms (parallelized)
// ============================================================================

import { supabase } from '@/integrations/supabase/client';
import type { RAGProfileContext } from './relational-profile-service';
import type { AffectProfile } from './affect-detection-service';

// ============================================================================
// TYPES
// ============================================================================

export interface RerankCandidate {
  id: string;
  chunk_text: string;
  chunk_summary: string;
  framework_name: string;
  framework_domain: string;
  evidence_tier: string;
  granularity?: string;
  voice?: string;
  target_readiness?: string;
  effectiveness_score?: number;
  similarity: number;
  relevance_score: number;
  // Any additional fields from the search result
  [key: string]: unknown;
}

export interface RerankResult {
  reranked: RerankCandidate[];
  method: 'claude' | 'heuristic' | 'passthrough';
  rerank_time_ms: number;
}

// ============================================================================
// HEURISTIC RE-RANKING (Fast, no LLM needed)
// Uses multiple signals beyond vector similarity
// ============================================================================

export function rerankHeuristic(
  candidates: RerankCandidate[],
  options: {
    query: string;
    profile?: RAGProfileContext;
    affect?: AffectProfile;
    targetReadiness?: string;
    preferredVoice?: string;
  },
): RerankResult {
  const startTime = Date.now();

  const scored = candidates.map(chunk => {
    let boost = 0;

    // 1. Evidence tier boost (gold > silver > bronze > copper)
    const tierBoost: Record<string, number> = { gold: 0.15, silver: 0.10, bronze: 0.05, copper: 0 };
    boost += tierBoost[chunk.evidence_tier] || 0;

    // 2. Effectiveness score boost (learned from outcomes)
    if (chunk.effectiveness_score && chunk.effectiveness_score > 0.5) {
      boost += (chunk.effectiveness_score - 0.5) * 0.2; // Max +0.1
    }

    // 3. Framework preference boost (user likes this framework)
    if (options.profile?.frameworks_preferred?.includes(chunk.framework_name)) {
      boost += 0.1;
    }
    if (options.profile?.frameworks_avoided?.includes(chunk.framework_name)) {
      boost -= 0.15; // Penalize avoided frameworks
    }

    // 4. Readiness matching boost
    if (options.targetReadiness && chunk.target_readiness === options.targetReadiness) {
      boost += 0.08;
    }

    // 5. Voice preference boost
    if (options.preferredVoice && chunk.voice === options.preferredVoice) {
      boost += 0.05;
    }

    // 6. Granularity matching based on affect
    if (options.affect) {
      const readiness = options.affect.recommended_depth;
      const granularityMatch: Record<string, string[]> = {
        validation_only: ['validation', 'real_talk'],
        psychoeducation: ['concept', 'summary'],
        framework: ['concept', 'deep_dive'],
        action: ['micro_intervention', 'deep_dive', 'case_study'],
      };
      if (granularityMatch[readiness]?.includes(chunk.granularity || '')) {
        boost += 0.08;
      }
    }

    // 7. Keyword overlap boost (simple term matching)
    const queryTerms = options.query.toLowerCase().split(/\s+/).filter(t => t.length > 3);
    const chunkLower = (chunk.chunk_text || '').toLowerCase();
    const termOverlap = queryTerms.filter(t => chunkLower.includes(t)).length;
    boost += Math.min(termOverlap * 0.02, 0.1);

    return {
      ...chunk,
      relevance_score: chunk.relevance_score + boost,
    };
  });

  // Sort by adjusted relevance score
  scored.sort((a, b) => b.relevance_score - a.relevance_score);

  return {
    reranked: scored,
    method: 'heuristic',
    rerank_time_ms: Date.now() - startTime,
  };
}

// ============================================================================
// CLAUDE-BASED RE-RANKING (More accurate, costs ~$0.001/batch)
// ============================================================================

export async function rerankWithClaude(
  candidates: RerankCandidate[],
  query: string,
  options: {
    profile?: RAGProfileContext;
    topK?: number;
  } = {},
): Promise<RerankResult> {
  const startTime = Date.now();
  const topK = options.topK ?? 10;

  try {
    // Build compact representation of candidates for scoring
    const chunkSummaries = candidates.slice(0, 20).map((c, i) => ({
      idx: i,
      summary: (c.chunk_summary || c.chunk_text || '').slice(0, 200),
      framework: c.framework_name,
      domain: c.framework_domain,
    }));

    const { data, error } = await supabase.functions.invoke('rerank-chunks', {
      body: {
        query,
        chunks: chunkSummaries,
        profile_context: options.profile ? {
          attachment: options.profile.attachment_style,
          pattern: options.profile.primary_pattern,
          issues: options.profile.key_issues,
        } : null,
        top_k: topK,
      },
    });

    if (error || !data?.rankings) {
      // Fall back to heuristic
      return rerankHeuristic(candidates, { query, profile: options.profile });
    }

    // Apply Claude's rankings
    const rankings = data.rankings as Array<{ idx: number; score: number }>;
    const reranked: RerankCandidate[] = [];

    for (const rank of rankings) {
      if (rank.idx >= 0 && rank.idx < candidates.length) {
        reranked.push({
          ...candidates[rank.idx],
          relevance_score: rank.score,
        });
      }
    }

    // Sort by Claude's score
    reranked.sort((a, b) => b.relevance_score - a.relevance_score);

    return {
      reranked: reranked.slice(0, topK),
      method: 'claude',
      rerank_time_ms: Date.now() - startTime,
    };
  } catch {
    // Fall back to heuristic
    return rerankHeuristic(candidates, { query, profile: options.profile });
  }
}

// ============================================================================
// DIVERSITY-AWARE SELECTION
// Ensures we don't return 10 chunks from the same framework
// ============================================================================

export function diversifyResults(
  chunks: RerankCandidate[],
  maxPerFramework: number = 3,
  totalLimit: number = 10,
): RerankCandidate[] {
  const frameworkCounts: Record<string, number> = {};
  const diversified: RerankCandidate[] = [];

  for (const chunk of chunks) {
    const fw = chunk.framework_name || 'unknown';
    frameworkCounts[fw] = (frameworkCounts[fw] || 0) + 1;

    if (frameworkCounts[fw] <= maxPerFramework) {
      diversified.push(chunk);
    }

    if (diversified.length >= totalLimit) break;
  }

  return diversified;
}
