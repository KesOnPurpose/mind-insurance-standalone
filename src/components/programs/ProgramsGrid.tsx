// ============================================================================
// FEAT-GH-010: Programs Grid Component
// ============================================================================
// Responsive grid layout for program cards
// ============================================================================

import { ProgramCard } from './ProgramCard';
import { ProgramCardSkeleton } from './ProgramCardSkeleton';
import type { ProgramWithProgress } from '@/types/programs';

interface ProgramsGridProps {
  programs: ProgramWithProgress[];
  isLoading?: boolean;
  onContinue?: (programId: string) => void;
  skeletonCount?: number;
}

export const ProgramsGrid = ({
  programs,
  isLoading = false,
  onContinue,
  skeletonCount = 6,
}: ProgramsGridProps) => {
  // Show skeletons when loading
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <ProgramCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Show programs grid
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {programs.map(program => (
        <ProgramCard
          key={program.id}
          program={program}
          onContinue={onContinue}
        />
      ))}
    </div>
  );
};

export default ProgramsGrid;
