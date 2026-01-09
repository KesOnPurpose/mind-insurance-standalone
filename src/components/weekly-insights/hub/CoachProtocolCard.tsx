// CoachProtocolCard - Coach-created protocol preview card
// Phase 26: Weekly Insights Feature
//
// Premium Glass-Morphism Styling: CYAN accents (differentiates from MIO's gold)
// Visual Language: Coach protocols = Cyan, MIO protocols = Gold

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, ChevronRight, CheckCircle, Play, Sparkles, Users } from 'lucide-react';
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
      <Card className={cn(
        "relative overflow-hidden",
        "bg-mi-navy/80 backdrop-blur-xl",
        "border border-mi-cyan/20",
        className
      )}>
        <CardContent className="p-5">
          <div className="animate-pulse space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-24 h-5 bg-mi-cyan/10 rounded" />
              <div className="w-20 h-5 bg-mi-cyan/10 rounded" />
            </div>
            <div className="w-3/4 h-6 bg-mi-cyan/10 rounded" />
            <div className="w-full h-4 bg-mi-cyan/10 rounded" />
            <div className="w-32 h-10 bg-mi-cyan/10 rounded mt-4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!protocol) {
    return (
      <Card className={cn(
        "bg-white/5 backdrop-blur-sm",
        "border border-mi-cyan/10 border-dashed",
        className
      )}>
        <CardContent className="p-5 flex flex-col items-center justify-center text-center py-8">
          <div className="w-12 h-12 rounded-full bg-mi-cyan/10 flex items-center justify-center mb-3">
            <Users className="h-6 w-6 text-mi-cyan/50" />
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
      "relative overflow-hidden group",
      // Premium glass-morphism effect
      "bg-mi-navy/80 backdrop-blur-xl",
      "border border-mi-cyan/20",
      "hover:border-mi-cyan/40",
      "shadow-[0_8px_32px_rgba(5,195,221,0.1)]",
      "hover:shadow-[0_8px_32px_rgba(5,195,221,0.2)]",
      "transition-all duration-300",
      className
    )}>
      {/* Animated gradient border glow */}
      <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
        <div className="absolute inset-[-2px] bg-gradient-to-br from-mi-cyan/15 via-transparent to-cyan-400/15 opacity-50" />
      </div>

      <CardContent className="p-5 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                "bg-mi-cyan/10 text-mi-cyan border-mi-cyan/30",
                "shadow-[0_0_8px_rgba(5,195,221,0.15)]"
              )}
            >
              <Users className="h-3 w-3 mr-1" />
              COACH CONTENT
            </Badge>
            <Badge
              variant="outline"
              className="bg-white/5 text-gray-400 border-white/10 text-xs"
            >
              Day {currentDayNumber}
            </Badge>
          </div>
          <span className="text-mi-cyan text-sm font-medium">
            {totalCompleted}/{totalTasks} complete
          </span>
        </div>

        {/* Protocol Title */}
        <h3 className="text-white font-semibold text-lg mb-1 line-clamp-1 group-hover:text-mi-cyan transition-colors">
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
          <div className={cn(
            "mb-4 p-3 rounded-xl",
            "bg-white/5 backdrop-blur-sm",
            "border border-mi-cyan/15"
          )}>
            <p className="text-mi-cyan/70 text-xs mb-1">
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
          <div className={cn(
            "mb-4 p-3 rounded-xl",
            "bg-white/5 backdrop-blur-sm",
            "border border-white/10"
          )}>
            <p className="text-gray-400 text-sm text-center">
              No tasks scheduled for today
            </p>
          </div>
        )}

        {/* Action Button */}
        <Button
          onClick={() => navigate(`/mind-insurance/insights/coach/${protocol.id}`)}
          className={cn(
            "w-full transition-all duration-300",
            allTodayComplete && todaysTasks.length > 0
              ? cn(
                  "bg-white/5 backdrop-blur-sm",
                  "border border-emerald-500/30 text-emerald-400",
                  "hover:bg-emerald-500/10 hover:border-emerald-500/50"
                )
              : cn(
                  "font-semibold",
                  "bg-gradient-to-r from-mi-cyan to-cyan-400",
                  "hover:from-mi-cyan hover:to-cyan-300",
                  "text-mi-navy",
                  "shadow-lg shadow-mi-cyan/30",
                  "hover:shadow-xl hover:shadow-mi-cyan/40",
                  "hover:scale-[1.02]"
                )
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
