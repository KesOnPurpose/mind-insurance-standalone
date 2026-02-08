/**
 * RIE Phase 1A: Separation Assessment Service
 * CRUD for the Vertex Model separation assessments.
 */

import { supabase } from "@/integrations/supabase/client";
import type {
  RelationshipSeparationAssessment,
  SeparationAssessmentInsert,
  SeparationAssessmentUpdate,
} from "@/types/relationship-separation";

/**
 * Get the latest separation assessment for the current user.
 */
export async function getLatestAssessment(): Promise<RelationshipSeparationAssessment | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("relationship_separation_assessments")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as RelationshipSeparationAssessment | null;
}

/**
 * Get all assessments for the current user (time-series).
 */
export async function getAssessmentHistory(
  limit = 20
): Promise<RelationshipSeparationAssessment[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("relationship_separation_assessments")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as RelationshipSeparationAssessment[];
}

/**
 * Create a new separation assessment.
 */
export async function createAssessment(
  input: SeparationAssessmentInsert
): Promise<RelationshipSeparationAssessment> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("relationship_separation_assessments")
    .insert({
      user_id: user.id,
      partnership_id: input.partnership_id ?? null,
      separation_angle: input.separation_angle,
      separation_stage: input.separation_stage,
      kpi_scores_snapshot: input.kpi_scores_snapshot ?? {},
      risk_factors: input.risk_factors ?? [],
      narrative_summary: input.narrative_summary ?? null,
      recommended_interventions: input.recommended_interventions ?? [],
      source_check_in_id: input.source_check_in_id ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as RelationshipSeparationAssessment;
}

/**
 * Update an existing assessment (e.g. add AI narrative).
 */
export async function updateAssessment(
  id: string,
  updates: SeparationAssessmentUpdate
): Promise<RelationshipSeparationAssessment> {
  const { data, error } = await supabase
    .from("relationship_separation_assessments")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as RelationshipSeparationAssessment;
}
