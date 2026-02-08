// ============================================================================
// FEAT-GH-011: Phase Roadmap Component (Apple-esque Redesign)
// ============================================================================
// Minimal, clean phase roadmap with subtle progress indicators
// Removes redundant horizontal stepper, uses elegant progress header
// ============================================================================

import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { ArrowRight } from 'lucide-react';
import { PhaseCard, PhaseCardSkeleton } from './PhaseCard';
import type { PhaseWithProgress } from '@/types/programs';

interface PhaseRoadmapProps {
  programId: string;
  phases: PhaseWithProgress[];
  currentPhase: PhaseWithProgress | null;
  isLoading?: boolean;
  onPhaseClick?: (phaseId: string) => void;
}

/**
 * Phase roadmap with minimal Apple-esque design
 * Clean progress header + simplified phase cards
 */
export const PhaseRoadmap = ({
  programId,
  phases,
  currentPhase,
  isLoading,
  onPhaseClick,
}: PhaseRoadmapProps) => {
  const navigate = useNavigate();

  const handlePhaseClick = (phaseId: string) => {
    if (onPhaseClick) {
      onPhaseClick(phaseId);
    } else {
      navigate(`/programs/${programId}/phases/${phaseId}`);
    }
  };

  const handleContinue = () => {
    if (currentPhase) {
      handlePhaseClick(currentPhase.id);
    }
  };

  if (isLoading) {
    return <PhaseRoadmapSkeleton />;
  }

  if (!phases || phases.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">No phases available yet.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Check back soon for new content.
        </p>
      </div>
    );
  }

  // Calculate overall progress based on lesson completion across all phases
  const totalLessons = phases.reduce((acc, p) => acc + (p.total_required_lessons || 0), 0);
  const completedLessons = phases.reduce((acc, p) => acc + (p.completed_lessons || 0), 0);
  const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  // Find current phase index
  const currentPhaseIndex = currentPhase
    ? phases.findIndex(p => p.id === currentPhase.id) + 1
    : 1;

  return (
    <div className="space-y-8">
      {/* Minimal Progress Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-3">
          <h2 className="text-lg font-medium text-foreground">
            Phase {currentPhaseIndex} of {phases.length}
          </h2>
          <div className="flex items-center gap-3">
            <Progress value={overallProgress} className="w-48 h-1.5" />
            <span className="text-sm text-muted-foreground">
              {overallProgress}% complete
            </span>
          </div>
        </div>

        {/* Simplified Continue Button */}
        {currentPhase && currentPhase.status !== 'completed' && (
          <Button onClick={handleContinue} className="shrink-0">
            Continue
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>

      {/* Phase Cards Grid - increased gap for breathing room */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {phases.map((phase, index) => (
          <PhaseCard
            key={phase.id}
            phase={phase}
            phaseNumber={index + 1}
            isActive={currentPhase?.id === phase.id}
            onClick={() => handlePhaseClick(phase.id)}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Skeleton loader for PhaseRoadmap (minimal design)
 */
const PhaseRoadmapSkeleton = () => (
  <div className="space-y-8">
    {/* Minimal header skeleton */}
    <div className="flex items-center justify-between">
      <div className="space-y-3">
        <Skeleton className="h-5 w-32" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-1.5 w-48" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
      <Skeleton className="h-10 w-24" />
    </div>

    {/* Cards skeleton */}
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {[1, 2, 3, 4].map((i) => (
        <PhaseCardSkeleton key={i} />
      ))}
    </div>
  </div>
);

export default PhaseRoadmap;
