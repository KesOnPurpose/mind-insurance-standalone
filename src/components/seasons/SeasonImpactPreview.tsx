/**
 * RIE Phase 2B: SeasonImpactPreview
 * Shows aggregated KPI impacts across all selected seasons.
 */

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { RelationshipSeasonCatalog } from '@/types/relationship-seasons';
import type { RelationshipKPIName } from '@/types/relationship-kpis';

// ============================================================================
// KPI Labels
// ============================================================================

const KPI_LABELS: Record<RelationshipKPIName, string> = {
  affection: 'Affection',
  sexual_fulfillment: 'Sexual Fulfillment',
  intimate_conversation: 'Intimate Conversation',
  recreational_companionship: 'Recreational Companionship',
  honesty_openness: 'Honesty & Openness',
  physical_attractiveness: 'Physical Attractiveness',
  financial_support: 'Financial Support',
  domestic_support: 'Domestic Support',
  family_commitment: 'Family Commitment',
  admiration: 'Admiration',
};

const ALL_KPIS: RelationshipKPIName[] = [
  'affection', 'sexual_fulfillment', 'intimate_conversation',
  'recreational_companionship', 'honesty_openness', 'physical_attractiveness',
  'financial_support', 'domestic_support', 'family_commitment', 'admiration',
];

// ============================================================================
// Helpers
// ============================================================================

export function aggregateKPIImpacts(
  seasons: RelationshipSeasonCatalog[]
): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const kpi of ALL_KPIS) {
    totals[kpi] = 0;
  }
  for (const season of seasons) {
    const impacts = season.predicted_kpi_impacts ?? {};
    for (const kpi of ALL_KPIS) {
      totals[kpi] += impacts[kpi] ?? 0;
    }
  }
  return totals;
}

// ============================================================================
// Props
// ============================================================================

export interface SeasonImpactPreviewProps {
  selectedSeasons: RelationshipSeasonCatalog[];
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function SeasonImpactPreview({ selectedSeasons, className }: SeasonImpactPreviewProps) {
  const aggregated = aggregateKPIImpacts(selectedSeasons);

  if (selectedSeasons.length === 0) {
    return null;
  }

  return (
    <Card className={`bg-white/5 border-white/10 ${className ?? ''}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-white/80">
          Predicted KPI Impact
        </CardTitle>
        <p className="text-xs text-white/40">
          Combined effect of {selectedSeasons.length} selected season{selectedSeasons.length !== 1 ? 's' : ''}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {ALL_KPIS.map((kpi) => {
            const value = aggregated[kpi];
            const isPositive = value > 0;
            const isNegative = value < 0;

            return (
              <div
                key={kpi}
                className="flex items-center justify-between py-1.5 px-2 rounded bg-white/5"
              >
                <span className="text-xs text-white/60 truncate mr-2">
                  {KPI_LABELS[kpi]}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  {isPositive && (
                    <>
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-xs font-medium text-emerald-400">+{value}</span>
                    </>
                  )}
                  {isNegative && (
                    <>
                      <TrendingDown className="h-3.5 w-3.5 text-red-400" />
                      <span className="text-xs font-medium text-red-400">{value}</span>
                    </>
                  )}
                  {!isPositive && !isNegative && (
                    <>
                      <Minus className="h-3.5 w-3.5 text-white/30" />
                      <span className="text-xs text-white/30">0</span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
