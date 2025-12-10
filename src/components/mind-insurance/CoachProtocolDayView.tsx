// CoachProtocolDayView Component
// Full day view for a coach protocol with task completion

import React, { useState, useCallback } from 'react';
import {
  ArrowLeft,
  Sun,
  Clock,
  Moon,
  CheckCircle,
  Circle,
  BookOpen,
  PenTool,
  Video,
  FileText,
  Mic,
  Zap,
  ExternalLink,
  Calendar,
  Trophy,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type {
  UserCoachProtocolAssignment,
  CoachProtocolV2,
  CoachProtocolTaskV2,
  CoachTaskType,
  TaskTimeOfDay,
} from '@/types/coach-protocol';

interface CoachProtocolDayViewProps {
  assignment: UserCoachProtocolAssignment;
  protocol: CoachProtocolV2;
  tasks: CoachProtocolTaskV2[];
  completedTaskIds: string[];
  totalDays: number;
  absoluteDay: number;
  onComplete: (
    assignmentId: string,
    taskId: string,
    data?: { notes?: string }
  ) => Promise<{ success: boolean; protocolCompleted?: boolean }>;
  onBack: () => void;
  isSaving: boolean;
  onProtocolComplete?: () => void;
}

// =============================================
// ICONS & STYLES
// =============================================

const TIME_OF_DAY_CONFIG: Record<
  TaskTimeOfDay,
  { icon: React.ReactNode; label: string; color: string }
> = {
  morning: {
    icon: <Sun className="h-4 w-4" />,
    label: 'Morning',
    color: 'text-amber-500',
  },
  throughout: {
    icon: <Clock className="h-4 w-4" />,
    label: 'Throughout Day',
    color: 'text-cyan-500',
  },
  evening: {
    icon: <Moon className="h-4 w-4" />,
    label: 'Evening',
    color: 'text-purple-500',
  },
};

const TASK_TYPE_CONFIG: Record<
  CoachTaskType,
  { icon: React.ReactNode; label: string }
> = {
  action: { icon: <Zap className="h-4 w-4" />, label: 'Action' },
  reflection: { icon: <PenTool className="h-4 w-4" />, label: 'Reflection' },
  reading: { icon: <BookOpen className="h-4 w-4" />, label: 'Reading' },
  video: { icon: <Video className="h-4 w-4" />, label: 'Video' },
  worksheet: { icon: <FileText className="h-4 w-4" />, label: 'Worksheet' },
  voice_recording: { icon: <Mic className="h-4 w-4" />, label: 'Voice' },
};

export function CoachProtocolDayView({
  assignment,
  protocol,
  tasks,
  completedTaskIds,
  totalDays,
  absoluteDay,
  onComplete,
  onBack,
  isSaving,
  onProtocolComplete,
}: CoachProtocolDayViewProps) {
  const [selectedTask, setSelectedTask] = useState<CoachProtocolTaskV2 | null>(null);
  const [taskNotes, setTaskNotes] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationType, setCelebrationType] = useState<'day' | 'protocol'>('day');

  const completedCount = completedTaskIds.length;
  const totalCount = tasks.length;
  const progressPercent = (completedCount / totalCount) * 100;
  const allComplete = completedCount === totalCount && totalCount > 0;

  // Group tasks by time of day
  const tasksByTime = {
    morning: tasks.filter((t) => t.time_of_day === 'morning'),
    throughout: tasks.filter((t) => t.time_of_day === 'throughout'),
    evening: tasks.filter((t) => t.time_of_day === 'evening'),
  };

  // Handle task completion
  const handleCompleteTask = useCallback(
    async (task: CoachProtocolTaskV2) => {
      const result = await onComplete(assignment.id, task.id, {
        notes: taskNotes || undefined,
      });

      if (result.success) {
        setSelectedTask(null);
        setTaskNotes('');

        if (result.protocolCompleted) {
          setCelebrationType('protocol');
          setShowCelebration(true);
        } else if (completedCount + 1 === totalCount) {
          setCelebrationType('day');
          setShowCelebration(true);
        }
      }
    },
    [assignment.id, onComplete, taskNotes, completedCount, totalCount]
  );

  // Handle celebration close
  const handleCelebrationClose = useCallback(() => {
    setShowCelebration(false);
    if (celebrationType === 'protocol' && onProtocolComplete) {
      onProtocolComplete();
    }
  }, [celebrationType, onProtocolComplete]);

  return (
    <>
      <Card className="border-l-4" style={{ borderLeftColor: protocol.theme_color }}>
        <CardHeader className="pb-2">
          {/* Back Button & Title */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <CardTitle className="text-lg">{protocol.title}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Calendar className="h-4 w-4" />
                Week {assignment.current_week}, Day {assignment.current_day}
              </div>
            </div>
          </div>

          {/* Week Progress Circles */}
          <div className="flex justify-center gap-1 mt-4">
            {Array.from({ length: 7 }, (_, i) => {
              const dayNum = i + 1;
              const isComplete = dayNum < assignment.current_day;
              const isCurrent = dayNum === assignment.current_day;
              return (
                <div
                  key={dayNum}
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium',
                    isComplete && 'bg-green-500 text-white',
                    isCurrent && 'bg-[#fac832] text-black ring-2 ring-[#fac832] ring-offset-2',
                    !isComplete && !isCurrent && 'bg-muted text-muted-foreground'
                  )}
                >
                  {isComplete ? <CheckCircle className="h-4 w-4" /> : dayNum}
                </div>
              );
            })}
          </div>

          {/* Today's Progress */}
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Today's Progress</span>
              <span className="font-medium">
                {completedCount}/{totalCount} tasks
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-4">
          {/* Tasks by Time of Day */}
          {(['morning', 'throughout', 'evening'] as TaskTimeOfDay[]).map((timeOfDay) => {
            const timeTasks = tasksByTime[timeOfDay];
            if (timeTasks.length === 0) return null;

            const config = TIME_OF_DAY_CONFIG[timeOfDay];

            return (
              <div key={timeOfDay} className="space-y-3">
                <div className={cn('flex items-center gap-2 font-medium', config.color)}>
                  {config.icon}
                  <span>{config.label}</span>
                </div>

                <div className="space-y-2">
                  {timeTasks.map((task) => {
                    const isCompleted = completedTaskIds.includes(task.id);
                    const typeConfig = TASK_TYPE_CONFIG[task.task_type];

                    return (
                      <div
                        key={task.id}
                        className={cn(
                          'p-4 rounded-lg border cursor-pointer transition-all',
                          isCompleted
                            ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                            : 'bg-card hover:bg-muted/50'
                        )}
                        onClick={() => !isCompleted && setSelectedTask(task)}
                      >
                        <div className="flex items-start gap-3">
                          {/* Completion Circle */}
                          <div className="mt-0.5">
                            {isCompleted ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <Circle className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>

                          {/* Task Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  'font-medium',
                                  isCompleted && 'line-through text-muted-foreground'
                                )}
                              >
                                {task.title}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {typeConfig.icon}
                                <span className="ml-1">{typeConfig.label}</span>
                              </Badge>
                              {task.estimated_minutes && (
                                <Badge variant="secondary" className="text-xs">
                                  {task.estimated_minutes} min
                                </Badge>
                              )}
                            </div>

                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {task.instructions}
                            </p>

                            {/* Resource Link */}
                            {task.resource_url && (
                              <a
                                href={task.resource_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sm text-primary mt-2 hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink className="h-3 w-3" />
                                View Resource
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* All Complete Message */}
          {allComplete && (
            <div className="text-center py-6 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <Trophy className="h-12 w-12 mx-auto text-[#fac832] mb-2" />
              <h3 className="font-semibold text-lg">All Tasks Complete!</h3>
              <p className="text-sm text-muted-foreground">
                Amazing work today. See you tomorrow!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Completion Dialog */}
      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTask && TASK_TYPE_CONFIG[selectedTask.task_type].icon}
              {selectedTask?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedTask?.instructions}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            {/* Resource Link */}
            {selectedTask?.resource_url && (
              <a
                href={selectedTask.resource_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                Open Resource
              </a>
            )}

            {/* Notes Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes (optional)</label>
              <Textarea
                value={taskNotes}
                onChange={(e) => setTaskNotes(e.target.value)}
                placeholder="Any reflections or notes about this task..."
                rows={3}
              />
            </div>

            {/* Complete Button */}
            <Button
              className="w-full"
              onClick={() => selectedTask && handleCompleteTask(selectedTask)}
              disabled={isSaving}
            >
              {isSaving ? (
                'Completing...'
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Complete
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Celebration Dialog */}
      <Dialog open={showCelebration} onOpenChange={handleCelebrationClose}>
        <DialogContent className="text-center">
          <div className="py-6">
            {celebrationType === 'protocol' ? (
              <>
                <div className="relative">
                  <Trophy className="h-20 w-20 mx-auto text-[#fac832]" />
                  <Sparkles className="h-8 w-8 absolute top-0 right-1/4 text-yellow-400 animate-pulse" />
                  <Sparkles className="h-6 w-6 absolute bottom-0 left-1/4 text-yellow-400 animate-pulse delay-100" />
                </div>
                <h2 className="text-2xl font-bold mt-4">Protocol Complete! 🎉</h2>
                <p className="text-muted-foreground mt-2">
                  Congratulations! You've completed "{protocol.title}"
                </p>
                <div className="flex justify-center gap-4 mt-4">
                  <Badge variant="secondary">
                    {assignment.days_completed} days completed
                  </Badge>
                  <Badge variant="secondary">
                    {assignment.total_tasks_completed} tasks done
                  </Badge>
                </div>
              </>
            ) : (
              <>
                <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
                <h2 className="text-xl font-bold mt-4">Day Complete!</h2>
                <p className="text-muted-foreground mt-2">
                  Great work finishing all of today's tasks!
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  See you tomorrow for Day {assignment.current_day + 1}
                </p>
              </>
            )}

            <Button className="mt-6" onClick={handleCelebrationClose}>
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default CoachProtocolDayView;
