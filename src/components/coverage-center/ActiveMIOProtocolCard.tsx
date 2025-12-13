/**
 * ActiveMIOProtocolCard Component
 * Coverage Center - $100M Mind Insurance Feature
 *
 * Displays the user's current active MIO protocol with:
 * - Protocol title and pattern targeted
 * - Progress ring (X of 7 days)
 * - Today's task preview
 * - CTA to start/continue today's task
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brain,
  Calendar,
  ChevronRight,
  Clock,
  CheckCircle2,
  Lock,
  Play,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CoverageStreakBadge } from './CoverageStreak';
import type { MIOInsightProtocolWithProgress, MIOInsightDayTask } from '@/types/protocol';
import type { ActiveProtocolSummary } from '@/types/coverage';

// ============================================================================
// TYPES
// ============================================================================

interface ActiveMIOProtocolCardProps {
  protocol: MIOInsightProtocolWithProgress | null;
  currentStreak?: number;
  isLoading?: boolean;
  onStartTask?: () => void;
  onViewProtocol?: () => void;
  className?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getDayProgressItems(
  protocol: MIOInsightProtocolWithProgress
): Array<{ day: number; completed: boolean; isToday: boolean }> {
  return Array.from({ length: 7 }, (_, i) => {
    const day = i + 1;
    const completion = protocol.completions.find(
      (c) => c.day_number === day && !c.was_skipped
    );
    return {
      day,
      completed: !!completion,
      isToday: day === protocol.current_day,
    };
  });
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ActiveMIOProtocolCard({
  protocol,
  currentStreak = 0,
  isLoading = false,
  onStartTask,
  onViewProtocol,
  className,
}: ActiveMIOProtocolCardProps) {
  const navigate = useNavigate();

  // Loading state
  if (isLoading) {
    return <ActiveMIOProtocolCardSkeleton className={className} />;
  }

  // No active protocol
  if (!protocol) {
    return <NoActiveProtocolCard className={className} />;
  }

  const progressPercent = Math.round(
    (protocol.days_completed / 7) * 100
  );
  const dayProgress = getDayProgressItems(protocol);
  const todayTask = protocol.today_task;
  const isTodayCompleted = protocol.is_today_completed;

  const handleStartTask = () => {
    if (onStartTask) {
      onStartTask();
    } else {
      // Default: Navigate to protocol task page
      navigate(`/mind-insurance/protocol/${protocol.id}/day/${protocol.current_day}`);
    }
  };

  const handleViewProtocol = () => {
    if (onViewProtocol) {
      onViewProtocol();
    } else {
      navigate(`/mind-insurance/protocol/${protocol.id}`);
    }
  };

  // Extract pattern from source_context if available
  const patternTargeted =
    (protocol.source_context as Record<string, string>)?.collision_pattern ||
    protocol.protocol_type ||
    'Identity Pattern';

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className="text-xs">
                <Brain className="h-3 w-3 mr-1" />
                MIO Protocol
              </Badge>
              <CoverageStreakBadge currentStreak={currentStreak} />
            </div>
            <CardTitle className="text-lg line-clamp-2">
              {protocol.title}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Targeting: {patternTargeted}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Day {protocol.current_day} of 7
            </span>
            <span className="font-medium">{progressPercent}% complete</span>
          </div>

          {/* Day progress dots */}
          <div className="flex items-center gap-1.5">
            {dayProgress.map((day) => (
              <div
                key={day.day}
                className={cn(
                  'flex-1 h-2 rounded-full transition-all',
                  day.completed
                    ? 'bg-emerald-500'
                    : day.isToday
                    ? 'bg-primary animate-pulse'
                    : 'bg-muted'
                )}
                title={`Day ${day.day}: ${
                  day.completed ? 'Completed' : day.isToday ? 'Today' : 'Upcoming'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Today's Task Preview */}
        {todayTask && (
          <div
            className={cn(
              'p-4 rounded-lg border transition-colors',
              isTodayCompleted
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                : 'bg-muted/50 border-border hover:bg-muted/80'
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'p-2 rounded-full flex-shrink-0',
                  isTodayCompleted
                    ? 'bg-emerald-100 dark:bg-emerald-900/50'
                    : 'bg-primary/10'
                )}
              >
                {isTodayCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Play className="h-5 w-5 text-primary" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    Day {protocol.current_day}
                  </span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">
                    {todayTask.theme}
                  </span>
                </div>

                <h4 className="font-medium text-sm line-clamp-1">
                  {todayTask.task_title}
                </h4>

                {todayTask.duration_minutes && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{todayTask.duration_minutes} min</span>
                  </div>
                )}

                {isTodayCompleted && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
                    Completed! Great work today.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {!isTodayCompleted && todayTask ? (
            <Button onClick={handleStartTask} className="flex-1">
              <Play className="h-4 w-4 mr-2" />
              Start Today's Practice
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={handleViewProtocol}
              className="flex-1"
            >
              View Protocol Details
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>

        {/* Insight summary */}
        {protocol.insight_summary && (
          <div className="pt-3 border-t border-border/50">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground line-clamp-2">
                {protocol.insight_summary}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// EMPTY STATE
// ============================================================================

function NoActiveProtocolCard({ className }: { className?: string }) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="py-8 text-center">
        <div className="inline-flex p-3 rounded-full bg-muted mb-4">
          <Brain className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold mb-2">No Active Protocol</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          MIO will generate a personalized 7-day protocol based on your patterns.
          Check back soon!
        </p>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function ActiveMIOProtocolCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2 mt-1" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="flex-1 h-2 rounded-full" />
            ))}
          </div>
        </div>
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
}

// ============================================================================
// COMPACT VERSION
// ============================================================================

/**
 * Compact version for dashboard display
 */
export function ActiveMIOProtocolCardCompact({
  protocol,
  className,
  onClick,
}: {
  protocol: MIOInsightProtocolWithProgress | null;
  className?: string;
  onClick?: () => void;
}) {
  if (!protocol) {
    return null;
  }

  const progressPercent = Math.round((protocol.days_completed / 7) * 100);
  const isTodayCompleted = protocol.is_today_completed;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-4 rounded-lg border border-border bg-card',
        'text-left transition-all hover:bg-muted/50',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <Badge variant="secondary" className="text-xs">
          <Brain className="h-3 w-3 mr-1" />
          Day {protocol.current_day}
        </Badge>
        {isTodayCompleted ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
        ) : (
          <Play className="h-5 w-5 text-primary" />
        )}
      </div>

      <h4 className="font-medium text-sm line-clamp-1 mb-1">
        {protocol.title}
      </h4>

      <Progress value={progressPercent} className="h-1.5" />
      <p className="text-xs text-muted-foreground mt-1">
        {protocol.days_completed}/7 days • {progressPercent}%
      </p>
    </button>
  );
}

export default ActiveMIOProtocolCard;
