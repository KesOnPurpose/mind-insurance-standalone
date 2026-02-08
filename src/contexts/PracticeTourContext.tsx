/**
 * PracticeTourContext
 *
 * Separate tour context for educating users on the morning PROTECT practices.
 * Highlights the "i" info icons on the first 3 practices (P, R, O).
 *
 * Behavioral Science Foundation:
 * - Implementation Intentions (Gollwitzer): Showing HOW increases follow-through 2-3x
 * - Familiarity Reduces Threat: Tour creates neural safety for unfamiliar tasks
 * - Reciprocity: User just received MIO insight → more likely to comply
 * - Micro-Commitments (BJ Fogg): "30 seconds" framing reduces resistance
 * - Dopamine Anticipation: Tour creates anticipation for practice completion reward
 *
 * Triggers:
 * 1. MIO Chat CTA → Navigate to Practice + Auto-Start tour
 * 2. First Hamburger Click → If user hasn't completed hub tour or engaged with MIO
 */

import React, { createContext, useContext, useCallback, useState, useEffect, useMemo, ReactNode } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type TourPosition = 'top' | 'bottom' | 'left' | 'right';

export type PracticeType = 'P' | 'R' | 'O' | 'T' | 'E' | 'C' | 'T2';

export interface PracticeTourStep {
  id: string;
  targetSelector: string;
  title: string;
  description: string;
  position: TourPosition;
  sectionId?: string; // For section-based targeting
  practiceTypes?: PracticeType[]; // Practices to show info for in this step
}

interface PracticeTourContextValue {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  stepData: PracticeTourStep | null;
  startTour: () => void;
  nextStep: () => void;
  previousStep: () => void;
  skipTour: () => void;
  completeTour: () => void;
  hasCompletedTour: boolean;
  resetTour: () => void;
}

// ============================================================================
// TOUR STEPS CONFIGURATION
// ============================================================================

/**
 * REDESIGNED: Tour now highlights TIME WINDOW SECTIONS instead of individual "i" icons
 * Each step shows the section collapsed, then displays practice info inline in the tooltip
 */
export const PRACTICE_TOUR_STEPS: PracticeTourStep[] = [
  {
    id: 'championship-setup',
    targetSelector: '[data-tour-target="section-championship-setup"]',
    title: '🌅 Championship Setup',
    description: 'Your morning power trio (3 AM - 10 AM). These 3 practices prime your brain for peak performance before the day begins.',
    position: 'bottom',
    sectionId: 'CHAMPIONSHIP_SETUP',
    practiceTypes: ['P', 'R', 'O'],
  },
  {
    id: 'nascar-pit-stop',
    targetSelector: '[data-tour-target="section-nascar-pit-stop"]',
    title: '🏎️ NASCAR Pit Stop',
    description: 'Quick mid-day adjustments (10 AM - 3 PM). Reset triggers and audit your energy to stay on track.',
    position: 'bottom',
    sectionId: 'NASCAR_PIT_STOP',
    practiceTypes: ['T', 'E'],
  },
  {
    id: 'victory-lap',
    targetSelector: '[data-tour-target="section-victory-lap"]',
    title: '🏆 Victory Lap',
    description: 'Evening celebration and setup (3 PM - 10 PM). Anchor today\'s wins and set tomorrow\'s championship.',
    position: 'bottom',
    sectionId: 'VICTORY_LAP',
    practiceTypes: ['C', 'T2'],
  },
];

// ============================================================================
// CONSTANTS
// ============================================================================

const PRACTICE_TOUR_COMPLETED_KEY = 'mi_practice_tour_completed';
const PRACTICE_TOUR_COMPLETED_AT_KEY = 'mi_practice_tour_completed_at';
const PRACTICE_TOUR_STEP_KEY = 'mi_practice_tour_step';
const PRACTICE_TOUR_SKIPPED_KEY = 'mi_practice_tour_skipped';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function scrollToTarget(stepIndex: number): void {
  const selector = PRACTICE_TOUR_STEPS[stepIndex]?.targetSelector;
  if (!selector) return;

  requestAnimationFrame(() => {
    setTimeout(() => {
      const element = document.querySelector(selector);
      if (element) {
        const rect = element.getBoundingClientRect();
        const isVisible = rect.width > 0 && rect.height > 0;

        if (isVisible) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest',
          });
          console.log('[PracticeTourContext] Scrolled to target:', selector);
        }
      }
    }, 50);
  });
}

function getTourCompletedStatus(): boolean {
  try {
    return localStorage.getItem(PRACTICE_TOUR_COMPLETED_KEY) === 'true';
  } catch {
    return false;
  }
}

function saveCurrentStep(step: number): void {
  try {
    localStorage.setItem(PRACTICE_TOUR_STEP_KEY, step.toString());
  } catch (error) {
    console.error('[PracticeTourContext] Error saving step:', error);
  }
}

function markTourCompleted(): void {
  try {
    localStorage.setItem(PRACTICE_TOUR_COMPLETED_KEY, 'true');
    localStorage.setItem(PRACTICE_TOUR_COMPLETED_AT_KEY, Date.now().toString());
    localStorage.removeItem(PRACTICE_TOUR_STEP_KEY);
  } catch (error) {
    console.error('[PracticeTourContext] Error marking tour completed:', error);
  }
}

function markTourSkipped(): void {
  try {
    localStorage.setItem(PRACTICE_TOUR_SKIPPED_KEY, 'true');
    localStorage.removeItem(PRACTICE_TOUR_STEP_KEY);
  } catch (error) {
    console.error('[PracticeTourContext] Error marking tour skipped:', error);
  }
}

function clearTourState(): void {
  try {
    localStorage.removeItem(PRACTICE_TOUR_COMPLETED_KEY);
    localStorage.removeItem(PRACTICE_TOUR_COMPLETED_AT_KEY);
    localStorage.removeItem(PRACTICE_TOUR_STEP_KEY);
    localStorage.removeItem(PRACTICE_TOUR_SKIPPED_KEY);
  } catch (error) {
    console.error('[PracticeTourContext] Error clearing tour state:', error);
  }
}

// ============================================================================
// CONTEXT
// ============================================================================

const PracticeTourContext = createContext<PracticeTourContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

interface PracticeTourProviderProps {
  children: ReactNode;
}

export function PracticeTourProvider({ children }: PracticeTourProviderProps) {
  // State
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompletedTour, setHasCompletedTour] = useState(false);

  // Load initial state from localStorage
  useEffect(() => {
    const completed = getTourCompletedStatus();
    setHasCompletedTour(completed);
  }, []);

  const totalSteps = PRACTICE_TOUR_STEPS.length;

  const stepData = useMemo(() => {
    if (!isActive || currentStep < 0 || currentStep >= PRACTICE_TOUR_STEPS.length) {
      return null;
    }
    return PRACTICE_TOUR_STEPS[currentStep];
  }, [isActive, currentStep]);

  // Start tour
  const startTour = useCallback(() => {
    console.log('[PracticeTourContext] Starting practice tour');
    setCurrentStep(0);
    setIsActive(true);
    saveCurrentStep(0);
    setTimeout(() => scrollToTarget(0), 150);
  }, []);

  // Go to next step
  const nextStep = useCallback(() => {
    if (currentStep < PRACTICE_TOUR_STEPS.length - 1) {
      const next = currentStep + 1;
      setCurrentStep(next);
      saveCurrentStep(next);
      console.log('[PracticeTourContext] Next step:', next);
      setTimeout(() => scrollToTarget(next), 150);
    } else {
      markTourCompleted();
      setIsActive(false);
      setHasCompletedTour(true);
      console.log('[PracticeTourContext] Practice tour completed');
    }
  }, [currentStep]);

  // Go to previous step
  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      saveCurrentStep(prev);
      console.log('[PracticeTourContext] Previous step:', prev);
      setTimeout(() => scrollToTarget(prev), 150);
    }
  }, [currentStep]);

  // Skip tour
  const skipTour = useCallback(() => {
    markTourSkipped();
    setIsActive(false);
    console.log('[PracticeTourContext] Practice tour skipped');
  }, []);

  // Complete tour
  const completeTour = useCallback(() => {
    markTourCompleted();
    setIsActive(false);
    setHasCompletedTour(true);
    console.log('[PracticeTourContext] Practice tour completed via completeTour()');
  }, []);

  // Reset tour
  const resetTour = useCallback(() => {
    clearTourState();
    setHasCompletedTour(false);
    setCurrentStep(0);
    setIsActive(false);
    console.log('[PracticeTourContext] Practice tour reset');
  }, []);

  const value = useMemo(() => ({
    isActive,
    currentStep,
    totalSteps,
    stepData,
    startTour,
    nextStep,
    previousStep,
    skipTour,
    completeTour,
    hasCompletedTour,
    resetTour,
  }), [
    isActive,
    currentStep,
    totalSteps,
    stepData,
    startTour,
    nextStep,
    previousStep,
    skipTour,
    completeTour,
    hasCompletedTour,
    resetTour,
  ]);

  return (
    <PracticeTourContext.Provider value={value}>
      {children}
    </PracticeTourContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function usePracticeTourContext(): PracticeTourContextValue {
  const context = useContext(PracticeTourContext);
  if (!context) {
    throw new Error('usePracticeTourContext must be used within a PracticeTourProvider');
  }
  return context;
}

export default PracticeTourContext;
