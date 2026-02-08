/**
 * Stuck Detection Hook
 *
 * Checks if the current user is "stuck" on their course progress
 * (hasn't made progress in 3+ days). Used to display contextual
 * nudge messages in the chat interface.
 *
 * @module useStuckDetection
 * @author FEAT-GH-007
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface StuckStatus {
  isStuck: boolean;
  daysSinceLastProgress: number;
  currentTacticId: string | null;
  currentTacticName: string | null;
  currentPhase: number | null;
  lastProgressAt: string | null;
  stuckThreshold: 'day3' | 'day7' | 'day14' | 'day30' | null;
}

/**
 * Calculate stuck threshold based on days
 */
function getStuckThreshold(days: number): 'day3' | 'day7' | 'day14' | 'day30' | null {
  if (days >= 30) return 'day30';
  if (days >= 14) return 'day14';
  if (days >= 7) return 'day7';
  if (days >= 3) return 'day3';
  return null;
}

/**
 * Fetch stuck status for the current user
 */
async function fetchStuckStatus(userId: string): Promise<StuckStatus> {
  const defaultStatus: StuckStatus = {
    isStuck: false,
    daysSinceLastProgress: 0,
    currentTacticId: null,
    currentTacticName: null,
    currentPhase: null,
    lastProgressAt: null,
    stuckThreshold: null
  };

  try {
    // Get the user's most recent tactic progress (without join - more reliable)
    // Note: gh_user_tactic_progress uses created_at, not updated_at
    const { data: progressData, error: progressError } = await supabase
      .from('gh_user_tactic_progress')
      .select('tactic_id, created_at, status')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (progressError || !progressData) {
      // No progress yet - not stuck, just new
      return defaultStatus;
    }

    // Calculate days since last progress
    const lastProgressDate = new Date(progressData.created_at);
    const now = new Date();
    const daysSinceProgress = Math.floor(
      (now.getTime() - lastProgressDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Fetch tactic name separately (more reliable than embedded join)
    let tacticName: string | null = null;
    if (progressData.tactic_id) {
      const { data: tacticData } = await supabase
        .from('gh_tactic_instructions')
        .select('tactic_name')
        .eq('tactic_id', progressData.tactic_id)
        .single();
      tacticName = tacticData?.tactic_name || null;
    }

    // Determine if stuck (3+ days)
    const stuckThreshold = getStuckThreshold(daysSinceProgress);
    const isStuck = stuckThreshold !== null;

    return {
      isStuck,
      daysSinceLastProgress: daysSinceProgress,
      currentTacticId: progressData.tactic_id,
      currentTacticName: tacticName,
      currentPhase: null, // Phase column doesn't exist in current schema
      lastProgressAt: progressData.created_at,
      stuckThreshold
    };

  } catch (error) {
    console.error('[useStuckDetection] Error fetching stuck status:', error);
    return defaultStatus;
  }
}

/**
 * Hook to check if the current user is stuck on their course progress
 *
 * @returns {object} Stuck status data and loading state
 *
 * @example
 * ```tsx
 * const { data: stuckStatus, isLoading } = useStuckDetection();
 *
 * if (stuckStatus?.isStuck) {
 *   return <StuckNudgeBanner stuckStatus={stuckStatus} />;
 * }
 * ```
 */
export function useStuckDetection() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['stuck-detection', user?.id],
    queryFn: () => fetchStuckStatus(user!.id),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false
  });
}

/**
 * Get an encouraging message based on stuck duration
 */
export function getStuckMessage(stuckStatus: StuckStatus): string {
  const firstName = 'there'; // Will be replaced by component
  const tacticName = stuckStatus.currentTacticName || 'your current lesson';

  switch (stuckStatus.stuckThreshold) {
    case 'day3':
      return `Hey ${firstName}! It's been a few days since you worked on "${tacticName}". Life happens - whenever you're ready, I'm here to help you pick up where you left off. 💪`;

    case 'day7':
      return `${firstName}, it's been about a week since we worked together on "${tacticName}". Your group home journey is still waiting! Let's reconnect and keep building momentum.`;

    case 'day14':
      return `${firstName}, two weeks have passed. I've been thinking about your progress on "${tacticName}". Sometimes a pause is exactly what we need - but I want to make sure you don't lose what you've already built.`;

    case 'day30':
      return `${firstName}, it's been a month since we last connected. Your progress on "${tacticName}" is still saved, and your goals are still valid. Whenever you're ready to restart, I'll be here. 💙`;

    default:
      return '';
  }
}

/**
 * Get a call-to-action based on stuck duration
 */
export function getStuckCTA(stuckStatus: StuckStatus): { text: string; action: string } {
  switch (stuckStatus.stuckThreshold) {
    case 'day3':
      return {
        text: 'Continue where I left off',
        action: 'continue'
      };

    case 'day7':
      return {
        text: 'Get back on track',
        action: 'continue'
      };

    case 'day14':
      return {
        text: 'Let\'s reconnect',
        action: 'chat'
      };

    case 'day30':
      return {
        text: 'Book a call with coach',
        action: 'book'
      };

    default:
      return {
        text: 'Continue learning',
        action: 'continue'
      };
  }
}
