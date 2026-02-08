// ============================================================================
// FEAT-GH-013: Lesson Breadcrumb Navigation
// ============================================================================
// Breadcrumb navigation: Program > Phase > Lesson
// Mobile-responsive with truncation
// ============================================================================

import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ChevronRight, Home } from 'lucide-react';

interface LessonBreadcrumbProps {
  programId: string;
  programTitle?: string;
  phaseId: string;
  phaseTitle?: string;
  lessonTitle?: string;
  isLoading?: boolean;
  className?: string;
}

/**
 * LessonBreadcrumb - Navigation breadcrumb for lesson pages
 * Program > Phase > Lesson (current)
 */
export const LessonBreadcrumb = ({
  programId,
  programTitle,
  phaseId,
  phaseTitle,
  lessonTitle,
  isLoading = false,
  className,
}: LessonBreadcrumbProps) => {
  if (isLoading) {
    return <LessonBreadcrumbSkeleton />;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center flex-wrap gap-1 text-sm', className)}
    >
      {/* Programs link */}
      <Link
        to="/programs"
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        <Home className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Programs</span>
      </Link>

      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />

      {/* Program link */}
      <Link
        to={`/programs/${programId}`}
        className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[100px] sm:max-w-[150px] md:max-w-none"
        title={programTitle}
      >
        {programTitle || 'Program'}
      </Link>

      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />

      {/* Phase link */}
      <Link
        to={`/programs/${programId}/phases/${phaseId}`}
        className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[100px] sm:max-w-[150px] md:max-w-none"
        title={phaseTitle}
      >
        {phaseTitle || 'Phase'}
      </Link>

      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />

      {/* Current lesson (not a link) */}
      <span
        className="font-medium text-foreground truncate max-w-[120px] sm:max-w-[200px] md:max-w-none"
        title={lessonTitle}
      >
        {lessonTitle || 'Lesson'}
      </span>
    </nav>
  );
};

/**
 * LessonBreadcrumbSkeleton - Loading state
 */
export const LessonBreadcrumbSkeleton = () => (
  <div className="flex items-center gap-1">
    <Skeleton className="h-4 w-16" />
    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
    <Skeleton className="h-4 w-24" />
    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
    <Skeleton className="h-4 w-20" />
    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
    <Skeleton className="h-4 w-28" />
  </div>
);

/**
 * LessonBackButton - Alternative back button for mobile
 */
interface LessonBackButtonProps {
  programId: string;
  phaseId: string;
  phaseTitle?: string;
  className?: string;
}

export const LessonBackButton = ({
  programId,
  phaseId,
  phaseTitle,
  className,
}: LessonBackButtonProps) => (
  <Link
    to={`/programs/${programId}/phases/${phaseId}`}
    className={cn(
      'inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors',
      className
    )}
  >
    <ChevronRight className="h-4 w-4 rotate-180" />
    <span>Back to {phaseTitle || 'Phase'}</span>
  </Link>
);
