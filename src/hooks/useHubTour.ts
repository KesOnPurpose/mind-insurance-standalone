/**
 * useHubTour Hook
 * Protocol Unlock + Hub Tour System
 *
 * Manages tour state, steps, and persistence for the Mind Insurance Hub tour.
 * 4-step tour covering: Practice Center, Coverage Center, My Evidence, MIO
 *
 * Features:
 * - Persists completion state to localStorage
 * - Supports resume if interrupted mid-tour
 * - Glass-morphism luxury aesthetic
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type TourPosition = 'top' | 'bottom' | 'left' | 'right';

export interface TourStep {
  id: string;
  targetSelector: string;
  title: string;
  description: string;
  position: TourPosition;
}

export interface UseHubTourReturn {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  stepData: TourStep | null;
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

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'practice',
    targetSelector: '[data-tour-target="practice"]',
    title: 'Practice Center',
    description: 'Your daily PROTECT practices live here. Complete all 7 each day to build your streak and level up.',
    position: 'bottom',
  },
  {
    id: 'menu',
    targetSelector: '[data-sidebar="trigger"]',
    title: 'Open Menu',
    description: 'Tap here to open the navigation menu. Coverage Center, My Evidence, and MIO are all inside.',
    position: 'right',
  },
  {
    id: 'coverage',
    targetSelector: '[data-tour-target="sidebar-coverage"]',
    title: 'Coverage Center',
    description: 'View your MIO protocol and track your 7-day transformation journey. This is where your personalized insights come to life.',
    position: 'bottom',
  },
  {
    id: 'evidence',
    targetSelector: '[data-tour-target="sidebar-vault"]',
    title: 'My Evidence',
    description: 'Save insights and track proof of your transformation. Your wins and breakthroughs are stored here as evidence of growth.',
    position: 'bottom',
  },
  {
    id: 'mio',
    targetSelector: '[data-tour-target="sidebar-mio"]',
    title: 'Meet MIO',
    description: 'Your AI coach is always here. Tap to chat with MIO anytime you need guidance or want to explore your patterns.',
    position: 'bottom',
  },
];

// ============================================================================
// CONSTANTS
// ============================================================================

const TOUR_COMPLETED_KEY = 'mi_hub_tour_completed';
const TOUR_COMPLETED_AT_KEY = 'mi_hub_tour_completed_at';
const TOUR_STEP_KEY = 'mi_hub_tour_step';
const TOUR_SKIPPED_KEY = 'mi_hub_tour_skipped';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Scrolls the page to bring the target element into view
 * Called when tour advances to each step
 * Uses requestAnimationFrame + setTimeout for reliable DOM timing on mobile
 */
function scrollToTarget(stepIndex: number): void {
  const selector = TOUR_STEPS[stepIndex]?.targetSelector;
  if (!selector) return;

  // Use requestAnimationFrame + setTimeout for reliable DOM timing
  requestAnimationFrame(() => {
    setTimeout(() => {
      const element = document.querySelector(selector);
      if (element) {
        // Check if element is actually visible (not hidden by CSS)
        const rect = element.getBoundingClientRect();
        const isVisible = rect.width > 0 && rect.height > 0;

        if (isVisible) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest',
          });
          console.log('[useHubTour] Scrolled to target:', selector);
        } else {
          console.warn('[useHubTour] Target element not visible:', selector);
        }
      } else {
        console.warn('[useHubTour] Target element not found:', selector);
      }
    }, 50); // Small delay for layout to settle
  });
}

function getTourCompletedStatus(): boolean {
  try {
    return localStorage.getItem(TOUR_COMPLETED_KEY) === 'true';
  } catch {
    return false;
  }
}

function getSavedStep(): number {
  try {
    const saved = localStorage.getItem(TOUR_STEP_KEY);
    if (saved) {
      const step = parseInt(saved, 10);
      if (!isNaN(step) && step >= 0 && step < TOUR_STEPS.length) {
        return step;
      }
    }
    return 0;
  } catch {
    return 0;
  }
}

function saveCurrentStep(step: number): void {
  try {
    localStorage.setItem(TOUR_STEP_KEY, step.toString());
  } catch (error) {
    console.error('[useHubTour] Error saving step:', error);
  }
}

function markTourCompleted(): void {
  try {
    localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
    localStorage.setItem(TOUR_COMPLETED_AT_KEY, Date.now().toString());
    localStorage.removeItem(TOUR_STEP_KEY); // Clear step tracking
  } catch (error) {
    console.error('[useHubTour] Error marking tour completed:', error);
  }
}

function markTourSkipped(): void {
  try {
    localStorage.setItem(TOUR_SKIPPED_KEY, 'true');
    localStorage.removeItem(TOUR_STEP_KEY);
  } catch (error) {
    console.error('[useHubTour] Error marking tour skipped:', error);
  }
}

function clearTourState(): void {
  try {
    localStorage.removeItem(TOUR_COMPLETED_KEY);
    localStorage.removeItem(TOUR_COMPLETED_AT_KEY);
    localStorage.removeItem(TOUR_STEP_KEY);
    localStorage.removeItem(TOUR_SKIPPED_KEY);
  } catch (error) {
    console.error('[useHubTour] Error clearing tour state:', error);
  }
}

// ============================================================================
// HOOK
// ============================================================================

export function useHubTour(): UseHubTourReturn {
  // State
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompletedTour, setHasCompletedTour] = useState(false);

  // Load initial state from localStorage
  useEffect(() => {
    const completed = getTourCompletedStatus();
    setHasCompletedTour(completed);

    // If tour was interrupted mid-way, we could resume from saved step
    // For now, we start fresh each time
  }, []);

  // Total steps
  const totalSteps = TOUR_STEPS.length;

  // Current step data
  const stepData = useMemo(() => {
    if (!isActive || currentStep < 0 || currentStep >= TOUR_STEPS.length) {
      return null;
    }
    return TOUR_STEPS[currentStep];
  }, [isActive, currentStep]);

  // Start tour
  const startTour = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
    saveCurrentStep(0);
    console.log('[useHubTour] Tour started');
    // Scroll to first target after small delay for render
    setTimeout(() => scrollToTarget(0), 150);
  }, []);

  // Go to next step
  const nextStep = useCallback(() => {
    if (currentStep < TOUR_STEPS.length - 1) {
      const next = currentStep + 1;
      setCurrentStep(next);
      saveCurrentStep(next);
      console.log('[useHubTour] Next step:', next);
      // Longer delay for sidebar steps (2-4) to allow sidebar animation to complete
      const delay = next >= 2 ? 500 : 150;
      setTimeout(() => scrollToTarget(next), delay);
    } else {
      // Last step - complete the tour
      markTourCompleted();
      setIsActive(false);
      setHasCompletedTour(true);
      console.log('[useHubTour] Tour completed');
    }
  }, [currentStep]);

  // Go to previous step
  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      saveCurrentStep(prev);
      console.log('[useHubTour] Previous step:', prev);
    }
  }, [currentStep]);

  // Skip tour
  const skipTour = useCallback(() => {
    markTourSkipped();
    setIsActive(false);
    console.log('[useHubTour] Tour skipped');
  }, []);

  // Complete tour (called on last step)
  const completeTour = useCallback(() => {
    markTourCompleted();
    setIsActive(false);
    setHasCompletedTour(true);
    console.log('[useHubTour] Tour completed via completeTour()');
  }, []);

  // Reset tour (for "Retake Tour" option in settings)
  const resetTour = useCallback(() => {
    clearTourState();
    setHasCompletedTour(false);
    setCurrentStep(0);
    setIsActive(false);
    console.log('[useHubTour] Tour reset');
  }, []);

  return {
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
  };
}

export default useHubTour;
