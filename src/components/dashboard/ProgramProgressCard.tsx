import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { BookOpen, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePrograms, useProgramPhases } from '@/hooks/usePrograms';
import type { PhaseWithProgress } from '@/types/programs';

/**
 * Calculate overall progress from phases data
 * This ensures consistency with ProgramHeader/PhaseRoadmap calculations
 */
const calculateProgressFromPhases = (phases: PhaseWithProgress[]): number => {
  const totalLessons = phases.reduce((acc, p) => acc + (p.total_required_lessons || 0), 0);
  const completedLessons = phases.reduce((acc, p) => acc + (p.completed_lessons || 0), 0);
  return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
};

/**
 * ProgramProgressCard - Apple-style simplified dashboard card
 *
 * Design Philosophy:
 * - ONE dominant metric (progress %)
 * - Glanceable in <1 second
 * - Generous whitespace
 * - Single focused CTA
 *
 * Progress Calculation:
 * Uses dynamic calculation from phases data (completed_lessons / total_required_lessons)
 * to ensure accuracy and sync with the program detail page.
 */
export function ProgramProgressCard() {
  const { programs, continueProgram, isLoading: programsLoading } = usePrograms();

  // Fetch phases for the active program to calculate accurate progress
  const { phases, isLoading: phasesLoading } = useProgramPhases(continueProgram?.id);

  const isLoading = programsLoading || (continueProgram && phasesLoading);

  if (isLoading) {
    return (
      <Card className="relative overflow-hidden">
        <CardContent className="pt-6 pb-6 text-center">
          <Skeleton className="h-5 w-32 mx-auto mb-4" />
          <Skeleton className="h-12 w-20 mx-auto mb-2" />
          <Skeleton className="h-2 w-full mb-6" />
          <Skeleton className="h-9 w-32 mx-auto" />
        </CardContent>
      </Card>
    );
  }

  // No programs enrolled - show CTA
  if (!continueProgram || programs.length === 0) {
    return (
      <Card className="relative overflow-hidden">
        <CardContent className="pt-6 pb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-primary" />
            <span className="font-medium text-muted-foreground text-sm">My Programs</span>
          </div>

          <p className="text-4xl font-bold text-foreground mb-1">—</p>
          <p className="text-sm text-muted-foreground mb-6">No programs yet</p>

          <Link to="/programs">
            <Button size="sm" variant="ghost" className="gap-2">
              Browse Programs <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Program completed
  if (continueProgram.computed_status === 'completed') {
    return (
      <Card className="relative overflow-hidden">
        <CardContent className="pt-6 pb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-primary" />
            <span className="font-medium text-muted-foreground text-sm">Program Progress</span>
          </div>

          <p className="text-4xl font-bold text-green-600 mb-1">100%</p>
          <p className="text-sm text-muted-foreground mb-2">Complete!</p>
          <Progress value={100} className="h-2 mb-6" />

          <Link to="/programs">
            <Button size="sm" variant="ghost" className="gap-2">
              View Programs <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Calculate progress from phases if available (more accurate), otherwise use enrollment data
  const progressPercent = phases && phases.length > 0
    ? calculateProgressFromPhases(phases)
    : Math.round(continueProgram.progress_percent);

  return (
    <Card className="relative overflow-hidden" data-tour-target="program-progress">
      <CardContent className="pt-6 pb-6 text-center">
        {/* Icon + Title row */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-primary" />
          <span className="font-medium text-muted-foreground text-sm">Program Progress</span>
        </div>

        {/* Hero Metric */}
        <p className="text-4xl font-bold text-foreground mb-1">{progressPercent}%</p>

        {/* Context */}
        <p className="text-sm text-muted-foreground mb-2 truncate px-4">
          {continueProgram.title}
        </p>

        {/* Progress bar */}
        <Progress value={progressPercent} className="h-2 mb-6" />

        {/* Single CTA */}
        <Link to={`/programs/${continueProgram.slug || continueProgram.id}`}>
          <Button size="sm" variant="ghost" className="gap-2">
            Continue <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export default ProgramProgressCard;
