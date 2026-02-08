/**
 * RKPI Module: RelationshipWizardContext
 * Check-in wizard state: draft persistence, step management, submission.
 * Depends on RelationshipDataContext for partnership/loadData.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRelationshipData } from '@/contexts/RelationshipDataContext';
import type {
  RelationshipCheckIn,
  RelationshipKPIName,
  CheckInWizardState,
} from '@/types/relationship-kpis';
import {
  getOrCreateCurrentCheckIn,
  completeCheckIn as completeCheckInService,
} from '@/services/relationshipCheckInService';
import {
  upsertKPIScore,
} from '@/services/relationshipKPIService';
import {
  createActionItem,
} from '@/services/relationshipActionItemService';
import {
  triggerInsightGeneration,
} from '@/services/relationshipWebhookService';
import {
  tagCheckInStarted,
  tagRelationshipConsistent,
  tagNeedsSupport,
} from '@/services/ghlTagService';
import {
  saveDraft,
  loadDraft,
  clearDraft,
  getStreakFromHistory,
} from '@/utils/relationshipKpis';
import { toast } from 'sonner';

// ============================================================================
// Types
// ============================================================================

export interface RelationshipWizardContextState {
  wizardState: CheckInWizardState | null;
  isSubmitting: boolean;

  startCheckIn: () => Promise<void>;
  updateWizardStep: (step: number, scores?: CheckInWizardState['scores']) => void;
  submitCheckIn: () => Promise<void>;
  clearCurrentCheckIn: () => void;
}

const RelationshipWizardContext = createContext<RelationshipWizardContextState | undefined>(
  undefined
);

// ============================================================================
// Provider
// ============================================================================

export function RelationshipWizardProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { partnership, recentCheckIns, loadData } = useRelationshipData();

  const [wizardState, setWizardState] = useState<CheckInWizardState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Restore wizard draft from localStorage on mount
  useEffect(() => {
    if (user) {
      const draft = loadDraft<CheckInWizardState>();
      if (draft) {
        setWizardState(draft);
      }
    } else {
      setWizardState(null);
    }
  }, [user]);

  // --------------------------------------------------------------------------
  // Mutations
  // --------------------------------------------------------------------------

  const startCheckIn = useCallback(async () => {
    if (!user) throw new Error('Not authenticated');

    const checkIn = await getOrCreateCurrentCheckIn(partnership?.id);

    const newWizard: CheckInWizardState = {
      currentStep: 0,
      checkInId: checkIn.id,
      scores: {},
      actionItems: [],
      isSubmitting: false,
    };
    setWizardState(newWizard);
    saveDraft(newWizard);
  }, [user, partnership?.id]);

  const updateWizardStep = useCallback(
    (step: number, scores?: CheckInWizardState['scores']) => {
      setWizardState((prev) => {
        if (!prev) return prev;
        const updated: CheckInWizardState = {
          ...prev,
          currentStep: step,
          scores: scores ? { ...prev.scores, ...scores } : prev.scores,
        };
        saveDraft(updated);
        return updated;
      });
    },
    []
  );

  const submitCheckIn = useCallback(async () => {
    if (!wizardState?.checkInId) throw new Error('No active check-in');

    try {
      setIsSubmitting(true);
      setWizardState((prev) => (prev ? { ...prev, isSubmitting: true } : prev));

      // 1. Save all KPI scores
      const scoreEntries = Object.entries(wizardState.scores) as Array<
        [RelationshipKPIName, { score: number; notes: string; isPrivate: boolean }]
      >;

      await Promise.all(
        scoreEntries.map(([kpiName, data]) =>
          upsertKPIScore({
            check_in_id: wizardState.checkInId!,
            kpi_name: kpiName,
            score: data.score,
            notes: data.notes || null,
            is_private: data.isPrivate,
          })
        )
      );

      // 2. Save action items
      if (wizardState.actionItems.length > 0) {
        await Promise.all(
          wizardState.actionItems.map((item) =>
            createActionItem({
              check_in_id: wizardState.checkInId!,
              item_text: item.text,
              assigned_to: item.assignedTo,
              related_kpi: item.relatedKpi,
            })
          )
        );
      }

      // 3. Complete check-in (sets status; DB trigger auto-calculates overall score)
      const completedCheckIn = await completeCheckInService(wizardState.checkInId);

      // 4. Clear draft and refresh
      clearDraft();
      setWizardState(null);
      await loadData();

      // 5. Fire-and-forget: trigger N8n insight generation webhook (RKPI-012-A)
      const kpiScores = scoreEntries.map(([kpiName, data]) => ({
        kpi_name: kpiName,
        score: data.score,
        note: data.notes || null,
      }));
      const totalScore =
        kpiScores.length > 0
          ? kpiScores.reduce((sum, s) => sum + s.score, 0) / kpiScores.length
          : 0;

      // Toast success
      const displayScore = completedCheckIn.overall_score ?? totalScore;
      toast.success(`Check-in completed! Score: ${Math.round(displayScore * 10) / 10}/10`);

      triggerInsightGeneration({
        check_in_id: completedCheckIn.id,
        user_id: user!.id,
        kpi_scores: kpiScores,
        overall_score: completedCheckIn.overall_score ?? totalScore,
        action_items: wizardState.actionItems.map((item) => ({
          description: item.text,
          kpi_name: item.relatedKpi,
        })),
      });

      // 6. Fire-and-forget: GHL tags (RKPI-013)
      const updatedHistory = recentCheckIns;
      const completedCount = updatedHistory.filter((c) => c.status === 'completed').length;
      if (completedCount <= 1) {
        tagCheckInStarted(user!.id);
      }
      const streak = getStreakFromHistory(updatedHistory as RelationshipCheckIn[]);
      if (streak >= 4) {
        tagRelationshipConsistent(user!.id);
      }
      const hasCritical = kpiScores.some((s) => s.score <= 3);
      if (hasCritical) {
        tagNeedsSupport(user!.id);
      }
    } catch (err) {
      console.error('[RKPI] submitCheckIn error:', err);
      toast.error('Failed to save check-in. Please try again.');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [wizardState, loadData, user, recentCheckIns]);

  const clearCurrentCheckIn = useCallback(() => {
    clearDraft();
    setWizardState(null);
  }, []);

  // --------------------------------------------------------------------------
  // Context value
  // --------------------------------------------------------------------------

  const value: RelationshipWizardContextState = {
    wizardState,
    isSubmitting,
    startCheckIn,
    updateWizardStep,
    submitCheckIn,
    clearCurrentCheckIn,
  };

  return (
    <RelationshipWizardContext.Provider value={value}>
      {children}
    </RelationshipWizardContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useRelationshipWizard(): RelationshipWizardContextState {
  const ctx = useContext(RelationshipWizardContext);
  if (!ctx) {
    throw new Error('useRelationshipWizard must be used within a RelationshipWizardProvider');
  }
  return ctx;
}
