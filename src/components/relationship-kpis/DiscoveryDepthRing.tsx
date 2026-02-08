/**
 * DiscoveryDepthRing — 36px circular SVG progress ring showing conversation depth.
 * Fills based on exchange count, glows when insights are ready.
 */

import { useMemo } from 'react';

interface DiscoveryDepthRingProps {
  exchangeCount: number;
  insightsReady: boolean;
}

/** Stage labels exported for use in DiscoveryChat header subtitle. */
export function getDepthStageLabel(exchangeCount: number, insightsReady: boolean): string {
  if (insightsReady) return 'Ready!';
  if (exchangeCount >= 6) return 'Insights building...';
  if (exchangeCount >= 4) return 'Patterns emerging...';
  if (exchangeCount >= 2) return 'Going deeper...';
  return 'Discovering...';
}

const SIZE = 36;
const STROKE = 3;
const RADIUS = (SIZE - STROKE) / 2; // 16.5
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function DiscoveryDepthRing({ exchangeCount, insightsReady }: DiscoveryDepthRingProps) {
  const progress = useMemo(() => {
    if (insightsReady) return 1;
    // ~12% per exchange, cap at 85%
    return Math.min(exchangeCount * 0.12, 0.85);
  }, [exchangeCount, insightsReady]);

  const dashOffset = CIRCUMFERENCE - progress * CIRCUMFERENCE;

  // Visual stage
  const stage = useMemo(() => {
    if (insightsReady) return 'ready' as const;
    if (exchangeCount >= 4) return 'deep' as const;
    if (exchangeCount >= 2) return 'mid' as const;
    return 'start' as const;
  }, [exchangeCount, insightsReady]);

  const strokeColor =
    stage === 'ready' ? '#05c3dd'    // mi-cyan
    : stage === 'deep' ? '#fb7185'   // rose-400
    : stage === 'mid' ? 'rgba(251,113,133,0.6)' // rose-400/60
    : 'rgba(255,255,255,0.2)';       // white/20

  const glowFilter =
    stage === 'ready' ? 'drop-shadow(0 0 4px rgba(5,195,221,0.6))'
    : stage === 'deep' ? 'drop-shadow(0 0 4px rgba(251,113,133,0.5))'
    : 'none';

  return (
    <div
      className={`relative flex-shrink-0 ${stage === 'ready' ? 'animate-pulse' : ''}`}
      style={{ width: SIZE, height: SIZE }}
    >
      <svg
        width={SIZE}
        height={SIZE}
        className="transform -rotate-90"
        style={{ filter: glowFilter }}
      >
        {/* Track */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={STROKE}
        />
        {/* Progress */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={strokeColor}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 700ms ease, stroke 500ms ease' }}
        />
      </svg>
    </div>
  );
}
