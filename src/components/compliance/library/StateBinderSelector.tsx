// ============================================================================
// STATE BINDER SELECTOR COMPONENT
// ============================================================================
// Dropdown selector for choosing a state to view its compliance binder.
// Shows availability status, word counts, and last updated dates.
// ============================================================================

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Check,
  ChevronsUpDown,
  MapPin,
  FileText,
  Clock,
  Search,
  BookOpen,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StateCode, StateBinderOption } from '@/types/compliance';

// ============================================================================
// TYPES
// ============================================================================

export interface StateBinderSelectorProps {
  states: StateBinderOption[];
  selectedState: StateCode | null;
  onSelectState: (state: StateCode | null) => void;
  isLoading?: boolean;
  showUnavailable?: boolean;
  className?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatWordCount(count: number | undefined): string {
  if (!count) return '';
  return `${(count / 1000).toFixed(1)}k words`;
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function SelectorSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

function StateStats({
  totalStates,
  availableCount,
}: {
  totalStates: number;
  availableCount: number;
}) {
  return (
    <div className="flex items-center gap-4 text-sm text-muted-foreground py-2">
      <span className="flex items-center gap-1">
        <BookOpen className="h-4 w-4" />
        {availableCount} binders available
      </span>
      <span className="flex items-center gap-1">
        <MapPin className="h-4 w-4" />
        {totalStates} total states
      </span>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT - DROPDOWN VERSION
// ============================================================================

export function StateBinderSelector({
  states,
  selectedState,
  onSelectState,
  isLoading = false,
  showUnavailable = false,
  className = '',
}: StateBinderSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter states by availability and search query
  const { availableStates, unavailableStates, filteredStates } = useMemo(() => {
    const available = states.filter((s) => s.has_binder);
    const unavailable = states.filter((s) => !s.has_binder);

    const query = searchQuery.toLowerCase().trim();
    const filtered = query
      ? states.filter(
          (s) =>
            s.state_name.toLowerCase().includes(query) ||
            s.state_code.toLowerCase().includes(query)
        )
      : states;

    return {
      availableStates: available,
      unavailableStates: unavailable,
      filteredStates: filtered,
    };
  }, [states, searchQuery]);

  // Get selected state info
  const selectedStateInfo = useMemo(
    () => states.find((s) => s.state_code === selectedState),
    [states, selectedState]
  );

  if (isLoading) {
    return <SelectorSkeleton />;
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Stats bar */}
      <StateStats
        totalStates={states.length}
        availableCount={availableStates.length}
      />

      {/* Dropdown selector */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-12"
          >
            {selectedStateInfo ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">
                    {selectedStateInfo.state_code}
                  </span>
                </div>
                <div className="text-left">
                  <div className="font-medium">{selectedStateInfo.state_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {selectedStateInfo.has_binder
                      ? formatWordCount(selectedStateInfo.word_count)
                      : 'Binder unavailable'}
                  </div>
                </div>
              </div>
            ) : (
              <span className="text-muted-foreground">Select a state...</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[350px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search states..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>No state found.</CommandEmpty>

              {/* Available Binders */}
              <CommandGroup heading="Available Binders">
                {filteredStates
                  .filter((s) => s.has_binder)
                  .map((state) => (
                    <CommandItem
                      key={state.state_code}
                      value={`${state.state_name} ${state.state_code}`}
                      onSelect={() => {
                        onSelectState(state.state_code);
                        setOpen(false);
                        setSearchQuery('');
                      }}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-primary">
                            {state.state_code}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {state.state_name}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            {state.word_count && (
                              <span>{formatWordCount(state.word_count)}</span>
                            )}
                            {state.last_updated && (
                              <span>Updated {formatDate(state.last_updated)}</span>
                            )}
                          </div>
                        </div>
                        {selectedState === state.state_code && (
                          <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        )}
                      </div>
                    </CommandItem>
                  ))}
              </CommandGroup>

              {/* Unavailable Binders (optional) */}
              {showUnavailable && unavailableStates.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="Coming Soon">
                    {filteredStates
                      .filter((s) => !s.has_binder)
                      .slice(0, 10) // Limit to avoid overwhelming the list
                      .map((state) => (
                        <CommandItem
                          key={state.state_code}
                          value={`${state.state_name} ${state.state_code}`}
                          disabled
                          className="opacity-50"
                        >
                          <div className="flex items-center gap-3 w-full">
                            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-medium text-muted-foreground">
                                {state.state_code}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">
                                {state.state_name}
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Binder not yet available
                              </div>
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Quick access chips for popular states */}
      {!selectedState && availableStates.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground py-1">Quick access:</span>
          {availableStates.slice(0, 5).map((state) => (
            <Badge
              key={state.state_code}
              variant="outline"
              className="cursor-pointer hover:bg-primary/10 transition-colors"
              onClick={() => onSelectState(state.state_code)}
            >
              {state.state_code}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ALTERNATE VERSION - CARD GRID
// ============================================================================

export function StateBinderGrid({
  states,
  selectedState,
  onSelectState,
  isLoading = false,
  className = '',
}: Omit<StateBinderSelectorProps, 'showUnavailable'>) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  const availableStates = states.filter((s) => s.has_binder);

  if (availableStates.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
            <BookOpen className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="font-medium mb-1">No Binders Available</h3>
          <p className="text-sm text-muted-foreground">
            Compliance binders are being prepared. Check back soon.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <StateStats
        totalStates={states.length}
        availableCount={availableStates.length}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {availableStates.map((state) => (
          <Card
            key={state.state_code}
            className={cn(
              'cursor-pointer transition-all hover:shadow-md hover:border-primary/50',
              selectedState === state.state_code && 'border-primary ring-2 ring-primary/20'
            )}
            onClick={() => onSelectState(state.state_code)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">
                    {state.state_code}
                  </span>
                </div>
                {selectedState === state.state_code && (
                  <Check className="h-4 w-4 text-primary ml-auto" />
                )}
              </div>
              <h3 className="font-medium text-sm truncate" title={state.state_name}>
                {state.state_name}
              </h3>
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <FileText className="h-3 w-3" />
                <span>{formatWordCount(state.word_count) || 'Binder ready'}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default StateBinderSelector;
