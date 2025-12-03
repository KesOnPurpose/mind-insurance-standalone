// Protocol Editor Component
// Phase 27: Create/Edit Coach Protocols with 7-day task builder

import React, { useState, useEffect } from 'react';
import {
  Save,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Calendar,
  Clock,
  FileText,
  Video,
  Mic,
  BookOpen,
  CheckSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  createCoachProtocol,
  updateCoachProtocol,
  getCoachProtocolWithTasks,
  bulkCreateCoachTasks,
  deleteCoachTask,
} from '@/services/adminProtocolService';
import type {
  CoachProtocol,
  CoachProtocolTask,
  CoachScheduleType,
  CoachVisibility,
  CoachTaskType,
  CreateCoachTaskForm,
} from '@/types/protocol';

interface ProtocolEditorProps {
  protocol: CoachProtocol | null;
  onSave: () => void;
  onCancel: () => void;
}

interface DayTasks {
  day: number;
  tasks: TaskFormData[];
  isExpanded: boolean;
}

interface TaskFormData {
  id?: string;
  title: string;
  instructions: string;
  task_type: CoachTaskType;
  estimated_duration?: number;
  resource_url?: string;
  task_order: number;
}

const TASK_TYPES: { value: CoachTaskType; label: string; icon: React.ReactNode }[] = [
  { value: 'action', label: 'Action', icon: <CheckSquare className="h-4 w-4" /> },
  { value: 'reflection', label: 'Reflection', icon: <FileText className="h-4 w-4" /> },
  { value: 'reading', label: 'Reading', icon: <BookOpen className="h-4 w-4" /> },
  { value: 'video', label: 'Video', icon: <Video className="h-4 w-4" /> },
  { value: 'worksheet', label: 'Worksheet', icon: <FileText className="h-4 w-4" /> },
  { value: 'voice_recording', label: 'Voice', icon: <Mic className="h-4 w-4" /> },
];

const THEME_COLORS = [
  '#fac832', // Gold
  '#05c3dd', // Cyan
  '#8b5cf6', // Purple
  '#22c55e', // Green
  '#ef4444', // Red
  '#f97316', // Orange
];

export function ProtocolEditor({ protocol, onSave, onCancel }: ProtocolEditorProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduleType, setScheduleType] = useState<CoachScheduleType>('weekly_cycle');
  const [cycleWeekNumber, setCycleWeekNumber] = useState<number>(1);
  const [startDate, setStartDate] = useState('');
  const [visibility, setVisibility] = useState<CoachVisibility>('all_users');
  const [themeColor, setThemeColor] = useState('#fac832');
  const [dayTasks, setDayTasks] = useState<DayTasks[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize days with empty tasks
  useEffect(() => {
    if (protocol) {
      loadProtocolData();
    } else {
      initializeEmptyDays();
    }
  }, [protocol]);

  const initializeEmptyDays = () => {
    const days: DayTasks[] = Array.from({ length: 7 }, (_, i) => ({
      day: i + 1,
      tasks: [],
      isExpanded: i === 0, // Expand first day by default
    }));
    setDayTasks(days);
  };

  const loadProtocolData = async () => {
    if (!protocol) return;

    setIsLoading(true);
    try {
      const fullProtocol = await getCoachProtocolWithTasks(protocol.id);
      if (fullProtocol) {
        setTitle(fullProtocol.title);
        setDescription(fullProtocol.description || '');
        setScheduleType(fullProtocol.schedule_type);
        setCycleWeekNumber(fullProtocol.cycle_week_number || 1);
        setStartDate(fullProtocol.start_date || '');
        setVisibility(fullProtocol.visibility);
        setThemeColor(fullProtocol.theme_color || '#fac832');

        // Organize tasks by day
        const days: DayTasks[] = Array.from({ length: 7 }, (_, i) => {
          const dayNum = i + 1;
          const dayTasks = fullProtocol.tasks
            .filter((t) => t.day_number === dayNum)
            .sort((a, b) => a.task_order - b.task_order)
            .map((t) => ({
              id: t.id,
              title: t.title,
              instructions: t.instructions,
              task_type: t.task_type,
              estimated_duration: t.estimated_duration,
              resource_url: t.resource_url,
              task_order: t.task_order,
            }));
          return {
            day: dayNum,
            tasks: dayTasks,
            isExpanded: dayNum === 1,
          };
        });
        setDayTasks(days);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load protocol data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDay = (dayIndex: number) => {
    setDayTasks((prev) =>
      prev.map((d, i) =>
        i === dayIndex ? { ...d, isExpanded: !d.isExpanded } : d
      )
    );
  };

  const addTaskToDay = (dayIndex: number) => {
    setDayTasks((prev) =>
      prev.map((d, i) => {
        if (i !== dayIndex) return d;
        return {
          ...d,
          tasks: [
            ...d.tasks,
            {
              title: '',
              instructions: '',
              task_type: 'action' as CoachTaskType,
              estimated_duration: 10,
              task_order: d.tasks.length + 1,
            },
          ],
          isExpanded: true,
        };
      })
    );
  };

  const updateTask = (dayIndex: number, taskIndex: number, updates: Partial<TaskFormData>) => {
    setDayTasks((prev) =>
      prev.map((d, i) => {
        if (i !== dayIndex) return d;
        return {
          ...d,
          tasks: d.tasks.map((t, j) =>
            j === taskIndex ? { ...t, ...updates } : t
          ),
        };
      })
    );
  };

  const removeTask = (dayIndex: number, taskIndex: number) => {
    setDayTasks((prev) =>
      prev.map((d, i) => {
        if (i !== dayIndex) return d;
        return {
          ...d,
          tasks: d.tasks.filter((_, j) => j !== taskIndex),
        };
      })
    );
  };

  const handleSave = async () => {
    if (!user?.id) return;

    if (!title.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a protocol title',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      let protocolId: string;

      if (protocol) {
        // Update existing protocol
        await updateCoachProtocol(protocol.id, {
          title,
          description,
          schedule_type: scheduleType,
          cycle_week_number: scheduleType === 'weekly_cycle' ? cycleWeekNumber : undefined,
          start_date: scheduleType === 'date_specific' ? startDate : undefined,
          visibility,
          theme_color: themeColor,
        });
        protocolId = protocol.id;

        // Delete existing tasks (we'll recreate them)
        const existingProtocol = await getCoachProtocolWithTasks(protocol.id);
        if (existingProtocol) {
          for (const task of existingProtocol.tasks) {
            await deleteCoachTask(task.id);
          }
        }
      } else {
        // Create new protocol
        const newProtocol = await createCoachProtocol(
          {
            title,
            description,
            schedule_type: scheduleType,
            cycle_week_number: scheduleType === 'weekly_cycle' ? cycleWeekNumber : undefined,
            start_date: scheduleType === 'date_specific' ? startDate : undefined,
            visibility,
            theme_color: themeColor,
          },
          user.id
        );
        protocolId = newProtocol.id;
      }

      // Create all tasks
      const allTasks: CreateCoachTaskForm[] = [];
      dayTasks.forEach((day) => {
        day.tasks.forEach((task, index) => {
          if (task.title.trim()) {
            allTasks.push({
              day_number: day.day,
              task_order: index + 1,
              title: task.title,
              instructions: task.instructions,
              task_type: task.task_type,
              estimated_duration: task.estimated_duration,
              resource_url: task.resource_url,
            });
          }
        });
      });

      if (allTasks.length > 0) {
        await bulkCreateCoachTasks(protocolId, allTasks);
      }

      toast({
        title: 'Success',
        description: `Protocol ${protocol ? 'updated' : 'created'} successfully`,
      });
      onSave();
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${protocol ? 'update' : 'create'} protocol`,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Protocol Details */}
      <Card>
        <CardHeader>
          <CardTitle>{protocol ? 'Edit Protocol' : 'New Protocol'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Protocol Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Week 1: Identity Foundation"
              />
            </div>
            <div className="space-y-2">
              <Label>Theme Color</Label>
              <div className="flex gap-2">
                {THEME_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setThemeColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${
                      themeColor === color ? 'border-gray-800 scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this protocol covers..."
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Schedule Type</Label>
              <Select
                value={scheduleType}
                onValueChange={(v) => setScheduleType(v as CoachScheduleType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly_cycle">Weekly Cycle</SelectItem>
                  <SelectItem value="evergreen">Evergreen</SelectItem>
                  <SelectItem value="date_specific">Date Specific</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {scheduleType === 'weekly_cycle' && (
              <div className="space-y-2">
                <Label>Cycle Week Number</Label>
                <Select
                  value={cycleWeekNumber.toString()}
                  onValueChange={(v) => setCycleWeekNumber(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 52 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        Week {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {scheduleType === 'date_specific' && (
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Visibility</Label>
              <Select
                value={visibility}
                onValueChange={(v) => setVisibility(v as CoachVisibility)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_users">All Users</SelectItem>
                  <SelectItem value="tier_based">Tier Based</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 7-Day Task Builder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            7-Day Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dayTasks.map((day, dayIndex) => (
              <div
                key={day.day}
                className="border rounded-lg overflow-hidden"
                style={{ borderLeftColor: themeColor, borderLeftWidth: '4px' }}
              >
                {/* Day Header */}
                <button
                  type="button"
                  onClick={() => toggleDay(dayIndex)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">Day {day.day}</span>
                    <span className="text-sm text-muted-foreground">
                      {day.tasks.length} task{day.tasks.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {day.isExpanded ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>

                {/* Day Tasks */}
                {day.isExpanded && (
                  <div className="p-4 space-y-4">
                    {day.tasks.map((task, taskIndex) => (
                      <div
                        key={taskIndex}
                        className="border rounded-lg p-4 bg-white space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 grid gap-3 md:grid-cols-2">
                            <div className="space-y-1">
                              <Label className="text-xs">Task Title</Label>
                              <Input
                                value={task.title}
                                onChange={(e) =>
                                  updateTask(dayIndex, taskIndex, { title: e.target.value })
                                }
                                placeholder="Task title..."
                              />
                            </div>
                            <div className="flex gap-2">
                              <div className="flex-1 space-y-1">
                                <Label className="text-xs">Type</Label>
                                <Select
                                  value={task.task_type}
                                  onValueChange={(v) =>
                                    updateTask(dayIndex, taskIndex, {
                                      task_type: v as CoachTaskType,
                                    })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {TASK_TYPES.map((t) => (
                                      <SelectItem key={t.value} value={t.value}>
                                        <span className="flex items-center gap-2">
                                          {t.icon}
                                          {t.label}
                                        </span>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="w-24 space-y-1">
                                <Label className="text-xs">Duration</Label>
                                <Input
                                  type="number"
                                  value={task.estimated_duration || ''}
                                  onChange={(e) =>
                                    updateTask(dayIndex, taskIndex, {
                                      estimated_duration: parseInt(e.target.value) || undefined,
                                    })
                                  }
                                  placeholder="min"
                                />
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeTask(dayIndex, taskIndex)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Instructions</Label>
                          <Textarea
                            value={task.instructions}
                            onChange={(e) =>
                              updateTask(dayIndex, taskIndex, {
                                instructions: e.target.value,
                              })
                            }
                            placeholder="Detailed task instructions..."
                            rows={2}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Resource URL (Optional)</Label>
                          <Input
                            value={task.resource_url || ''}
                            onChange={(e) =>
                              updateTask(dayIndex, taskIndex, {
                                resource_url: e.target.value || undefined,
                              })
                            }
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                    ))}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addTaskToDay(dayIndex)}
                      className="w-full"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Task to Day {day.day}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Protocol
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
