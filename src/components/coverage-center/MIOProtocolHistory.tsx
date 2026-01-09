/**
 * MIOProtocolHistory Component
 * Coverage Center - $100M Mind Insurance Feature
 *
 * Timeline display of completed and expired MIO protocols.
 * Shows pattern targeted, completion rate, and skip token earned status.
 */

import React, { useState } from 'react';
import {
  Brain,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Calendar,
  TrendingUp,
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

interface MIOProtocolHistoryProps {
  history: CoverageHistoryItem[];
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onViewProtocol?: (protocolId: string) => void;
  onCollapse?: () => void;
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
        color: 'text-mi-cyan',
        bgColor: 'bg-mi-cyan/10',
        label: 'Completed',
      };
    case 'active':
      return {
        icon: Clock,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        label: 'Active',
      };
    case 'expired':
      return {
        icon: XCircle,
        color: 'text-mi-gold',
        bgColor: 'bg-mi-gold/10',
        label: 'Expired',
      };
    case 'skipped':
      return {
        icon: XCircle,
        color: 'text-gray-400',
        bgColor: 'bg-mi-navy',
        label: 'Skipped',
      };
    case 'muted':
      return {
        icon: XCircle,
        color: 'text-gray-400',
        bgColor: 'bg-mi-navy',
        label: 'Muted',
      };
    default:
      return {
        icon: Clock,
        color: 'text-gray-400',
        bgColor: 'bg-mi-navy',
        label: status,
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

const DEFAULT_VISIBLE_COUNT = 3;

export function MIOProtocolHistory({
  history,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  onViewProtocol,
  onCollapse,
  className,
}: MIOProtocolHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Loading state
  if (isLoading && history.length === 0) {
    return <MIOProtocolHistorySkeleton className={className} />;
  }

  // Empty state
  if (history.length === 0) {
    return <MIOProtocolHistoryEmpty className={className} />;
  }

  // Determine which items to show
  const showExpandButton = history.length > DEFAULT_VISIBLE_COUNT;
  const visibleHistory = isExpanded ? history : history.slice(0, DEFAULT_VISIBLE_COUNT);
  const hiddenCount = history.length - DEFAULT_VISIBLE_COUNT;

  return (
    <Card className={cn('bg-mi-navy-light border-mi-cyan/20', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 text-white">
            <Brain className="h-5 w-5 text-purple-400" />
            Protocol History
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs border-mi-cyan/30 text-mi-cyan bg-mi-cyan/10">
              {history.length} protocol{history.length !== 1 ? 's' : ''}
            </Badge>
            {onCollapse && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onCollapse();
                }}
                className="text-gray-400 hover:text-white hover:bg-mi-navy h-7 px-2"
              >
                <ChevronUp className="h-4 w-4 mr-1" />
                Collapse
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {visibleHistory.map((item, index) => (
          <ProtocolHistoryItem
            key={item.protocol_id}
            item={item}
            isLast={index === visibleHistory.length - 1 && !showExpandButton}
            onClick={() => onViewProtocol?.(item.protocol_id)}
          />
        ))}

        {/* Expand/Collapse button */}
        {showExpandButton && (
          <Button
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full text-gray-400 hover:text-white hover:bg-mi-navy"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                Show {hiddenCount} More Protocol{hiddenCount !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        )}

        {/* Load more from server (when expanded and has more) */}
        {isExpanded && hasMore && (
          <Button
            variant="ghost"
            onClick={onLoadMore}
            disabled={isLoading}
            className="w-full text-mi-cyan hover:text-mi-cyan hover:bg-mi-cyan/10"
          >
            {isLoading ? 'Loading...' : 'Load More from History'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// HISTORY ITEM
// ============================================================================

function ProtocolHistoryItem({
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

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-3 rounded-lg border border-mi-cyan/20 bg-mi-navy',
        'text-left transition-all hover:bg-mi-navy-light',
        'focus:outline-none focus:ring-2 focus:ring-mi-cyan focus:ring-offset-2 focus:ring-offset-mi-navy',
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
              <h4 className="font-medium text-sm line-clamp-1 text-white">
                {item.protocol_title}
              </h4>
              <p className="text-xs text-gray-400 mt-0.5">
                {item.pattern_targeted}
              </p>
            </div>

            {/* Skip token earned */}
            {item.skip_token_earned && (
              <div className="flex-shrink-0">
                <Shield className="h-4 w-4 text-mi-cyan" />
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">
                {item.days_completed}/{item.total_days} days
              </span>
              <Badge
                variant="secondary"
                className={cn('text-xs bg-mi-navy border-mi-cyan/30', statusConfig.color)}
              >
                {statusConfig.label}
              </Badge>
            </div>
            <Progress
              value={item.completion_percentage}
              className="h-1.5 bg-mi-navy"
            />
          </div>

          {/* Date info */}
          {(item.started_at || item.completed_at) && (
            <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
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
        <ChevronRight className="h-4 w-4 text-gray-500 flex-shrink-0 mt-1" />
      </div>
    </button>
  );
}

// ============================================================================
// EMPTY STATE
// ============================================================================

function MIOProtocolHistoryEmpty({ className }: { className?: string }) {
  return (
    <Card className={cn('bg-mi-navy-light border-mi-cyan/20', className)}>
      <CardContent className="py-8 text-center">
        <div className="inline-flex p-3 rounded-full bg-mi-navy mb-4">
          <Brain className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="font-semibold mb-2 text-white">No Protocol History Yet</h3>
        <p className="text-sm text-gray-400 max-w-sm mx-auto">
          Complete your first 7-day protocol to start building your
          transformation timeline.
        </p>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// SKELETON
// ============================================================================

function MIOProtocolHistorySkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('bg-mi-navy-light border-mi-cyan/20', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-5 w-16" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-3 rounded-lg border border-mi-cyan/20 bg-mi-navy">
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
// COMPACT SUMMARY CARD
// ============================================================================

/**
 * Compact summary card for Protocol History
 * Shows protocol count and latest protocol preview
 * Click to expand to full history
 */
export function MIOProtocolHistoryCompact({
  history,
  isLoading = false,
  onExpand,
  className,
}: {
  history: CoverageHistoryItem[];
  isLoading?: boolean;
  onExpand: () => void;
  className?: string;
}) {
  // Loading state
  if (isLoading) {
    return <Skeleton className={cn('h-20 w-full rounded-lg bg-mi-navy-light', className)} />;
  }

  // Empty state - don't show if no history
  if (history.length === 0) {
    return null;
  }

  const completedCount = history.filter(p => p.status === 'completed').length;
  const latestProtocol = history[0];

  return (
    <Card
      className={cn(
        'bg-mi-navy-light border-mi-cyan/20 cursor-pointer transition-all hover:border-mi-cyan/40',
        className
      )}
      onClick={onExpand}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Brain className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h3 className="font-medium text-white">Protocol History</h3>
              <p className="text-sm text-gray-400">
                {completedCount} completed • {history.length} total
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {latestProtocol && (
              <div className="text-right hidden sm:block">
                <p className="text-xs text-gray-400 line-clamp-1 max-w-[150px]">
                  {latestProtocol.protocol_title}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDate(latestProtocol.completed_at || latestProtocol.created_at)}
                </p>
              </div>
            )}
            <ChevronRight className="h-5 w-5 text-gray-500" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// COMPACT TIMELINE
// ============================================================================

/**
 * Compact timeline for sidebar or mobile
 */
export function MIOProtocolTimeline({
  history,
  className,
}: {
  history: CoverageHistoryItem[];
  className?: string;
}) {
  if (history.length === 0) return null;

  return (
    <div className={cn('space-y-0', className)}>
      {history.slice(0, 5).map((item, index) => {
        const statusConfig = getStatusConfig(item.status);
        const StatusIcon = statusConfig.icon;
        const isLast = index === history.length - 1 || index === 4;

        return (
          <div key={item.protocol_id} className="flex items-start gap-3">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-3 h-3 rounded-full',
                  statusConfig.bgColor,
                  statusConfig.color
                )}
              >
                <StatusIcon className="h-3 w-3" />
              </div>
              {!isLast && (
                <div className="w-0.5 h-full min-h-[40px] bg-mi-cyan/20" />
              )}
            </div>

            {/* Content */}
            <div className="pb-4 flex-1 min-w-0">
              <p className="text-sm font-medium line-clamp-1 text-white">
                {item.protocol_title}
              </p>
              <p className="text-xs text-gray-400">
                {item.completion_percentage}% | {formatDate(item.created_at)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default MIOProtocolHistory;
