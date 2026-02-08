/**
 * RKPI Hook: useRelationshipKpis
 * Convenience hook for dashboard-level data — overall score, streak, trends, KPI heat map.
 */

import { useState, useEffect, useCallback } from 'react';
import { useRelationship } from '@/contexts/RelationshipContext';
import type {
  RelationshipKPIName,
  HeatMapCell,
  TrendDataPoint,
  RelationshipTrendCache,
} from '@/types/relationship-kpis';
import { KPI_DEFINITIONS } from '@/types/relationship-kpis';
import { getKPIScoreHistory } from '@/services/relationshipKPIService';
import { getScoreCategory } from '@/utils/relationshipKpis';

interface KPITrendData {
  kpiName: RelationshipKPIName;
  dataPoints: TrendDataPoint[];
}

interface UseRelationshipKpisReturn {
  overallScore: number | null;
  currentStreak: number;
  checkInDueThisWeek: boolean;
  isLoading: boolean;
  heatMap: HeatMapCell[];
  loadHeatMap: (weeks?: number) => Promise<void>;
  loadTrendForKPI: (kpiName: RelationshipKPIName) => Promise<TrendDataPoint[]>;
}

export function useRelationshipKpis(): UseRelationshipKpisReturn {
  const {
    overallScore,
    currentStreak,
    checkInDueThisWeek,
    isLoading,
    recentCheckIns,
  } = useRelationship();

  const [heatMap, setHeatMap] = useState<HeatMapCell[]>([]);

  const loadHeatMap = useCallback(async (weeks: number = 4) => {
    // Build heat map from recent check-ins (which include scores)
    const cells: HeatMapCell[] = [];

    for (const checkIn of recentCheckIns.slice(0, weeks)) {
      for (const kpiDef of KPI_DEFINITIONS) {
        const scoreEntry = checkIn.scores?.find((s) => s.kpi_name === kpiDef.name);
        cells.push({
          kpiName: kpiDef.name,
          week: checkIn.check_in_week,
          score: scoreEntry?.score ?? null,
          category: scoreEntry ? getScoreCategory(scoreEntry.score) : null,
        });
      }
    }

    setHeatMap(cells);
  }, [recentCheckIns]);

  const loadTrendForKPI = useCallback(
    async (kpiName: RelationshipKPIName): Promise<TrendDataPoint[]> => {
      const history = await getKPIScoreHistory(kpiName, 12);
      return history.map((row) => ({
        week: row.week,
        score: row.score,
      }));
    },
    []
  );

  // Auto-build heat map when check-ins change
  useEffect(() => {
    if (recentCheckIns.length > 0) {
      loadHeatMap();
    }
  }, [recentCheckIns, loadHeatMap]);

  return {
    overallScore,
    currentStreak,
    checkInDueThisWeek,
    isLoading,
    heatMap,
    loadHeatMap,
    loadTrendForKPI,
  };
}
