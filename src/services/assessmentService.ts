// ============================================================================
// GROUPHOME STANDALONE: REBUILT SERVICE
// This file was recreated during GH standalone transformation.
// The original MIO-specific assessmentService.ts was deleted.
// This version queries the user_onboarding table for GH business assessments.
// ============================================================================

import { supabase } from "@/integrations/supabase/client";

export interface UserAssessment {
  capital_available: string;
  target_populations: string[];
  timeline: string;
  caregiving_experience: string;
  licensing_familiarity: string;
  overall_score: number;
  readiness_level: string;
  // Enhanced fields
  ownership_model?: string;
  target_state?: string;
  budget_min_usd?: number;
  budget_max_usd?: number;
  prioritized_populations?: string[];
  immediate_priority?: string;
}

/**
 * Get user's GH business assessment from user_onboarding table
 * Returns null if user has not completed assessment
 */
export async function getUserAssessment(userId: string): Promise<UserAssessment | null> {
  if (!userId) {
    console.warn('[assessmentService] getUserAssessment called without userId');
    return null;
  }

  const { data, error } = await supabase
    .from('user_onboarding')
    .select(`
      capital_available,
      target_populations,
      timeline,
      caregiving_experience,
      licensing_familiarity,
      overall_score,
      readiness_level,
      ownership_model,
      target_state,
      budget_min_usd,
      budget_max_usd,
      immediate_priority
    `)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('[assessmentService] Error fetching user assessment:', error);
    return null;
  }

  if (!data) {
    console.log('[assessmentService] No assessment found for user:', userId);
    return null;
  }

  // Return assessment with default values for missing fields
  return {
    capital_available: data.capital_available || 'less-5k',
    target_populations: data.target_populations || [],
    timeline: data.timeline || 'within-year',
    caregiving_experience: data.caregiving_experience || 'no-experience',
    licensing_familiarity: data.licensing_familiarity || 'not-familiar',
    overall_score: data.overall_score || 0,
    readiness_level: data.readiness_level || 'foundation_building',
    ownership_model: data.ownership_model || undefined,
    target_state: data.target_state || undefined,
    budget_min_usd: data.budget_min_usd || undefined,
    budget_max_usd: data.budget_max_usd || undefined,
    prioritized_populations: data.target_populations || undefined, // Use same as target_populations
    immediate_priority: data.immediate_priority || undefined,
  };
}

/**
 * Check if user has completed the initial assessment
 */
export async function hasCompletedAssessment(userId: string): Promise<boolean> {
  if (!userId) return false;

  const { data, error } = await supabase
    .from('user_onboarding')
    .select('overall_score, assessment_completed_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  // Consider assessment complete if they have an overall_score or completed timestamp
  return (data.overall_score !== null && data.overall_score > 0) ||
         data.assessment_completed_at !== null;
}

/**
 * Update user's assessment data
 */
export async function updateUserAssessment(
  userId: string,
  assessment: Partial<UserAssessment>
): Promise<boolean> {
  if (!userId) {
    console.error('[assessmentService] updateUserAssessment called without userId');
    return false;
  }

  const { error } = await supabase
    .from('user_onboarding')
    .upsert({
      user_id: userId,
      ...assessment,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id'
    });

  if (error) {
    console.error('[assessmentService] Error updating assessment:', error);
    return false;
  }

  return true;
}
