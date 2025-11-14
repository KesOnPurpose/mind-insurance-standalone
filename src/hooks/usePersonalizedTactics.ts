import { useQuery } from "@tanstack/react-query";
import { 
  getPersonalizedTactics, 
  getRecommendedWeekCount,
  getStartingWeek,
  getNextRecommendedTactic
} from "@/services/tacticFilterService";
import { getUserAssessment } from "@/services/assessmentService";

// Mock user ID for now - will be replaced with real auth later
const MOCK_USER_ID = '00000000-0000-0000-0000-000000000001';

export function usePersonalizedTactics() {
  // First, fetch user's assessment
  const { data: assessment, isLoading: isLoadingAssessment } = useQuery({
    queryKey: ['assessment', MOCK_USER_ID],
    queryFn: () => getUserAssessment(MOCK_USER_ID),
    staleTime: 5 * 60 * 1000,
  });
  
  // Then, fetch personalized tactics based on assessment
  const { data: tactics, isLoading: isLoadingTactics } = useQuery({
    queryKey: ['personalizedTactics', MOCK_USER_ID, assessment?.overall_score],
    queryFn: async () => {
      if (!assessment) return [];
      
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
    queryKey: ['nextTactic', MOCK_USER_ID],
    queryFn: async () => {
      if (!assessment) return null;
      
      return getNextRecommendedTactic(MOCK_USER_ID, {
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
