/**
 * RIE Phase 2B: SeasonCategoryAccordion
 * Collapsible accordion grouped by category, rendering SeasonChip inside each.
 * Only shows categories that have seasons in the filtered list.
 */

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { SEASON_CATEGORIES } from '@/types/relationship-seasons';
import type { RelationshipSeasonCatalog, SeasonCategory } from '@/types/relationship-seasons';
import { SeasonChip } from './SeasonChip';

// ============================================================================
// Props
// ============================================================================

export interface SeasonCategoryAccordionProps {
  seasons: RelationshipSeasonCatalog[];
  selectedSeasonIds: Set<string>;
  onToggleSeason: (seasonId: string) => void;
  healingProgressMap?: Map<string, number>;
  onHealingProgressChange?: (seasonId: string, progress: number) => void;
  showHealingSlider?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function SeasonCategoryAccordion({
  seasons,
  selectedSeasonIds,
  onToggleSeason,
  healingProgressMap,
  onHealingProgressChange,
  showHealingSlider = false,
}: SeasonCategoryAccordionProps) {
  // Group seasons by category
  const grouped = new Map<SeasonCategory, RelationshipSeasonCatalog[]>();
  for (const season of seasons) {
    const list = grouped.get(season.category) ?? [];
    list.push(season);
    grouped.set(season.category, list);
  }

  // Only show categories that have seasons
  const visibleCategories = SEASON_CATEGORIES.filter(
    (cat) => grouped.has(cat.category) && (grouped.get(cat.category)?.length ?? 0) > 0
  );

  if (visibleCategories.length === 0) {
    return (
      <p className="text-sm text-white/30 text-center py-4">
        No seasons match your life stage filter.
      </p>
    );
  }

  return (
    <Accordion type="multiple" className="space-y-2">
      {visibleCategories.map((catDef) => {
        const catSeasons = grouped.get(catDef.category) ?? [];
        const selectedCount = catSeasons.filter((s) =>
          selectedSeasonIds.has(s.id)
        ).length;

        return (
          <AccordionItem
            key={catDef.category}
            value={catDef.category}
            className="border border-white/10 rounded-lg bg-white/5 overflow-hidden"
          >
            <AccordionTrigger className="px-4 py-3 text-sm hover:no-underline hover:bg-white/5">
              <div className="flex items-center gap-2 text-left">
                <span className="text-lg">{catDef.icon}</span>
                <span className="text-white/80 font-medium">{catDef.label}</span>
                <span className="text-xs text-white/40 ml-1">
                  {catSeasons.length} season{catSeasons.length !== 1 ? 's' : ''}
                </span>
                {selectedCount > 0 && (
                  <span className="text-xs bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded-full">
                    {selectedCount} selected
                  </span>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="flex flex-wrap gap-2">
                {catSeasons.map((season) => (
                  <SeasonChip
                    key={season.id}
                    season={season}
                    isSelected={selectedSeasonIds.has(season.id)}
                    onToggle={() => onToggleSeason(season.id)}
                    healingProgress={healingProgressMap?.get(season.id) ?? 50}
                    onHealingChange={
                      onHealingProgressChange
                        ? (p) => onHealingProgressChange(season.id, p)
                        : undefined
                    }
                    showHealingSlider={showHealingSlider}
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
