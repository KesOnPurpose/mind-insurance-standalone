/**
 * RKPI Shared: ColorLegend
 * Displays score category color legend (Critical, Needs Attention, Good, Excellent).
 * Useful below charts and heat maps.
 */

import type { ScoreCategory } from '@/types/relationship-kpis';
import { getCategoryStyle } from '@/utils/relationshipKpis';

type LegendLayout = 'horizontal' | 'vertical';

interface ColorLegendProps {
  layout?: LegendLayout;
  categories?: ScoreCategory[];
}

const DEFAULT_CATEGORIES: ScoreCategory[] = [
  'critical',
  'needs_attention',
  'good',
  'excellent',
];

export function ColorLegend({
  layout = 'horizontal',
  categories = DEFAULT_CATEGORIES,
}: ColorLegendProps) {
  return (
    <div
      className={`flex gap-3 ${
        layout === 'vertical' ? 'flex-col' : 'flex-row flex-wrap'
      }`}
    >
      {categories.map((cat) => {
        const style = getCategoryStyle(cat);
        return (
          <div key={cat} className="flex items-center gap-1.5">
            <span
              className={`w-2.5 h-2.5 rounded-sm ${style.bg} border ${style.border}`}
            />
            <span className="text-[10px] text-white/40">{style.label}</span>
          </div>
        );
      })}
    </div>
  );
}
