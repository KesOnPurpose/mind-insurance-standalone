/**
 * RKPI Trends: KPIBreakdownChart
 * Recharts LineChart with 10 KPI lines (toggleable).
 * Each KPI uses its category color.
 */

import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { KPI_DEFINITIONS } from '@/types/relationship-kpis';
import type { CheckInWithScores, RelationshipKPIName } from '@/types/relationship-kpis';

interface KPIBreakdownChartProps {
  checkIns: CheckInWithScores[];
}

const CATEGORY_COLORS: Record<string, string> = {
  emotional: '#a78bfa',    // purple-400
  physical: '#60a5fa',     // blue-400
  practical: '#fbbf24',    // amber-400
  intellectual: '#34d399', // emerald-400
};

const KPI_COLORS: Record<RelationshipKPIName, string> = {
  affection: '#a78bfa',
  sexual_fulfillment: '#818cf8',
  intimate_conversation: '#c084fc',
  recreational_companionship: '#60a5fa',
  honesty_openness: '#38bdf8',
  physical_attractiveness: '#22d3ee',
  financial_support: '#fbbf24',
  domestic_support: '#f59e0b',
  family_commitment: '#34d399',
  admiration: '#10b981',
};

export function KPIBreakdownChart({ checkIns }: KPIBreakdownChartProps) {
  const [visibleKpis, setVisibleKpis] = useState<Set<RelationshipKPIName>>(
    new Set(KPI_DEFINITIONS.map((k) => k.name))
  );

  const data = checkIns
    .filter((ci) => ci.status === 'completed')
    .map((ci) => {
      const point: Record<string, string | number> = { week: ci.check_in_week };
      (ci.scores ?? []).forEach((s) => {
        point[s.kpi_name] = s.score;
      });
      return point;
    })
    .reverse(); // chronological

  if (data.length < 2) {
    return (
      <div className="text-center py-10 text-white/30 text-sm">
        Need at least 2 check-ins to show KPI breakdown.
      </div>
    );
  }

  const toggleKpi = (name: RelationshipKPIName) => {
    setVisibleKpis((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        if (next.size > 1) next.delete(name); // keep at least 1
      } else {
        next.add(name);
      }
      return next;
    });
  };

  return (
    <div className="space-y-3">
      {/* Toggle buttons */}
      <div className="flex flex-wrap gap-1">
        {KPI_DEFINITIONS.map((kpi) => {
          const active = visibleKpis.has(kpi.name);
          return (
            <button
              key={kpi.name}
              className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                active
                  ? 'border-white/20 text-white/70'
                  : 'border-white/5 text-white/20'
              }`}
              style={active ? { backgroundColor: KPI_COLORS[kpi.name] + '20' } : undefined}
              onClick={() => toggleKpi(kpi.name)}
            >
              {kpi.label.split(' ')[0]}
            </button>
          );
        })}
      </div>

      {/* Chart */}
      <div className="w-full h-[260px]">
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
                fontSize: 11,
                color: 'white',
              }}
            />
            {KPI_DEFINITIONS.filter((k) => visibleKpis.has(k.name)).map((kpi) => (
              <Line
                key={kpi.name}
                type="monotone"
                dataKey={kpi.name}
                stroke={KPI_COLORS[kpi.name]}
                strokeWidth={1.5}
                dot={false}
                name={kpi.label}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
