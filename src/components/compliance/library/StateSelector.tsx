// ============================================================================
// STATE SELECTOR COMPONENT
// ============================================================================
// Grid of state cards for browsing the compliance library by state.
// Shows item counts and categories available for each state.
// ============================================================================

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, FileText, AlertTriangle } from 'lucide-react';
import type { LibraryStateOverview, StateCode } from '@/types/compliance';

// ============================================================================
// TYPES
// ============================================================================

export interface StateSelectorProps {
  states: LibraryStateOverview[];
  selectedState: StateCode | null;
  onSelectState: (state: StateCode) => void;
  isLoading?: boolean;
  className?: string;
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function StateSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {Array.from({ length: 10 }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full rounded-lg" />
      ))}
    </div>
  );
}

function StateCard({
  state,
  isSelected,
  onClick,
}: {
  state: LibraryStateOverview;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md hover:border-primary/50 ${
        isSelected ? 'border-primary ring-2 ring-primary/20' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">
                {state.state_code}
              </span>
            </div>
          </div>
          {state.critical_items > 0 && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {state.critical_items}
            </Badge>
          )}
        </div>
        <h3 className="font-medium text-sm truncate" title={state.state_name}>
          {state.state_name}
        </h3>
        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
          <FileText className="h-3 w-3" />
          <span>{state.total_items} items</span>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {state.categories.slice(0, 3).map((cat) => (
            <Badge
              key={cat.category_type}
              variant="secondary"
              className="text-[10px] px-1.5 py-0"
            >
              {cat.count}
            </Badge>
          ))}
          {state.categories.length > 3 && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              +{state.categories.length - 3}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function StateSelector({
  states,
  selectedState,
  onSelectState,
  isLoading = false,
  className = '',
}: StateSelectorProps) {
  if (isLoading) {
    return <StateSkeleton />;
  }

  if (states.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
            <MapPin className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="font-medium mb-1">No States Available</h3>
          <p className="text-sm text-muted-foreground">
            Compliance data is being loaded. Please check back later.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {states.map((state) => (
          <StateCard
            key={state.state_code}
            state={state}
            isSelected={selectedState === state.state_code}
            onClick={() => onSelectState(state.state_code)}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default StateSelector;
