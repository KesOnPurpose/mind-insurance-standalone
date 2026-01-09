/**
 * TourSidebarController Component
 * Hub Tour System - Mobile Sidebar Control
 *
 * Controls the sidebar open/close state during the Hub tour.
 * On mobile, the sidebar is collapsed by default and tour targets
 * (Coverage Center, My Evidence, MIO) are inside the sidebar.
 *
 * This component programmatically opens the sidebar when the tour
 * advances past Step 1 (Practice Center) to reveal the sidebar items.
 *
 * Features:
 * - Opens sidebar on mobile after Step 1
 * - Keeps sidebar open through Steps 2-4
 * - Provides callback to close sidebar on tour completion
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

  // Control Sheet overlay visibility based on tour step
  // Steps 2-4 highlight sidebar items - hide the Sheet's bg-black/80 overlay
  useEffect(() => {
    const isSidebarStep = isActive && currentStep >= 2;
    setTourHighlightingSidebar(isSidebarStep);
    console.log('[TourSidebarController] Sheet overlay hidden:', isSidebarStep);

    // Cleanup: restore overlay when tour ends or component unmounts
    return () => {
      setTourHighlightingSidebar(false);
    };
  }, [currentStep, isActive, setTourHighlightingSidebar]);

  // Open sidebar on mobile when tour advances past Step 2 (Hamburger Menu)
  useEffect(() => {
    // Only act on mobile when tour is active
    if (!isMobile || !isActive) return;

    // Step 0 = Practice Center (on Hub page, sidebar closed)
    // Step 1 = Hamburger Menu (highlight the menu button, sidebar still closed)
    // Steps 2-4 = Coverage, Evidence, MIO (in sidebar, needs to be open)
    if (currentStep >= 2 && !openMobile) {
      console.log('[TourSidebarController] Opening sidebar for step:', currentStep);
      // Delay to trigger sidebar open - TourHighlight will poll for elements
      setTimeout(() => {
        setOpenMobile(true);
      }, 200);
    }
  }, [currentStep, isActive, isMobile, openMobile, setOpenMobile]);

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
