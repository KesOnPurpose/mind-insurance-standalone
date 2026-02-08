/**
 * FEAT-GH-005-E: VideoProgressGauge Component
 *
 * Visual progress indicator showing:
 * - Current watch percentage as circular or linear gauge
 * - Completion threshold marker
 * - Color-coded status (incomplete, almost complete, complete)
 */

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, PlayCircle, Clock } from 'lucide-react';
import type { VideoProgressGaugeProps } from '@/types/video';

// =============================================================================
// CONSTANTS
// =============================================================================

const SIZE_CONFIG = {
  sm: {
    container: 'h-8 w-8',
    strokeWidth: 3,
    iconSize: 'h-3 w-3',
    fontSize: 'text-[10px]',
    linearHeight: 'h-1',
  },
  md: {
    container: 'h-12 w-12',
    strokeWidth: 4,
    iconSize: 'h-4 w-4',
    fontSize: 'text-xs',
    linearHeight: 'h-1.5',
  },
  lg: {
    container: 'h-16 w-16',
    strokeWidth: 5,
    iconSize: 'h-5 w-5',
    fontSize: 'text-sm',
    linearHeight: 'h-2',
  },
};

// =============================================================================
// CIRCULAR GAUGE COMPONENT
// =============================================================================

interface CircularGaugeProps {
  percentage: number;
  threshold: number;
  isComplete: boolean;
  size: 'sm' | 'md' | 'lg';
  showLabel: boolean;
}

function CircularGauge({ percentage, threshold, isComplete, size, showLabel }: CircularGaugeProps) {
  const config = SIZE_CONFIG[size];

  // Calculate circle dimensions
  const containerSize = size === 'sm' ? 32 : size === 'md' ? 48 : 64;
  const radius = (containerSize - config.strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate stroke dashoffset for progress
  const progressOffset = circumference - (percentage / 100) * circumference;
  const thresholdOffset = circumference - (threshold / 100) * circumference;

  // Determine color based on progress
  const getProgressColor = () => {
    if (isComplete) return 'stroke-green-500';
    if (percentage >= threshold - 10) return 'stroke-amber-500';
    return 'stroke-primary';
  };

  return (
    <div className={cn('relative', config.container)}>
      <svg
        className="transform -rotate-90"
        width={containerSize}
        height={containerSize}
        viewBox={`0 0 ${containerSize} ${containerSize}`}
      >
        {/* Background circle */}
        <circle
          cx={containerSize / 2}
          cy={containerSize / 2}
          r={radius}
          fill="none"
          strokeWidth={config.strokeWidth}
          className="stroke-muted"
        />

        {/* Threshold indicator (faint) */}
        <circle
          cx={containerSize / 2}
          cy={containerSize / 2}
          r={radius}
          fill="none"
          strokeWidth={config.strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={thresholdOffset}
          strokeLinecap="round"
          className="stroke-muted-foreground/20"
        />

        {/* Progress circle */}
        <circle
          cx={containerSize / 2}
          cy={containerSize / 2}
          r={radius}
          fill="none"
          strokeWidth={config.strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={progressOffset}
          strokeLinecap="round"
          className={cn('transition-all duration-300', getProgressColor())}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {isComplete ? (
          <CheckCircle2 className={cn('text-green-500', config.iconSize)} />
        ) : showLabel ? (
          <span className={cn('font-medium', config.fontSize)}>
            {Math.round(percentage)}%
          </span>
        ) : (
          <PlayCircle className={cn('text-muted-foreground', config.iconSize)} />
        )}
      </div>
    </div>
  );
}

// =============================================================================
// LINEAR GAUGE COMPONENT
// =============================================================================

interface LinearGaugeProps {
  percentage: number;
  threshold: number;
  isComplete: boolean;
  size: 'sm' | 'md' | 'lg';
  showLabel: boolean;
}

function LinearGauge({ percentage, threshold, isComplete, size, showLabel }: LinearGaugeProps) {
  const config = SIZE_CONFIG[size];

  // Determine color based on progress
  const getProgressColor = () => {
    if (isComplete) return 'bg-green-500';
    if (percentage >= threshold - 10) return 'bg-amber-500';
    return 'bg-primary';
  };

  return (
    <div className="w-full space-y-1">
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className={cn('text-muted-foreground', config.fontSize)}>
            {isComplete ? 'Complete' : `${Math.round(percentage)}% watched`}
          </span>
          <span className={cn('text-muted-foreground', config.fontSize)}>
            {threshold}% to complete
          </span>
        </div>
      )}

      <div className={cn('relative w-full bg-muted rounded-full overflow-hidden', config.linearHeight)}>
        {/* Threshold background indicator */}
        <div
          className="absolute h-full bg-muted-foreground/10 rounded-full"
          style={{ width: `${threshold}%` }}
        />

        {/* Progress bar */}
        <div
          className={cn(
            'absolute h-full rounded-full transition-all duration-300',
            getProgressColor()
          )}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />

        {/* Threshold marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-foreground/30"
          style={{ left: `${threshold}%` }}
        />
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function VideoProgressGauge({
  watchPercentage,
  completionThreshold,
  isComplete,
  size = 'md',
  showLabel = true,
  className,
}: VideoProgressGaugeProps) {
  // Memoize computed values
  const status = useMemo(() => {
    if (isComplete || watchPercentage >= completionThreshold) return 'complete';
    if (watchPercentage >= completionThreshold - 10) return 'almost';
    if (watchPercentage > 0) return 'in_progress';
    return 'not_started';
  }, [watchPercentage, completionThreshold, isComplete]);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <CircularGauge
        percentage={watchPercentage}
        threshold={completionThreshold}
        isComplete={status === 'complete'}
        size={size}
        showLabel={showLabel}
      />
    </div>
  );
}

// =============================================================================
// ALTERNATIVE LINEAR EXPORT
// =============================================================================

export function VideoProgressBar({
  watchPercentage,
  completionThreshold,
  isComplete,
  size = 'md',
  showLabel = true,
  className,
}: VideoProgressGaugeProps) {
  const status = useMemo(() => {
    if (isComplete || watchPercentage >= completionThreshold) return 'complete';
    if (watchPercentage >= completionThreshold - 10) return 'almost';
    if (watchPercentage > 0) return 'in_progress';
    return 'not_started';
  }, [watchPercentage, completionThreshold, isComplete]);

  return (
    <div className={className}>
      <LinearGauge
        percentage={watchPercentage}
        threshold={completionThreshold}
        isComplete={status === 'complete'}
        size={size}
        showLabel={showLabel}
      />
    </div>
  );
}

// =============================================================================
// COMPACT BADGE VARIANT
// =============================================================================

interface VideoProgressBadgeProps {
  watchPercentage: number;
  completionThreshold: number;
  isComplete: boolean;
  className?: string;
}

export function VideoProgressBadge({
  watchPercentage,
  completionThreshold,
  isComplete,
  className,
}: VideoProgressBadgeProps) {
  const status = useMemo(() => {
    if (isComplete || watchPercentage >= completionThreshold) return 'complete';
    if (watchPercentage >= completionThreshold - 10) return 'almost';
    if (watchPercentage > 0) return 'in_progress';
    return 'not_started';
  }, [watchPercentage, completionThreshold, isComplete]);

  const statusConfig = {
    not_started: {
      icon: PlayCircle,
      label: 'Not started',
      className: 'bg-muted text-muted-foreground',
    },
    in_progress: {
      icon: Clock,
      label: `${Math.round(watchPercentage)}%`,
      className: 'bg-primary/10 text-primary',
    },
    almost: {
      icon: Clock,
      label: `${Math.round(watchPercentage)}%`,
      className: 'bg-amber-500/10 text-amber-600',
    },
    complete: {
      icon: CheckCircle2,
      label: 'Complete',
      className: 'bg-green-500/10 text-green-600',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
        config.className,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      <span>{config.label}</span>
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export default VideoProgressGauge;
