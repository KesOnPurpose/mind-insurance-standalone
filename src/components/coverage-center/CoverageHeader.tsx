/**
 * CoverageHeader Component
 * Coverage Center - $100M Mind Insurance Feature
 *
 * Header component for Coverage Center page.
 * Displays streak, skip tokens, and glossary access.
 */

import React from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CoverageStreak, CoverageStreakBadge } from './CoverageStreak';
import { SkipTokensDisplay, SkipTokensBadge } from './SkipTokensDisplay';
import { CoverageGlossary } from './CoverageGlossary';
import { CoverageMilestonesCompact } from './CoverageMilestones';
import type { CoverageMilestoneWithProtocol } from '@/types/coverage';

// ============================================================================
// TYPES
// ============================================================================

interface CoverageHeaderProps {
  currentStreak: number;
  longestStreak: number;
  skipTokens: number;
  milestones: CoverageMilestoneWithProtocol[];
  isLoading?: boolean;
  onBack?: () => void;
  onRefresh?: () => void;
  showBackButton?: boolean;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CoverageHeader({
  currentStreak,
  longestStreak,
  skipTokens,
  milestones,
  isLoading = false,
  onBack,
  onRefresh,
  showBackButton = true,
  className,
}: CoverageHeaderProps) {
  return (
    <header className={cn('space-y-4', className)}>
      {/* Top row: Navigation and actions */}
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
          <div>
            <h1 className="text-2xl font-bold">Coverage Center</h1>
            <p className="text-sm text-muted-foreground">
              Your Mind Insurance protocol hub
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              disabled={isLoading}
              className="h-9 w-9"
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

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {/* Streak */}
        <div className="p-4 rounded-lg bg-card border border-border">
          <p className="text-xs text-muted-foreground mb-1">Coverage Streak</p>
          <CoverageStreak
            currentStreak={currentStreak}
            longestStreak={longestStreak}
            showLongest
            size="lg"
            className="justify-start"
          />
        </div>

        {/* Skip Tokens */}
        <div className="p-4 rounded-lg bg-card border border-border">
          <p className="text-xs text-muted-foreground mb-1">Protection Tokens</p>
          <SkipTokensDisplay
            tokens={skipTokens}
            size="lg"
            showLabel
          />
        </div>

        {/* Milestones */}
        <div className="p-4 rounded-lg bg-card border border-border">
          <p className="text-xs text-muted-foreground mb-1">Milestones</p>
          <CoverageMilestonesCompact
            currentStreak={currentStreak}
            achievedMilestones={milestones}
          />
        </div>
      </div>
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
        'flex items-center justify-between p-3 rounded-lg bg-card border border-border',
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
