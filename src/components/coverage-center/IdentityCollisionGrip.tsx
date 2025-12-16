/**
 * IdentityCollisionGrip Component
 * Coverage Center - $100M Mind Insurance Feature
 *
 * P6 Hero Component - Transformation Evidence System
 *
 * Displays the "tug-of-war" between old identity and new identity.
 * Uses qualitative framing (Weakening/Stable/Tightening) instead of numbers.
 *
 * Behavioral Science Principles:
 * - Variable Reward: Grip status changes create dopamine spikes
 * - Progress Narrative: "The old you is losing" storytelling
 * - Loss Aversion: "Tightening" creates urgency without punishment
 * - Identity Reinforcement: Enemy framing (you vs Identity Collision)
 *
 * Key Question This Answers: "Am I winning against Identity Collision?"
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  TrendingDown,
  TrendingUp,
  Minus,
  Sparkles,
  AlertTriangle,
  Brain,
  Target,
  Zap,
  ChevronDown,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';

// ============================================================================
// TYPES
// ============================================================================

export type GripStrength = 'weakening' | 'stable' | 'tightening';

export interface IdentityCollisionGripProps {
  gripStrength: GripStrength;
  patternName: string;
  triggersCaughtThisWeek?: number;
  weekOverWeekChange?: number; // negative = grip weakening (good!)
  currentStreak?: number;
  hasTodaysPractice?: boolean;
  daysCompleted?: number; // Total days completed in current protocol
  isLoading?: boolean;
  className?: string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const GRIP_CONFIG = {
  weakening: {
    label: 'Weakening',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    icon: TrendingDown,
    markerPosition: 65, // Towards "New You"
  },
  stable: {
    label: 'Stable',
    color: 'text-mi-gold',
    bgColor: 'bg-mi-gold/10',
    borderColor: 'border-mi-gold/30',
    icon: Minus,
    markerPosition: 50, // Center
  },
  tightening: {
    label: 'Tightening',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    icon: TrendingUp,
    markerPosition: 35, // Towards "Old Identity"
  },
} as const;

// ============================================================================
// DYNAMIC STORY NARRATIVES
// ============================================================================

/**
 * Generate personalized, context-aware story narratives
 * Uses behavioral science: Variable reward, progress narrative, identity reinforcement
 */
function getDynamicStory(
  gripStrength: GripStrength,
  patternName: string,
  triggersCaughtThisWeek: number,
  daysCompleted: number,
  currentStreak: number,
  weekOverWeekChange?: number
): string {
  // ---- TIGHTENING: Urgent but hopeful ----
  if (gripStrength === 'tightening') {
    if (daysCompleted === 0) {
      return `${patternName} has a strong hold. That's exactly why you're here. Start Day 1 to break it.`;
    }
    if (currentStreak === 0 && daysCompleted > 0) {
      return `${patternName} fought back and won yesterday. This is the return moment. Show it what changed.`;
    }
    if (triggersCaughtThisWeek > 0) {
      return `${patternName} is resisting, but you've caught it ${triggersCaughtThisWeek} time${triggersCaughtThisWeek > 1 ? 's' : ''}. Every catch weakens its grip.`;
    }
    return `${patternName} is pushing back. Normal. Every pattern fights hardest before it breaks.`;
  }

  // ---- STABLE: Encourage the tipping point ----
  if (gripStrength === 'stable') {
    if (triggersCaughtThisWeek >= 2) {
      return `You caught ${patternName} ${triggersCaughtThisWeek} times this week. One more practice tips the scale in your favor.`;
    }
    if (currentStreak >= 3) {
      return `Three days of showing up. ${patternName}'s grip is starting to slip. Keep the pressure on.`;
    }
    if (daysCompleted >= 3) {
      return `Day ${daysCompleted} of ${7}. The battle is even. Today's practice could shift the balance forever.`;
    }
    return `The old you and new you are locked in battle. Your next move decides who wins.`;
  }

  // ---- WEAKENING: Celebrate transformation! ----
  if (weekOverWeekChange && weekOverWeekChange < 0) {
    return `${patternName}'s grip weakened ${Math.abs(weekOverWeekChange)}% this week. Your nervous system is literally rewiring.`;
  }
  if (currentStreak >= 7) {
    return `Seven days of ${patternName} losing power. This isn't luck—it's neural rewiring in action.`;
  }
  if (triggersCaughtThisWeek >= 3) {
    return `You caught ${patternName} ${triggersCaughtThisWeek} times and kept going anyway. That's the new you emerging.`;
  }
  if (currentStreak >= 3) {
    return `${patternName} is losing its grip on you. The old identity is fading. Keep showing up.`;
  }
  return `You're winning. ${patternName} is weakening. The transformation is underway.`;
}

// ============================================================================
// ACTIONABLE NEXT STEPS
// ============================================================================

/**
 * Get personalized action based on grip state and user behavior
 */
function getActionableNextStep(
  gripStrength: GripStrength,
  currentStreak: number = 0,
  hasTodaysPractice: boolean = false,
  triggersCaught: number = 0,
  patternName: string = 'your pattern',
  daysCompleted: number = 0
): { action: string; detail: string } {
  // Use daysCompleted as a fallback indicator of progress
  const hasAnyProgress = currentStreak > 0 || triggersCaught > 0 || daysCompleted > 0;

  // Tightening: Urgent - get them back on track
  if (gripStrength === 'tightening') {
    if (!hasAnyProgress) {
      // Brand new user with high assessment score
      return {
        action: 'Start your first practice',
        detail: 'Complete Day 1 to begin weakening the grip',
      };
    }
    if (!hasTodaysPractice) {
      return {
        action: "Complete today's practice",
        detail: `${currentStreak > 0 ? 'Protect your streak and ' : ''}start shifting the balance`,
      };
    }
    return {
      action: 'Catch your pattern in action',
      detail: `Notice when ${patternName} shows up today`,
    };
  }

  // Stable: Encourage the tipping point
  if (gripStrength === 'stable') {
    if (!hasTodaysPractice) {
      return {
        action: "Complete today's practice",
        detail: `${3 - currentStreak > 0 ? `${3 - currentStreak} more day${3 - currentStreak > 1 ? 's' : ''} to tip the scale` : 'Keep the momentum going'}`,
      };
    }
    if (currentStreak < 3) {
      return {
        action: `Build to a 3-day streak`,
        detail: `${3 - currentStreak} more day${3 - currentStreak > 1 ? 's' : ''} to start weakening the grip`,
      };
    }
    return {
      action: 'Practice catching triggers',
      detail: "Notice your pattern 2+ times today to shift to 'Weakening'",
    };
  }

  // Weakening: Celebrate and maintain
  if (!hasTodaysPractice) {
    return {
      action: "Complete today's practice",
      detail: "Don't let the grip recover - keep the pressure on",
    };
  }
  if (currentStreak < 7) {
    return {
      action: `Reach Day 7`,
      detail: `${7 - currentStreak} more day${7 - currentStreak > 1 ? 's' : ''} to earn a protection token`,
    };
  }
  return {
    action: 'Maintain your momentum',
    detail: 'The new you is taking root',
  };
}

// ============================================================================
// COMPONENT
// ============================================================================

export function IdentityCollisionGrip({
  gripStrength,
  patternName,
  triggersCaughtThisWeek = 0,
  weekOverWeekChange,
  currentStreak = 0,
  hasTodaysPractice = false,
  daysCompleted = 0,
  isLoading = false,
  className,
}: IdentityCollisionGripProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (isLoading) {
    return <IdentityCollisionGripSkeleton className={className} />;
  }

  const config = GRIP_CONFIG[gripStrength];
  const GripIcon = config.icon;
  const nextStep = getActionableNextStep(gripStrength, currentStreak, hasTodaysPractice, triggersCaughtThisWeek, patternName, daysCompleted);
  const dynamicStory = getDynamicStory(gripStrength, patternName, triggersCaughtThisWeek, daysCompleted, currentStreak, weekOverWeekChange);

  // Check if we have transformation evidence to show
  const hasTransformationEvidence = triggersCaughtThisWeek > 0 || daysCompleted > 0 || (weekOverWeekChange !== undefined && weekOverWeekChange < 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-xl border overflow-hidden',
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      {/* Compact Header - Always Visible (Clickable to expand) */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Brain className={cn('h-5 w-5', config.color)} />
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white text-sm">Collision Grip:</span>
            <div
              className={cn(
                'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold',
                config.bgColor,
                config.borderColor,
                'border',
                config.color
              )}
            >
              <GripIcon className="h-3 w-3" />
              {config.label}
            </div>
          </div>
          {/* Inline pattern name */}
          <span className="text-xs text-gray-500 hidden sm:inline">
            vs {patternName}
          </span>
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-gray-400 transition-transform',
            isExpanded && 'rotate-180'
          )}
        />
      </button>

      {/* Tug-of-War Track - Always Visible (Compact) */}
      <div className="px-3 pb-3">
        <div className="relative">
          <div className="h-2 rounded-full bg-gradient-to-r from-red-500/30 via-gray-600/50 to-emerald-500/30 overflow-hidden">
            <motion.div
              initial={{ left: '50%' }}
              animate={{ left: `${config.markerPosition}%` }}
              transition={{ type: 'spring', stiffness: 100, damping: 15 }}
              className={cn(
                'absolute top-0 w-3 h-2 -translate-x-1/2 rounded-full',
                'bg-white shadow-lg shadow-white/20',
                gripStrength === 'weakening' && 'bg-emerald-400 shadow-emerald-400/30',
                gripStrength === 'tightening' && 'bg-red-400 shadow-red-400/30'
              )}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-red-400/60">Old</span>
            <span className="text-[10px] text-emerald-400/60">New You</span>
          </div>
        </div>
      </div>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-4 pt-1 space-y-3 border-t border-white/10">
              {/* Dynamic Story Line */}
              <p className="text-sm text-gray-300">{dynamicStory}</p>

              {/* Transformation Evidence Section */}
              {hasTransformationEvidence && (
                <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1.5">
                    Transformation Evidence
                  </p>
                  <div className="space-y-1">
                    {triggersCaughtThisWeek > 0 && (
                      <p className="text-xs text-white flex items-center gap-1.5">
                        <span className="text-emerald-400">✓</span>
                        Caught <span className="text-mi-cyan font-semibold">{patternName}</span> {triggersCaughtThisWeek}x
                      </p>
                    )}
                    {daysCompleted > 0 && (
                      <p className="text-xs text-white flex items-center gap-1.5">
                        <span className="text-emerald-400">✓</span>
                        <span className="text-mi-gold font-semibold">{daysCompleted} day{daysCompleted > 1 ? 's' : ''}</span> neural rewiring
                      </p>
                    )}
                    {weekOverWeekChange !== undefined && weekOverWeekChange < 0 && (
                      <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                        <TrendingDown className="h-3 w-3" />
                        {Math.abs(weekOverWeekChange)}% weaker vs last week
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Actionable Next Step */}
              <div className={cn(
                'flex items-start gap-2.5 p-2.5 rounded-lg',
                'bg-white/5 border border-white/10'
              )}>
                <div className={cn(
                  'flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center',
                  gripStrength === 'tightening' ? 'bg-red-500/20' :
                  gripStrength === 'stable' ? 'bg-mi-gold/20' : 'bg-emerald-500/20'
                )}>
                  {gripStrength === 'tightening' ? (
                    <Zap className="h-3 w-3 text-red-400" />
                  ) : gripStrength === 'stable' ? (
                    <Target className="h-3 w-3 text-mi-gold" />
                  ) : (
                    <Sparkles className="h-3 w-3 text-emerald-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white">{nextStep.action}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{nextStep.detail}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================================
// SKELETON
// ============================================================================

function IdentityCollisionGripSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'p-5 rounded-xl border bg-mi-navy-light border-mi-cyan/20',
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full rounded-full mb-6" />
      <Skeleton className="h-4 w-3/4 mb-3" />
      <div className="flex gap-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

// ============================================================================
// COMPACT VERSION (for sidebar)
// ============================================================================

export function IdentityCollisionGripCompact({
  gripStrength,
  className,
}: {
  gripStrength: GripStrength;
  className?: string;
}) {
  const config = GRIP_CONFIG[gripStrength];
  const GripIcon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg',
              config.bgColor,
              config.borderColor,
              'border cursor-help',
              className
            )}
          >
            <GripIcon className={cn('h-4 w-4', config.color)} />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400">Collision Grip</p>
              <p className={cn('text-sm font-semibold', config.color)}>
                {config.label}
              </p>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          className="max-w-xs bg-mi-navy-light border-mi-cyan/20"
        >
          <p className="text-sm">{config.story}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default IdentityCollisionGrip;
