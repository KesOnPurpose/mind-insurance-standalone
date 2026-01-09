/**
 * AnalyzingAnimation Component
 * First Session - $100M Mind Insurance Feature
 *
 * Brain/loading animation shown while AI generates protocol.
 * Creates anticipation and perceived value (10-30s window).
 */

import React, { useState, useEffect } from 'react';
import { Brain, Sparkles, Zap, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

// ============================================================================
// TYPES
// ============================================================================

interface AnalyzingAnimationProps {
  isAnalyzing?: boolean;
  onComplete?: () => void;
  minDuration?: number; // Minimum time to show animation (ms)
  className?: string;
}

// Analysis stages for visual feedback
const ANALYSIS_STAGES = [
  { label: 'Mapping neural patterns...', icon: Brain, duration: 3000 },
  { label: 'Identifying collision points...', icon: Target, duration: 4000 },
  { label: 'Decoding behavioral signatures...', icon: Zap, duration: 4000 },
  { label: 'Designing your protocol...', icon: Sparkles, duration: 4000 },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function AnalyzingAnimation({
  isAnalyzing = true,
  onComplete,
  minDuration = 10000, // 10 second minimum
  className,
}: AnalyzingAnimationProps) {
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [startTime] = useState(Date.now());

  // Progress through stages
  useEffect(() => {
    if (!isAnalyzing) return;

    const stageInterval = setInterval(() => {
      setCurrentStage((prev) => {
        if (prev >= ANALYSIS_STAGES.length - 1) {
          return prev;
        }
        return prev + 1;
      });
    }, 3500);

    return () => clearInterval(stageInterval);
  }, [isAnalyzing]);

  // Smooth progress bar
  useEffect(() => {
    if (!isAnalyzing) return;

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        // Slow down as we approach 100%
        const remaining = 95 - prev;
        const increment = Math.max(0.5, remaining * 0.08);
        return Math.min(95, prev + increment);
      });
    }, 200);

    return () => clearInterval(progressInterval);
  }, [isAnalyzing]);

  // Handle completion
  useEffect(() => {
    if (!isAnalyzing && onComplete) {
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, minDuration - elapsed);

      // Ensure minimum duration is met
      setTimeout(() => {
        setProgress(100);
        setTimeout(onComplete, 500);
      }, remainingTime);
    }
  }, [isAnalyzing, onComplete, startTime, minDuration]);

  const CurrentIcon = ANALYSIS_STAGES[currentStage]?.icon || Brain;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-8',
        'animate-in fade-in duration-500',
        className
      )}
    >
      {/* Animated Brain */}
      <div className="relative mb-8">
        {/* Outer glow */}
        <div className="absolute inset-0 animate-pulse">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 blur-xl" />
        </div>

        {/* Brain container */}
        <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 flex items-center justify-center">
          {/* Rotating ring */}
          <div className="absolute inset-2 rounded-full border-2 border-purple-300 dark:border-purple-700 border-dashed animate-spin [animation-duration:8s]" />

          {/* Inner ring */}
          <div className="absolute inset-4 rounded-full border border-indigo-300 dark:border-indigo-700 animate-spin [animation-duration:12s] [animation-direction:reverse]" />

          {/* Center icon */}
          <div className="relative z-10 p-4 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/30">
            <CurrentIcon className="h-10 w-10 text-white animate-pulse" />
          </div>

          {/* Sparkle particles */}
          <Sparkles className="absolute top-2 right-4 h-4 w-4 text-amber-400 animate-bounce [animation-delay:0.2s]" />
          <Sparkles className="absolute bottom-4 left-2 h-3 w-3 text-purple-400 animate-bounce [animation-delay:0.5s]" />
          <Sparkles className="absolute top-8 left-0 h-3 w-3 text-indigo-400 animate-bounce [animation-delay:0.8s]" />
        </div>
      </div>

      {/* Stage text */}
      <div className="text-center space-y-3 mb-6">
        <p className="text-lg font-medium text-foreground animate-pulse">
          {ANALYSIS_STAGES[currentStage]?.label}
        </p>
        <p className="text-sm text-muted-foreground max-w-sm">
          Your responses contain insights most people never discover about themselves.
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs space-y-2">
        <Progress value={progress} className="h-2" />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Analyzing patterns</span>
          <span>{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Stage indicators */}
      <div className="flex items-center gap-2 mt-6">
        {ANALYSIS_STAGES.map((stage, index) => {
          const StageIcon = stage.icon;
          const isActive = index === currentStage;
          const isComplete = index < currentStage;

          return (
            <div
              key={index}
              className={cn(
                'p-2 rounded-full transition-all duration-300',
                isActive && 'bg-purple-100 dark:bg-purple-900/50 scale-110',
                isComplete && 'bg-emerald-100 dark:bg-emerald-900/50',
                !isActive && !isComplete && 'bg-muted'
              )}
            >
              <StageIcon
                className={cn(
                  'h-4 w-4 transition-colors',
                  isActive && 'text-purple-600 dark:text-purple-400',
                  isComplete && 'text-emerald-600 dark:text-emerald-400',
                  !isActive && !isComplete && 'text-muted-foreground'
                )}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// COMPACT VERSION
// ============================================================================

/**
 * Smaller inline analyzing indicator
 */
export function AnalyzingIndicator({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative">
        <Brain className="h-5 w-5 text-purple-500 animate-pulse" />
        <div className="absolute inset-0 animate-ping">
          <Brain className="h-5 w-5 text-purple-500 opacity-30" />
        </div>
      </div>
      <span className="text-sm text-muted-foreground">
        MIO is analyzing...
      </span>
    </div>
  );
}

export default AnalyzingAnimation;
