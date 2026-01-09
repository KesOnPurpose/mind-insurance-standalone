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
          achieved: 'bg-mi-gold/10 text-mi-gold border-mi-gold/30',
          locked: 'bg-mi-navy text-gray-400 border-gray-700',
          icon: isAchieved ? 'text-mi-gold' : 'text-gray-400',
        };
      case 'purple':
        return {
          achieved: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
          locked: 'bg-mi-navy text-gray-400 border-gray-700',
          icon: isAchieved ? 'text-purple-400' : 'text-gray-400',
        };
      case 'gold':
        return {
          achieved: 'bg-mi-gold/10 text-mi-gold border-mi-gold/30',
          locked: 'bg-mi-navy text-gray-400 border-gray-700',
          icon: isAchieved ? 'text-mi-gold' : 'text-gray-400',
        };
      case 'green':
      default:
        return {
          achieved: 'bg-mi-cyan/10 text-mi-cyan border-mi-cyan/30',
          locked: 'bg-mi-navy text-gray-400 border-gray-700',
          icon: isAchieved ? 'text-mi-cyan' : 'text-gray-400',
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
        <TooltipContent side="bottom" className="max-w-xs bg-mi-navy-light border-mi-cyan/20">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Icon className={cn('h-4 w-4', colors.icon)} />
              <p className="font-semibold text-white">{config.label}</p>
            </div>
            <p className="text-sm text-gray-400">{config.description}</p>
            {isAchieved && achievedAt && (
              <p className="text-xs text-gray-400">
                Achieved {new Date(achievedAt).toLocaleDateString()}
              </p>
            )}
            {!isAchieved && daysRequired > 0 && (
              <p className="text-xs text-gray-400">
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
        <h3 className="font-semibold text-lg text-white">{COVERAGE_LANGUAGE.milestone}s</h3>
        {protocolCompletes > 0 && (
          <span className="text-sm text-gray-400">
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
          <p className="text-xs text-gray-400">
            {currentStreak < 7 && `${7 - currentStreak} days to 7-Day Streak`}
            {currentStreak >= 7 && currentStreak < 21 && `${21 - currentStreak} days to 21-Day Breakthrough`}
            {currentStreak >= 21 && currentStreak < 66 && `${66 - currentStreak} days to 66-Day Transformation`}
          </p>
        </div>
      )}

      {/* Transformation achieved message */}
      {currentStreak >= 66 && (
        <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-mi-gold/10 border border-purple-500/30">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-mi-gold" />
            <p className="text-sm font-medium text-purple-400">
              Identity Transformation Complete!
            </p>
          </div>
          <p className="text-xs text-gray-400 mt-1">
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
                      ? 'bg-mi-gold/10 border border-mi-gold/30'
                      : 'bg-mi-navy opacity-40 border border-gray-700'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4',
                      achieved ? 'text-mi-gold' : 'text-gray-400'
                    )}
                    fill={achieved ? 'currentColor' : 'none'}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-mi-navy-light border-mi-cyan/20">
                <p className="text-sm font-medium text-white">{config.label}</p>
                <p className="text-xs text-gray-400">
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
