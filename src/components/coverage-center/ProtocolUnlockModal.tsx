/**
 * ProtocolUnlockModal Component
 * Coverage Center - $100M Mind Insurance Feature
 *
 * Premium glass-morphism celebration modal with identity priming.
 * Shown when user has an unstarted MIO Protocol.
 *
 * Behavioral Science Principles:
 * - Zeigarnik Effect: Create "open loop" about incomplete transformation
 * - Variable Reward Anticipation: Tease what's waiting
 * - Identity Priming: Speak to WHO they're becoming
 * - Commitment Consistency: They took assessment, protocol is next step
 * - Loss Aversion: "7-day window is open"
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  Rocket,
  Unlock,
  ChevronRight,
  Clock,
  Sparkles,
  X,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { PatternType, UnstartedProtocolData } from '@/hooks/useUnstartedProtocol';

// ============================================================================
// TYPES
// ============================================================================

interface ProtocolUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  protocol: UnstartedProtocolData | null;
  variant: 'new_user' | 'returning_user' | 'daily';
  onBeginDay1: () => Promise<void>;
  onRemindLater: () => void;
  currentDay?: number;  // 1-7, required for 'daily' variant
}

// ============================================================================
// PATTERN-SPECIFIC CONTENT
// ============================================================================

interface PatternContent {
  icon: React.ComponentType<{ className?: string }>;
  iconGradient: string;
  headline: string;
  subheadline: string;
  ctaText: string;
  accentColor: string;
}

const PATTERN_CONTENT: Record<PatternType, PatternContent> = {
  compass_crisis: {
    icon: Compass,
    iconGradient: 'from-purple-400 via-violet-500 to-indigo-600',
    headline: 'Your True North Protocol is Ready',
    subheadline: 'MIO identified the uncertainty loop in your thinking. This protocol reveals the direction you\'ve been seeking.',
    ctaText: 'Find My Direction',
    accentColor: 'purple',
  },
  success_sabotage: {
    icon: Rocket,
    iconGradient: 'from-mi-gold via-amber-500 to-orange-500',
    headline: 'Your Success Saboteur Has Been Spotted',
    subheadline: 'MIO spotted the part of you that fears your own power. This protocol builds your capacity for success.',
    ctaText: 'Claim My Success',
    accentColor: 'amber',
  },
  past_prison: {
    icon: Unlock,
    iconGradient: 'from-mi-cyan via-cyan-400 to-blue-500',
    headline: 'Your Prison Door is Unlocked',
    subheadline: 'MIO detected patterns keeping you anchored to who you WERE. This protocol rewires those neural pathways.',
    ctaText: 'Step Into Freedom',
    accentColor: 'cyan',
  },
};

const RETURNING_USER_CONTENT = {
  headline: 'Welcome Back!',
  headlineAccent: 'MIO Has Something Ready',
  subheadline: 'Your personalized transformation protocol is waiting. 7 days to rewire the patterns holding you back.',
};

/**
 * Generate content for daily modal based on day number
 */
function getDailyContent(day: number) {
  return {
    headline: `Day ${day} is Ready`,
    subheadline: `Your transformation continues. Today's practice builds on yesterday's progress. Each day strengthens the new neural pathways.`,
    ctaText: `Begin Day ${day}`,
  };
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ProtocolUnlockModal({
  isOpen,
  onClose,
  protocol,
  variant,
  onBeginDay1,
  onRemindLater,
  currentDay = 1,
}: ProtocolUnlockModalProps) {
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!protocol) return null;

  const patternContent = PATTERN_CONTENT[protocol.patternType];
  const PatternIcon = patternContent.icon;

  // Determine content based on variant
  const isNewUser = variant === 'new_user';
  const isDaily = variant === 'daily';
  const dailyContent = isDaily ? getDailyContent(currentDay) : null;

  const handleBeginDay1 = async () => {
    setIsStarting(true);
    setError(null);

    try {
      await onBeginDay1();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start protocol');
    } finally {
      setIsStarting(false);
    }
  };

  const handleRemindLater = () => {
    onRemindLater();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "w-[95%] sm:max-w-lg p-0",
          // Fix mobile viewport cutoff
          "max-h-[90vh] overflow-y-auto",
          // Premium glass-morphism effect
          "bg-mi-navy/80 backdrop-blur-xl",
          "border border-mi-cyan/20",
          "shadow-[0_8px_32px_rgba(5,195,221,0.15),0_0_80px_rgba(5,195,221,0.08)]",
        )}
      >
        {/* Animated gradient border glow */}
        <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
          <div className="absolute inset-[-2px] bg-gradient-to-br from-mi-cyan/30 via-transparent to-mi-gold/30 opacity-50" />
        </div>

        {/* Hero Section with Pattern Icon */}
        <div className="relative pt-10 pb-6 px-6">
          {/* Background gradient mesh */}
          <div className="absolute inset-0 overflow-hidden">
            <div className={cn(
              'absolute -top-20 -left-20 w-60 h-60 rounded-full opacity-20 blur-3xl',
              `bg-gradient-to-br ${patternContent.iconGradient}`
            )} />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-mi-gold/10 blur-2xl" />
          </div>

          {/* Floating particles animation */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className={cn(
                  "absolute rounded-full",
                  i % 2 === 0 ? "w-1.5 h-1.5 bg-mi-cyan/50" : "w-1 h-1 bg-mi-gold/60"
                )}
                initial={{
                  x: Math.random() * 400,
                  y: Math.random() * 150 + 30,
                  opacity: 0,
                  scale: 0,
                }}
                animate={{
                  y: [null, -30, 0],
                  opacity: [0, 0.8, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 4,
                  delay: i * 0.4,
                  repeat: Infinity,
                  repeatType: 'loop',
                }}
              />
            ))}
          </div>

          {/* Close button - glass style */}
          <button
            onClick={onClose}
            className={cn(
              "absolute top-4 right-4 p-2 rounded-full z-10",
              "bg-white/5 backdrop-blur-sm border border-white/10",
              "text-gray-400 hover:text-white hover:bg-white/10",
              "transition-all duration-200"
            )}
          >
            <X className="h-4 w-4" />
          </button>

          {/* Pattern Icon with premium gradient */}
          <motion.div
            className="relative flex justify-center mb-6"
            initial={{ scale: 0.5, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, type: 'spring', bounce: 0.4 }}
          >
            {/* Outer glow ring */}
            <div className={cn(
              "absolute inset-0 m-auto w-24 h-24 rounded-2xl opacity-40 blur-xl",
              `bg-gradient-to-br ${patternContent.iconGradient}`
            )} />
            {/* Icon container */}
            <div className={cn(
              'relative p-5 rounded-2xl',
              `bg-gradient-to-br ${patternContent.iconGradient}`,
              'shadow-2xl shadow-mi-cyan/30',
              'border border-white/20'
            )}>
              <PatternIcon className="h-12 w-12 text-white drop-shadow-lg" />
            </div>
          </motion.div>

          {/* Headlines */}
          <DialogHeader className="relative z-10 text-center space-y-3">
            <motion.div
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <DialogTitle className="text-2xl sm:text-3xl font-bold">
                {isDaily && dailyContent ? (
                  <span className="text-mi-gold">{dailyContent.headline}</span>
                ) : isNewUser ? (
                  <span className="text-white">{patternContent.headline}</span>
                ) : (
                  <>
                    <span className="text-mi-gold">{RETURNING_USER_CONTENT.headline}</span>
                    <br />
                    <span className="text-white">{RETURNING_USER_CONTENT.headlineAccent}</span>
                  </>
                )}
              </DialogTitle>
            </motion.div>
            <motion.div
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <DialogDescription className="text-gray-300 text-base leading-relaxed">
                {isDaily && dailyContent
                  ? dailyContent.subheadline
                  : isNewUser
                  ? patternContent.subheadline
                  : RETURNING_USER_CONTENT.subheadline}
              </DialogDescription>
            </motion.div>
          </DialogHeader>
        </div>

        {/* Protocol Preview Card - Glass style */}
        <motion.div
          className="mx-6 mb-6"
          initial={{ y: 25, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className={cn(
            "p-5 rounded-2xl",
            "bg-white/5 backdrop-blur-sm",
            "border border-white/10",
            "shadow-inner shadow-white/5"
          )}>
            {/* Protocol Title */}
            <div className="flex items-start gap-4 mb-4">
              <div className={cn(
                "p-2.5 rounded-xl flex-shrink-0",
                "bg-gradient-to-br from-mi-cyan/20 to-mi-gold/10",
                "border border-mi-cyan/30"
              )}>
                <Sparkles className="h-5 w-5 text-mi-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white text-base sm:text-lg">
                  {protocol.title}
                </h3>
                <p className="text-sm text-mi-gold/80 mt-0.5 flex items-center gap-1">
                  <Star className="h-3 w-3 fill-mi-gold text-mi-gold" />
                  Your personalized 7-day protocol
                </p>
              </div>
            </div>

            {/* Insight Summary */}
            <p className="text-gray-300 text-sm leading-relaxed mb-4">
              {protocol.insightSummary}
            </p>

            {/* 7-Day Transformation Preview */}
            <div className="flex items-center gap-3 pt-3 border-t border-white/10">
              <Clock className="h-4 w-4 text-mi-cyan flex-shrink-0" />
              <span className="text-sm text-gray-400">
                {isDaily ? `Day ${currentDay} of 7` : '7-day transformation journey'}
              </span>
              <div className="flex gap-1.5 ml-auto">
                {[...Array(7)].map((_, i) => {
                  const dayNum = i + 1;
                  const isCompleted = isDaily && dayNum < currentDay;
                  const isCurrent = isDaily ? dayNum === currentDay : dayNum === 1;

                  return (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5 + i * 0.05 }}
                      className={cn(
                        'w-2.5 h-2.5 rounded-full',
                        isCompleted
                          ? 'bg-emerald-500 border border-emerald-400/50'
                          : isCurrent
                          ? 'bg-gradient-to-r from-mi-cyan to-mi-gold shadow-sm shadow-mi-cyan/50'
                          : 'bg-white/20 border border-white/10'
                      )}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          className="px-6 pb-6 space-y-3"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          {/* Primary CTA - Premium gradient */}
          <Button
            onClick={handleBeginDay1}
            disabled={isStarting}
            className={cn(
              'w-full h-14 text-lg font-bold tracking-wide',
              'bg-gradient-to-r from-mi-cyan via-mi-cyan to-cyan-400',
              'hover:from-mi-cyan-dark hover:via-mi-cyan hover:to-cyan-500',
              'text-white',
              'shadow-lg shadow-mi-cyan/30',
              'border border-mi-cyan/50',
              'transition-all duration-300',
              'hover:shadow-xl hover:shadow-mi-cyan/40',
              'hover:scale-[1.02]'
            )}
          >
            {isStarting ? (
              <span className="flex items-center gap-2">
                <motion.div
                  className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
                Starting...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                {isDaily && dailyContent ? dailyContent.ctaText : patternContent.ctaText}
                <ChevronRight className="h-5 w-5" />
              </span>
            )}
          </Button>

          {/* Secondary - Remind Later */}
          <Button
            variant="ghost"
            onClick={handleRemindLater}
            disabled={isStarting}
            className={cn(
              "w-full h-11",
              "text-gray-400 hover:text-white",
              "hover:bg-white/5",
              "transition-all duration-200"
            )}
          >
            Remind Me Later
          </Button>
        </motion.div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-6 pb-4"
            >
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 backdrop-blur-sm">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Neural Principle Footer - Subtle glass */}
        <motion.div
          className={cn(
            "px-6 py-5",
            "bg-gradient-to-t from-black/20 to-transparent",
            "border-t border-white/5"
          )}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <p className="text-xs text-gray-500 italic text-center leading-relaxed">
            "The gap between who you are and who you could be is just 7 days of intentional practice.
            Your amygdala will resist — that's the old pattern protecting itself."
          </p>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

export default ProtocolUnlockModal;
