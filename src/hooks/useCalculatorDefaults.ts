import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  CalculatorInputs,
  DEFAULT_INPUTS,
  DEFAULT_STARTUP_COSTS,
  CALCULATOR_CONSTANTS,
} from '@/types/calculator';

interface StateInfo {
  state: string;
  average_rate_per_bed: number | null;
  licensing_cost_min: number | null;
  licensing_cost_max: number | null;
}

/**
 * Hook to pre-fill calculator inputs from user's profile
 * Fetches:
 * - user_onboarding: bed_count, target_state, capital_available
 * - gh_state_licensing_info: state-specific rates and costs
 */
export function useCalculatorDefaults() {
  const { user } = useAuth();

  const { data: defaultInputs, isLoading, error } = useQuery({
    queryKey: ['calculator-defaults', user?.id],
    queryFn: async (): Promise<Partial<CalculatorInputs> | null> => {
      if (!user?.id) return null;

      // Fetch user's onboarding data
      const { data: profile, error: profileError } = await supabase
        .from('user_onboarding')
        .select('bed_count, target_state, capital_available, ownership_model')
        .eq('user_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError);
      }

      if (!profile) {
        return null;
      }

      // Fetch state-specific info if target state is set
      let stateInfo: StateInfo | null = null;
      if (profile.target_state) {
        const { data: stateData, error: stateError } = await supabase
          .from('gh_state_licensing_info')
          .select('state, average_rate_per_bed, licensing_cost_min, licensing_cost_max')
          .eq('state', profile.target_state)
          .single();

        if (stateError && stateError.code !== 'PGRST116') {
          console.error('Error fetching state info:', stateError);
        }

        stateInfo = stateData as StateInfo | null;
      }

      // Build defaults from profile
      const defaults: Partial<CalculatorInputs> = {};

      // Bed count from profile
      if (profile.bed_count && profile.bed_count > 0) {
        defaults.bedCount = profile.bed_count;
      }

      // Rate per bed from state info or SSI max
      if (stateInfo?.average_rate_per_bed) {
        defaults.ratePerBed = stateInfo.average_rate_per_bed;
      } else {
        defaults.ratePerBed = CALCULATOR_CONSTANTS.SSI_MAX_RENT;
      }

      // Target state and ownership model for context
      defaults.targetState = profile.target_state || undefined;
      defaults.ownershipModel = profile.ownership_model || undefined;

      // Estimate startup costs based on state licensing info and capital
      if (stateInfo || profile.capital_available) {
        const startupCosts = { ...DEFAULT_STARTUP_COSTS };

        // Use state licensing cost average if available
        if (stateInfo?.licensing_cost_min && stateInfo?.licensing_cost_max) {
          startupCosts.licensingCosts = Math.round(
            (stateInfo.licensing_cost_min + stateInfo.licensing_cost_max) / 2
          );
        }

        // Scale reserve fund based on available capital
        if (profile.capital_available) {
          // Reserve should be ~20% of startup capital, max $20k
          startupCosts.reserveFund = Math.min(
            Math.round(profile.capital_available * 0.2),
            20000
          );
        }

        defaults.startupCosts = startupCosts;
      }

      return defaults;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    defaultInputs,
    isLoading,
    error,
  };
}

export default useCalculatorDefaults;
