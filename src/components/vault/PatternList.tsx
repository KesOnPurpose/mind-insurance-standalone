import { PatternEntry } from '@/hooks/useVaultPractices';
import { PatternCard } from './PatternCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Brain } from 'lucide-react';

interface PatternListProps {
  patterns: PatternEntry[];
  isLoading: boolean;
}

/**
 * Loading skeleton for the pattern list
 */
function PatternListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-4 border rounded-lg">
          <div className="flex items-start gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-5 w-16" />
          </div>
          <div className="mt-3 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Empty state when no patterns exist
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
        <Brain className="w-8 h-8 text-blue-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No Patterns Yet</h3>
      <p className="text-muted-foreground max-w-sm">
        Your pattern check entries will appear here. Complete a Pattern Check practice to start tracking your awareness.
      </p>
    </div>
  );
}

/**
 * Component to display a list of pattern entries
 */
export function PatternList({ patterns, isLoading }: PatternListProps) {
  if (isLoading) {
    return <PatternListSkeleton />;
  }

  if (patterns.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-4">
      {patterns.map((pattern) => (
        <PatternCard key={pattern.id} pattern={pattern} />
      ))}
    </div>
  );
}

export default PatternList;
