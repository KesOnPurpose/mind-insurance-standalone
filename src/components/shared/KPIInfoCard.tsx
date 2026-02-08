/**
 * RKPI Shared: KPIInfoCard
 * Detailed card for a single KPI showing score, description, category, and optional notes.
 * Used in dashboard drilldowns and partner comparison views.
 */

import type { RelationshipKPIName } from '@/types/relationship-kpis';
import { getKPIDefinition, getScoreStyle, formatScore } from '@/utils/relationshipKpis';
import { ScoreCircle } from './ScoreCircle';

interface KPIInfoCardProps {
  kpiName: RelationshipKPIName;
  score: number | null;
  notes?: string | null;
  isPrivate?: boolean;
  showDescription?: boolean;
  onClick?: () => void;
}

const CATEGORY_ACCENT: Record<string, string> = {
  emotional: 'border-l-purple-400',
  physical: 'border-l-blue-400',
  practical: 'border-l-amber-400',
  intellectual: 'border-l-emerald-400',
};

const CATEGORY_TEXT: Record<string, string> = {
  emotional: 'text-purple-400',
  physical: 'text-blue-400',
  practical: 'text-amber-400',
  intellectual: 'text-emerald-400',
};

export function KPIInfoCard({
  kpiName,
  score,
  notes,
  isPrivate,
  showDescription = true,
  onClick,
}: KPIInfoCardProps) {
  const kpi = getKPIDefinition(kpiName);
  const accentClass = CATEGORY_ACCENT[kpi.category] ?? 'border-l-gray-400';
  const categoryText = CATEGORY_TEXT[kpi.category] ?? 'text-gray-400';

  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      className={`w-full text-left rounded-lg bg-white/5 border border-white/10 border-l-2 ${accentClass} p-3 ${
        onClick ? 'cursor-pointer hover:bg-white/[0.07] transition-colors' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <ScoreCircle score={score} size="sm" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-white truncate">{kpi.label}</p>
            {isPrivate && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/30">
                Private
              </span>
            )}
          </div>

          <p className={`text-[10px] uppercase tracking-wider ${categoryText} mt-0.5`}>
            {kpi.category}
          </p>

          {showDescription && (
            <p className="text-xs text-white/40 mt-1 leading-relaxed">
              {kpi.description}
            </p>
          )}

          {notes && (
            <p className="text-xs text-white/50 mt-2 italic leading-relaxed line-clamp-2">
              &ldquo;{notes}&rdquo;
            </p>
          )}
        </div>
      </div>
    </Tag>
  );
}
