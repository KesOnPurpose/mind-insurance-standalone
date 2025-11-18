import { useQuery } from "@tanstack/react-query";
import {
  getPersonalizedTactics,
  getRecommendedWeekCount,
  getStartingWeek,
  getNextRecommendedTactic,
  getEnhancedPersonalizedTactics,
  calculateTotalCost
} from "@/services/tacticFilterService";
import { getUserAssessment } from "@/services/assessmentService";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProgress } from "@/services/progressService";
import { EnhancedUserAssessment, TacticWithPrerequisites } from "@/types/tactic";

export function usePersonalizedTactics() {
  const { user } = useAuth();

  // First, fetch user's assessment
  const { data: assessment, isLoading: isLoadingAssessment } = useQuery({
    queryKey: ['assessment', user?.id],
    queryFn: () => {
      if (!user?.id) throw new Error('User not authenticated');
      return getUserAssessment(user.id);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch user progress for prerequisite validation
  const { data: progressData } = useUserProgress(user?.id || '');

  // Then, fetch personalized tactics based on assessment
  // Use enhanced filtering if ownership_model is available (new assessment flow)
  const { data: tactics, isLoading: isLoadingTactics } = useQuery({
    queryKey: ['personalizedTactics', user?.id, assessment?.overall_score, assessment?.ownership_model, assessment?.immediate_priority, progressData?.length],
    queryFn: async () => {
      if (!assessment || !user?.id) return [];

      // Check if assessment has enhanced fields (ownership_model)
      const hasEnhancedFields = 'ownership_model' in assessment && assessment.ownership_model;

      if (hasEnhancedFields) {
        // Use new enhanced filtering with prerequisite validation
        const enhancedAssessment: EnhancedUserAssessment = {
          capital_available: assessment.capital_available,
          target_populations: assessment.target_populations || [],
          timeline: assessment.timeline,
          caregiving_experience: assessment.caregiving_experience,
          licensing_familiarity: assessment.licensing_familiarity,
          overall_score: assessment.overall_score,
          readiness_level: assessment.readiness_level,
          ownership_model: assessment.ownership_model,
          target_state: assessment.target_state,
          budget_min_usd: assessment.budget_min_usd,
          budget_max_usd: assessment.budget_max_usd,
          prioritized_populations: assessment.prioritized_populations
        };

        // Pass immediate_priority for priority-based sorting (ADDITIVE, not restrictive)
        const immediatePriority = assessment.immediate_priority as 'property_acquisition' | 'operations' | 'comprehensive' | 'scaling' | undefined;

        // Pass user.id for prerequisite validation (function fetches completed tactics internally)
        return getEnhancedPersonalizedTactics(enhancedAssessment, user.id, immediatePriority);
      }

      // Fallback to legacy filtering for older assessments
      return getPersonalizedTactics({
        capital_available: assessment.capital_available,
        target_populations: assessment.target_populations || [],
        timeline: assessment.timeline,
        caregiving_experience: assessment.caregiving_experience,
        licensing_familiarity: assessment.licensing_familiarity,
        overall_score: assessment.overall_score,
        readiness_level: assessment.readiness_level
      });
    },
    enabled: !!assessment, // Only run if assessment exists
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
  
  // Get next recommended tactic
  const { data: nextTactic } = useQuery({
    queryKey: ['nextTactic', user?.id],
    queryFn: async () => {
      if (!assessment || !user?.id) return null;
      
      return getNextRecommendedTactic(user.id, {
        capital_available: assessment.capital_available,
        target_populations: assessment.target_populations || [],
        timeline: assessment.timeline,
        caregiving_experience: assessment.caregiving_experience,
        licensing_familiarity: assessment.licensing_familiarity,
        overall_score: assessment.overall_score,
        readiness_level: assessment.readiness_level
      });
    },
    enabled: !!assessment,
    staleTime: 5 * 60 * 1000,
  });
  
  // Calculate recommended week count
  const recommendedWeeks = assessment 
    ? getRecommendedWeekCount({
        capital_available: assessment.capital_available,
        target_populations: assessment.target_populations || [],
        timeline: assessment.timeline,
        caregiving_experience: assessment.caregiving_experience,
        licensing_familiarity: assessment.licensing_familiarity,
        overall_score: assessment.overall_score,
        readiness_level: assessment.readiness_level
      })
    : 15;
  
  // Calculate starting week
  const startingWeek = assessment
    ? getStartingWeek({
        capital_available: assessment.capital_available,
        target_populations: assessment.target_populations || [],
        timeline: assessment.timeline,
        caregiving_experience: assessment.caregiving_experience,
        licensing_familiarity: assessment.licensing_familiarity,
        overall_score: assessment.overall_score,
        readiness_level: assessment.readiness_level
      })
    : 1;

  // Calculate total cost breakdown for budget tracking
  const costBreakdown = tactics ? calculateTotalCost(tactics) : {
    total_min: 0,
    total_max: 0,
    upfront_capital: 0,
    recurring_monthly: 0,
    one_time_fees: 0
  };

  // Count tactics with prerequisite issues
  const blockedTactics = tactics?.filter(t =>
    'can_start' in t && !(t as TacticWithPrerequisites).can_start
  ).length || 0;

  const criticalPathTactics = tactics?.filter(t => t.is_critical_path).length || 0;

  return {
    tactics: tactics || [],
    nextTactic,
    assessment,
    recommendedWeeks,
    startingWeek,
    isLoading: isLoadingAssessment || isLoadingTactics,
    totalTacticsCount: tactics?.length || 0,
    hasAssessment: !!assessment,
    // Enhanced metrics
    costBreakdown,
    blockedTactics,
    criticalPathTactics,
  };
}

