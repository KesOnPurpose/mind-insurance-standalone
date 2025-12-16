/**
 * CoachProtocolHistory Component
 * Coverage Center - $100M Mind Insurance Feature
 *
 * Timeline display of completed Coach protocols.
 */

import React, { useState } from 'react';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  ChevronDown,
  ChevronUp,
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
    default:
      return {
        icon: XCircle,
        color: 'text-gray-400',
        bgColor: 'bg-mi-navy',
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

const DEFAULT_VISIBLE_COUNT = 3;

export function CoachProtocolHistory({
  history,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  onViewProtocol,
  className,
}: CoachProtocolHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Loading state
  if (isLoading && history.length === 0) {
    return <CoachProtocolHistorySkeleton className={className} />;
  }

  // Empty state
  if (history.length === 0) {
    return <CoachProtocolHistoryEmpty className={className} />;
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
            <Users className="h-5 w-5 text-blue-400" />
            Coach Protocol History
          </CardTitle>
          <Badge variant="outline" className="text-xs border-mi-cyan/30 text-mi-cyan bg-mi-cyan/10">
            {history.length} completed
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {visibleHistory.map((item, index) => (
          <CoachHistoryItem
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

  const isClickable = Boolean(onClick);

  return (
    <div
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={isClickable ? (e) => e.key === 'Enter' && onClick?.() : undefined}
      className={cn(
        'w-full p-3 rounded-lg border border-mi-cyan/20 bg-mi-navy',
        'text-left transition-all',
        isClickable && 'cursor-pointer hover:bg-mi-navy-light focus:outline-none focus:ring-2 focus:ring-mi-cyan focus:ring-offset-2 focus:ring-offset-mi-navy',
        !isClickable && 'cursor-default',
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
                {totalWeeks} week program
              </p>
            </div>

            {/* Completion badge */}
            {item.status === 'completed' && (
              <Award className="h-4 w-4 text-mi-gold flex-shrink-0" />
            )}
          </div>

          {/* Progress bar */}
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">
                Week {weeksCompleted}/{totalWeeks}
              </span>
              <Badge
                variant="secondary"
                className={cn('text-xs bg-mi-navy border-mi-cyan/30', statusConfig.color)}
              >
                {statusConfig.label}
              </Badge>
            </div>
            <Progress value={item.completion_percentage} className="h-1.5 bg-mi-navy" />
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

        {/* Arrow - only show if clickable */}
        {isClickable && (
          <ChevronRight className="h-4 w-4 text-gray-500 flex-shrink-0 mt-1" />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// EMPTY STATE
// ============================================================================

function CoachProtocolHistoryEmpty({ className }: { className?: string }) {
  return (
    <Card className={cn('bg-mi-navy-light border-mi-cyan/20', className)}>
      <CardContent className="py-8 text-center">
        <div className="inline-flex p-3 rounded-full bg-mi-navy mb-4">
          <Users className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="font-semibold mb-2 text-white">No Coach Protocols Yet</h3>
        <p className="text-sm text-gray-400 max-w-sm mx-auto">
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
    <Card className={cn('bg-mi-navy-light border-mi-cyan/20', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-5 w-20" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
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

export default CoachProtocolHistory;
