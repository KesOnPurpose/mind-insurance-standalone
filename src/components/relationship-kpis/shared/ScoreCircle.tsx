/**
 * RKPI Shared: ScoreCircle
 * Circular score indicator with SVG ring and centered value.
 * Supports multiple sizes and color adapts to score level.
 */

import { getScoreStyle, formatScore } from '@/utils/relationshipKpis';

type CircleSize = 'sm' | 'md' | 'lg';

interface ScoreCircleProps {
  score: number | null;
  size?: CircleSize;
  label?: string;
}

const SIZE_CONFIG: Record<
  CircleSize,
  { container: string; svgSize: number; radius: number; stroke: number; fontSize: string; labelSize: string }
> = {
  sm: { container: 'w-10 h-10', svgSize: 40, radius: 16, stroke: 3, fontSize: 'text-sm', labelSize: 'text-[8px]' },
  md: { container: 'w-16 h-16', svgSize: 64, radius: 26, stroke: 4, fontSize: 'text-xl', labelSize: 'text-[10px]' },
  lg: { container: 'w-24 h-24', svgSize: 96, radius: 40, stroke: 5, fontSize: 'text-3xl', labelSize: 'text-xs' },
};

export function ScoreCircle({ score, size = 'md', label }: ScoreCircleProps) {
  const config = SIZE_CONFIG[size];
  const style = score !== null ? getScoreStyle(score) : null;

  const circumference = 2 * Math.PI * config.radius;
  const progress = score !== null ? (score / 10) * circumference : 0;
  const dashOffset = circumference - progress;

  // Map text-* classes to SVG stroke colors
  const strokeColor =
    style?.text === 'text-red-400'
      ? '#f87171'
      : style?.text === 'text-orange-400'
      ? '#fb923c'
      : style?.text === 'text-yellow-400'
      ? '#facc15'
      : style?.text === 'text-emerald-400'
      ? '#34d399'
      : '#6b7280';

  return (
    <div className={`relative ${config.container} flex-shrink-0`}>
      <svg
        width={config.svgSize}
        height={config.svgSize}
        className="transform -rotate-90"
      >
        {/* Track */}
        <circle
          cx={config.svgSize / 2}
          cy={config.svgSize / 2}
          r={config.radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={config.stroke}
        />
        {/* Progress */}
        {score !== null && (
          <circle
            cx={config.svgSize / 2}
            cy={config.svgSize / 2}
            r={config.radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={config.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-all duration-500"
          />
        )}
      </svg>

      {/* Centered text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-bold ${config.fontSize} ${style?.text ?? 'text-white/30'}`}>
          {formatScore(score)}
        </span>
        {label && (
          <span className={`${config.labelSize} text-white/30 leading-tight`}>
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
