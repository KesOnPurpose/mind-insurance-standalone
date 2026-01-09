// useCoachProtocols Hook
// Fetches user's active coach protocols (primary and secondary)

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getUserActiveProtocols,
  subscribeToProtocolUpdates,
} from '@/services/coachProtocolV2Service';
import type { UserCoachProtocolsResponse } from '@/types/coach-protocol';

interface UseCoachProtocolsReturn {
  protocols: UserCoachProtocolsResponse;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useCoachProtocols(): UseCoachProtocolsReturn {
  const { user } = useAuth();
  const [protocols, setProtocols] = useState<UserCoachProtocolsResponse>({
    primary: null,
    secondary: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProtocols = useCallback(async () => {
    if (!user?.id) {
      setProtocols({ primary: null, secondary: null });
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await getUserActiveProtocols(user.id);
      setProtocols(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch protocols'));
      console.error('Error fetching coach protocols:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchProtocols();
  }, [fetchProtocols]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user?.id) return;

    const subscription = subscribeToProtocolUpdates(user.id, () => {
      fetchProtocols();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, fetchProtocols]);

  return {
    protocols,
    isLoading,
    error,
    refetch: fetchProtocols,
  };
}
