/**
 * useSubPatternStatus Hook
 *
 * Checks if user has completed the Sub-Pattern Assessment.
 * Used to show/hide the Sub-Pattern CTA in Coverage Center.
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  getSubPatternAssessment,
  type SubPatternResult,
} from '@/services/subPatternAssessmentService';

export interface SubPatternStatus {
  hasCompleted: boolean;
  result: SubPatternResult | null;
  assessedAt: string | null;
}

/**
 * Hook to check sub-pattern assessment status
 */
export function useSubPatternStatus() {
  const { user } = useAuth();

  return useQuery<SubPatternStatus>({
    queryKey: ['subPatternStatus', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        return {
          hasCompleted: false,
          result: null,
          assessedAt: null,
        };
      }

      const result = await getSubPatternAssessment(user.id);

      return {
        hasCompleted: !!result,
        result,
        assessedAt: result?.assessedAt || null,
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export default useSubPatternStatus;
