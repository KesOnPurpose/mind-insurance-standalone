// ============================================================================
// FEAT-GH-013: Completion Button
// ============================================================================
// Big button to mark lesson as complete - disabled until all gates pass
// Shows clear feedback about why it's disabled
// After completion, shows prominent "Continue to Next Lesson" button
// ============================================================================

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  Lock,
  Loader2,
  ChevronRight,
  PartyPopper,
  ArrowRight,
  Trophy,
} from 'lucide-react';
import type { NextLessonInfo } from '@/hooks/usePrograms';

interface CompletionGates {
  video_gate_met: boolean;
  tactics_gate_met: boolean;
  assessment_gate_met: boolean;
  all_gates_met: boolean;
}

interface CompletionButtonProps {
  gates: CompletionGates;
  isCompleted: boolean;
  isCompleting: boolean;
  onComplete: () => void;
  onContinue?: () => void;
  nextLesson?: NextLessonInfo | null;
  isLoadingNextLesson?: boolean;
  hasVideo: boolean;
  hasTactics: boolean;
  hasAssessment: boolean;
  assessmentRequired: boolean;
  className?: string;
}

/**
 * CompletionButton - Primary CTA to complete the lesson
 * Shows why the button is disabled when gates aren't met
 */
export const CompletionButton = ({
  gates,
  isCompleted,
  isCompleting,
  onComplete,
  onContinue,
  nextLesson,
  isLoadingNextLesson = false,
  hasVideo,
  hasTactics,
  hasAssessment,
  assessmentRequired,
  className,
}: CompletionButtonProps) => {
  // Already completed - show Continue to Next Lesson
  if (isCompleted) {
    // Program complete - last lesson
    if (nextLesson?.is_last_lesson) {
      return (
        <div className={cn('space-y-3 animate-celebrate', className)}>
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-lg p-4 border border-primary/20">
            <div className="flex items-center justify-center gap-2 text-primary mb-2">
              <Trophy className="h-6 w-6 animate-bounce-once" />
              <span className="text-lg font-semibold">Program Complete!</span>
              <PartyPopper className="h-6 w-6 animate-bounce-once" />
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Congratulations! You've completed all lessons in this program.
            </p>
          </div>
          <Button
            size="lg"
            variant="outline"
            className="w-full h-12 text-base animate-glow-once"
            disabled
          >
            <CheckCircle2 className="h-5 w-5 mr-2 text-primary" />
            All Lessons Completed
          </Button>
        </div>
      );
    }

    // Has next lesson - show Continue button
    if (nextLesson && onContinue) {
      return (
        <div className={cn('space-y-3 animate-celebrate', className)}>
          {/* Completion celebration - compact */}
          <div className="flex items-center justify-center gap-2 py-2 text-primary">
            <CheckCircle2 className="h-5 w-5 animate-scale-check" />
            <span className="text-sm font-medium">Lesson Complete</span>
            <PartyPopper className="h-5 w-5" />
          </div>

          {/* New phase celebration */}
          {nextLesson.is_new_phase && (
            <div className="bg-primary/5 rounded-lg p-3 border border-primary/20 text-center animate-pulse-once">
              <p className="text-sm font-medium text-primary">
                Phase complete! Up next: {nextLesson.phase_title}
              </p>
            </div>
          )}

          {/* Primary CTA - Continue to Next Lesson */}
          <Button
            size="lg"
            className="w-full h-14 text-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
            onClick={onContinue}
          >
            Continue to Next Lesson
            <ArrowRight className="h-5 w-5 ml-2 transition-transform group-hover:translate-x-1" />
          </Button>

          {/* Next lesson preview */}
          <p className="text-center text-sm text-muted-foreground">
            Next: {nextLesson.title}
          </p>
        </div>
      );
    }

    // Loading next lesson info or no continue handler
    return (
      <div className={cn('space-y-2', className)}>
        <div className="flex items-center justify-center gap-2 py-2 text-primary">
          <CheckCircle2 className="h-5 w-5" />
          <span className="text-sm font-medium">Lesson Complete</span>
          <PartyPopper className="h-5 w-5" />
        </div>
        <Button
          size="lg"
          className="w-full h-14 text-lg"
          disabled={isLoadingNextLesson}
        >
          {isLoadingNextLesson ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5 mr-2" />
              Lesson Completed
            </>
          )}
        </Button>
      </div>
    );
  }

  // Completing in progress
  if (isCompleting) {
    return (
      <div className={cn('space-y-2', className)}>
        <Button
          size="lg"
          className="w-full h-14 text-lg"
          disabled
        >
          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          Marking Complete...
        </Button>
      </div>
    );
  }

  // All gates passed - can complete
  if (gates.all_gates_met) {
    return (
      <div className={cn('space-y-2', className)}>
        <Button
          size="lg"
          className="w-full h-14 text-lg"
          onClick={onComplete}
        >
          <CheckCircle2 className="h-5 w-5 mr-2" />
          Mark Lesson Complete
          <ChevronRight className="h-5 w-5 ml-2" />
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          All requirements met! Click to complete this lesson.
        </p>
      </div>
    );
  }

  // Gates not met - show blocking reason
  const blockedBy = getBlockedByText(gates, hasVideo, hasTactics, hasAssessment, assessmentRequired);

  return (
    <div className={cn('space-y-2', className)}>
      <Button
        size="lg"
        variant="secondary"
        className="w-full h-14 text-lg"
        disabled
      >
        <Lock className="h-5 w-5 mr-2" />
        Complete Requirements First
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {blockedBy}
      </p>
    </div>
  );
};

/**
 * Generate text explaining what's blocking completion
 */
function getBlockedByText(
  gates: CompletionGates,
  hasVideo: boolean,
  hasTactics: boolean,
  hasAssessment: boolean,
  assessmentRequired: boolean
): string {
  const blockers: string[] = [];

  if (hasVideo && !gates.video_gate_met) {
    blockers.push('watch more of the video');
  }

  if (hasTactics && !gates.tactics_gate_met) {
    blockers.push('complete the required tactics');
  }

  if (hasAssessment && assessmentRequired && !gates.assessment_gate_met) {
    blockers.push('pass the assessment');
  }

  if (blockers.length === 0) {
    return 'Complete all requirements above to unlock.';
  }

  if (blockers.length === 1) {
    return `You need to ${blockers[0]} to complete this lesson.`;
  }

  const lastBlocker = blockers.pop();
  return `You need to ${blockers.join(', ')} and ${lastBlocker} to complete this lesson.`;
}

/**
 * CompletionButtonSkeleton - Loading state
 */
export const CompletionButtonSkeleton = () => (
  <div className="space-y-2">
    <Skeleton className="h-14 w-full rounded-md" />
    <Skeleton className="h-4 w-48 mx-auto" />
  </div>
);

/**
 * ContinueButton - Used to navigate to next lesson
 */
interface ContinueButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  className?: string;
}

export const ContinueButton = ({
  onClick,
  isLoading = false,
  className,
}: ContinueButtonProps) => (
  <Button
    size="lg"
    className={cn('w-full h-12', className)}
    onClick={onClick}
    disabled={isLoading}
  >
    {isLoading ? (
      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
    ) : (
      <ChevronRight className="h-5 w-5 mr-2" />
    )}
    Continue to Next Lesson
  </Button>
);
