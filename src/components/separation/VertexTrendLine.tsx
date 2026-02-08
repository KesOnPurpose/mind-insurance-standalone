/**
 * Phase 1A: VertexTrendLine Component
 * Recharts line chart showing separation angle over time.
 * Shows how the vertex angle has changed across assessments.
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from 'recharts';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import type { RelationshipSeparationAssessment } from '@/types/relationship-separation';

interface VertexTrendLineProps {
  assessments: RelationshipSeparationAssessment[];
  className?: string;
}

interface ChartDataPoint {
  date: string;
  angle: number;
  stage: string;
}

const ZONE_THRESHOLDS = [
  { value: 36, label: 'Connected', color: '#34d399' },
  { value: 72, label: 'Drifting', color: '#4ade80' },
  { value: 108, label: 'Distancing', color: '#fbbf24' },
  { value: 144, label: 'Disconnected', color: '#fb923c' },
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getAngleColor(angle: number): string {
  if (angle <= 36) return '#34d399';
  if (angle <= 72) return '#4ade80';
  if (angle <= 108) return '#fbbf24';
  if (angle <= 144) return '#fb923c';
  return '#f87171';
}

export function VertexTrendLine({
  assessments,
  className = '',
}: VertexTrendLineProps) {
  const chartData = useMemo<ChartDataPoint[]>(() => {
    return [...assessments]
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      .map((a) => ({
        date: formatDate(a.created_at),
        angle: a.separation_angle,
        stage: a.separation_stage,
      }));
  }, [assessments]);

  const trend = useMemo(() => {
    if (chartData.length < 2) return 'stable';
    const first = chartData[0].angle;
    const last = chartData[chartData.length - 1].angle;
    const diff = last - first;
    if (diff < -5) return 'improving';
    if (diff > 5) return 'worsening';
    return 'stable';
  }, [chartData]);

  if (assessments.length < 2) {
    return null;
  }

  const TrendIcon =
    trend === 'improving'
      ? TrendingDown
      : trend === 'worsening'
      ? TrendingUp
      : Minus;

  const trendColor =
    trend === 'improving'
      ? 'text-emerald-400'
      : trend === 'worsening'
      ? 'text-red-400'
      : 'text-white/40';

  const trendLabel =
    trend === 'improving'
      ? 'Getting closer'
      : trend === 'worsening'
      ? 'Growing apart'
      : 'Stable';

  return (
    <Card className={`border-rose-500/20 bg-mi-navy-light shadow-lg ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-white/80">
            Separation Trend
          </CardTitle>
          <div className={`flex items-center gap-1 ${trendColor}`}>
            <TrendIcon className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">{trendLabel}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[180px] -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <defs>
                <linearGradient id="vertexFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
              />
              <XAxis
                dataKey="date"
                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 180]}
                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
                tickLine={false}
                ticks={[0, 36, 72, 108, 144, 180]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15,20,40,0.95)',
                  border: '1px solid rgba(244,63,94,0.2)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: 'white',
                }}
                formatter={(value: number) => [
                  `${Math.round(value)}°`,
                  'Separation',
                ]}
              />
              {ZONE_THRESHOLDS.map((z) => (
                <ReferenceLine
                  key={z.value}
                  y={z.value}
                  stroke={z.color}
                  strokeDasharray="4 4"
                  strokeOpacity={0.2}
                />
              ))}
              <Area
                type="monotone"
                dataKey="angle"
                fill="url(#vertexFill)"
                stroke="none"
              />
              <Line
                type="monotone"
                dataKey="angle"
                stroke="#f43f5e"
                strokeWidth={2}
                dot={{ fill: '#f43f5e', r: 3, strokeWidth: 0 }}
                activeDot={{
                  fill: '#f43f5e',
                  r: 5,
                  stroke: 'white',
                  strokeWidth: 2,
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
