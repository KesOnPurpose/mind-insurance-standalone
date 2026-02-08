/**
 * RIE Phase 2B: SeasonChip
 * Tappable chip for selecting a season. Shows healing slider when selected
 * in "past seasons" mode.
 */

import { Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import type { RelationshipSeasonCatalog } from '@/types/relationship-seasons';

// ============================================================================
// Healing Progress Helpers
// ============================================================================

function getHealingLabel(progress: number): string {
  if (progress <= 25) return 'Still raw';
  if (progress <= 50) return 'Processing';
  if (progress <= 75) return 'Mostly past it';
  return 'Fully resolved';
}

function getHealingColor(progress: number): string {
  if (progress <= 25) return 'text-red-400';
  if (progress <= 50) return 'text-amber-400';
  if (progress <= 75) return 'text-yellow-400';
  return 'text-emerald-400';
}

// ============================================================================
// Props
// ============================================================================

export interface SeasonChipProps {
  season: RelationshipSeasonCatalog;
  isSelected: boolean;
  onToggle: () => void;
  healingProgress?: number;
  onHealingChange?: (progress: number) => void;
  showHealingSlider?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function SeasonChip({
  season,
  isSelected,
  onToggle,
  healingProgress = 50,
  onHealingChange,
  showHealingSlider = false,
}: SeasonChipProps) {
  return (
    <div className="space-y-2">
      <Badge
        role="checkbox"
        aria-checked={isSelected}
        aria-label={`${season.season_name}${isSelected ? ' (selected)' : ''}`}
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
        className={`
          inline-flex items-center gap-1.5 px-3 py-2 min-h-[44px]
          cursor-pointer select-none transition-colors text-sm font-normal
          ${
            isSelected
              ? 'bg-rose-500/20 border-rose-400 text-rose-300 hover:bg-rose-500/30'
              : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white/80'
          }
        `}
        variant="outline"
      >
        {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
        {season.season_name}
      </Badge>

      {showHealingSlider && isSelected && (
        <div
          className="pl-2 pr-1 pb-1 space-y-1"
          aria-label={`Healing progress for ${season.season_name}`}
        >
          <Slider
            value={[healingProgress]}
            onValueChange={(val) => onHealingChange?.(val[0])}
            min={0}
            max={100}
            step={1}
            aria-label="Healing progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={healingProgress}
            className="w-full"
          />
          <div className="flex justify-between items-center text-xs">
            <span className={getHealingColor(healingProgress)}>
              {getHealingLabel(healingProgress)}
            </span>
            <span className="text-white/40">{healingProgress}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
