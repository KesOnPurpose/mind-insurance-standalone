// ============================================================================
// VAPI CALL HISTORY
// Displays a list of call logs with pagination and refresh
// Mobile-first, pull-to-refresh capable, accessible design
// ============================================================================

import { useCallback, useRef, useEffect, useState } from 'react';
import { RefreshCw, Phone, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { VapiVoiceCallCard } from './VapiVoiceCallCard';
import { useVapiCallHistory } from '@/hooks/useVapiCallHistory';
import type { VapiCallLog } from '@/services/vapiService';

// ============================================================================
// TYPES
// ============================================================================

interface VapiCallHistoryProps {
  userId: string;
  userName?: string | null;  // User's first name for transcript/summary name correction
  pageSize?: number;
  className?: string;
  title?: string;
  showHeader?: boolean;
}

// ============================================================================
// LOADING SKELETON COMPONENT
// ============================================================================

const CallCardSkeleton = () => (
  <Card className="overflow-hidden">
    <CardContent className="p-4">
      {/* Header skeleton */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex flex-col gap-1">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>

      {/* Topics skeleton */}
      <div className="flex gap-1.5 mb-3">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-18 rounded-full" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>

      {/* Summary skeleton */}
      <div className="space-y-2 mb-3">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>

      {/* Actions skeleton */}
      <div className="flex gap-2 pt-3 border-t">
        <Skeleton className="h-8 w-16 rounded-md" />
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>
    </CardContent>
  </Card>
);

// ============================================================================
// EMPTY STATE COMPONENT
// ============================================================================

const EmptyState = () => (
  <Card className="overflow-hidden">
    <CardContent className="p-8 flex flex-col items-center justify-center text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Phone className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-medium mb-2">No calls yet</h3>
      <p className="text-sm text-muted-foreground max-w-[280px]">
        Start a conversation with Nette to see your call history here.
      </p>
    </CardContent>
  </Card>
);

// ============================================================================
// ERROR STATE COMPONENT
// ============================================================================

interface ErrorStateProps {
  error: Error;
  onRetry: () => void;
}

const ErrorState = ({ error, onRetry }: ErrorStateProps) => (
  <Card className="overflow-hidden border-destructive/50">
    <CardContent className="p-6 flex flex-col items-center justify-center text-center">
      <p className="text-sm text-destructive mb-4">
        Failed to load call history: {error.message}
      </p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Try Again
      </Button>
    </CardContent>
  </Card>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const VapiCallHistory = ({
  userId,
  userName,
  pageSize = 10,
  className,
  title = 'Call History',
  showHeader = true
}: VapiCallHistoryProps) => {
  const {
    calls,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
    getCallDetail,
    hideCall
  } = useVapiCallHistory({ userId, pageSize });

  // Pull-to-refresh state
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number>(0);
  const pullThreshold = 80; // pixels

  // Handle manual refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [refresh]);

  // Handle load transcript callback for lazy loading
  const handleLoadTranscript = useCallback(async (vapiCallId: string): Promise<VapiCallLog | null> => {
    return getCallDetail(vapiCallId);
  }, [getCallDetail]);

  // Handle hide call callback
  const handleHideCall = useCallback(async (callId: string): Promise<void> => {
    await hideCall(callId);
  }, [hideCall]);

  // Pull-to-refresh touch handlers (mobile)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Only trigger if at top of scroll
      if (container.scrollTop === 0) {
        startYRef.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (startYRef.current === 0) return;

      const currentY = e.touches[0].clientY;
      const diff = currentY - startYRef.current;

      if (diff > 0 && container.scrollTop === 0) {
        setIsPulling(diff > pullThreshold);
      }
    };

    const handleTouchEnd = async () => {
      if (isPulling && !isRefreshing) {
        await handleRefresh();
      }
      setIsPulling(false);
      startYRef.current = 0;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPulling, isRefreshing, handleRefresh]);

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="h-8 gap-1.5"
            aria-label="Refresh call history"
          >
            <RefreshCw
              className={cn('h-4 w-4', (isRefreshing || isLoading) && 'animate-spin')}
              aria-hidden="true"
            />
            <span className="sr-only md:not-sr-only">Refresh</span>
          </Button>
        </div>
      )}

      {/* Pull-to-refresh indicator (mobile) */}
      {isPulling && (
        <div className="flex items-center justify-center py-3 text-sm text-muted-foreground">
          <RefreshCw className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
          Release to refresh
        </div>
      )}

      {/* Call List Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto"
        role="region"
        aria-label="Call history list"
        aria-busy={isLoading}
      >
        {/* Loading State */}
        {isLoading && (
          <div className="space-y-3" aria-label="Loading call history">
            <CallCardSkeleton />
            <CallCardSkeleton />
            <CallCardSkeleton />
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <ErrorState error={error} onRetry={handleRefresh} />
        )}

        {/* Empty State */}
        {!isLoading && !error && calls.length === 0 && (
          <EmptyState />
        )}

        {/* Call Cards List */}
        {!isLoading && !error && calls.length > 0 && (
          <div className="space-y-3" role="list">
            {calls.map((call) => (
              <VapiVoiceCallCard
                key={call.id}
                call={call}
                userName={userName}
                onLoadTranscript={handleLoadTranscript}
                onHideCall={handleHideCall}
              />
            ))}
          </div>
        )}

        {/* Load More Button */}
        {!isLoading && !error && hasMore && calls.length > 0 && (
          <div className="flex justify-center mt-4 pb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={loadMore}
              disabled={isLoadingMore}
              className="min-w-[120px]"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                  Loading...
                </>
              ) : (
                'Load More'
              )}
            </Button>
          </div>
        )}

        {/* End of List Indicator */}
        {!isLoading && !error && !hasMore && calls.length > 0 && (
          <p className="text-center text-xs text-muted-foreground py-4">
            No more calls to load
          </p>
        )}
      </div>
    </div>
  );
};

export default VapiCallHistory;
