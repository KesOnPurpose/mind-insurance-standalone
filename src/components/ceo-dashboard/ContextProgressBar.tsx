// Context Progress Bar Component
// Shows overall MIO context completeness with animated progress

import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { CEOContextCompleteness, CEOContextSection } from '@/types/ceoDashboard';
import { Brain, CheckCircle2, Circle } from 'lucide-react';

interface ContextProgressBarProps {
  completeness: CEOContextCompleteness;
  className?: string;
}

export function ContextProgressBar({ completeness, className }: ContextProgressBarProps) {
  const { overallPercentage, sections } = completeness;

  // Determine status color based on percentage
  const getStatusColor = (percentage: number): string => {
    if (percentage >= 80) return 'text-green-400';
    if (percentage >= 50) return 'text-mi-gold';
    return 'text-mi-cyan';
  };

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-mi-gold';
    return 'bg-mi-cyan';
  };

  return (
    <div className={cn('rounded-xl bg-gradient-to-br from-mi-navy-light to-mi-navy p-6 border border-mi-cyan/20', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-mi-cyan/10">
            <Brain className="w-6 h-6 text-mi-cyan" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">MIO Context</h3>
            <p className="text-sm text-white/60">Help MIO understand you better</p>
          </div>
        </div>
        <div className="text-right">
          <div className={cn('text-3xl font-bold', getStatusColor(overallPercentage))}>
            {overallPercentage}%
          </div>
          <p className="text-xs text-white/40">Complete</p>
        </div>
      </div>

      {/* Main Progress Bar */}
      <div className="relative mb-6">
        <Progress
          value={overallPercentage}
          className="h-3 bg-mi-navy"
          indicatorClassName={cn('transition-all duration-700 ease-out', getProgressColor(overallPercentage))}
        />
        {/* Animated glow effect */}
        <div
          className="absolute top-0 left-0 h-3 rounded-full blur-sm opacity-50 transition-all duration-700"
          style={{
            width: `${overallPercentage}%`,
            background: overallPercentage >= 80
              ? 'linear-gradient(90deg, transparent, #22c55e)'
              : overallPercentage >= 50
              ? 'linear-gradient(90deg, transparent, #fac832)'
              : 'linear-gradient(90deg, transparent, #05c3dd)',
          }}
        />
      </div>

      {/* Section Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {sections.map((section) => (
          <SectionIndicator key={section.key} section={section} />
        ))}
      </div>

      {/* Motivational message */}
      {overallPercentage < 100 && (
        <div className="mt-4 p-3 rounded-lg bg-mi-cyan/5 border border-mi-cyan/10">
          <p className="text-sm text-white/70">
            {overallPercentage < 30 && (
              <>Add more context to help MIO-EA provide personalized insights and proactive support.</>
            )}
            {overallPercentage >= 30 && overallPercentage < 60 && (
              <>Great start! Continue adding details to unlock deeper personalization.</>
            )}
            {overallPercentage >= 60 && overallPercentage < 80 && (
              <>Almost there! A few more details will maximize MIO&apos;s effectiveness.</>
            )}
            {overallPercentage >= 80 && (
              <>Excellent! MIO has rich context to provide highly personalized assistance.</>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

// Section Indicator Sub-component
interface SectionIndicatorProps {
  section: CEOContextSection;
}

function SectionIndicator({ section }: SectionIndicatorProps) {
  const isComplete = section.percentage === 100;
  const hasProgress = section.percentage > 0;

  return (
    <div
      className={cn(
        'relative p-3 rounded-lg border transition-all duration-300',
        isComplete
          ? 'bg-green-500/10 border-green-500/30'
          : hasProgress
          ? 'bg-mi-cyan/5 border-mi-cyan/20'
          : 'bg-white/5 border-white/10'
      )}
    >
      {/* Status icon */}
      <div className="flex items-center justify-between mb-2">
        {isComplete ? (
          <CheckCircle2 className="w-4 h-4 text-green-400" />
        ) : (
          <Circle
            className={cn(
              'w-4 h-4',
              hasProgress ? 'text-mi-cyan' : 'text-white/30'
            )}
          />
        )}
        <span
          className={cn(
            'text-xs font-medium',
            isComplete
              ? 'text-green-400'
              : hasProgress
              ? 'text-mi-cyan'
              : 'text-white/40'
          )}
        >
          {section.percentage}%
        </span>
      </div>

      {/* Section name */}
      <p className="text-xs text-white/70 truncate" title={section.name}>
        {section.name}
      </p>

      {/* Mini progress bar */}
      <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            isComplete ? 'bg-green-500' : 'bg-mi-cyan'
          )}
          style={{ width: `${section.percentage}%` }}
        />
      </div>
    </div>
  );
}

export default ContextProgressBar;
