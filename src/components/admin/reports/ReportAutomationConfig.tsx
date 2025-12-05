// MIO Report Automation Configuration Component
// Phase 28: Configure automated report generation schedules and targets

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Users,
  Zap,
  Play,
  Pause,
  Trash2,
  Edit2,
  Plus,
  RefreshCw,
  Settings,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TargetUserPicker } from './TargetUserPicker';

// Types
interface MIOReportAutomation {
  id: string;
  name: string;
  description: string | null;
  target_type: 'individual' | 'auto_group' | 'custom_group' | 'all';
  target_config: Record<string, any>;
  schedule_type: 'manual' | 'daily' | 'weekly' | 'event_based';
  schedule_config: Record<string, any> | null;
  n8n_webhook_url: string | null;
  is_active: boolean;
  last_run_at: string | null;
  last_run_status: string | null;
  last_run_count: number | null;
  next_run_at: string | null;
  created_at: string;
  updated_at: string;
}

interface AutomationFormData {
  name: string;
  description: string;
  target_type: 'individual' | 'auto_group' | 'custom_group' | 'all';
  target_config: Record<string, any>;
  schedule_type: 'manual' | 'daily' | 'weekly' | 'event_based';
  schedule_config: Record<string, any>;
  n8n_webhook_url: string;
}

const SCHEDULE_TYPE_CONFIG = {
  manual: { label: 'Manual Only', icon: <Settings />, description: 'Trigger manually from admin panel' },
  daily: { label: 'Daily', icon: <Calendar />, description: 'Run once per day' },
  weekly: { label: 'Weekly', icon: <Calendar />, description: 'Run once per week' },
  event_based: { label: 'Event-Based', icon: <Zap />, description: 'Trigger on practice events' },
};

const TARGET_TYPE_CONFIG = {
  individual: { label: 'Specific Users', description: 'Select individual users' },
  auto_group: { label: 'Auto Group', description: 'Dynamic group based on pattern/temperament/week' },
  custom_group: { label: 'Custom Group', description: 'Manually created user group' },
  all: { label: 'All Users', description: 'All active users in the system' },
};

const DAYS_OF_WEEK = [
  { value: '0', label: 'Sunday' },
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
];

export function ReportAutomationConfig() {
  const { toast } = useToast();

  // State
  const [automations, setAutomations] = useState<MIOReportAutomation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<MIOReportAutomation | null>(null);
  const [userCount, setUserCount] = useState<number | null>(null);

  // Default webhook URL for MIO Report Generator
  const DEFAULT_WEBHOOK_URL = 'https://n8n-n8n.vq00fr.easypanel.host/webhook/mio-report-generator';

  // Form state
  const [formData, setFormData] = useState<AutomationFormData>({
    name: '',
    description: '',
    target_type: 'all',
    target_config: {},
    schedule_type: 'manual',
    schedule_config: { time: '09:00' },
    n8n_webhook_url: DEFAULT_WEBHOOK_URL,
  });

  // Fetch automations on mount
  useEffect(() => {
    fetchAutomations();
  }, []);

  const fetchAutomations = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('mio_report_automation')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAutomations((data as MIOReportAutomation[]) || []);
    } catch (error) {
      console.error('Error fetching automations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load automations. Make sure to run the database migration first.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast({ title: 'Error', description: 'Name is required', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);
    try {
      const { error } = await supabase.from('mio_report_automation').insert({
        name: formData.name,
        description: formData.description || null,
        target_type: formData.target_type,
        target_config: formData.target_config,
        schedule_type: formData.schedule_type,
        schedule_config: formData.schedule_config,
        n8n_webhook_url: formData.n8n_webhook_url || null,
        is_active: true,
      });

      if (error) throw error;

      toast({ title: 'Success', description: 'Automation created successfully' });
      setShowCreateDialog(false);
      resetForm();
      fetchAutomations();
    } catch (error) {
      console.error('Error creating automation:', error);
      toast({ title: 'Error', description: 'Failed to create automation', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingAutomation) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('mio_report_automation')
        .update({
          name: formData.name,
          description: formData.description || null,
          target_type: formData.target_type,
          target_config: formData.target_config,
          schedule_type: formData.schedule_type,
          schedule_config: formData.schedule_config,
          n8n_webhook_url: formData.n8n_webhook_url || null,
        })
        .eq('id', editingAutomation.id);

      if (error) throw error;

      toast({ title: 'Success', description: 'Automation updated successfully' });
      setEditingAutomation(null);
      resetForm();
      fetchAutomations();
    } catch (error) {
      console.error('Error updating automation:', error);
      toast({ title: 'Error', description: 'Failed to update automation', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this automation?')) return;

    try {
      const { error } = await supabase.from('mio_report_automation').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Success', description: 'Automation deleted' });
      fetchAutomations();
    } catch (error) {
      console.error('Error deleting automation:', error);
      toast({ title: 'Error', description: 'Failed to delete automation', variant: 'destructive' });
    }
  };

  const handleToggleActive = async (automation: MIOReportAutomation) => {
    try {
      const { error } = await supabase
        .from('mio_report_automation')
        .update({ is_active: !automation.is_active })
        .eq('id', automation.id);

      if (error) throw error;
      toast({
        title: 'Success',
        description: automation.is_active ? 'Automation paused' : 'Automation activated',
      });
      fetchAutomations();
    } catch (error) {
      console.error('Error toggling automation:', error);
      toast({ title: 'Error', description: 'Failed to update automation', variant: 'destructive' });
    }
  };

  const handleTriggerNow = async (automation: MIOReportAutomation) => {
    if (!automation.n8n_webhook_url) {
      toast({
        title: 'Error',
        description: 'No webhook URL configured for this automation',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(automation.n8n_webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          automation_id: automation.id,
          target_type: automation.target_type,
          target_config: automation.target_config,
          triggered_by: 'admin_manual',
        }),
      });

      if (!response.ok) throw new Error('Webhook request failed');

      toast({ title: 'Success', description: 'Report generation triggered' });

      // Update last_run_at
      await supabase
        .from('mio_report_automation')
        .update({
          last_run_at: new Date().toISOString(),
          last_run_status: 'triggered',
        })
        .eq('id', automation.id);

      fetchAutomations();
    } catch (error) {
      console.error('Error triggering automation:', error);
      toast({ title: 'Error', description: 'Failed to trigger automation', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      target_type: 'all',
      target_config: {},
      schedule_type: 'manual',
      schedule_config: { time: '09:00' },
      n8n_webhook_url: DEFAULT_WEBHOOK_URL,
    });
    setUserCount(null);
  };

  const openEditDialog = (automation: MIOReportAutomation) => {
    setEditingAutomation(automation);
    setFormData({
      name: automation.name,
      description: automation.description || '',
      target_type: automation.target_type,
      target_config: automation.target_config,
      schedule_type: automation.schedule_type,
      schedule_config: automation.schedule_config || { time: '09:00' },
      n8n_webhook_url: automation.n8n_webhook_url || '',
    });
  };

  const getScheduleDescription = (automation: MIOReportAutomation): string => {
    switch (automation.schedule_type) {
      case 'manual':
        return 'Manual trigger only';
      case 'daily':
        return `Daily at ${automation.schedule_config?.time || '09:00'}`;
      case 'weekly':
        const day = DAYS_OF_WEEK.find(d => d.value === String(automation.schedule_config?.day_of_week));
        return `Weekly on ${day?.label || 'Sunday'} at ${automation.schedule_config?.time || '09:00'}`;
      case 'event_based':
        return `On ${automation.schedule_config?.event_trigger || 'practice_complete'}`;
      default:
        return 'Unknown schedule';
    }
  };

  const getTargetDescription = (automation: MIOReportAutomation): string => {
    switch (automation.target_type) {
      case 'individual':
        const count = automation.target_config?.user_ids?.length || 0;
        return `${count} specific user${count !== 1 ? 's' : ''}`;
      case 'auto_group':
        return `Auto: ${automation.target_config?.auto_group_type || 'by_pattern'}`;
      case 'custom_group':
        return 'Custom group';
      case 'all':
        return 'All users';
      default:
        return 'Unknown target';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Report Automations</h2>
          <p className="text-sm text-muted-foreground">
            Configure scheduled and triggered report generation
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchAutomations} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Automation
          </Button>
        </div>
      </div>

      {/* Automations List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : automations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No automations configured</h3>
            <p className="text-muted-foreground mb-4">
              Create an automation to schedule report generation
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Automation
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {automations.map((automation) => (
            <Card key={automation.id} className={!automation.is_active ? 'opacity-60' : ''}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{automation.name}</h3>
                      <Badge variant={automation.is_active ? 'default' : 'secondary'}>
                        {automation.is_active ? 'Active' : 'Paused'}
                      </Badge>
                      <Badge variant="outline">
                        {SCHEDULE_TYPE_CONFIG[automation.schedule_type].label}
                      </Badge>
                    </div>

                    {automation.description && (
                      <p className="text-sm text-muted-foreground mb-3">{automation.description}</p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {getTargetDescription(automation)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {getScheduleDescription(automation)}
                      </span>
                      {automation.last_run_at && (
                        <span className="flex items-center gap-1">
                          <Check className="h-4 w-4" />
                          Last run: {new Date(automation.last_run_at).toLocaleString()}
                          {automation.last_run_count && ` (${automation.last_run_count} reports)`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTriggerNow(automation)}
                      disabled={isProcessing || !automation.n8n_webhook_url}
                      title="Trigger now"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleActive(automation)}
                      title={automation.is_active ? 'Pause' : 'Activate'}
                    >
                      {automation.is_active ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(automation)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(automation.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={showCreateDialog || !!editingAutomation}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false);
            setEditingAutomation(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAutomation ? 'Edit Automation' : 'Create New Automation'}
            </DialogTitle>
            <DialogDescription>
              Configure report generation schedule and target users
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Automation Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Weekly Progress Reports"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What does this automation do?"
                rows={2}
              />
            </div>

            {/* Target Type */}
            <div className="space-y-2">
              <Label>Target Users</Label>
              <Select
                value={formData.target_type}
                onValueChange={(v) =>
                  setFormData({
                    ...formData,
                    target_type: v as AutomationFormData['target_type'],
                    target_config: {},
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TARGET_TYPE_CONFIG).map(([type, config]) => (
                    <SelectItem key={type} value={type}>
                      <div className="flex flex-col">
                        <span>{config.label}</span>
                        <span className="text-xs text-muted-foreground">{config.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Target Configuration */}
            <TargetUserPicker
              targetType={formData.target_type}
              targetConfig={formData.target_config}
              onChange={(config) => setFormData({ ...formData, target_config: config })}
              onUserCountChange={setUserCount}
            />

            {userCount !== null && (
              <div className="text-sm text-muted-foreground">
                Estimated target: <strong>{userCount}</strong> user{userCount !== 1 ? 's' : ''}
              </div>
            )}

            {/* Schedule Type */}
            <div className="space-y-2">
              <Label>Schedule</Label>
              <Select
                value={formData.schedule_type}
                onValueChange={(v) =>
                  setFormData({
                    ...formData,
                    schedule_type: v as AutomationFormData['schedule_type'],
                    schedule_config: { time: '09:00' },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SCHEDULE_TYPE_CONFIG).map(([type, config]) => (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        {React.cloneElement(config.icon as React.ReactElement, {
                          className: 'h-4 w-4',
                        })}
                        <div className="flex flex-col">
                          <span>{config.label}</span>
                          <span className="text-xs text-muted-foreground">{config.description}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Schedule Configuration */}
            {formData.schedule_type === 'daily' && (
              <div className="space-y-2">
                <Label>Time of Day</Label>
                <Input
                  type="time"
                  value={formData.schedule_config.time || '09:00'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      schedule_config: { ...formData.schedule_config, time: e.target.value },
                    })
                  }
                />
              </div>
            )}

            {formData.schedule_type === 'weekly' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Day of Week</Label>
                  <Select
                    value={String(formData.schedule_config.day_of_week || '0')}
                    onValueChange={(v) =>
                      setFormData({
                        ...formData,
                        schedule_config: {
                          ...formData.schedule_config,
                          day_of_week: parseInt(v, 10),
                        },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_WEEK.map((day) => (
                        <SelectItem key={day.value} value={day.value}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input
                    type="time"
                    value={formData.schedule_config.time || '09:00'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        schedule_config: { ...formData.schedule_config, time: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
            )}

            {formData.schedule_type === 'event_based' && (
              <div className="space-y-2">
                <Label>Event Trigger</Label>
                <Select
                  value={formData.schedule_config.event_trigger || 'practice_complete'}
                  onValueChange={(v) =>
                    setFormData({
                      ...formData,
                      schedule_config: { ...formData.schedule_config, event_trigger: v },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="practice_complete">Practice Complete</SelectItem>
                    <SelectItem value="streak_milestone">Streak Milestone (7, 14, 21, 30 days)</SelectItem>
                    <SelectItem value="week_complete">Week Complete</SelectItem>
                    <SelectItem value="dropout_risk_high">Dropout Risk High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* n8n Webhook URL */}
            <div className="space-y-2">
              <Label htmlFor="webhook">n8n Webhook URL</Label>
              <Input
                id="webhook"
                value={formData.n8n_webhook_url}
                onChange={(e) => setFormData({ ...formData, n8n_webhook_url: e.target.value })}
                placeholder="https://n8n-n8n.vq00fr.easypanel.host/webhook/..."
              />
              <p className="text-xs text-muted-foreground">
                The webhook URL from your MIO Report Generator workflow in n8n
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setEditingAutomation(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editingAutomation ? handleUpdate : handleCreate}
              disabled={isProcessing || !formData.name.trim()}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {editingAutomation ? 'Saving...' : 'Creating...'}
                </>
              ) : editingAutomation ? (
                'Save Changes'
              ) : (
                'Create Automation'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
