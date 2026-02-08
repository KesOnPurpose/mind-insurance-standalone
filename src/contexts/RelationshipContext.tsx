/**
 * RKPI Module: RelationshipContext (Composer)
 *
 * Nests all relationship sub-providers and exports the backwards-compatible
 * `useRelationship()` hook that merges data from DataContext + WizardContext.
 *
 * Sub-contexts:
 *   - RelationshipDataContext     (core data, partnership, check-ins, scores)
 *   - RelationshipWizardContext   (check-in wizard, draft persistence)
 *   - RelationshipSeparationContext (Vertex Model, separation assessments)
 *   - RelationshipSeasonContext   (Marriage Seasons)
 *   - RelationshipSoloContext     (Solo User Protocol)
 *   - RelationshipDailyPulseContext (Daily Micro-Touchpoint)
 */

import { type ReactNode } from 'react';
import { RelationshipDataProvider, useRelationshipData } from '@/contexts/RelationshipDataContext';
import { RelationshipWizardProvider, useRelationshipWizard } from '@/contexts/RelationshipWizardContext';
import { RelationshipSeparationProvider } from '@/contexts/RelationshipSeparationContext';
import { RelationshipSeasonProvider } from '@/contexts/RelationshipSeasonContext';
import { RelationshipSoloProvider } from '@/contexts/RelationshipSoloContext';
import { RelationshipDailyPulseProvider } from '@/contexts/RelationshipDailyPulseContext';
import type {
  RelationshipPartnership,
  CheckInWithScores,
  RelationshipActionItem,
  RelationshipConnectionPrompt,
  CheckInWizardState,
} from '@/types/relationship-kpis';

// ============================================================================
// Backwards-compatible interface (matches original RelationshipContextState)
// ============================================================================

type PairingStatus = 'solo' | 'invited' | 'paired';

interface RelationshipContextState {
  // Data (from DataContext)
  partnership: RelationshipPartnership | null;
  pairingStatus: PairingStatus;
  recentCheckIns: CheckInWithScores[];
  latestCheckIn: CheckInWithScores | null;
  overallScore: number | null;
  currentStreak: number;
  pendingActionItems: RelationshipActionItem[];
  weeklyPrompt: RelationshipConnectionPrompt | null;
  checkInDueThisWeek: boolean;

  // Wizard (from WizardContext)
  wizardState: CheckInWizardState | null;

  // Loading states
  isLoading: boolean;
  isSubmitting: boolean;

  // Mutations
  startCheckIn: () => Promise<void>;
  updateWizardStep: (step: number, scores?: CheckInWizardState['scores']) => void;
  submitCheckIn: () => Promise<void>;
  clearCurrentCheckIn: () => void;
  invitePartner: (email: string, phone?: string, name?: string) => Promise<void>;
  acceptPartnerInvite: (token: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

// ============================================================================
// Composed Provider
// ============================================================================

export function RelationshipProvider({ children }: { children: ReactNode }) {
  return (
    <RelationshipDataProvider>
      <RelationshipWizardProvider>
        <RelationshipSeparationProvider>
          <RelationshipSeasonProvider>
            <RelationshipDailyPulseProvider>
              <RelationshipSoloProvider>
                {children}
              </RelationshipSoloProvider>
            </RelationshipDailyPulseProvider>
          </RelationshipSeasonProvider>
        </RelationshipSeparationProvider>
      </RelationshipWizardProvider>
    </RelationshipDataProvider>
  );
}

// ============================================================================
// Backwards-compatible hook (merges Data + Wizard contexts)
// ============================================================================

export function useRelationship(): RelationshipContextState {
  const data = useRelationshipData();
  const wizard = useRelationshipWizard();

  return {
    // Data
    partnership: data.partnership,
    pairingStatus: data.pairingStatus,
    recentCheckIns: data.recentCheckIns,
    latestCheckIn: data.latestCheckIn,
    overallScore: data.overallScore,
    currentStreak: data.currentStreak,
    pendingActionItems: data.pendingActionItems,
    weeklyPrompt: data.weeklyPrompt,
    checkInDueThisWeek: data.checkInDueThisWeek,
    isLoading: data.isLoading,

    // Wizard
    wizardState: wizard.wizardState,
    isSubmitting: wizard.isSubmitting,
    startCheckIn: wizard.startCheckIn,
    updateWizardStep: wizard.updateWizardStep,
    submitCheckIn: wizard.submitCheckIn,
    clearCurrentCheckIn: wizard.clearCurrentCheckIn,

    // Data mutations
    invitePartner: data.invitePartner,
    acceptPartnerInvite: data.acceptPartnerInvite,
    refreshData: data.refreshData,
  };
}
