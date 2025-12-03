// StreakDisplay - Animated streak counter with flame
// Phase 26: Weekly Insights Feature

import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreakDisplayProps {
  streak: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function StreakDisplay({ streak, className, size = 'md' }: StreakDisplayProps) {
  const sizeClasses = {
    sm: 'text-sm gap-1',
    md: 'text-base gap-1.5',
    lg: 'text-lg gap-2',
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const hasStreak = streak > 0;

  return (
    <div
      className={cn(
        "flex items-center rounded-full px-3 py-1.5 transition-all duration-300",
        hasStreak
          ? "bg-gradient-to-r from-mi-gold/20 to-orange-500/20 border border-mi-gold/30"
          : "bg-mi-navy-light border border-gray-700",
        sizeClasses[size],
        className
      )}
    >
      <Flame
        className={cn(
          iconSizes[size],
          hasStreak
            ? "text-mi-gold animate-pulse"
            : "text-gray-500"
        )}
      />
      <span
        className={cn(
          "font-bold",
          hasStreak ? "text-mi-gold" : "text-gray-500"
        )}
      >
        {streak}
      </span>
      <span
        className={cn(
          "text-xs",
          hasStreak ? "text-mi-gold/80" : "text-gray-500"
        )}
      >
        {streak === 1 ? 'day' : 'days'}
      </span>
    </div>
  );
}

export default StreakDisplay;
