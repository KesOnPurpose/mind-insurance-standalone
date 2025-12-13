/**
 * CoverageMilestones Component
 * Coverage Center - $100M Mind Insurance Feature
 *
 * Displays milestone badges (Day 7, 21, 66) with achievement status.
 * Uses insurance-themed language and neuroscience framing.
 */

import React from 'react';
import { Flame, Brain, Trophy, CheckCircle, Lock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  type MilestoneType,
  type CoverageMilestoneWithProtocol,
  MILESTONE_CONFIGS,
  COVERAGE_LANGUAGE,
} from '@/types/coverage';

// ============================================================================
// TYPES
// ============================================================================

interface CoverageMilestonesProps {
  currentStreak: number;
  achievedMilestones: CoverageMilestoneWithProtocol[];
  showAll?: boolean;
  className?: string;
}

interface MilestoneBadgeProps {
  type: MilestoneType;
  isAchieved: boolean;
  achievedAt?: string;
  currentStreak: number;
  size?: 'sm' | 'md' | 'lg';
}

// ============================================================================
// ICON MAPPING
// ============================================================================

const milestoneIcons: Record<string, React.ElementType> = {
  flame: Flame,
  brain: Brain,
  trophy: Trophy,
  'check-circle': CheckCircle,
};

// ============================================================================
// MILESTONE BADGE
// ============================================================================

function MilestoneBadge({
  type,
  isAchieved,
  achievedAt,
  currentStreak,
  size = 'md',
}: MilestoneBadgeProps) {
  const config = MILESTONE_CONFIGS[type];
  const Icon = milestoneIcons[config.icon] || CheckCircle;
  const daysRequired = config.daysRequired || 0;
  const daysRemaining = daysRequired - currentStreak;
  const progress = daysRequired > 0 ? Math.min((currentStreak / daysRequired) * 100, 100) : 0;

  const getColorClasses = () => {
    switch (config.color) {
      case 'orange':
        return {
          achieved: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-700',
          locked: 'bg-muted text-muted-foreground border-border',
          icon: isAchieved ? 'text-orange-500' : 'text-muted-foreground',
        };
      case 'purple':
        return {
          achieved: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-300 dark:border-purple-700',
          locked: 'bg-muted text-muted-foreground border-border',
          icon: isAchieved ? 'text-purple-500' : 'text-muted-foreground',
        };
      case 'gold':
        return {
          achieved: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700',
          locked: 'bg-muted text-muted-foreground border-border',
          icon: isAchieved ? 'text-amber-500' : 'text-muted-foreground',
        };
      case 'green':
      default:
        return {
          achieved: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700',
          locked: 'bg-muted text-muted-foreground border-border',
          icon: isAchieved ? 'text-emerald-500' : 'text-muted-foreground',
        };
    }
  };

  const colors = getColorClasses();

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return { container: 'p-2', icon: 'h-4 w-4', text: 'text-xs' };
      case 'lg':
        return { container: 'p-4', icon: 'h-8 w-8', text: 'text-base' };
      default:
        return { container: 'p-3', icon: 'h-6 w-6', text: 'text-sm' };
    }
  };

  const sizeClasses = getSizeClasses();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'relative rounded-xl border-2 transition-all',
              sizeClasses.container,
              isAchieved ? colors.achieved : colors.locked,
              isAchieved && 'shadow-sm',
              !isAchieved && 'opacity-60'
            )}
          >
            {/* Icon */}
            <div className="flex flex-col items-center gap-1">
              <div className="relative">
                <Icon
                  className={cn(sizeClasses.icon, colors.icon)}
                  fill={isAchieved ? 'currentColor' : 'none'}
                />
                {isAchieved && (
                  <Sparkles
                    className="absolute -top-1 -right-1 h-3 w-3 text-amber-400 animate-pulse"
                  />
                )}
                {!isAchieved && (
                  <Lock className="absolute -bottom-0.5 -right-0.5 h-3 w-3 text-muted-foreground" />
                )}
              </div>

              {/* Label */}
              <span className={cn('font-semibold', sizeClasses.text)}>
                {config.label}
              </span>
            </div>

            {/* Progress ring for locked milestones */}
            {!isAchieved && daysRequired > 0 && progress > 0 && (
              <div className="absolute inset-0 rounded-xl overflow-hidden">
                <div
                  className="absolute bottom-0 left-0 right-0 bg-current/10 transition-all duration-500"
                  style={{ height: `${progress}%` }}
                />
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Icon className={cn('h-4 w-4', colors.icon)} />
              <p className="font-semibold">{config.label}</p>
            </div>
            <p className="text-sm text-muted-foreground">{config.description}</p>
            {isAchieved && achievedAt && (
              <p className="text-xs text-muted-foreground">
                Achieved {new Date(achievedAt).toLocaleDateString()}
              </p>
            )}
            {!isAchieved && daysRequired > 0 && (
              <p className="text-xs text-muted-foreground">
                {daysRemaining > 0
                  ? `${daysRemaining} more days to unlock`
                  : 'Keep going!'}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CoverageMilestones({
  currentStreak,
  achievedMilestones,
  showAll = true,
  className,
}: CoverageMilestonesProps) {
  // Check if specific milestones are achieved
  const isMilestoneAchieved = (type: MilestoneType) => {
    return achievedMilestones.some((m) => m.milestone_type === type);
  };

  const getMilestoneAchievedAt = (type: MilestoneType) => {
    const milestone = achievedMilestones.find((m) => m.milestone_type === type);
    return milestone?.achieved_at;
  };

  // Streak milestones to display
  const streakMilestones: MilestoneType[] = ['day_7', 'day_21', 'day_66'];

  // Count protocol completions
  const protocolCompletes = achievedMilestones.filter(
    (m) => m.milestone_type === 'protocol_complete'
  ).length;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">{COVERAGE_LANGUAGE.milestone}s</h3>
        {protocolCompletes > 0 && (
          <span className="text-sm text-muted-foreground">
            {protocolCompletes} protocol{protocolCompletes > 1 ? 's' : ''} completed
          </span>
        )}
      </div>

      {/* Streak Milestones */}
      <div className="grid grid-cols-3 gap-3">
        {streakMilestones.map((type) => (
          <MilestoneBadge
            key={type}
            type={type}
            isAchieved={isMilestoneAchieved(type)}
            achievedAt={getMilestoneAchievedAt(type)}
            currentStreak={currentStreak}
          />
        ))}
      </div>

      {/* Progress indicator */}
      {currentStreak > 0 && currentStreak < 66 && (
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            {currentStreak < 7 && `${7 - currentStreak} days to 7-Day Streak`}
            {currentStreak >= 7 && currentStreak < 21 && `${21 - currentStreak} days to 21-Day Breakthrough`}
            {currentStreak >= 21 && currentStreak < 66 && `${66 - currentStreak} days to 66-Day Transformation`}
          </p>
        </div>
      )}

      {/* Transformation achieved message */}
      {currentStreak >= 66 && (
        <div className="p-3 rounded-lg bg-gradient-to-r from-purple-100 to-amber-100 dark:from-purple-900/30 dark:to-amber-900/30 border border-purple-200 dark:border-purple-700">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
              Identity Transformation Complete!
            </p>
          </div>
          <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
            You've installed a new neural default. Keep building on this foundation.
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// COMPACT VERSION
// ============================================================================

/**
 * Horizontal compact version for headers
 */
export function CoverageMilestonesCompact({
  currentStreak,
  achievedMilestones,
  className,
}: {
  currentStreak: number;
  achievedMilestones: CoverageMilestoneWithProtocol[];
  className?: string;
}) {
  const streakMilestones: MilestoneType[] = ['day_7', 'day_21', 'day_66'];

  const isMilestoneAchieved = (type: MilestoneType) => {
    return achievedMilestones.some((m) => m.milestone_type === type);
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {streakMilestones.map((type) => {
        const config = MILESTONE_CONFIGS[type];
        const Icon = milestoneIcons[config.icon] || CheckCircle;
        const achieved = isMilestoneAchieved(type);

        return (
          <TooltipProvider key={type}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    'rounded-full p-1.5 transition-all',
                    achieved
                      ? 'bg-amber-100 dark:bg-amber-900/30'
                      : 'bg-muted opacity-40'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4',
                      achieved ? 'text-amber-500' : 'text-muted-foreground'
                    )}
                    fill={achieved ? 'currentColor' : 'none'}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm font-medium">{config.label}</p>
                <p className="text-xs text-muted-foreground">
                  {achieved ? 'Achieved!' : config.description}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
}

export default CoverageMilestones;
