import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AssessmentAnswers } from "@/types/assessment";
import {
  calculateScores,
  saveAssessmentResults,
  getUserAssessment
} from "@/services/assessmentService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function useAssessment() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Query to fetch user's assessment
  const { data: assessment, isLoading } = useQuery({
    queryKey: ['assessment', user?.id],
    queryFn: () => {
      if (!user?.id) throw new Error('User not authenticated');
      return getUserAssessment(user.id);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Mutation to submit assessment
  const submitAssessment = useMutation({
    mutationFn: async (answers: AssessmentAnswers) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Calculate scores
      const scores = calculateScores(answers);

      // Save to database
      await saveAssessmentResults(user.id, answers, scores);

      // Update onboarding step to assessment_complete
      await supabase
        .from('user_onboarding')
        .update({ onboarding_step: 'assessment_complete' })
        .eq('user_id', user.id);

      return { answers, scores };
    },
    onSuccess: ({ scores }) => {
      // Invalidate queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['assessment', user?.id] });
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
    submitAssessmentAsync: submitAssessment.mutateAsync,
    isSubmitting: submitAssessment.isPending,
    hasAssessment: !!assessment,
  };
}
