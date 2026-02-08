/**
 * RKPI Module: RelationshipDataContext
 * Core data loading for Relationship KPIs - partnerships, check-ins, scores, streaks.
 * Auto-loads on auth, subscribes to real-time updates.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type {
  RelationshipPartnership,
  RelationshipCheckIn,
  CheckInWithScores,
  RelationshipActionItem,
  RelationshipConnectionPrompt,
} from '@/types/relationship-kpis';
import {
  getActivePartnership,
  createPartnership,
  acceptInvitation,
} from '@/services/relationshipPartnershipService';
import {
  getCheckInHistoryWithScores,
} from '@/services/relationshipCheckInService';
import {
  getPendingActionItems,
} from '@/services/relationshipActionItemService';
import {
  getRandomPrompt,
} from '@/services/relationshipConnectionPromptService';
import {
  triggerPartnerInvite,
} from '@/services/relationshipWebhookService';
import {
  tagPartnerInvited,
  tagPartnerPaired,
} from '@/services/ghlTagService';
import {
  getCurrentWeek,
  getStreakFromHistory,
} from '@/utils/relationshipKpis';
import { toast } from 'sonner';

// ============================================================================
// Types
// ============================================================================

type PairingStatus = 'solo' | 'invited' | 'paired';

export interface RelationshipDataContextState {
  // Data
  partnership: RelationshipPartnership | null;
  pairingStatus: PairingStatus;
  recentCheckIns: CheckInWithScores[];
  latestCheckIn: CheckInWithScores | null;
  overallScore: number | null;
  currentStreak: number;
  pendingActionItems: RelationshipActionItem[];
  weeklyPrompt: RelationshipConnectionPrompt | null;
  checkInDueThisWeek: boolean;

  // Loading
  isLoading: boolean;

  // Mutations
  invitePartner: (email: string, phone?: string, name?: string) => Promise<void>;
  acceptPartnerInvite: (token: string) => Promise<void>;
  refreshData: () => Promise<void>;

  // Internal (used by WizardContext)
  loadData: () => Promise<void>;
}

const RelationshipDataContext = createContext<RelationshipDataContextState | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

export function RelationshipDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  // Core data
  const [partnership, setPartnership] = useState<RelationshipPartnership | null>(null);
  const [recentCheckIns, setRecentCheckIns] = useState<CheckInWithScores[]>([]);
  const [pendingActionItems, setPendingActionItems] = useState<RelationshipActionItem[]>([]);
  const [weeklyPrompt, setWeeklyPrompt] = useState<RelationshipConnectionPrompt | null>(null);

  // Loading
  const [isLoading, setIsLoading] = useState(true);

  // Prevent double-loading
  const loadedForUser = useRef<string | null>(null);

  // --------------------------------------------------------------------------
  // Derived state
  // --------------------------------------------------------------------------

  const pairingStatus: PairingStatus = partnership
    ? partnership.invitation_status === 'accepted'
      ? 'paired'
      : 'invited'
    : 'solo';

  const latestCheckIn = recentCheckIns.length > 0 ? recentCheckIns[0] : null;

  const overallScore = latestCheckIn?.overall_score ?? null;

  const currentStreak = getStreakFromHistory(
    recentCheckIns as RelationshipCheckIn[]
  );

  const checkInDueThisWeek = !recentCheckIns.some(
    (ci) => ci.check_in_week === getCurrentWeek() && ci.status === 'completed'
  );

  // --------------------------------------------------------------------------
  // Data Loading
  // --------------------------------------------------------------------------

  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      const [
        partnershipResult,
        historyResult,
        actionItemsResult,
        promptResult,
      ] = await Promise.allSettled([
        getActivePartnership(),
        getCheckInHistoryWithScores(5),
        getPendingActionItems(),
        getRandomPrompt(),
      ]);

      if (partnershipResult.status === 'fulfilled') {
        setPartnership(partnershipResult.value);
      }
      if (historyResult.status === 'fulfilled') {
        setRecentCheckIns(historyResult.value);
      }
      if (actionItemsResult.status === 'fulfilled') {
        setPendingActionItems(actionItemsResult.value);
      }
      if (promptResult.status === 'fulfilled') {
        setWeeklyPrompt(promptResult.value);
      }
    } catch (err) {
      console.error('[RKPI] Error loading relationship data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load on auth change
  useEffect(() => {
    if (user && loadedForUser.current !== user.id) {
      loadedForUser.current = user.id;
      loadData();
    }
    if (!user) {
      loadedForUser.current = null;
      setPartnership(null);
      setRecentCheckIns([]);
      setPendingActionItems([]);
      setWeeklyPrompt(null);
      setIsLoading(false);
    }
  }, [user, loadData]);

  // --------------------------------------------------------------------------
  // Real-time subscription (check-ins for this partnership)
  // --------------------------------------------------------------------------

  useEffect(() => {
    if (!user || !partnership?.id) return;

    const channel = supabase
      .channel(`rkpi-checkins-${partnership.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'relationship_check_ins',
          filter: `partnership_id=eq.${partnership.id}`,
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, partnership?.id, loadData]);

  // --------------------------------------------------------------------------
  // Mutations
  // --------------------------------------------------------------------------

  const invitePartner = useCallback(
    async (email: string, phone?: string, name?: string) => {
      try {
        const newPartnership = await createPartnership({
          partner_email: email,
          partner_phone: phone,
          partner_name: name,
        });
        await loadData();

        toast.success('Invitation sent!');

        // Fire-and-forget: trigger N8n partner invite delivery (RKPI-012-B)
        if (newPartnership.invitation_token) {
          triggerPartnerInvite({
            partnership_id: newPartnership.id,
            partner_email: email,
            partner_phone: phone ?? null,
            partner_name: name ?? null,
            invitation_token: newPartnership.invitation_token,
            inviter_name: user?.user_metadata?.full_name || 'Your Partner',
          });
        }

        // Fire-and-forget: GHL tag (RKPI-013)
        if (user) {
          tagPartnerInvited(user.id);
        }
      } catch (err) {
        console.error('[RKPI] invitePartner error:', err);
        toast.error('Failed to send invitation. Please try again.');
        throw err;
      }
    },
    [loadData, user]
  );

  const acceptPartnerInvite = useCallback(
    async (token: string) => {
      try {
        const accepted = await acceptInvitation(token);
        await loadData();

        toast.success('Partnership active!');

        // Fire-and-forget: GHL tag both users as paired (RKPI-013)
        if (user) {
          tagPartnerPaired(user.id);
        }
        if (accepted.user_id) {
          tagPartnerPaired(accepted.user_id);
        }
      } catch (err) {
        console.error('[RKPI] acceptPartnerInvite error:', err);
        toast.error('Failed to accept invitation. Please try again.');
        throw err;
      }
    },
    [loadData, user]
  );

  const refreshData = useCallback(async () => {
    loadedForUser.current = null;
    if (user) {
      loadedForUser.current = user.id;
      await loadData();
    }
  }, [user, loadData]);

  // --------------------------------------------------------------------------
  // Context value
  // --------------------------------------------------------------------------

  const value: RelationshipDataContextState = {
    partnership,
    pairingStatus,
    recentCheckIns,
    latestCheckIn,
    overallScore,
    currentStreak,
    pendingActionItems,
    weeklyPrompt,
    checkInDueThisWeek,
    isLoading,
    invitePartner,
    acceptPartnerInvite,
    refreshData,
    loadData,
  };

  return (
    <RelationshipDataContext.Provider value={value}>
      {children}
    </RelationshipDataContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useRelationshipData(): RelationshipDataContextState {
  const ctx = useContext(RelationshipDataContext);
  if (!ctx) {
    throw new Error('useRelationshipData must be used within a RelationshipDataProvider');
  }
  return ctx;
}
