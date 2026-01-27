// ============================================================================
// USE VAPI CALL HISTORY HOOK
// Manages call history state, pagination, and real-time updates
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import {
  fetchVapiCallLogs,
  fetchVapiCallDetail,
  type VapiCallLog
} from '@/services/vapiService';

interface UseVapiCallHistoryOptions {
  userId: string;
  pageSize?: number;
  autoLoad?: boolean;
}

interface UseVapiCallHistoryResult {
  calls: VapiCallLog[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  getCallDetail: (vapiCallId: string) => Promise<VapiCallLog | null>;
}

export function useVapiCallHistory({
  userId,
  pageSize = 10,
  autoLoad = true
}: UseVapiCallHistoryOptions): UseVapiCallHistoryResult {
  const [calls, setCalls] = useState<VapiCallLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  // Initial load
  const loadCalls = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchVapiCallLogs(userId, {
        limit: pageSize,
        offset: 0,
        includeTranscript: false
      });

      setCalls(data);
      setOffset(data.length);
      setHasMore(data.length >= pageSize);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load call history'));
    } finally {
      setIsLoading(false);
    }
  }, [userId, pageSize]);

  // Load more (pagination)
  const loadMore = useCallback(async () => {
    if (!userId || isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);

    try {
      const data = await fetchVapiCallLogs(userId, {
        limit: pageSize,
        offset: offset,
        includeTranscript: false
      });

      setCalls(prev => [...prev, ...data]);
      setOffset(prev => prev + data.length);
      setHasMore(data.length >= pageSize);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load more calls'));
    } finally {
      setIsLoadingMore(false);
    }
  }, [userId, pageSize, offset, isLoadingMore, hasMore]);

  // Refresh (reload from start)
  const refresh = useCallback(async () => {
    setOffset(0);
    await loadCalls();
  }, [loadCalls]);

  // Get detailed call info (with transcript)
  const getCallDetail = useCallback(async (vapiCallId: string): Promise<VapiCallLog | null> => {
    return fetchVapiCallDetail(vapiCallId);
  }, []);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad && userId) {
      loadCalls();
    }
  }, [autoLoad, userId, loadCalls]);

  return {
    calls,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
    getCallDetail
  };
}

export default useVapiCallHistory;
