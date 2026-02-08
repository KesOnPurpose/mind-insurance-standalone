// ============================================================================
// FEAT-GH-012: Phase Page
// ============================================================================
// Phase detail page showing all lessons with progress
// Shows phase header with progress and lesson list with two gauges
// ============================================================================

import { useParams, useNavigate } from 'react-router-dom';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { PhaseHeader, PhaseHeaderSkeleton } from '@/components/phases/PhaseHeader';
import { LessonList } from '@/components/phases/LessonList';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { usePhase, usePhaseLessons, useProgram } from '@/hooks/usePrograms';

/**
 * Phase Page - Shows all lessons for a phase with progress tracking
 */
const PhasePage = () => {
  const { programId, phaseId } = useParams<{ programId: string; phaseId: string }>();
  const navigate = useNavigate();

  // Fetch phase data
  const {
    phase,
    isLoading: phaseLoading,
    error: phaseError,
  } = usePhase(phaseId);

  // Fetch lessons for the phase
  const {
    lessons,
    currentLesson,
    isLoading: lessonsLoading,
    error: lessonsError,
  } = usePhaseLessons(phaseId);

  // Fetch program for title in breadcrumb
  const {
    program,
    isLoading: programLoading,
  } = useProgram(programId);

  const handleBack = () => {
    navigate(`/programs/${programId}`);
  };

  const handleLessonClick = (lessonId: string) => {
    navigate(`/programs/${programId}/lessons/${lessonId}`);
  };

  // Error states
  if (phaseError || lessonsError) {
    return (
      <SidebarLayout>
        <div className="container max-w-5xl py-8 px-4 md:px-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {phaseError?.message || lessonsError?.message || 'Unable to load phase data'}
            </AlertDescription>
          </Alert>
          <Button
            variant="outline"
            onClick={handleBack}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Program
          </Button>
        </div>
      </SidebarLayout>
    );
  }

  // Check if phase is locked
  if (phase && phase.status === 'locked') {
    return (
      <SidebarLayout>
        <div className="container max-w-5xl py-8 px-4 md:px-6">
          <div className="text-center py-16 space-y-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
              <AlertCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold">Phase Locked</h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              {phase.unlock_reason || 'Complete the previous phase to unlock this one.'}
            </p>
            <Button onClick={handleBack} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Program
            </Button>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  const isLoading = phaseLoading || programLoading;

  return (
    <SidebarLayout>
      <div className="container max-w-5xl py-8 px-4 md:px-6">
        <div className="space-y-8">
          {/* Phase Header */}
          {isLoading || !phase ? (
            <PhaseHeaderSkeleton />
          ) : (
            <PhaseHeader
              phase={phase}
              programTitle={program?.title}
              onBack={handleBack}
            />
          )}

          {/* Lesson List */}
          <LessonList
            programId={programId || ''}
            phaseId={phaseId || ''}
            lessons={lessons}
            currentLesson={currentLesson}
            isLoading={lessonsLoading}
            onLessonClick={handleLessonClick}
          />
        </div>
      </div>
    </SidebarLayout>
  );
};

export default PhasePage;
