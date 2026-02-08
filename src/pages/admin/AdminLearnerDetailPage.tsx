// ============================================================================
// FEAT-GH-018: Admin Learner Detail Page
// ============================================================================
// Individual learner progress view with phase timeline and lesson breakdown
// ============================================================================

import { useParams, useNavigate } from 'react-router-dom';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  ArrowLeft,
  RefreshCw,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import {
  useAdminLearnerDetail,
  useLearnerLessonProgress,
  useClearStuckStatus,
  useAdminProgram,
} from '@/hooks/useAdminPrograms';
import {
  LearnerHeader,
  LearnerProgressTimeline,
  LessonBreakdownTable,
} from '@/components/admin/learners';
import { useToast } from '@/hooks/use-toast';

// ============================================================================
// Loading Skeleton
// ============================================================================

const PageSkeleton = () => (
  <div className="space-y-6 p-6">
    {/* Header skeleton */}
    <div className="flex items-center gap-4">
      <Skeleton className="h-16 w-16 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>

    {/* Timeline skeleton */}
    <div className="space-y-4">
      <Skeleton className="h-6 w-32" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-2 w-32" />
          </div>
        </div>
      ))}
    </div>

    {/* Table skeleton */}
    <div className="space-y-2">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  </div>
);

// ============================================================================
// Error State
// ============================================================================

const ErrorState = ({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) => (
  <div className="flex flex-col items-center justify-center h-64 gap-4">
    <AlertTriangle className="h-12 w-12 text-destructive" />
    <p className="text-lg text-muted-foreground">{message}</p>
    <Button onClick={onRetry} variant="outline">
      <RefreshCw className="h-4 w-4 mr-2" />
      Try Again
    </Button>
  </div>
);

// ============================================================================
// Main Component
// ============================================================================

const AdminLearnerDetailPage = () => {
  const { programId, userId } = useParams<{
    programId: string;
    userId: string;
  }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch data
  const {
    learner,
    isLoading: isLoadingLearner,
    error: learnerError,
    refetch: refetchLearner,
  } = useAdminLearnerDetail(programId, userId);

  const {
    lessons,
    isLoading: isLoadingLessons,
    error: lessonsError,
    refetch: refetchLessons,
  } = useLearnerLessonProgress(programId, userId);

  const { program } = useAdminProgram(programId);

  const { clearStuck, isClearing } = useClearStuckStatus();

  // Handle refresh
  const handleRefresh = () => {
    refetchLearner();
    refetchLessons();
  };

  // Handle clear stuck status
  const handleClearStuck = async () => {
    if (!userId || !learner?.stuck_lesson_id) return;

    const success = await clearStuck(userId, learner.stuck_lesson_id);
    if (success) {
      handleRefresh();
    }
  };

  // Handle reset progress (placeholder - would need confirmation modal)
  const handleResetProgress = async () => {
    toast({
      title: 'Reset Progress',
      description: 'This feature is not yet implemented.',
      variant: 'destructive',
    });
  };

  // Loading state
  if (isLoadingLearner || isLoadingLessons) {
    return (
      <SidebarLayout>
        <PageSkeleton />
      </SidebarLayout>
    );
  }

  // Error state
  if (learnerError || !learner) {
    return (
      <SidebarLayout>
        <div className="p-6">
          <ErrorState
            message={learnerError?.message || 'Learner not found'}
            onRetry={handleRefresh}
          />
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="space-y-6 p-4 md:p-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin/programs">Programs</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/admin/programs/${programId}`}>
                {program?.title || 'Program'}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                {learner.full_name || learner.email}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Back button and actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate(`/admin/programs/${programId}`)}
            className="self-start"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Program
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>

            {learner.is_stuck && learner.stuck_lesson_id && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={isClearing}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Clear Stuck Flag
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear Stuck Status?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will mark the learner as &quot;in progress&quot; instead of
                      &quot;stuck&quot;. They will need to continue making progress to
                      complete the lesson.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearStuck}>
                      Clear Stuck Status
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset Progress
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset Learner Progress?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will reset all progress for this learner in this program.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleResetProgress}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Reset Progress
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Learner Header */}
        <LearnerHeader learner={learner} onRefresh={handleRefresh} />

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Phase Progress Timeline */}
          <div className="lg:col-span-1">
            <LearnerProgressTimeline phases={learner.phases} />
          </div>

          {/* Lesson Breakdown Table */}
          <div className="lg:col-span-2">
            <LessonBreakdownTable
              lessons={lessons}
              isLoading={isLoadingLessons}
            />
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default AdminLearnerDetailPage;
