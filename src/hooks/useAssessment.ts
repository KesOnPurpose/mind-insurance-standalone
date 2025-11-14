import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AssessmentAnswers } from "@/types/assessment";
import { 
  calculateScores, 
  saveAssessmentResults, 
  getUserAssessment 
} from "@/services/assessmentService";
import { useToast } from "@/hooks/use-toast";

// Mock user ID for now - will be replaced with real auth later
const MOCK_USER_ID = '00000000-0000-0000-0000-000000000001';

export function useAssessment() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Query to fetch user's assessment
  const { data: assessment, isLoading } = useQuery({
    queryKey: ['assessment', MOCK_USER_ID],
    queryFn: () => getUserAssessment(MOCK_USER_ID),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Mutation to submit assessment
  const submitAssessment = useMutation({
    mutationFn: async (answers: AssessmentAnswers) => {
      // Calculate scores
      const scores = calculateScores(answers);
      
      // Save to database
      await saveAssessmentResults(MOCK_USER_ID, answers, scores);
      
      return { answers, scores };
    },
    onSuccess: ({ scores }) => {
      // Invalidate queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['assessment'] });
      queryClient.invalidateQueries({ queryKey: ['personalizedTactics'] });
      
      // Show success message with readiness level
      const readinessLabels = {
        foundation_building: 'Foundation Building',
        accelerated_learning: 'Accelerated Learning',
        fast_track: 'Fast Track',
        expert_implementation: 'Expert Implementation'
      };
      
      toast({
        title: "Assessment Complete! 🎉",
        description: `Your readiness level: ${readinessLabels[scores.readiness_level]} (${scores.overall_score}/100)`,
      });
    },
    onError: (error) => {
      console.error('Failed to submit assessment:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save assessment. Please try again.",
      });
    }
  });
  
  return {
    assessment,
    isLoading,
    submitAssessment: submitAssessment.mutate,
    isSubmitting: submitAssessment.isPending,
    hasAssessment: !!assessment,
  };
}
