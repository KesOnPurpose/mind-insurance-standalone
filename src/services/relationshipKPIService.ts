/**
 * RKPI Module: KPI Score Service
 * Manages individual KPI scores within check-ins.
 */

import { supabase } from "@/integrations/supabase/client";
import type {
  RelationshipKPIScore,
  RelationshipKPIScoreInsert,
  RelationshipKPIScoreUpdate,
  RelationshipKPIName,
  ScoreCategory,
} from "@/types/relationship-kpis";

/**
 * Calculate score category from a numeric score.
 */
export function getScoreCategory(score: number): ScoreCategory {
  if (score >= 1 && score <= 3) return "critical";
  if (score >= 4 && score <= 6) return "needs_attention";
  if (score >= 7 && score <= 8) return "good";
  if (score >= 9 && score <= 10) return "excellent";
  return "unknown";
}

/**
 * Get a Tailwind color class for a score category.
 */
export function getScoreColor(category: ScoreCategory): string {
  switch (category) {
    case "critical":
      return "text-red-600";
    case "needs_attention":
      return "text-amber-500";
    case "good":
      return "text-green-600";
    case "excellent":
      return "text-emerald-500";
    default:
      return "text-gray-400";
  }
}

/**
 * Get a Tailwind background color class for a score category.
 */
export function getScoreBgColor(category: ScoreCategory): string {
  switch (category) {
    case "critical":
      return "bg-red-100";
    case "needs_attention":
      return "bg-amber-100";
    case "good":
      return "bg-green-100";
    case "excellent":
      return "bg-emerald-100";
    default:
      return "bg-gray-100";
  }
}

/**
 * Calculate overall score from an array of KPI scores.
 */
export function calculateOverallScore(scores: RelationshipKPIScore[]): number | null {
  if (scores.length === 0) return null;
  const sum = scores.reduce((acc, s) => acc + s.score, 0);
  return Math.round((sum / scores.length) * 10) / 10;
}

/**
 * Get all KPI scores for a specific check-in.
 */
export async function getScoresForCheckIn(
  checkInId: string
): Promise<RelationshipKPIScore[]> {
  const { data, error } = await supabase
    .from("relationship_kpi_scores")
    .select("*")
    .eq("check_in_id", checkInId)
    .order("kpi_name");

  if (error) throw error;
  return (data ?? []) as RelationshipKPIScore[];
}

/**
 * Upsert a single KPI score (insert or update by check_in_id + kpi_name).
 */
export async function upsertKPIScore(
  input: RelationshipKPIScoreInsert
): Promise<RelationshipKPIScore> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("relationship_kpi_scores")
    .upsert(
      {
        check_in_id: input.check_in_id,
        user_id: user.id,
        kpi_name: input.kpi_name,
        score: input.score,
        notes: input.notes ?? null,
        is_private: input.is_private ?? false,
        shared_with_partner: input.shared_with_partner ?? true,
      },
      { onConflict: "check_in_id,kpi_name" }
    )
    .select()
    .single();

  if (error) throw error;
  return data as RelationshipKPIScore;
}

/**
 * Batch upsert all KPI scores for a check-in.
 */
export async function batchUpsertKPIScores(
  checkInId: string,
  scores: Array<{
    kpiName: RelationshipKPIName;
    score: number;
    notes?: string | null;
    isPrivate?: boolean;
  }>
): Promise<RelationshipKPIScore[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const rows = scores.map((s) => ({
    check_in_id: checkInId,
    user_id: user.id,
    kpi_name: s.kpiName,
    score: s.score,
    notes: s.notes ?? null,
    is_private: s.isPrivate ?? false,
    shared_with_partner: !(s.isPrivate ?? false),
  }));

  const { data, error } = await supabase
    .from("relationship_kpi_scores")
    .upsert(rows, { onConflict: "check_in_id,kpi_name" })
    .select();

  if (error) throw error;
  return (data ?? []) as RelationshipKPIScore[];
}

/**
 * Update a single KPI score.
 */
export async function updateKPIScore(
  scoreId: string,
  updates: RelationshipKPIScoreUpdate
): Promise<RelationshipKPIScore> {
  const { data, error } = await supabase
    .from("relationship_kpi_scores")
    .update(updates)
    .eq("id", scoreId)
    .select()
    .single();

  if (error) throw error;
  return data as RelationshipKPIScore;
}

/**
 * Get partner's KPI scores for a specific check-in (RLS enforced: only non-private, shared).
 */
export async function getPartnerScoresForCheckIn(
  checkInId: string
): Promise<RelationshipKPIScore[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // RLS already filters: is_private=false AND shared_with_partner=true AND ci.user_id != auth.uid()
  const { data, error } = await supabase
    .from("relationship_kpi_scores")
    .select("*")
    .eq("check_in_id", checkInId)
    .neq("user_id", user.id)
    .order("kpi_name");

  if (error) throw error;
  return (data ?? []) as RelationshipKPIScore[];
}

/**
 * Get historical scores for a specific KPI over time.
 */
export async function getKPIScoreHistory(
  kpiName: RelationshipKPIName,
  limit: number = 12
): Promise<Array<{ week: string; score: number }>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("relationship_kpi_scores")
    .select(`
      score,
      relationship_check_ins!inner (
        check_in_week,
        status
      )
    `)
    .eq("user_id", user.id)
    .eq("kpi_name", kpiName)
    .eq("relationship_check_ins.status", "completed")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map((row: Record<string, unknown>) => {
    const checkIn = row.relationship_check_ins as Record<string, unknown>;
    return {
      week: checkIn.check_in_week as string,
      score: row.score as number,
    };
  }).reverse();
}
