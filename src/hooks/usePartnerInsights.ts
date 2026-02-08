/**
 * usePartnerInsights — Insight cards CRUD + sharing + reactions
 */

import { useState, useEffect, useCallback } from 'react';
import type { RelationshipKPIName } from '@/types/relationship-kpis';
import type {
  PartnerInsightCard,
  PartnerInsightCardInsert,
} from '@/types/partner-discovery';
import {
  getInsightCards,
  getPartnerSharedInsights,
  createInsightCards,
  toggleShareInsightCard,
  reactToInsightCard,
  deleteInsightCard,
} from '@/services/partnerDiscoveryService';

export function usePartnerInsights(kpiName?: RelationshipKPIName) {
  const [myInsights, setMyInsights] = useState<PartnerInsightCard[]>([]);
  const [partnerInsights, setPartnerInsights] = useState<PartnerInsightCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadInsights = useCallback(async () => {
    try {
      setIsLoading(true);
      const [mine, theirs] = await Promise.all([
        getInsightCards(kpiName),
        getPartnerSharedInsights(),
      ]);
      setMyInsights(mine);
      setPartnerInsights(kpiName ? theirs.filter((c) => c.kpi_name === kpiName) : theirs);
    } catch (err) {
      console.error('[usePartnerInsights] Error:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [kpiName]);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  const saveInsights = useCallback(
    async (cards: PartnerInsightCardInsert[]) => {
      const created = await createInsightCards(cards);
      setMyInsights((prev) => [...created, ...prev]);
      return created;
    },
    []
  );

  const toggleShare = useCallback(async (cardId: string, share: boolean) => {
    const updated = await toggleShareInsightCard(cardId, share);
    setMyInsights((prev) =>
      prev.map((c) => (c.id === cardId ? updated : c))
    );
    return updated;
  }, []);

  const addReaction = useCallback(async (cardId: string, reaction: string) => {
    const updated = await reactToInsightCard(cardId, reaction);
    setPartnerInsights((prev) =>
      prev.map((c) => (c.id === cardId ? updated : c))
    );
    return updated;
  }, []);

  const removeInsight = useCallback(async (cardId: string) => {
    await deleteInsightCard(cardId);
    setMyInsights((prev) => prev.filter((c) => c.id !== cardId));
  }, []);

  return {
    myInsights,
    partnerInsights,
    isLoading,
    error,
    saveInsights,
    toggleShare,
    addReaction,
    removeInsight,
    reload: loadInsights,
  };
}
