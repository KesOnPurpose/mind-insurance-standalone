// ============================================================================
// STATE SELECTOR COMPONENT
// ============================================================================
// Multi-select component for choosing 2-3 states to compare side-by-side.
// Uses a combobox pattern with clear state management.
// ============================================================================

import { useState } from 'react';
import { Check, ChevronsUpDown, X, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { type StateCode, STATE_NAMES } from '@/types/compliance';

// ============================================================================
// TYPES
// ============================================================================

export interface StateSelectorProps {
  selectedStates: StateCode[];
  onStateChange: (states: StateCode[]) => void;
  maxStates?: number;
  minStates?: number;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

// ============================================================================
// STATE OPTIONS
// ============================================================================

const STATE_OPTIONS: { value: StateCode; label: string }[] = Object.entries(STATE_NAMES).map(
  ([code, name]) => ({
    value: code as StateCode,
    label: `${name} (${code})`,
  })
);

// Popular states for quick selection
const POPULAR_STATES: StateCode[] = ['TX', 'CA', 'FL', 'GA', 'AZ', 'NC', 'OH', 'PA', 'IL', 'MI'];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function StateSelector({
  selectedStates,
  onStateChange,
  maxStates = 3,
  minStates = 2,
  className = '',
  disabled = false,
  placeholder = 'Select states to compare...',
}: StateSelectorProps) {
  const [open, setOpen] = useState(false);

  // Add a state to selection
  const handleAddState = (state: StateCode) => {
    if (selectedStates.includes(state)) {
      // Remove if already selected
      onStateChange(selectedStates.filter((s) => s !== state));
    } else if (selectedStates.length < maxStates) {
      // Add if under limit
      onStateChange([...selectedStates, state]);
    }
  };

  // Remove a state from selection
  const handleRemoveState = (state: StateCode) => {
    onStateChange(selectedStates.filter((s) => s !== state));
  };

  // Clear all selections
  const handleClearAll = () => {
    onStateChange([]);
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Selected States Display */}
      {selectedStates.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedStates.map((state) => (
            <Badge
              key={state}
              variant="secondary"
              className="px-3 py-1.5 text-sm flex items-center gap-1.5"
            >
              <MapPin className="h-3 w-3" />
              {STATE_NAMES[state]}
              <button
                onClick={() => handleRemoveState(state)}
                className="ml-1 hover:bg-muted rounded-full p-0.5"
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {selectedStates.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="h-7 px-2 text-xs text-muted-foreground"
              disabled={disabled}
            >
              Clear all
            </Button>
          )}
        </div>
      )}

      {/* State Selector Combobox */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled || selectedStates.length >= maxStates}
          >
            {selectedStates.length >= maxStates ? (
              <span className="text-muted-foreground">
                Maximum {maxStates} states selected
              </span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search states..." />
            <CommandList>
              <CommandEmpty>No state found.</CommandEmpty>

              {/* Popular States */}
              <CommandGroup heading="Popular States">
                {POPULAR_STATES.filter((s) => !selectedStates.includes(s)).map(
                  (state) => (
                    <CommandItem
                      key={state}
                      value={`${STATE_NAMES[state]} ${state}`}
                      onSelect={() => handleAddState(state)}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          selectedStates.includes(state)
                            ? 'opacity-100'
                            : 'opacity-0'
                        )}
                      />
                      {STATE_NAMES[state]} ({state})
                    </CommandItem>
                  )
                )}
              </CommandGroup>

              {/* All States */}
              <CommandGroup heading="All States">
                {STATE_OPTIONS.filter(
                  (opt) =>
                    !POPULAR_STATES.includes(opt.value) &&
                    !selectedStates.includes(opt.value)
                ).map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => handleAddState(option.value)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        selectedStates.includes(option.value)
                          ? 'opacity-100'
                          : 'opacity-0'
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Helper Text */}
      <p className="text-xs text-muted-foreground">
        Select {minStates} to {maxStates} states to compare requirements
        {selectedStates.length > 0 && (
          <span className="ml-1">
            ({selectedStates.length}/{maxStates} selected)
          </span>
        )}
      </p>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default StateSelector;
