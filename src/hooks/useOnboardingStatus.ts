import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ============================================================================
// ONBOARDING STATUS HOOK
// ============================================================================
// Fetches user's onboarding state to determine assessment completion
// Used by AssessmentGuard to enforce assessment-first flow
// ============================================================================

export interface OnboardingStatus {
  user_id: string;
  onboarding_step: string | null;
  assessment_completed_at: string | null;
  has_seen_welcome: boolean | null;
  readiness_level: string | null;
  overall_score: number | null;
}

export function useOnboardingStatus(userId: string | undefined) {
  return useQuery({
    queryKey: ['onboardingStatus', userId],
    queryFn: async (): Promise<OnboardingStatus | null> => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('user_onboarding')
        .select('user_id, onboarding_step, assessment_completed_at, has_seen_welcome, readiness_level, overall_score')
        .eq('user_id', userId)
        .single();

      if (error) {
        // PGRST116 = no rows found (new user who hasn't started onboarding)
        if (error.code === 'PGRST116') {
          console.log('[useOnboardingStatus] No onboarding record found for user');
          return null;
        }
        console.error('[useOnboardingStatus] Error fetching onboarding status:', error);
        throw error;
      }

      return data as OnboardingStatus;
    },
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds - refresh frequently during onboarding
    retry: 1,
  });
}

// Helper to check if assessment is completed
export function isAssessmentCompleted(status: OnboardingStatus | null | undefined): boolean {
  return !!status?.assessment_completed_at;
}

// Helper to check current onboarding step
export function getOnboardingStep(status: OnboardingStatus | null | undefined): string {
  return status?.onboarding_step || 'new_user';
}
