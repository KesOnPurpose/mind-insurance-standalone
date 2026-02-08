// ============================================================================
// FEAT-GH-011: Phase Card Component (Apple-esque Redesign)
// ============================================================================
// Ultra-minimal phase card with clean layout
// Shows only: phase number + title + progress bar + percentage
// ============================================================================

import { CheckCircle2, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { PhaseWithProgress } from '@/types/programs';

interface PhaseCardProps {
  phase: PhaseWithProgress;
  phaseNumber: number;
  isActive?: boolean;
  onClick?: () => void;
}

/**
 * Clean phase title by removing parenthetical subtitles and converting to Title Case
 * e.g., "FOUNDATION & COMPLIANCE (Can I do this?)" → "Foundation & Compliance"
 */
const cleanPhaseTitle = (title: string): string => {
  // Remove parenthetical content
  let cleaned = title.replace(/\s*\([^)]*\)\s*/g, '').trim();

  // Convert to Title Case if ALL CAPS
  if (cleaned === cleaned.toUpperCase() && cleaned.length > 2) {
    cleaned = cleaned
      .toLowerCase()
      .split(' ')
      .map(word => {
        // Don't capitalize small conjunctions/prepositions unless first word
        const smallWords = ['and', 'or', 'the', 'a', 'an', 'to', 'for', 'of', 'in', 'on', 'at', 'by'];
        if (smallWords.includes(word)) return word;
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
    // Ensure first letter is always capitalized
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  return cleaned;
};

/**
 * Ultra-minimal phase card in the roadmap
 * Apple-esque design: number + title + thin progress bar only
 */
export const PhaseCard = ({ phase, phaseNumber, isActive, onClick }: PhaseCardProps) => {
  const isLocked = phase.status === 'locked';
  const isCompleted = phase.status === 'completed';
  const isInProgress = phase.status === 'in_progress';

  const cleanedTitle = cleanPhaseTitle(phase.title);

  const cardContent = (
    <div
      className={cn(
        'relative p-6 rounded-xl border transition-all duration-200',
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
        {/* Phase Number - inline, muted */}
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
            phaseNumber
          )}
        </span>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Title */}
          <h3 className={cn(
            'font-medium text-foreground leading-snug',
            isLocked && 'text-muted-foreground'
          )}>
            {cleanedTitle}
          </h3>

          {/* Progress bar - thin and elegant */}
          <div className="flex items-center gap-2">
            <Progress
              value={isLocked ? 0 : phase.progress_percent}
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
              {isLocked ? '—' : `${Math.round(phase.progress_percent)}%`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  // Wrap locked phases in tooltip
  if (isLocked && phase.unlock_reason) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {cardContent}
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="text-sm">{phase.unlock_reason}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return cardContent;
};

/**
 * Skeleton loader for PhaseCard (minimal design)
 */
export const PhaseCardSkeleton = () => (
  <div className="p-6 rounded-xl border space-y-3">
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

export default PhaseCard;
