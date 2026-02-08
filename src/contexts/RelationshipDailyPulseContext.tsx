/**
 * RIE Phase 1C: RelationshipDailyPulseContext
 * Manages daily micro-touchpoint — mood + connection emoji check-ins.
 * One pulse per day (upsert on user_id + pulse_date).
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
  getTodaysPulse,
  getRecentPulses,
  submitPulse,
} from '@/services/relationshipDailyPulseService';
import type {
  RelationshipDailyPulse,
  DailyPulseInsert,
  PulseWeekSummary,
} from '@/types/relationship-daily-pulse';

// ============================================================================
// Types
// ============================================================================

export interface RelationshipDailyPulseContextState {
  /** Today's pulse (null if not yet submitted) */
  todaysPulse: RelationshipDailyPulse | null;
  /** Whether today's pulse has been submitted */
  hasSubmittedToday: boolean;
  /** Recent pulses (last 14 days) */
  recentPulses: RelationshipDailyPulse[];
  /** Weekly summary for dashboard */
  weekSummary: PulseWeekSummary | null;
  /** Loading state */
  isLoading: boolean;
  /** Submit or update today's pulse */
  submit: (input: DailyPulseInsert) => Promise<void>;
  /** Refresh data */
  refresh: () => Promise<void>;
}

const defaultState: RelationshipDailyPulseContextState = {
  todaysPulse: null,
  hasSubmittedToday: false,
  recentPulses: [],
  weekSummary: null,
  isLoading: true,
  submit: async () => {},
  refresh: async () => {},
};

const RelationshipDailyPulseContext =
  createContext<RelationshipDailyPulseContextState>(defaultState);

// ============================================================================
// Helpers
// ============================================================================

function computeWeekSummary(pulses: RelationshipDailyPulse[]): PulseWeekSummary | null {
  // Get pulses from the last 7 days
  const now = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(now.getDate() - 7);
  const weekStart = weekAgo.toISOString().split('T')[0];

  const weekPulses = pulses.filter((p) => p.pulse_date >= weekStart);
  if (weekPulses.length === 0) return null;

  const avgMood =
    weekPulses.reduce((sum, p) => sum + p.mood_rating, 0) / weekPulses.length;
  const avgConnection =
    weekPulses.reduce((sum, p) => sum + p.connection_rating, 0) / weekPulses.length;

  // Collect all flagged KPIs from the week
  const allFlagged = weekPulses.flatMap((p) => p.flagged_kpis ?? []);
  const uniqueFlagged = [...new Set(allFlagged)];

  return {
    weekStart,
    avgMood: Math.round(avgMood * 10) / 10,
    avgConnection: Math.round(avgConnection * 10) / 10,
    pulseCount: weekPulses.length,
    flaggedKpis: uniqueFlagged,
  };
}

// ============================================================================
// Provider
// ============================================================================

export function RelationshipDailyPulseProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [todaysPulse, setTodaysPulse] = useState<RelationshipDailyPulse | null>(null);
  const [recentPulses, setRecentPulses] = useState<RelationshipDailyPulse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const [today, recent] = await Promise.all([
        getTodaysPulse(),
        getRecentPulses(14),
      ]);

      setTodaysPulse(today);
      setRecentPulses(recent);
    } catch (err) {
      console.error('Failed to load daily pulse data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = useCallback(
    async (input: DailyPulseInsert) => {
      const result = await submitPulse(input);
      setTodaysPulse(result);
      // Update recent pulses: replace today's entry or add new
      setRecentPulses((prev) => {
        const today = result.pulse_date;
        const filtered = prev.filter((p) => p.pulse_date !== today);
        return [result, ...filtered];
      });
    },
    []
  );

  const value = useMemo<RelationshipDailyPulseContextState>(() => {
    const weekSummary = computeWeekSummary(recentPulses);
    return {
      todaysPulse,
      hasSubmittedToday: todaysPulse != null,
      recentPulses,
      weekSummary,
      isLoading,
      submit: handleSubmit,
      refresh: loadData,
    };
  }, [todaysPulse, recentPulses, isLoading, handleSubmit, loadData]);

  return (
    <RelationshipDailyPulseContext.Provider value={value}>
      {children}
    </RelationshipDailyPulseContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useRelationshipDailyPulse(): RelationshipDailyPulseContextState {
  return useContext(RelationshipDailyPulseContext);
}
