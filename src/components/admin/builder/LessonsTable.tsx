// ============================================================================
// FEAT-GH-015: Lessons Table Component
// ============================================================================
// Sortable lessons list with drag-to-reorder
// ============================================================================

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, BookOpen, AlertCircle } from 'lucide-react';
import { useReorderLessons, useDeleteLesson } from '@/hooks/useAdminPrograms';
import { LessonRowItem, LessonCardItem } from './LessonRowItem';
import { useMediaQuery } from '@/hooks/use-media-query';
import type { AdminLesson } from '@/types/programs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// ============================================================================
// Types
// ============================================================================

interface LessonsTableProps {
  phaseId: string;
  programId: string;
  lessons: AdminLesson[];
  isLoading: boolean;
  onAddLesson: () => void;
  onQuickEdit?: (lesson: AdminLesson) => void;
  onRefresh: () => void;
}

// ============================================================================
// Loading Skeleton
// ============================================================================

const LessonsSkeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
        <Skeleton className="h-5 w-5" />
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-8 w-8 rounded" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-8 w-8" />
      </div>
    ))}
  </div>
);

// ============================================================================
// Empty State
// ============================================================================

const EmptyState = ({ onAddLesson }: { onAddLesson: () => void }) => (
  <Card>
    <CardContent className="flex flex-col items-center justify-center py-12">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <BookOpen className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-lg mb-1">No Lessons Yet</h3>
      <p className="text-sm text-muted-foreground text-center mb-4 max-w-sm">
        Create lessons to add content to this phase. Each lesson can include
        video, text, and tactics for learners to complete.
      </p>
      <Button onClick={onAddLesson}>
        <Plus className="mr-2 h-4 w-4" />
        Add First Lesson
      </Button>
    </CardContent>
  </Card>
);

// ============================================================================
// Main Component
// ============================================================================

export const LessonsTable = ({
  phaseId,
  programId,
  lessons,
  isLoading,
  onAddLesson,
  onQuickEdit,
  onRefresh,
}: LessonsTableProps) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { reorderLessons, isReordering } = useReorderLessons();
  const { deleteLesson, isDeleting } = useDeleteLesson();

  // Local state for optimistic reordering
  const [localLessons, setLocalLessons] = useState<AdminLesson[]>(lessons);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Delete confirmation dialog
  const [lessonToDelete, setLessonToDelete] = useState<AdminLesson | null>(null);

  // Update local lessons when prop changes
  useEffect(() => {
    if (!dragIndex) {
      setLocalLessons(lessons);
    }
  }, [lessons, dragIndex]);

  // Drag handlers
  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      if (dragIndex === null || dragIndex === index) return;
      setDragOverIndex(index);
    },
    [dragIndex]
  );

  const handleDragEnd = useCallback(async () => {
    if (
      dragIndex === null ||
      dragOverIndex === null ||
      dragIndex === dragOverIndex
    ) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }

    // Reorder locally (optimistic update)
    const newLessons = [...localLessons];
    const [movedLesson] = newLessons.splice(dragIndex, 1);
    newLessons.splice(dragOverIndex, 0, movedLesson);
    setLocalLessons(newLessons);

    // Reset drag state
    setDragIndex(null);
    setDragOverIndex(null);

    // Save to database
    const orderedIds = newLessons.map((l) => l.id);
    const success = await reorderLessons(phaseId, orderedIds);

    if (!success) {
      // Revert on failure
      setLocalLessons(lessons);
    } else {
      onRefresh();
    }
  }, [
    dragIndex,
    dragOverIndex,
    localLessons,
    lessons,
    phaseId,
    reorderLessons,
    onRefresh,
  ]);

  // Delete handler
  const handleDelete = (lesson: AdminLesson) => {
    setLessonToDelete(lesson);
  };

  const confirmDelete = async () => {
    if (!lessonToDelete) return;

    const success = await deleteLesson(lessonToDelete.id, phaseId);
    if (success) {
      onRefresh();
    }
    setLessonToDelete(null);
  };

  if (isLoading) {
    return <LessonsSkeleton />;
  }

  if (localLessons.length === 0) {
    return <EmptyState onAddLesson={onAddLesson} />;
  }

  // Choose component based on screen size
  const LessonComponent = isMobile ? LessonCardItem : LessonRowItem;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Lessons</h3>
          <p className="text-sm text-muted-foreground">
            {localLessons.length} lesson{localLessons.length !== 1 ? 's' : ''}.
            Drag to reorder.
          </p>
        </div>
        <Button onClick={onAddLesson}>
          <Plus className="mr-2 h-4 w-4" />
          Add Lesson
        </Button>
      </div>

      {/* Lessons List */}
      <div className="space-y-2">
        {localLessons.map((lesson, index) => (
          <LessonComponent
            key={lesson.id}
            lesson={lesson}
            index={index}
            programId={programId}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onQuickEdit={onQuickEdit}
            onDelete={handleDelete}
            isDragging={dragIndex === index}
            dragOverIndex={dragOverIndex}
          />
        ))}
      </div>

      {/* Reordering Indicator */}
      {isReordering && (
        <div className="text-center text-sm text-muted-foreground py-2">
          Saving new order...
        </div>
      )}

      {/* Summary */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Content</span>
            <div className="flex items-center gap-4">
              <span>
                <strong>{localLessons.length}</strong> lessons
              </span>
              <span>
                <strong>
                  {localLessons.reduce((sum, l) => sum + l.tactics_count, 0)}
                </strong>{' '}
                tactics
              </span>
              <span>
                <strong>
                  {localLessons.filter((l) => l.is_required).length}
                </strong>{' '}
                required
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!lessonToDelete}
        onOpenChange={(open) => !open && setLessonToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Delete Lesson
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{lessonToDelete?.title}"? This
              action cannot be undone.
              {lessonToDelete && lessonToDelete.tactics_count > 0 && (
                <span className="block mt-2 text-destructive">
                  Warning: This lesson has {lessonToDelete.tactics_count} tactics
                  that will also be deleted.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete Lesson'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LessonsTable;
