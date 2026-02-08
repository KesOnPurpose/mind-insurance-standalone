// ============================================================================
// FEAT-GH-015: Admin Phase Builder Page
// ============================================================================
// Phase detail page with lessons management
// Route: /admin/programs/:programId/phases/:phaseId
// ============================================================================

import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  Eye,
  EyeOff,
  ExternalLink,
  BookOpen,
  Target,
  Clock,
} from 'lucide-react';
import { useAdminPhase, useAdminProgram } from '@/hooks/useAdminPrograms';
import {
  PhaseEditor,
  LessonsTable,
  AddLessonModal,
  LessonQuickEdit,
} from '@/components/admin/builder';
import type { AdminLesson } from '@/types/programs';

// ============================================================================
// Status Badge
// ============================================================================

const StatusBadge = ({ status }: { status: 'draft' | 'published' }) => {
  if (status === 'draft') {
    return (
      <Badge variant="secondary" className="gap-1">
        <EyeOff className="h-3 w-3" />
        Draft
      </Badge>
    );
  }
  return (
    <Badge variant="default" className="gap-1">
      <Eye className="h-3 w-3" />
      Published
    </Badge>
  );
};

// ============================================================================
// Header Skeleton
// ============================================================================

const HeaderSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-4 w-64" />
    <div className="flex items-center gap-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-5 w-20" />
    </div>
    <Skeleton className="h-4 w-96" />
    <div className="flex gap-4">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-24" />
    </div>
  </div>
);

// ============================================================================
// Main Component
// ============================================================================

export const PhaseBuilderPage = () => {
  const { programId, phaseId } = useParams<{
    programId: string;
    phaseId: string;
  }>();
  const navigate = useNavigate();

  // Fetch data
  const {
    phase,
    isLoading: isPhaseLoading,
    refetch: refetchPhase,
  } = useAdminPhase(phaseId);
  const { program, isLoading: isProgramLoading } = useAdminProgram(programId);

  // Add lesson modal state
  const [showAddLesson, setShowAddLesson] = useState(false);

  // Quick edit lesson state
  const [quickEditLesson, setQuickEditLesson] = useState<AdminLesson | null>(
    null
  );

  // Loading state
  const isLoading = isPhaseLoading || isProgramLoading;

  // Not found state
  if (!isLoading && !phase && phaseId) {
    return (
      <SidebarLayout mode="admin">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <h2 className="text-xl font-semibold mb-2">Phase Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The phase you're looking for doesn't exist or you don't have access.
          </p>
          <Button
            variant="outline"
            onClick={() => navigate(`/admin/programs/${programId}`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Program
          </Button>
        </div>
      </SidebarLayout>
    );
  }

  // Handle successful lesson creation
  const handleLessonCreated = (lessonId: string) => {
    refetchPhase();
    // Optionally navigate to lesson editor
    // navigate(`/admin/programs/${programId}/lessons/${lessonId}`);
  };

  return (
    <SidebarLayout mode="admin">
      <div className="space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/admin/programs">Programs</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {isProgramLoading ? (
                <Skeleton className="h-4 w-24" />
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={`/admin/programs/${programId}`}>
                    {program?.title || 'Program'}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {isPhaseLoading ? (
                <Skeleton className="h-4 w-24" />
              ) : (
                <BreadcrumbPage>{phase?.title || 'Phase'}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => navigate(`/admin/programs/${programId}?tab=phases`)}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Phases
        </Button>

        {/* Page Header */}
        {isLoading ? (
          <HeaderSkeleton />
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="outline" className="text-xs">
                  Phase {(phase?.order_index || 0) + 1}
                </Badge>
                <h1 className="text-2xl font-bold tracking-tight">
                  {phase?.title}
                </h1>
                {phase && <StatusBadge status={phase.status} />}
                {phase?.is_required && (
                  <Badge variant="secondary" className="text-xs">
                    Required
                  </Badge>
                )}
              </div>
              {phase?.description && (
                <p className="text-muted-foreground max-w-xl line-clamp-2">
                  {phase.description}
                </p>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  {phase?.total_lessons || 0} lessons
                </span>
                <span className="flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  {phase?.total_tactics || 0} tactics
                </span>
                {phase?.estimated_duration_minutes && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {phase.estimated_duration_minutes} min
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            {phase?.status === 'published' && (
              <Button variant="outline" asChild>
                <Link
                  to={`/programs/${programId}/phases/${phaseId}`}
                  target="_blank"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View as Learner
                </Link>
              </Button>
            )}
          </div>
        )}

        {/* Phase Editor (Collapsible) */}
        {phase && <PhaseEditor phase={phase} onUpdate={refetchPhase} />}

        {/* Lessons Table */}
        <LessonsTable
          phaseId={phaseId || ''}
          programId={programId || ''}
          lessons={phase?.lessons || []}
          isLoading={isPhaseLoading}
          onAddLesson={() => setShowAddLesson(true)}
          onQuickEdit={setQuickEditLesson}
          onRefresh={refetchPhase}
        />

        {/* Add Lesson Modal */}
        <AddLessonModal
          open={showAddLesson}
          onOpenChange={setShowAddLesson}
          phaseId={phaseId || ''}
          onSuccess={handleLessonCreated}
        />

        {/* Quick Edit Popover (triggered from LessonsTable) */}
        {quickEditLesson && (
          <LessonQuickEdit
            lesson={quickEditLesson}
            trigger={<span />}
            onUpdate={() => {
              refetchPhase();
              setQuickEditLesson(null);
            }}
          />
        )}
      </div>
    </SidebarLayout>
  );
};

export default PhaseBuilderPage;
