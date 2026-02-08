/**
 * RIE Phase 2B: MIOContextPreview
 * Shows what MIO now understands about the user's marriage
 * based on selected seasons.
 */

import { Brain, AlertTriangle, TrendingDown, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { RelationshipSeasonCatalog, RelationshipKPIName } from '@/types/relationship-seasons';

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

// ============================================================================
// Props
// ============================================================================

export interface MIOContextPreviewProps {
  pastSeasons: Array<{ season: RelationshipSeasonCatalog; healingProgress: number }>;
  currentSeasons: RelationshipSeasonCatalog[];
  aggregatedImpacts: Record<string, number>;
}

// ============================================================================
// Component
// ============================================================================

export function MIOContextPreview({
  pastSeasons,
  currentSeasons,
  aggregatedImpacts,
}: MIOContextPreviewProps) {
  const unhealedSeasons = pastSeasons.filter((p) => p.healingProgress < 50);

  // Find the 3 most negatively impacted KPIs
  const sortedImpacts = Object.entries(aggregatedImpacts)
    .filter(([, val]) => val < 0)
    .sort(([, a], [, b]) => a - b)
    .slice(0, 3);

  if (currentSeasons.length === 0 && pastSeasons.length === 0) {
    return null;
  }

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-white/80 flex items-center gap-2">
          <Brain className="h-4 w-4 text-rose-400" />
          What MIO Now Understands About Your Marriage
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Active Seasons */}
        {currentSeasons.length > 0 && (
          <div className="flex items-start gap-2">
            <Activity className="h-4 w-4 text-rose-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-white/60">
                You're currently navigating{' '}
                <span className="text-white/90 font-medium">
                  {currentSeasons.length} active season{currentSeasons.length !== 1 ? 's' : ''}
                </span>
                :{' '}
                {currentSeasons.map((s) => s.season_name).join(', ')}
              </p>
            </div>
          </div>
        )}

        {/* Unhealed Past Seasons */}
        {unhealedSeasons.length > 0 && (
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-white/60">
                <span className="text-amber-400 font-medium">
                  {unhealedSeasons.length} unhealed past season{unhealedSeasons.length !== 1 ? 's' : ''}
                </span>{' '}
                may still be affecting your relationship:{' '}
                {unhealedSeasons.map((p) => p.season.season_name).join(', ')}
              </p>
            </div>
          </div>
        )}

        {/* Strongest KPI Impacts */}
        {sortedImpacts.length > 0 && (
          <div className="flex items-start gap-2">
            <TrendingDown className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-white/60">
                Your most pressured KPIs are:{' '}
                {sortedImpacts.map(([kpi, val]) => (
                  <span key={kpi} className="text-red-400 font-medium">
                    {KPI_LABELS[kpi as RelationshipKPIName]} ({val})
                  </span>
                )).reduce<React.ReactNode[]>((prev, curr, i) => {
                  if (i === 0) return [curr];
                  return [...prev, ', ', curr];
                }, [])}
              </p>
            </div>
          </div>
        )}

        {/* Separation Context */}
        {unhealedSeasons.length >= 2 && (
          <div className="mt-2 p-2 rounded bg-amber-500/10 border border-amber-500/20">
            <p className="text-[11px] text-amber-300/80">
              MIO detects potential separation risk factors from unhealed seasons.
              These will be factored into your coaching recommendations.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
