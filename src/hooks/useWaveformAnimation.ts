// ============================================================================
// WAVEFORM ANIMATION HOOK
// Manages 60fps canvas animation loop for voice visualization
// Uses requestAnimationFrame with delta time for smooth performance
// ============================================================================

import { useRef, useEffect, useCallback } from 'react';
import type { WaveformConfig } from '@/types/voice-visualization';

interface UseWaveformAnimationOptions {
  isActive: boolean;
  volumeRef: React.MutableRefObject<number>;
  config: WaveformConfig;
  onFrame: (ctx: CanvasRenderingContext2D, phase: number, volume: number) => void;
}

export const useWaveformAnimation = (
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  options: UseWaveformAnimationOptions
) => {
  const { isActive, volumeRef, config, onFrame } = options;
  const phaseRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);

  const animate = useCallback((timestamp: number) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Calculate delta time for frame-rate independent animation
    const deltaTime = timestamp - lastTimeRef.current;
    lastTimeRef.current = timestamp;

    // Advance phase based on time (normalized to ~60fps)
    phaseRef.current += config.phaseSpeed * (deltaTime / 16.67);

    // Call the render function
    onFrame(ctx, phaseRef.current, volumeRef.current);

    // Continue animation loop if active
    if (isActive) {
      rafIdRef.current = requestAnimationFrame(animate);
    }
  }, [canvasRef, isActive, volumeRef, config.phaseSpeed, onFrame]);

  useEffect(() => {
    if (isActive) {
      lastTimeRef.current = performance.now();
      rafIdRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [isActive, animate]);

  const reset = useCallback(() => {
    phaseRef.current = 0;
  }, []);

  return { reset };
};
