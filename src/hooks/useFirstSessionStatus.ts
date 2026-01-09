/**
 * useFirstSessionStatus Hook
 * Mind Insurance - $100M Feature
 *
 * React Query hook for checking if user has completed their first session with MIO.
 * Used by FirstSessionGuard and other components that need to know first session status.
 *
 * Pattern: Follows existing useIdentityCollisionStatus implementation
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { hasCompletedFirstEngagement, getFirstEngagementResponse } from '@/services/mioInsightsThreadService';
import type { MIOInsightsMessage } from '@/types/mio-insights';

// ============================================================================
// TYPES
// ============================================================================

export interface FirstSessionStatus {
  hasCompleted: boolean;
  response: MIOInsightsMessage | null;
  wasSkipped: boolean;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Check if user has completed their first session
 * Returns completion status, response data, and skip status
 */
export function useFirstSessionStatus() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['first-session-status', user?.id],
    queryFn: async (): Promise<FirstSessionStatus> => {
      if (!user?.id) {
        return { hasCompleted: false, response: null, wasSkipped: false };
      }

      // Check if completed
      const hasCompleted = await hasCompletedFirstEngagement(user.id);

      if (!hasCompleted) {
        return { hasCompleted: false, response: null, wasSkipped: false };
      }

      // Get the response details
      const response = await getFirstEngagementResponse(user.id);

      return {
        hasCompleted: true,
        response,
        wasSkipped: response?.content === '[SKIPPED]' || false,
      };
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000, // 60 seconds (same as IdentityCollisionStatus)
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Simple boolean check for first session completion
 * Use when you only need to know if completed, not the response data
 */
export function useHasCompletedFirstSession(): boolean {
  const { data, isLoading } = useFirstSessionStatus();

  // Return false while loading to be safe
  if (isLoading) return false;

  return data?.hasCompleted ?? false;
}

export default useFirstSessionStatus;
