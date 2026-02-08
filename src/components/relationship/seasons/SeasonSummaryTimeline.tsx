/**
 * RIE Phase 2B: SeasonSummaryTimeline
 * Horizontal scrollable timeline showing past seasons flowing to current.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { RelationshipSeasonCatalog } from '@/types/relationship-seasons';

// ============================================================================
// Helpers
// ============================================================================

function getHealingColor(progress: number): string {
  if (progress <= 25) return 'bg-red-500/30 border-red-400/50';
  if (progress <= 50) return 'bg-amber-500/30 border-amber-400/50';
  if (progress <= 75) return 'bg-yellow-500/30 border-yellow-400/50';
  return 'bg-emerald-500/30 border-emerald-400/50';
}

function getHealingTextColor(progress: number): string {
  if (progress <= 25) return 'text-red-400';
  if (progress <= 50) return 'text-amber-400';
  if (progress <= 75) return 'text-yellow-400';
  return 'text-emerald-400';
}

// ============================================================================
// Props
// ============================================================================

export interface SeasonSummaryTimelineProps {
  pastSeasons: Array<{ season: RelationshipSeasonCatalog; healingProgress: number }>;
  currentSeasons: RelationshipSeasonCatalog[];
}

// ============================================================================
// Component
// ============================================================================

export function SeasonSummaryTimeline({
  pastSeasons,
  currentSeasons,
}: SeasonSummaryTimelineProps) {
  if (pastSeasons.length === 0 && currentSeasons.length === 0) {
    return null;
  }

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-white/80">Your Season Journey</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto pb-2">
          <div className="flex items-center gap-2 min-w-max">
            {/* Past Seasons */}
            {pastSeasons.map(({ season, healingProgress }) => (
              <div
                key={season.id}
                className={`
                  flex flex-col items-center px-3 py-2 rounded-lg border
                  ${getHealingColor(healingProgress)}
                  min-w-[100px] max-w-[120px]
                `}
              >
                <span className="text-xs text-white/80 text-center line-clamp-2 leading-tight">
                  {season.season_name}
                </span>
                <span className={`text-[10px] mt-1 ${getHealingTextColor(healingProgress)}`}>
                  {healingProgress}% healed
                </span>
              </div>
            ))}

            {/* "Now" Divider */}
            {pastSeasons.length > 0 && currentSeasons.length > 0 && (
              <div className="flex flex-col items-center px-2">
                <div className="w-px h-6 bg-white/20" />
                <span className="text-[10px] text-white/40 font-medium uppercase tracking-wider my-1">
                  Now
                </span>
                <div className="w-px h-6 bg-white/20" />
              </div>
            )}

            {/* Current Seasons */}
            {currentSeasons.map((season) => (
              <div
                key={season.id}
                className="flex flex-col items-center px-3 py-2 rounded-lg border
                  bg-rose-500/20 border-rose-400/50
                  min-w-[100px] max-w-[120px]"
              >
                <span className="text-xs text-rose-300 text-center line-clamp-2 leading-tight font-medium">
                  {season.season_name}
                </span>
                <span className="text-[10px] mt-1 text-rose-400">
                  Active
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
