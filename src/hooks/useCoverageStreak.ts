/**
 * useCoverageStreak Hook
 * Coverage Center - $100M Mind Insurance Feature
 *
 * React hook for managing coverage streak and skip tokens.
 * Provides:
 * - Current streak and longest streak
 * - Skip token count and usage
 * - Streak at-risk detection
 * - Real-time streak updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type {
  CoverageStreak,
  CoverageStreakDisplay,
  UseSkipTokenResult,
} from '@/types/coverage';
import {
  getCoverageStreak,
  getCoverageStreakDisplay,
  checkStreakAtRisk,
  useSkipToken,
  canUseSkipToken,
  subscribeToStreakUpdates,
} from '@/services/coverageStreakService';

// ============================================================================
// TYPES
// ============================================================================

interface UseCoverageStreakReturn {
  // State
  streak: CoverageStreakDisplay | null;
  fullStreak: CoverageStreak | null;
  isLoading: boolean;
  error: string | null;

  // Streak status
  isAtRisk: boolean;
  canUseToken: boolean;

  // Actions
  useToken: () => Promise<UseSkipTokenResult>;
  refresh: () => Promise<void>;

  // Real-time
  isConnected: boolean;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useCoverageStreak(): UseCoverageStreakReturn {
  const { user, session, loading: authLoading } = useAuth();

  // State
  const [fullStreak, setFullStreak] = useState<CoverageStreak | null>(null);
  const [streak, setStreak] = useState<CoverageStreakDisplay | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAtRisk, setIsAtRisk] = useState(false);
  const [canUseToken, setCanUseToken] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Ref for subscription management
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  /**
   * Fetch streak data
   */
  const fetchStreak = useCallback(async () => {
    if (authLoading || !user?.id || !session) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch full streak data
      const streakData = await getCoverageStreak(user.id);
      setFullStreak(streakData);

      // Set display data
      if (streakData) {
        setStreak({
          current_streak: streakData.current_streak,
          longest_streak: streakData.longest_streak,
          skip_tokens: streakData.skip_tokens,
        });
        setCanUseToken(streakData.skip_tokens > 0);
      } else {
        setStreak({
          current_streak: 0,
          longest_streak: 0,
          skip_tokens: 0,
        });
        setCanUseToken(false);
      }

      // Check if streak is at risk
      const riskStatus = await checkStreakAtRisk(user.id);
      setIsAtRisk(riskStatus.at_risk);

      console.log('[useCoverageStreak] Loaded:', {
        currentStreak: streakData?.current_streak,
        skipTokens: streakData?.skip_tokens,
        atRisk: riskStatus.at_risk,
      });
    } catch (err) {
      console.error('[useCoverageStreak] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load streak');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, session, authLoading]);

  // Initialize on mount and auth change
  useEffect(() => {
    fetchStreak();
  }, [fetchStreak]);

  // ============================================================================
  // REAL-TIME SUBSCRIPTION
  // ============================================================================

  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to streak updates
    subscriptionRef.current = subscribeToStreakUpdates(
      user.id,
      (updatedStreak) => {
        console.log('[useCoverageStreak] Real-time update:', updatedStreak);
        setFullStreak(updatedStreak);
        setStreak({
          current_streak: updatedStreak.current_streak,
          longest_streak: updatedStreak.longest_streak,
          skip_tokens: updatedStreak.skip_tokens,
        });
        setCanUseToken(updatedStreak.skip_tokens > 0);
      }
    );

    setIsConnected(true);

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      setIsConnected(false);
    };
  }, [user?.id]);

  // ============================================================================
  // ACTIONS
  // ============================================================================

  /**
   * Use a skip token to protect the streak
   */
  const useToken = useCallback(async (): Promise<UseSkipTokenResult> => {
    if (!user?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    if (!canUseToken) {
      return { success: false, error: 'No skip tokens available' };
    }

    try {
      const result = await useSkipToken(user.id);

      if (result.success) {
        // Optimistically update local state
        setStreak((prev) =>
          prev
            ? {
                ...prev,
                skip_tokens: result.skip_tokens_remaining || prev.skip_tokens - 1,
              }
            : null
        );
        setCanUseToken((result.skip_tokens_remaining || 0) > 0);
        setIsAtRisk(false);

        console.log('[useCoverageStreak] Skip token used:', result);
      }

      return result;
    } catch (err) {
      console.error('[useCoverageStreak] Error using skip token:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to use skip token',
      };
    }
  }, [user?.id, canUseToken]);

  /**
   * Refresh streak data
   */
  const refresh = useCallback(async () => {
    await fetchStreak();
  }, [fetchStreak]);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // State
    streak,
    fullStreak,
    isLoading,
    error,

    // Streak status
    isAtRisk,
    canUseToken,

    // Actions
    useToken,
    refresh,

    // Real-time
    isConnected,
  };
}

// ============================================================================
// LIGHTWEIGHT HOOK FOR STREAK DISPLAY ONLY
// ============================================================================

/**
 * Hook to get just the streak display data (for badges, quick display)
 */
export function useCoverageStreakDisplay(): {
  current_streak: number;
  skip_tokens: number;
  isLoading: boolean;
} {
  const { user, session, loading: authLoading } = useAuth();
  const [streak, setStreak] = useState<CoverageStreakDisplay | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStreak = useCallback(async () => {
    if (authLoading || !user?.id || !session) {
      setIsLoading(false);
      return;
    }

    try {
      const data = await getCoverageStreakDisplay(user.id);
      setStreak(data);
    } catch (err) {
      console.error('[useCoverageStreakDisplay] Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, session, authLoading]);

  useEffect(() => {
    fetchStreak();
  }, [fetchStreak]);

  // Subscribe for real-time updates
  useEffect(() => {
    if (!user?.id) return;

    const subscription = subscribeToStreakUpdates(user.id, (updatedStreak) => {
      setStreak({
        current_streak: updatedStreak.current_streak,
        longest_streak: updatedStreak.longest_streak,
        skip_tokens: updatedStreak.skip_tokens,
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  return {
    current_streak: streak?.current_streak || 0,
    skip_tokens: streak?.skip_tokens || 0,
    isLoading,
  };
}

export default useCoverageStreak;
