// MultiWeekProtocolEditor Component
// Create and edit multi-week coach protocols with accordion UI

import React, { useState, useCallback, useEffect } from 'react';
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
  Users,
  User,
  Shield,
  X,
  Check,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
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
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import type {
  CoachTaskType,
  TaskTimeOfDay,
  CreateCoachProtocolTaskForm,
  CoachProtocolVisibility,
  ProtocolScheduleType,
  VisibilityConfig,
  CoachProtocolV2,
} from '@/types/coach-protocol';

// =============================================
// USER/GROUP TYPES
// =============================================

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface MIOUserGroup {
  id: string;
  name: string;
  description: string | null;
}

// Tier options
const TIER_OPTIONS = [
  { value: 'free', label: 'Free' },
  { value: 'basic', label: 'Basic' },
  { value: 'premium', label: 'Premium' },
  { value: 'admin', label: 'Admin' },
  { value: 'owner', label: 'Owner' },
  { value: 'super_admin', label: 'Super Admin' },
];

// =============================================
// TYPES
// =============================================

interface ProtocolEditorForm {
  title: string;
  description: string;
  visibility: CoachProtocolVisibility;
  visibility_config?: VisibilityConfig;
  schedule_type: ProtocolScheduleType;
  start_date?: string;
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
  protocol?: CoachProtocolV2;  // Database object for editing existing protocols
  initialData?: ProtocolEditorForm;  // Pre-populated form data (optional)
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
  visibility_config: undefined,
  schedule_type: 'immediate',
  start_date: undefined,
  theme_color: '#fac832',
  weeks: [createEmptyWeek(1)],
});

/**
 * Transform a database CoachProtocolV2 object into the ProtocolEditorForm structure
 * by fetching tasks and building the nested weeks/days/tasks structure
 */
const transformProtocolToForm = async (
  protocol: CoachProtocolV2
): Promise<ProtocolEditorForm> => {
  // Fetch tasks for this protocol
  const { data: tasks, error } = await supabase
    .from('coach_protocol_tasks_v2')
    .select('*')
    .eq('protocol_id', protocol.id)
    .order('week_number')
    .order('day_number')
    .order('task_order');

  if (error) {
    console.error('Error fetching protocol tasks:', error);
    throw new Error('Failed to load protocol tasks');
  }

  // Build nested weeks structure
  const weeks: WeekForm[] = [];
  for (let w = 1; w <= protocol.total_weeks; w++) {
    const weekTasks = tasks?.filter(t => t.week_number === w) || [];
    const weekTheme = weekTasks[0]?.week_theme || '';

    const days: DayForm[] = [];
    for (let d = 1; d <= 7; d++) {
      const dayTasks = weekTasks.filter(t => t.day_number === d);
      days.push({
        day_number: d,
        tasks: dayTasks.length > 0
          ? dayTasks.map(t => ({
              id: t.id,
              task_order: t.task_order,
              title: t.title,
              instructions: t.instructions || '',
              task_type: t.task_type as CoachTaskType,
              time_of_day: t.time_of_day as TaskTimeOfDay,
              estimated_minutes: t.estimated_minutes,
              resource_url: t.resource_url,
            }))
          : [createEmptyTask(1)]
      });
    }

    weeks.push({ week_number: w, theme: weekTheme, days });
  }

  return {
    title: protocol.title,
    description: protocol.description || '',
    visibility: protocol.visibility,
    visibility_config: protocol.visibility_config,
    schedule_type: protocol.schedule_type,
    start_date: protocol.start_date,
    theme_color: protocol.theme_color || '#fac832',
    weeks,
  };
};

// =============================================
// COMPONENT
// =============================================

export function MultiWeekProtocolEditor({
  protocol,
  initialData,
  onSave,
  onCancel,
  isSaving = false,
}: MultiWeekProtocolEditorProps) {
  const { toast } = useToast();
  const [form, setForm] = useState<ProtocolEditorForm>(initialData || getDefaultForm());
  const [expandedWeeks, setExpandedWeeks] = useState<string[]>(['week-1']);
  const [expandedDays, setExpandedDays] = useState<string[]>(['week-1-day-1']);
  const [previewMode, setPreviewMode] = useState(false);
  const [isLoadingProtocol, setIsLoadingProtocol] = useState(false);

  // Users and groups for visibility config
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [groups, setGroups] = useState<MIOUserGroup[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');

  // Fetch users and groups when visibility changes
  useEffect(() => {
    const fetchUsersAndGroups = async () => {
      if (form.visibility === 'individual') {
        setUsersLoading(true);
        const { data: userData } = await supabase
          .from('user_profiles')
          .select('id, full_name, email')
          .order('full_name');
        if (userData) setUsers(userData);
        setUsersLoading(false);
      }

      if (form.visibility === 'custom_group') {
        const { data: groupData } = await supabase
          .from('mio_user_groups')
          .select('id, name, description');
        if (groupData) setGroups(groupData);
      }
    };

    fetchUsersAndGroups();
  }, [form.visibility]);

  // Reset visibility_config when visibility type changes
  useEffect(() => {
    if (form.visibility === 'all_users') {
      setForm(prev => ({ ...prev, visibility_config: undefined }));
    }
  }, [form.visibility]);

  // Load protocol data when editing an existing protocol
  useEffect(() => {
    const loadProtocol = async () => {
      if (protocol) {
        setIsLoadingProtocol(true);
        try {
          const formData = await transformProtocolToForm(protocol);
          setForm(formData);
          // Expand the first week and day for better UX
          setExpandedWeeks(['week-1']);
          setExpandedDays(['week-1-day-1']);
        } catch (error) {
          console.error('Failed to load protocol:', error);
          toast({
            title: 'Error',
            description: 'Failed to load protocol data. Please try again.',
            variant: 'destructive',
          });
        } finally {
          setIsLoadingProtocol(false);
        }
      }
    };
    loadProtocol();
  }, [protocol?.id, toast]);

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
    // Validate title
    if (!form.title.trim()) {
      toast({
        title: 'Title required',
        description: 'Please enter a protocol title',
        variant: 'destructive',
      });
      return;
    }

    // Check for at least one task
    const hasTask = form.weeks.some((w) =>
      w.days.some((d) => d.tasks.some((t) => t.title.trim()))
    );
    if (!hasTask) {
      toast({
        title: 'Tasks required',
        description: 'Please add at least one task with a title',
        variant: 'destructive',
      });
      return;
    }

    // Validate start_date if schedule_type is date_specific
    if (form.schedule_type === 'date_specific' && !form.start_date) {
      toast({
        title: 'Start date required',
        description: 'Please select a start date for scheduled protocols',
        variant: 'destructive',
      });
      return;
    }

    // Validate visibility_config based on visibility type
    if (form.visibility === 'tier_based') {
      if (!form.visibility_config?.tiers?.length) {
        toast({
          title: 'Tiers required',
          description: 'Please select at least one tier',
          variant: 'destructive',
        });
        return;
      }
    }

    if (form.visibility === 'individual') {
      if (!form.visibility_config?.user_ids?.length) {
        toast({
          title: 'Users required',
          description: 'Please select at least one user',
          variant: 'destructive',
        });
        return;
      }
    }

    if (form.visibility === 'custom_group') {
      if (!form.visibility_config?.group_ids?.length) {
        toast({
          title: 'Groups required',
          description: 'Please select at least one group',
          variant: 'destructive',
        });
        return;
      }
    }

    await onSave(form);
  }, [form, onSave, toast]);

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

  // Show loading state while fetching protocol data for editing
  if (isLoadingProtocol) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-3 text-muted-foreground">Loading protocol...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {protocol ? 'Edit Protocol' : 'New Protocol'}
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
                    visibility_config: undefined, // Reset config when type changes
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
                    start_date: v === 'immediate' ? undefined : prev.start_date,
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

          {/* Date Picker - shown when schedule_type is date_specific */}
          {form.schedule_type === 'date_specific' && (
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date *</Label>
              <Input
                id="start_date"
                type="date"
                value={form.start_date || ''}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, start_date: e.target.value }))
                }
                className="w-[200px]"
              />
              <p className="text-sm text-muted-foreground">
                Protocol will start on this date for all assigned users
              </p>
            </div>
          )}

          {/* Tier Selection - shown when visibility is tier_based */}
          {form.visibility === 'tier_based' && (
            <div className="space-y-2">
              <Label>Select Tiers *</Label>
              <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-muted/30">
                {TIER_OPTIONS.map((tier) => {
                  const isSelected = form.visibility_config?.tiers?.includes(tier.value);
                  return (
                    <button
                      key={tier.value}
                      type="button"
                      onClick={() => {
                        const currentTiers = form.visibility_config?.tiers || [];
                        const newTiers = isSelected
                          ? currentTiers.filter((t) => t !== tier.value)
                          : [...currentTiers, tier.value];
                        setForm((prev) => ({
                          ...prev,
                          visibility_config: { ...prev.visibility_config, tiers: newTiers },
                        }));
                      }}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background border hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        {isSelected && <Check className="h-3 w-3" />}
                        <Shield className="h-3 w-3" />
                        {tier.label}
                      </div>
                    </button>
                  );
                })}
              </div>
              {form.visibility_config?.tiers?.length ? (
                <p className="text-sm text-muted-foreground">
                  {form.visibility_config.tiers.length} tier(s) selected
                </p>
              ) : (
                <p className="text-sm text-destructive">
                  Please select at least one tier
                </p>
              )}
            </div>
          )}

          {/* User Selection - shown when visibility is individual */}
          {form.visibility === 'individual' && (
            <div className="space-y-2">
              <Label>Select Users *</Label>
              <Input
                placeholder="Search users by name or email..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="mb-2"
              />
              {usersLoading ? (
                <div className="p-4 text-center text-muted-foreground">
                  Loading users...
                </div>
              ) : (
                <ScrollArea className="h-[200px] border rounded-md p-2">
                  <div className="space-y-1">
                    {users
                      .filter((user) => {
                        if (!userSearchTerm) return true;
                        const search = userSearchTerm.toLowerCase();
                        return (
                          user.full_name?.toLowerCase().includes(search) ||
                          user.email?.toLowerCase().includes(search)
                        );
                      })
                      .map((user) => {
                        const isSelected = form.visibility_config?.user_ids?.includes(user.id);
                        return (
                          <div
                            key={user.id}
                            className={`flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-muted ${
                              isSelected ? 'bg-primary/10' : ''
                            }`}
                            onClick={() => {
                              const currentIds = form.visibility_config?.user_ids || [];
                              const newIds = isSelected
                                ? currentIds.filter((id) => id !== user.id)
                                : [...currentIds, user.id];
                              setForm((prev) => ({
                                ...prev,
                                visibility_config: { ...prev.visibility_config, user_ids: newIds },
                              }));
                            }}
                          >
                            <Checkbox checked={isSelected} />
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                {user.full_name || 'No name'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    {users.length === 0 && !usersLoading && (
                      <p className="text-center text-muted-foreground py-4">
                        No users found
                      </p>
                    )}
                  </div>
                </ScrollArea>
              )}
              {form.visibility_config?.user_ids?.length ? (
                <p className="text-sm text-muted-foreground">
                  {form.visibility_config.user_ids.length} user(s) selected
                </p>
              ) : (
                <p className="text-sm text-destructive">
                  Please select at least one user
                </p>
              )}
            </div>
          )}

          {/* Group Selection - shown when visibility is custom_group */}
          {form.visibility === 'custom_group' && (
            <div className="space-y-2">
              <Label>Select Groups *</Label>
              {groups.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground border rounded-md">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No groups available</p>
                  <p className="text-xs">Create groups in the MIO User Groups section first</p>
                </div>
              ) : (
                <div className="space-y-2 border rounded-md p-2">
                  {groups.map((group) => {
                    const isSelected = form.visibility_config?.group_ids?.includes(group.id);
                    return (
                      <div
                        key={group.id}
                        className={`flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-muted ${
                          isSelected ? 'bg-primary/10' : ''
                        }`}
                        onClick={() => {
                          const currentIds = form.visibility_config?.group_ids || [];
                          const newIds = isSelected
                            ? currentIds.filter((id) => id !== group.id)
                            : [...currentIds, group.id];
                          setForm((prev) => ({
                            ...prev,
                            visibility_config: { ...prev.visibility_config, group_ids: newIds },
                          }));
                        }}
                      >
                        <Checkbox checked={isSelected} />
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{group.name}</p>
                          {group.description && (
                            <p className="text-xs text-muted-foreground">
                              {group.description}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {form.visibility_config?.group_ids?.length ? (
                <p className="text-sm text-muted-foreground">
                  {form.visibility_config.group_ids.length} group(s) selected
                </p>
              ) : (
                <p className="text-sm text-destructive">
                  Please select at least one group
                </p>
              )}
            </div>
          )}
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
