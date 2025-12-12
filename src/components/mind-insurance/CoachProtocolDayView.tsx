// CoachProtocolDayView Component
// Full day view for a coach protocol with task completion

import React, { useState, useCallback, useRef } from 'react';
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
  Map,
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

// =============================================
// INSTRUCTION FORMATTING HELPER
// =============================================

interface FormattedSection {
  title?: string;
  content: string;
}

/**
 * Parse and format task instructions into visual sections
 * Behavioral Science: Clear visual hierarchy reduces cognitive load and improves comprehension
 *
 * Recognizes common section patterns like:
 * - "Today's Focus:" / "Real-Life Example:" / "Daily Intention:"
 * - "Key Points:" / "Remember:" / "Action:" / "Reflection:"
 */
function formatInstructions(text: string): FormattedSection[] {
  if (!text) return [];

  // Common section markers for coach protocol tasks
  const sectionMarkers = [
    "Today's Focus:",
    "Real-Life Example:",
    "Daily Intention:",
    "Key Points:",
    "Remember:",
    "Action:",
    "Reflection:",
    "Exercise:",
    "Practice:",
    "Tip:",
    "Note:",
    "Challenge:",
    "Goal:",
    "Step 1:",
    "Step 2:",
    "Step 3:",
    "Morning:",
    "Evening:",
    "Throughout the day:",
  ];

  // Build regex pattern from markers
  const markerPattern = sectionMarkers
    .map(m => m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) // Escape special chars
    .join('|');

  // Split on section markers while preserving them
  const regex = new RegExp(`(?=${markerPattern})`, 'gi');
  const parts = text.split(regex).filter(p => p.trim());

  if (parts.length === 0) {
    return [{ content: text.trim() }];
  }

  // If only one part and it doesn't start with a marker, return as-is
  if (parts.length === 1) {
    const firstPart = parts[0].trim();
    const colonIndex = firstPart.indexOf(':');

    // Check if it starts with a known marker pattern
    if (colonIndex > 0 && colonIndex < 25) {
      const potentialTitle = firstPart.substring(0, colonIndex).trim();
      const potentialContent = firstPart.substring(colonIndex + 1).trim();

      // Only treat as section if title looks like a header (starts with capital, no long sentences)
      if (potentialTitle.length < 30 && /^[A-Z]/.test(potentialTitle)) {
        return [{ title: potentialTitle, content: potentialContent }];
      }
    }
    return [{ content: firstPart }];
  }

  // Parse each part as a section
  return parts.map(part => {
    const trimmed = part.trim();
    const colonIndex = trimmed.indexOf(':');

    if (colonIndex > 0 && colonIndex < 30) {
      const title = trimmed.substring(0, colonIndex).trim();
      const content = trimmed.substring(colonIndex + 1).trim();

      // Verify it looks like a section header
      if (/^[A-Z]/.test(title) && content.length > 0) {
        return { title, content };
      }
    }

    return { content: trimmed };
  }).filter(section => section.content);
}

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
  weekThemes?: string[];  // Array of 7 themes for current week (optional)
  tomorrowTheme?: string; // Theme for next day (optional)
  hideBackButton?: boolean; // Hide back button when auto-expanded (single protocol)
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
  weekThemes = [],
  tomorrowTheme,
  hideBackButton = false,
}: CoachProtocolDayViewProps) {
  const [selectedTask, setSelectedTask] = useState<CoachProtocolTaskV2 | null>(null);
  const [taskNotes, setTaskNotes] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationType, setCelebrationType] = useState<'day' | 'protocol'>('day');
  const [showWeekRoadmap, setShowWeekRoadmap] = useState(false);

  // Ref for textarea to handle mobile keyboard scroll
  const notesTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle focus on textarea - scroll into view for mobile keyboard
  const handleTextareaFocus = useCallback(() => {
    // Small delay to allow keyboard to appear, then scroll
    setTimeout(() => {
      notesTextareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  }, []);

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
      <Card className="border-l-4 bg-mi-navy-light border-mi-gold/30" style={{ borderLeftColor: protocol.theme_color }}>
        <CardHeader className="pb-2">
          {/* Back Button & Title */}
          <div className="flex items-center gap-3">
            {/* Only show back button if not hidden (when user has multiple protocols or explicitly navigated) */}
            {!hideBackButton && (
              <Button variant="ghost" size="icon" onClick={onBack} className="text-gray-300 hover:text-white hover:bg-mi-navy/50">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <div className="flex-1">
              <CardTitle className="text-lg text-white">{protocol.title}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                <Calendar className="h-4 w-4 text-mi-gold" />
                Week {assignment.current_week}, Day {assignment.current_day}
              </div>
            </div>
          </div>

          {/* Single Day Indicator - Behavioral Science: Focus on TODAY only */}
          <div className="flex items-center justify-center gap-2 mt-3">
            <Badge className="bg-mi-gold/20 text-mi-gold border-mi-gold/30 px-3 py-1">
              Day {assignment.current_day} of 7
            </Badge>
          </div>

          {/* Today's Progress */}
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Today's Progress</span>
              <span className="font-medium text-mi-gold">
                {completedCount}/{totalCount} tasks
              </span>
            </div>
            <div className="h-2 w-full bg-mi-gold/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-mi-gold rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
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
                            ? 'bg-green-900/20 border-green-700/50'
                            : 'bg-mi-navy/50 border-mi-gold/20 hover:bg-mi-navy/70 hover:border-mi-gold/40'
                        )}
                        onClick={() => !isCompleted && setSelectedTask(task)}
                      >
                        <div className="flex items-start gap-3">
                          {/* Completion Circle */}
                          <div className="mt-0.5">
                            {isCompleted ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <Circle className="h-5 w-5 text-gray-500" />
                            )}
                          </div>

                          {/* Task Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={cn(
                                  'font-medium text-white',
                                  isCompleted && 'line-through text-gray-500'
                                )}
                              >
                                {task.title}
                              </span>
                              <Badge variant="outline" className="text-xs bg-mi-navy/50 border-mi-gold/30 text-mi-gold">
                                {typeConfig.icon}
                                <span className="ml-1">{typeConfig.label}</span>
                              </Badge>
                              {task.estimated_minutes && (
                                <Badge className="text-xs bg-mi-gold/20 text-mi-gold border-mi-gold/30">
                                  {task.estimated_minutes} min
                                </Badge>
                              )}
                            </div>

                            <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                              {task.instructions}
                            </p>

                            {/* Resource Link */}
                            {task.resource_url && (
                              <a
                                href={task.resource_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sm text-mi-cyan mt-2 hover:underline"
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
            <div className="text-center py-6 bg-mi-gold/10 border border-mi-gold/30 rounded-lg">
              <Trophy className="h-12 w-12 mx-auto text-mi-gold mb-2" />
              <h3 className="font-semibold text-lg text-white">All Tasks Complete!</h3>
              <p className="text-sm text-gray-400">
                Amazing work today. See you tomorrow!
              </p>
            </div>
          )}

          {/* View Week Roadmap Button - Optional for planners */}
          <div className="flex justify-center pt-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-mi-gold hover:bg-mi-navy/50"
              onClick={() => setShowWeekRoadmap(true)}
            >
              <Map className="h-4 w-4 mr-2" />
              View Week Roadmap
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Task Completion Dialog - Mobile optimized with keyboard handling */}
      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent className="bg-mi-navy-light border-mi-gold/30 max-w-lg max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <span className="text-mi-gold">{selectedTask && TASK_TYPE_CONFIG[selectedTask.task_type].icon}</span>
              {selectedTask?.title}
            </DialogTitle>
          </DialogHeader>

          {/* Formatted Instructions - Visual Hierarchy for Better Comprehension */}
          <div className="space-y-4 max-h-[35vh] sm:max-h-[45vh] overflow-y-auto pr-2">
            {selectedTask?.instructions && formatInstructions(selectedTask.instructions).map((section, idx) => (
              <div key={idx} className="space-y-1.5">
                {section.title && (
                  <h4 className="text-xs font-semibold text-mi-gold uppercase tracking-wide">
                    {section.title}
                  </h4>
                )}
                <p className="text-gray-300 text-sm leading-relaxed">
                  {section.content}
                </p>
              </div>
            ))}
          </div>

          {/* Action Section - Resource, Notes, Complete Button */}
          <div className="space-y-4 pt-3 border-t border-mi-gold/20">
            {/* Resource Link */}
            {selectedTask?.resource_url && (
              <a
                href={selectedTask.resource_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-mi-cyan hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                Open Resource
              </a>
            )}

            {/* Notes Input - with mobile keyboard scroll handling */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Notes (optional)</label>
              <Textarea
                ref={notesTextareaRef}
                value={taskNotes}
                onChange={(e) => setTaskNotes(e.target.value)}
                onFocus={handleTextareaFocus}
                placeholder="Any reflections or notes about this task..."
                rows={2}
                className="bg-mi-navy/50 border-mi-gold/20 text-white placeholder:text-gray-500 focus:border-mi-gold/50 text-base"
              />
            </div>

            {/* Complete Button - sticky at bottom for easy mobile access */}
            <div className="sticky bottom-0 pt-2 pb-2 bg-mi-navy-light">
              <Button
                className="w-full bg-mi-gold hover:bg-mi-gold/90 text-mi-navy font-semibold py-3"
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
          </div>
        </DialogContent>
      </Dialog>

      {/* Celebration Dialog */}
      <Dialog open={showCelebration} onOpenChange={handleCelebrationClose}>
        <DialogContent className="text-center bg-mi-navy-light border-mi-gold/30">
          <div className="py-6">
            {celebrationType === 'protocol' ? (
              <>
                <div className="relative">
                  <Trophy className="h-20 w-20 mx-auto text-mi-gold" />
                  <Sparkles className="h-8 w-8 absolute top-0 right-1/4 text-mi-gold animate-pulse" />
                  <Sparkles className="h-6 w-6 absolute bottom-0 left-1/4 text-mi-gold animate-pulse delay-100" />
                </div>
                <h2 className="text-2xl font-bold mt-4 text-white">Protocol Complete! 🎉</h2>
                <p className="text-gray-400 mt-2">
                  Congratulations! You've completed "{protocol.title}"
                </p>
                <div className="flex justify-center gap-4 mt-4">
                  <Badge className="bg-mi-gold/20 text-mi-gold border-mi-gold/30">
                    {assignment.days_completed} days completed
                  </Badge>
                  <Badge className="bg-mi-gold/20 text-mi-gold border-mi-gold/30">
                    {assignment.total_tasks_completed} tasks done
                  </Badge>
                </div>
              </>
            ) : (
              <>
                <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
                <h2 className="text-xl font-bold mt-4 text-white">Day Complete!</h2>
                <p className="text-gray-400 mt-2">
                  Great work finishing all of today's tasks!
                </p>

                {/* Tomorrow Teaser - Creates anticipation loop */}
                {assignment.current_day < 7 && tomorrowTheme && (
                  <div className="mt-4 p-3 bg-mi-navy/50 rounded-lg border border-mi-gold/20">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Coming Tomorrow</p>
                    <p className="text-mi-gold font-medium mt-1">{tomorrowTheme}</p>
                  </div>
                )}

                {assignment.current_day < 7 && !tomorrowTheme && (
                  <p className="text-sm text-gray-500 mt-1">
                    See you tomorrow for Day {assignment.current_day + 1}
                  </p>
                )}

                {assignment.current_day >= 7 && (
                  <p className="text-sm text-mi-gold mt-1">
                    Final day of the week complete! 🎉
                  </p>
                )}
              </>
            )}

            <Button className="mt-6 bg-mi-gold hover:bg-mi-gold/90 text-mi-navy font-semibold" onClick={handleCelebrationClose}>
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Week Roadmap Modal - Optional for planners */}
      <Dialog open={showWeekRoadmap} onOpenChange={setShowWeekRoadmap}>
        <DialogContent className="bg-mi-navy-light border-mi-gold/30 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Map className="h-5 w-5 text-mi-gold" />
              Week {assignment.current_week} Roadmap
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Your journey this week (themes only)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-4">
            {Array.from({ length: 7 }, (_, index) => {
              const dayNum = index + 1;
              const isComplete = dayNum < assignment.current_day;
              const isCurrent = dayNum === assignment.current_day;
              const isFuture = dayNum > assignment.current_day;
              const theme = weekThemes[index] || `Day ${dayNum}`;

              return (
                <div
                  key={dayNum}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg',
                    isComplete && 'bg-green-900/20 border border-green-700/30',
                    isCurrent && 'bg-mi-gold/10 border border-mi-gold/30',
                    isFuture && 'bg-mi-navy/30 opacity-60'
                  )}
                >
                  {/* Day Number Circle */}
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                    isComplete && 'bg-green-500 text-white',
                    isCurrent && 'bg-mi-gold text-mi-navy',
                    isFuture && 'bg-mi-navy/50 text-gray-500'
                  )}>
                    {isComplete ? <CheckCircle className="h-4 w-4" /> : dayNum}
                  </div>

                  {/* Theme */}
                  <div className="flex-1">
                    <p className={cn(
                      'font-medium',
                      isComplete && 'text-green-400',
                      isCurrent && 'text-mi-gold',
                      isFuture && 'text-gray-500'
                    )}>
                      Day {dayNum}
                    </p>
                    <p className={cn(
                      'text-sm',
                      isComplete && 'text-green-400/70',
                      isCurrent && 'text-white',
                      isFuture && 'text-gray-600'
                    )}>
                      {theme}
                    </p>
                  </div>

                  {/* Current Day Badge */}
                  {isCurrent && (
                    <Badge className="bg-mi-gold/20 text-mi-gold text-xs border-mi-gold/30">Today</Badge>
                  )}
                </div>
              );
            })}
          </div>

          <Button
            className="w-full bg-mi-gold hover:bg-mi-gold/90 text-mi-navy font-semibold"
            onClick={() => setShowWeekRoadmap(false)}
          >
            Got It
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default CoachProtocolDayView;
