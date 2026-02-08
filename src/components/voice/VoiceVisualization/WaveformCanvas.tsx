// ============================================================================
// WAVEFORM CANVAS COMPONENT
// Renders flowing organic waveform at 60fps using Canvas 2D
// Grouphomes4newbies - Nette Voice Interface
// ============================================================================

import { useRef, useEffect, useCallback } from 'react';
import { useWaveformAnimation } from '@/hooks/useWaveformAnimation';
import { useDeviceCapability } from '@/hooks/useDeviceCapability';
import type { WaveformCanvasProps, WaveformConfig } from '@/types/voice-visualization';
import { cn } from '@/lib/utils';

const DEFAULT_CONFIG: WaveformConfig = {
  segments: 48,
  baseRadiusPercent: 0.85,
  minAmplitude: 2,
  maxAmplitude: 12,
  primaryFrequency: 3,
  phaseSpeed: 0.02,
  volumeLerpFactor: 0.15
};

export const WaveformCanvas = ({
  isActive,
  volume,
  config: configOverride,
  className
}: WaveformCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const volumeRef = useRef(volume);
  const { reducedMotion, recommendedSegments } = useDeviceCapability();

  // Keep volumeRef in sync with prop
  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  // Merge config with device-adaptive defaults
  const config: WaveformConfig = {
    ...DEFAULT_CONFIG,
    segments: recommendedSegments,
    ...configOverride
  };

  /**
   * Draw the waveform on the canvas
   */
  const drawWaveform = useCallback(
    (ctx: CanvasRenderingContext2D, phase: number, currentVolume: number) => {
      const canvas = ctx.canvas;
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const baseRadius = (Math.min(width, height) * config.baseRadiusPercent) / 2;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // For reduced motion or inactive state, draw simple circle
      if (reducedMotion && !isActive) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
        ctx.strokeStyle = 'hsl(187 85% 35% / 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
        return;
      }

      // Calculate dynamic amplitude based on volume
      const amplitude =
        config.minAmplitude +
        (config.maxAmplitude - config.minAmplitude) * currentVolume;

      // Generate waveform points
      const points: { x: number; y: number }[] = [];

      for (let i = 0; i <= config.segments; i++) {
        const angle = (i / config.segments) * Math.PI * 2;

        // Multi-frequency wave composition for organic feel
        const wave1 =
          Math.sin(angle * config.primaryFrequency + phase) * amplitude;
        const wave2 =
          Math.sin(angle * (config.primaryFrequency + 2) - phase * 0.7) *
          (amplitude * 0.3);
        const wave3 =
          Math.sin(angle * (config.primaryFrequency - 1) + phase * 1.3) *
          (amplitude * 0.2);

        const r = baseRadius + wave1 + wave2 + wave3;

        points.push({
          x: centerX + Math.cos(angle) * r,
          y: centerY + Math.sin(angle) * r
        });
      }

      // Draw smooth curve through points
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);

      for (let i = 0; i < points.length - 1; i++) {
        const current = points[i];
        const next = points[i + 1];
        // Quadratic bezier for smooth curves
        ctx.quadraticCurveTo(
          current.x,
          current.y,
          (current.x + next.x) / 2,
          (current.y + next.y) / 2
        );
      }
      ctx.closePath();

      // Create gradient stroke - primary teal
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      const opacity = 0.4 + currentVolume * 0.4;
      gradient.addColorStop(0, `hsl(187 85% 35% / ${opacity})`);
      gradient.addColorStop(0.5, `hsl(187 65% 45% / ${opacity})`);
      gradient.addColorStop(1, `hsl(187 85% 35% / ${opacity})`);

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2 + currentVolume * 2;
      ctx.stroke();

      // Subtle fill for depth
      ctx.fillStyle = `hsl(187 85% 35% / ${0.05 + currentVolume * 0.1})`;
      ctx.fill();
    },
    [config, reducedMotion, isActive]
  );

  // Use waveform animation hook
  useWaveformAnimation(canvasRef, {
    isActive: isActive && !reducedMotion,
    volumeRef,
    config,
    onFrame: drawWaveform
  });

  // Handle canvas resize with device pixel ratio
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        const ctx = canvas.getContext('2d');
        ctx?.scale(dpr, dpr);
      }
    });

    resizeObserver.observe(canvas);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={cn('absolute inset-0 w-full h-full pointer-events-none', className)}
      aria-hidden="true"
    />
  );
};
