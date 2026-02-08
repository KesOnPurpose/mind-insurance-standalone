/**
 * Phase 2A: SeasonCategoryGrid
 * Displays 10 season categories as a tappable grid.
 * Clicking a category shows its seasons in the parent page.
 */

import { Card, CardContent } from '@/components/ui/card';
import {
  SEASON_CATEGORIES,
  type SeasonCategory,
  type SeasonCategoryDefinition,
} from '@/types/relationship-seasons';

interface SeasonCategoryGridProps {
  selectedCategory: SeasonCategory | null;
  onSelectCategory: (category: SeasonCategory) => void;
  seasonCounts?: Record<SeasonCategory, number>;
  className?: string;
}

export function SeasonCategoryGrid({
  selectedCategory,
  onSelectCategory,
  seasonCounts,
  className = '',
}: SeasonCategoryGridProps) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 ${className}`}>
      {SEASON_CATEGORIES.map((cat: SeasonCategoryDefinition) => {
        const isSelected = selectedCategory === cat.category;
        const count = seasonCounts?.[cat.category] ?? 0;

        return (
          <button
            key={cat.category}
            onClick={() => onSelectCategory(cat.category)}
            className="text-left"
          >
            <Card
              className={`transition-all cursor-pointer ${
                isSelected
                  ? 'border-rose-400 bg-rose-500/10 shadow-rose-500/10 shadow-md'
                  : 'border-white/5 bg-mi-navy-light hover:border-white/10 hover:bg-white/[0.03]'
              }`}
            >
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <span className="text-2xl leading-none">{cat.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-xs font-medium leading-tight ${
                        isSelected ? 'text-rose-300' : 'text-white/70'
                      }`}
                    >
                      {cat.label}
                    </p>
                    {count > 0 && (
                      <p className="text-[10px] text-white/30 mt-0.5">
                        {count} season{count !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </button>
        );
      })}
    </div>
  );
}
