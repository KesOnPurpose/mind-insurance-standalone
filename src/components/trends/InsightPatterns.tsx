/**
 * RKPI Trends: InsightPatterns
 * Displays pattern observations from check-in data:
 * - Strongest & weakest KPIs
 * - Biggest movers (improving / declining)
 * - Category averages
 */

import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Star, AlertTriangle } from 'lucide-react';
import { KPI_DEFINITIONS } from '@/types/relationship-kpis';
import type { CheckInWithScores, RelationshipKPIName } from '@/types/relationship-kpis';
import { getScoreStyle, getKPILabel } from '@/utils/relationshipKpis';

interface InsightPatternsProps {
  checkIns: CheckInWithScores[];
}

interface KPISummary {
  name: RelationshipKPIName;
  avgScore: number;
  trend: number; // positive = improving
}

export function InsightPatterns({ checkIns }: InsightPatternsProps) {
  const analysis = useMemo(() => {
    const completed = checkIns.filter((ci) => ci.status === 'completed');
    if (completed.length < 1) return null;

    // Calculate average and trend per KPI
    const kpiData: Record<string, { scores: number[] }> = {};
    KPI_DEFINITIONS.forEach((k) => {
      kpiData[k.name] = { scores: [] };
    });

    // Chronological order (oldest first)
    const chronological = [...completed].reverse();
    chronological.forEach((ci) => {
      (ci.scores ?? []).forEach((s) => {
        if (kpiData[s.kpi_name]) {
          kpiData[s.kpi_name].scores.push(s.score);
        }
      });
    });

    const summaries: KPISummary[] = KPI_DEFINITIONS.map((kpi) => {
      const scores = kpiData[kpi.name].scores;
      const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

      // Trend: compare last score vs first score
      let trend = 0;
      if (scores.length >= 2) {
        trend = scores[scores.length - 1] - scores[0];
      }

      return { name: kpi.name, avgScore: avg, trend };
    }).filter((s) => s.avgScore > 0);

    if (summaries.length === 0) return null;

    const sorted = [...summaries].sort((a, b) => b.avgScore - a.avgScore);
    const strongest = sorted.slice(0, 2);
    const weakest = sorted.slice(-2).reverse();

    const trendSorted = [...summaries].sort((a, b) => b.trend - a.trend);
    const improving = trendSorted.filter((s) => s.trend > 0).slice(0, 2);
    const declining = trendSorted.filter((s) => s.trend < 0).slice(0, 2);

    return { strongest, weakest, improving, declining, totalCheckIns: completed.length };
  }, [checkIns]);

  if (!analysis) {
    return (
      <div className="text-center py-8 text-white/30 text-sm">
        Complete at least one check-in to see patterns.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* Strongest */}
      <PatternCard
        icon={<Star className="h-4 w-4 text-amber-400" />}
        title="Strongest Areas"
        items={analysis.strongest.map((s) => ({
          label: getKPILabel(s.name),
          value: s.avgScore,
        }))}
      />

      {/* Weakest */}
      <PatternCard
        icon={<AlertTriangle className="h-4 w-4 text-orange-400" />}
        title="Growth Opportunities"
        items={analysis.weakest.map((s) => ({
          label: getKPILabel(s.name),
          value: s.avgScore,
        }))}
      />

      {/* Improving */}
      {analysis.improving.length > 0 && (
        <PatternCard
          icon={<TrendingUp className="h-4 w-4 text-emerald-400" />}
          title="Improving"
          items={analysis.improving.map((s) => ({
            label: getKPILabel(s.name),
            value: s.avgScore,
            badge: `+${s.trend.toFixed(1)}`,
            badgeColor: 'text-emerald-400',
          }))}
        />
      )}

      {/* Declining */}
      {analysis.declining.length > 0 && (
        <PatternCard
          icon={<TrendingDown className="h-4 w-4 text-red-400" />}
          title="Needs Attention"
          items={analysis.declining.map((s) => ({
            label: getKPILabel(s.name),
            value: s.avgScore,
            badge: s.trend.toFixed(1),
            badgeColor: 'text-red-400',
          }))}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Subcomponent: PatternCard
// ---------------------------------------------------------------------------

interface PatternCardProps {
  icon: React.ReactNode;
  title: string;
  items: Array<{
    label: string;
    value: number;
    badge?: string;
    badgeColor?: string;
  }>;
}

function PatternCard({ icon, title, items }: PatternCardProps) {
  return (
    <div className="rounded-lg bg-white/5 border border-white/10 p-3">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-medium text-white/60">{title}</span>
      </div>
      <div className="space-y-1.5">
        {items.map((item) => {
          const style = getScoreStyle(item.value);
          return (
            <div key={item.label} className="flex items-center justify-between text-xs">
              <span className="text-white/50">{item.label}</span>
              <div className="flex items-center gap-1.5">
                <span className={`font-semibold ${style.text}`}>
                  {item.value.toFixed(1)}
                </span>
                {item.badge && (
                  <span className={`text-[10px] ${item.badgeColor ?? 'text-white/30'}`}>
                    {item.badge}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
