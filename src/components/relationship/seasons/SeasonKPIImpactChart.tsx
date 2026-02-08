/**
 * Phase 2A: SeasonKPIImpactChart
 * Horizontal bar chart showing predicted KPI impacts for a season.
 * Impacts range from -3 (strong negative) to +3 (strong positive).
 */

import type { PredictedKPIImpacts, KPIImpactScore } from '@/types/relationship-seasons';

/** Human-readable labels for the 10 KPIs */
const KPI_LABELS: Record<string, string> = {
  affection: 'Affection',
  sexual_fulfillment: 'Sexual Fulfillment',
  intimate_conversation: 'Intimate Conversation',
  recreational_companionship: 'Recreation',
  honesty_openness: 'Honesty & Openness',
  physical_attractiveness: 'Physical Attractiveness',
  financial_support: 'Financial Support',
  domestic_support: 'Domestic Support',
  family_commitment: 'Family Commitment',
  admiration: 'Admiration',
};

function impactColor(score: KPIImpactScore): string {
  if (score <= -2) return 'bg-red-500';
  if (score === -1) return 'bg-orange-400';
  if (score === 0) return 'bg-white/20';
  if (score === 1) return 'bg-emerald-400';
  return 'bg-emerald-500';
}

function impactTextColor(score: KPIImpactScore): string {
  if (score <= -2) return 'text-red-400';
  if (score === -1) return 'text-orange-300';
  if (score === 0) return 'text-white/30';
  if (score === 1) return 'text-emerald-300';
  return 'text-emerald-300';
}

interface SeasonKPIImpactChartProps {
  impacts: PredictedKPIImpacts;
  className?: string;
}

export function SeasonKPIImpactChart({ impacts, className = '' }: SeasonKPIImpactChartProps) {
  const entries = Object.entries(impacts) as [string, KPIImpactScore][];

  if (entries.length === 0) {
    return (
      <p className="text-xs text-white/30 italic">No predicted impacts for this season.</p>
    );
  }

  // Sort by absolute impact (strongest first)
  const sorted = [...entries].sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
  const maxBar = 3; // max absolute value

  return (
    <div className={`space-y-2 ${className}`}>
      {sorted.map(([kpi, score]) => {
        const label = KPI_LABELS[kpi] ?? kpi;
        const absWidth = (Math.abs(score) / maxBar) * 100;
        const isNegative = score < 0;

        return (
          <div key={kpi} className="flex items-center gap-2">
            <span className="text-[10px] text-white/50 w-28 text-right flex-shrink-0 truncate">
              {label}
            </span>
            <div className="flex-1 h-4 relative">
              {/* Center line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10" />
              {/* Bar */}
              <div
                className="absolute top-0.5 bottom-0.5 flex items-center"
                style={{
                  left: isNegative ? `${50 - absWidth / 2}%` : '50%',
                  width: `${absWidth / 2}%`,
                }}
              >
                <div
                  className={`h-full w-full rounded-sm ${impactColor(score)}`}
                />
              </div>
            </div>
            <span className={`text-[10px] font-mono w-6 text-right flex-shrink-0 ${impactTextColor(score)}`}>
              {score > 0 ? `+${score}` : score}
            </span>
          </div>
        );
      })}
    </div>
  );
}
