import { VictoryEntry } from '@/hooks/useVaultPractices';
import { VictoryCard } from './VictoryCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy } from 'lucide-react';

interface VictoryListProps {
  victories: VictoryEntry[];
  isLoading: boolean;
}

/**
 * Loading skeleton for the victory list
 */
function VictoryListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-4 border border-mi-gold/20 rounded-lg bg-mi-navy-light">
          <div className="flex items-start gap-3">
            <Skeleton className="h-10 w-10 rounded-full bg-mi-navy" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-28 bg-mi-navy" />
              <Skeleton className="h-4 w-24 bg-mi-navy" />
            </div>
          </div>
          <div className="mt-3 space-y-3">
            <div className="space-y-1">
              <Skeleton className="h-3 w-24 bg-mi-navy" />
              <Skeleton className="h-4 w-full bg-mi-navy" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-3 w-20 bg-mi-navy" />
              <Skeleton className="h-4 w-3/4 bg-mi-navy" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Empty state when no victories exist
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-mi-gold/20 flex items-center justify-center mb-4">
        <Trophy className="w-8 h-8 text-mi-gold" />
      </div>
      <h3 className="text-lg font-medium text-white mb-2">No Victories Yet</h3>
      <p className="text-gray-400 max-w-sm">
        Your celebrations and wins will appear here. Complete a Celebrate Wins practice to start logging your victories.
      </p>
    </div>
  );
}

/**
 * Component to display a list of victory entries
 */
export function VictoryList({ victories, isLoading }: VictoryListProps) {
  if (isLoading) {
    return <VictoryListSkeleton />;
  }

  if (victories.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-4">
      {victories.map((victory) => (
        <VictoryCard key={victory.id} victory={victory} />
      ))}
    </div>
  );
}

export default VictoryList;
