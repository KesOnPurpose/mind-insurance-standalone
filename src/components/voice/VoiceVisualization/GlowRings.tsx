// ============================================================================
// GLOW RINGS COMPONENT
// Renders volume-responsive glow rings with state-based colors
// Grouphomes4newbies - Nette Voice Interface
// ============================================================================

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { GlowRingsProps, VoiceCallState } from '@/types/voice-visualization';

/**
 * Color mappings for each voice call state
 * Uses CSS variables for consistency with design system
 */
const STATE_COLORS: Record<VoiceCallState, string> = {
  idle: 'hsl(var(--primary) / VAR_OPACITY)',
  connecting: 'hsl(var(--primary) / VAR_OPACITY)',
  connected: 'hsl(var(--primary) / VAR_OPACITY)',
  listening: 'hsl(var(--primary) / VAR_OPACITY)',
  speaking: 'hsl(var(--secondary) / VAR_OPACITY)',  // Amber when Nette speaks
  ended: 'hsl(var(--success) / VAR_OPACITY)',       // Green for success
  error: 'hsl(var(--destructive) / VAR_OPACITY)'    // Red for errors
};

export const GlowRings = ({
  isActive,
  state,
  volumeLevel,
  className
}: GlowRingsProps) => {
  /**
   * Calculate ring styles based on state and volume
   * Memoized for performance
   */
  const ringStyles = useMemo(() => {
    // Higher base opacity for better visibility against white backgrounds
    const baseOpacity = isActive ? 0.15 : 0.25;
    const volumeBoost = (volumeLevel / 10) * 0.3;

    const getColor = (opacity: number) =>
      STATE_COLORS[state].replace('VAR_OPACITY', opacity.toFixed(2));

    return {
      outer: {
        boxShadow: `0 0 ${40 + volumeLevel * 4}px ${getColor(baseOpacity + volumeBoost)}`,
        opacity: isActive ? 1 : 0.7
      },
      middle: {
        boxShadow: `0 0 ${25 + volumeLevel * 3}px ${getColor(baseOpacity + volumeBoost + 0.1)}`,
        opacity: isActive ? 1 : 0.5
      },
      inner: {
        boxShadow: `0 0 ${15 + volumeLevel * 2}px ${getColor(baseOpacity + volumeBoost + 0.2)}`,
        opacity: isActive ? 1 : 0.4
      }
    };
  }, [state, volumeLevel, isActive]);

  // Animation classes
  const breathingClass = !isActive ? 'animate-voice-breathing' : '';
  const pulseClass = state === 'speaking' ? 'animate-voice-speaking-pulse' : '';

  return (
    <div className={cn('absolute inset-0 pointer-events-none', className)}>
      {/* Outer glow ring - largest, most diffuse */}
      <div
        className={cn(
          'absolute inset-[-20px] rounded-full transition-all duration-100 ease-out',
          breathingClass
        )}
        style={ringStyles.outer}
        aria-hidden="true"
      />

      {/* Middle glow ring */}
      <div
        className={cn(
          'absolute inset-[-10px] rounded-full transition-all duration-100 ease-out',
          breathingClass,
          pulseClass
        )}
        style={ringStyles.middle}
        aria-hidden="true"
      />

      {/* Inner glow ring - closest to button */}
      <div
        className={cn(
          'absolute inset-0 rounded-full transition-all duration-100 ease-out',
          pulseClass
        )}
        style={ringStyles.inner}
        aria-hidden="true"
      />
    </div>
  );
};
