/**
 * Phase 2A: SeasonHistory
 * Displays past (ended) seasons in a timeline format.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { useRelationshipSeason } from '@/contexts/RelationshipSeasonContext';
import { SEASON_CATEGORIES } from '@/types/relationship-seasons';

export function SeasonHistory() {
  const { seasonHistory } = useRelationshipSeason();

  // Only show ended seasons
  const pastSeasons = seasonHistory.filter((s) => s.ended_at != null);

  if (pastSeasons.length === 0) return null;

  return (
    <Card className="border-white/5 bg-mi-navy-light">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-white/60 flex items-center gap-2">
          <Clock className="h-4 w-4 text-white/30" />
          Past Seasons
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {pastSeasons.map((us) => {
            const catDef = SEASON_CATEGORIES.find((c) => c.category === us.season.category);
            const startDate = new Date(us.started_at).toLocaleDateString('en-US', {
              month: 'short',
              year: 'numeric',
            });
            const endDate = us.ended_at
              ? new Date(us.ended_at).toLocaleDateString('en-US', {
                  month: 'short',
                  year: 'numeric',
                })
              : 'Present';

            const durationDays = us.ended_at
              ? Math.floor(
                  (new Date(us.ended_at).getTime() - new Date(us.started_at).getTime()) /
                    (1000 * 60 * 60 * 24)
                )
              : 0;

            return (
              <div
                key={us.id}
                className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02] border border-white/5"
              >
                <span className="text-lg">{catDef?.icon ?? '📅'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white/60 truncate">
                    {us.season.season_name}
                  </p>
                  <p className="text-[10px] text-white/30">
                    {startDate} — {endDate}
                    {durationDays > 0 && ` (${durationDays}d)`}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="border-white/10 text-white/20 text-[10px]"
                >
                  Ended
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
