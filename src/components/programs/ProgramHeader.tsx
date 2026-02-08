// ============================================================================
// FEAT-GH-011: Program Header Component (Apple-esque Redesign)
// ============================================================================
// Minimal, clean header showing title, instructor, and elegant progress
// Removes status badges, simplifies stats, uses subtle progress indicator
// ============================================================================

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProgramWithProgress, PhaseWithProgress } from '@/types/programs';

interface ProgramHeaderProps {
  program: ProgramWithProgress | null;
  phases?: PhaseWithProgress[];
  isLoading?: boolean;
}

/**
 * Calculate overall progress from phases data
 * This ensures consistency with PhaseRoadmap calculations
 */
const calculateProgressFromPhases = (phases: PhaseWithProgress[]): number => {
  const totalLessons = phases.reduce((acc, p) => acc + (p.total_required_lessons || 0), 0);
  const completedLessons = phases.reduce((acc, p) => acc + (p.completed_lessons || 0), 0);
  return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
};

/**
 * Program header with minimal Apple-esque design
 * Clean title, subtle instructor info, elegant progress bar
 */
export const ProgramHeader = ({ program, phases, isLoading }: ProgramHeaderProps) => {
  if (isLoading || !program) {
    return <ProgramHeaderSkeleton />;
  }

  const instructorInitials = program.instructor_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'IN';

  // Calculate progress from phases if available (more accurate), otherwise use enrollment data
  const progressPercent = phases && phases.length > 0
    ? calculateProgressFromPhases(phases)
    : Math.round(program.progress_percent);

  const isCompleted = progressPercent >= 100 || program.computed_status === 'completed';

  return (
    <div className="space-y-6">
      {/* Banner/Thumbnail - kept but with softer gradient */}
      {program.thumbnail_url && (
        <div className="relative h-32 md:h-44 rounded-xl overflow-hidden bg-muted">
          <img
            src={program.thumbnail_url}
            alt={program.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
      )}

      {/* Title and Instructor */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="space-y-2 flex-1 min-w-0">
          {/* Title with completion indicator */}
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              {program.title}
            </h1>
            {isCompleted && (
              <CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0" />
            )}
          </div>

          {program.short_description && (
            <p className="text-muted-foreground leading-relaxed max-w-2xl">
              {program.short_description}
            </p>
          )}

          {/* Minimal stats - text only, no icons */}
          <p className="text-sm text-muted-foreground">
            {program.total_phases} phases · {program.total_lessons} lessons
          </p>
        </div>

        {/* Instructor Info - subtle styling */}
        {program.instructor_name && (
          <div className="flex items-center gap-3 shrink-0">
            <Avatar className="h-9 w-9">
              <AvatarImage src={program.instructor_avatar_url || undefined} />
              <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                {instructorInitials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xs text-muted-foreground">Instructor</p>
              <p className="text-sm font-medium">{program.instructor_name}</p>
            </div>
          </div>
        )}
      </div>

      {/* Elegant Progress - thin bar with percentage */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Progress
            value={progressPercent}
            className={cn(
              'flex-1 h-1.5',
              isCompleted && '[&>div]:bg-emerald-500'
            )}
          />
          <span className={cn(
            'text-sm font-medium tabular-nums w-12 text-right',
            isCompleted ? 'text-emerald-600' : 'text-muted-foreground'
          )}>
            {progressPercent}%
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton loader for ProgramHeader (minimal design)
 */
const ProgramHeaderSkeleton = () => (
  <div className="space-y-6">
    {/* Banner skeleton */}
    <Skeleton className="h-32 md:h-44 rounded-xl" />

    {/* Title and instructor */}
    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
      <div className="space-y-2 flex-1">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full max-w-md" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>

    {/* Progress */}
    <div className="flex items-center gap-3">
      <Skeleton className="h-1.5 flex-1" />
      <Skeleton className="h-4 w-12" />
    </div>
  </div>
);

export default ProgramHeader;
