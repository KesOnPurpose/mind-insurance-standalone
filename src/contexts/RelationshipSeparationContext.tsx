/**
 * RIE Module: RelationshipSeparationContext
 * Manages separation assessments — Vertex Model angles, risk scoring, and
 * separation stage tracking.
 *
 * Phase 1A: Full implementation with real data from relationship_separation_assessments.
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
  getLatestAssessment,
  getAssessmentHistory,
  createAssessment,
} from '@/services/relationshipSeparationService';
import {
  getSeparationStage,
  type SeparationStage,
  type RelationshipSeparationAssessment,
  type SeparationAssessmentInsert,
} from '@/types/relationship-separation';

// ============================================================================
// Types
// ============================================================================

export interface RelationshipSeparationContextState {
  /** Whether a separation assessment has been completed */
  hasAssessment: boolean;
  /** Current Vertex Model angle (0-180 degrees) */
  separationAngle: number | null;
  /** Current separation stage */
  separationStage: SeparationStage | null;
  /** Latest full assessment record */
  latestAssessment: RelationshipSeparationAssessment | null;
  /** Assessment history for trend chart */
  assessmentHistory: RelationshipSeparationAssessment[];
  /** Loading state */
  isLoading: boolean;
  /** Create a new assessment */
  submitAssessment: (input: SeparationAssessmentInsert) => Promise<void>;
  /** Auto-calculate separation from KPI scores */
  calculateSeparationFromScores: (
    kpiScores: Record<string, number>,
    checkInId?: string
  ) => Promise<void>;
  /** Refresh data */
  refresh: () => Promise<void>;
}

const defaultState: RelationshipSeparationContextState = {
  hasAssessment: false,
  separationAngle: null,
  separationStage: null,
  latestAssessment: null,
  assessmentHistory: [],
  isLoading: true,
  submitAssessment: async () => {},
  calculateSeparationFromScores: async () => {},
  refresh: async () => {},
};

const RelationshipSeparationContext =
  createContext<RelationshipSeparationContextState>(defaultState);

// ============================================================================
// Calculation: KPI scores → separation angle
// ============================================================================

/**
 * Convert a set of KPI scores (1-10 scale) to a separation angle (0-180).
 * Lower scores = higher separation angle.
 * Weights certain KPIs more heavily (emotional_intimacy, communication, trust).
 */
function kpiScoresToAngle(kpiScores: Record<string, number>): number {
  const weights: Record<string, number> = {
    communication: 1.5,
    emotional_intimacy: 1.5,
    trust: 1.5,
    conflict_resolution: 1.2,
    physical_intimacy: 1.0,
    quality_time: 1.0,
    shared_goals: 1.0,
    appreciation: 1.0,
    personal_growth: 0.8,
    financial_harmony: 0.8,
  };

  let weightedSum = 0;
  let totalWeight = 0;

  for (const [kpi, score] of Object.entries(kpiScores)) {
    const w = weights[kpi] ?? 1.0;
    weightedSum += score * w;
    totalWeight += w;
  }

  if (totalWeight === 0) return 90; // default midpoint

  const avgScore = weightedSum / totalWeight; // 1-10
  // Invert: score 10 → 0°, score 1 → 180°
  const angle = Math.round(((10 - avgScore) / 9) * 180);
  return Math.max(0, Math.min(180, angle));
}

// ============================================================================
// Provider
// ============================================================================

export function RelationshipSeparationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [latestAssessment, setLatestAssessment] =
    useState<RelationshipSeparationAssessment | null>(null);
  const [assessmentHistory, setAssessmentHistory] = useState<
    RelationshipSeparationAssessment[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const [latest, history] = await Promise.all([
        getLatestAssessment(),
        getAssessmentHistory(20),
      ]);

      setLatestAssessment(latest);
      setAssessmentHistory(history);
    } catch (err) {
      console.error('Failed to load separation data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const submitAssessment = useCallback(
    async (input: SeparationAssessmentInsert) => {
      const result = await createAssessment(input);
      setLatestAssessment(result);
      setAssessmentHistory((prev) => [result, ...prev]);
    },
    []
  );

  const calculateSeparationFromScores = useCallback(
    async (kpiScores: Record<string, number>, checkInId?: string) => {
      const angle = kpiScoresToAngle(kpiScores);
      const stage = getSeparationStage(angle);

      // Identify risk factors
      const riskFactors = Object.entries(kpiScores)
        .filter(([, score]) => score <= 4)
        .map(([kpi, score]) => ({
          kpi: kpi as any,
          severity: (score <= 2 ? 'critical' : score <= 3 ? 'high' : 'medium') as
            | 'low'
            | 'medium'
            | 'high'
            | 'critical',
          message: `${kpi.replace(/_/g, ' ')} needs attention (${score}/10)`,
        }));

      await submitAssessment({
        separation_angle: angle,
        separation_stage: stage,
        kpi_scores_snapshot: kpiScores,
        risk_factors: riskFactors,
        source_check_in_id: checkInId ?? null,
      });
    },
    [submitAssessment]
  );

  const value = useMemo<RelationshipSeparationContextState>(
    () => ({
      hasAssessment: latestAssessment != null,
      separationAngle: latestAssessment?.separation_angle ?? null,
      separationStage: latestAssessment?.separation_stage ?? null,
      latestAssessment,
      assessmentHistory,
      isLoading,
      submitAssessment,
      calculateSeparationFromScores,
      refresh: loadData,
    }),
    [
      latestAssessment,
      assessmentHistory,
      isLoading,
      submitAssessment,
      calculateSeparationFromScores,
      loadData,
    ]
  );

  return (
    <RelationshipSeparationContext.Provider value={value}>
      {children}
    </RelationshipSeparationContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useRelationshipSeparation(): RelationshipSeparationContextState {
  return useContext(RelationshipSeparationContext);
}
