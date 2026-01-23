import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { BookOpen, PlayCircle, ArrowRight, MessageSquare, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePrograms, useProgramPhases, usePhaseLessons } from '@/hooks/usePrograms';

/**
 * ProgramProgressCard - Dashboard card showing current program progress
 *
 * Displays:
 * - Current program and phase
 * - Overall progress percentage with progress bar
 * - Next lesson with duration
 * - Continue Learning CTA
 * - Inline Ask Nette link with program context
 */
export function ProgramProgressCard() {
  const { programs, continueProgram, isLoading: programsLoading } = usePrograms();

  // Get phases for the continue program
  const { currentPhase, isLoading: phasesLoading } = useProgramPhases(continueProgram?.id);

  // Get lessons for the current phase to find next lesson
  const { currentLesson, isLoading: lessonsLoading } = usePhaseLessons(currentPhase?.id);

  const isLoading = programsLoading || (continueProgram && phasesLoading);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full mb-3" />
          <Skeleton className="h-2 w-full mb-4" />
          <Skeleton className="h-16 w-full mb-3" />
          <Skeleton className="h-9 w-full" />
        </CardContent>
      </Card>
    );
  }

  // No programs enrolled - show CTA
  if (!continueProgram || programs.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">My Programs</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            You haven't enrolled in any programs yet. Start your group home journey today!
          </p>
          <Link to="/programs">
            <Button variant="outline" size="sm" className="w-full gap-2">
              Browse Programs
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Program completed
  if (continueProgram.computed_status === 'completed') {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <CardTitle className="text-base">Program Progress</CardTitle>
            </div>
            <Badge variant="default" className="bg-green-600">
              Completed
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="font-medium mb-2">{continueProgram.title}</p>
          <Progress value={100} className="h-2 mb-4" />
          <p className="text-sm text-muted-foreground mb-4">
            Congratulations! You've completed this program.
          </p>
          <Link to="/programs">
            <Button variant="outline" size="sm" className="w-full gap-2">
              View All Programs
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Format lesson duration
  const formatDuration = (seconds: number | null | undefined): string => {
    if (!seconds) return '';
    const minutes = Math.round(seconds / 60);
    return `${minutes} min video`;
  };

  // Calculate phase progress text
  const phaseProgressText = currentPhase
    ? `Phase ${currentPhase.order_index + 1}: ${currentPhase.title}`
    : `${continueProgram.completed_phases} of ${continueProgram.total_phases} phases`;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">Program Progress</CardTitle>
          </div>
          {continueProgram.is_new && (
            <Badge variant="secondary" className="text-xs">
              New
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Program title and phase */}
        <div className="mb-3">
          <p className="font-medium text-sm">{continueProgram.title}</p>
          <p className="text-xs text-muted-foreground">{phaseProgressText}</p>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{Math.round(continueProgram.progress_percent)}%</span>
          </div>
          <Progress value={continueProgram.progress_percent} className="h-2" />
        </div>

        {/* Next lesson preview */}
        {currentLesson && !lessonsLoading && (
          <div className="bg-muted/50 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <PlayCircle className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">Next Up</p>
                <p className="text-sm font-medium truncate">{currentLesson.title}</p>
                {currentLesson.video_duration_seconds && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatDuration(currentLesson.video_duration_seconds)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <Link to={`/programs/${continueProgram.slug || continueProgram.id}`}>
            <Button size="sm" className="w-full gap-2">
              Continue Learning
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>

          {/* Inline Ask Nette link with context */}
          <Link
            to={`/chat?context=program&programId=${continueProgram.id}&programTitle=${encodeURIComponent(continueProgram.title)}`}
            className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors py-1"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Ask Nette about this program</span>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default ProgramProgressCard;
