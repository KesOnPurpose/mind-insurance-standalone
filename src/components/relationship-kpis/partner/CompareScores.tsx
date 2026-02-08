/**
 * RKPI Partner: CompareScores
 * Detailed comparison view between user and partner scores.
 * Bar chart style visualization with optional radar-like layout.
 * Respects privacy flags.
 */

import { useMemo } from 'react';
import { Lock, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { RelationshipKPIScore, RelationshipKPIName, PartnerScoreComparison } from '@/types/relationship-kpis';
import { KPI_DEFINITIONS } from '@/types/relationship-kpis';
import { getScoreStyle, formatScore, getKPILabel } from '@/utils/relationshipKpis';

type ViewMode = 'bars' | 'list';

interface CompareScoresProps {
  userScores: RelationshipKPIScore[];
  partnerScores: RelationshipKPIScore[];
  userName?: string;
  partnerName?: string;
  viewMode?: ViewMode;
}

function ComparisonBar({
  kpiName,
  userScore,
  partnerScore,
  isPartnerPrivate,
  userName,
  partnerName,
}: {
  kpiName: RelationshipKPIName;
  userScore: number | null;
  partnerScore: number | null;
  isPartnerPrivate: boolean;
  userName: string;
  partnerName: string;
}) {
  const label = getKPILabel(kpiName);
  const userStyle = userScore !== null ? getScoreStyle(userScore) : null;
  const partnerStyle = partnerScore !== null ? getScoreStyle(partnerScore) : null;

  const diff =
    userScore !== null && partnerScore !== null && !isPartnerPrivate
      ? userScore - partnerScore
      : null;

  return (
    <div className="space-y-1.5">
      {/* KPI label + diff */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-white">{label}</p>
        {diff !== null && (
          <div className="flex items-center gap-1">
            {Math.abs(diff) < 0.5 ? (
              <Minus className="h-3 w-3 text-white/30" />
            ) : diff > 0 ? (
              <TrendingUp className="h-3 w-3 text-emerald-400" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-400" />
            )}
            <span
              className={`text-[10px] ${
                Math.abs(diff) < 0.5
                  ? 'text-white/30'
                  : diff > 0
                  ? 'text-emerald-400'
                  : 'text-red-400'
              }`}
            >
              {diff > 0 ? '+' : ''}{diff.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* Bars */}
      <div className="space-y-1">
        {/* User bar */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/40 w-14 truncate">{userName}</span>
          <div className="flex-1 h-4 rounded bg-white/5 overflow-hidden">
            {userScore !== null && (
              <div
                className={`h-full rounded ${userStyle?.bg ?? 'bg-gray-500/20'} transition-all duration-300`}
                style={{ width: `${(userScore / 10) * 100}%` }}
              />
            )}
          </div>
          <span className={`text-xs font-semibold w-6 text-right ${userStyle?.text ?? 'text-white/30'}`}>
            {formatScore(userScore)}
          </span>
        </div>

        {/* Partner bar */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/40 w-14 truncate">{partnerName}</span>
          {isPartnerPrivate ? (
            <>
              <div className="flex-1 flex items-center gap-1 text-white/20">
                <Lock className="h-3 w-3" />
                <span className="text-[10px]">Private</span>
              </div>
              <span className="w-6" />
            </>
          ) : (
            <>
              <div className="flex-1 h-4 rounded bg-white/5 overflow-hidden">
                {partnerScore !== null && (
                  <div
                    className={`h-full rounded ${partnerStyle?.bg ?? 'bg-gray-500/20'} transition-all duration-300`}
                    style={{ width: `${(partnerScore / 10) * 100}%` }}
                  />
                )}
              </div>
              <span className={`text-xs font-semibold w-6 text-right ${partnerStyle?.text ?? 'text-white/30'}`}>
                {formatScore(partnerScore)}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function CompareScores({
  userScores,
  partnerScores,
  userName = 'You',
  partnerName = 'Partner',
  viewMode = 'bars',
}: CompareScoresProps) {
  const comparisons = useMemo<PartnerScoreComparison[]>(() => {
    const userMap = new Map<RelationshipKPIName, RelationshipKPIScore>();
    for (const s of userScores) userMap.set(s.kpi_name, s);

    const partnerMap = new Map<RelationshipKPIName, RelationshipKPIScore>();
    for (const s of partnerScores) partnerMap.set(s.kpi_name, s);

    return KPI_DEFINITIONS.map((kpi) => {
      const us = userMap.get(kpi.name);
      const ps = partnerMap.get(kpi.name);
      const uScore = us?.score ?? null;
      const pScore = ps?.is_private ? null : (ps?.score ?? null);
      return {
        kpiName: kpi.name,
        userScore: uScore,
        partnerScore: pScore,
        difference: uScore !== null && pScore !== null ? uScore - pScore : null,
      };
    });
  }, [userScores, partnerScores]);

  // Summary stats
  const gapCount = comparisons.filter((c) => c.difference !== null && Math.abs(c.difference) >= 3).length;
  const alignedCount = comparisons.filter((c) => c.difference !== null && Math.abs(c.difference) <= 1).length;

  const partnerPrivateMap = useMemo(() => {
    const map = new Map<RelationshipKPIName, boolean>();
    for (const s of partnerScores) map.set(s.kpi_name, s.is_private);
    return map;
  }, [partnerScores]);

  return (
    <div className="space-y-4">
      {/* Summary chips */}
      <div className="flex gap-2 flex-wrap">
        <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          {alignedCount} Aligned
        </span>
        {gapCount > 0 && (
          <span className="text-[10px] px-2 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
            {gapCount} Perception Gap{gapCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Comparison view */}
      {viewMode === 'bars' ? (
        <div className="space-y-4">
          {KPI_DEFINITIONS.map((kpi) => {
            const userScore = comparisons.find((c) => c.kpiName === kpi.name);
            return (
              <ComparisonBar
                key={kpi.name}
                kpiName={kpi.name}
                userScore={userScore?.userScore ?? null}
                partnerScore={userScore?.partnerScore ?? null}
                isPartnerPrivate={partnerPrivateMap.get(kpi.name) ?? false}
                userName={userName}
                partnerName={partnerName}
              />
            );
          })}
        </div>
      ) : (
        <div className="space-y-1">
          {comparisons.map((comp) => {
            const isPrivate = partnerPrivateMap.get(comp.kpiName) ?? false;
            return (
              <div
                key={comp.kpiName}
                className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
              >
                <span className="text-xs text-white/70">{getKPILabel(comp.kpiName)}</span>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold ${comp.userScore !== null ? getScoreStyle(comp.userScore).text : 'text-white/20'}`}>
                    {formatScore(comp.userScore)}
                  </span>
                  <span className="text-white/20">vs</span>
                  {isPrivate ? (
                    <Lock className="h-3 w-3 text-white/20" />
                  ) : (
                    <span className={`text-xs font-semibold ${comp.partnerScore !== null ? getScoreStyle(comp.partnerScore).text : 'text-white/20'}`}>
                      {formatScore(comp.partnerScore)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
