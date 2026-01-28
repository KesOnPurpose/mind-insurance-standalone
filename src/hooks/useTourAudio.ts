/**
 * FEAT-GH-TOUR: Tour Audio Hook
 *
 * Custom hook for managing audio playback during the tour.
 * Integrates with TourContext and ElevenLabs audio service.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { tourAudioService } from '@/services/tourAudioService';
import { useTour } from '@/hooks/useTour';
import { TOUR_AUDIO_SCRIPTS } from '@/config/GrouphomeTourSteps';

export interface UseTourAudioReturn {
  isPlaying: boolean;
  isLoading: boolean;
  progress: number;
  error: string | null;
  playCurrentStep: () => Promise<void>;
  togglePlayPause: () => void;
  stop: () => void;
  preloadNextStep: () => Promise<void>;
}

/**
 * Hook for managing tour audio playback
 */
export function useTourAudio(): UseTourAudioReturn {
  const { currentStep, currentStepIndex, totalSteps, pauseAudio, resumeAudio } = useTour();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Track the current step to detect changes
  const lastStepRef = useRef<string | null>(null);

  /**
   * Get audio script for current step
   * Keys in TOUR_AUDIO_SCRIPTS must match step IDs exactly
   */
  const getCurrentAudioScript = useCallback((): string | null => {
    if (!currentStep) return null;

    const script = TOUR_AUDIO_SCRIPTS[currentStep.id];
    if (!script) {
      console.warn('[useTourAudio] No audio script found for step:', currentStep.id);
    }
    return script || null;
  }, [currentStep]);

  /**
   * Get audio script for next step (for preloading)
   */
  const getNextAudioScript = useCallback((): string | null => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex >= totalSteps) return null;

    // Get step IDs in order from the TOUR_AUDIO_SCRIPTS keys
    const stepIds = Object.keys(TOUR_AUDIO_SCRIPTS);
    const nextStepId = stepIds[nextIndex];

    return nextStepId ? TOUR_AUDIO_SCRIPTS[nextStepId] : null;
  }, [currentStepIndex, totalSteps]);

  /**
   * Handle progress updates
   */
  const handleProgress = useCallback((newProgress: number) => {
    setProgress(newProgress);
  }, []);

  /**
   * Handle state changes from audio service
   */
  const handleStateChange = useCallback(
    (playing: boolean) => {
      setIsPlaying(playing);
      if (playing) {
        resumeAudio();
      } else {
        pauseAudio();
      }
    },
    [pauseAudio, resumeAudio]
  );

  /**
   * Play audio for current step
   */
  const playCurrentStep = useCallback(async () => {
    const script = getCurrentAudioScript();
    if (!script) {
      console.log('[useTourAudio] No audio script for current step');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await tourAudioService.generateAndPlay(script, handleProgress, handleStateChange);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to play audio';
      setError(errorMessage);
      console.error('[useTourAudio] Error playing audio:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getCurrentAudioScript, handleProgress, handleStateChange]);

  /**
   * Toggle play/pause
   */
  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      tourAudioService.pause();
      setIsPlaying(false);
      pauseAudio();
    } else {
      if (tourAudioService.getCurrentProgress() > 0 && tourAudioService.getCurrentProgress() < 100) {
        // Resume existing audio
        tourAudioService.resume();
      } else {
        // Start new audio
        playCurrentStep();
      }
    }
  }, [isPlaying, pauseAudio, playCurrentStep]);

  /**
   * Stop audio completely
   */
  const stop = useCallback(() => {
    tourAudioService.stop();
    setIsPlaying(false);
    setProgress(0);
    pauseAudio();
  }, [pauseAudio]);

  /**
   * Preload next step's audio
   */
  const preloadNextStep = useCallback(async () => {
    const script = getNextAudioScript();
    if (script) {
      await tourAudioService.preloadAudio(script);
    }
  }, [getNextAudioScript]);

  /**
   * Stop audio when step changes
   */
  useEffect(() => {
    const currentStepId = currentStep?.id || null;

    if (lastStepRef.current !== null && lastStepRef.current !== currentStepId) {
      // Step changed, stop current audio
      stop();
    }

    lastStepRef.current = currentStepId;
  }, [currentStep?.id, stop]);

  /**
   * Auto-preload next step when current step starts playing
   */
  useEffect(() => {
    if (isPlaying && !isLoading) {
      // Small delay before preloading to prioritize current audio
      const timer = setTimeout(() => {
        preloadNextStep();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isPlaying, isLoading, preloadNextStep]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      tourAudioService.stop();
    };
  }, []);

  return {
    isPlaying,
    isLoading,
    progress,
    error,
    playCurrentStep,
    togglePlayPause,
    stop,
    preloadNextStep,
  };
}

export default useTourAudio;
