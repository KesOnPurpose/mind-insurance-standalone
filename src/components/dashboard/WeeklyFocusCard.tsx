import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ListTodo, ArrowRight, BookOpen, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePrograms, useProgramPhases, usePhaseLessons, useLessonTactics } from '@/hooks/usePrograms';

/**
 * WeeklyFocusCard - Apple-style simplified dashboard card
 *
 * Design Philosophy:
 * - ONE dominant metric based on current context
 * - Priority: Tactics > Lessons > Phase milestones
 * - Links to program/lesson pages (NOT roadmap)
 * - Glanceable in <1 second
 *
 * Data Source:
 * - Pulls from enrolled program's current phase
 * - Shows incomplete tactics from current lesson first
 * - Falls back to lessons, then phase milestones
 */
export function WeeklyFocusCard() {
  // 1. Get the enrolled program to continue
  const { continueProgram, isLoading: programsLoading } = usePrograms();

  // 2. Get phases for the active program to find current phase
  const { currentPhase, phases, isLoading: phasesLoading } = useProgramPhases(continueProgram?.id);

  // 3. Get lessons for the current phase to find current lesson
  const { currentLesson, lessons, isLoading: lessonsLoading } = usePhaseLessons(currentPhase?.id);

  // 4. Get tactics for the current lesson
  const {
    tactics,
    completedRequired,
    totalRequired,
    allRequiredComplete,
    isLoading: tacticsLoading,
  } = useLessonTactics(currentLesson?.id);

  const isLoading = programsLoading || (continueProgram && phasesLoading) ||
    (currentPhase && lessonsLoading) || (currentLesson && tacticsLoading);

  if (isLoading) {
    return (
      <Card className="relative overflow-hidden">
        <CardContent className="pt-6 pb-6 text-center">
          <Skeleton className="h-5 w-32 mx-auto mb-4" />
          <Skeleton className="h-12 w-24 mx-auto mb-2" />
          <Skeleton className="h-4 w-28 mx-auto mb-6" />
          <Skeleton className="h-9 w-32 mx-auto" />
        </CardContent>
      </Card>
    );
  }

  // No enrolled program - show CTA to browse programs
  if (!continueProgram) {
    return (
      <Card className="relative overflow-hidden">
        <CardContent className="pt-6 pb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <ListTodo className="w-5 h-5 text-primary" />
            <span className="font-medium text-muted-foreground text-sm">Current Focus</span>
          </div>

          <p className="text-4xl font-bold text-foreground mb-1">—</p>
          <p className="text-sm text-muted-foreground mb-6">Enroll in a program</p>

          <Link to="/programs">
            <Button size="sm" variant="ghost" className="gap-2">
              Browse Programs <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Program complete - celebrate!
  if (continueProgram.computed_status === 'completed') {
    return (
      <Card className="relative overflow-hidden">
        <CardContent className="pt-6 pb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="font-medium text-muted-foreground text-sm">Current Focus</span>
          </div>

          <p className="text-4xl font-bold text-green-600 mb-1">Done!</p>
          <p className="text-sm text-muted-foreground mb-6">Program completed</p>

          <Link to="/programs">
            <Button size="sm" variant="ghost" className="gap-2">
              View Programs <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Build the program URL
  const programUrl = `/programs/${continueProgram.slug || continueProgram.id}`;

  // PRIORITY 1: Show tactics if there are incomplete required tactics in current lesson
  if (currentLesson && tactics && tactics.length > 0 && !allRequiredComplete && totalRequired > 0) {
    const lessonUrl = `${programUrl}/lessons/${currentLesson.id}`;

    // Calculate phase position (1-indexed for display)
    const currentPhaseNumber = currentPhase ? (currentPhase.order_index ?? 0) + 1 : 1;
    const totalPhases = phases.length || 1;

    return (
      <Card className="relative overflow-hidden">
        <CardContent className="pt-6 pb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <ListTodo className="w-5 h-5 text-primary" />
            <span className="font-medium text-muted-foreground text-sm">Current Focus</span>
          </div>

          {/* Hero Metric - Tactics progress */}
          <p className="text-4xl font-bold text-foreground mb-1">
            {completedRequired} of {totalRequired}
          </p>

          {/* Context - Phase position + Lesson title */}
          <p className="text-sm text-muted-foreground mb-6 truncate px-4">
            Phase {currentPhaseNumber} of {totalPhases} · {currentLesson.title}
          </p>

          {/* CTA to lesson page */}
          <Link to={lessonUrl}>
            <Button size="sm" variant="ghost" className="gap-2">
              Continue Lesson <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // PRIORITY 2: Show phase progress (which phase out of total)
  if (currentLesson && currentPhase) {
    const completedLessons = lessons.filter(l => l.status === 'completed').length;
    const totalLessons = lessons.length;
    const lessonUrl = `${programUrl}/lessons/${currentLesson.id}`;

    // Calculate phase position (1-indexed for display)
    const currentPhaseNumber = (currentPhase.order_index ?? 0) + 1;
    const totalPhases = phases.length;

    // Extract just the descriptive part of phase title (remove "Phase X – " prefix if present)
    const phaseTitle = currentPhase.title.replace(/^Phase\s*\d+\s*[–-]\s*/i, '');

    return (
      <Card className="relative overflow-hidden">
        <CardContent className="pt-6 pb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-primary" />
            <span className="font-medium text-muted-foreground text-sm">Current Focus</span>
          </div>

          {/* Hero Metric - Which phase out of total phases */}
          <p className="text-4xl font-bold text-foreground mb-1">
            Phase {currentPhaseNumber} of {totalPhases}
          </p>

          {/* Context - Lesson progress + Phase name */}
          <p className="text-sm text-muted-foreground mb-6 truncate px-4">
            {completedLessons} of {totalLessons} lessons · {phaseTitle}
          </p>

          {/* CTA to lesson page */}
          <Link to={lessonUrl}>
            <Button size="sm" variant="ghost" className="gap-2">
              Continue Lesson <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // PRIORITY 3: Show phase milestone (all lessons in phase complete, or no current lesson)
  if (currentPhase) {
    const phaseLessonsComplete = currentPhase.status === 'completed';

    // Calculate phase position (1-indexed for display)
    const currentPhaseNumber = (currentPhase.order_index ?? 0) + 1;
    const totalPhases = phases.length;

    // Extract just the descriptive part of phase title (remove "Phase X – " prefix if present)
    const phaseTitle = currentPhase.title.replace(/^Phase\s*\d+\s*[–-]\s*/i, '');

    return (
      <Card className="relative overflow-hidden">
        <CardContent className="pt-6 pb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            {phaseLessonsComplete ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <BookOpen className="w-5 h-5 text-primary" />
            )}
            <span className="font-medium text-muted-foreground text-sm">Current Focus</span>
          </div>

          {/* Hero Metric - Phase progress */}
          <p className={`text-4xl font-bold mb-1 ${phaseLessonsComplete ? 'text-green-600' : 'text-foreground'}`}>
            {currentPhase.progress_percent}%
          </p>

          {/* Context - Phase X of Y + Phase name */}
          <p className="text-sm text-muted-foreground mb-6 truncate px-4">
            Phase {currentPhaseNumber} of {totalPhases} · {phaseTitle}
          </p>

          {/* CTA to program page */}
          <Link to={programUrl}>
            <Button size="sm" variant="ghost" className="gap-2">
              View Program <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Fallback: No current phase (shouldn't happen if enrolled)
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="pt-6 pb-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <ListTodo className="w-5 h-5 text-primary" />
          <span className="font-medium text-muted-foreground text-sm">Current Focus</span>
        </div>

        <p className="text-4xl font-bold text-foreground mb-1">—</p>
        <p className="text-sm text-muted-foreground mb-6">Starting soon</p>

        <Link to={programUrl}>
          <Button size="sm" variant="ghost" className="gap-2">
            View Program <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export default WeeklyFocusCard;
