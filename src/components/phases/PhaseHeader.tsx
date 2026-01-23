// ============================================================================
// FEAT-GH-012: Phase Header Component (Apple-esque Redesign)
// ============================================================================
// Minimal, clean phase header with elegant progress indicator
// Removes status badges, simplifies layout, subtle styling
// ============================================================================

import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { PhaseWithProgress } from '@/types/programs';

interface PhaseHeaderProps {
  phase: PhaseWithProgress;
  programTitle?: string;
  onBack?: () => void;
  isLoading?: boolean;
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
 * Phase header with minimal Apple-esque design
 * Clean title, subtle progress indicator, no badges
 */
export const PhaseHeader = ({
  phase,
  programTitle,
  onBack,
  isLoading,
}: PhaseHeaderProps) => {
  if (isLoading) {
    return <PhaseHeaderSkeleton />;
  }

  const completionPercent = phase.total_required_lessons > 0
    ? Math.round((phase.completed_lessons / phase.total_required_lessons) * 100)
    : 0;

  const isCompleted = phase.status === 'completed';
  const cleanedTitle = cleanPhaseTitle(phase.title);

  return (
    <div className="space-y-6">
      {/* Back button and program title */}
      {(onBack || programTitle) && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="h-8 px-2 -ml-2"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          )}
          {programTitle && (
            <span className="truncate">{programTitle}</span>
          )}
        </div>
      )}

      {/* Main header content */}
      <div className="space-y-4">
        {/* Title with completion indicator */}
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            {cleanedTitle}
          </h1>
          {isCompleted && (
            <CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0" />
          )}
        </div>

        {phase.description && (
          <p className="text-muted-foreground leading-relaxed max-w-2xl">
            {phase.description}
          </p>
        )}

        {/* Minimal stats - text only */}
        <p className="text-sm text-muted-foreground">
          {phase.total_lessons} {phase.total_lessons === 1 ? 'lesson' : 'lessons'}
          {phase.total_lessons - phase.total_required_lessons > 0 && (
            <span> · {phase.total_lessons - phase.total_required_lessons} optional</span>
          )}
        </p>

        {/* Elegant inline progress */}
        <div className="flex items-center gap-3 pt-2">
          <Progress
            value={completionPercent}
            className={cn(
              'flex-1 h-1.5 max-w-md',
              isCompleted && '[&>div]:bg-emerald-500'
            )}
          />
          <span className={cn(
            'text-sm font-medium tabular-nums',
            isCompleted ? 'text-emerald-600' : 'text-muted-foreground'
          )}>
            {completionPercent}%
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton loader for PhaseHeader (minimal design)
 */
export const PhaseHeaderSkeleton = () => (
  <div className="space-y-6">
    {/* Back button skeleton */}
    <Skeleton className="h-8 w-20" />

    <div className="space-y-4">
      {/* Title skeleton */}
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-full max-w-md" />
      <Skeleton className="h-4 w-24" />

      {/* Progress skeleton */}
      <div className="flex items-center gap-3 pt-2">
        <Skeleton className="h-1.5 flex-1 max-w-md" />
        <Skeleton className="h-4 w-10" />
      </div>
    </div>
  </div>
);

export default PhaseHeader;
