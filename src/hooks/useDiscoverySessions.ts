/**
 * useDiscoverySessions — Discovery sessions + gap detection badges
 * Loads all sessions, enriches with pre-analysis and gap badges.
 */

import { useState, useEffect, useCallback } from 'react';
import { KPI_DEFINITIONS } from '@/types/relationship-kpis';
import type { RelationshipKPIName } from '@/types/relationship-kpis';
import type {
  PartnerDiscoverySession,
  KPIDiscoveryCardData,
  PreAnalysisData,
} from '@/types/partner-discovery';
import {
  getDiscoverySessions,
  getOrCreateSession,
  updateSession,
  getPreAnalysis,
  getGapBadge,
  getInsightCountsByKPI,
} from '@/services/partnerDiscoveryService';
import type { PartnerDiscoverySessionUpdate } from '@/types/partner-discovery';

export function useDiscoverySessions() {
  const [sessions, setSessions] = useState<PartnerDiscoverySession[]>([]);
  const [cardData, setCardData] = useState<KPIDiscoveryCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadSessions = useCallback(async () => {
    try {
      setIsLoading(true);
      const [allSessions, insightCounts] = await Promise.all([
        getDiscoverySessions(),
        getInsightCountsByKPI(),
      ]);

      setSessions(allSessions);

      // Build card data for each KPI
      const sessionMap = new Map<string, PartnerDiscoverySession>();
      for (const s of allSessions) {
        sessionMap.set(s.kpi_name, s);
      }

      const cards: KPIDiscoveryCardData[] = await Promise.all(
        KPI_DEFINITIONS.map(async (kpi) => {
          const session = sessionMap.get(kpi.name) || null;
          const counts = insightCounts[kpi.name] || { total: 0, shared: 0 };

          let preAnalysis: PreAnalysisData | null = null;
          let gapBadge = null;

          try {
            preAnalysis = await getPreAnalysis(kpi.name);
            gapBadge = await getGapBadge(kpi.name, session, preAnalysis);
          } catch {
            // Non-critical, skip badge
          }

          return {
            kpiName: kpi.name,
            label: kpi.label,
            description: kpi.description,
            category: kpi.category,
            session,
            insightCount: counts.total,
            sharedCount: counts.shared,
            gapBadge,
            preAnalysis,
          };
        })
      );

      setCardData(cards);
    } catch (err) {
      console.error('[useDiscoverySessions] Error loading:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const startSession = useCallback(async (kpiName: RelationshipKPIName) => {
    const session = await getOrCreateSession(kpiName);
    if (session.session_status === 'not_started') {
      return updateSession(session.id, {
        session_status: 'in_progress',
        started_at: new Date().toISOString(),
      } as PartnerDiscoverySessionUpdate & { started_at: string });
    }
    return session;
  }, []);

  const completedCount = sessions.filter(
    (s) => s.session_status === 'completed'
  ).length;

  const dnaUnlocked = completedCount >= 5;

  return {
    sessions,
    cardData,
    isLoading,
    error,
    startSession,
    completedCount,
    dnaUnlocked,
    reload: loadSessions,
  };
}
