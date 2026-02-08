/**
 * RKPI Shared: KPIBadge
 * Compact pill badge showing a KPI name and optional score.
 * Color adapts to KPI category or score level.
 */

import type { RelationshipKPIName } from '@/types/relationship-kpis';
import { getKPIDefinition, getScoreStyle, formatScore } from '@/utils/relationshipKpis';

type BadgeSize = 'sm' | 'md';

interface KPIBadgeProps {
  kpiName: RelationshipKPIName;
  score?: number | null;
  size?: BadgeSize;
  showScore?: boolean;
  onClick?: () => void;
}

const CATEGORY_DOT_COLORS: Record<string, string> = {
  emotional: 'bg-purple-400',
  physical: 'bg-blue-400',
  practical: 'bg-amber-400',
  intellectual: 'bg-emerald-400',
};

const SIZE_CLASSES: Record<BadgeSize, string> = {
  sm: 'text-[10px] px-2 py-0.5 gap-1',
  md: 'text-xs px-2.5 py-1 gap-1.5',
};

export function KPIBadge({
  kpiName,
  score,
  size = 'sm',
  showScore = true,
  onClick,
}: KPIBadgeProps) {
  const kpi = getKPIDefinition(kpiName);
  const dotColor = CATEGORY_DOT_COLORS[kpi.category] ?? 'bg-gray-400';
  const scoreStyle = score != null ? getScoreStyle(score) : null;

  const Tag = onClick ? 'button' : 'span';

  return (
    <Tag
      className={`inline-flex items-center rounded-full border border-white/10 bg-white/5 ${SIZE_CLASSES[size]} ${
        onClick ? 'cursor-pointer hover:bg-white/10 transition-colors' : ''
      }`}
      onClick={onClick}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor} flex-shrink-0`} />
      <span className="text-white/60 truncate">{kpi.label}</span>
      {showScore && score != null && scoreStyle && (
        <span className={`font-semibold ${scoreStyle.text} flex-shrink-0`}>
          {formatScore(score)}
        </span>
      )}
    </Tag>
  );
}
