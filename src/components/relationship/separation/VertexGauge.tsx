/**
 * Phase 1A: VertexGauge Component
 * SVG semicircle gauge showing 0-180 degrees of separation.
 * Color zones: green (connected), yellow (drifting), orange (distancing),
 * red (disconnected), dark red (crisis).
 */

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  SEPARATION_STAGES,
  getSeparationStage,
  getStageDefinition,
  type SeparationStage,
} from '@/types/relationship-separation';

interface VertexGaugeProps {
  angle: number | null;
  size?: number;
  showLabel?: boolean;
  className?: string;
}

const STAGE_COLORS: Record<string, string> = {
  emerald: '#34d399',
  green: '#4ade80',
  amber: '#fbbf24',
  orange: '#fb923c',
  red: '#f87171',
};

const STAGE_TEXT_COLORS: Record<SeparationStage, string> = {
  connected: 'text-emerald-400',
  drifting: 'text-green-400',
  distancing: 'text-amber-400',
  disconnected: 'text-orange-400',
  crisis: 'text-red-400',
};

const STAGE_BG_COLORS: Record<SeparationStage, string> = {
  connected: 'bg-emerald-500/10',
  drifting: 'bg-green-500/10',
  distancing: 'bg-amber-500/10',
  disconnected: 'bg-orange-500/10',
  crisis: 'bg-red-500/10',
};

export function VertexGauge({
  angle,
  size = 220,
  showLabel = true,
  className = '',
}: VertexGaugeProps) {
  const displayAngle = angle ?? 0;
  const stage = getSeparationStage(displayAngle);
  const stageDef = getStageDefinition(stage);

  const gaugeData = useMemo(() => {
    const cx = size / 2;
    const cy = size / 2 + 10;
    const radius = size / 2 - 20;
    const strokeWidth = 16;

    // Build arc segments for each zone
    const segments = SEPARATION_STAGES.map((s) => {
      const startAngle = Math.PI - (s.angleMin / 180) * Math.PI;
      const endAngle = Math.PI - ((s.angleMax + 1) / 180) * Math.PI;
      const x1 = cx + radius * Math.cos(startAngle);
      const y1 = cy - radius * Math.sin(startAngle);
      const x2 = cx + radius * Math.cos(endAngle);
      const y2 = cy - radius * Math.sin(endAngle);
      const largeArc = s.angleMax - s.angleMin > 90 ? 1 : 0;

      return {
        path: `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 0 ${x2} ${y2}`,
        color: STAGE_COLORS[s.color] ?? '#666',
        stage: s.stage,
      };
    });

    // Needle position
    const needleAngle = Math.PI - (displayAngle / 180) * Math.PI;
    const needleLength = radius - 8;
    const nx = cx + needleLength * Math.cos(needleAngle);
    const ny = cy - needleLength * Math.sin(needleAngle);

    return { cx, cy, radius, strokeWidth, segments, nx, ny };
  }, [size, displayAngle]);

  if (angle === null) {
    return (
      <Card className={`border-rose-500/20 bg-mi-navy-light shadow-lg ${className}`}>
        <CardContent className="py-8 text-center">
          <div className="text-white/40 text-sm">No separation assessment yet</div>
          <div className="text-white/20 text-xs mt-1">
            Complete a check-in to see your Vertex score
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-rose-500/20 bg-mi-navy-light shadow-lg ${className}`}>
      <CardContent className="pt-5 pb-4 px-4">
        <div className="flex flex-col items-center">
          {/* SVG Gauge */}
          <svg
            width={size}
            height={size / 2 + 30}
            viewBox={`0 0 ${size} ${size / 2 + 40}`}
            className="overflow-visible"
          >
            {/* Background arc segments */}
            {gaugeData.segments.map((seg) => (
              <path
                key={seg.stage}
                d={seg.path}
                fill="none"
                stroke={seg.color}
                strokeWidth={gaugeData.strokeWidth}
                strokeLinecap="round"
                opacity={seg.stage === stage ? 1 : 0.25}
                className="transition-opacity duration-500"
              />
            ))}

            {/* Needle */}
            <line
              x1={gaugeData.cx}
              y1={gaugeData.cy}
              x2={gaugeData.nx}
              y2={gaugeData.ny}
              stroke="white"
              strokeWidth={3}
              strokeLinecap="round"
              className="drop-shadow-lg"
            />

            {/* Center dot */}
            <circle
              cx={gaugeData.cx}
              cy={gaugeData.cy}
              r={6}
              fill="white"
              className="drop-shadow-md"
            />

            {/* Angle text */}
            <text
              x={gaugeData.cx}
              y={gaugeData.cy + 30}
              textAnchor="middle"
              className="fill-white font-bold"
              fontSize={28}
            >
              {Math.round(displayAngle)}°
            </text>
          </svg>

          {/* Labels */}
          {showLabel && (
            <div className="text-center -mt-1">
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${STAGE_BG_COLORS[stage]} ${STAGE_TEXT_COLORS[stage]}`}
              >
                {stageDef.label}
              </span>
              <p className="text-white/40 text-xs mt-2 max-w-[240px]">
                {stageDef.description}
              </p>
            </div>
          )}

          {/* Min/Max labels */}
          <div className="flex justify-between w-full px-2 mt-2">
            <span className="text-[10px] text-emerald-400/60">0° Close</span>
            <span className="text-[10px] text-red-400/60">180° Apart</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
