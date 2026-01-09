/**
 * useCoverageHistory Hook
 * Coverage Center - $100M Mind Insurance Feature
 *
 * React hook for fetching and managing coverage history.
 * Provides:
 * - MIO protocol history
 * - Coach protocol history
 * - Combined history view
 * - Transformation metrics
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { CoverageHistoryItem, TransformationMetrics } from '@/types/coverage';
import {
  getMIOProtocolHistory,
  getCoachProtocolHistory,
  getTransformationMetrics,
} from '@/services/coverageStreakService';

// ============================================================================
// TYPES
// ============================================================================

interface UseCoverageHistoryReturn {
  // History data
  mioHistory: CoverageHistoryItem[];
  coachHistory: CoverageHistoryItem[];
  combinedHistory: CoverageHistoryItem[];

  // Metrics
  metrics: TransformationMetrics | null;

  // Loading states
  isLoading: boolean;
  isLoadingMio: boolean;
  isLoadingCoach: boolean;
  isLoadingMetrics: boolean;

  // Error state
  error: string | null;

  // Actions
  refresh: () => Promise<void>;
  loadMore: (type: 'mio' | 'coach') => Promise<void>;

  // Pagination
  hasMoreMio: boolean;
  hasMoreCoach: boolean;
}

interface HistoryState {
  mio: CoverageHistoryItem[];
  coach: CoverageHistoryItem[];
  mioOffset: number;
  coachOffset: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const PAGE_SIZE = 10;

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useCoverageHistory(): UseCoverageHistoryReturn {
  const { user, session, loading: authLoading } = useAuth();

  // State
  const [history, setHistory] = useState<HistoryState>({
    mio: [],
    coach: [],
    mioOffset: 0,
    coachOffset: 0,
  });
  const [metrics, setMetrics] = useState<TransformationMetrics | null>(null);
  const [isLoadingMio, setIsLoadingMio] = useState(true);
  const [isLoadingCoach, setIsLoadingCoach] = useState(true);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMoreMio, setHasMoreMio] = useState(true);
  const [hasMoreCoach, setHasMoreCoach] = useState(true);

  // ============================================================================
  // FETCH FUNCTIONS
  // ============================================================================

  /**
   * Fetch MIO protocol history
   */
  const fetchMioHistory = useCallback(
    async (offset = 0, append = false) => {
      if (authLoading || !user?.id || !session) {
        setIsLoadingMio(false);
        return;
      }

      setIsLoadingMio(true);

      try {
        const data = await getMIOProtocolHistory(user.id, PAGE_SIZE);

        if (data.length < PAGE_SIZE) {
          setHasMoreMio(false);
        }

        setHistory((prev) => ({
          ...prev,
          mio: append ? [...prev.mio, ...data] : data,
          mioOffset: offset + data.length,
        }));

        console.log('[useCoverageHistory] MIO history loaded:', data.length);
      } catch (err) {
        console.error('[useCoverageHistory] Error loading MIO history:', err);
        setError(err instanceof Error ? err.message : 'Failed to load MIO history');
      } finally {
        setIsLoadingMio(false);
      }
    },
    [user?.id, session, authLoading]
  );

  /**
   * Fetch Coach protocol history
   */
  const fetchCoachHistory = useCallback(
    async (offset = 0, append = false) => {
      if (authLoading || !user?.id || !session) {
        setIsLoadingCoach(false);
        return;
      }

      setIsLoadingCoach(true);

      try {
        const data = await getCoachProtocolHistory(user.id, PAGE_SIZE);

        if (data.length < PAGE_SIZE) {
          setHasMoreCoach(false);
        }

        setHistory((prev) => ({
          ...prev,
          coach: append ? [...prev.coach, ...data] : data,
          coachOffset: offset + data.length,
        }));

        console.log('[useCoverageHistory] Coach history loaded:', data.length);
      } catch (err) {
        console.error('[useCoverageHistory] Error loading Coach history:', err);
        setError(err instanceof Error ? err.message : 'Failed to load Coach history');
      } finally {
        setIsLoadingCoach(false);
      }
    },
    [user?.id, session, authLoading]
  );

  /**
   * Fetch transformation metrics
   */
  const fetchMetrics = useCallback(async () => {
    if (authLoading || !user?.id || !session) {
      setIsLoadingMetrics(false);
      return;
    }

    setIsLoadingMetrics(true);

    try {
      const data = await getTransformationMetrics(user.id);

      setMetrics({
        ...data,
        current_streak: 0, // Will be populated from useCoverageStreak
        longest_streak: 0, // Will be populated from useCoverageStreak
        member_since: '', // Could be populated from user profile
        days_active: 0, // Could be calculated
      });

      console.log('[useCoverageHistory] Metrics loaded:', data);
    } catch (err) {
      console.error('[useCoverageHistory] Error loading metrics:', err);
      // Don't set error for metrics - non-critical
    } finally {
      setIsLoadingMetrics(false);
    }
  }, [user?.id, session, authLoading]);

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  useEffect(() => {
    fetchMioHistory();
    fetchCoachHistory();
    fetchMetrics();
  }, [fetchMioHistory, fetchCoachHistory, fetchMetrics]);

  // ============================================================================
  // ACTIONS
  // ============================================================================

  /**
   * Refresh all history data
   */
  const refresh = useCallback(async () => {
    setHistory({
      mio: [],
      coach: [],
      mioOffset: 0,
      coachOffset: 0,
    });
    setHasMoreMio(true);
    setHasMoreCoach(true);
    setError(null);

    await Promise.all([fetchMioHistory(), fetchCoachHistory(), fetchMetrics()]);
  }, [fetchMioHistory, fetchCoachHistory, fetchMetrics]);

  /**
   * Load more items for pagination
   */
  const loadMore = useCallback(
    async (type: 'mio' | 'coach') => {
      if (type === 'mio' && hasMoreMio) {
        await fetchMioHistory(history.mioOffset, true);
      } else if (type === 'coach' && hasMoreCoach) {
        await fetchCoachHistory(history.coachOffset, true);
      }
    },
    [
      hasMoreMio,
      hasMoreCoach,
      history.mioOffset,
      history.coachOffset,
      fetchMioHistory,
      fetchCoachHistory,
    ]
  );

  // ============================================================================
  // DERIVED DATA
  // ============================================================================

  /**
   * Combined history sorted by creation date
   */
  const combinedHistory = [...history.mio, ...history.coach].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return dateB - dateA; // Most recent first
  });

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // History data
    mioHistory: history.mio,
    coachHistory: history.coach,
    combinedHistory,

    // Metrics
    metrics,

    // Loading states
    isLoading: isLoadingMio || isLoadingCoach,
    isLoadingMio,
    isLoadingCoach,
    isLoadingMetrics,

    // Error state
    error,

    // Actions
    refresh,
    loadMore,

    // Pagination
    hasMoreMio,
    hasMoreCoach,
  };
}

// ============================================================================
// LIGHTWEIGHT HOOK FOR ACTIVE PROTOCOLS ONLY
// ============================================================================

/**
 * Hook to get only active protocols (for quick checks)
 */
export function useActiveProtocols(): {
  hasMioProtocol: boolean;
  hasCoachProtocol: boolean;
  isLoading: boolean;
} {
  const { user, session, loading: authLoading } = useAuth();
  const [hasMioProtocol, setHasMioProtocol] = useState(false);
  const [hasCoachProtocol, setHasCoachProtocol] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkActiveProtocols = async () => {
      if (authLoading || !user?.id || !session) {
        setIsLoading(false);
        return;
      }

      try {
        const [mioHistory, coachHistory] = await Promise.all([
          getMIOProtocolHistory(user.id, 1),
          getCoachProtocolHistory(user.id, 1),
        ]);

        // Check if there's an active protocol
        setHasMioProtocol(mioHistory.some((p) => p.status === 'active'));
        setHasCoachProtocol(coachHistory.some((p) => p.status === 'active'));
      } catch (err) {
        console.error('[useActiveProtocols] Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkActiveProtocols();
  }, [user?.id, session, authLoading]);

  return {
    hasMioProtocol,
    hasCoachProtocol,
    isLoading,
  };
}

export default useCoverageHistory;
