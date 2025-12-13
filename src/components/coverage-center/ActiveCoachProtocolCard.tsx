/**
 * ActiveCoachProtocolCard Component
 * Coverage Center - $100M Mind Insurance Feature
 *
 * Displays the user's current active Coach protocol with:
 * - Protocol title and week/day progress
 * - Today's task preview
 * - CTA to view/continue
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Calendar,
  ChevronRight,
  Clock,
  CheckCircle2,
  Play,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

// ============================================================================
// TYPES
// ============================================================================

interface CoachProtocolAssignment {
  id: string;
  protocol_id: string;
  user_id: string;
  status: 'active' | 'completed' | 'dropped' | 'paused';
  current_week: number;
  current_day: number;
  days_completed: number;
  total_tasks_completed: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  protocol?: {
    id: string;
    title: string;
    description?: string;
    total_weeks: number;
    coach_id: string;
    coach_name?: string;
  };
  today_tasks?: Array<{
    id: string;
    title: string;
    task_type: string;
    estimated_duration?: number;
    completed?: boolean;
  }>;
}

interface ActiveCoachProtocolCardProps {
  assignment: CoachProtocolAssignment | null;
  isLoading?: boolean;
  onViewProtocol?: () => void;
  onContinueTask?: () => void;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ActiveCoachProtocolCard({
  assignment,
  isLoading = false,
  onViewProtocol,
  onContinueTask,
  className,
}: ActiveCoachProtocolCardProps) {
  const navigate = useNavigate();

  // Loading state
  if (isLoading) {
    return <ActiveCoachProtocolCardSkeleton className={className} />;
  }

  // No active coach protocol
  if (!assignment || !assignment.protocol) {
    return null; // Don't show anything if no coach protocol - MIO is primary
  }

  const protocol = assignment.protocol;
  const totalDays = protocol.total_weeks * 7;
  const progressPercent = Math.round((assignment.days_completed / totalDays) * 100);
  const todayTasks = assignment.today_tasks || [];
  const completedTodayTasks = todayTasks.filter((t) => t.completed).length;
  const allTodayComplete = todayTasks.length > 0 && completedTodayTasks === todayTasks.length;

  const handleViewProtocol = () => {
    if (onViewProtocol) {
      onViewProtocol();
    } else {
      navigate(`/mind-insurance/coach-protocol/${assignment.id}`);
    }
  };

  const handleContinueTask = () => {
    if (onContinueTask) {
      onContinueTask();
    } else {
      navigate(`/mind-insurance/coach-protocol/${assignment.id}/day/${assignment.current_day}`);
    }
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs border-blue-300 text-blue-600 dark:border-blue-700 dark:text-blue-400">
                <Users className="h-3 w-3 mr-1" />
                Coach Protocol
              </Badge>
            </div>
            <CardTitle className="text-lg line-clamp-2">
              {protocol.title}
            </CardTitle>
            {protocol.coach_name && (
              <p className="text-sm text-muted-foreground mt-1">
                Assigned by {protocol.coach_name}
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Week {assignment.current_week}, Day {assignment.current_day}
            </span>
            <span className="font-medium">{progressPercent}% complete</span>
          </div>

          <Progress value={progressPercent} className="h-2" />

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{assignment.days_completed} of {totalDays} days</span>
            <span>{protocol.total_weeks} week program</span>
          </div>
        </div>

        {/* Today's Tasks Preview */}
        {todayTasks.length > 0 && (
          <div
            className={cn(
              'p-4 rounded-lg border transition-colors',
              allTodayComplete
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                : 'bg-muted/50 border-border hover:bg-muted/80'
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'p-2 rounded-full flex-shrink-0',
                  allTodayComplete
                    ? 'bg-emerald-100 dark:bg-emerald-900/50'
                    : 'bg-blue-100 dark:bg-blue-900/50'
                )}
              >
                {allTodayComplete ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    Today's Tasks
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {completedTodayTasks}/{todayTasks.length}
                  </Badge>
                </div>

                <div className="space-y-1">
                  {todayTasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/30" />
                      )}
                      <span
                        className={cn(
                          'line-clamp-1',
                          task.completed && 'text-muted-foreground line-through'
                        )}
                      >
                        {task.title}
                      </span>
                    </div>
                  ))}
                  {todayTasks.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{todayTasks.length - 3} more tasks
                    </p>
                  )}
                </div>

                {allTodayComplete && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
                    All tasks complete! Great work today.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {!allTodayComplete && todayTasks.length > 0 ? (
            <Button onClick={handleContinueTask} className="flex-1" variant="default">
              <Play className="h-4 w-4 mr-2" />
              Continue Today's Tasks
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

        {/* Description preview */}
        {protocol.description && (
          <div className="pt-3 border-t border-border/50">
            <p className="text-xs text-muted-foreground line-clamp-2">
              {protocol.description}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// SKELETON
// ============================================================================

function ActiveCoachProtocolCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-28 mb-2" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2 mt-1" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-2 w-full" />
        </div>
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
}

// ============================================================================
// COMPACT VERSION
// ============================================================================

/**
 * Compact version for dashboard
 */
export function ActiveCoachProtocolCardCompact({
  assignment,
  className,
  onClick,
}: {
  assignment: CoachProtocolAssignment | null;
  className?: string;
  onClick?: () => void;
}) {
  if (!assignment || !assignment.protocol) {
    return null;
  }

  const protocol = assignment.protocol;
  const totalDays = protocol.total_weeks * 7;
  const progressPercent = Math.round((assignment.days_completed / totalDays) * 100);

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
        <Badge variant="outline" className="text-xs border-blue-300 text-blue-600">
          <Users className="h-3 w-3 mr-1" />
          Week {assignment.current_week}
        </Badge>
        <Play className="h-5 w-5 text-blue-500" />
      </div>

      <h4 className="font-medium text-sm line-clamp-1 mb-1">
        {protocol.title}
      </h4>

      <Progress value={progressPercent} className="h-1.5" />
      <p className="text-xs text-muted-foreground mt-1">
        {assignment.days_completed}/{totalDays} days • {progressPercent}%
      </p>
    </button>
  );
}

export default ActiveCoachProtocolCard;
