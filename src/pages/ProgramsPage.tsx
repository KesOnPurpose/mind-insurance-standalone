// ============================================================================
// FEAT-GH-010: Learner Programs Hub
// ============================================================================
// Netflix-style hub where learners see all programs they're enrolled in
// Shows progress, "Continue where you left off" banner, and filter options
// ============================================================================

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { useAuth } from '@/contexts/AuthContext';
import { usePrograms } from '@/hooks/usePrograms';
import {
  ProgramsGrid,
  ProgramsFilter,
  ContinueProgramBanner,
  EmptyProgramsState,
} from '@/components/programs';
import type { ProgramsFilterStatus } from '@/types/programs';

const ProgramsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Filter and search state
  const [filterStatus, setFilterStatus] = useState<ProgramsFilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch programs with progress data
  const { programs, isLoading, error, refetch } = usePrograms({
    status: filterStatus,
    search: searchQuery,
  });

  // Find the most recent in-progress program for "Continue" banner
  const continueProgram = useMemo(() => {
    if (!programs || programs.length === 0) return null;

    // Find in-progress programs sorted by last activity
    const inProgressPrograms = programs
      .filter(p => p.computed_status === 'in_progress')
      .sort((a, b) =>
        new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime()
      );

    return inProgressPrograms[0] || null;
  }, [programs]);

  // Calculate counts for filter tabs
  const counts = useMemo(() => {
    if (!programs) return undefined;

    return {
      all: programs.length,
      in_progress: programs.filter(p => p.computed_status === 'in_progress').length,
      completed: programs.filter(p => p.computed_status === 'completed').length,
      not_started: programs.filter(p => p.computed_status === 'not_started').length,
    };
  }, [programs]);

  // Handle navigation to program
  const handleContinue = (programId: string) => {
    navigate(`/programs/${programId}`);
  };

  // Handle browse programs (would go to catalog/marketplace)
  const handleBrowsePrograms = () => {
    // TODO: Navigate to program catalog when available
    console.log('Browse programs - catalog not yet implemented');
  };

  return (
    <SidebarLayout
      showHeader
      headerTitle="My Programs"
      headerSubtitle="Continue your learning journey"
      headerGradient="linear-gradient(135deg, hsl(187 85% 35%), hsl(210 75% 45%))"
    >
      <div className="space-y-6">
        {/* Continue Where You Left Off Banner */}
        {(filterStatus === 'all' || filterStatus === 'in_progress') && (
          <ContinueProgramBanner
            program={continueProgram}
            isLoading={isLoading}
            onContinue={handleContinue}
          />
        )}

        {/* Filter Tabs + Search */}
        <ProgramsFilter
          activeStatus={filterStatus}
          onStatusChange={setFilterStatus}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          counts={counts}
          showSearch={!isLoading && (programs?.length ?? 0) > 0}
        />

        {/* Error State */}
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
            <p className="text-sm text-destructive mb-2">
              Unable to load your programs. Please try again.
            </p>
            <button
              onClick={() => refetch()}
              className="text-sm font-medium text-destructive hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Programs Grid or Empty State */}
        {!error && (
          <>
            {isLoading ? (
              <ProgramsGrid programs={[]} isLoading skeletonCount={6} />
            ) : programs && programs.length > 0 ? (
              <ProgramsGrid
                programs={programs}
                onContinue={handleContinue}
              />
            ) : (
              <EmptyProgramsState
                filterStatus={filterStatus}
                onBrowsePrograms={handleBrowsePrograms}
              />
            )}
          </>
        )}
      </div>
    </SidebarLayout>
  );
};

export default ProgramsPage;
