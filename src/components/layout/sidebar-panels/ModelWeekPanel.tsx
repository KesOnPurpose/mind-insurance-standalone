import { Calendar, Sun, Moon, Clock, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * ModelWeekPanel - Week overview and day selector for Model Week
 */
export function ModelWeekPanel() {
  // TODO: Connect to actual model week data
  const weekData = {
    currentDay: 3, // Wednesday (0 = Sunday)
    tasksToday: 5,
    completedToday: 2,
    upcomingTask: 'Morning mindset routine',
    upcomingTime: '7:00 AM',
  };

  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const today = new Date().getDay();

  return (
    <div className="px-2 py-2 space-y-3">
      {/* Week Days */}
      <div className="rounded-lg border bg-card p-3 text-card-foreground">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">This Week</span>
        </div>
        <div className="flex justify-between">
          {days.map((day, index) => (
            <div
              key={index}
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors',
                index === today
                  ? 'bg-primary text-primary-foreground'
                  : index < today
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-transparent text-muted-foreground border'
              )}
            >
              {day}
            </div>
          ))}
        </div>
      </div>

      {/* Today's Progress */}
      <div className="rounded-lg border bg-card p-3 text-card-foreground">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4 text-secondary" />
            <span className="text-sm font-medium">Today</span>
          </div>
          <span className="text-sm font-medium">
            {weekData.completedToday}/{weekData.tasksToday}
          </span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: weekData.tasksToday }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'flex-1 h-2 rounded-full',
                i < weekData.completedToday ? 'bg-success' : 'bg-muted'
              )}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {weekData.tasksToday - weekData.completedToday} tasks remaining
        </p>
      </div>

      {/* Time Blocks */}
      <div className="rounded-lg border bg-card p-3 text-card-foreground">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Time Blocks</span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <Sun className="h-3 w-3 text-yellow-500" />
            <span className="text-muted-foreground">Morning</span>
            <span className="ml-auto font-medium">2 tasks</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="h-3 w-3 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">Afternoon</span>
            <span className="ml-auto font-medium">2 tasks</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Moon className="h-3 w-3 text-purple-500" />
            <span className="text-muted-foreground">Evening</span>
            <span className="ml-auto font-medium">1 task</span>
          </div>
        </div>
      </div>

      {/* Next Up */}
      {weekData.upcomingTask && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
          <div className="flex items-center gap-2 mb-1">
            <CheckSquare className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Next Up</span>
          </div>
          <p className="text-xs text-foreground">{weekData.upcomingTask}</p>
          <p className="text-xs text-muted-foreground mt-1">{weekData.upcomingTime}</p>
        </div>
      )}
    </div>
  );
}

export default ModelWeekPanel;
