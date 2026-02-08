// ============================================================================
// TECHNIQUE OUTCOME SERVICE (Phase 8 - Outcome Intelligence)
// ============================================================================
//
// Tracks technique assignments, attempts, and outcomes to build a
// population-level effectiveness engine. Over time, this creates a
// self-improving RAG that recommends what ACTUALLY works.
//
// Tables: mio_technique_outcomes, mio_knowledge_chunks (effectiveness_score)
// ============================================================================

import { supabase } from '@/lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface TechniqueOutcome {
  id: string;
  user_id: string;
  technique_name: string;
  framework_name: string;
  framework_domain: string;
  chunk_id: string | null;
  assigned_at: string;
  attempted_at: string | null;
  reported_outcome_at: string | null;
  did_attempt: boolean;
  self_reported_helpfulness: number | null; // 1-5
  behavioral_change_detected: boolean;
  follow_up_notes: string | null;
  session_id: string | null;
}

export interface TechniqueAssignment {
  user_id: string;
  technique_name: string;
  framework_name: string;
  framework_domain: string;
  chunk_id?: string;
  session_id?: string;
}

export interface OutcomeReport {
  technique_id: string;
  did_attempt: boolean;
  helpfulness?: number; // 1-5
  behavioral_change?: boolean;
  notes?: string;
}

export interface FrameworkEffectiveness {
  framework_name: string;
  total_assigned: number;
  total_attempted: number;
  attempt_rate: number;
  avg_helpfulness: number;
  positive_outcome_rate: number;
}

export interface PendingFollowUp {
  id: string;
  technique_name: string;
  framework_name: string;
  assigned_at: string;
  days_since_assigned: number;
}

// ============================================================================
// TECHNIQUE ASSIGNMENT
// ============================================================================

/**
 * Record a technique assignment when the system recommends a specific
 * intervention to the user.
 */
export async function recordTechniqueAssignment(
  assignment: TechniqueAssignment
): Promise<string | null> {
  const { data, error } = await supabase
    .from('mio_technique_outcomes')
    .insert({
      user_id: assignment.user_id,
      technique_name: assignment.technique_name,
      framework_name: assignment.framework_name,
      framework_domain: assignment.framework_domain,
      chunk_id: assignment.chunk_id || null,
      session_id: assignment.session_id || null,
      assigned_at: new Date().toISOString(),
      did_attempt: false,
      behavioral_change_detected: false,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[TechniqueOutcome] Assignment error:', error.message);
    return null;
  }

  // Increment times_retrieved on the source chunk
  if (assignment.chunk_id) {
    await supabase.rpc('increment_chunk_retrieved', {
      chunk_id: assignment.chunk_id,
    }).then(({ error: rpcError }) => {
      if (rpcError) {
        // Non-critical: log and continue
        console.warn('[TechniqueOutcome] Could not increment retrieval count:', rpcError.message);
      }
    });
  }

  return data?.id || null;
}

// ============================================================================
// OUTCOME REPORTING
// ============================================================================

/**
 * Record the outcome when a user reports back on a technique they tried.
 */
export async function reportTechniqueOutcome(
  report: OutcomeReport
): Promise<boolean> {
  const { error } = await supabase
    .from('mio_technique_outcomes')
    .update({
      did_attempt: report.did_attempt,
      self_reported_helpfulness: report.helpfulness || null,
      behavioral_change_detected: report.behavioral_change || false,
      follow_up_notes: report.notes || null,
      attempted_at: report.did_attempt ? new Date().toISOString() : null,
      reported_outcome_at: new Date().toISOString(),
    })
    .eq('id', report.technique_id);

  if (error) {
    console.error('[TechniqueOutcome] Report error:', error.message);
    return false;
  }

  // Update chunk effectiveness score based on outcome
  await updateChunkEffectiveness(report.technique_id);

  return true;
}

// ============================================================================
// CHUNK EFFECTIVENESS SCORING
// ============================================================================

/**
 * Recalculate the effectiveness_score for a chunk based on all outcomes
 * associated with it. Uses a Bayesian-like approach with a prior.
 */
async function updateChunkEffectiveness(techniqueOutcomeId: string): Promise<void> {
  // Get the outcome and its chunk_id
  const { data: outcome } = await supabase
    .from('mio_technique_outcomes')
    .select('chunk_id, self_reported_helpfulness, did_attempt, behavioral_change_detected')
    .eq('id', techniqueOutcomeId)
    .single();

  if (!outcome?.chunk_id) return;

  // Get all outcomes for this chunk
  const { data: allOutcomes } = await supabase
    .from('mio_technique_outcomes')
    .select('self_reported_helpfulness, did_attempt, behavioral_change_detected')
    .eq('chunk_id', outcome.chunk_id)
    .not('reported_outcome_at', 'is', null);

  if (!allOutcomes || allOutcomes.length === 0) return;

  // Calculate effectiveness score
  // Prior: 0.5 (neutral) with weight of 5 virtual observations
  const PRIOR_SCORE = 0.5;
  const PRIOR_WEIGHT = 5;

  let positiveSignals = 0;
  let totalSignals = 0;

  for (const o of allOutcomes) {
    if (o.did_attempt) {
      totalSignals++;
      // Helpfulness 4-5 = positive, 1-2 = negative, 3 = neutral
      if (o.self_reported_helpfulness && o.self_reported_helpfulness >= 4) {
        positiveSignals++;
      }
      // Behavioral change is a strong positive signal
      if (o.behavioral_change_detected) {
        positiveSignals += 0.5;
        totalSignals += 0.5;
      }
    }
  }

  // Bayesian average with prior
  const effectivenessScore =
    (PRIOR_SCORE * PRIOR_WEIGHT + positiveSignals) /
    (PRIOR_WEIGHT + totalSignals);

  // Update the chunk
  const { error } = await supabase
    .from('mio_knowledge_chunks')
    .update({
      effectiveness_score: Math.round(effectivenessScore * 100) / 100,
      times_helpful: Math.round(positiveSignals),
    })
    .eq('id', outcome.chunk_id);

  if (error) {
    console.warn('[TechniqueOutcome] Chunk effectiveness update error:', error.message);
  }
}

// ============================================================================
// FOLLOW-UP DETECTION
// ============================================================================

/**
 * Get pending technique follow-ups for a user. These are techniques that
 * were assigned but not yet reported on (2-7 day window).
 */
export async function getPendingFollowUps(
  userId: string
): Promise<PendingFollowUp[]> {
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('mio_technique_outcomes')
    .select('id, technique_name, framework_name, assigned_at')
    .eq('user_id', userId)
    .is('reported_outcome_at', null)
    .lt('assigned_at', twoDaysAgo)
    .gt('assigned_at', sevenDaysAgo)
    .order('assigned_at', { ascending: false })
    .limit(3);

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    technique_name: row.technique_name,
    framework_name: row.framework_name,
    assigned_at: row.assigned_at,
    days_since_assigned: Math.floor(
      (Date.now() - new Date(row.assigned_at).getTime()) / (24 * 60 * 60 * 1000)
    ),
  }));
}

/**
 * Format pending follow-ups into a context string for the system prompt.
 */
export function formatFollowUpContext(followUps: PendingFollowUp[]): string {
  if (followUps.length === 0) return '';

  const items = followUps.map(
    (f) =>
      `- "${f.technique_name}" (${f.framework_name}) - assigned ${f.days_since_assigned} days ago`
  );

  return `\n[PENDING FOLLOW-UPS]\nThe user was given these techniques recently. Ask how they went:\n${items.join('\n')}\n`;
}

// ============================================================================
// AUTO-DETECT TECHNIQUE IN RESPONSE
// ============================================================================

/**
 * Scan an assistant response to detect technique assignments.
 * Uses pattern matching to find "try this", "exercise", "script" etc.
 */
export function detectTechniqueInResponse(
  responseText: string,
  frameworksUsed: string[],
  domainUsed: string
): { technique_name: string; framework_name: string; framework_domain: string } | null {
  // Patterns that indicate a technique assignment
  const techniquePatterns = [
    /try (?:this|the) (?:exercise|technique|approach|script|practice)[:\s]*["']?([^"'\n.]+)/i,
    /here'?s (?:a|an|the) (?:exercise|technique|script|practice)[:\s]*["']?([^"'\n.]+)/i,
    /(?:exercise|technique|practice)[:\s]*["']([^"']+)["']/i,
    /\*\*([^*]+)\*\*\s*(?:exercise|technique|script|practice)/i,
    /(?:step \d+|first|next):\s*(.+?)(?:\.|$)/im,
  ];

  for (const pattern of techniquePatterns) {
    const match = responseText.match(pattern);
    if (match) {
      return {
        technique_name: match[1].trim().slice(0, 200),
        framework_name: frameworksUsed[0] || 'general',
        framework_domain: domainUsed,
      };
    }
  }

  return null;
}

// ============================================================================
// POPULATION-LEVEL INSIGHTS
// ============================================================================

/**
 * Get framework effectiveness statistics. Used for:
 * 1. Informing default recommendations ("Couples like you find EFT helpful")
 * 2. Re-ranking chunks (boost effective frameworks)
 * 3. Dashboard reporting
 */
export async function getFrameworkEffectiveness(
  filters?: {
    domain?: string;
    min_observations?: number;
  }
): Promise<FrameworkEffectiveness[]> {
  let query = supabase
    .from('mio_technique_outcomes')
    .select('framework_name, did_attempt, self_reported_helpfulness, behavioral_change_detected');

  if (filters?.domain) {
    query = query.eq('framework_domain', filters.domain);
  }

  const { data, error } = await query;

  if (error || !data) return [];

  // Group by framework
  const groups: Record<string, typeof data> = {};
  for (const row of data) {
    if (!groups[row.framework_name]) {
      groups[row.framework_name] = [];
    }
    groups[row.framework_name].push(row);
  }

  const results: FrameworkEffectiveness[] = [];

  for (const [framework, outcomes] of Object.entries(groups)) {
    const minObs = filters?.min_observations || 5;
    if (outcomes.length < minObs) continue;

    const attempted = outcomes.filter((o) => o.did_attempt);
    const helpful = attempted.filter(
      (o) => o.self_reported_helpfulness && o.self_reported_helpfulness >= 4
    );

    results.push({
      framework_name: framework,
      total_assigned: outcomes.length,
      total_attempted: attempted.length,
      attempt_rate: attempted.length / outcomes.length,
      avg_helpfulness:
        attempted.reduce((sum, o) => sum + (o.self_reported_helpfulness || 3), 0) /
        (attempted.length || 1),
      positive_outcome_rate: helpful.length / (attempted.length || 1),
    });
  }

  // Sort by positive outcome rate
  return results.sort((a, b) => b.positive_outcome_rate - a.positive_outcome_rate);
}

/**
 * Get effectiveness data for a specific user's history.
 * Used to personalize framework recommendations.
 */
export async function getUserTechniqueHistory(
  userId: string
): Promise<{
  attempted: number;
  helpful_count: number;
  preferred_frameworks: string[];
  avoided_frameworks: string[];
}> {
  const { data, error } = await supabase
    .from('mio_technique_outcomes')
    .select('framework_name, did_attempt, self_reported_helpfulness')
    .eq('user_id', userId)
    .not('reported_outcome_at', 'is', null);

  if (error || !data || data.length === 0) {
    return {
      attempted: 0,
      helpful_count: 0,
      preferred_frameworks: [],
      avoided_frameworks: [],
    };
  }

  const attempted = data.filter((o) => o.did_attempt);
  const helpful = attempted.filter(
    (o) => o.self_reported_helpfulness && o.self_reported_helpfulness >= 4
  );
  const unhelpful = attempted.filter(
    (o) => o.self_reported_helpfulness && o.self_reported_helpfulness <= 2
  );

  // Count by framework
  const frameworkScores: Record<string, { positive: number; negative: number }> = {};
  for (const o of attempted) {
    if (!frameworkScores[o.framework_name]) {
      frameworkScores[o.framework_name] = { positive: 0, negative: 0 };
    }
    if (o.self_reported_helpfulness && o.self_reported_helpfulness >= 4) {
      frameworkScores[o.framework_name].positive++;
    }
    if (o.self_reported_helpfulness && o.self_reported_helpfulness <= 2) {
      frameworkScores[o.framework_name].negative++;
    }
  }

  const preferred = Object.entries(frameworkScores)
    .filter(([, s]) => s.positive > s.negative)
    .sort(([, a], [, b]) => b.positive - a.positive)
    .map(([name]) => name);

  const avoided = Object.entries(frameworkScores)
    .filter(([, s]) => s.negative > s.positive)
    .map(([name]) => name);

  return {
    attempted: attempted.length,
    helpful_count: helpful.length,
    preferred_frameworks: preferred.slice(0, 5),
    avoided_frameworks: avoided,
  };
}
