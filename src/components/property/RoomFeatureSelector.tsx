// ============================================================================
// ROOM FEATURE SELECTOR COMPONENT
// ============================================================================
// Visual checkbox selector for room features (PadSplit-inspired)
// Replaces comma-separated text input with categorized checkboxes
// ============================================================================

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { RoomFeature } from '@/types/property';
import { ROOM_FEATURE_LABELS } from '@/types/property';

// ============================================================================
// TYPES
// ============================================================================

export interface RoomFeatureSelectorProps {
  selectedFeatures: RoomFeature[];
  onChange: (features: RoomFeature[]) => void;
  showPriceSuggestions?: boolean;
  disabled?: boolean;
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Feature categories for visual grouping
const FEATURE_CATEGORIES: Record<string, { label: string; features: RoomFeature[] }> = {
  bathroom: {
    label: 'Bathroom',
    features: ['private_bath', 'shared_bath', 'near_bathroom'],
  },
  entry: {
    label: 'Entry & Access',
    features: ['separate_entry', 'ground_floor', 'wheelchair_accessible'],
  },
  storage: {
    label: 'Storage',
    features: ['walk_in_closet', 'closet'],
  },
  comfort: {
    label: 'Comfort',
    features: ['window_ac', 'ceiling_fan', 'furnished'],
  },
  size: {
    label: 'Size',
    features: ['large', 'small'],
  },
  location: {
    label: 'Location',
    features: ['near_kitchen'],
  },
};

// Price impact suggestions (for SSI max rate context)
// Based on PadSplit research - premium features command higher rates
const FEATURE_PRICE_IMPACT: Record<RoomFeature, number> = {
  private_bath: 100,       // +$100/month - highest premium
  separate_entry: 75,      // +$75/month - privacy premium
  furnished: 50,           // +$50/month
  large: 50,               // +$50/month
  walk_in_closet: 25,      // +$25/month
  wheelchair_accessible: 25, // +$25/month - accessibility premium
  ground_floor: 15,        // +$15/month - accessibility
  window_ac: 25,           // +$25/month - comfort
  ceiling_fan: 10,         // +$10/month
  closet: 0,               // Standard feature
  shared_bath: 0,          // Standard (no premium)
  near_kitchen: 0,         // Convenience, no premium
  near_bathroom: 0,        // Convenience, no premium
  small: -25,              // -$25/month - discount
};

// Mutually exclusive feature groups
const MUTUALLY_EXCLUSIVE: RoomFeature[][] = [
  ['private_bath', 'shared_bath'],
  ['large', 'small'],
  ['walk_in_closet', 'closet'],
];

// ============================================================================
// COMPONENT
// ============================================================================

export function RoomFeatureSelector({
  selectedFeatures,
  onChange,
  showPriceSuggestions = false,
  disabled = false,
  className,
}: RoomFeatureSelectorProps) {
  // Handle feature toggle with mutual exclusion
  const handleFeatureToggle = (feature: RoomFeature) => {
    if (disabled) return;

    const isSelected = selectedFeatures.includes(feature);

    if (isSelected) {
      // Remove the feature
      onChange(selectedFeatures.filter((f) => f !== feature));
    } else {
      // Add the feature, removing any mutually exclusive features
      let newFeatures = [...selectedFeatures, feature];

      // Check mutual exclusion
      for (const exclusiveGroup of MUTUALLY_EXCLUSIVE) {
        if (exclusiveGroup.includes(feature)) {
          // Remove other features in this group
          newFeatures = newFeatures.filter(
            (f) => !exclusiveGroup.includes(f) || f === feature
          );
        }
      }

      onChange(newFeatures);
    }
  };

  // Calculate total price impact
  const totalPriceImpact = selectedFeatures.reduce(
    (sum, feature) => sum + FEATURE_PRICE_IMPACT[feature],
    0
  );

  return (
    <div className={cn('space-y-4', className)}>
      {/* Feature Categories */}
      <TooltipProvider delayDuration={300}>
        <div className="space-y-4">
          {Object.entries(FEATURE_CATEGORIES).map(([categoryKey, category]) => (
            <div key={categoryKey}>
              <Label className="text-xs text-muted-foreground mb-2 block">
                {category.label}
              </Label>
              <div className="flex flex-wrap gap-2">
                {category.features.map((feature) => {
                  const isSelected = selectedFeatures.includes(feature);
                  const priceImpact = FEATURE_PRICE_IMPACT[feature];
                  const label = ROOM_FEATURE_LABELS[feature];

                  // Check if mutually exclusive with a selected feature
                  const exclusiveGroup = MUTUALLY_EXCLUSIVE.find((group) =>
                    group.includes(feature)
                  );
                  const hasExclusiveSelected =
                    exclusiveGroup &&
                    selectedFeatures.some(
                      (f) => exclusiveGroup.includes(f) && f !== feature
                    );

                  return (
                    <Tooltip key={feature}>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            'flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all',
                            isSelected
                              ? 'bg-primary/10 border-primary'
                              : 'bg-background border-border hover:border-primary/50',
                            disabled && 'opacity-50 cursor-not-allowed',
                            hasExclusiveSelected && !isSelected && 'opacity-40'
                          )}
                          onClick={() => handleFeatureToggle(feature)}
                        >
                          <Checkbox
                            checked={isSelected}
                            disabled={disabled}
                            className="pointer-events-none"
                          />
                          <span className="text-sm whitespace-nowrap">
                            {label}
                          </span>
                          {showPriceSuggestions && priceImpact !== 0 && (
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-xs ml-1',
                                priceImpact > 0
                                  ? 'text-green-600 border-green-200'
                                  : 'text-red-600 border-red-200'
                              )}
                            >
                              {priceImpact > 0 ? '+' : ''}${priceImpact}
                            </Badge>
                          )}
                        </div>
                      </TooltipTrigger>
                      {showPriceSuggestions && priceImpact !== 0 && (
                        <TooltipContent>
                          <p>
                            {priceImpact > 0
                              ? `Premium feature: +$${priceImpact}/month`
                              : `Discount: $${priceImpact}/month`}
                          </p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </TooltipProvider>

      {/* Price Impact Summary */}
      {showPriceSuggestions && selectedFeatures.length > 0 && (
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Suggested Rate Adjustment:</span>
            <span
              className={cn(
                'font-medium',
                totalPriceImpact > 0
                  ? 'text-green-600'
                  : totalPriceImpact < 0
                  ? 'text-red-600'
                  : 'text-muted-foreground'
              )}
            >
              {totalPriceImpact > 0 ? '+' : ''}${totalPriceImpact}/month
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Based on typical market premiums for selected features
          </p>
        </div>
      )}

      {/* Selected Features Summary */}
      {selectedFeatures.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedFeatures.map((feature) => (
            <Badge
              key={feature}
              variant="secondary"
              className="text-xs cursor-pointer hover:bg-destructive/20"
              onClick={() => handleFeatureToggle(feature)}
            >
              {ROOM_FEATURE_LABELS[feature]}
              <span className="ml-1 opacity-60">×</span>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default RoomFeatureSelector;
