// ============================================================================
// FEAT-GH-018: Learner Progress Timeline Component
// ============================================================================
// Visual phase-by-phase progress timeline (stepper)
// ============================================================================

import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Check,
  Circle,
  Lock,
  PlayCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminLearnerPhaseProgress } from '@/types/programs';

// ============================================================================
// Types
// ============================================================================

interface LearnerProgressTimelineProps {
  phases: AdminLearnerPhaseProgress[];
  className?: string;
}

// ============================================================================
// Phase Status Icon
// ============================================================================

const PhaseStatusIcon = ({
  status,
  className = '',
}: {
  status: AdminLearnerPhaseProgress['status'];
  className?: string;
}) => {
  switch (status) {
    case 'completed':
      return (
        <div
          className={cn(
            'h-10 w-10 rounded-full bg-green-500 flex items-center justify-center text-white',
            className
          )}
        >
          <Check className="h-5 w-5" />
        </div>
      );
    case 'in_progress':
      return (
        <div
          className={cn(
            'h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white',
            className
          )}
        >
          <PlayCircle className="h-5 w-5" />
        </div>
      );
    case 'not_started':
      return (
        <div
          className={cn(
            'h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground',
            className
          )}
        >
          <Circle className="h-5 w-5" />
        </div>
      );
    case 'locked':
    default:
      return (
        <div
          className={cn(
            'h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground',
            className
          )}
        >
          <Lock className="h-5 w-5" />
        </div>
      );
  }
};

// ============================================================================
// Phase Status Badge
// ============================================================================

const PhaseStatusBadge = ({
  status,
}: {
  status: AdminLearnerPhaseProgress['status'];
}) => {
  const variants: Record<
    AdminLearnerPhaseProgress['status'],
    { variant: 'default' | 'secondary' | 'outline' | 'destructive'; label: string }
  > = {
    completed: { variant: 'default', label: 'Completed' },
    in_progress: { variant: 'secondary', label: 'In Progress' },
    not_started: { variant: 'outline', label: 'Not Started' },
    locked: { variant: 'outline', label: 'Locked' },
  };

  const { variant, label } = variants[status];

  return (
    <Badge variant={variant} className="text-xs">
      {label}
    </Badge>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const LearnerProgressTimeline = ({
  phases,
  className = '',
}: LearnerProgressTimelineProps) => {
  // Sort phases by order_index
  const sortedPhases = [...phases].sort(
    (a, b) => a.order_index - b.order_index
  );

  const completedCount = phases.filter((p) => p.status === 'completed').length;
  const totalCount = phases.length;

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Phase Progress</CardTitle>
          <Badge variant="secondary">
            {completedCount} / {totalCount} Phases
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {sortedPhases.map((phase, index) => {
            const isLast = index === sortedPhases.length - 1;
            const progressPercent =
              phase.total_lessons > 0
                ? Math.round(
                    (phase.completed_lessons / phase.total_lessons) * 100
                  )
                : 0;

            return (
              <div
                key={phase.phase_id}
                className={cn(
                  'relative flex gap-4',
                  !isLast && 'pb-8'
                )}
              >
                {/* Timeline line */}
                {!isLast && (
                  <div
                    className={cn(
                      'absolute left-5 top-10 bottom-0 w-0.5',
                      phase.status === 'completed'
                        ? 'bg-green-500'
                        : 'bg-muted'
                    )}
                  />
                )}

                {/* Status icon */}
                <PhaseStatusIcon status={phase.status} />

                {/* Phase content */}
                <div className="flex-1 pt-1 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h4 className="font-medium flex items-center gap-2">
                        Phase {phase.order_index + 1}: {phase.phase_title}
                        <PhaseStatusBadge status={phase.status} />
                      </h4>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="flex items-center gap-3">
                    <Progress
                      value={progressPercent}
                      className={cn(
                        'h-2 flex-1 max-w-[200px]',
                        phase.status === 'completed' &&
                          '[&>div]:bg-green-500'
                      )}
                    />
                    <span className="text-sm text-muted-foreground w-16">
                      {phase.completed_lessons}/{phase.total_lessons} lessons
                    </span>
                  </div>

                  {/* Dates */}
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    {phase.started_at && (
                      <span>
                        Started: {format(new Date(phase.started_at), 'MMM d, yyyy')}
                      </span>
                    )}
                    {phase.completed_at && (
                      <span className="text-green-600">
                        Completed: {format(new Date(phase.completed_at), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default LearnerProgressTimeline;
