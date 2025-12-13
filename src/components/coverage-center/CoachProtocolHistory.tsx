/**
 * CoachProtocolHistory Component
 * Coverage Center - $100M Mind Insurance Feature
 *
 * Timeline display of completed Coach protocols.
 */

import React from 'react';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  Calendar,
  Award,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import type { CoverageHistoryItem } from '@/types/coverage';

// ============================================================================
// TYPES
// ============================================================================

interface CoachProtocolHistoryProps {
  history: CoverageHistoryItem[];
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onViewProtocol?: (protocolId: string) => void;
  className?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getStatusConfig(status: CoverageHistoryItem['status']) {
  switch (status) {
    case 'completed':
      return {
        icon: CheckCircle2,
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
        label: 'Completed',
      };
    case 'active':
      return {
        icon: Clock,
        color: 'text-blue-500',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        label: 'Active',
      };
    default:
      return {
        icon: XCircle,
        color: 'text-muted-foreground',
        bgColor: 'bg-muted',
        label: status.charAt(0).toUpperCase() + status.slice(1),
      };
  }
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CoachProtocolHistory({
  history,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  onViewProtocol,
  className,
}: CoachProtocolHistoryProps) {
  // Loading state
  if (isLoading && history.length === 0) {
    return <CoachProtocolHistorySkeleton className={className} />;
  }

  // Empty state
  if (history.length === 0) {
    return <CoachProtocolHistoryEmpty className={className} />;
  }

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            Coach Protocol History
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {history.length} completed
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {history.map((item, index) => (
          <CoachHistoryItem
            key={item.protocol_id}
            item={item}
            isLast={index === history.length - 1}
            onClick={() => onViewProtocol?.(item.protocol_id)}
          />
        ))}

        {/* Load more */}
        {hasMore && (
          <Button
            variant="ghost"
            onClick={onLoadMore}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Loading...' : 'Load More'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// HISTORY ITEM
// ============================================================================

function CoachHistoryItem({
  item,
  isLast,
  onClick,
}: {
  item: CoverageHistoryItem;
  isLast: boolean;
  onClick?: () => void;
}) {
  const statusConfig = getStatusConfig(item.status);
  const StatusIcon = statusConfig.icon;
  const weeksCompleted = Math.ceil(item.days_completed / 7);
  const totalWeeks = Math.ceil(item.total_days / 7);

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-3 rounded-lg border border-border bg-card',
        'text-left transition-all hover:bg-muted/50',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        !isLast && 'mb-2'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Status icon */}
        <div
          className={cn(
            'p-2 rounded-full flex-shrink-0',
            statusConfig.bgColor
          )}
        >
          <StatusIcon className={cn('h-4 w-4', statusConfig.color)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="font-medium text-sm line-clamp-1">
                {item.protocol_title}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {totalWeeks} week program
              </p>
            </div>

            {/* Completion badge */}
            {item.status === 'completed' && (
              <Award className="h-4 w-4 text-amber-500 flex-shrink-0" />
            )}
          </div>

          {/* Progress bar */}
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Week {weeksCompleted}/{totalWeeks}
              </span>
              <Badge
                variant="secondary"
                className={cn('text-xs', statusConfig.color)}
              >
                {statusConfig.label}
              </Badge>
            </div>
            <Progress value={item.completion_percentage} className="h-1.5" />
          </div>

          {/* Date info */}
          {(item.started_at || item.completed_at) && (
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>
                {item.completed_at
                  ? `Completed ${formatDate(item.completed_at)}`
                  : `Started ${formatDate(item.started_at)}`}
              </span>
            </div>
          )}
        </div>

        {/* Arrow */}
        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
      </div>
    </button>
  );
}

// ============================================================================
// EMPTY STATE
// ============================================================================

function CoachProtocolHistoryEmpty({ className }: { className?: string }) {
  return (
    <Card className={cn(className)}>
      <CardContent className="py-8 text-center">
        <div className="inline-flex p-3 rounded-full bg-muted mb-4">
          <Users className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold mb-2">No Coach Protocols Yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Your coach can assign multi-week protocols that complement
          your MIO coverage. Check back after your coach assigns one!
        </p>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// SKELETON
// ============================================================================

function CoachProtocolHistorySkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-5 w-20" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="p-3 rounded-lg border border-border">
            <div className="flex items-start gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-5 w-3/4 mb-1" />
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-1.5 w-full" />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// COMPACT TIMELINE
// ============================================================================

/**
 * Compact timeline for sidebar
 */
export function CoachProtocolTimeline({
  history,
  className,
}: {
  history: CoverageHistoryItem[];
  className?: string;
}) {
  if (history.length === 0) return null;

  return (
    <div className={cn('space-y-0', className)}>
      {history.slice(0, 3).map((item, index) => {
        const statusConfig = getStatusConfig(item.status);
        const StatusIcon = statusConfig.icon;
        const isLast = index === history.length - 1 || index === 2;

        return (
          <div key={item.protocol_id} className="flex items-start gap-3">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-3 h-3 rounded-full flex items-center justify-center',
                  statusConfig.bgColor
                )}
              >
                <StatusIcon className={cn('h-2 w-2', statusConfig.color)} />
              </div>
              {!isLast && (
                <div className="w-0.5 h-full min-h-[40px] bg-border" />
              )}
            </div>

            {/* Content */}
            <div className="pb-4 flex-1 min-w-0">
              <p className="text-sm font-medium line-clamp-1">
                {item.protocol_title}
              </p>
              <p className="text-xs text-muted-foreground">
                {item.completion_percentage}% • {formatDate(item.created_at)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default CoachProtocolHistory;
