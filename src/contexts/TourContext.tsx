/**
 * FEAT-GH-TOUR: Tour Context
 *
 * React context for managing tour state across the application.
 * Provides tour state and actions to all child components.
 */

import { createContext, useReducer, useCallback, type ReactNode } from 'react';
import type { TourState, TourActions, TourConfig } from '@/types/assessment';

// ============================================
// Context Types
// ============================================

interface TourContextValue {
  state: TourState;
  actions: TourActions;
}

// ============================================
// Initial State
// ============================================

const initialState: TourState = {
  isActive: false,
  currentStepIndex: 0,
  completedSteps: [],
  tourConfig: null,
  isAudioPlaying: false,
  audioProgress: 0,
};

// ============================================
// Action Types
// ============================================

type TourAction =
  | { type: 'START_TOUR'; payload: TourConfig }
  | { type: 'NEXT_STEP' }
  | { type: 'PREVIOUS_STEP' }
  | { type: 'GO_TO_STEP'; payload: number }
  | { type: 'SKIP_TOUR' }
  | { type: 'COMPLETE_TOUR' }
  | { type: 'SET_AUDIO_PLAYING'; payload: boolean }
  | { type: 'SET_AUDIO_PROGRESS'; payload: number }
  | { type: 'RESET_TOUR' };

// ============================================
// Reducer
// ============================================

function tourReducer(state: TourState, action: TourAction): TourState {
  switch (action.type) {
    case 'START_TOUR':
      return {
        ...state,
        isActive: true,
        currentStepIndex: 0,
        completedSteps: [],
        tourConfig: action.payload,
        isAudioPlaying: false,
        audioProgress: 0,
      };

    case 'NEXT_STEP': {
      if (!state.tourConfig) return state;

      const totalSteps = state.tourConfig.steps.length;
      const currentStep = state.tourConfig.steps[state.currentStepIndex];
      const nextIndex = state.currentStepIndex + 1;

      // Mark current step as completed
      const newCompletedSteps = currentStep
        ? [...state.completedSteps, currentStep.id]
        : state.completedSteps;

      // Check if we've reached the end
      if (nextIndex >= totalSteps) {
        return {
          ...state,
          completedSteps: newCompletedSteps,
          // Stay on last step, completion handled separately
        };
      }

      return {
        ...state,
        currentStepIndex: nextIndex,
        completedSteps: newCompletedSteps,
        isAudioPlaying: false,
        audioProgress: 0,
      };
    }

    case 'PREVIOUS_STEP': {
      const prevIndex = Math.max(0, state.currentStepIndex - 1);
      return {
        ...state,
        currentStepIndex: prevIndex,
        isAudioPlaying: false,
        audioProgress: 0,
      };
    }

    case 'GO_TO_STEP': {
      if (!state.tourConfig) return state;

      const targetIndex = Math.max(
        0,
        Math.min(action.payload, state.tourConfig.steps.length - 1)
      );

      return {
        ...state,
        currentStepIndex: targetIndex,
        isAudioPlaying: false,
        audioProgress: 0,
      };
    }

    case 'SKIP_TOUR':
      return {
        ...initialState,
      };

    case 'COMPLETE_TOUR':
      return {
        ...state,
        isActive: false,
        // Keep completed steps for reference
      };

    case 'SET_AUDIO_PLAYING':
      return {
        ...state,
        isAudioPlaying: action.payload,
      };

    case 'SET_AUDIO_PROGRESS':
      return {
        ...state,
        audioProgress: action.payload,
      };

    case 'RESET_TOUR':
      return initialState;

    default:
      return state;
  }
}

// ============================================
// Context
// ============================================

export const TourContext = createContext<TourContextValue | null>(null);

// ============================================
// Provider
// ============================================

interface TourProviderProps {
  children: ReactNode;
}

export function TourProvider({ children }: TourProviderProps) {
  const [state, dispatch] = useReducer(tourReducer, initialState);

  // Action creators
  const startTour = useCallback((config: TourConfig) => {
    dispatch({ type: 'START_TOUR', payload: config });
  }, []);

  const nextStep = useCallback(() => {
    dispatch({ type: 'NEXT_STEP' });
  }, []);

  const previousStep = useCallback(() => {
    dispatch({ type: 'PREVIOUS_STEP' });
  }, []);

  const skipTour = useCallback(() => {
    dispatch({ type: 'SKIP_TOUR' });
  }, []);

  const completeTour = useCallback(() => {
    dispatch({ type: 'COMPLETE_TOUR' });
  }, []);

  const goToStep = useCallback((stepIndex: number) => {
    dispatch({ type: 'GO_TO_STEP', payload: stepIndex });
  }, []);

  const pauseAudio = useCallback(() => {
    dispatch({ type: 'SET_AUDIO_PLAYING', payload: false });
  }, []);

  const resumeAudio = useCallback(() => {
    dispatch({ type: 'SET_AUDIO_PLAYING', payload: true });
  }, []);

  const actions: TourActions = {
    startTour,
    nextStep,
    previousStep,
    skipTour,
    completeTour,
    goToStep,
    pauseAudio,
    resumeAudio,
  };

  return (
    <TourContext.Provider value={{ state, actions }}>
      {children}
    </TourContext.Provider>
  );
}

export default TourProvider;
