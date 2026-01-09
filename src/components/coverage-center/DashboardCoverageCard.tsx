/**
 * DashboardCoverageCard Component
 * Coverage Center - $100M Mind Insurance Feature
 *
 * Dashboard integration card that displays:
 * - Active coverage type (MIO or Coach)
 * - Coverage Streak badge
 * - Quick access to Coverage Center
 *
 * Placed on MindInsuranceHub under "Today's Practice" card.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Brain,
  Users,
  Flame,
  ChevronRight,
  Sparkles,
  Play,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useCoverageStreak } from '@/hooks/useCoverageStreak';
import type { MIOInsightProtocolWithProgress } from '@/types/protocol';

// ============================================================================
// TYPES
// ============================================================================

interface DashboardCoverageCardProps {
  activeProtocol?: MIOInsightProtocolWithProgress | null;
  hasCoachProtocol?: boolean;
  isLoading?: boolean;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function DashboardCoverageCard({
  activeProtocol,
  hasCoachProtocol = false,
  isLoading = false,
  className,
}: DashboardCoverageCardProps) {
  const navigate = useNavigate();
  const { streak, isLoading: streakLoading } = useCoverageStreak();

  const currentStreak = streak?.current_streak || 0;
  const skipTokens = streak?.skip_tokens || 0;

  // Loading state
  if (isLoading || streakLoading) {
    return <DashboardCoverageCardSkeleton className={className} />;
  }

  // Determine coverage type
  const coverageType = hasCoachProtocol ? 'coach' : activeProtocol ? 'mio' : null;

  // No active coverage
  if (!coverageType) {
    return (
      <DashboardCoverageCardEmpty
        className={className}
        onStartCoverage={() => navigate('/mind-insurance/coverage')}
      />
    );
  }

  // Calculate progress if MIO protocol
  const progress = activeProtocol
    ? Math.round((activeProtocol.current_day / activeProtocol.total_days) * 100)
    : 0;

  return (
    <Card
      className={cn(
        'overflow-hidden cursor-pointer transition-all',
        'bg-mi-navy-light border-purple-500/30 hover:border-purple-500/50',
        className
      )}
      onClick={() => navigate('/mind-insurance/coverage')}
    >
      {/* Gradient accent */}
      <div className="h-1 bg-gradient-to-r from-purple-500 to-indigo-600" />

      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          {/* Left: Protocol info */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20">
                {coverageType === 'coach' ? (
                  <Users className="h-4 w-4 text-blue-400" />
                ) : (
                  <Brain className="h-4 w-4 text-purple-400" />
                )}
              </div>
              <Badge
                variant="outline"
                className="text-xs border-purple-500/50 text-purple-300 bg-purple-500/10"
              >
                <Shield className="h-3 w-3 mr-1" />
                {coverageType === 'coach' ? 'Coach Coverage' : 'MIO Coverage'}
              </Badge>
            </div>

            {/* Protocol title */}
            <h3 className="font-semibold text-white line-clamp-1 mb-1">
              {activeProtocol?.title || 'Active Protocol'}
            </h3>

            {/* Progress */}
            {activeProtocol && (
              <div className="space-y-1.5 mt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">
                    Day {activeProtocol.current_day} of {activeProtocol.total_days}
                  </span>
                  <span className="text-purple-400">{progress}%</span>
                </div>
                <Progress value={progress} className="h-1.5 bg-purple-500/20" />
              </div>
            )}
          </div>

          {/* Right: Streak + CTA */}
          <div className="flex flex-col items-end gap-2">
            {/* Streak badge */}
            {currentStreak > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-mi-gold/10 border border-mi-gold/30">
                <Flame className="h-4 w-4 text-mi-gold" />
                <span className="text-sm font-bold text-mi-gold">
                  {currentStreak}
                </span>
              </div>
            )}

            {/* Skip tokens indicator */}
            {skipTokens > 0 && (
              <div className="flex items-center gap-1">
                {Array.from({ length: skipTokens }).map((_, i) => (
                  <Shield
                    key={i}
                    className="h-3 w-3 text-mi-cyan fill-mi-cyan/30"
                  />
                ))}
              </div>
            )}

            {/* Arrow */}
            <ChevronRight className="h-5 w-5 text-gray-500" />
          </div>
        </div>

        {/* Today's task hint */}
        {activeProtocol && !activeProtocol.is_today_completed && (
          <div className="mt-4 pt-4 border-t border-gray-700/50">
            <div className="flex items-center gap-2 text-sm">
              <Play className="h-4 w-4 text-mi-cyan" />
              <span className="text-gray-300">
                Today's task ready
              </span>
              <Sparkles className="h-3 w-3 text-amber-400" />
            </div>
          </div>
        )}

        {activeProtocol?.is_today_completed && (
          <div className="mt-4 pt-4 border-t border-gray-700/50">
            <div className="flex items-center gap-2 text-sm text-mi-cyan">
              <Calendar className="h-4 w-4" />
              Today's coverage complete
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// EMPTY STATE
// ============================================================================

function DashboardCoverageCardEmpty({
  className,
  onStartCoverage,
}: {
  className?: string;
  onStartCoverage?: () => void;
}) {
  return (
    <Card
      className={cn(
        'overflow-hidden',
        'bg-mi-navy-light border-purple-500/30',
        className
      )}
    >
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20">
            <Shield className="h-6 w-6 text-purple-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white">Coverage Center</h3>
            <p className="text-sm text-gray-400">
              Start your first protocol to activate coverage
            </p>
          </div>
          <Button
            onClick={onStartCoverage}
            variant="outline"
            size="sm"
            className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10"
          >
            View
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// SKELETON
// ============================================================================

function DashboardCoverageCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('overflow-hidden bg-mi-navy-light border-purple-500/30', className)}>
      <div className="h-1 bg-gradient-to-r from-purple-500/50 to-indigo-600/50" />
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Skeleton className="h-7 w-7 rounded-full" />
              <Skeleton className="h-5 w-24" />
            </div>
            <Skeleton className="h-5 w-3/4 mb-3" />
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-8" />
              </div>
              <Skeleton className="h-1.5 w-full" />
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Skeleton className="h-7 w-14 rounded-full" />
            <Skeleton className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// COMPACT VERSION
// ============================================================================

/**
 * Compact badge for header/nav areas
 */
export function CoverageBadge({ className }: { className?: string }) {
  const { streak } = useCoverageStreak();
  const currentStreak = streak?.current_streak || 0;

  if (currentStreak === 0) return null;

  return (
    <div
      className={cn(
        'flex items-center gap-1 px-2 py-0.5 rounded-full',
        'bg-mi-gold/10 border border-mi-gold/30',
        className
      )}
    >
      <Flame className="h-3 w-3 text-mi-gold" />
      <span className="text-xs font-bold text-mi-gold">{currentStreak}</span>
    </div>
  );
}

export default DashboardCoverageCard;
