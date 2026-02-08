// ============================================================================
// AGENTIC RETRIEVAL SERVICE
// After initial retrieval, evaluates whether the retrieved chunks adequately
// answer the user's question. If gaps are found, generates follow-up queries
// and runs additional search passes.
//
// This is what makes the system "think" about whether it has enough info:
// "I found chunks about communication, but the user also mentioned money
//  stress - let me search specifically for financial conflict content."
//
// Max 2 follow-up passes to avoid latency spiral.
// ============================================================================

import type { RAGProfileContext } from './relational-profile-service';
import type { TriageDecision } from './relational-triage-service';
import type { CrossPillarSignals } from './cross-pillar-detection-service';
import type { SubQuery } from './query-decomposition-service';

// ============================================================================
// TYPES
// ============================================================================

export interface GapAnalysis {
  has_gaps: boolean;
  covered_domains: string[];
  missing_domains: string[];
  covered_issues: string[];
  missing_issues: string[];
  follow_up_queries: SubQuery[];
  reasoning: string;
}

export interface AgenticRetrievalResult {
  follow_up_queries: SubQuery[];
  passes_needed: number;
  gaps_found: string[];
  method: 'rule_based' | 'llm';
}

// ============================================================================
// RULE-BASED GAP ANALYSIS (Fast, always available)
// ============================================================================

/**
 * Analyze retrieved chunks for coverage gaps.
 * Compares what was expected (from triage + cross-pillar) vs what was retrieved.
 */
export function analyzeRetrievalGaps(
  originalQuery: string,
  retrievedChunks: Array<{ framework_domain: string; framework_name: string; [key: string]: unknown }>,
  context: {
    triage?: TriageDecision;
    crossPillar?: CrossPillarSignals;
    profile?: RAGProfileContext;
    decomposedQueries?: SubQuery[];
  },
): GapAnalysis {
  const coveredDomains = new Set<string>();
  const coveredFrameworks = new Set<string>();

  for (const chunk of retrievedChunks) {
    if (chunk.framework_domain) coveredDomains.add(chunk.framework_domain);
    if (chunk.framework_name) coveredFrameworks.add(chunk.framework_name);
  }

  const missingDomains: string[] = [];
  const missingIssues: string[] = [];
  const followUpQueries: SubQuery[] = [];
  const reasons: string[] = [];

  // Check 1: Did triage recommend domains we didn't cover?
  if (context.triage) {
    for (const domain of context.triage.recommended_domains) {
      if (!coveredDomains.has(domain)) {
        missingDomains.push(domain);
        followUpQueries.push({
          query_text: `${domain.replace(/_/g, ' ')} guidance for relationships`,
          target_domain: domain,
          reasoning: `Triage recommended ${domain} but no chunks retrieved from this domain`,
          priority: 2,
        });
      }
    }
  }

  // Check 2: Cross-pillar signals that weren't addressed
  if (context.crossPillar?.cross_pillar_chunks_needed) {
    const nonRelationalPillars = context.crossPillar.detected_pillars
      .filter(p => p.pillar !== 'relational' && p.confidence >= 0.6);

    for (const pillar of nonRelationalPillars) {
      const hasRelevantChunk = retrievedChunks.some(c => {
        const tags = (c as Record<string, unknown>).cross_pillar_tags;
        return Array.isArray(tags) && tags.includes(pillar.pillar);
      });

      if (!hasRelevantChunk) {
        missingIssues.push(`${pillar.pillar}_cross_pillar`);
        followUpQueries.push({
          query_text: `how ${pillar.pillar} factors affect relationships: ${pillar.evidence.join(', ')}`,
          target_domain: 'communication_conflict', // Default domain for cross-pillar
          reasoning: `Cross-pillar ${pillar.pillar} signal (${(pillar.confidence * 100).toFixed(0)}%) not covered in retrieved chunks`,
          priority: 2,
        });
      }
    }
  }

  // Check 3: Profile-informed gaps (known pattern not addressed)
  if (context.profile && context.profile.primary_pattern !== 'unassessed') {
    const patternAddressed = retrievedChunks.some(c =>
      (c as Record<string, unknown>).chunk_text &&
      String((c as Record<string, unknown>).chunk_text).toLowerCase().includes(
        context.profile!.primary_pattern.replace(/_/g, ' ').toLowerCase()
      )
    );

    if (!patternAddressed && retrievedChunks.length > 0) {
      followUpQueries.push({
        query_text: `${context.profile.primary_pattern.replace(/_/g, ' ')} relationship dynamic strategies`,
        target_domain: 'foundation_attachment',
        reasoning: `User's known pattern (${context.profile.primary_pattern}) not addressed in results`,
        priority: 3,
      });
    }
  }

  // Check 4: Decomposed sub-queries that weren't satisfied
  if (context.decomposedQueries) {
    for (const subQuery of context.decomposedQueries) {
      const domainCovered = coveredDomains.has(subQuery.target_domain);
      if (!domainCovered) {
        // Re-use the sub-query as a follow-up
        followUpQueries.push({
          ...subQuery,
          reasoning: `Sub-query for ${subQuery.target_domain} returned no results`,
          priority: subQuery.priority,
        });
      }
    }
  }

  if (missingDomains.length > 0) {
    reasons.push(`Missing domains: ${missingDomains.join(', ')}`);
  }
  if (missingIssues.length > 0) {
    reasons.push(`Missing issues: ${missingIssues.join(', ')}`);
  }

  // Limit follow-up queries (max 3)
  const limitedFollowUps = followUpQueries
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 3);

  return {
    has_gaps: limitedFollowUps.length > 0,
    covered_domains: [...coveredDomains],
    missing_domains: missingDomains,
    covered_issues: [],
    missing_issues: missingIssues,
    follow_up_queries: limitedFollowUps,
    reasoning: reasons.join('; ') || 'No significant gaps detected',
  };
}

/**
 * Merge results from multiple search passes, deduplicating by chunk ID.
 * Keeps the highest relevance score for duplicate chunks.
 */
export function mergeSearchResults<T extends { id: string; relevance_score: number }>(
  ...resultSets: T[][]
): T[] {
  const byId = new Map<string, T>();

  for (const results of resultSets) {
    for (const chunk of results) {
      const existing = byId.get(chunk.id);
      if (!existing || chunk.relevance_score > existing.relevance_score) {
        byId.set(chunk.id, chunk);
      }
    }
  }

  return [...byId.values()].sort((a, b) => b.relevance_score - a.relevance_score);
}
