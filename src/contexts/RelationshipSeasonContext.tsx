/**
 * RIE Phase 2A: RelationshipSeasonContext
 * Manages Marriage Seasons — catalog browsing, user season assignments,
 * active seasons with KPI impacts, and season history.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  getSeasonCatalog,
  getMyActiveSeasons,
  getMySeasonHistory,
  addSeason,
  endSeason,
  updateUserSeason,
} from '@/services/relationshipSeasonService';
import type {
  RelationshipSeasonCatalog,
  UserSeasonWithCatalog,
  UserSeasonInsert,
  UserSeasonUpdate,
  SeasonCategory,
} from '@/types/relationship-seasons';

// ============================================================================
// Types
// ============================================================================

export interface RelationshipSeasonContextState {
  /** Full season catalog (all active seasons) */
  catalog: RelationshipSeasonCatalog[];
  /** User's currently active seasons */
  activeSeasons: UserSeasonWithCatalog[];
  /** User's complete season history */
  seasonHistory: UserSeasonWithCatalog[];
  /** Primary active season (first active, for dashboard display) */
  primarySeason: UserSeasonWithCatalog | null;
  /** Whether user has completed season onboarding */
  seasonsOnboarded: boolean;
  /** Loading state */
  isLoading: boolean;
  /** Add a season to user's active list */
  assignSeason: (input: UserSeasonInsert) => Promise<void>;
  /** End an active season */
  closeSeason: (userSeasonId: string) => Promise<void>;
  /** Update a user season (notes, intensity) */
  editSeason: (userSeasonId: string, updates: UserSeasonUpdate) => Promise<void>;
  /** Filter catalog by category */
  getCatalogByCategory: (category: SeasonCategory) => RelationshipSeasonCatalog[];
  /** Mark seasons as onboarded */
  setSeasonsOnboarded: (val: boolean) => void;
  /** Refresh all data */
  refresh: () => Promise<void>;
}

const defaultState: RelationshipSeasonContextState = {
  catalog: [],
  activeSeasons: [],
  seasonHistory: [],
  primarySeason: null,
  seasonsOnboarded: false,
  isLoading: true,
  assignSeason: async () => {},
  closeSeason: async () => {},
  editSeason: async () => {},
  getCatalogByCategory: () => [],
  setSeasonsOnboarded: () => {},
  refresh: async () => {},
};

const RelationshipSeasonContext =
  createContext<RelationshipSeasonContextState>(defaultState);

// ============================================================================
// Provider
// ============================================================================

export function RelationshipSeasonProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<RelationshipSeasonCatalog[]>([]);
  const [activeSeasons, setActiveSeasons] = useState<UserSeasonWithCatalog[]>([]);
  const [seasonHistory, setSeasonHistory] = useState<UserSeasonWithCatalog[]>([]);
  const [seasonsOnboarded, setSeasonsOnboarded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const [catalogData, active, history] = await Promise.all([
        getSeasonCatalog(),
        getMyActiveSeasons(),
        getMySeasonHistory(),
      ]);

      setCatalog(catalogData);
      setActiveSeasons(active);
      setSeasonHistory(history);

      // If user has any season entries, they've completed onboarding
      if (history.length > 0) {
        setSeasonsOnboarded(true);
      }
    } catch (err) {
      console.error('Failed to load season data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAssignSeason = useCallback(
    async (input: UserSeasonInsert) => {
      await addSeason(input);
      // Reload to get joined data
      const [active, history] = await Promise.all([
        getMyActiveSeasons(),
        getMySeasonHistory(),
      ]);
      setActiveSeasons(active);
      setSeasonHistory(history);
    },
    []
  );

  const handleCloseSeason = useCallback(
    async (userSeasonId: string) => {
      await endSeason(userSeasonId);
      const [active, history] = await Promise.all([
        getMyActiveSeasons(),
        getMySeasonHistory(),
      ]);
      setActiveSeasons(active);
      setSeasonHistory(history);
    },
    []
  );

  const handleEditSeason = useCallback(
    async (userSeasonId: string, updates: UserSeasonUpdate) => {
      await updateUserSeason(userSeasonId, updates);
      const [active, history] = await Promise.all([
        getMyActiveSeasons(),
        getMySeasonHistory(),
      ]);
      setActiveSeasons(active);
      setSeasonHistory(history);
    },
    []
  );

  const getCatalogByCategory = useCallback(
    (category: SeasonCategory) => {
      return catalog.filter((s) => s.category === category);
    },
    [catalog]
  );

  const value = useMemo<RelationshipSeasonContextState>(() => {
    return {
      catalog,
      activeSeasons,
      seasonHistory,
      primarySeason: activeSeasons.length > 0 ? activeSeasons[0] : null,
      seasonsOnboarded,
      isLoading,
      assignSeason: handleAssignSeason,
      closeSeason: handleCloseSeason,
      editSeason: handleEditSeason,
      getCatalogByCategory,
      setSeasonsOnboarded,
      refresh: loadData,
    };
  }, [
    catalog,
    activeSeasons,
    seasonHistory,
    seasonsOnboarded,
    isLoading,
    handleAssignSeason,
    handleCloseSeason,
    handleEditSeason,
    getCatalogByCategory,
    loadData,
  ]);

  return (
    <RelationshipSeasonContext.Provider value={value}>
      {children}
    </RelationshipSeasonContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useRelationshipSeason(): RelationshipSeasonContextState {
  return useContext(RelationshipSeasonContext);
}
