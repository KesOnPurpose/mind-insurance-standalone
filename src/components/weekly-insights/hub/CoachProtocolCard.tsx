// CoachProtocolCard - Coach-created protocol preview card
// Phase 26: Weekly Insights Feature

import { useNavigate } from 'react-router-dom';
import { User, ChevronRight, CheckCircle, Play } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CoachProtocolWithTasks, CoachProtocolTask } from '@/types/protocol';

interface CoachProtocolCardProps {
  protocol: CoachProtocolWithTasks | null;
  isLoading?: boolean;
  className?: string;
}

export function CoachProtocolCard({ protocol, isLoading, className }: CoachProtocolCardProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card className={cn("bg-mi-navy-light border-mi-gold/20", className)}>
        <CardContent className="p-5">
          <div className="animate-pulse space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-24 h-5 bg-mi-navy rounded" />
              <div className="w-20 h-5 bg-mi-navy rounded" />
            </div>
            <div className="w-3/4 h-6 bg-mi-navy rounded" />
            <div className="w-full h-4 bg-mi-navy rounded" />
            <div className="w-32 h-10 bg-mi-navy rounded mt-4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!protocol) {
    return (
      <Card className={cn("bg-mi-navy-light border-mi-gold/20 border-dashed", className)}>
        <CardContent className="p-5 flex flex-col items-center justify-center text-center py-8">
          <div className="w-12 h-12 rounded-full bg-mi-gold/10 flex items-center justify-center mb-3">
            <User className="h-6 w-6 text-mi-gold" />
          </div>
          <h3 className="text-white font-medium mb-1">No Coach Content</h3>
          <p className="text-gray-400 text-sm">
            Coach content will appear here when available.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate which day of the week (1-7)
  const now = new Date();
  const dayOfWeek = now.getDay();
  const currentDayNumber = dayOfWeek === 0 ? 7 : dayOfWeek;

  // Get today's tasks
  const todaysTasks = protocol.tasks.filter(t => t.day_number === currentDayNumber);
  const progress = protocol.progress || [];
  const completedTaskIds = new Set(progress.filter(p => p.completed).map(p => p.task_id));

  // Calculate completion
  const todaysCompletedTasks = todaysTasks.filter(t => completedTaskIds.has(t.id)).length;
  const allTodayComplete = todaysTasks.length > 0 && todaysCompletedTasks === todaysTasks.length;

  // Total progress
  const totalTasks = protocol.tasks.length;
  const totalCompleted = progress.filter(p => p.completed).length;

  // Get first uncompleted task for preview
  const nextTask = todaysTasks.find(t => !completedTaskIds.has(t.id)) || todaysTasks[0];

  return (
    <Card className={cn(
      "bg-mi-navy-light border-mi-gold/30 hover:border-mi-gold/50 transition-all group",
      className
    )}>
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="bg-mi-gold/10 text-mi-gold border-mi-gold/30 text-xs"
            >
              <User className="h-3 w-3 mr-1" />
              COACH CONTENT
            </Badge>
            <Badge
              variant="outline"
              className="bg-mi-navy text-gray-400 border-gray-600 text-xs"
            >
              Day {currentDayNumber}
            </Badge>
          </div>
          <span className="text-mi-gold text-sm font-medium">
            {totalCompleted}/{totalTasks} complete
          </span>
        </div>

        {/* Protocol Title */}
        <h3 className="text-white font-semibold text-lg mb-1 line-clamp-1">
          {protocol.title}
        </h3>

        {/* Coach Attribution */}
        {protocol.description && (
          <p className="text-gray-400 text-sm mb-3 line-clamp-1">
            {protocol.description}
          </p>
        )}

        {/* Today's Task Preview */}
        {nextTask && (
          <div className="mb-4 p-3 bg-mi-navy rounded-lg border border-mi-gold/10">
            <p className="text-mi-gold/70 text-xs mb-1">
              Today's Task ({todaysCompletedTasks}/{todaysTasks.length} done):
            </p>
            <p className="text-white/90 text-sm line-clamp-2">
              {nextTask.title}
            </p>
            {nextTask.estimated_duration && (
              <span className="text-gray-500 text-xs mt-1 block">
                ~{nextTask.estimated_duration} min
              </span>
            )}
          </div>
        )}

        {/* No tasks for today */}
        {todaysTasks.length === 0 && (
          <div className="mb-4 p-3 bg-mi-navy rounded-lg border border-gray-700">
            <p className="text-gray-400 text-sm text-center">
              No tasks scheduled for today
            </p>
          </div>
        )}

        {/* Action Button */}
        <Button
          onClick={() => navigate(`/mind-insurance/insights/coach/${protocol.id}`)}
          className={cn(
            "w-full transition-all",
            allTodayComplete && todaysTasks.length > 0
              ? "bg-mi-navy border border-mi-gold/30 text-mi-gold hover:bg-mi-gold/10"
              : "bg-mi-gold hover:bg-mi-gold/90 text-mi-navy font-medium"
          )}
        >
          {allTodayComplete && todaysTasks.length > 0 ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Today Complete
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Start Coach Protocol
            </>
          )}
          <ChevronRight className="ml-auto h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Button>
      </CardContent>
    </Card>
  );
}

export default CoachProtocolCard;
