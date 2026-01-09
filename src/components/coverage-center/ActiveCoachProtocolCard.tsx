/**
 * ActiveCoachProtocolCard Component
 * Coverage Center - $100M Mind Insurance Feature
 *
 * Premium Glass-Morphism Styling: CYAN accents (differentiates from MIO's gold)
 * Visual Language: Coach protocols = Cyan, MIO protocols = Gold
 *
 * Displays the user's current active Coach protocol with:
 * - Protocol title and week/day progress
 * - Today's task preview
 * - CTA to view/continue
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  Calendar,
  ChevronRight,
  Clock,
  CheckCircle2,
  Play,
  BookOpen,
  Sparkles,
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
      // Navigate to dedicated Coach Protocol Detail page
      navigate('/mind-insurance/coach-protocol');
    }
  };

  const handleContinueTask = () => {
    if (onContinueTask) {
      onContinueTask();
    } else {
      // Navigate to dedicated Coach Protocol Detail page
      navigate('/mind-insurance/coach-protocol');
    }
  };

  return (
    <Card className={cn(
      'relative overflow-hidden',
      // Premium glass-morphism effect
      'bg-mi-navy/80 backdrop-blur-xl',
      'border border-mi-cyan/20',
      'shadow-[0_8px_32px_rgba(5,195,221,0.15),0_0_60px_rgba(5,195,221,0.08)]',
      className
    )}>
      {/* Animated gradient border glow */}
      <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
        <div className="absolute inset-[-2px] bg-gradient-to-br from-mi-cyan/20 via-transparent to-cyan-400/20 opacity-50" />
      </div>

      <CardHeader className="pb-3 relative z-10">
        {/* Background gradient mesh */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-gradient-to-br from-mi-cyan/15 to-transparent blur-2xl" />
          <div className="absolute -bottom-5 -right-5 w-32 h-32 rounded-full bg-cyan-400/10 blur-xl" />
        </div>

        <div className="flex items-start justify-between relative z-10">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className={cn(
                "text-xs",
                "border-mi-cyan/30 text-mi-cyan bg-mi-cyan/10",
                "shadow-[0_0_10px_rgba(5,195,221,0.2)]"
              )}>
                <Users className="h-3 w-3 mr-1" />
                Coach Protocol
              </Badge>
            </div>
            <CardTitle className="text-lg line-clamp-2 text-white">
              {protocol.title}
            </CardTitle>
            {protocol.coach_name && (
              <p className="text-sm text-gray-400 mt-1">
                Assigned by {protocol.coach_name}
              </p>
            )}
          </div>
          <Sparkles className="h-4 w-4 text-mi-cyan/50" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4 relative z-10">
        {/* Progress Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">
              Week {assignment.current_week}, Day {assignment.current_day}
            </span>
            <span className="font-medium text-mi-cyan">{progressPercent}% complete</span>
          </div>

          <div className="h-2 bg-mi-cyan/10 rounded-full overflow-hidden border border-mi-cyan/20">
            <motion.div
              className="h-full bg-gradient-to-r from-mi-cyan to-cyan-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>{assignment.days_completed} of {totalDays} days</span>
            <span>{protocol.total_weeks} week program</span>
          </div>
        </div>

        {/* Today's Tasks Preview */}
        {todayTasks.length > 0 && (
          <div
            className={cn(
              'p-4 rounded-xl border transition-all',
              allTodayComplete
                ? 'bg-emerald-500/10 backdrop-blur-sm border-emerald-500/30'
                : cn(
                    'bg-white/5 backdrop-blur-sm',
                    'border border-mi-cyan/20',
                    'hover:bg-white/8 hover:border-mi-cyan/30'
                  )
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'p-2 rounded-full flex-shrink-0',
                  allTodayComplete
                    ? 'bg-emerald-500/20'
                    : 'bg-mi-cyan/10'
                )}
              >
                {allTodayComplete ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : (
                  <BookOpen className="h-5 w-5 text-mi-cyan" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-400">
                    Today's Tasks
                  </span>
                  <Badge variant="secondary" className="text-xs bg-mi-cyan/10 text-mi-cyan border-mi-cyan/30">
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
                        <div className="h-3.5 w-3.5 rounded-full border border-mi-cyan/30" />
                      )}
                      <span
                        className={cn(
                          'line-clamp-1 text-white',
                          task.completed && 'text-gray-400 line-through'
                        )}
                      >
                        {task.title}
                      </span>
                    </div>
                  ))}
                  {todayTasks.length > 3 && (
                    <p className="text-xs text-gray-400">
                      +{todayTasks.length - 3} more tasks
                    </p>
                  )}
                </div>

                {allTodayComplete && (
                  <p className="text-xs text-emerald-400 mt-2">
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
            <Button
              onClick={handleContinueTask}
              className={cn(
                "flex-1 font-semibold",
                "bg-gradient-to-r from-mi-cyan to-cyan-400",
                "hover:from-mi-cyan hover:to-cyan-300",
                "text-mi-navy",
                "shadow-lg shadow-mi-cyan/30",
                "hover:shadow-xl hover:shadow-mi-cyan/40",
                "hover:scale-[1.02]",
                "transition-all duration-300"
              )}
            >
              <Play className="h-4 w-4 mr-2" />
              Continue Today's Tasks
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={handleViewProtocol}
              className={cn(
                "flex-1",
                "border-mi-cyan/30 text-mi-cyan",
                "hover:bg-mi-cyan/10 hover:border-mi-cyan/50",
                "transition-all duration-200"
              )}
            >
              View Protocol Details
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>

        {/* Description preview */}
        {protocol.description && (
          <div className="pt-3 border-t border-mi-cyan/20">
            <p className="text-xs text-gray-400 line-clamp-2">
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
    <Card className={cn(
      'relative overflow-hidden',
      'bg-mi-navy/80 backdrop-blur-xl',
      'border border-mi-cyan/20',
      className
    )}>
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-28 mb-2 bg-mi-cyan/10" />
        <Skeleton className="h-6 w-3/4 bg-mi-cyan/10" />
        <Skeleton className="h-4 w-1/2 mt-1 bg-mi-cyan/10" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-24 bg-mi-cyan/10" />
            <Skeleton className="h-4 w-20 bg-mi-cyan/10" />
          </div>
          <Skeleton className="h-2 w-full bg-mi-cyan/10" />
        </div>
        <Skeleton className="h-28 w-full rounded-xl bg-mi-cyan/10" />
        <Skeleton className="h-10 w-full bg-mi-cyan/10" />
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
    <motion.button
      onClick={onClick}
      className={cn(
        'w-full p-4 rounded-xl',
        'bg-white/5 backdrop-blur-sm',
        'border border-mi-cyan/20',
        'text-left transition-all',
        'hover:bg-white/8 hover:border-mi-cyan/40',
        'hover:shadow-[0_4px_20px_rgba(5,195,221,0.15)]',
        'focus:outline-none focus:ring-2 focus:ring-mi-cyan focus:ring-offset-2 focus:ring-offset-mi-navy',
        className
      )}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-center justify-between mb-2">
        <Badge variant="outline" className="text-xs border-mi-cyan/30 text-mi-cyan bg-mi-cyan/10">
          <Users className="h-3 w-3 mr-1" />
          Week {assignment.current_week}
        </Badge>
        <Play className="h-5 w-5 text-mi-cyan" />
      </div>

      <h4 className="font-medium text-sm line-clamp-1 mb-1 text-white">
        {protocol.title}
      </h4>

      <div className="h-1.5 bg-mi-cyan/10 rounded-full overflow-hidden border border-mi-cyan/20">
        <motion.div
          className="h-full bg-gradient-to-r from-mi-cyan to-cyan-400 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-1">
        {assignment.days_completed}/{totalDays} days | <span className="text-mi-cyan">{progressPercent}%</span>
      </p>
    </motion.button>
  );
}

export default ActiveCoachProtocolCard;
