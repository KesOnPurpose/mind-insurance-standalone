// ============================================================================
// FEAT-GH-010: Program Card Skeleton
// ============================================================================
// Loading placeholder for ProgramCard
// ============================================================================

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const ProgramCardSkeleton = () => {
  return (
    <Card className="overflow-hidden border border-border/50 bg-card">
      {/* Thumbnail skeleton */}
      <Skeleton className="aspect-video w-full" />

      <CardContent className="p-4 space-y-3">
        {/* Title skeleton */}
        <Skeleton className="h-6 w-3/4" />

        {/* Description skeleton */}
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        {/* Meta info skeleton */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
        </div>

        {/* Button skeleton */}
        <Skeleton className="h-10 w-full mt-2" />
      </CardContent>
    </Card>
  );
};

export default ProgramCardSkeleton;
