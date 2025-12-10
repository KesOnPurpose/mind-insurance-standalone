// MultiWeekProtocolEditor Component
// Create and edit multi-week coach protocols with accordion UI

import React, { useState, useCallback } from 'react';
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Sun,
  Clock,
  Moon,
  BookOpen,
  PenTool,
  Video,
  FileText,
  Mic,
  Zap,
  Save,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type {
  CoachTaskType,
  TaskTimeOfDay,
  CreateCoachProtocolTaskForm,
  CoachProtocolVisibility,
  ProtocolScheduleType,
} from '@/types/coach-protocol';

// =============================================
// TYPES
// =============================================

interface ProtocolEditorForm {
  title: string;
  description: string;
  visibility: CoachProtocolVisibility;
  schedule_type: ProtocolScheduleType;
  theme_color: string;
  weeks: WeekForm[];
}

interface WeekForm {
  week_number: number;
  theme: string;
  days: DayForm[];
}

interface DayForm {
  day_number: number;
  tasks: TaskForm[];
}

interface TaskForm {
  id: string; // Temp ID for UI
  task_order: number;
  title: string;
  instructions: string;
  task_type: CoachTaskType;
  time_of_day: TaskTimeOfDay;
  estimated_minutes?: number;
  resource_url?: string;
}

interface MultiWeekProtocolEditorProps {
  initialData?: ProtocolEditorForm;
  onSave: (form: ProtocolEditorForm) => Promise<void>;
  onCancel: () => void;
  isSaving?: boolean;
}

// =============================================
// CONSTANTS
// =============================================

const TASK_TYPE_OPTIONS: { value: CoachTaskType; label: string; icon: React.ReactNode }[] = [
  { value: 'action', label: 'Action', icon: <Zap className="h-4 w-4" /> },
  { value: 'reflection', label: 'Reflection', icon: <PenTool className="h-4 w-4" /> },
  { value: 'reading', label: 'Reading', icon: <BookOpen className="h-4 w-4" /> },
  { value: 'video', label: 'Video', icon: <Video className="h-4 w-4" /> },
  { value: 'worksheet', label: 'Worksheet', icon: <FileText className="h-4 w-4" /> },
  { value: 'voice_recording', label: 'Voice Recording', icon: <Mic className="h-4 w-4" /> },
];

const TIME_OF_DAY_OPTIONS: { value: TaskTimeOfDay; label: string; icon: React.ReactNode }[] = [
  { value: 'morning', label: 'Morning', icon: <Sun className="h-4 w-4 text-amber-500" /> },
  { value: 'throughout', label: 'Throughout Day', icon: <Clock className="h-4 w-4 text-cyan-500" /> },
  { value: 'evening', label: 'Evening', icon: <Moon className="h-4 w-4 text-purple-500" /> },
];

const THEME_COLORS = [
  { value: '#fac832', label: 'Gold' },
  { value: '#22c55e', label: 'Green' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#a855f7', label: 'Purple' },
  { value: '#ef4444', label: 'Red' },
  { value: '#f97316', label: 'Orange' },
];

const VISIBILITY_OPTIONS: { value: CoachProtocolVisibility; label: string }[] = [
  { value: 'all_users', label: 'All Users' },
  { value: 'tier_based', label: 'Tier Based' },
  { value: 'individual', label: 'Individual' },
  { value: 'custom_group', label: 'Custom Groups' },
];

const SCHEDULE_OPTIONS: { value: ProtocolScheduleType; label: string }[] = [
  { value: 'immediate', label: 'Immediate' },
  { value: 'date_specific', label: 'Specific Date' },
  { value: 'rolling', label: 'Rolling Enrollment' },
];

// =============================================
// HELPER FUNCTIONS
// =============================================

const generateId = () => Math.random().toString(36).substring(2, 9);

const createEmptyTask = (taskOrder: number): TaskForm => ({
  id: generateId(),
  task_order: taskOrder,
  title: '',
  instructions: '',
  task_type: 'action',
  time_of_day: 'throughout',
});

const createEmptyDay = (dayNumber: number): DayForm => ({
  day_number: dayNumber,
  tasks: [createEmptyTask(1)],
});

const createEmptyWeek = (weekNumber: number): WeekForm => ({
  week_number: weekNumber,
  theme: '',
  days: Array.from({ length: 7 }, (_, i) => createEmptyDay(i + 1)),
});

const getDefaultForm = (): ProtocolEditorForm => ({
  title: '',
  description: '',
  visibility: 'all_users',
  schedule_type: 'immediate',
  theme_color: '#fac832',
  weeks: [createEmptyWeek(1)],
});

// =============================================
// COMPONENT
// =============================================

export function MultiWeekProtocolEditor({
  initialData,
  onSave,
  onCancel,
  isSaving = false,
}: MultiWeekProtocolEditorProps) {
  const [form, setForm] = useState<ProtocolEditorForm>(initialData || getDefaultForm());
  const [expandedWeeks, setExpandedWeeks] = useState<string[]>(['week-1']);
  const [expandedDays, setExpandedDays] = useState<string[]>(['week-1-day-1']);
  const [previewMode, setPreviewMode] = useState(false);

  // =============================================
  // WEEK HANDLERS
  // =============================================

  const addWeek = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      weeks: [...prev.weeks, createEmptyWeek(prev.weeks.length + 1)],
    }));
  }, []);

  const removeWeek = useCallback((weekIndex: number) => {
    setForm((prev) => ({
      ...prev,
      weeks: prev.weeks
        .filter((_, i) => i !== weekIndex)
        .map((w, i) => ({ ...w, week_number: i + 1 })),
    }));
  }, []);

  const updateWeekTheme = useCallback((weekIndex: number, theme: string) => {
    setForm((prev) => ({
      ...prev,
      weeks: prev.weeks.map((w, i) =>
        i === weekIndex ? { ...w, theme } : w
      ),
    }));
  }, []);

  // =============================================
  // TASK HANDLERS
  // =============================================

  const addTask = useCallback((weekIndex: number, dayIndex: number) => {
    setForm((prev) => ({
      ...prev,
      weeks: prev.weeks.map((w, wi) =>
        wi === weekIndex
          ? {
              ...w,
              days: w.days.map((d, di) =>
                di === dayIndex
                  ? {
                      ...d,
                      tasks: [...d.tasks, createEmptyTask(d.tasks.length + 1)],
                    }
                  : d
              ),
            }
          : w
      ),
    }));
  }, []);

  const removeTask = useCallback(
    (weekIndex: number, dayIndex: number, taskIndex: number) => {
      setForm((prev) => ({
        ...prev,
        weeks: prev.weeks.map((w, wi) =>
          wi === weekIndex
            ? {
                ...w,
                days: w.days.map((d, di) =>
                  di === dayIndex
                    ? {
                        ...d,
                        tasks: d.tasks
                          .filter((_, ti) => ti !== taskIndex)
                          .map((t, i) => ({ ...t, task_order: i + 1 })),
                      }
                    : d
                ),
              }
            : w
        ),
      }));
    },
    []
  );

  const updateTask = useCallback(
    (
      weekIndex: number,
      dayIndex: number,
      taskIndex: number,
      updates: Partial<TaskForm>
    ) => {
      setForm((prev) => ({
        ...prev,
        weeks: prev.weeks.map((w, wi) =>
          wi === weekIndex
            ? {
                ...w,
                days: w.days.map((d, di) =>
                  di === dayIndex
                    ? {
                        ...d,
                        tasks: d.tasks.map((t, ti) =>
                          ti === taskIndex ? { ...t, ...updates } : t
                        ),
                      }
                    : d
                ),
              }
            : w
        ),
      }));
    },
    []
  );

  // =============================================
  // SAVE HANDLER
  // =============================================

  const handleSave = useCallback(async () => {
    // Validate
    if (!form.title.trim()) {
      alert('Please enter a protocol title');
      return;
    }

    // Check for at least one task
    const hasTask = form.weeks.some((w) =>
      w.days.some((d) => d.tasks.some((t) => t.title.trim()))
    );
    if (!hasTask) {
      alert('Please add at least one task');
      return;
    }

    await onSave(form);
  }, [form, onSave]);

  // =============================================
  // STATS
  // =============================================

  const stats = {
    weeks: form.weeks.length,
    days: form.weeks.reduce((sum, w) => sum + w.days.filter((d) => d.tasks.some((t) => t.title)).length, 0),
    tasks: form.weeks.reduce(
      (sum, w) => sum + w.days.reduce((dSum, d) => dSum + d.tasks.filter((t) => t.title).length, 0),
      0
    ),
  };

  // =============================================
  // RENDER
  // =============================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {initialData ? 'Edit Protocol' : 'New Protocol'}
          </h2>
          <p className="text-muted-foreground">
            Create a multi-week coaching protocol
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setPreviewMode(!previewMode)}>
            <Eye className="h-4 w-4 mr-2" />
            {previewMode ? 'Edit' : 'Preview'}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Protocol'}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4">
        <Badge variant="secondary">{stats.weeks} Week(s)</Badge>
        <Badge variant="secondary">{stats.days} Day(s) with tasks</Badge>
        <Badge variant="secondary">{stats.tasks} Task(s)</Badge>
      </div>

      {/* Protocol Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Protocol Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Protocol Title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., 8-Week Identity Shift"
              />
            </div>
            <div className="space-y-2">
              <Label>Theme Color</Label>
              <div className="flex gap-2">
                {THEME_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 ${
                      form.theme_color === color.value
                        ? 'border-foreground'
                        : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() =>
                      setForm((prev) => ({ ...prev, theme_color: color.value }))
                    }
                    title={color.label}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Describe what this protocol covers..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Visibility</Label>
              <Select
                value={form.visibility}
                onValueChange={(v) =>
                  setForm((prev) => ({
                    ...prev,
                    visibility: v as CoachProtocolVisibility,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VISIBILITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Schedule Type</Label>
              <Select
                value={form.schedule_type}
                onValueChange={(v) =>
                  setForm((prev) => ({
                    ...prev,
                    schedule_type: v as ProtocolScheduleType,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCHEDULE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weeks Accordion */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Protocol Content</h3>
          <Button onClick={addWeek} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Week
          </Button>
        </div>

        <Accordion
          type="multiple"
          value={expandedWeeks}
          onValueChange={setExpandedWeeks}
          className="space-y-4"
        >
          {form.weeks.map((week, weekIndex) => (
            <AccordionItem
              key={`week-${week.week_number}`}
              value={`week-${week.week_number}`}
              className="border rounded-lg"
            >
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-4 flex-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: form.theme_color }}
                  />
                  <span className="font-medium">Week {week.week_number}</span>
                  {week.theme && (
                    <span className="text-muted-foreground">: {week.theme}</span>
                  )}
                  <Badge variant="secondary" className="ml-auto mr-4">
                    {week.days.reduce((sum, d) => sum + d.tasks.filter((t) => t.title).length, 0)} tasks
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4">
                  {/* Week Theme */}
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Input
                        value={week.theme}
                        onChange={(e) => updateWeekTheme(weekIndex, e.target.value)}
                        placeholder="Week theme (e.g., Foundation, Building Momentum)"
                      />
                    </div>
                    {form.weeks.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeWeek(weekIndex)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Days */}
                  <div className="space-y-2">
                    {week.days.map((day, dayIndex) => (
                      <Collapsible
                        key={`week-${week.week_number}-day-${day.day_number}`}
                        open={expandedDays.includes(
                          `week-${week.week_number}-day-${day.day_number}`
                        )}
                        onOpenChange={(open) => {
                          const key = `week-${week.week_number}-day-${day.day_number}`;
                          setExpandedDays((prev) =>
                            open ? [...prev, key] : prev.filter((k) => k !== key)
                          );
                        }}
                      >
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 cursor-pointer hover:bg-muted">
                            <ChevronRight
                              className={`h-4 w-4 transition-transform ${
                                expandedDays.includes(
                                  `week-${week.week_number}-day-${day.day_number}`
                                )
                                  ? 'rotate-90'
                                  : ''
                              }`}
                            />
                            <span className="font-medium">Day {day.day_number}</span>
                            <Badge variant="outline" className="ml-auto">
                              {day.tasks.filter((t) => t.title).length} task(s)
                            </Badge>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pl-6 pt-2 space-y-2">
                          {day.tasks.map((task, taskIndex) => (
                            <TaskEditor
                              key={task.id}
                              task={task}
                              onUpdate={(updates) =>
                                updateTask(weekIndex, dayIndex, taskIndex, updates)
                              }
                              onRemove={() =>
                                removeTask(weekIndex, dayIndex, taskIndex)
                              }
                              canRemove={day.tasks.length > 1}
                            />
                          ))}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => addTask(weekIndex, dayIndex)}
                            className="w-full border-dashed border"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Task to Day {day.day_number}
                          </Button>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}

// =============================================
// TASK EDITOR SUB-COMPONENT
// =============================================

interface TaskEditorProps {
  task: TaskForm;
  onUpdate: (updates: Partial<TaskForm>) => void;
  onRemove: () => void;
  canRemove: boolean;
}

function TaskEditor({ task, onUpdate, onRemove, canRemove }: TaskEditorProps) {
  return (
    <Card className="border-l-4" style={{ borderLeftColor: '#fac832' }}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <GripVertical className="h-5 w-5 text-muted-foreground cursor-move mt-2" />

          <div className="flex-1 space-y-3">
            {/* Task Type & Time of Day */}
            <div className="flex gap-2">
              <Select
                value={task.time_of_day}
                onValueChange={(v) => onUpdate({ time_of_day: v as TaskTimeOfDay })}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OF_DAY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        {opt.icon}
                        {opt.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={task.task_type}
                onValueChange={(v) => onUpdate({ task_type: v as CoachTaskType })}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        {opt.icon}
                        {opt.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="number"
                value={task.estimated_minutes || ''}
                onChange={(e) =>
                  onUpdate({
                    estimated_minutes: e.target.value
                      ? parseInt(e.target.value, 10)
                      : undefined,
                  })
                }
                placeholder="Min"
                className="w-20"
              />
            </div>

            {/* Title */}
            <Input
              value={task.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              placeholder="Task title"
            />

            {/* Instructions */}
            <Textarea
              value={task.instructions}
              onChange={(e) => onUpdate({ instructions: e.target.value })}
              placeholder="Task instructions..."
              rows={2}
            />

            {/* Resource URL */}
            <Input
              value={task.resource_url || ''}
              onChange={(e) => onUpdate({ resource_url: e.target.value })}
              placeholder="Resource URL (optional)"
            />
          </div>

          {canRemove && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRemove}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default MultiWeekProtocolEditor;
