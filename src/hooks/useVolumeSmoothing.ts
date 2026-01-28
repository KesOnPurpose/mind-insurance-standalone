// ============================================================================
// VOLUME SMOOTHING HOOK
// Provides smooth volume transitions for voice visualization
// Prevents jarring visual changes from raw audio levels
// ============================================================================

import { useRef, useCallback } from 'react';
import type { VolumeLevel } from '@/types/voice-visualization';

interface UseVolumeSmoothingOptions {
  lerpFactor?: number;      // 0-1, lower = smoother (default 0.15)
  quantizeLevels?: number;  // Number of discrete levels (default 10)
}

export const useVolumeSmoothing = (options: UseVolumeSmoothingOptions = {}) => {
  const { lerpFactor = 0.15, quantizeLevels = 10 } = options;
  const smoothedValueRef = useRef(0);
  const lastQuantizedRef = useRef<VolumeLevel>(0);

  /**
   * Smooth incoming raw volume using linear interpolation
   * @param rawVolume - Raw volume value 0-1
   * @returns Smoothed volume value 0-1
   */
  const smoothVolume = useCallback((rawVolume: number): number => {
    const clamped = Math.max(0, Math.min(1, rawVolume));
    smoothedValueRef.current += lerpFactor * (clamped - smoothedValueRef.current);
    return smoothedValueRef.current;
  }, [lerpFactor]);

  /**
   * Get quantized volume level for CSS performance
   * Only updates when crossing thresholds to prevent excessive re-renders
   * @returns Quantized volume level 0-10
   */
  const getQuantizedLevel = useCallback((): VolumeLevel => {
    const level = Math.round(smoothedValueRef.current * quantizeLevels) as VolumeLevel;
    if (level !== lastQuantizedRef.current) {
      lastQuantizedRef.current = level;
    }
    return lastQuantizedRef.current;
  }, [quantizeLevels]);

  /**
   * Reset smoothing state (call when call ends or errors)
   */
  const reset = useCallback(() => {
    smoothedValueRef.current = 0;
    lastQuantizedRef.current = 0;
  }, []);

  return { smoothVolume, getQuantizedLevel, reset };
};
