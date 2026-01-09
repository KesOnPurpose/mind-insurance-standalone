/**
 * useIdentityCollisionGrip Hook
 * Coverage Center - $100M Mind Insurance Feature
 *
 * P6 Redesign: Calculates Identity Collision grip strength based on user behavior.
 *
 * Grip WEAKENS (good) when:
 * - 3+ day streak
 * - High completion rate (>70%)
 * - Multiple "yes_multiple" responses (practiced multiple times)
 * - No missed days in last 5
 *
 * Grip TIGHTENS (concerning) when:
 * - Streak just broken
 * - Low completion rate (<40%)
 * - Multiple "forgot" responses
 *
 * Otherwise: STABLE
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCoverageStreak } from './useCoverageStreak';
import { useIdentityCollisionStatus } from './useIdentityCollisionStatus';
import { supabase } from '@/integrations/supabase/client';
import type { GripStrength, GripStrengthResult } from '@/types/coverage';

// ============================================================================
// TYPES
// ============================================================================

interface UseIdentityCollisionGripReturn {
  gripStrength: GripStrength;
  triggersCaughtThisWeek: number;
  weekOverWeekChange?: number;
  patternName: string;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

interface RecentPractice {
  practice_response: string | null;
  is_complete: boolean;
  created_at: string;
}

// ============================================================================
// PATTERN NAME MAPPING
// ============================================================================

const PATTERN_DISPLAY_NAMES: Record<string, string> = {
  past_prison: 'Past Prison',
  success_sabotage: 'Success Sabotage',
  compass_crisis: 'Compass Crisis',
};

// ============================================================================
// GRIP CALCULATION
// ============================================================================

/**
 * Calculate grip strength based on behavioral factors AND assessment baseline.
 *
 * Assessment Score Impact:
 * - High confidence (80%+): Adds to tightening factors (creates urgency for users
 *   with strong Identity Collision patterns)
 * - Moderate (50-79%): Neutral - no baseline effect
 * - Low (<50%): Slightly easier to weaken (less entrenched patterns)
 *
 * This ensures users who scored high on the assessment start with appropriate
 * urgency, while behavioral factors still drive the primary calculation.
 */
function calculateGripStrength(
  currentStreak: number,
  longestStreak: number,
  recentPractices: RecentPractice[],
  streakJustBroken: boolean,
  assessmentConfidence?: number
): GripStrength {
  // Calculate factors
  const completedDays = recentPractices.filter(p => p.is_complete).length;
  const completionRate = recentPractices.length > 0
    ? completedDays / recentPractices.length
    : 0;

  const yesMultipleCount = recentPractices.filter(
    p => p.practice_response === 'yes_multiple'
  ).length;

  const forgotCount = recentPractices.filter(
    p => p.practice_response === 'forgot'
  ).length;

  // Positive factors (grip WEAKENING)
  const positiveFactors = {
    hasStreak: currentStreak >= 3,
    highCompletion: completionRate > 0.7,
    multiplePatternCatches: yesMultipleCount >= 2,
    noMissedDays: completedDays >= 5,
    // Low assessment score = patterns less entrenched = easier to weaken
    lowAssessmentBaseline: assessmentConfidence !== undefined && assessmentConfidence < 50,
  };

  // Negative factors (grip TIGHTENING)
  const negativeFactors = {
    streakBroken: streakJustBroken || (currentStreak === 0 && longestStreak > 0),
    lowCompletion: completionRate < 0.4,
    forgotResponses: forgotCount >= 2,
    // High assessment score = strong Identity Collision = grip tightening factor
    // This creates urgency for users who scored high on the assessment
    highAssessmentBaseline: assessmentConfidence !== undefined && assessmentConfidence >= 80,
  };

  const positiveScore = Object.values(positiveFactors).filter(Boolean).length;
  const negativeScore = Object.values(negativeFactors).filter(Boolean).length;

  // Determine grip strength
  // For new users with no practice history:
  // - High assessment (80%+) = starts "tightening" (urgency)
  // - Moderate (50-79%) = starts "stable" (neutral)
  // - Low (<50%) = starts "stable" (but closer to weakening with any practice)
  if (positiveScore >= 3 && negativeScore === 0) {
    return 'weakening';
  }
  if (negativeScore >= 2) {
    return 'tightening';
  }

  // Special case: New user with high assessment but no practices yet
  // Show "tightening" to create urgency from day 1
  if (
    recentPractices.length === 0 &&
    assessmentConfidence !== undefined &&
    assessmentConfidence >= 80
  ) {
    return 'tightening';
  }

  return 'stable';
}

// ============================================================================
// HOOK
// ============================================================================

export function useIdentityCollisionGrip(): UseIdentityCollisionGripReturn {
  const { user, loading: authLoading } = useAuth();
  const { streak, isLoading: streakLoading, fullStreak } = useCoverageStreak();
  const { data: collisionStatus, isLoading: collisionLoading } = useIdentityCollisionStatus(user?.id);

  const [recentPractices, setRecentPractices] = useState<RecentPractice[]>([]);
  const [isLoadingPractices, setIsLoadingPractices] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // FETCH RECENT PRACTICES
  // ============================================================================

  const fetchRecentPractices = useCallback(async () => {
    if (!user?.id) {
      setIsLoadingPractices(false);
      return;
    }

    setIsLoadingPractices(true);
    setError(null);

    try {
      // Get last 7 days of practice completions
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      let practices: RecentPractice[] = [];

      // Try mio_protocol_completions first (preferred table)
      // Note: Uses response_data JSONB column, not practice_response
      const { data, error: fetchError } = await supabase
        .from('mio_protocol_completions')
        .select('response_data, was_skipped, completed_at')
        .eq('user_id', user.id)
        .gte('completed_at', sevenDaysAgo.toISOString())
        .order('completed_at', { ascending: false });

      if (!fetchError && data) {
        // Map response_data to expected format
        // Infer practice_response from response_data and was_skipped
        practices = (data || []).map(p => {
          const responseData = p.response_data as Record<string, unknown> | null;
          let practiceResponse: string | null = null;

          if (p.was_skipped) {
            practiceResponse = 'forgot';
          } else if (responseData?.reflection_text) {
            const wordCount = (responseData.word_count as number) || 0;
            practiceResponse = wordCount >= 20 ? 'yes_multiple' : wordCount > 0 ? 'yes_once' : 'tried';
          } else {
            practiceResponse = 'tried';
          }

          return {
            practice_response: practiceResponse,
            is_complete: !p.was_skipped,
            created_at: p.completed_at,
          };
        });
      } else {
        // Table doesn't exist or query failed - try daily_practices as fallback
        console.warn('[useIdentityCollisionGrip] mio_protocol_completions not available, trying daily_practices');

        const { data: dpData, error: dpError } = await supabase
          .from('daily_practices')
          .select('data, completed_at, completed')
          .eq('user_id', user.id)
          .gte('created_at', sevenDaysAgo.toISOString())
          .order('created_at', { ascending: false });

        if (!dpError && dpData) {
          practices = (dpData || []).map(p => ({
            practice_response: (p.data as Record<string, string>)?.practice_response || null,
            is_complete: p.completed || false,
            created_at: p.completed_at || new Date().toISOString(),
          }));
        } else {
          // Neither table available - use empty array (no error shown to user)
          console.warn('[useIdentityCollisionGrip] No practice tables available, using defaults');
          practices = [];
        }
      }

      setRecentPractices(practices);
    } catch (err) {
      console.error('[useIdentityCollisionGrip] Error fetching practices:', err);
      // Don't show error to user - just use empty practices
      setRecentPractices([]);
    } finally {
      setIsLoadingPractices(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchRecentPractices();
  }, [fetchRecentPractices]);

  // ============================================================================
  // CALCULATE GRIP
  // ============================================================================

  const gripResult = useMemo((): GripStrengthResult => {
    const currentStreak = streak?.current_streak || 0;
    const longestStreak = streak?.longest_streak || 0;
    const streakJustBroken = fullStreak?.last_completion_date
      ? (() => {
          const lastCompletion = new Date(fullStreak.last_completion_date);
          const now = new Date();
          const hoursDiff = (now.getTime() - lastCompletion.getTime()) / (1000 * 60 * 60);
          return currentStreak === 0 && hoursDiff < 48 && longestStreak > 0;
        })()
      : false;

    // Get assessment confidence score to factor into grip calculation
    // High confidence (80%+) = strong Identity Collision = starts with urgency
    const assessmentConfidence = collisionStatus?.confidence;

    const gripStrength = calculateGripStrength(
      currentStreak,
      longestStreak,
      recentPractices,
      streakJustBroken,
      assessmentConfidence
    );

    // Count triggers caught (yes_multiple responses)
    const triggersCaughtThisWeek = recentPractices.filter(
      p => p.practice_response === 'yes_multiple' || p.practice_response === 'yes_once'
    ).length;

    // Pattern name
    const patternName = collisionStatus?.primaryPattern
      ? PATTERN_DISPLAY_NAMES[collisionStatus.primaryPattern] || collisionStatus.primaryPattern
      : 'Unknown';

    return {
      gripStrength,
      triggersCaughtThisWeek,
      patternName,
    };
  }, [streak, fullStreak, recentPractices, collisionStatus]);

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  const isLoading = authLoading || streakLoading || collisionLoading || isLoadingPractices;

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    gripStrength: gripResult.gripStrength,
    triggersCaughtThisWeek: gripResult.triggersCaughtThisWeek,
    weekOverWeekChange: gripResult.weekOverWeekChange,
    patternName: gripResult.patternName,
    isLoading,
    error,
    refresh: fetchRecentPractices,
  };
}

export default useIdentityCollisionGrip;
