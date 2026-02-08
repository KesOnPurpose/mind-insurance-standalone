// ============================================================================
// FEAT-GH-011: Program Dashboard Page
// ============================================================================
// Main program overview with header, stats, and phase roadmap
// Accessed via /programs/:programId
// ============================================================================

import { useParams, useNavigate, Link } from 'react-router-dom';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useProgram, useProgramPhases } from '@/hooks/usePrograms';
import { ProgramHeader, PhaseRoadmap } from '@/components/programs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react';

const ProgramDashboardPage = () => {
  const { programId } = useParams<{ programId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch program data
  const {
    program,
    isLoading: isProgramLoading,
    error: programError,
    refetch: refetchProgram,
  } = useProgram(programId);

  // Fetch phases for the program
  const {
    phases,
    currentPhase,
    isLoading: isPhasesLoading,
    error: phasesError,
    refetch: refetchPhases,
  } = useProgramPhases(programId);

  const isLoading = isProgramLoading || isPhasesLoading;
  const error = programError || phasesError;

  const handleRefetch = () => {
    refetchProgram();
    refetchPhases();
  };

  // Check if user is enrolled
  const isEnrolled = program?.enrollment_status && program.enrollment_status !== 'cancelled';

  return (
    <SidebarLayout
      showHeader={false}
      mode="programs"
    >
      <div className="space-y-6">
        {/* Back Navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/programs')}
            className="gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Programs
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error loading program</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>
                {error.message || 'Unable to load program details. Please try again.'}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefetch}
                className="ml-4"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Not Enrolled State */}
        {!isLoading && program && !isEnrolled && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Not Enrolled</AlertTitle>
            <AlertDescription>
              You're not currently enrolled in this program. Contact your coach for access.
            </AlertDescription>
          </Alert>
        )}

        {/* Program Header */}
        <ProgramHeader
          program={program}
          phases={phases}
          isLoading={isProgramLoading}
        />

        {/* Divider */}
        {!isLoading && program && (
          <hr className="border-t border-border" />
        )}

        {/* Phase Roadmap */}
        {programId && (
          <PhaseRoadmap
            programId={programId}
            phases={phases}
            currentPhase={currentPhase}
            isLoading={isPhasesLoading}
          />
        )}

        {/* Program Description (if full description exists) */}
        {!isLoading && program?.description && program.description !== program.short_description && (
          <>
            <hr className="border-t border-border" />
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">About This Program</h2>
              <div className="prose prose-sm max-w-none text-muted-foreground">
                <p>{program.description}</p>
              </div>
            </div>
          </>
        )}

        {/* Loading state for content below header */}
        {isPhasesLoading && (
          <div className="space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}
      </div>
    </SidebarLayout>
  );
};

export default ProgramDashboardPage;
