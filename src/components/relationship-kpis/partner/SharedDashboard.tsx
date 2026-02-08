/**
 * RKPI Partner: SharedDashboard
 * Side-by-side 10-KPI comparison between user and partner.
 * Respects privacy flags (private scores shown as "Private").
 */

import { Lock } from 'lucide-react';
import type { RelationshipKPIScore, RelationshipKPIName } from '@/types/relationship-kpis';
import { KPI_DEFINITIONS } from '@/types/relationship-kpis';
import { getScoreStyle, formatScore } from '@/utils/relationshipKpis';

interface SharedDashboardProps {
  userScores: RelationshipKPIScore[];
  partnerScores: RelationshipKPIScore[];
  userName?: string;
  partnerName?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  emotional: 'border-l-purple-400',
  physical: 'border-l-blue-400',
  practical: 'border-l-amber-400',
  intellectual: 'border-l-emerald-400',
};

function ScoreCell({ score, isPrivate }: { score: number | null; isPrivate: boolean }) {
  if (isPrivate) {
    return (
      <div className="flex items-center gap-1 text-white/20">
        <Lock className="h-3 w-3" />
        <span className="text-xs">Private</span>
      </div>
    );
  }

  if (score === null) {
    return <span className="text-xs text-white/20">—</span>;
  }

  const style = getScoreStyle(score);
  return (
    <span className={`text-sm font-bold ${style.text}`}>
      {formatScore(score)}
    </span>
  );
}

function DifferenceIndicator({ userScore, partnerScore }: { userScore: number | null; partnerScore: number | null }) {
  if (userScore === null || partnerScore === null) return null;

  const diff = Math.abs(userScore - partnerScore);
  if (diff <= 1) return null;

  return (
    <span
      className={`text-[10px] px-1.5 py-0.5 rounded ${
        diff >= 3
          ? 'bg-red-500/20 text-red-400'
          : 'bg-amber-500/20 text-amber-400'
      }`}
    >
      {diff >= 3 ? 'Gap' : 'Diff'}
    </span>
  );
}

export function SharedDashboard({
  userScores,
  partnerScores,
  userName = 'You',
  partnerName = 'Partner',
}: SharedDashboardProps) {
  // Build lookup maps
  const userMap = new Map<RelationshipKPIName, RelationshipKPIScore>();
  for (const s of userScores) {
    userMap.set(s.kpi_name, s);
  }

  const partnerMap = new Map<RelationshipKPIName, RelationshipKPIScore>();
  for (const s of partnerScores) {
    partnerMap.set(s.kpi_name, s);
  }

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="grid grid-cols-[1fr_60px_60px_40px] gap-2 px-3 pb-2 border-b border-white/10">
        <span className="text-[10px] text-white/40 uppercase tracking-wider">KPI</span>
        <span className="text-[10px] text-white/40 uppercase tracking-wider text-center truncate">
          {userName}
        </span>
        <span className="text-[10px] text-white/40 uppercase tracking-wider text-center truncate">
          {partnerName}
        </span>
        <span className="text-[10px] text-white/40 uppercase tracking-wider text-center" />
      </div>

      {/* KPI rows */}
      {KPI_DEFINITIONS.map((kpi) => {
        const userScore = userMap.get(kpi.name);
        const partnerScore = partnerMap.get(kpi.name);

        const userVal = userScore?.score ?? null;
        const partnerVal = partnerScore?.is_private ? null : (partnerScore?.score ?? null);
        const isPartnerPrivate = partnerScore?.is_private ?? false;

        return (
          <div
            key={kpi.name}
            className={`grid grid-cols-[1fr_60px_60px_40px] gap-2 items-center px-3 py-2 rounded-lg bg-white/[0.02] border-l-2 ${
              CATEGORY_COLORS[kpi.category] ?? 'border-l-gray-400'
            }`}
          >
            <div className="min-w-0">
              <p className="text-xs text-white truncate">{kpi.label}</p>
            </div>
            <div className="text-center">
              <ScoreCell score={userVal} isPrivate={false} />
            </div>
            <div className="text-center">
              <ScoreCell score={partnerVal} isPrivate={isPartnerPrivate} />
            </div>
            <div className="text-center">
              <DifferenceIndicator
                userScore={userVal}
                partnerScore={isPartnerPrivate ? null : partnerVal}
              />
            </div>
          </div>
        );
      })}

      {/* Legend */}
      <div className="flex items-center gap-4 pt-2 px-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded bg-red-500/50" />
          <span className="text-[10px] text-white/30">Gap &ge; 3</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded bg-amber-500/50" />
          <span className="text-[10px] text-white/30">Diff 2</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Lock className="h-2.5 w-2.5 text-white/20" />
          <span className="text-[10px] text-white/30">Private score</span>
        </div>
      </div>
    </div>
  );
}
