// ============================================================================
// FEAT-GH-012: Lesson List Component (Apple-esque Redesign)
// ============================================================================
// Minimal, clean lesson list with elegant progress tracking
// Simplified header, consistent with PhaseRoadmap design
// ============================================================================

import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { LessonListItem, LessonListItemSkeleton } from './LessonListItem';
import type { LessonWithProgress } from '@/types/programs';

interface LessonListProps {
  programId: string;
  phaseId: string;
  lessons: LessonWithProgress[];
  currentLesson: LessonWithProgress | null;
  isLoading?: boolean;
  onLessonClick?: (lessonId: string) => void;
}

/**
 * Lesson list with minimal Apple-esque design
 * Clean header, elegant lesson cards, subtle locked section
 */
export const LessonList = ({
  programId,
  phaseId,
  lessons,
  currentLesson,
  isLoading,
  onLessonClick,
}: LessonListProps) => {
  const navigate = useNavigate();

  const handleLessonClick = (lessonId: string) => {
    if (onLessonClick) {
      onLessonClick(lessonId);
    } else {
      navigate(`/programs/${programId}/lessons/${lessonId}`);
    }
  };

  const handleContinue = () => {
    if (currentLesson) {
      handleLessonClick(currentLesson.id);
    }
  };

  if (isLoading) {
    return <LessonListSkeleton />;
  }

  if (!lessons || lessons.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center">
        <p className="text-muted-foreground">No lessons available yet.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Check back soon for new content.
        </p>
      </div>
    );
  }

  // Separate lessons into unlocked and coming up
  const unlockedLessons = lessons.filter(l => l.is_unlocked);
  const lockedLessons = lessons.filter(l => !l.is_unlocked);

  return (
    <div className="space-y-8">
      {/* Minimal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-lg font-medium text-foreground">
          Lessons
        </h2>

        {/* Simplified Continue Button */}
        {currentLesson && currentLesson.status !== 'completed' && (
          <Button onClick={handleContinue} className="shrink-0">
            {currentLesson.status === 'in_progress' ? 'Continue' : 'Start'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>

      {/* Unlocked Lessons */}
      <div className="space-y-3">
        {unlockedLessons.map((lesson, index) => (
          <LessonListItem
            key={lesson.id}
            lesson={lesson}
            lessonNumber={index + 1}
            isActive={currentLesson?.id === lesson.id}
            onClick={() => handleLessonClick(lesson.id)}
          />
        ))}
      </div>

      {/* Coming Up Section (Locked Lessons) - subtle styling */}
      {lockedLessons.length > 0 && (
        <div className="space-y-3 pt-4">
          <p className="text-sm text-muted-foreground">
            Coming up · {lockedLessons.length} {lockedLessons.length === 1 ? 'lesson' : 'lessons'}
          </p>

          {/* Show first 3 locked lessons, rest hidden */}
          {lockedLessons.slice(0, 3).map((lesson, index) => (
            <LessonListItem
              key={lesson.id}
              lesson={lesson}
              lessonNumber={unlockedLessons.length + index + 1}
              isActive={false}
            />
          ))}

          {lockedLessons.length > 3 && (
            <p className="text-xs text-muted-foreground/70 text-center py-2">
              + {lockedLessons.length - 3} more
            </p>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Skeleton loader for LessonList (minimal design)
 */
const LessonListSkeleton = () => (
  <div className="space-y-8">
    {/* Header skeleton */}
    <div className="flex items-center justify-between">
      <div className="h-5 w-20 bg-muted rounded animate-pulse" />
      <div className="h-10 w-24 bg-muted rounded animate-pulse" />
    </div>

    {/* Lessons skeleton */}
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <LessonListItemSkeleton key={i} />
      ))}
    </div>
  </div>
);

export default LessonList;
