// ============================================================================
// FEAT-GH-012: Two Gauges Display Component
// ============================================================================
// THE DIFFERENTIATOR: Shows both Video % and Tactics % gauges
// This is what sets us apart from Teachable/Thinkific/Kajabi!
// ============================================================================

import { PlayCircle, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TwoGaugesDisplayProps {
  videoPercent: number;
  tacticsPercent: number;
  tacticsCompleted?: number;
  tacticsTotal?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  className?: string;
}

/**
 * Two Gauges Display - THE DIFFERENTIATOR!
 * Shows Video progress and Tactics completion side by side
 * This is what makes our platform unique vs competitors
 */
export const TwoGaugesDisplay = ({
  videoPercent,
  tacticsPercent,
  tacticsCompleted,
  tacticsTotal,
  size = 'sm',
  showLabels = false,
  className,
}: TwoGaugesDisplayProps) => {
  const sizeClasses = {
    sm: {
      gauge: 'w-8 h-8',
      icon: 'h-3 w-3',
      text: 'text-[10px]',
      ring: 'ring-[2px]',
    },
    md: {
      gauge: 'w-10 h-10',
      icon: 'h-4 w-4',
      text: 'text-xs',
      ring: 'ring-[3px]',
    },
    lg: {
      gauge: 'w-12 h-12',
      icon: 'h-5 w-5',
      text: 'text-sm',
      ring: 'ring-[3px]',
    },
  };

  const sizes = sizeClasses[size];

  // Determine colors based on completion
  const getVideoColor = (percent: number) => {
    if (percent >= 90) return 'text-green-500 ring-green-500/30';
    if (percent > 0) return 'text-primary ring-primary/30';
    return 'text-muted-foreground ring-muted/50';
  };

  const getTacticsColor = (percent: number) => {
    if (percent >= 100) return 'text-green-500 ring-green-500/30';
    if (percent > 0) return 'text-amber-500 ring-amber-500/30';
    return 'text-muted-foreground ring-muted/50';
  };

  const videoColor = getVideoColor(videoPercent);
  const tacticsColor = getTacticsColor(tacticsPercent);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Video Progress Gauge */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                'relative flex items-center justify-center rounded-full bg-background',
                sizes.gauge,
                sizes.ring,
                'ring-inset',
                videoColor
              )}
              style={{
                background: `conic-gradient(currentColor ${videoPercent * 3.6}deg, transparent 0deg)`,
              }}
            >
              <div className="absolute inset-0.5 rounded-full bg-background flex items-center justify-center">
                <PlayCircle className={cn(sizes.icon)} />
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Video: {Math.round(videoPercent)}% watched</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Tactics Progress Gauge */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                'relative flex items-center justify-center rounded-full bg-background',
                sizes.gauge,
                sizes.ring,
                'ring-inset',
                tacticsColor
              )}
              style={{
                background: `conic-gradient(currentColor ${tacticsPercent * 3.6}deg, transparent 0deg)`,
              }}
            >
              <div className="absolute inset-0.5 rounded-full bg-background flex items-center justify-center">
                <CheckSquare className={cn(sizes.icon)} />
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>
              Tactics: {tacticsCompleted ?? Math.round(tacticsPercent)}
              {tacticsTotal !== undefined ? ` of ${tacticsTotal}` : '%'}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Labels (optional) */}
      {showLabels && (
        <div className="flex flex-col gap-0.5">
          <span className={cn(sizes.text, 'text-muted-foreground')}>
            {Math.round(videoPercent)}% video
          </span>
          <span className={cn(sizes.text, 'text-muted-foreground')}>
            {tacticsCompleted ?? Math.round(tacticsPercent)}/{tacticsTotal ?? '100'}% tactics
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * Simple inline version for compact displays
 */
export const TwoGaugesInline = ({
  videoPercent,
  tacticsPercent,
  className,
}: Pick<TwoGaugesDisplayProps, 'videoPercent' | 'tacticsPercent' | 'className'>) => {
  const getProgressColor = (percent: number, threshold: number = 90) => {
    if (percent >= threshold) return 'bg-green-500';
    if (percent > 0) return 'bg-primary';
    return 'bg-muted';
  };

  return (
    <div className={cn('flex items-center gap-3 text-xs', className)}>
      {/* Video Progress */}
      <div className="flex items-center gap-1.5">
        <PlayCircle className="h-3 w-3 text-muted-foreground" />
        <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', getProgressColor(videoPercent))}
            style={{ width: `${Math.min(videoPercent, 100)}%` }}
          />
        </div>
        <span className="text-muted-foreground w-7">{Math.round(videoPercent)}%</span>
      </div>

      {/* Tactics Progress */}
      <div className="flex items-center gap-1.5">
        <CheckSquare className="h-3 w-3 text-muted-foreground" />
        <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', getProgressColor(tacticsPercent, 100))}
            style={{ width: `${Math.min(tacticsPercent, 100)}%` }}
          />
        </div>
        <span className="text-muted-foreground w-7">{Math.round(tacticsPercent)}%</span>
      </div>
    </div>
  );
};

export default TwoGaugesDisplay;
