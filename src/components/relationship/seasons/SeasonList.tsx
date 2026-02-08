/**
 * Phase 2A: SeasonList
 * Displays seasons within a selected category.
 * Each row shows season name, description, duration, and an "Assign" button.
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Clock, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { useRelationshipSeason } from '@/contexts/RelationshipSeasonContext';
import { SeasonKPIImpactChart } from './SeasonKPIImpactChart';
import type { RelationshipSeasonCatalog } from '@/types/relationship-seasons';

interface SeasonListProps {
  seasons: RelationshipSeasonCatalog[];
  className?: string;
}

export function SeasonList({ seasons, className = '' }: SeasonListProps) {
  const { activeSeasons, assignSeason } = useRelationshipSeason();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const activeSeasonIds = new Set(activeSeasons.map((s) => s.season_id));

  const handleAssign = async (seasonId: string) => {
    setAssigningId(seasonId);
    try {
      await assignSeason({ season_id: seasonId });
    } catch (err) {
      console.error('Failed to assign season:', err);
    } finally {
      setAssigningId(null);
    }
  };

  if (seasons.length === 0) {
    return (
      <p className="text-sm text-white/30 text-center py-8">
        No seasons available in this category.
      </p>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {seasons.map((season) => {
        const isActive = activeSeasonIds.has(season.id);
        const isExpanded = expandedId === season.id;
        const isAssigning = assigningId === season.id;

        return (
          <Card
            key={season.id}
            className={`transition-all ${
              isActive
                ? 'border-emerald-500/20 bg-emerald-500/5'
                : 'border-white/5 bg-mi-navy-light'
            }`}
          >
            <CardContent className="p-4">
              {/* Header row */}
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white/90 truncate">
                      {season.season_name}
                    </p>
                    {isActive && (
                      <Badge
                        variant="outline"
                        className="border-emerald-400/30 text-emerald-300 text-[10px] flex-shrink-0"
                      >
                        <Check className="h-2.5 w-2.5 mr-0.5" />
                        Active
                      </Badge>
                    )}
                  </div>
                  {season.season_description && (
                    <p className="text-xs text-white/40 mt-1 line-clamp-2">
                      {season.season_description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    {season.typical_duration_months && (
                      <span className="text-[10px] text-white/30 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        ~{season.typical_duration_months} months
                      </span>
                    )}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : season.id)}
                      className="text-[10px] text-rose-400/60 hover:text-rose-400 flex items-center gap-0.5 transition-colors"
                    >
                      KPI Impacts
                      {isExpanded ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Action button */}
                {!isActive && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 flex-shrink-0"
                    onClick={() => handleAssign(season.id)}
                    disabled={isAssigning}
                  >
                    {isAssigning ? (
                      'Adding...'
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Add
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Expanded: KPI impacts + guidance */}
              {isExpanded && (
                <div className="mt-4 pt-3 border-t border-white/5 space-y-3">
                  <SeasonKPIImpactChart impacts={season.predicted_kpi_impacts} />

                  {season.guidance_tips.length > 0 && (
                    <div>
                      <p className="text-[10px] text-white/40 uppercase tracking-wide mb-1.5">
                        Guidance
                      </p>
                      <ul className="space-y-1">
                        {season.guidance_tips.map((tip, i) => (
                          <li
                            key={i}
                            className="text-xs text-white/50 flex items-start gap-2"
                          >
                            <span className="text-rose-400/60 mt-0.5">•</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
