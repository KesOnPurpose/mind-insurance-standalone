/**
 * TransformationMetrics Component
 * Coverage Center - $100M Mind Insurance Feature
 *
 * Displays transformation progress metrics:
 * - Protocols completed
 * - Total days practiced
 * - Average completion rate
 * - Patterns addressed
 */

import React from 'react';
import {
  TrendingUp,
  Target,
  Calendar,
  Brain,
  CheckCircle2,
  Zap,
  Award,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import type { TransformationMetrics as TransformationMetricsType } from '@/types/coverage';

// ============================================================================
// TYPES
// ============================================================================

interface TransformationMetricsProps {
  metrics: TransformationMetricsType | null;
  currentStreak?: number;
  longestStreak?: number;
  isLoading?: boolean;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function TransformationMetrics({
  metrics,
  currentStreak = 0,
  longestStreak = 0,
  isLoading = false,
  className,
}: TransformationMetricsProps) {
  // Loading state
  if (isLoading) {
    return <TransformationMetricsSkeleton className={className} />;
  }

  // No metrics yet
  if (!metrics) {
    return <TransformationMetricsEmpty className={className} />;
  }

  // Merge streak data from props
  const fullMetrics = {
    ...metrics,
    current_streak: currentStreak,
    longest_streak: longestStreak,
  };

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-purple-500" />
          Transformation Progress
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Primary stats grid */}
        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            icon={CheckCircle2}
            label="Protocols Completed"
            value={metrics.protocols_completed}
            iconColor="text-emerald-500"
          />
          <MetricCard
            icon={Calendar}
            label="Days Practiced"
            value={metrics.total_days_practiced}
            iconColor="text-blue-500"
          />
          <MetricCard
            icon={Target}
            label="Avg Completion"
            value={`${metrics.average_completion_rate}%`}
            iconColor="text-amber-500"
          />
          <MetricCard
            icon={Brain}
            label="Patterns Worked"
            value={metrics.patterns_addressed.length}
            iconColor="text-purple-500"
          />
        </div>

        {/* Completion rate progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Average Protocol Completion
            </span>
            <span className="font-medium">
              {metrics.average_completion_rate}%
            </span>
          </div>
          <Progress value={metrics.average_completion_rate} className="h-2" />
          {metrics.average_completion_rate >= 80 ? (
            <p className="text-xs text-emerald-600 dark:text-emerald-400">
              Excellent consistency! You're building strong neural pathways.
            </p>
          ) : metrics.average_completion_rate >= 50 ? (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Good progress. Consistency will accelerate your transformation.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Every practice strengthens your new patterns.
            </p>
          )}
        </div>

        {/* Patterns addressed */}
        {metrics.patterns_addressed.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Patterns Addressed</h4>
            <div className="flex flex-wrap gap-2">
              {metrics.patterns_addressed.map((pattern) => (
                <Badge key={pattern} variant="secondary" className="text-xs">
                  {formatPatternName(pattern)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Streak comparison */}
        {(currentStreak > 0 || longestStreak > 0) && (
          <div className="p-4 rounded-lg bg-muted/50">
            <h4 className="text-sm font-medium mb-3">Streak Progress</h4>
            <div className="flex items-center justify-between">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {currentStreak}
                </p>
                <p className="text-xs text-muted-foreground">Current Streak</p>
              </div>
              <div className="h-10 w-px bg-border" />
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-500">
                  {longestStreak}
                </p>
                <p className="text-xs text-muted-foreground">Best Streak</p>
              </div>
              {currentStreak >= longestStreak && currentStreak > 0 && (
                <div className="absolute -top-2 right-4">
                  <Badge className="bg-amber-500 text-white text-xs">
                    New Record!
                  </Badge>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// METRIC CARD
// ============================================================================

function MetricCard({
  icon: Icon,
  label,
  value,
  iconColor,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  iconColor: string;
}) {
  return (
    <div className="p-3 rounded-lg bg-muted/50">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={cn('h-4 w-4', iconColor)} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatPatternName(pattern: string): string {
  return pattern
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// ============================================================================
// EMPTY STATE
// ============================================================================

function TransformationMetricsEmpty({ className }: { className?: string }) {
  return (
    <Card className={cn(className)}>
      <CardContent className="py-8 text-center">
        <div className="inline-flex p-3 rounded-full bg-muted mb-4">
          <TrendingUp className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold mb-2">Start Your Transformation</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Complete protocols to track your neural rewiring progress and
          see your transformation metrics grow.
        </p>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// SKELETON
// ============================================================================

function TransformationMetricsSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-3">
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-3 rounded-lg bg-muted/50">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-2 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// COMPACT VERSION
// ============================================================================

/**
 * Compact metrics for dashboard
 */
export function TransformationMetricsCompact({
  metrics,
  className,
}: {
  metrics: TransformationMetricsType | null;
  className?: string;
}) {
  if (!metrics) return null;

  return (
    <div className={cn('flex items-center gap-4', className)}>
      <div className="flex items-center gap-1.5">
        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        <span className="text-sm font-medium">
          {metrics.protocols_completed}
        </span>
        <span className="text-xs text-muted-foreground">protocols</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Target className="h-4 w-4 text-amber-500" />
        <span className="text-sm font-medium">
          {metrics.average_completion_rate}%
        </span>
        <span className="text-xs text-muted-foreground">avg</span>
      </div>
    </div>
  );
}

export default TransformationMetrics;
