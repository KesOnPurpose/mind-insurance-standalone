/**
 * TourSidebarController Component
 * Hub Tour System - Mobile Sidebar Control
 *
 * UPDATED: Steps 2-4 now navigate to actual pages instead of
 * highlighting sidebar items. This component is simplified to only
 * handle the first 2 steps on the Hub page.
 *
 * Features:
 * - Closes sidebar when tour ends (if it was opened during tour)
 * - Tracks tour active state to avoid interfering with manual sidebar use
 */

import { useEffect, useCallback, useRef } from 'react';
import { useSidebar } from '@/components/ui/sidebar';
import { useSheetTour } from '@/components/ui/sheet';

// ============================================================================
// TYPES
// ============================================================================

interface TourSidebarControllerProps {
  /** Current step index (0-based) */
  currentStep: number;
  /** Whether the tour is currently active */
  isActive: boolean;
  /** Total number of tour steps */
  totalSteps: number;
  /** Callback when sidebar should close (on tour completion) */
  onSidebarClose?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function TourSidebarController({
  currentStep,
  isActive,
  totalSteps,
  onSidebarClose,
}: TourSidebarControllerProps) {
  const { setOpenMobile, isMobile, openMobile } = useSidebar();
  const { setTourHighlightingSidebar } = useSheetTour();

  // Track if tour was ever active during this component's lifecycle
  // This prevents closing the sidebar when user manually opens it (no tour running)
  const wasTourActiveRef = useRef(false);

  // Update ref when tour becomes active
  useEffect(() => {
    if (isActive) {
      wasTourActiveRef.current = true;
    }
  }, [isActive]);

  // Reset sheet tour context when tour is active
  // (No longer needed for steps 2-4 since we navigate to pages now)
  useEffect(() => {
    // Always keep overlay visible - no sidebar highlighting needed
    setTourHighlightingSidebar(false);

    // Cleanup
    return () => {
      setTourHighlightingSidebar(false);
    };
  }, [isActive, setTourHighlightingSidebar]);

  // Close sidebar when tour ends (transitions from active to inactive)
  // IMPORTANT: Only close if the tour WAS active during this session
  // This prevents closing the sidebar when user manually opens it (no tour running)
  useEffect(() => {
    if (!isMobile) return;

    // Only close sidebar if:
    // 1. Tour was active at some point (wasTourActiveRef.current)
    // 2. Tour just became inactive (!isActive)
    // 3. Sidebar is currently open (openMobile)
    if (wasTourActiveRef.current && !isActive && openMobile) {
      console.log('[TourSidebarController] Tour ended, closing sidebar');
      setOpenMobile(false);
      onSidebarClose?.();
      // Reset the ref so next tour works correctly
      wasTourActiveRef.current = false;
    }
  }, [isActive, isMobile, openMobile, setOpenMobile, onSidebarClose]);

  // Expose close function for parent to use on tour completion
  const closeSidebar = useCallback(() => {
    if (isMobile && openMobile) {
      setOpenMobile(false);
    }
  }, [isMobile, openMobile, setOpenMobile]);

  // This is a pure side-effect component - no visual output
  return null;
}

export default TourSidebarController;
