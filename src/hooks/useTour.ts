/**
 * FEAT-GH-TOUR: Tour Hook
 *
 * Custom hook for managing tour state and actions.
 * Provides access to tour context with type safety.
 */

import { useContext } from 'react';
import { TourContext } from '@/contexts/TourContext';
import type { TourState, TourActions, TourConfig } from '@/types/assessment';

export interface UseTourReturn extends TourState, TourActions {
  isStepActive: (stepId: string) => boolean;
  currentStep: TourConfig['steps'][number] | null;
  progressPercent: number;
  totalSteps: number;
}

/**
 * Hook to access tour state and actions
 */
export function useTour(): UseTourReturn {
  const context = useContext(TourContext);

  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }

  const { state, actions } = context;

  // Derived values
  const currentStep = state.tourConfig?.steps[state.currentStepIndex] ?? null;
  const totalSteps = state.tourConfig?.steps.length ?? 0;
  const progressPercent = totalSteps > 0
    ? Math.round(((state.currentStepIndex + 1) / totalSteps) * 100)
    : 0;

  const isStepActive = (stepId: string): boolean => {
    return currentStep?.id === stepId;
  };

  return {
    // State
    ...state,
    // Actions
    ...actions,
    // Derived
    currentStep,
    totalSteps,
    progressPercent,
    isStepActive,
  };
}

export default useTour;
