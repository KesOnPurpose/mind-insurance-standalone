// ============================================================================
// VOICE VISUALIZATION CONTAINER
// Main component that orchestrates waveform, glow rings, and animations
// Grouphomes4newbies - Nette Voice Interface
// "Gateway to Expert Guidance"
// ============================================================================

import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WaveformCanvas } from './WaveformCanvas';
import { GlowRings } from './GlowRings';
import { useVolumeSmoothing } from '@/hooks/useVolumeSmoothing';
import { useDeviceCapability } from '@/hooks/useDeviceCapability';
import type { VoiceVisualizationProps, VolumeLevel } from '@/types/voice-visualization';
import { cn } from '@/lib/utils';

export const VoiceVisualization = ({
  isActive,
  state,
  volume,
  children,
  className
}: VoiceVisualizationProps) => {
  const { smoothVolume, getQuantizedLevel, reset } = useVolumeSmoothing();
  const { reducedMotion } = useDeviceCapability();
  const volumeLevelRef = useRef<VolumeLevel>(0);

  // Update smoothed volume and quantized level
  useEffect(() => {
    if (isActive) {
      smoothVolume(volume);
      volumeLevelRef.current = getQuantizedLevel();
    } else {
      reset();
      volumeLevelRef.current = 0;
    }
  }, [volume, isActive, smoothVolume, getQuantizedLevel, reset]);

  // Reset on call end or error
  useEffect(() => {
    if (state === 'ended' || state === 'error') {
      reset();
    }
  }, [state, reset]);

  return (
    <motion.div
      className={cn('relative flex items-center justify-center', className)}
      initial={{ scale: 1 }}
      animate={{ scale: isActive ? 1.02 : 1 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {/* Glow Rings Layer - always visible */}
      <GlowRings
        isActive={isActive}
        state={state}
        volumeLevel={volumeLevelRef.current}
      />

      {/* Waveform Canvas Layer - only when active and motion allowed */}
      <AnimatePresence>
        {(isActive || state === 'connecting') && !reducedMotion && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-[-30px]"
          >
            <WaveformCanvas isActive={isActive} volume={volume} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Button Content - centered with highest z-index */}
      <div className="relative z-10">{children}</div>

      {/* Success Ripple Effect - plays on call end */}
      <AnimatePresence>
        {state === 'ended' && (
          <motion.div
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: 2.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute inset-0 rounded-full bg-[hsl(var(--success)/0.3)]"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Re-export sub-components for granular usage
export { WaveformCanvas } from './WaveformCanvas';
export { GlowRings } from './GlowRings';
