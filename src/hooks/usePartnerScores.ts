/**
 * RKPI Hook: usePartnerScores
 * Load and compare partner scores (respects privacy flags via RLS).
 */

import { useState, useCallback } from 'react';
import { useRelationship } from '@/contexts/RelationshipContext';
import type {
  PartnerScoreComparison,
  RelationshipKPIName,
  RelationshipKPIScore,
} from '@/types/relationship-kpis';
import { KPI_DEFINITIONS } from '@/types/relationship-kpis';
import { getPartnerScoresForCheckIn } from '@/services/relationshipKPIService';

interface UsePartnerScoresReturn {
  comparisons: PartnerScoreComparison[];
  isLoading: boolean;
  error: string | null;
  loadComparison: (checkInWeek: string) => Promise<void>;
}

export function usePartnerScores(): UsePartnerScoresReturn {
  const { partnership, recentCheckIns } = useRelationship();
  const [comparisons, setComparisons] = useState<PartnerScoreComparison[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadComparison = useCallback(
    async (checkInWeek: string) => {
      if (!partnership || partnership.invitation_status !== 'accepted') {
        setComparisons([]);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Find user's check-in for this week
        const userCheckIn = recentCheckIns.find(
          (ci) => ci.check_in_week === checkInWeek
        );

        if (!userCheckIn) {
          setComparisons([]);
          return;
        }

        // Get partner scores (RLS filters out private scores)
        const partnerScores = await getPartnerScoresForCheckIn(userCheckIn.id);

        // Build comparison
        const result: PartnerScoreComparison[] = KPI_DEFINITIONS.map((kpi) => {
          const userScore = userCheckIn.scores?.find(
            (s) => s.kpi_name === kpi.name
          );
          const partnerScore = partnerScores.find(
            (s: RelationshipKPIScore) => s.kpi_name === kpi.name
          );

          return {
            kpiName: kpi.name,
            userScore: userScore?.score ?? null,
            partnerScore: partnerScore?.score ?? null,
            difference:
              userScore?.score != null && partnerScore?.score != null
                ? userScore.score - partnerScore.score
                : null,
          };
        });

        setComparisons(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load partner scores';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [partnership, recentCheckIns]
  );

  return {
    comparisons,
    isLoading,
    error,
    loadComparison,
  };
}
