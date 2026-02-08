import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Settings,
  Save,
  Loader2,
  RefreshCw,
  Zap,
  MessageSquare,
  Clock,
  Bell
} from 'lucide-react';
import {
  useAutomationConfig,
  useUpdateAutomationConfig,
  AutomationConfig
} from '@/hooks/useCoachDashboard';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const DEFAULT_CONFIG: AutomationConfig = {
  auto_nudge_enabled: false,
  nudge_thresholds: {
    day_3: true,
    day_7: true,
    day_14: true,
    day_30: true,
  },
  preferred_channel: 'sms',
  nudge_templates: {
    day_3: "Hey {first_name}! Just checking in - it's been 3 days since your last progress. Ready to continue your group home journey?",
    day_7: "Hi {first_name}, haven't seen you in a week! Your group home goals are waiting. What's holding you back?",
    day_14: "Hey {first_name}, it's been 2 weeks! Let's get you back on track. Reply or book a quick call?",
    day_30: "{first_name}, it's been a month. No judgment - life happens! When you're ready, your course is here. Book a call if you need support.",
  },
  quiet_hours: {
    enabled: true,
    start: '21:00',
    end: '09:00',
  },
};

export const AutomationConfigPanel = () => {
  const { toast } = useToast();
  const { data: savedConfig, isLoading, refetch, isRefetching } = useAutomationConfig();
  const updateMutation = useUpdateAutomationConfig();

  const [config, setConfig] = useState<AutomationConfig>(DEFAULT_CONFIG);
  const [hasChanges, setHasChanges] = useState(false);

  // Load saved config when available
  useEffect(() => {
    if (savedConfig) {
      setConfig(savedConfig);
      setHasChanges(false);
    }
  }, [savedConfig]);

  const handleChange = <K extends keyof AutomationConfig>(
    key: K,
    value: AutomationConfig[K]
  ) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleThresholdChange = (threshold: keyof AutomationConfig['nudge_thresholds'], enabled: boolean) => {
    setConfig(prev => ({
      ...prev,
      nudge_thresholds: {
        ...prev.nudge_thresholds,
        [threshold]: enabled,
      }
    }));
    setHasChanges(true);
  };

  const handleTemplateChange = (threshold: keyof AutomationConfig['nudge_templates'], message: string) => {
    setConfig(prev => ({
      ...prev,
      nudge_templates: {
        ...prev.nudge_templates,
        [threshold]: message,
      }
    }));
    setHasChanges(true);
  };

  const handleQuietHoursChange = <K extends keyof AutomationConfig['quiet_hours']>(
    key: K,
    value: AutomationConfig['quiet_hours'][K]
  ) => {
    setConfig(prev => ({
      ...prev,
      quiet_hours: {
        ...prev.quiet_hours,
        [key]: value,
      }
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync(config);
      setHasChanges(false);
      toast({
        title: 'Configuration saved',
        description: 'Automation settings have been updated.',
      });
    } catch (error) {
      toast({
        title: 'Failed to save',
        description: 'Please try again or contact support.',
        variant: 'destructive',
      });
    }
  };

  const thresholds = [
    { key: 'day_3' as const, label: '3-Day Nudge', days: 3 },
    { key: 'day_7' as const, label: '7-Day Nudge', days: 7 },
    { key: 'day_14' as const, label: '14-Day Nudge', days: 14 },
    { key: 'day_30' as const, label: '30-Day Nudge', days: 30 },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            <div>
              <CardTitle className="text-lg">Automation Settings</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Configure automatic nudge messages for stuck users
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
            >
              <RefreshCw className={cn("w-4 h-4", isRefetching && "animate-spin")} />
            </Button>
            {hasChanges && (
              <Button
                size="sm"
                onClick={handleSave}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Master Toggle */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Zap className={cn(
                  "w-5 h-5",
                  config.auto_nudge_enabled ? "text-primary" : "text-muted-foreground"
                )} />
                <div>
                  <Label className="text-sm font-medium">Auto-Nudge</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically send nudge messages to stuck users
                  </p>
                </div>
              </div>
              <Switch
                checked={config.auto_nudge_enabled}
                onCheckedChange={(checked) => handleChange('auto_nudge_enabled', checked)}
              />
            </div>

            <Separator />

            {/* Threshold Toggles */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Nudge Thresholds</Label>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {thresholds.map(({ key, label }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <span className="text-sm">{label}</span>
                    <Switch
                      checked={config.nudge_thresholds[key]}
                      onCheckedChange={(checked) => handleThresholdChange(key, checked)}
                      disabled={!config.auto_nudge_enabled}
                    />
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Channel Selection */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Preferred Channel</Label>
              </div>
              <Select
                value={config.preferred_channel}
                onValueChange={(value) => handleChange('preferred_channel', value as 'sms' | 'email' | 'both')}
                disabled={!config.auto_nudge_enabled}
              >
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sms">SMS Only</SelectItem>
                  <SelectItem value="email">Email Only</SelectItem>
                  <SelectItem value="both">SMS + Email</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Quiet Hours */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Quiet Hours</Label>
                </div>
                <Switch
                  checked={config.quiet_hours.enabled}
                  onCheckedChange={(checked) => handleQuietHoursChange('enabled', checked)}
                  disabled={!config.auto_nudge_enabled}
                />
              </div>
              {config.quiet_hours.enabled && (
                <div className="flex items-center gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Start</Label>
                    <Input
                      type="time"
                      value={config.quiet_hours.start}
                      onChange={(e) => handleQuietHoursChange('start', e.target.value)}
                      className="w-32"
                      disabled={!config.auto_nudge_enabled}
                    />
                  </div>
                  <span className="text-muted-foreground pt-5">to</span>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">End</Label>
                    <Input
                      type="time"
                      value={config.quiet_hours.end}
                      onChange={(e) => handleQuietHoursChange('end', e.target.value)}
                      className="w-32"
                      disabled={!config.auto_nudge_enabled}
                    />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Message Templates */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Message Templates</Label>
              <p className="text-xs text-muted-foreground">
                Use {'{first_name}'} to personalize messages
              </p>
              <div className="space-y-4">
                {thresholds.map(({ key, label, days }) => (
                  <div key={key} className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      {label} ({days} days inactive)
                    </Label>
                    <Textarea
                      value={config.nudge_templates[key]}
                      onChange={(e) => handleTemplateChange(key, e.target.value)}
                      placeholder={`Message for ${days}-day nudge...`}
                      rows={2}
                      className="text-sm resize-none"
                      disabled={!config.auto_nudge_enabled || !config.nudge_thresholds[key]}
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AutomationConfigPanel;
