// ============================================================================
// FEAT-GH-013: Completion Rules Card
// ============================================================================
// Shows what's required to complete the lesson with live gate status
// Strict completion logic - ALL gates must pass!
// ============================================================================

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  Circle,
  Video,
  Target,
  FileQuestion,
  Lock,
  Unlock,
} from 'lucide-react';

interface CompletionGates {
  video_gate_met: boolean;
  tactics_gate_met: boolean;
  assessment_gate_met: boolean;
  all_gates_met: boolean;
}

interface CompletionRulesCardProps {
  gates: CompletionGates;
  hasVideo: boolean;
  videoWatchedPercent: number;
  requiredWatchPercent: number;
  hasTactics: boolean;
  tacticsCompletedCount: number;
  tacticsRequiredCount: number;
  hasAssessment: boolean;
  assessmentRequired: boolean;
  assessmentStatus?: 'not_started' | 'in_progress' | 'passed' | 'failed' | null;
  assessmentScore?: number | null;
  passingScore?: number | null;
  className?: string;
}

/**
 * CompletionRulesCard - Shows completion requirements and gate status
 * The lesson can only be marked complete when ALL gates are met
 */
export const CompletionRulesCard = ({
  gates,
  hasVideo,
  videoWatchedPercent,
  requiredWatchPercent,
  hasTactics,
  tacticsCompletedCount,
  tacticsRequiredCount,
  hasAssessment,
  assessmentRequired,
  assessmentStatus,
  assessmentScore,
  passingScore,
  className,
}: CompletionRulesCardProps) => {
  // Count how many gates need to be passed
  const totalGates = [
    hasVideo,
    hasTactics && tacticsRequiredCount > 0,
    hasAssessment && assessmentRequired,
  ].filter(Boolean).length;

  const passedGates = [
    hasVideo && gates.video_gate_met,
    hasTactics && tacticsRequiredCount > 0 && gates.tactics_gate_met,
    hasAssessment && assessmentRequired && gates.assessment_gate_met,
  ].filter(Boolean).length;

  // If no gates at all, lesson auto-completes
  if (totalGates === 0) {
    return (
      <Card className={cn('border-primary/30 bg-primary/5', className)}>
        <CardContent className="py-4">
          <div className="flex items-center gap-2 text-primary">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">No requirements - Ready to complete!</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(gates.all_gates_met && 'border-primary/30 bg-primary/5', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            {gates.all_gates_met ? (
              <Unlock className="h-5 w-5 text-primary" />
            ) : (
              <Lock className="h-5 w-5 text-muted-foreground" />
            )}
            Completion Requirements
          </CardTitle>
          <span className={cn(
            'text-sm font-medium',
            gates.all_gates_met ? 'text-primary' : 'text-muted-foreground'
          )}>
            {passedGates}/{totalGates} complete
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Video gate */}
        {hasVideo && (
          <GateItem
            label="Watch the video"
            detail={`${videoWatchedPercent}% of ${requiredWatchPercent}% required`}
            icon={Video}
            passed={gates.video_gate_met}
          />
        )}

        {/* Tactics gate */}
        {hasTactics && tacticsRequiredCount > 0 && (
          <GateItem
            label="Complete required tactics"
            detail={`${tacticsCompletedCount}/${tacticsRequiredCount} completed`}
            icon={Target}
            passed={gates.tactics_gate_met}
          />
        )}

        {/* Assessment gate */}
        {hasAssessment && assessmentRequired && (
          <GateItem
            label="Pass the assessment"
            detail={getAssessmentDetail(assessmentStatus, assessmentScore, passingScore)}
            icon={FileQuestion}
            passed={gates.assessment_gate_met}
            status={assessmentStatus}
          />
        )}

        {/* All gates summary */}
        {gates.all_gates_met && (
          <div className="pt-2 border-t">
            <p className="text-sm text-primary font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              All requirements met! You can mark this lesson complete.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * GateItem - Individual gate status row
 */
interface GateItemProps {
  label: string;
  detail: string;
  icon: React.ElementType;
  passed: boolean;
  status?: string | null;
}

const GateItem = ({ label, detail, icon: Icon, passed, status }: GateItemProps) => (
  <div className={cn(
    'flex items-start gap-3 p-2 rounded-lg transition-colors',
    passed ? 'bg-primary/5' : 'bg-muted/30'
  )}>
    <div className={cn(
      'mt-0.5',
      passed ? 'text-primary' : 'text-muted-foreground'
    )}>
      {passed ? (
        <CheckCircle2 className="h-5 w-5" />
      ) : (
        <Circle className="h-5 w-5" />
      )}
    </div>

    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <Icon className={cn(
          'h-4 w-4',
          passed ? 'text-primary' : 'text-muted-foreground'
        )} />
        <span className={cn(
          'font-medium text-sm',
          passed ? 'text-primary' : 'text-foreground'
        )}>
          {label}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mt-0.5">
        {detail}
      </p>
      {status === 'failed' && (
        <p className="text-xs text-destructive mt-0.5">
          Failed - try again!
        </p>
      )}
    </div>
  </div>
);

/**
 * Helper to format assessment status detail
 */
function getAssessmentDetail(
  status: string | null | undefined,
  score: number | null | undefined,
  passingScore: number | null | undefined
): string {
  const passText = passingScore ? `${passingScore}% to pass` : 'Pass required';

  switch (status) {
    case 'passed':
      return `Passed with ${score ?? 0}% (${passText})`;
    case 'failed':
      return `Scored ${score ?? 0}% (${passText})`;
    case 'in_progress':
      return `In progress (${passText})`;
    case 'not_started':
    default:
      return `Not started (${passText})`;
  }
}

/**
 * CompletionRulesCardSkeleton - Loading state
 */
export const CompletionRulesCardSkeleton = () => (
  <Card>
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-4 w-20" />
      </div>
    </CardHeader>
    <CardContent className="space-y-3">
      {[1, 2].map(i => (
        <div key={i} className="flex items-start gap-3 p-2">
          <Skeleton className="h-5 w-5 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
);
