/**
 * CoverageHeader Component
 * Coverage Center - $100M Mind Insurance Feature
 *
 * Simplified header with compact inline badges.
 * Removes information overload - detailed metrics moved to sidebar.
 *
 * P6 Redesign: Shows only essential info (streak, tokens, milestone progress)
 * as compact badges in a single line.
 */

import React from 'react';
import { ArrowLeft, RefreshCw, Flame, Shield, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CoverageGlossary } from './CoverageGlossary';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { CoverageMilestoneWithProtocol } from '@/types/coverage';

// ============================================================================
// TYPES
// ============================================================================

interface CoverageHeaderProps {
  currentStreak: number;
  longestStreak: number;
  skipTokens: number;
  milestones: CoverageMilestoneWithProtocol[];
  /** Fallback: days completed in active protocol when streak data is empty */
  protocolDaysCompleted?: number;
  /** Fallback: total days in active protocol */
  protocolTotalDays?: number;
  isLoading?: boolean;
  onBack?: () => void;
  onRefresh?: () => void;
  showBackButton?: boolean;
  className?: string;
}

// ============================================================================
// HELPER: Get next milestone label
// ============================================================================

function getNextMilestoneLabel(currentStreak: number): string {
  if (currentStreak >= 66) return 'Transformed';
  if (currentStreak >= 21) return `Day ${currentStreak} → 66`;
  if (currentStreak >= 7) return `Day ${currentStreak} → 21`;
  return `Day ${currentStreak} → 7`;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CoverageHeader({
  currentStreak,
  longestStreak,
  skipTokens,
  milestones,
  protocolDaysCompleted = 0,
  protocolTotalDays = 7,
  isLoading = false,
  onBack,
  onRefresh,
  showBackButton = true,
  className,
}: CoverageHeaderProps) {
  // Use protocol progress as fallback when streak data is empty
  // This handles cases where coverage_streaks table has no data but user has protocol progress
  const displayStreak = currentStreak > 0 ? currentStreak : protocolDaysCompleted;
  const nextMilestone = getNextMilestoneLabel(displayStreak);

  return (
    <header className={cn('space-y-3', className)}>
      {/* Top row: Title and actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBackButton && onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="h-9 w-9"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <h1 className="text-xl font-bold text-white">Coverage Center</h1>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              disabled={isLoading}
              className="h-8 w-8"
              aria-label="Refresh data"
            >
              <RefreshCw
                className={cn('h-4 w-4', isLoading && 'animate-spin')}
              />
            </Button>
          )}
          <CoverageGlossary />
        </div>
      </div>

      {/* Compact Stats Row - Single Line Badges */}
      {/* Single TooltipProvider for all badges to prevent context conflicts */}
      <TooltipProvider delayDuration={200}>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Streak Badge */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full cursor-help',
                  'bg-mi-gold/10 border border-mi-gold/30',
                  displayStreak > 0 ? 'text-mi-gold' : 'text-gray-400'
                )}
              >
                <Flame
                  className={cn(
                    'h-4 w-4',
                    displayStreak > 0 && 'animate-pulse'
                  )}
                  fill={displayStreak > 0 ? 'currentColor' : 'none'}
                />
                <span className="text-sm font-semibold tabular-nums">{displayStreak}</span>
                <span className="text-xs opacity-70">streak</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-mi-navy-light border-mi-cyan/20 z-50">
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {displayStreak === 0
                    ? '🔥 Start your coverage streak!'
                    : `🔥 ${displayStreak} consecutive days of coverage`}
                </p>
                {displayStreak > 0 && displayStreak < 7 && (
                  <p className="text-xs text-mi-gold">
                    {7 - displayStreak} more day{7 - displayStreak > 1 ? 's' : ''} to earn a protection token
                  </p>
                )}
                {longestStreak > displayStreak && (
                  <p className="text-xs text-gray-400">Personal best: {longestStreak} days</p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>

          {/* Protection Tokens Badge */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full cursor-help',
                  'bg-mi-cyan/10 border border-mi-cyan/30',
                  'text-mi-cyan'
                )}
              >
                <Shield className="h-4 w-4" fill="currentColor" />
                <span className="text-sm font-semibold tabular-nums">{skipTokens}</span>
                <span className="text-xs opacity-70 hidden sm:inline">tokens</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-mi-navy-light border-mi-cyan/20 z-50">
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {skipTokens === 0
                    ? '🛡️ No protection tokens yet'
                    : `🛡️ ${skipTokens} protection token${skipTokens > 1 ? 's' : ''}`}
                </p>
                <p className="text-xs text-gray-400">
                  {skipTokens === 0
                    ? 'Complete Day 7 of any protocol to earn your first token'
                    : 'Use tokens to protect your streak when you miss a day'}
                </p>
              </div>
            </TooltipContent>
          </Tooltip>

          {/* Milestone Progress Badge */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full cursor-help',
                  'bg-purple-500/10 border border-purple-500/30',
                  'text-purple-400'
                )}
              >
                <Target className="h-4 w-4" />
                <span className="text-xs font-medium">{nextMilestone}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-mi-navy-light border-mi-cyan/20 z-50">
              <div className="space-y-2">
                <p className="text-sm font-medium">🎯 Milestone Progress</p>
                <p className="text-xs text-gray-400">
                  {displayStreak >= 66
                    ? 'You\'ve achieved the 66-day transformation!'
                    : displayStreak >= 21
                      ? `${66 - displayStreak} days to 66-day transformation milestone`
                      : displayStreak >= 7
                        ? `${21 - displayStreak} days to 21-day breakthrough milestone`
                        : `${7 - displayStreak} days to unlock your first milestone badge`}
                </p>
                {/* Mini progress bar */}
                <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-400 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, displayStreak >= 66 ? 100 : displayStreak >= 21 ? ((displayStreak - 21) / 45) * 100 : displayStreak >= 7 ? ((displayStreak - 7) / 14) * 100 : (displayStreak / 7) * 100)}%`
                    }}
                  />
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </header>
  );
}

// ============================================================================
// COMPACT HEADER VARIANT
// ============================================================================

/**
 * Compact header for mobile or nested views
 */
export function CoverageHeaderCompact({
  currentStreak,
  skipTokens,
  className,
}: {
  currentStreak: number;
  skipTokens: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between p-3 rounded-lg bg-mi-navy-light border border-mi-cyan/20',
        className
      )}
    >
      <div className="flex items-center gap-4">
        <CoverageStreakBadge currentStreak={currentStreak} />
        <SkipTokensBadge tokens={skipTokens} />
      </div>
      <CoverageGlossary />
    </div>
  );
}

// ============================================================================
// DASHBOARD HEADER
// ============================================================================

/**
 * Minimal header for dashboard card
 */
export function CoverageHeaderMinimal({
  currentStreak,
  skipTokens,
  className,
}: {
  currentStreak: number;
  skipTokens: number;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <CoverageStreakBadge currentStreak={currentStreak} />
      <SkipTokensBadge tokens={skipTokens} />
    </div>
  );
}

export default CoverageHeader;
