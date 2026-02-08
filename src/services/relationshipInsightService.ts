/**
 * RKPI Module: Insight Service
 * Manages AI-generated relationship insights (created by N8n webhook).
 * Client-side operations: read and rate insights.
 */

import { supabase } from "@/integrations/supabase/client";
import type {
  RelationshipInsight,
  RelationshipInsightUpdate,
} from "@/types/relationship-kpis";

/**
 * Get insight for a specific check-in.
 */
export async function getInsightForCheckIn(
  checkInId: string
): Promise<RelationshipInsight | null> {
  const { data, error } = await supabase
    .from("relationship_insights")
    .select("*")
    .eq("check_in_id", checkInId)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as RelationshipInsight | null;
}

/**
 * Get recent insights for the current user.
 */
export async function getRecentInsights(
  limit: number = 5
): Promise<RelationshipInsight[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("relationship_insights")
    .select("*")
    .eq("user_id", user.id)
    .order("generated_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as RelationshipInsight[];
}

/**
 * Rate an insight (1-5 stars).
 */
export async function rateInsight(
  insightId: string,
  rating: number
): Promise<RelationshipInsight> {
  if (rating < 1 || rating > 5) throw new Error("Rating must be between 1 and 5");

  const { data, error } = await supabase
    .from("relationship_insights")
    .update({ rating } satisfies RelationshipInsightUpdate)
    .eq("id", insightId)
    .select()
    .single();

  if (error) throw error;
  return data as RelationshipInsight;
}

/**
 * Get all insights by type.
 */
export async function getInsightsByType(
  insightType: string,
  limit: number = 10
): Promise<RelationshipInsight[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("relationship_insights")
    .select("*")
    .eq("user_id", user.id)
    .eq("insight_type", insightType)
    .order("generated_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as RelationshipInsight[];
}
