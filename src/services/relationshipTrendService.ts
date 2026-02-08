/**
 * RKPI Module: Trend & Analytics Service
 * Manages trend cache and analytics computations.
 */

import { supabase } from "@/integrations/supabase/client";
import type {
  RelationshipTrendCache,
  RelationshipTrendCacheInsert,
  RelationshipKPIName,
  TrendTimeframe,
  TrendDirection,
  HeatMapCell,
  PartnerScoreComparison,
} from "@/types/relationship-kpis";
import { KPI_DEFINITIONS } from "@/types/relationship-kpis";

/**
 * Get all cached trends for the current user.
 */
export async function getUserTrends(): Promise<RelationshipTrendCache[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("relationship_trend_cache")
    .select("*")
    .eq("user_id", user.id)
    .order("kpi_name");

  if (error) throw error;
  return (data ?? []) as RelationshipTrendCache[];
}

/**
 * Get trends for a specific timeframe.
 */
export async function getTrendsByTimeframe(
  timeframe: TrendTimeframe
): Promise<RelationshipTrendCache[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("relationship_trend_cache")
    .select("*")
    .eq("user_id", user.id)
    .eq("timeframe", timeframe)
    .order("kpi_name");

  if (error) throw error;
  return (data ?? []) as RelationshipTrendCache[];
}

/**
 * Recalculate and upsert trend cache for all KPIs and timeframes.
 * Called after completing a check-in.
 */
export async function recalculateTrends(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const timeframes: Array<{ key: TrendTimeframe; weeks: number }> = [
    { key: "4_weeks", weeks: 4 },
    { key: "3_months", weeks: 13 },
    { key: "6_months", weeks: 26 },
    { key: "all_time", weeks: 9999 },
  ];

  // Get all completed check-ins with scores
  const { data: scores, error: scoresError } = await supabase
    .from("relationship_kpi_scores")
    .select(`
      kpi_name,
      score,
      created_at,
      relationship_check_ins!inner (
        check_in_week,
        status
      )
    `)
    .eq("user_id", user.id)
    .eq("relationship_check_ins.status", "completed")
    .order("created_at", { ascending: true });

  if (scoresError) throw scoresError;
  if (!scores || scores.length === 0) return;

  const kpiNames = KPI_DEFINITIONS.map((k) => k.name);
  const rows: Array<{
    user_id: string;
    kpi_name: string;
    timeframe: string;
    average_score: number | null;
    trend_direction: TrendDirection | null;
    week_over_week_change: number | null;
    last_calculated: string;
  }> = [];

  for (const kpi of kpiNames) {
    const kpiScores = scores.filter((s) => s.kpi_name === kpi);
    if (kpiScores.length === 0) continue;

    for (const tf of timeframes) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - tf.weeks * 7);

      const filteredScores = tf.key === "all_time"
        ? kpiScores
        : kpiScores.filter((s) => new Date(s.created_at) >= cutoff);

      if (filteredScores.length === 0) continue;

      const avg =
        filteredScores.reduce((sum, s) => sum + s.score, 0) / filteredScores.length;

      let direction: TrendDirection | null = null;
      let wowChange: number | null = null;

      if (filteredScores.length >= 2) {
        const latest = filteredScores[filteredScores.length - 1].score;
        const previous = filteredScores[filteredScores.length - 2].score;
        wowChange = Math.round((latest - previous) * 10) / 10;

        if (wowChange > 0.5) direction = "improving";
        else if (wowChange < -0.5) direction = "declining";
        else direction = "stable";
      }

      rows.push({
        user_id: user.id,
        kpi_name: kpi,
        timeframe: tf.key,
        average_score: Math.round(avg * 10) / 10,
        trend_direction: direction,
        week_over_week_change: wowChange,
        last_calculated: new Date().toISOString(),
      });
    }
  }

  if (rows.length > 0) {
    const { error } = await supabase
      .from("relationship_trend_cache")
      .upsert(rows, { onConflict: "user_id,kpi_name,timeframe" });

    if (error) throw error;
  }
}

/**
 * Build heat map data from check-in history.
 * Returns a grid of KPI × Week with score and category.
 */
export async function buildHeatMapData(
  weeks: number = 8
): Promise<HeatMapCell[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: checkIns, error: ciError } = await supabase
    .from("relationship_check_ins")
    .select("id, check_in_week")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("check_in_week", { ascending: false })
    .limit(weeks);

  if (ciError) throw ciError;
  if (!checkIns || checkIns.length === 0) return [];

  const checkInIds = checkIns.map((ci) => ci.id);

  const { data: scores, error: scoresError } = await supabase
    .from("relationship_kpi_scores")
    .select("check_in_id, kpi_name, score, score_category")
    .in("check_in_id", checkInIds);

  if (scoresError) throw scoresError;

  const weekMap = new Map(checkIns.map((ci) => [ci.id, ci.check_in_week]));
  const cells: HeatMapCell[] = [];

  for (const score of scores ?? []) {
    cells.push({
      kpiName: score.kpi_name as RelationshipKPIName,
      week: weekMap.get(score.check_in_id) ?? "",
      score: score.score,
      category: score.score_category ?? null,
    });
  }

  return cells;
}

/**
 * Build partner score comparison data for the latest check-in.
 */
export async function buildPartnerComparison(
  partnershipId: string
): Promise<PartnerScoreComparison[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Get latest check-ins for both users in this partnership
  const { data: userCheckIn, error: userError } = await supabase
    .from("relationship_check_ins")
    .select("id")
    .eq("user_id", user.id)
    .eq("partnership_id", partnershipId)
    .eq("status", "completed")
    .order("check_in_week", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (userError) throw userError;

  const { data: partnerCheckIn, error: partnerError } = await supabase
    .from("relationship_check_ins")
    .select("id")
    .eq("partnership_id", partnershipId)
    .eq("status", "completed")
    .neq("user_id", user.id)
    .order("check_in_week", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (partnerError) throw partnerError;

  const kpiNames = KPI_DEFINITIONS.map((k) => k.name);
  const comparisons: PartnerScoreComparison[] = [];

  // Get user's scores
  let userScores: Record<string, number> = {};
  if (userCheckIn) {
    const { data, error } = await supabase
      .from("relationship_kpi_scores")
      .select("kpi_name, score")
      .eq("check_in_id", userCheckIn.id);

    if (error) throw error;
    userScores = Object.fromEntries((data ?? []).map((s) => [s.kpi_name, s.score]));
  }

  // Get partner's scores (RLS filters private scores)
  let partnerScores: Record<string, number> = {};
  if (partnerCheckIn) {
    const { data, error } = await supabase
      .from("relationship_kpi_scores")
      .select("kpi_name, score")
      .eq("check_in_id", partnerCheckIn.id)
      .neq("user_id", user.id);

    if (error) throw error;
    partnerScores = Object.fromEntries((data ?? []).map((s) => [s.kpi_name, s.score]));
  }

  for (const kpi of kpiNames) {
    const userScore = userScores[kpi] ?? null;
    const partnerScore = partnerScores[kpi] ?? null;
    const difference =
      userScore !== null && partnerScore !== null
        ? Math.round((userScore - partnerScore) * 10) / 10
        : null;

    comparisons.push({
      kpiName: kpi,
      userScore,
      partnerScore,
      difference,
    });
  }

  return comparisons;
}
