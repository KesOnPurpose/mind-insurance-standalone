/**
 * usePreAnalysis — Pre-analysis engine for MIO's "mind-reading" layer
 * Fetches score trends, cross-KPI correlations, and partner gaps for a KPI.
 */

import { useState, useEffect, useCallback } from 'react';
import type { RelationshipKPIName } from '@/types/relationship-kpis';
import type { PreAnalysisData } from '@/types/partner-discovery';
import { getPreAnalysis } from '@/services/partnerDiscoveryService';

export function usePreAnalysis(kpiName: RelationshipKPIName | null) {
  const [data, setData] = useState<PreAnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    if (!kpiName) return;
    try {
      setIsLoading(true);
      const result = await getPreAnalysis(kpiName);
      setData(result);
    } catch (err) {
      console.error('[usePreAnalysis] Error:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [kpiName]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, isLoading, error, reload: load };
}
