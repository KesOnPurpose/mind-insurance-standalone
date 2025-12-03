import { useMemo } from 'react';
import { usePersonalizedTactics } from './usePersonalizedTactics';
import { useUserProgress } from '@/services/progressService';
import { useAuth } from '@/contexts/AuthContext';

export type JourneyPhase = 'foundation' | 'building' | 'launching' | 'operating';

interface JourneyContext {
  phase: JourneyPhase;
  phaseName: string;
  phaseDescription: string;
  heroMessage: string;
  currentWeek: number;
  totalWeeks: number;
  completedTactics: number;
  totalTactics: number;
  inProgressTactics: number;
  completionRate: number;
  weeklyProgress: {
    completed: number;
    total: number;
  };
  emphasize: string[];
  hideElements: string[];
  isLoading: boolean;
}

/**
 * Get phase info based on current week
 */
function getPhaseInfo(currentWeek: number): {
  phase: JourneyPhase;
  phaseName: string;
  phaseDescription: string;
  heroMessage: string;
  emphasize: string[];
  hideElements: string[];
} {
  // Weeks 1-3: Foundation Phase
  if (currentWeek <= 3) {
    return {
      phase: 'foundation',
      phaseName: 'Foundation',
      phaseDescription: 'Setting up the core elements of your business',
      heroMessage: 'Building Your Foundation',
      emphasize: ['profile-completion', 'assessment-insights', 'business-planning'],
      hideElements: ['scaling-tips', 'advanced-metrics', 'optimization']
    };
  }

  // Weeks 4-6: Building Phase
  if (currentWeek <= 6) {
    return {
      phase: 'building',
      phaseName: 'Building',
      phaseDescription: 'Developing your business infrastructure',
      heroMessage: 'Building Your Business',
      emphasize: ['next-tactic', 'business-profile', 'legal-compliance'],
      hideElements: ['onboarding-nudges', 'beginner-tips']
    };
  }

  // Weeks 7-9: Launching Phase
  if (currentWeek <= 9) {
    return {
      phase: 'launching',
      phaseName: 'Launching',
      phaseDescription: 'Preparing for your first residents',
      heroMessage: 'Preparing to Launch',
      emphasize: ['operational-readiness', 'compliance-checklist', 'staffing'],
      hideElements: ['beginner-tips', 'basic-education']
    };
  }

  // Weeks 10-12: Operating Phase
  return {
    phase: 'operating',
    phaseName: 'Operating',
    phaseDescription: 'Running and optimizing your group home',
    heroMessage: 'Launch & Optimize',
    emphasize: ['metrics', 'optimization-tips', 'growth-strategies'],
    hideElements: ['beginner-tips', 'basic-education', 'foundation-tasks']
  };
}

/**
 * useJourneyContext - Provides journey phase and progress context
 *
 * Returns information about where the user is in their 12-week journey,
 * including phase-specific UI guidance for adaptive dashboard content.
 */
export function useJourneyContext(): JourneyContext {
  const { user } = useAuth();
  const {
    tactics,
    startingWeek,
    isLoading: tacticsLoading,
    totalTacticsCount
  } = usePersonalizedTactics();
  const { data: progressData, isLoading: progressLoading } = useUserProgress(user?.id || '');

  const isLoading = tacticsLoading || progressLoading;

  const journeyData = useMemo(() => {
    if (isLoading || !tactics) {
      return {
        currentWeek: 1,
        completedTactics: 0,
        totalTactics: 0,
        inProgressTactics: 0,
        completionRate: 0,
        weeklyProgress: { completed: 0, total: 0 }
      };
    }

    // Calculate stats from actual data
    const completedIds = new Set(
      progressData?.filter(p => p.status === 'completed').map(p => p.tactic_id) || []
    );
    const inProgressIds = new Set(
      progressData?.filter(p => p.status === 'in_progress').map(p => p.tactic_id) || []
    );

    const completedTactics = completedIds.size;
    const inProgressTactics = inProgressIds.size;
    const totalTactics = totalTacticsCount || tactics.length;
    const completionRate = totalTactics > 0
      ? Math.round((completedTactics / totalTactics) * 100)
      : 0;

    // Calculate current week based on progress (first incomplete week)
    const tacticsWithProgress = tactics.map(tactic => ({
      ...tactic,
      status: progressData?.find(p => p.tactic_id === tactic.tactic_id)?.status || 'not_started',
    }));

    const weekNumbers = [...new Set(
      tactics.map(t => t.week_assignment).filter(Boolean)
    )].sort((a, b) => (a || 0) - (b || 0));

    const currentWeek = weekNumbers.find(week => {
      const weekTactics = tacticsWithProgress.filter(t => t.week_assignment === week);
      return weekTactics.some(t => t.status !== 'completed');
    }) || startingWeek || 1;

    // Calculate weekly progress
    const weekTactics = tacticsWithProgress.filter(t => t.week_assignment === currentWeek);
    const weekCompleted = weekTactics.filter(t => t.status === 'completed').length;

    return {
      currentWeek,
      completedTactics,
      totalTactics,
      inProgressTactics,
      completionRate,
      weeklyProgress: {
        completed: weekCompleted,
        total: weekTactics.length
      }
    };
  }, [tactics, progressData, isLoading, startingWeek, totalTacticsCount]);

  const phaseInfo = getPhaseInfo(journeyData.currentWeek);

  return {
    ...phaseInfo,
    currentWeek: journeyData.currentWeek,
    totalWeeks: 12,
    completedTactics: journeyData.completedTactics,
    totalTactics: journeyData.totalTactics,
    inProgressTactics: journeyData.inProgressTactics,
    completionRate: journeyData.completionRate,
    weeklyProgress: journeyData.weeklyProgress,
    isLoading
  };
}

export default useJourneyContext;
