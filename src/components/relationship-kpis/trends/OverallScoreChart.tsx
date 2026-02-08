/**
 * RKPI Trends: OverallScoreChart
 * Recharts LineChart showing overall score trend over time.
 * Rose-500 primary line with dot markers, dark tooltip.
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import type { CheckInWithScores } from '@/types/relationship-kpis';
import { calculateOverallScore } from '@/utils/relationshipKpis';

interface OverallScoreChartProps {
  checkIns: CheckInWithScores[];
}

export function OverallScoreChart({ checkIns }: OverallScoreChartProps) {
  const data = checkIns
    .filter((ci) => ci.status === 'completed')
    .map((ci) => {
      const overall =
        ci.overall_score ??
        calculateOverallScore(
          Object.fromEntries((ci.scores ?? []).map((s) => [s.kpi_name, s.score]))
        );
      return {
        week: ci.check_in_week,
        score: overall ?? 0,
      };
    })
    .reverse(); // chronological

  if (data.length < 2) {
    return (
      <div className="text-center py-10 text-white/30 text-sm">
        Need at least 2 check-ins to show trends.
      </div>
    );
  }

  return (
    <div className="w-full h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="week"
            tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 10]}
            tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1a2e',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              fontSize: 12,
              color: 'white',
            }}
            formatter={(value: number) => [value.toFixed(1), 'Overall']}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#f43f5e"
            strokeWidth={2}
            dot={{ r: 4, fill: '#f43f5e', stroke: '#f43f5e' }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
