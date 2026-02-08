/**
 * RKPI Dashboard: TrendChart
 * Recharts LineChart showing overall score for last 4 weeks.
 * Rose-500 stroke, 200px height, dark themed.
 */

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CheckInWithScores } from '@/types/relationship-kpis';

interface TrendChartProps {
  recentCheckIns: CheckInWithScores[];
}

interface ChartDataPoint {
  week: string;
  weekLabel: string;
  score: number;
}

function formatWeekLabel(week: string): string {
  // Convert "2026-W05" to "W5"
  const parts = week.split('-W');
  if (parts.length === 2) {
    return `W${parseInt(parts[1], 10)}`;
  }
  return week;
}

export function TrendChart({ recentCheckIns }: TrendChartProps) {
  const data: ChartDataPoint[] = recentCheckIns
    .filter((ci) => ci.status === 'completed' && ci.overall_score !== null)
    .slice(0, 4)
    .reverse()
    .map((ci) => ({
      week: ci.check_in_week,
      weekLabel: formatWeekLabel(ci.check_in_week),
      score: ci.overall_score!,
    }));

  if (data.length < 2) {
    return (
      <Card className="border-rose-500/20 bg-mi-navy-light shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium text-white">Score Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center">
            <p className="text-sm text-white/40">
              {data.length === 0
                ? 'Complete check-ins to see your trend'
                : 'Need at least 2 check-ins for trend'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-rose-500/20 bg-mi-navy-light shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium text-white">Score Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <XAxis
              dataKey="weekLabel"
              stroke="rgba(255,255,255,0.3)"
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 10]}
              stroke="rgba(255,255,255,0.3)"
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              ticks={[0, 2, 4, 6, 8, 10]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1a2e',
                border: '1px solid rgba(244,63,94,0.3)',
                borderRadius: '8px',
                color: '#fff',
              }}
              formatter={(value: number) => [value.toFixed(1), 'Score']}
              labelFormatter={(label: string) => `Week ${label}`}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#f43f5e"
              strokeWidth={2}
              dot={{ fill: '#f43f5e', strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, fill: '#f43f5e', stroke: '#fff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
