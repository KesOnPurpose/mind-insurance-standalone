// ============================================================================
// LOCAL BINDER LIST COMPONENT
// ============================================================================
// Displays a list of available local compliance binders (cities and counties)
// for a given state. Can be used standalone or within the FullBinderReader.
// ============================================================================

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Building2,
  MapPinned,
  ChevronRight,
  Search,
  Filter,
  Loader2,
  Landmark,
} from 'lucide-react';
import type { LocalBinder, StateCode, LocationType } from '@/types/compliance';
import { STATE_NAMES } from '@/types/compliance';
import {
  getLocationsForState,
  getLocationsWithBinders,
  getLocalBinderStats,
} from '@/services/localBinderService';

// ============================================================================
// TYPES
// ============================================================================

export interface LocalBinderListProps {
  /** State code to filter local binders by. If not provided, shows all. */
  stateCode?: StateCode;
  /** Callback when a local binder is selected */
  onBinderSelect?: (binder: LocalBinder) => void;
  /** Custom class name */
  className?: string;
  /** Show compact view */
  compact?: boolean;
  /** Filter by location type */
  locationType?: LocationType;
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function LocalBinderSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`space-y-3 ${compact ? '' : 'p-4'}`}>
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ stateName }: { stateName?: string }) {
  return (
    <div className="text-center py-8">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
        <MapPinned className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">No Local Binders</h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        {stateName
          ? `No city or county binders are available for ${stateName} yet.`
          : 'No local compliance binders are available.'}
      </p>
      <p className="text-xs text-muted-foreground mt-2">
        Local binders provide city and county-specific guidance.
      </p>
    </div>
  );
}

interface LocalBinderItemProps {
  binder: LocalBinder;
  onSelect?: (binder: LocalBinder) => void;
  compact?: boolean;
}

function LocalBinderItem({ binder, onSelect, compact = false }: LocalBinderItemProps) {
  const isCity = binder.location_type === 'city';
  const isCounty = binder.location_type === 'county';
  const isState = binder.location_type === 'state';
  const stateName = STATE_NAMES[binder.state_code] || binder.state_code;

  // Determine icon and colors based on location type
  const getIconAndColors = () => {
    if (isCity) {
      return {
        icon: Building2,
        bgClass: 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
        label: 'City',
      };
    }
    if (isCounty) {
      return {
        icon: MapPinned,
        bgClass: 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
        label: 'County',
      };
    }
    // State
    return {
      icon: Landmark,
      bgClass: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
      label: 'State',
    };
  };

  const { icon: Icon, bgClass, label } = getIconAndColors();

  return (
    <button
      onClick={() => onSelect?.(binder)}
      className={`flex items-start gap-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors text-left w-full group ${
        compact ? 'p-2' : 'p-3'
      }`}
    >
      <div
        className={`flex items-center justify-center rounded-lg flex-shrink-0 ${
          compact ? 'w-8 h-8' : 'w-10 h-10'
        } ${bgClass}`}
      >
        <Icon className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`font-medium truncate ${compact ? 'text-sm' : 'text-sm'}`}>
            {binder.location_name}
          </span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {label}
          </Badge>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {/* For state binders, don't show the state name twice */}
          {!isState && (
            <span className="text-xs text-muted-foreground">{stateName}</span>
          )}
          {!compact && (
            <>
              {!isState && <span className="text-xs text-muted-foreground">•</span>}
              <span className="text-xs text-muted-foreground">
                {binder.word_count?.toLocaleString() || 0} words
              </span>
            </>
          )}
        </div>
      </div>

      <ChevronRight
        className={`text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0 ${
          compact ? 'h-4 w-4 mt-2' : 'h-4 w-4 mt-3'
        }`}
      />
    </button>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function LocalBinderList({
  stateCode,
  onBinderSelect,
  className = '',
  compact = false,
  locationType,
}: LocalBinderListProps) {
  const [binders, setBinders] = useState<LocalBinder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filter, setFilter] = useState<LocationType | 'all'>('all');

  // Fetch binders
  useEffect(() => {
    const fetchBinders = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (stateCode) {
          const data = await getLocationsForState(stateCode);
          setBinders(data);
        } else {
          const options = await getLocationsWithBinders();
          // Convert options to LocalBinder-like objects for display
          // Note: This is a simplified view - full content requires getLocalBinder
          setBinders(
            options.map((opt) => ({
              id: `${opt.state_code}-${opt.location_name}`,
              location_name: opt.location_name,
              location_type: opt.location_type,
              state_code: opt.state_code,
              title: `${opt.location_name}, ${opt.state_code} Compliance Binder`,
              content: '', // Not loaded in list view
              word_count: opt.word_count ?? null,
              section_headers: [],
              metadata: {},
              created_at: '',
              updated_at: '',
            }))
          );
        }
      } catch (err) {
        console.error('[LocalBinderList] Error fetching binders:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBinders();
  }, [stateCode]);

  // Filter binders
  const filteredBinders = binders.filter((b) => {
    if (locationType) return b.location_type === locationType;
    if (filter === 'all') return true;
    return b.location_type === filter;
  });

  // Group by state if no specific state filter
  const groupedBinders = !stateCode
    ? filteredBinders.reduce((acc, binder) => {
        const state = binder.state_code;
        if (!acc[state]) acc[state] = [];
        acc[state].push(binder);
        return acc;
      }, {} as Record<string, LocalBinder[]>)
    : null;

  const stateName = stateCode ? STATE_NAMES[stateCode] : undefined;

  // Loading state
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPinned className="h-5 w-5" />
            {stateName ? `${stateName} Local Binders` : 'Local Binders'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LocalBinderSkeleton compact={compact} />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={`border-destructive ${className}`}>
        <CardContent className="py-6 text-center">
          <p className="text-destructive font-medium">Error loading local binders</p>
          <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (filteredBinders.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPinned className="h-5 w-5" />
            {stateName ? `${stateName} Local Binders` : 'Local Binders'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState stateName={stateName} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPinned className="h-5 w-5 text-primary" />
            {stateName ? `${stateName} Local Binders` : 'All Local Binders'}
          </CardTitle>
          <Badge variant="secondary">{filteredBinders.length}</Badge>
        </div>

        {/* Filter buttons (only if no external locationType filter) */}
        {!locationType && binders.length > 1 && (
          <div className="flex gap-2 mt-2 flex-wrap">
            <Button
              variant={filter === 'all' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setFilter('all')}
              className="text-xs h-7"
            >
              All
            </Button>
            <Button
              variant={filter === 'state' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setFilter('state')}
              className="text-xs h-7"
            >
              <Landmark className="h-3 w-3 mr-1" />
              States
            </Button>
            <Button
              variant={filter === 'city' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setFilter('city')}
              className="text-xs h-7"
            >
              <Building2 className="h-3 w-3 mr-1" />
              Cities
            </Button>
            <Button
              variant={filter === 'county' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setFilter('county')}
              className="text-xs h-7"
            >
              <MapPinned className="h-3 w-3 mr-1" />
              Counties
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-2">
        {stateCode ? (
          // Single state view - flat list
          <div className={`space-y-2 ${compact ? '' : 'grid gap-2 sm:grid-cols-2'}`}>
            {filteredBinders.map((binder) => (
              <LocalBinderItem
                key={binder.id}
                binder={binder}
                onSelect={onBinderSelect}
                compact={compact}
              />
            ))}
          </div>
        ) : (
          // All states view - grouped
          <div className="space-y-4">
            {Object.entries(groupedBinders || {})
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([state, stateBinders]) => (
                <div key={state}>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    {STATE_NAMES[state as StateCode] || state}
                  </h4>
                  <div className="space-y-2">
                    {stateBinders.map((binder) => (
                      <LocalBinderItem
                        key={binder.id}
                        binder={binder}
                        onSelect={onBinderSelect}
                        compact={compact}
                      />
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default LocalBinderList;
