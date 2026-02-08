/**
 * Phase 3: SeasonSuggestionCard
 * Analyzes the user's lowest KPI scores and active seasons
 * to suggest relevant seasons they might be experiencing.
 * Uses a simple pattern-matching engine based on KPI impacts.
 */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ChevronRight, Plus, Loader2 } from 'lucide-react';
import { useRelationshipKpis } from '@/hooks/useRelationshipKpis';
import { useRelationshipSeason } from '@/contexts/RelationshipSeasonContext';
import { SEASON_CATEGORIES } from '@/types/relationship-seasons';
import type {
  SeasonSuggestion,
  RelationshipSeasonCatalog,
} from '@/types/relationship-seasons';
import type { RelationshipKPIName } from '@/types/relationship-kpis';

/** KPI display labels */
const KPI_LABELS: Record<RelationshipKPIName, string> = {
  affection: 'Affection',
  sexual_fulfillment: 'Sexual Fulfillment',
  intimate_conversation: 'Conversation',
  recreational_companionship: 'Fun Together',
  honesty_openness: 'Honesty',
  physical_attractiveness: 'Attraction',
  financial_support: 'Finances',
  domestic_support: 'Domestic',
  family_commitment: 'Family',
  admiration: 'Admiration',
};

/**
 * Simple season suggestion engine.
 * For each catalog season, compute a confidence score based on
 * how many of the user's lowest KPIs are negatively impacted by
 * that season (meaning the season explains their low scores).
 */
function computeSuggestions(
  catalog: RelationshipSeasonCatalog[],
  lowestKpis: RelationshipKPIName[],
  activeSeasonIds: Set<string>,
): SeasonSuggestion[] {
  if (lowestKpis.length === 0) return [];

  const suggestions: SeasonSuggestion[] = [];

  for (const season of catalog) {
    // Skip already active seasons
    if (activeSeasonIds.has(season.id)) continue;

    const impacts = season.predicted_kpi_impacts;
    let matchScore = 0;
    const matchedKpis: string[] = [];

    for (const kpi of lowestKpis) {
      const impact = impacts[kpi];
      if (impact !== undefined && impact < 0) {
        // The more negative the impact, the stronger the match
        matchScore += Math.abs(impact);
        matchedKpis.push(KPI_LABELS[kpi]);
      }
    }

    if (matchScore > 0) {
      const maxPossible = lowestKpis.length * 3; // max -3 per KPI
      const confidence = Math.min(matchScore / maxPossible, 1);

      suggestions.push({
        season,
        confidence,
        reason: `Explains low ${matchedKpis.join(', ')} scores`,
      });
    }
  }

  // Sort by confidence descending, take top 3
  return suggestions
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);
}

export function SeasonSuggestionCard() {
  const navigate = useNavigate();
  const { heatMap, isLoading: kpiLoading } = useRelationshipKpis();
  const {
    catalog,
    activeSeasons,
    assignSeason,
    isLoading: seasonLoading,
  } = useRelationshipSeason();

  const [addingId, setAddingId] = useState<string | null>(null);

  // Find the 3 lowest-scoring KPIs from the latest heat map row
  const lowestKpis = useMemo(() => {
    if (!heatMap || heatMap.length === 0) return [];

    // Get the most recent week's scores
    const latestWeek = heatMap[0];
    const kpiScores: { name: RelationshipKPIName; score: number }[] = [];

    for (const [key, value] of Object.entries(latestWeek)) {
      if (key === 'week' || key === 'overall_score') continue;
      if (typeof value === 'number') {
        kpiScores.push({ name: key as RelationshipKPIName, score: value });
      }
    }

    return kpiScores
      .sort((a, b) => a.score - b.score)
      .slice(0, 3)
      .map((k) => k.name);
  }, [heatMap]);

  const activeSeasonIds = useMemo(
    () => new Set(activeSeasons.map((s) => s.season_id)),
    [activeSeasons],
  );

  const suggestions = useMemo(
    () => computeSuggestions(catalog, lowestKpis, activeSeasonIds),
    [catalog, lowestKpis, activeSeasonIds],
  );

  const handleAdd = async (seasonId: string) => {
    setAddingId(seasonId);
    try {
      await assignSeason({ season_id: seasonId });
    } catch (err) {
      console.error('Failed to add season:', err);
    } finally {
      setAddingId(null);
    }
  };

  if (kpiLoading || seasonLoading) return null;
  if (suggestions.length === 0) return null;

  return (
    <Card className="border-amber-500/20 bg-mi-navy-light shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-white/80 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-400" />
          Suggested Seasons
        </CardTitle>
        <p className="text-[10px] text-white/30">
          Based on your recent KPI patterns
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {suggestions.map((suggestion) => {
          const catDef = SEASON_CATEGORIES.find(
            (c) => c.category === suggestion.season.category,
          );
          const confidencePercent = Math.round(suggestion.confidence * 100);
          const isAdding = addingId === suggestion.season.id;

          return (
            <div
              key={suggestion.season.id}
              className="flex items-start gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/5"
            >
              <span className="text-lg mt-0.5">{catDef?.icon ?? '📅'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white/80 truncate">
                  {suggestion.season.season_name}
                </p>
                <p className="text-[10px] text-white/30 mt-0.5">
                  {suggestion.reason}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-400/60 transition-all"
                      style={{ width: `${confidencePercent}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-amber-400/60 w-7 text-right">
                    {confidencePercent}%
                  </span>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-[10px] text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
                onClick={() => handleAdd(suggestion.season.id)}
                disabled={isAdding}
              >
                {isAdding ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    <Plus className="h-3 w-3 mr-0.5" />
                    Add
                  </>
                )}
              </Button>
            </div>
          );
        })}

        <button
          onClick={() => navigate('/relationship-kpis/seasons')}
          className="flex items-center justify-center gap-1 w-full text-[10px] text-white/20 hover:text-white/40 transition-colors pt-1"
        >
          Browse all seasons
          <ChevronRight className="h-3 w-3" />
        </button>
      </CardContent>
    </Card>
  );
}
