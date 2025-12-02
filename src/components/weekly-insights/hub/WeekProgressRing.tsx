// WeekProgressRing - 7-day circular progress indicator
// Phase 26: Weekly Insights Feature

import { cn } from '@/lib/utils';
import type { ProtocolDayProgress } from '@/types/protocol';

interface WeekProgressRingProps {
  days: ProtocolDayProgress[];
  currentDay: number;
  className?: string;
}

export function WeekProgressRing({ days, currentDay, className }: WeekProgressRingProps) {
  // Ensure we have 7 days
  const displayDays = Array.from({ length: 7 }, (_, i) => {
    const day = i + 1;
    const progress = days.find(d => d.day === day);
    return {
      day,
      completed: progress?.completed ?? false,
      completedAt: progress?.completedAt,
      isToday: day === currentDay,
      isFuture: day > currentDay,
    };
  });

  const completedCount = displayDays.filter(d => d.completed).length;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      {/* Day dots */}
      <div className="flex items-center gap-2 mb-2">
        {displayDays.map(day => (
          <div
            key={day.day}
            className={cn(
              "w-3 h-3 rounded-full transition-all duration-300",
              day.completed && "bg-mi-cyan shadow-[0_0_8px_rgba(5,195,221,0.5)]",
              !day.completed && day.isToday && "bg-mi-gold ring-2 ring-mi-gold/50 ring-offset-1 ring-offset-mi-navy",
              !day.completed && !day.isToday && day.isFuture && "bg-mi-navy-light border border-gray-600",
              !day.completed && !day.isToday && !day.isFuture && "bg-gray-700 border border-gray-600"
            )}
            title={`Day ${day.day}${day.completed ? ' - Completed' : day.isToday ? ' - Today' : ''}`}
          />
        ))}
      </div>

      {/* Progress text */}
      <div className="flex items-center gap-3 text-sm">
        <span className="text-gray-400">
          Day <span className="text-white font-semibold">{currentDay}</span> of 7
        </span>
        <span className="text-mi-cyan font-medium">
          {completedCount}/7 complete
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full mt-2 h-1.5 bg-mi-navy rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-mi-cyan to-mi-cyan/70 rounded-full transition-all duration-500"
          style={{ width: `${(completedCount / 7) * 100}%` }}
        />
      </div>
    </div>
  );
}

export default WeekProgressRing;
