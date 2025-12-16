/**
 * CoverageStreak Component
 * Coverage Center - $100M Mind Insurance Feature
 *
 * Displays the user's coverage streak with flame icon animation.
 * Shows current streak and longest streak achieved.
 */

import React from 'react';
import { Flame, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { COVERAGE_LANGUAGE } from '@/types/coverage';

// ============================================================================
// TYPES
// ============================================================================

interface CoverageStreakProps {
  currentStreak: number;
  longestStreak?: number;
  showLongest?: boolean;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CoverageStreak({
  currentStreak,
  longestStreak = 0,
  showLongest = false,
  size = 'md',
  animated = true,
  className,
}: CoverageStreakProps) {
  // Determine flame intensity based on streak
  const getFlameColor = () => {
    if (currentStreak >= 66) return 'text-purple-500'; // Transformation milestone
    if (currentStreak >= 21) return 'text-mi-gold'; // Habit formation
    if (currentStreak >= 7) return 'text-mi-gold'; // First milestone
    if (currentStreak >= 1) return 'text-mi-gold';
    return 'text-gray-400';
  };

  const getFlameSize = () => {
    switch (size) {
      case 'sm':
        return 'h-4 w-4';
      case 'lg':
        return 'h-8 w-8';
      default:
        return 'h-6 w-6';
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'sm':
        return 'text-sm';
      case 'lg':
        return 'text-2xl';
      default:
        return 'text-lg';
    }
  };

  const isAtMilestone = currentStreak === 7 || currentStreak === 21 || currentStreak === 66;
  const flameColor = getFlameColor();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'flex items-center gap-1.5',
              className
            )}
          >
            {/* Flame Icon */}
            <div className="relative">
              <Flame
                className={cn(
                  getFlameSize(),
                  flameColor,
                  animated && currentStreak > 0 && 'animate-pulse',
                  isAtMilestone && 'drop-shadow-[0_0_8px_rgba(251,146,60,0.6)]'
                )}
                fill={currentStreak > 0 ? 'currentColor' : 'none'}
              />
              {/* Glow effect for milestone */}
              {isAtMilestone && (
                <div
                  className={cn(
                    'absolute inset-0 rounded-full blur-md opacity-50',
                    'bg-gradient-to-r from-orange-400 to-amber-400',
                    'animate-pulse'
                  )}
                />
              )}
            </div>

            {/* Streak Count */}
            <span
              className={cn(
                'font-bold tabular-nums',
                getTextSize(),
                currentStreak > 0 ? 'text-white' : 'text-gray-400'
              )}
            >
              {currentStreak}
            </span>

            {/* Longest Streak Badge (optional) */}
            {showLongest && longestStreak > 0 && longestStreak > currentStreak && (
              <div className="flex items-center gap-0.5 ml-2 text-gray-400">
                <Trophy className="h-3 w-3" />
                <span className="text-xs">{longestStreak}</span>
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs bg-mi-navy-light border-mi-cyan/20">
          <div className="space-y-1">
            <p className="font-semibold text-white">{COVERAGE_LANGUAGE.streak}</p>
            <p className="text-sm text-gray-400">
              {currentStreak === 0
                ? 'Complete your first protocol day to start your streak!'
                : `${currentStreak} consecutive days of coverage. Keep it going!`}
            </p>
            {longestStreak > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                Longest streak: {longestStreak} days
              </p>
            )}
            {currentStreak >= 7 && currentStreak < 21 && (
              <p className="text-xs text-mi-gold mt-1">
                {21 - currentStreak} days until 21-day breakthrough!
              </p>
            )}
            {currentStreak >= 21 && currentStreak < 66 && (
              <p className="text-xs text-purple-400 mt-1">
                {66 - currentStreak} days until 66-day transformation!
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============================================================================
// VARIANTS
// ============================================================================

/**
 * Compact streak badge for headers and cards
 */
export function CoverageStreakBadge({
  currentStreak,
  className,
}: {
  currentStreak: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full',
        'bg-mi-gold/10 border border-mi-gold/30',
        'text-mi-gold',
        className
      )}
    >
      <Flame className="h-3 w-3" fill="currentColor" />
      <span className="text-xs font-semibold tabular-nums">{currentStreak}</span>
    </div>
  );
}

/**
 * Large streak display for featured areas
 */
export function CoverageStreakHero({
  currentStreak,
  longestStreak,
  className,
}: {
  currentStreak: number;
  longestStreak: number;
  className?: string;
}) {
  const getMilestoneProgress = () => {
    if (currentStreak >= 66) return { next: null, progress: 100 };
    if (currentStreak >= 21) return { next: 66, progress: ((currentStreak - 21) / (66 - 21)) * 100 };
    if (currentStreak >= 7) return { next: 21, progress: ((currentStreak - 7) / (21 - 7)) * 100 };
    return { next: 7, progress: (currentStreak / 7) * 100 };
  };

  const milestone = getMilestoneProgress();

  return (
    <div className={cn('text-center space-y-3', className)}>
      {/* Main streak display */}
      <div className="flex items-center justify-center gap-3">
        <Flame
          className={cn(
            'h-12 w-12 text-mi-gold',
            currentStreak > 0 && 'animate-pulse',
            currentStreak >= 66 && 'text-purple-500'
          )}
          fill={currentStreak > 0 ? 'currentColor' : 'none'}
        />
        <div className="text-left">
          <p className="text-4xl font-bold tabular-nums text-white">{currentStreak}</p>
          <p className="text-sm text-gray-400">{COVERAGE_LANGUAGE.streak}</p>
        </div>
      </div>

      {/* Progress to next milestone */}
      {milestone.next && (
        <div className="space-y-1">
          <div className="h-2 bg-mi-navy rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-mi-gold to-mi-cyan transition-all duration-500"
              style={{ width: `${Math.min(milestone.progress, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-400">
            {milestone.next - currentStreak} days to Day {milestone.next} milestone
          </p>
        </div>
      )}

      {/* Longest streak */}
      {longestStreak > 0 && (
        <div className="flex items-center justify-center gap-1 text-gray-400">
          <Trophy className="h-4 w-4" />
          <span className="text-sm">Best: {longestStreak} days</span>
        </div>
      )}
    </div>
  );
}

export default CoverageStreak;
