/**
 * RIE Module: RelationshipSoloContext
 * Manages the Solo User Protocol — partner resistance types, solo stages,
 * self-assessment mode, and the "Become the Change" framework.
 *
 * Phase 1B: Full implementation with real data from relationship_user_profiles.
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
  getMyProfile,
  upsertMyProfile,
} from '@/services/relationshipUserProfileService';
import type {
  PartnerResistanceType,
  RelationshipUserProfile,
} from '@/types/relationship-user-profile';

// ============================================================================
// Solo Stage Definitions
// ============================================================================

export interface SoloStageDefinition {
  stage: number;
  title: string;
  description: string;
  focus: string;
}

export const SOLO_STAGES: SoloStageDefinition[] = [
  {
    stage: 1,
    title: 'Self-Awareness',
    description: 'Understanding your own patterns and triggers.',
    focus: 'Rate yourself honestly on all 10 KPIs.',
  },
  {
    stage: 2,
    title: 'Self-Regulation',
    description: 'Managing your emotional responses.',
    focus: 'Practice the "Pause Before Reacting" protocol.',
  },
  {
    stage: 3,
    title: 'Self-Improvement',
    description: 'Actively working on weak areas.',
    focus: 'Complete weekly action items consistently.',
  },
  {
    stage: 4,
    title: 'Influence by Example',
    description: 'Your changes naturally invite partner curiosity.',
    focus: 'Share your wins naturally without forcing.',
  },
  {
    stage: 5,
    title: 'Partnership Invitation',
    description: 'Partner is ready to explore together.',
    focus: 'Gently invite partner to try the app.',
  },
];

// ============================================================================
// Types
// ============================================================================

export interface RelationshipSoloContextState {
  /** Whether the user is in solo mode (no paired partner) */
  isSoloUser: boolean;
  /** Partner resistance type (if detected) */
  partnerResistanceType: PartnerResistanceType | null;
  /** Current solo stage (1-5) */
  soloStage: number | null;
  /** Full relationship profile */
  profile: RelationshipUserProfile | null;
  /** Whether onboarding is complete */
  onboardingCompleted: boolean;
  /** Loading state */
  isLoading: boolean;
  /** Set solo mode with resistance type */
  enableSoloMode: (resistanceType: PartnerResistanceType) => Promise<void>;
  /** Advance to next solo stage */
  advanceSoloStage: () => Promise<void>;
  /** Complete onboarding */
  completeOnboarding: () => Promise<void>;
  /** Refresh data */
  refresh: () => Promise<void>;
}

const defaultState: RelationshipSoloContextState = {
  isSoloUser: false,
  partnerResistanceType: null,
  soloStage: null,
  profile: null,
  onboardingCompleted: false,
  isLoading: true,
  enableSoloMode: async () => {},
  advanceSoloStage: async () => {},
  completeOnboarding: async () => {},
  refresh: async () => {},
};

const RelationshipSoloContext =
  createContext<RelationshipSoloContextState>(defaultState);

// ============================================================================
// Provider
// ============================================================================

export function RelationshipSoloProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [profile, setProfile] = useState<RelationshipUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }
      const p = await getMyProfile();
      setProfile(p);
    } catch (err) {
      console.error('Failed to load solo profile:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const enableSoloMode = useCallback(
    async (resistanceType: PartnerResistanceType) => {
      const updated = await upsertMyProfile({
        partner_resistance_type: resistanceType,
        solo_stage: 1,
      });
      setProfile(updated);
    },
    []
  );

  const advanceSoloStage = useCallback(async () => {
    if (!profile) return;
    const currentStage = profile.solo_stage ?? 1;
    const nextStage = Math.min(currentStage + 1, 5);
    const updated = await upsertMyProfile({
      solo_stage: nextStage,
    });
    setProfile(updated);
  }, [profile]);

  const completeOnboarding = useCallback(async () => {
    const updated = await upsertMyProfile({
      ...({} as any),
    });
    // Use updateMyProfile for onboarding flag
    const { data, error } = await supabase
      .from('relationship_user_profiles')
      .update({
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq('user_id', profile?.user_id ?? '')
      .select()
      .single();
    if (!error && data) {
      setProfile(data as RelationshipUserProfile);
    }
  }, [profile]);

  const value = useMemo<RelationshipSoloContextState>(() => {
    const isSolo = profile?.partner_resistance_type != null;
    return {
      isSoloUser: isSolo,
      partnerResistanceType: profile?.partner_resistance_type ?? null,
      soloStage: profile?.solo_stage ?? null,
      profile,
      onboardingCompleted: profile?.onboarding_completed ?? false,
      isLoading,
      enableSoloMode,
      advanceSoloStage,
      completeOnboarding,
      refresh: loadData,
    };
  }, [profile, isLoading, enableSoloMode, advanceSoloStage, completeOnboarding, loadData]);

  return (
    <RelationshipSoloContext.Provider value={value}>
      {children}
    </RelationshipSoloContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useRelationshipSolo(): RelationshipSoloContextState {
  return useContext(RelationshipSoloContext);
}
