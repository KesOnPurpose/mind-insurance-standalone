/**
 * Phase 2A: ActiveSeasonCard
 * Dashboard card showing the user's primary active season.
 * Compact display with category icon, season name, intensity, and top impacts.
 */

import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronRight, Plus } from 'lucide-react';
import { useRelationshipSeason } from '@/contexts/RelationshipSeasonContext';
import { SEASON_CATEGORIES } from '@/types/relationship-seasons';
import type { KPIImpactScore } from '@/types/relationship-seasons';

interface ActiveSeasonCardProps {
  className?: string;
}

const KPI_SHORT: Record<string, string> = {
  affection: 'Affect.',
  sexual_fulfillment: 'Sexual',
  intimate_conversation: 'Convo',
  recreational_companionship: 'Rec.',
  honesty_openness: 'Honesty',
  physical_attractiveness: 'Phys.',
  financial_support: 'Finance',
  domestic_support: 'Domestic',
  family_commitment: 'Family',
  admiration: 'Admire',
};

function intensityLabel(i: number): string {
  if (i <= 1) return 'Mild';
  if (i <= 2) return 'Low';
  if (i <= 3) return 'Moderate';
  if (i <= 4) return 'High';
  return 'Intense';
}

export function ActiveSeasonCard({ className = '' }: ActiveSeasonCardProps) {
  const navigate = useNavigate();
  const { activeSeasons, primarySeason, isLoading } = useRelationshipSeason();

  if (isLoading) return null;

  // No active seasons — show CTA
  if (!primarySeason) {
    return (
      <Card className={`border-rose-500/20 bg-mi-navy-light shadow-lg ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-rose-500/10 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-rose-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white/80">Marriage Season</p>
                <p className="text-xs text-white/40">
                  Identify your current life season
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
              onClick={() => navigate('/relationship-kpis/seasons')}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const season = primarySeason.season;
  const catDef = SEASON_CATEGORIES.find((c) => c.category === season.category);
  const impacts = Object.entries(season.predicted_kpi_impacts || {}) as [string, KPIImpactScore][];
  // Show top 3 impacts by absolute value
  const topImpacts = [...impacts]
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, 3);

  const daysActive = Math.max(
    1,
    Math.floor(
      (Date.now() - new Date(primarySeason.started_at).getTime()) / (1000 * 60 * 60 * 24)
    )
  );

  return (
    <Card className={`border-rose-500/20 bg-mi-navy-light shadow-lg ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-white/80 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-rose-400" />
            Active Season
          </CardTitle>
          {activeSeasons.length > 1 && (
            <Badge
              variant="outline"
              className="border-white/10 text-white/30 text-[10px]"
            >
              +{activeSeasons.length - 1} more
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <button
          onClick={() => navigate('/relationship-kpis/seasons')}
          className="w-full text-left group"
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">{catDef?.icon ?? '📅'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white/90 group-hover:text-rose-300 transition-colors truncate">
                {season.season_name}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant="outline"
                  className="border-white/10 text-white/40 text-[10px]"
                >
                  {intensityLabel(primarySeason.intensity)}
                </Badge>
                <span className="text-[10px] text-white/30">
                  {daysActive}d active
                </span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-white/20 mt-1 group-hover:text-white/40 transition-colors" />
          </div>

          {/* Top KPI impacts */}
          {topImpacts.length > 0 && (
            <div className="flex gap-2 mt-3 pt-2 border-t border-white/5">
              {topImpacts.map(([kpi, score]) => (
                <span
                  key={kpi}
                  className={`text-[10px] ${
                    score < 0 ? 'text-red-400' : 'text-emerald-400'
                  }`}
                >
                  {KPI_SHORT[kpi] ?? kpi}{' '}
                  <span className="font-mono">
                    {score > 0 ? `+${score}` : score}
                  </span>
                </span>
              ))}
            </div>
          )}
        </button>
      </CardContent>
    </Card>
  );
}
