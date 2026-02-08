/**
 * HubTourContext
 *
 * Provides shared tour state across all Mind Insurance pages.
 * This ensures that startTour() called from MindInsuranceHub
 * activates the tour overlay rendered in SidebarLayout.
 */

import React, { createContext, useContext, useCallback, useState, useEffect, useMemo, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

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
  navigateTo?: string;
}

interface HubTourContextValue {
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
    targetSelector: '[data-tour-target="coverage-header"]',
    title: 'Coverage Center',
    description: 'Track your MIO protocol and see your 7-day transformation journey unfold. Your personalized insights and progress are all here.',
    position: 'bottom',
    navigateTo: '/mind-insurance/coverage',
  },
  {
    id: 'evidence',
    targetSelector: '[data-tour-target="vault-header"]',
    title: 'My Evidence',
    description: 'Your recordings, patterns caught, and victories are stored here. Watch your evidence of transformation grow over time.',
    position: 'bottom',
    navigateTo: '/mind-insurance/vault',
  },
  {
    id: 'mio',
    targetSelector: '[data-tour-target="mio-header"]',
    title: 'Meet MIO',
    description: 'Your AI coach is ready to help. This is where MIO delivers personalized insights based on your daily practices.',
    position: 'bottom',
    navigateTo: '/mind-insurance/mio-insights',
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

function scrollToTarget(stepIndex: number): void {
  const selector = TOUR_STEPS[stepIndex]?.targetSelector;
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
          console.log('[HubTourContext] Scrolled to target:', selector);
        }
      }
    }, 50);
  });
}

function getTourCompletedStatus(): boolean {
  try {
    return localStorage.getItem(TOUR_COMPLETED_KEY) === 'true';
  } catch {
    return false;
  }
}

function saveCurrentStep(step: number): void {
  try {
    localStorage.setItem(TOUR_STEP_KEY, step.toString());
  } catch (error) {
    console.error('[HubTourContext] Error saving step:', error);
  }
}

function markTourCompleted(): void {
  try {
    localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
    localStorage.setItem(TOUR_COMPLETED_AT_KEY, Date.now().toString());
    localStorage.removeItem(TOUR_STEP_KEY);
  } catch (error) {
    console.error('[HubTourContext] Error marking tour completed:', error);
  }
}

function markTourSkipped(): void {
  try {
    localStorage.setItem(TOUR_SKIPPED_KEY, 'true');
    localStorage.removeItem(TOUR_STEP_KEY);
  } catch (error) {
    console.error('[HubTourContext] Error marking tour skipped:', error);
  }
}

function clearTourState(): void {
  try {
    localStorage.removeItem(TOUR_COMPLETED_KEY);
    localStorage.removeItem(TOUR_COMPLETED_AT_KEY);
    localStorage.removeItem(TOUR_STEP_KEY);
    localStorage.removeItem(TOUR_SKIPPED_KEY);
  } catch (error) {
    console.error('[HubTourContext] Error clearing tour state:', error);
  }
}

// ============================================================================
// CONTEXT
// ============================================================================

const HubTourContext = createContext<HubTourContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

interface HubTourProviderProps {
  children: ReactNode;
}

export function HubTourProvider({ children }: HubTourProviderProps) {
  const navigate = useNavigate();

  // State
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompletedTour, setHasCompletedTour] = useState(false);

  // Load initial state from localStorage
  useEffect(() => {
    const completed = getTourCompletedStatus();
    setHasCompletedTour(completed);
  }, []);

  const totalSteps = TOUR_STEPS.length;

  const stepData = useMemo(() => {
    if (!isActive || currentStep < 0 || currentStep >= TOUR_STEPS.length) {
      return null;
    }
    return TOUR_STEPS[currentStep];
  }, [isActive, currentStep]);

  // Start tour
  const startTour = useCallback(() => {
    console.log('[HubTourContext] Starting tour');
    setCurrentStep(0);
    setIsActive(true);
    saveCurrentStep(0);
    setTimeout(() => scrollToTarget(0), 150);
  }, []);

  // Go to next step
  const nextStep = useCallback(() => {
    if (currentStep < TOUR_STEPS.length - 1) {
      const next = currentStep + 1;
      const nextStepConfig = TOUR_STEPS[next];

      // Navigate to page if step has navigateTo defined
      if (nextStepConfig.navigateTo) {
        console.log('[HubTourContext] Navigating to:', nextStepConfig.navigateTo);
        navigate(nextStepConfig.navigateTo);
        // Scroll to top of page so tour target is visible
        window.scrollTo(0, 0);
      }

      setCurrentStep(next);
      saveCurrentStep(next);
      console.log('[HubTourContext] Next step:', next);

      const delay = nextStepConfig.navigateTo ? 800 : 150;
      setTimeout(() => scrollToTarget(next), delay);
    } else {
      markTourCompleted();
      setIsActive(false);
      setHasCompletedTour(true);
      console.log('[HubTourContext] Tour completed');
    }
  }, [currentStep, navigate]);

  // Go to previous step
  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      saveCurrentStep(prev);
      console.log('[HubTourContext] Previous step:', prev);
    }
  }, [currentStep]);

  // Skip tour
  const skipTour = useCallback(() => {
    markTourSkipped();
    setIsActive(false);
    console.log('[HubTourContext] Tour skipped');
  }, []);

  // Complete tour
  const completeTour = useCallback(() => {
    markTourCompleted();
    setIsActive(false);
    setHasCompletedTour(true);
    console.log('[HubTourContext] Tour completed via completeTour()');
  }, []);

  // Reset tour
  const resetTour = useCallback(() => {
    clearTourState();
    setHasCompletedTour(false);
    setCurrentStep(0);
    setIsActive(false);
    console.log('[HubTourContext] Tour reset');
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
    <HubTourContext.Provider value={value}>
      {children}
    </HubTourContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useHubTourContext(): HubTourContextValue {
  const context = useContext(HubTourContext);
  if (!context) {
    throw new Error('useHubTourContext must be used within a HubTourProvider');
  }
  return context;
}

export default HubTourContext;
