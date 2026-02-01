import { ReactNode, useCallback, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { AppSidebar, SidebarMode } from './AppSidebar';
import { cn } from '@/lib/utils';

// Tour components - rendered here to persist across page navigation
import { HubTourProvider, useHubTourContext } from '@/contexts/HubTourContext';
import { PracticeTourProvider, usePracticeTourContext } from '@/contexts/PracticeTourContext';
import { TourHighlight, TourTooltip, TourSidebarController, TourInfoPanel, TourBottomSheet } from '@/components/tour';

// First session status hook for hamburger trigger logic
import { useFirstSessionStatus } from '@/hooks/useFirstSessionStatus';

interface SidebarLayoutProps {
  children: ReactNode;
  /** Override the auto-detected mode */
  mode?: SidebarMode;
  /** Show a page header with gradient background */
  showHeader?: boolean;
  /** Header title */
  headerTitle?: string;
  /** Header subtitle */
  headerSubtitle?: string;
  /** Header gradient color (CSS gradient string) */
  headerGradient?: string;
}

/**
 * Detect sidebar mode based on current route
 */
function getCurrentMode(pathname: string): SidebarMode {
  // Check more specific resources routes first
  if (pathname === '/resources/calculator') return 'resources-calculator';
  if (pathname === '/resources/documents') return 'resources-documents';
  if (pathname.startsWith('/resources')) return 'resources';
  if (pathname.startsWith('/chat')) return 'chat';
  if (pathname.startsWith('/roadmap')) return 'roadmap';
  if (pathname.startsWith('/dashboard')) return 'dashboard';
  if (pathname.startsWith('/relationship-kpis')) return 'relationship-kpis';
  if (pathname.startsWith('/mind-insurance')) return 'mind-insurance';
  if (pathname.startsWith('/model-week')) return 'model-week';
  if (pathname.startsWith('/profile')) return 'profile';
  if (pathname.startsWith('/admin')) return 'admin';
  return 'default';
}

/**
 * Inner layout component that uses the tour context
 */
function SidebarLayoutInner({
  children,
  mode: explicitMode,
  showHeader = false,
  headerTitle,
  headerSubtitle,
  headerGradient = 'linear-gradient(135deg, hsl(187 85% 35%), hsl(187 75% 45%))',
}: SidebarLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const mode = explicitMode || getCurrentMode(location.pathname);

  // MI Standalone: Always use dark theme for all pages
  // This includes /profile, /settings, /admin, and all /mind-insurance routes
  const isMindInsurance = true;

  // ============================================================================
  // HUB TOUR - Uses shared context to persist across all MI page navigation
  // ============================================================================
  const {
    isActive: isTourActive,
    stepData,
    currentStep,
    totalSteps,
    nextStep,
    skipTour,
    completeTour,
    hasCompletedTour: hasCompletedHubTour,
  } = useHubTourContext();

  // ============================================================================
  // PRACTICE TOUR - Separate tour for practice center education
  // ============================================================================
  const {
    isActive: isPracticeTourActive,
    stepData: practiceStepData,
    currentStep: practiceCurrentStep,
    totalSteps: practiceTotalSteps,
    nextStep: practiceNextStep,
    skipTour: practiceSkipTour,
    completeTour: completePracticeTour,
    hasCompletedTour: hasCompletedPracticeTour,
    startTour: startPracticeTour,
  } = usePracticeTourContext();

  // Track first session status for hamburger trigger
  const { data: firstSessionStatus } = useFirstSessionStatus();

  // Track if hamburger has been clicked (localStorage)
  const [hasClickedHamburger, setHasClickedHamburger] = useState(() => {
    try {
      return localStorage.getItem('mi_hamburger_clicked') === 'true';
    } catch {
      return false;
    }
  });

  // Handle hamburger click - trigger practice tour if conditions met
  // SIMPLIFIED: Only check if user hasn't clicked hamburger before AND hasn't completed practice tour
  const handleHamburgerClick = useCallback((e: React.MouseEvent) => {
    // Only trigger tour on FIRST hamburger click for users who haven't completed it
    if (!hasClickedHamburger && !hasCompletedPracticeTour) {
      // Mark hamburger as clicked
      try {
        localStorage.setItem('mi_hamburger_clicked', 'true');
      } catch {
        // Ignore localStorage errors
      }
      setHasClickedHamburger(true);

      // Prevent sidebar from opening - we're navigating instead
      e.stopPropagation();
      e.preventDefault();

      console.log('[SidebarLayout] First hamburger click - triggering practice tour');

      // Navigate to practice page and start tour after page loads
      navigate('/mind-insurance/practice');
      setTimeout(() => {
        console.log('[SidebarLayout] Starting practice tour after navigation');
        startPracticeTour();
      }, 1000); // 1 second delay to ensure page is fully rendered
    }
  }, [
    hasClickedHamburger,
    hasCompletedPracticeTour,
    navigate,
    startPracticeTour,
  ]);

  const handleTourComplete = useCallback(() => {
    completeTour();
    // Tour ends on MIO Insights page - don't navigate away
    // User confirmed: tour should END on MIO page, not return to Hub
  }, [completeTour]);

  const handlePracticeTourComplete = useCallback(() => {
    completePracticeTour();
    // Practice tour ends - user can continue exploring
  }, [completePracticeTour]);

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar mode={mode} />

      {/* Fixed sidebar trigger - OUTSIDE SidebarInset for proper fixed positioning */}
      {/* Always visible on both mobile and desktop so users can open sidebar after scrolling */}
      {/* onClickCapture intercepts click BEFORE SidebarTrigger processes it */}
      <div className="fixed top-4 left-4 z-50" onClickCapture={handleHamburgerClick}>
        <SidebarTrigger className={cn(
          "h-10 w-10 backdrop-blur-sm shadow-lg border rounded-lg",
          isMindInsurance
            ? "bg-mi-navy-light/80 border-mi-cyan/30 text-mi-cyan hover:bg-mi-navy hover:text-white"
            : "bg-background/80 hover:bg-background"
        )} />
      </div>

      <SidebarInset>
        <div className={cn(
          "min-h-screen flex flex-col",
          isMindInsurance ? "bg-mi-navy" : "bg-muted/30"
        )}>
          {/* Optional Header with gradient */}
          {showHeader && (
            <div
              className="text-white transition-all"
              style={{ background: headerGradient }}
            >
              <div className="container mx-auto px-4 py-4">
                <div>
                  {headerTitle && (
                    <h1 className="text-xl font-bold">{headerTitle}</h1>
                  )}
                  {headerSubtitle && (
                    <p className="text-white/90 text-sm">{headerSubtitle}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Main Content Area */}
          <main className="flex-1">
            <div className="container mx-auto px-4 py-6 pt-16 md:pt-6 max-w-6xl">
              {children}
            </div>
          </main>
        </div>
      </SidebarInset>

      {/* ================================================================== */}
      {/* HUB TOUR OVERLAY - Rendered at layout level for persistence       */}
      {/* These components persist across page navigation during the tour   */}
      {/* ================================================================== */}
      <AnimatePresence>
        {isTourActive && stepData && (
          <>
            <TourHighlight
              targetSelector={stepData.targetSelector}
              isActive={isTourActive}
            />
            <TourTooltip
              step={stepData}
              currentStep={currentStep}
              totalSteps={totalSteps}
              onNext={currentStep === totalSteps - 1 ? handleTourComplete : nextStep}
              onSkip={skipTour}
              onComplete={handleTourComplete}
            />
          </>
        )}
      </AnimatePresence>

      {/* ================================================================== */}
      {/* PRACTICE TOUR OVERLAY - Separate tour for practice education      */}
      {/* Triggered via MIO CTA or first hamburger click                    */}
      {/* Uses bottom sheet pattern to keep spotlight visible               */}
      {/* ================================================================== */}
      <AnimatePresence>
        {isPracticeTourActive && practiceStepData && (
          <>
            <TourHighlight
              targetSelector={practiceStepData.targetSelector}
              isActive={isPracticeTourActive}
            />
            <TourBottomSheet
              step={practiceStepData}
              currentStep={practiceCurrentStep}
              totalSteps={practiceTotalSteps}
              onNext={practiceCurrentStep === practiceTotalSteps - 1 ? handlePracticeTourComplete : practiceNextStep}
              onSkip={practiceSkipTour}
              onComplete={handlePracticeTourComplete}
            >
              {/* Show practice info inline when expanded */}
              {practiceStepData.practiceTypes && (
                <TourInfoPanel practiceTypes={practiceStepData.practiceTypes} />
              )}
            </TourBottomSheet>
          </>
        )}
      </AnimatePresence>

      {/* Tour Sidebar Controller - handles mobile sidebar behavior during tour */}
      <TourSidebarController
        currentStep={currentStep}
        isActive={isTourActive}
        totalSteps={totalSteps}
      />
    </SidebarProvider>
  );
}

/**
 * SidebarLayout - Wrapper component that provides consistent sidebar navigation
 *
 * Replaces AppLayout for pages that should use the new sidebar-first design.
 * Automatically detects the current route and shows context-appropriate sidebar content.
 *
 * Wraps children in HubTourProvider so tour state is shared across all pages.
 *
 * Usage:
 * ```tsx
 * <SidebarLayout>
 *   <YourPageContent />
 * </SidebarLayout>
 * ```
 */
export function SidebarLayout(props: SidebarLayoutProps) {
  return (
    <HubTourProvider>
      <PracticeTourProvider>
        <SidebarLayoutInner {...props} />
      </PracticeTourProvider>
    </HubTourProvider>
  );
}

export default SidebarLayout;
