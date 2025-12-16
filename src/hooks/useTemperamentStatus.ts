/**
 * useTemperamentStatus Hook
 *
 * Checks if user has completed the Temperament Assessment.
 * Used to show/hide the Temperament CTA in Coverage Center.
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getTemperamentAssessment, type TemperamentResult } from '@/services/temperamentAssessmentService';

export interface TemperamentStatus {
  hasCompleted: boolean;
  result: TemperamentResult | null;
  assessedAt: string | null;
}

/**
 * Hook to check temperament assessment status
 */
export function useTemperamentStatus() {
  const { user } = useAuth();

  return useQuery<TemperamentStatus>({
    queryKey: ['temperamentStatus', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log('[useTemperamentStatus] No user ID');
        return {
          hasCompleted: false,
          result: null,
          assessedAt: null,
        };
      }

      console.log('[useTemperamentStatus] Fetching for user:', user.id);
      const result = await getTemperamentAssessment(user.id);
      console.log('[useTemperamentStatus] Result:', result ? { primary: result.primary, secondary: result.secondary } : 'NULL');

      return {
        hasCompleted: !!result,
        result,
        assessedAt: null, // TemperamentResult doesn't have assessedAt field
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export default useTemperamentStatus;
