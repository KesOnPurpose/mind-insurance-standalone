import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { TacticWithProgress, WeekSummary, JourneyPhase } from '@/types/tactic';
import type {
  CompletionGateResult,
  CompletionGateStatus,
  CompletionGateType,
} from '@/types/assessment';
import { getVideoProgress } from '@/services/videoProgressService';
import { getAssessmentStatus } from '@/services/lessonAssessmentService';

export function useUserProgress(userId: string) {
  return useQuery({
    queryKey: ['userProgress', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gh_user_tactic_progress')
        .select('*')
        .eq('user_id', userId);
      
      if (error) throw error;
      return data;
    },
    staleTime: 30000, // 30 seconds
  });
}

export function useStartTactic() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, tacticId }: { userId: string; tacticId: string }) => {
      const { data, error } = await supabase
        .from('gh_user_tactic_progress')
        .upsert({
          user_id: userId,
          tactic_id: tacticId,
          status: 'in_progress',
          started_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,tactic_id'
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProgress'] });
      toast.success('Tactic started! 🚀');
    },
    onError: (error: Error) => {
      console.error('Failed to start tactic:', error);
      toast.error('Failed to start tactic');
    }
  });
}

export function useCompleteTactic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      tacticId,
      notes
    }: {
      userId: string;
      tacticId: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('gh_user_tactic_progress')
        .upsert({
          user_id: userId,
          tactic_id: tacticId,
          status: 'completed',
          completed_at: new Date().toISOString(),
          notes,
        }, {
          onConflict: 'user_id,tactic_id'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProgress'] });
      toast.success('🎉 Tactic completed! +1 to your journey', {
        duration: 3000,
      });
    },
    onError: (error: Error) => {
      console.error('Failed to complete tactic:', error);
      toast.error('Failed to complete tactic');
    }
  });
}

export function useSaveNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      tacticId,
      notes
    }: {
      userId: string;
      tacticId: string;
      notes: string;
    }) => {
      // First check if record exists
      const { data: existing } = await supabase
        .from('gh_user_tactic_progress')
        .select('status, started_at')
        .eq('user_id', userId)
        .eq('tactic_id', tacticId)
        .single();

      const { data, error } = await supabase
        .from('gh_user_tactic_progress')
        .upsert({
          user_id: userId,
          tactic_id: tacticId,
          status: existing?.status || 'in_progress',
          started_at: existing?.started_at || new Date().toISOString(),
          notes,
        }, {
          onConflict: 'user_id,tactic_id'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProgress'] });
      toast.success('Notes saved!', {
        duration: 2000,
      });
    },
    onError: (error: Error) => {
      console.error('Failed to save notes:', error);
      toast.error('Failed to save notes');
    }
  });
}

export function calculateWeekProgress(
  tactics: TacticWithProgress[], 
  weekNumber: number
): WeekSummary {
  const weekTactics = tactics.filter(t => t.week_assignment === weekNumber);
  const completed = weekTactics.filter(t => t.status === 'completed').length;
  const inProgress = weekTactics.filter(t => t.status === 'in_progress').length;
  const estimatedHours = weekTactics.reduce((sum, t) => {
    const hours = parseEstimatedTime(t.estimated_time);
    return sum + hours;
  }, 0);
  
  return {
    weekNumber,
    weekTitle: getWeekTitle(weekNumber),
    phase: getPhaseForWeek(weekNumber),
    totalTactics: weekTactics.length,
    completedTactics: completed,
    inProgressTactics: inProgress,
    estimatedHours,
    progressPercentage: weekTactics.length > 0 ? (completed / weekTactics.length) * 100 : 0,
    isUnlocked: true,
    isRecommendedStart: false,
  };
}

function parseEstimatedTime(timeStr: string | null): number {
  if (!timeStr) return 0.5; // default 30 min
  
  const match = timeStr.match(/(\d+)/);
  if (!match) return 0.5;
  
  const num = parseInt(match[1]);
  if (timeStr.includes('hour')) return num;
  if (timeStr.includes('min')) return num / 60;
  return num;
}

function getWeekTitle(weekNumber: number): string {
  const titles: Record<number, string> = {
    1: 'Foundation & Vision',
    2: 'Market Research',
    3: 'Financial Planning',
    4: 'Legal Setup',
    5: 'Licensing Process',
    6: 'Business Formation',
    7: 'Property Search',
    8: 'Creative Financing',
    9: 'Property Acquisition',
    10: 'Operations Setup',
    11: 'Marketing Launch',
    12: 'First Residents',
    13: 'Optimization',
    14: 'Scaling Preparation',
    15: 'Growth & Expansion',
  };
  return titles[weekNumber] || `Week ${weekNumber}`;
}

function getPhaseForWeek(weekNumber: number): JourneyPhase {
  if (weekNumber <= 3) return 'foundation';
  if (weekNumber <= 6) return 'market_entry';
  if (weekNumber <= 9) return 'acquisition';
  if (weekNumber <= 12) return 'operations';
  return 'growth';
}

/**
 * validateM013Completion - Hybrid validation for Week 1 Master Checklist
 *
 * M013 requires DUAL completion:
 * 1. 100% of M001-M012 tactics completed (all 12 foundational tactics)
 * 2. 50%+ of M013's own 9-step accountability checklist
 *
 * @param week1Tactics - All Week 1 tactics (M001-M013)
 * @param m013CompletedSteps - Array of completed step indices for M013
 * @returns Object with validation results and feedback message
 */
export async function validateM013Completion(
  week1Tactics: TacticWithProgress[],
  m013CompletedSteps: number[]
): Promise<{
  canComplete: boolean;
  tacticProgressPercent: number;
  stepProgressPercent: number;
  message: string;
}> {
  // Separate M001-M012 from M013
  const m001ToM012 = week1Tactics.filter(t =>
    t.tactic_id >= 'M001' && t.tactic_id <= 'M012'
  );
  const m013 = week1Tactics.find(t => t.tactic_id === 'M013');

  if (!m013) {
    return {
      canComplete: false,
      tacticProgressPercent: 0,
      stepProgressPercent: 0,
      message: 'M013 tactic not found'
    };
  }

  // Calculate M001-M012 completion percentage
  const completedCount = m001ToM012.filter(t => t.status === 'completed').length;
  const totalCount = m001ToM012.length; // Should be 12
  const tacticProgressPercent = totalCount > 0
    ? Math.round((completedCount / totalCount) * 100)
    : 0;

  // Calculate M013's own step progress
  const steps = Array.isArray(m013.step_by_step) ? m013.step_by_step : [];
  const totalSteps = steps.length;
  const stepProgressPercent = totalSteps > 0
    ? Math.round((m013CompletedSteps.length / totalSteps) * 100)
    : 0;

  // Hybrid validation: 100% tactics + 50% steps
  const canComplete = tacticProgressPercent === 100 && stepProgressPercent >= 50;

  // Generate user-friendly message
  let message = '';
  if (canComplete) {
    message = '✅ All requirements met! You can complete Week 1.';
  } else if (tacticProgressPercent < 100) {
    message = `Complete all 12 tactics first (${completedCount}/12 done)`;
  } else if (stepProgressPercent < 50) {
    const remaining = 50 - stepProgressPercent;
    message = `Complete ${remaining}% more of M013 checklist (currently ${stepProgressPercent}%)`;
  }

  return {
    canComplete,
    tacticProgressPercent,
    stepProgressPercent,
    message
  };
}

// =============================================================================
// FEAT-GH-006-G: COMPLETION GATE VALIDATION
// =============================================================================

interface TacticGateConfig {
  tacticId: string;
  videoUrl?: string | null;
  videoCompletionThreshold?: number;
  completionGateEnabled?: boolean;
  prerequisiteTacticIds?: string[];
}

/**
 * canCompleteTactic - Check if all completion gates are met for a tactic
 *
 * Validates three types of gates:
 * 1. Video Gate - User must watch X% (default 90%) of the lesson video
 * 2. Assessment Gate - User must pass the lesson assessment quiz
 * 3. Prerequisites Gate - User must complete all prerequisite tactics
 *
 * @param userId - The user's ID
 * @param tacticConfig - Configuration for the tactic's gates
 * @returns CompletionGateResult with gate statuses and overall completion status
 */
export async function canCompleteTactic(
  userId: string,
  tacticConfig: TacticGateConfig
): Promise<CompletionGateResult> {
  const {
    tacticId,
    videoUrl,
    videoCompletionThreshold = 90,
    completionGateEnabled = true,
    prerequisiteTacticIds = [],
  } = tacticConfig;

  const gates: CompletionGateStatus[] = [];
  const blockedBy: CompletionGateType[] = [];

  // If completion gate is disabled, everything passes
  if (!completionGateEnabled) {
    return {
      canComplete: true,
      gates: [],
      blockedBy: [],
      message: 'Completion gates are disabled for this tactic.',
    };
  }

  // =============================================================================
  // 1. VIDEO GATE
  // =============================================================================
  if (videoUrl) {
    const videoResult = await getVideoProgress({
      userId,
      tacticId,
    });

    const watchPercentage = videoResult.success && videoResult.data
      ? videoResult.data.watch_percentage || 0
      : 0;
    const videoGatePassed = watchPercentage >= videoCompletionThreshold;

    gates.push({
      type: 'video',
      label: 'Watch Lesson Video',
      required: true,
      passed: videoGatePassed,
      details: `${Math.round(watchPercentage)}% watched (${videoCompletionThreshold}% required)`,
      action: !videoGatePassed
        ? {
            label: 'Watch Video',
            type: 'watch_video',
          }
        : undefined,
    });

    if (!videoGatePassed) {
      blockedBy.push('video');
    }
  }

  // =============================================================================
  // 2. ASSESSMENT GATE
  // =============================================================================
  const assessmentStatus = await getAssessmentStatus(userId, tacticId);

  if (assessmentStatus.hasAssessment) {
    const assessmentGatePassed = assessmentStatus.passed;

    gates.push({
      type: 'assessment',
      label: 'Pass Knowledge Check',
      required: true,
      passed: assessmentGatePassed,
      details: assessmentGatePassed
        ? `Best score: ${assessmentStatus.bestScore}%`
        : assessmentStatus.attempts > 0
          ? `${assessmentStatus.attempts} attempt${assessmentStatus.attempts !== 1 ? 's' : ''}, best: ${assessmentStatus.bestScore}%`
          : 'Not attempted yet',
      action: !assessmentGatePassed
        ? {
            label: assessmentStatus.attempts > 0 ? 'Retry Assessment' : 'Take Assessment',
            type: 'take_assessment',
          }
        : undefined,
    });

    if (!assessmentGatePassed) {
      blockedBy.push('assessment');
    }
  }

  // =============================================================================
  // 3. PREREQUISITES GATE
  // =============================================================================
  if (prerequisiteTacticIds.length > 0) {
    // Fetch progress for all prerequisite tactics
    const { data: prereqProgress, error } = await supabase
      .from('gh_user_tactic_progress')
      .select('tactic_id, status')
      .eq('user_id', userId)
      .in('tactic_id', prerequisiteTacticIds);

    if (error) {
      console.error('Error fetching prerequisite progress:', error);
    }

    const completedPrereqs = (prereqProgress || []).filter(
      (p) => p.status === 'completed'
    ).length;
    const totalPrereqs = prerequisiteTacticIds.length;
    const prerequisitesGatePassed = completedPrereqs === totalPrereqs;

    gates.push({
      type: 'prerequisites',
      label: 'Complete Prerequisites',
      required: true,
      passed: prerequisitesGatePassed,
      details: `${completedPrereqs}/${totalPrereqs} prerequisites completed`,
      action: !prerequisitesGatePassed && prerequisiteTacticIds[0]
        ? {
            label: 'View Prerequisites',
            type: 'complete_tactic',
            targetId: prerequisiteTacticIds.find(
              (id) => !(prereqProgress || []).find((p) => p.tactic_id === id && p.status === 'completed')
            ),
          }
        : undefined,
    });

    if (!prerequisitesGatePassed) {
      blockedBy.push('prerequisites');
    }
  }

  // =============================================================================
  // FINAL RESULT
  // =============================================================================
  const canComplete = blockedBy.length === 0;
  const requiredGatesCount = gates.filter((g) => g.required).length;
  const passedRequiredGatesCount = gates.filter((g) => g.required && g.passed).length;

  let message: string | undefined;
  if (!canComplete) {
    if (blockedBy.length === 1) {
      const gate = gates.find((g) => g.type === blockedBy[0]);
      message = gate?.action?.label
        ? `${gate.action.label} to unlock completion.`
        : `Complete the ${gate?.label || blockedBy[0]} requirement.`;
    } else {
      message = `Complete ${requiredGatesCount - passedRequiredGatesCount} remaining requirements to unlock.`;
    }
  }

  return {
    canComplete,
    gates,
    blockedBy,
    message,
  };
}

/**
 * React Query hook for checking completion gates
 */
export function useCompletionGates(
  userId: string | undefined,
  tacticConfig: TacticGateConfig | undefined
) {
  return useQuery({
    queryKey: ['completionGates', tacticConfig?.tacticId, userId],
    queryFn: async () => {
      if (!userId || !tacticConfig) {
        return {
          canComplete: false,
          gates: [],
          blockedBy: [],
          message: 'User not authenticated',
        } as CompletionGateResult;
      }
      return canCompleteTactic(userId, tacticConfig);
    },
    staleTime: 30000, // 30 seconds
    enabled: !!userId && !!tacticConfig?.tacticId,
  });
}
