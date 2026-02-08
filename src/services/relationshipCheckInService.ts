/**
 * RKPI Module: Check-In Service
 * Manages weekly relationship check-ins — creation, completion, history.
 */

import { supabase } from "@/integrations/supabase/client";
import type {
  RelationshipCheckIn,
  RelationshipCheckInInsert,
  RelationshipCheckInUpdate,
  CheckInWithScores,
} from "@/types/relationship-kpis";

/**
 * Calculate the current ISO week string (YYYY-WNN format).
 */
export function getCurrentWeek(): string {
  const now = new Date();
  const jan4 = new Date(now.getFullYear(), 0, 4);
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000
  ) + 1;
  const weekNum = Math.ceil((dayOfYear + jan4.getDay() - 1) / 7);
  const paddedWeek = String(weekNum).padStart(2, "0");
  return `${now.getFullYear()}-W${paddedWeek}`;
}

/**
 * Get or create a check-in for the current week.
 * If a draft exists for this week, returns it. Otherwise creates a new one.
 */
export async function getOrCreateCurrentCheckIn(
  partnershipId?: string | null
): Promise<RelationshipCheckIn> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const currentWeek = getCurrentWeek();

  // Check for existing check-in this week
  const { data: existing, error: lookupError } = await supabase
    .from("relationship_check_ins")
    .select("*")
    .eq("user_id", user.id)
    .eq("check_in_week", currentWeek)
    .maybeSingle();

  if (lookupError) throw lookupError;
  if (existing) return existing as RelationshipCheckIn;

  // Create new check-in
  const { data, error } = await supabase
    .from("relationship_check_ins")
    .insert({
      user_id: user.id,
      check_in_week: currentWeek,
      check_in_date: new Date().toISOString().split("T")[0],
      partnership_id: partnershipId ?? null,
      status: "draft",
    })
    .select()
    .single();

  if (error) throw error;
  return data as RelationshipCheckIn;
}

/**
 * Get a specific check-in by ID.
 */
export async function getCheckInById(
  checkInId: string
): Promise<RelationshipCheckIn | null> {
  const { data, error } = await supabase
    .from("relationship_check_ins")
    .select("*")
    .eq("id", checkInId)
    .maybeSingle();

  if (error) throw error;
  return data as RelationshipCheckIn | null;
}

/**
 * Get a check-in with all associated scores, action items, and insight.
 */
export async function getCheckInWithScores(
  checkInId: string
): Promise<CheckInWithScores | null> {
  const { data: checkIn, error: ciError } = await supabase
    .from("relationship_check_ins")
    .select("*")
    .eq("id", checkInId)
    .maybeSingle();

  if (ciError) throw ciError;
  if (!checkIn) return null;

  const [scoresResult, actionsResult, insightResult] = await Promise.all([
    supabase
      .from("relationship_kpi_scores")
      .select("*")
      .eq("check_in_id", checkInId)
      .order("kpi_name"),
    supabase
      .from("relationship_action_items")
      .select("*")
      .eq("check_in_id", checkInId)
      .order("created_at"),
    supabase
      .from("relationship_insights")
      .select("*")
      .eq("check_in_id", checkInId)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (scoresResult.error) throw scoresResult.error;
  if (actionsResult.error) throw actionsResult.error;
  if (insightResult.error) throw insightResult.error;

  return {
    ...checkIn,
    scores: scoresResult.data ?? [],
    action_items: actionsResult.data ?? [],
    insight: insightResult.data ?? null,
  } as CheckInWithScores;
}

/**
 * Complete a check-in (mark as completed with timestamp).
 */
export async function completeCheckIn(
  checkInId: string
): Promise<RelationshipCheckIn> {
  const { data, error } = await supabase
    .from("relationship_check_ins")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", checkInId)
    .select()
    .single();

  if (error) throw error;
  return data as RelationshipCheckIn;
}

/**
 * Update a check-in.
 */
export async function updateCheckIn(
  checkInId: string,
  updates: RelationshipCheckInUpdate
): Promise<RelationshipCheckIn> {
  const { data, error } = await supabase
    .from("relationship_check_ins")
    .update(updates)
    .eq("id", checkInId)
    .select()
    .single();

  if (error) throw error;
  return data as RelationshipCheckIn;
}

/**
 * Get check-in history for the current user, ordered by week descending.
 */
export async function getCheckInHistory(
  limit: number = 12
): Promise<RelationshipCheckIn[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("relationship_check_ins")
    .select("*")
    .eq("user_id", user.id)
    .order("check_in_week", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as RelationshipCheckIn[];
}

/**
 * Get check-in history with scores for trend visualization.
 */
export async function getCheckInHistoryWithScores(
  limit: number = 12
): Promise<CheckInWithScores[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: checkIns, error: ciError } = await supabase
    .from("relationship_check_ins")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("check_in_week", { ascending: false })
    .limit(limit);

  if (ciError) throw ciError;
  if (!checkIns || checkIns.length === 0) return [];

  const checkInIds = checkIns.map((ci) => ci.id);

  const { data: scores, error: scoresError } = await supabase
    .from("relationship_kpi_scores")
    .select("*")
    .in("check_in_id", checkInIds);

  if (scoresError) throw scoresError;

  const scoresByCheckIn = new Map<string, typeof scores>();
  for (const score of scores ?? []) {
    const existing = scoresByCheckIn.get(score.check_in_id) ?? [];
    existing.push(score);
    scoresByCheckIn.set(score.check_in_id, existing);
  }

  return checkIns.map((ci) => ({
    ...ci,
    scores: scoresByCheckIn.get(ci.id) ?? [],
  })) as CheckInWithScores[];
}

/**
 * Get partner's completed check-ins for comparison (RLS enforced).
 */
export async function getPartnerCheckIns(
  partnershipId: string,
  limit: number = 12
): Promise<RelationshipCheckIn[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("relationship_check_ins")
    .select("*")
    .eq("partnership_id", partnershipId)
    .eq("status", "completed")
    .neq("user_id", user.id)
    .order("check_in_week", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as RelationshipCheckIn[];
}
