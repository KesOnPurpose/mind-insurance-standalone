/**
 * FEAT-GH-TOUR: Tour Controller Component
 *
 * Main orchestrator for the Nette onboarding tour.
 * Coordinates overlay, tooltip, audio, and proactive messages.
 */

import { useEffect, useCallback, useState, useRef, useContext } from 'react';
import { useTour } from '@/hooks/useTour';
import { useTourAudio } from '@/hooks/useTourAudio';
import { tourAudioService } from '@/services/tourAudioService';
import { TOUR_AUDIO_SCRIPTS } from '@/config/GrouphomeTourSteps';
import { SidebarContext } from '@/components/ui/sidebar';
import { useSheetTour } from '@/components/ui/sheet';
import { TourOverlay } from './TourOverlay';
import { TourTooltip } from './TourTooltip';
import { NetteProactiveMessage } from './NetteProactiveMessage';
import { IncomeRoadmapCard } from './IncomeRoadmapCard';
import { supabase } from '@/integrations/supabase/client';
import { calculateIncomeReplacementRoadmap } from '@/utils/incomeReplacementCalculator';
import type {
  ProactiveMessageConsent,
  IncomeReplacementRoadmap,
  NetteProactiveMessage as NetteProactiveMessageType,
} from '@/types/assessment';

interface TourControllerProps {
  userId?: string;
  userState?: string;
  targetIncome?: number;
  ownershipModel?: string;
}

/**
 * Default proactive message for asking permission
 */
const DEFAULT_PROACTIVE_MESSAGE: NetteProactiveMessageType = {
  id: 'tour-complete-insights',
  title: "I've Got Something Special for You!",
  content:
    "Based on what you've shared in your assessment, I've prepared a personalized Income Replacement Roadmap just for you. It shows exactly how many properties you need and when you could realistically replace your current income. Would you like to see it?",
  previewItems: [
    'Your target income breakdown',
    'Number of properties needed',
    'Timeline with milestones',
    'Personalized insights based on your state',
  ],
  priority: 'high',
  triggerCondition: 'tour_complete',
  actions: [
    { type: 'show_roadmap', label: 'Yes, show me!', primary: true },
    { type: 'dismiss', label: 'Maybe later' },
    { type: 'never', label: 'No thanks' },
  ],
};

/**
 * TourController - Main tour orchestration component
 *
 * Features:
 * - Coordinates all tour elements
 * - Manages audio playback
 * - Handles proactive message consent
 * - Shows income roadmap on consent
 * - Persists completion to database
 */
export function TourController({
  userId,
  userState = 'texas',
  targetIncome = 10000,
  ownershipModel = 'ownership',
}: TourControllerProps) {
  const {
    isActive,
    currentStep,
    currentStepIndex,
    totalSteps,
    nextStep,
    previousStep,
    skipTour,
    completeTour,
  } = useTour();

  const {
    isPlaying: isAudioPlaying,
    togglePlayPause,
    stop: stopAudio,
    playCurrentStep,
  } = useTourAudio();

  // Sidebar control for steps 5/6 (sidebar-navigation, chat-nette)
  // Use useContext directly so we get null (not throw) when SidebarProvider is missing
  const sidebarContext = useContext(SidebarContext);
  const setOpenMobile = sidebarContext?.setOpenMobile ?? (() => {});
  const isMobile = sidebarContext?.isMobile ?? false;
  const openMobile = sidebarContext?.openMobile ?? false;
  const setOpen = sidebarContext?.setOpen ?? (() => {});
  const open = sidebarContext?.open ?? false;
  const sidebarOpenedByTourRef = useRef(false);

  // Sheet tour context - raises sidebar z-index above tour overlay on mobile
  const { setTourHighlightingSidebar } = useSheetTour();
  const lastPlayedStepRef = useRef<string | null>(null);

  const [showProactiveMessage, setShowProactiveMessage] = useState(false);
  const proactiveAudioPlayedRef = useRef(false);

  /**
   * Play proactive-roadmap audio when the proactive message modal appears
   */
  useEffect(() => {
    if (showProactiveMessage && !proactiveAudioPlayedRef.current) {
      proactiveAudioPlayedRef.current = true;

      // Stop any existing audio first
      tourAudioService.stop();

      // Small delay to let the UI render before playing audio
      const timer = setTimeout(() => {
        const proactiveScript = TOUR_AUDIO_SCRIPTS['proactive-roadmap'];
        if (proactiveScript) {
          console.log('[TourController] Playing proactive-roadmap audio');
          tourAudioService.generateAndPlay(
            proactiveScript,
            () => {}, // onProgress (no-op)
            (playing) => {
              // Update isAudioPlaying state would require more refactoring
              // For now, we just log it
              console.log('[TourController] Proactive audio playing:', playing);
            }
          ).catch((err) => {
            console.error('[TourController] Error playing proactive audio:', err);
          });
        }
      }, 500);

      return () => clearTimeout(timer);
    }

    // Reset the ref when modal closes (so it can play again if user comes back)
    if (!showProactiveMessage) {
      proactiveAudioPlayedRef.current = false;
    }
  }, [showProactiveMessage]);

  /**
   * Auto-play audio when step changes
   * This ensures each step's narration plays automatically
   */
  useEffect(() => {
    if (!isActive || !currentStep) return;

    // Only play if this is a new step (prevent double-play)
    if (lastPlayedStepRef.current !== currentStep.id) {
      lastPlayedStepRef.current = currentStep.id;

      // Small delay to let the UI settle before playing audio
      const timer = setTimeout(() => {
        console.log('[TourController] Auto-playing audio for step:', currentStep.id);
        playCurrentStep();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isActive, currentStep, playCurrentStep]);
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [roadmap, setRoadmap] = useState<IncomeReplacementRoadmap | null>(null);
  const [consent, setConsent] = useState<ProactiveMessageConsent | null>(null);

  /**
   * Open sidebar when reaching sidebar steps (sidebar-navigation, chat-nette)
   * This makes the sidebar slide out so users can see it being highlighted.
   * Also raises the Sheet z-index on mobile so sidebar appears above tour overlay.
   */
  useEffect(() => {
    if (!isActive || !currentStep) return;

    const SIDEBAR_STEP_IDS = ['sidebar-navigation', 'chat-nette'];
    const isSidebarStep = SIDEBAR_STEP_IDS.includes(currentStep.id);

    if (isSidebarStep) {
      // Raise Sheet z-index on mobile so sidebar is above tour overlay
      if (isMobile) {
        setTourHighlightingSidebar(true);
      }

      // Open sidebar for this step
      if (isMobile && !openMobile) {
        console.log('[TourController] Opening mobile sidebar for step:', currentStep.id);
        sidebarOpenedByTourRef.current = true;
        setOpenMobile(true);
      } else if (!isMobile && !open) {
        console.log('[TourController] Opening desktop sidebar for step:', currentStep.id);
        sidebarOpenedByTourRef.current = true;
        setOpen(true);
      }
    } else {
      // Reset Sheet z-index when leaving sidebar steps
      setTourHighlightingSidebar(false);

      // Close sidebar if tour opened it and we're leaving sidebar steps
      if (sidebarOpenedByTourRef.current) {
        if (isMobile && openMobile) {
          console.log('[TourController] Closing mobile sidebar after leaving sidebar step');
          setOpenMobile(false);
        }
        // Don't close desktop sidebar - it looks better to leave it open
        sidebarOpenedByTourRef.current = false;
      }
    }
  }, [isActive, currentStep, isMobile, openMobile, open, setOpenMobile, setOpen, setTourHighlightingSidebar]);

  /**
   * Close sidebar and reset z-index when tour ends (if it was opened by the tour)
   */
  useEffect(() => {
    if (!isActive && sidebarOpenedByTourRef.current) {
      if (isMobile && openMobile) {
        console.log('[TourController] Tour ended, closing mobile sidebar');
        setOpenMobile(false);
      }
      setTourHighlightingSidebar(false);
      sidebarOpenedByTourRef.current = false;
    }
  }, [isActive, isMobile, openMobile, setOpenMobile, setTourHighlightingSidebar]);

  /**
   * Calculate roadmap when needed
   */
  const generateRoadmap = useCallback(() => {
    const calculatedRoadmap = calculateIncomeReplacementRoadmap({
      state: userState,
      ownershipModel: ownershipModel as 'ownership' | 'rental_arbitrage' | 'creative_financing' | 'house_hack' | 'hybrid',
      targetMonthlyIncome: targetIncome,
    });

    setRoadmap(calculatedRoadmap);
    return calculatedRoadmap;
  }, [userState, ownershipModel, targetIncome]);

  /**
   * Handle tour step navigation
   */
  const handleNext = useCallback(() => {
    stopAudio();

    // Check if this is the last step
    if (currentStepIndex === totalSteps - 1) {
      // Show proactive message instead of completing immediately
      setShowProactiveMessage(true);
    } else {
      nextStep();
    }
  }, [currentStepIndex, totalSteps, nextStep, stopAudio]);

  const handlePrevious = useCallback(() => {
    stopAudio();
    previousStep();
  }, [previousStep, stopAudio]);

  const handleSkip = useCallback(() => {
    stopAudio();
    skipTour();
  }, [skipTour, stopAudio]);

  /**
   * Handle proactive message consent
   */
  const handleConsent = useCallback(
    async (userConsent: ProactiveMessageConsent) => {
      setConsent(userConsent);

      if (userConsent === 'yes_show_insights') {
        // Generate and show roadmap
        generateRoadmap();
        setShowRoadmap(true);
        setShowProactiveMessage(false);
      } else {
        // User declined or deferred
        setShowProactiveMessage(false);
        completeTour();
      }

      // Persist consent to database
      if (userId) {
        try {
          await supabase.from('user_onboarding').upsert(
            {
              user_id: userId,
              nette_proactive_message_shown: true,
              nette_proactive_message_consent: userConsent,
              gh_tour_completed: true,
              gh_tour_completed_at: new Date().toISOString(),
              ...(userConsent === 'yes_show_insights' && {
                income_roadmap_shown: true,
                income_replacement_target: targetIncome,
              }),
            },
            { onConflict: 'user_id' }
          );
        } catch (error) {
          console.error('[TourController] Error saving consent:', error);
        }
      }
    },
    [userId, targetIncome, generateRoadmap, completeTour]
  );

  /**
   * Handle roadmap close
   */
  const handleRoadmapClose = useCallback(() => {
    setShowRoadmap(false);
    completeTour();
  }, [completeTour]);

  /**
   * Handle overlay click (close tour if step allows)
   */
  const handleOverlayClick = useCallback(() => {
    // Could add logic here to skip if clickable
    // For now, we don't close on overlay click
  }, []);

  // Don't render anything if tour isn't active
  if (!isActive && !showProactiveMessage && !showRoadmap) {
    return null;
  }

  // Show roadmap if user consented
  if (showRoadmap && roadmap) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="w-full max-w-4xl max-h-[90vh] overflow-auto">
          <IncomeRoadmapCard roadmap={roadmap} showConfetti />
          <div className="mt-4 flex justify-center">
            <button
              onClick={handleRoadmapClose}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Got it, let's get started!
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show proactive message at tour end
  if (showProactiveMessage) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="w-full max-w-lg">
          <NetteProactiveMessage
            message={DEFAULT_PROACTIVE_MESSAGE}
            isAudioPlaying={isAudioPlaying}
            onConsent={handleConsent}
            onToggleAudio={togglePlayPause}
          />
        </div>
      </div>
    );
  }

  // Show active tour
  if (!currentStep) {
    return null;
  }

  return (
    <>
      {/* Overlay with spotlight */}
      <TourOverlay
        targetSelector={currentStep.targetSelector}
        isVisible={isActive}
        padding={currentStep.highlightPadding}
        borderRadius={currentStep.highlightBorderRadius}
        onClick={handleOverlayClick}
      />

      {/* Tooltip with navigation */}
      <TourTooltip
        step={currentStep}
        stepIndex={currentStepIndex}
        totalSteps={totalSteps}
        isAudioPlaying={isAudioPlaying}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onSkip={handleSkip}
        onToggleAudio={togglePlayPause}
        showSkip
      />
    </>
  );
}

export default TourController;
