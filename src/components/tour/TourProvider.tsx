/**
 * TourProvider Component
 * Hub Tour System
 *
 * Context provider for tour state across components.
 * Wraps MindInsuranceHub to enable tour functionality.
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useHubTour, type TourStep, type UseHubTourReturn } from '@/hooks/useHubTour';

// ============================================================================
// CONTEXT
// ============================================================================

interface TourContextValue extends UseHubTourReturn {}

const TourContext = createContext<TourContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

interface TourProviderProps {
  children: ReactNode;
}

export function TourProvider({ children }: TourProviderProps) {
  const tourState = useHubTour();

  return (
    <TourContext.Provider value={tourState}>
      {children}
    </TourContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useTour(): TourContextValue {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default TourProvider;
