/**
 * FEAT-GH-006-C: useLessonAssessment Hook
 *
 * React hook for managing lesson assessments (quizzes) with:
 * - Fetching assessment questions for a tactic
 * - Submitting attempts with grading
 * - Tracking attempt history
 * - Integration with completion gates
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  getAssessmentForTactic,
  getAssessmentAttempts,
  submitAssessmentAttempt,
  getAssessmentStatus,
  hasPassedAssessment,
} from '@/services/lessonAssessmentService';
import type {
  LessonAssessment,
  LessonAssessmentAttempt,
  LessonAssessmentAnswer,
  LessonAssessmentResult,
} from '@/types/assessment';

// =============================================================================
// CONSTANTS
// =============================================================================

const ASSESSMENT_QUERY_STALE_TIME = 60000; // 1 minute stale time

// =============================================================================
// TYPES
// =============================================================================

interface UseLessonAssessmentOptions {
  tacticId: string;
  onPass?: () => void;
  onFail?: () => void;
}

interface UseLessonAssessmentReturn {
  // Assessment data
  assessment: LessonAssessment | null;
  attempts: LessonAssessmentAttempt[];
  latestAttempt: LessonAssessmentAttempt | null;
  lastResult: LessonAssessmentResult | null;

  // Status
  hasAssessment: boolean;
  hasPassed: boolean;
  attemptCount: number;
  maxAttempts: number | null;
  canAttempt: boolean;
  bestScore: number;

  // Loading states
  isLoadingAssessment: boolean;
  isLoadingAttempts: boolean;
  isSubmitting: boolean;
  error: string | null;

  // Actions
  submitAttempt: (answers: LessonAssessmentAnswer[]) => Promise<LessonAssessmentResult | null>;
  refreshAttempts: () => void;
  clearLastResult: () => void;
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export function useLessonAssessment(options: UseLessonAssessmentOptions): UseLessonAssessmentReturn {
  const { tacticId, onPass, onFail } = options;
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Local state for the last submission result
  const [lastResult, setLastResult] = useState<LessonAssessmentResult | null>(null);

  // =============================================================================
  // QUERIES
  // =============================================================================

  // Fetch assessment for tactic
  const assessmentQuery = useQuery({
    queryKey: ['lessonAssessment', tacticId],
    queryFn: async () => {
      const result = await getAssessmentForTactic(tacticId);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    staleTime: ASSESSMENT_QUERY_STALE_TIME,
    enabled: !!tacticId,
  });

  // Fetch user's attempts
  const attemptsQuery = useQuery({
    queryKey: ['lessonAssessmentAttempts', tacticId, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const result = await getAssessmentAttempts(user.id, tacticId);
      if (!result.success) throw new Error(result.error);
      return result.data || [];
    },
    staleTime: ASSESSMENT_QUERY_STALE_TIME,
    enabled: !!tacticId && !!user?.id,
  });

  // =============================================================================
  // MUTATIONS
  // =============================================================================

  const submitMutation = useMutation({
    mutationFn: async (answers: LessonAssessmentAnswer[]) => {
      if (!user?.id || !assessmentQuery.data) {
        throw new Error('Not authenticated or assessment not loaded');
      }

      const result = await submitAssessmentAttempt({
        userId: user.id,
        tacticId,
        assessmentId: assessmentQuery.data.id,
        answers,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data!;
    },
    onSuccess: (result) => {
      setLastResult(result);

      // Invalidate attempts query to refresh list
      queryClient.invalidateQueries({
        queryKey: ['lessonAssessmentAttempts', tacticId, user?.id],
      });

      // Invalidate completion gates
      queryClient.invalidateQueries({
        queryKey: ['completionGates', tacticId, user?.id],
      });

      if (result.passed) {
        toast.success('Assessment passed!', {
          description: `Score: ${result.score}% (${result.correct_count}/${result.total_questions} correct)`,
        });
        onPass?.();
      } else {
        const retriesMessage = result.can_retry
          ? result.attempts_remaining !== null
            ? `${result.attempts_remaining} attempt${result.attempts_remaining !== 1 ? 's' : ''} remaining`
            : 'You can try again'
          : 'No more attempts available';

        toast.error('Assessment not passed', {
          description: `Score: ${result.score}% (needed ${result.passing_score}%). ${retriesMessage}`,
        });
        onFail?.();
      }
    },
    onError: (error: Error) => {
      toast.error('Failed to submit assessment', {
        description: error.message,
      });
    },
  });

  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================

  const assessment = assessmentQuery.data ?? null;
  const attempts = attemptsQuery.data ?? [];
  const latestAttempt = attempts.length > 0 ? attempts[0] : null;
  const hasAssessment = assessment !== null;
  const hasPassed = attempts.some((a) => a.passed);
  const attemptCount = attempts.length;
  const maxAttempts = assessment?.max_attempts === -1 ? null : (assessment?.max_attempts ?? null);
  const canAttempt = hasAssessment && (maxAttempts === null || attemptCount < maxAttempts) && !hasPassed;
  const bestScore = attempts.length > 0 ? Math.max(...attempts.map((a) => a.score)) : 0;

  // =============================================================================
  // ACTIONS
  // =============================================================================

  const submitAttempt = useCallback(
    async (answers: LessonAssessmentAnswer[]): Promise<LessonAssessmentResult | null> => {
      try {
        return await submitMutation.mutateAsync(answers);
      } catch {
        return null;
      }
    },
    [submitMutation]
  );

  const refreshAttempts = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ['lessonAssessmentAttempts', tacticId, user?.id],
    });
  }, [queryClient, tacticId, user?.id]);

  const clearLastResult = useCallback(() => {
    setLastResult(null);
  }, []);

  // =============================================================================
  // RETURN
  // =============================================================================

  return {
    // Assessment data
    assessment,
    attempts,
    latestAttempt,
    lastResult,

    // Status
    hasAssessment,
    hasPassed,
    attemptCount,
    maxAttempts,
    canAttempt,
    bestScore,

    // Loading states
    isLoadingAssessment: assessmentQuery.isLoading,
    isLoadingAttempts: attemptsQuery.isLoading,
    isSubmitting: submitMutation.isPending,
    error: assessmentQuery.error?.message || attemptsQuery.error?.message || null,

    // Actions
    submitAttempt,
    refreshAttempts,
    clearLastResult,
  };
}

// =============================================================================
// SIMPLE STATUS HOOK
// =============================================================================

/**
 * Simple hook to check if a user has passed an assessment
 * Useful for gate checking without loading full assessment data
 */
export function useAssessmentStatus(tacticId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['assessmentStatus', tacticId, user?.id],
    queryFn: async () => {
      if (!user?.id) {
        return {
          hasAssessment: false,
          passed: true,
          attempts: 0,
          maxAttempts: null,
          bestScore: 0,
        };
      }
      return getAssessmentStatus(user.id, tacticId);
    },
    staleTime: ASSESSMENT_QUERY_STALE_TIME,
    enabled: !!tacticId && !!user?.id,
  });
}
