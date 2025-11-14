import { useQuery } from "@tanstack/react-query";
import { 
  getPersonalizedTactics, 
  getRecommendedWeekCount,
  getStartingWeek,
  getNextRecommendedTactic
} from "@/services/tacticFilterService";
import { getUserAssessment } from "@/services/assessmentService";
import { useAuth } from "@/contexts/AuthContext";

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
  
  // Then, fetch personalized tactics based on assessment
  const { data: tactics, isLoading: isLoadingTactics } = useQuery({
    queryKey: ['personalizedTactics', user?.id, assessment?.overall_score],
    queryFn: async () => {
      if (!assessment || !user?.id) return [];
      
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
  
  return {
    tactics: tactics || [],
    nextTactic,
    assessment,
    recommendedWeeks,
    startingWeek,
    isLoading: isLoadingAssessment || isLoadingTactics,
    totalTacticsCount: tactics?.length || 0,
    hasAssessment: !!assessment,
  };
}
