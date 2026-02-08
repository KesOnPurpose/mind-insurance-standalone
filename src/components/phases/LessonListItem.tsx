// ============================================================================
// FEAT-GH-012: Lesson List Item Component (Apple-esque Redesign)
// ============================================================================
// Ultra-minimal lesson card matching PhaseCard design
// Shows only: number + title + progress bar + percentage
// ============================================================================

import { Lock, CheckCircle2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { LessonWithProgress } from '@/types/programs';

interface LessonListItemProps {
  lesson: LessonWithProgress;
  lessonNumber: number;
  isActive?: boolean;
  onClick?: () => void;
}

/**
 * Calculate overall lesson progress from video and tactics
 */
const calculateOverallProgress = (lesson: LessonWithProgress): number => {
  const hasVideo = lesson.video_duration_seconds && lesson.video_duration_seconds > 0;
  const hasTactics = lesson.total_tactics && lesson.total_tactics > 0;

  if (hasVideo && hasTactics) {
    // Average of both
    return Math.round((lesson.video_watched_percent + lesson.tactics_completion_percent) / 2);
  } else if (hasVideo) {
    return Math.round(lesson.video_watched_percent);
  } else if (hasTactics) {
    return Math.round(lesson.tactics_completion_percent);
  }
  // No trackable content - base on status
  return lesson.status === 'completed' ? 100 : 0;
};

/**
 * Ultra-minimal lesson card in the list
 * Apple-esque design: number + title + thin progress bar only
 */
export const LessonListItem = ({
  lesson,
  lessonNumber,
  isActive,
  onClick,
}: LessonListItemProps) => {
  const isLocked = lesson.status === 'locked';
  const isCompleted = lesson.status === 'completed';
  const isInProgress = lesson.status === 'in_progress';

  const progress = calculateOverallProgress(lesson);

  const cardContent = (
    <div
      className={cn(
        'relative p-5 rounded-xl border transition-all duration-200',
        // Base styles
        'bg-card',
        // Locked state
        isLocked && 'opacity-50 cursor-not-allowed',
        // Clickable state
        !isLocked && 'hover:shadow-sm cursor-pointer',
        // Active state - subtle ring and tint
        isActive && 'ring-1 ring-primary/20 bg-primary/[0.02]',
        // Completed state - subtle green tint
        isCompleted && 'bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-200/50 dark:border-emerald-800/30',
        // In Progress state - subtle blue tint
        isInProgress && !isActive && 'bg-blue-50/20 dark:bg-blue-950/10'
      )}
      onClick={isLocked ? undefined : onClick}
      role={isLocked ? undefined : 'button'}
      tabIndex={isLocked ? undefined : 0}
      onKeyDown={(e) => {
        if (!isLocked && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <div className="flex items-start gap-4">
        {/* Lesson Number - inline, muted */}
        <span className={cn(
          'text-lg font-medium w-6 shrink-0',
          isCompleted && 'text-emerald-600 dark:text-emerald-400',
          isInProgress && 'text-primary',
          !isCompleted && !isInProgress && 'text-muted-foreground'
        )}>
          {isCompleted ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : isLocked ? (
            <Lock className="h-4 w-4 text-muted-foreground/50" />
          ) : (
            lessonNumber
          )}
        </span>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Title */}
          <div className="flex items-center gap-2">
            <h4 className={cn(
              'font-medium text-foreground leading-snug',
              isLocked && 'text-muted-foreground'
            )}>
              {lesson.title}
            </h4>
            {!lesson.is_required && (
              <span className="text-xs text-muted-foreground/70">
                optional
              </span>
            )}
          </div>

          {/* Progress bar - thin and elegant */}
          <div className="flex items-center gap-2">
            <Progress
              value={isLocked ? 0 : progress}
              className={cn(
                'flex-1 h-1',
                isCompleted && '[&>div]:bg-emerald-500',
                isInProgress && '[&>div]:bg-primary'
              )}
            />
            <span className={cn(
              'text-xs w-10 text-right tabular-nums',
              isCompleted && 'text-emerald-600 dark:text-emerald-400',
              isInProgress && 'text-primary',
              isLocked && 'text-muted-foreground/50',
              !isCompleted && !isInProgress && !isLocked && 'text-muted-foreground'
            )}>
              {isLocked ? '—' : `${progress}%`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  // Wrap locked lessons in tooltip
  if (isLocked && lesson.unlock_reason) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {cardContent}
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="text-sm">{lesson.unlock_reason}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return cardContent;
};

/**
 * Skeleton loader for LessonListItem (minimal design)
 */
export const LessonListItemSkeleton = () => (
  <div className="p-5 rounded-xl border space-y-3">
    <div className="flex items-start gap-4">
      <Skeleton className="h-5 w-6 shrink-0" />
      <div className="flex-1 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-1 flex-1" />
          <Skeleton className="h-3 w-10" />
        </div>
      </div>
    </div>
  </div>
);

export default LessonListItem;
