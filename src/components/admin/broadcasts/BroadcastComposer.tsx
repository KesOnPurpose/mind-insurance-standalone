// =============================================================================
// BROADCAST COMPOSER
// Admin component for creating and editing notification broadcasts
// =============================================================================

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  Send,
  Save,
  X,
  Image,
  Video,
  Link as LinkIcon,
  Users,
  Globe,
  UserCheck,
  User,
  Clock,
  AlertTriangle,
  AlertCircle,
  Info,
  Eye,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  createBroadcast,
  updateBroadcast,
  submitForApproval,
  sendBroadcast,
  getGroups,
} from '@/services/broadcastService';
import {
  CreateBroadcastInput,
  MediaType,
  TargetType,
  DisplayMode,
  BroadcastPriority,
  NotificationBroadcast,
  UserNotificationGroup,
  ALLOWED_DOMAINS,
  isAllowedUrl,
  PRIORITY_CONFIG,
} from '@/types/broadcast';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface BroadcastComposerProps {
  broadcast?: NotificationBroadcast;
  onSave?: (broadcast: NotificationBroadcast) => void;
  onCancel?: () => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function BroadcastComposer({
  broadcast,
  onSave,
  onCancel,
  isOpen,
  onOpenChange,
}: BroadcastComposerProps) {
  const { user } = useAuth();
  const isEditing = !!broadcast;

  // Form state
  const [title, setTitle] = useState(broadcast?.title || '');
  const [message, setMessage] = useState(broadcast?.message || '');
  const [mediaType, setMediaType] = useState<MediaType | null>(broadcast?.media_type || null);
  const [mediaUrl, setMediaUrl] = useState(broadcast?.media_url || '');
  const [actionUrl, setActionUrl] = useState(broadcast?.action_url || '');
  const [actionLabel, setActionLabel] = useState(broadcast?.action_label || '');
  const [targetType, setTargetType] = useState<TargetType>(broadcast?.target_type || 'global');
  const [targetGroupId, setTargetGroupId] = useState(broadcast?.target_group_id || '');
  const [targetTier, setTargetTier] = useState(broadcast?.target_tier || '');
  const [scheduledFor, setScheduledFor] = useState(broadcast?.scheduled_for || '');
  const [expiresAt, setExpiresAt] = useState(broadcast?.expires_at || '');
  const [displayMode, setDisplayMode] = useState<DisplayMode>(broadcast?.display_mode || 'popup');
  const [priority, setPriority] = useState<BroadcastPriority>(broadcast?.priority || 'normal');
  const [dismissible, setDismissible] = useState(broadcast?.dismissible ?? true);
  const [requireAcknowledgment, setRequireAcknowledgment] = useState(
    broadcast?.require_acknowledgment ?? false
  );

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [groups, setGroups] = useState<UserNotificationGroup[]>([]);
  const [activeTab, setActiveTab] = useState('content');
  const [showPreview, setShowPreview] = useState(false);

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch groups
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const { data, error } = await getGroups();
        if (error) {
          throw error;
        }
        setGroups(data || []);
      } catch (error) {
        console.error('Error fetching groups:', error);
      }
    };
    fetchGroups();
  }, []);

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.length > 100) {
      newErrors.title = 'Title must be 100 characters or less';
    }

    if (!message.trim()) {
      newErrors.message = 'Message is required';
    } else if (message.length > 1000) {
      newErrors.message = 'Message must be 1000 characters or less';
    }

    if (mediaUrl && !isAllowedUrl(mediaUrl)) {
      newErrors.mediaUrl = `URL must be from an allowed domain: ${ALLOWED_DOMAINS.join(', ')}`;
    }

    if (actionUrl && !isAllowedUrl(actionUrl)) {
      newErrors.actionUrl = `URL must be from an allowed domain: ${ALLOWED_DOMAINS.join(', ')}`;
    }

    if (targetType === 'group' && !targetGroupId) {
      newErrors.targetGroupId = 'Please select a group';
    }

    if (targetType === 'tier' && !targetTier) {
      newErrors.targetTier = 'Please select a tier';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Build input data
  const buildInput = (): CreateBroadcastInput => ({
    title: title.trim(),
    message: message.trim(),
    media_type: mediaType || undefined,
    media_url: mediaUrl || undefined,
    action_url: actionUrl || undefined,
    action_label: actionLabel || undefined,
    target_type: targetType,
    target_group_id: targetType === 'group' ? targetGroupId : undefined,
    target_tier: targetType === 'tier' ? targetTier : undefined,
    scheduled_for: scheduledFor || undefined,
    expires_at: expiresAt || undefined,
    display_mode: displayMode,
    priority,
    dismissible,
    require_acknowledgment: requireAcknowledgment,
  });

  // Save as draft
  const handleSaveDraft = async () => {
    if (!validate()) return;

    setIsSaving(true);
    try {
      if (isEditing && broadcast) {
        const { data: updated, error } = await updateBroadcast({ id: broadcast.id, ...buildInput() });
        if (error || !updated) {
          throw error || new Error('Failed to update broadcast');
        }
        toast.success('Broadcast updated');
        onSave?.(updated);
      } else {
        const { data: created, error } = await createBroadcast(buildInput());
        if (error || !created) {
          throw error || new Error('Failed to create broadcast');
        }
        toast.success('Broadcast saved as draft');
        onSave?.(created);
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving broadcast:', error);
      toast.error('Failed to save broadcast');
    } finally {
      setIsSaving(false);
    }
  };

  // Submit for approval or send directly
  const handleSend = async () => {
    if (!validate()) return;

    setIsSending(true);
    try {
      let broadcastToSend: NotificationBroadcast;

      if (isEditing && broadcast) {
        const { data: updated, error } = await updateBroadcast({ id: broadcast.id, ...buildInput() });
        if (error || !updated) {
          throw error || new Error('Failed to update broadcast');
        }
        broadcastToSend = updated;
      } else {
        const { data: created, error } = await createBroadcast(buildInput());
        if (error || !created) {
          throw error || new Error('Failed to create broadcast');
        }
        broadcastToSend = created;
      }

      // Global broadcasts need approval
      if (targetType === 'global') {
        const { error: approvalError } = await submitForApproval(broadcastToSend.id);
        if (approvalError) {
          throw approvalError;
        }
        toast.success('Broadcast submitted for approval');
      } else {
        const { success, error: sendError } = await sendBroadcast(broadcastToSend.id);
        if (sendError || !success) {
          throw sendError || new Error('Failed to send broadcast');
        }
        toast.success('Broadcast sent successfully');
      }

      onSave?.(broadcastToSend);
      onOpenChange(false);
    } catch (error) {
      console.error('Error sending broadcast:', error);
      toast.error('Failed to send broadcast');
    } finally {
      setIsSending(false);
    }
  };

  // Priority config for display
  const priorityConfig = PRIORITY_CONFIG[priority];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-mi-cyan" />
            {isEditing ? 'Edit Broadcast' : 'Create Broadcast'}
          </DialogTitle>
          <DialogDescription>
            Compose a notification to send to users across the platform.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="targeting">Targeting</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto py-4">
            {/* Content Tab */}
            <TabsContent value="content" className="space-y-4 mt-0">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="Notification title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={cn(errors.title && 'border-red-500')}
                  maxLength={100}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  {errors.title && <span className="text-red-500">{errors.title}</span>}
                  <span className="ml-auto">{title.length}/100</span>
                </div>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message">
                  Message <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="message"
                  placeholder="Write your notification message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className={cn('min-h-[120px]', errors.message && 'border-red-500')}
                  maxLength={1000}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  {errors.message && <span className="text-red-500">{errors.message}</span>}
                  <span className="ml-auto">{message.length}/1000</span>
                </div>
              </div>

              {/* Media Type */}
              <div className="space-y-2">
                <Label>Media (Optional)</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={mediaType === 'image' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMediaType(mediaType === 'image' ? null : 'image')}
                  >
                    <Image className="h-4 w-4 mr-1" />
                    Image
                  </Button>
                  <Button
                    type="button"
                    variant={mediaType === 'video' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMediaType(mediaType === 'video' ? null : 'video')}
                  >
                    <Video className="h-4 w-4 mr-1" />
                    Video
                  </Button>
                  <Button
                    type="button"
                    variant={mediaType === 'link' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMediaType(mediaType === 'link' ? null : 'link')}
                  >
                    <LinkIcon className="h-4 w-4 mr-1" />
                    Link
                  </Button>
                </div>
              </div>

              {/* Media URL */}
              {mediaType && (
                <div className="space-y-2">
                  <Label htmlFor="mediaUrl">Media URL</Label>
                  <Input
                    id="mediaUrl"
                    placeholder={`Enter ${mediaType} URL...`}
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    className={cn(errors.mediaUrl && 'border-red-500')}
                  />
                  {errors.mediaUrl && (
                    <p className="text-xs text-red-500">{errors.mediaUrl}</p>
                  )}
                </div>
              )}

              {/* Action URL */}
              <div className="space-y-2">
                <Label htmlFor="actionUrl">Call-to-Action URL (Optional)</Label>
                <Input
                  id="actionUrl"
                  placeholder="https://purposewaze.com/..."
                  value={actionUrl}
                  onChange={(e) => setActionUrl(e.target.value)}
                  className={cn(errors.actionUrl && 'border-red-500')}
                />
                {errors.actionUrl && (
                  <p className="text-xs text-red-500">{errors.actionUrl}</p>
                )}
              </div>

              {/* Action Label */}
              {actionUrl && (
                <div className="space-y-2">
                  <Label htmlFor="actionLabel">Button Label</Label>
                  <Input
                    id="actionLabel"
                    placeholder="Learn More"
                    value={actionLabel}
                    onChange={(e) => setActionLabel(e.target.value)}
                    maxLength={30}
                  />
                </div>
              )}
            </TabsContent>

            {/* Targeting Tab */}
            <TabsContent value="targeting" className="space-y-4 mt-0">
              {/* Target Type */}
              <div className="space-y-2">
                <Label>Target Audience</Label>
                <div className="grid grid-cols-2 gap-4">
                  <TargetOption
                    icon={<Globe className="h-5 w-5" />}
                    label="All Users"
                    description="Send to everyone on the platform"
                    selected={targetType === 'global'}
                    onClick={() => setTargetType('global')}
                  />
                  <TargetOption
                    icon={<Users className="h-5 w-5" />}
                    label="Custom Group"
                    description="Send to a specific group"
                    selected={targetType === 'group'}
                    onClick={() => setTargetType('group')}
                  />
                  <TargetOption
                    icon={<UserCheck className="h-5 w-5" />}
                    label="By Tier"
                    description="Send to users by their tier"
                    selected={targetType === 'tier'}
                    onClick={() => setTargetType('tier')}
                  />
                  <TargetOption
                    icon={<User className="h-5 w-5" />}
                    label="Individual"
                    description="Send to specific users"
                    selected={targetType === 'individual'}
                    onClick={() => setTargetType('individual')}
                    disabled
                  />
                </div>
              </div>

              {/* Group Selection */}
              {targetType === 'group' && (
                <div className="space-y-2">
                  <Label>Select Group</Label>
                  <Select value={targetGroupId} onValueChange={setTargetGroupId}>
                    <SelectTrigger className={cn(errors.targetGroupId && 'border-red-500')}>
                      <SelectValue placeholder="Choose a group..." />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                          {group.member_count !== undefined && (
                            <span className="text-gray-500 ml-2">
                              ({group.member_count} members)
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.targetGroupId && (
                    <p className="text-xs text-red-500">{errors.targetGroupId}</p>
                  )}
                </div>
              )}

              {/* Tier Selection */}
              {targetType === 'tier' && (
                <div className="space-y-2">
                  <Label>Select Tier</Label>
                  <Select value={targetTier} onValueChange={setTargetTier}>
                    <SelectTrigger className={cn(errors.targetTier && 'border-red-500')}>
                      <SelectValue placeholder="Choose a tier..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Users</SelectItem>
                      <SelectItem value="coach">Coaches</SelectItem>
                      <SelectItem value="admin">Admins</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.targetTier && (
                    <p className="text-xs text-red-500">{errors.targetTier}</p>
                  )}
                </div>
              )}

              {/* Global broadcast warning */}
              {targetType === 'global' && (
                <Card className="border-amber-200 bg-amber-50">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-amber-800">Approval Required</p>
                        <p className="text-sm text-amber-700">
                          Global broadcasts require approval from a super admin before being sent.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Scheduling */}
              <div className="space-y-2">
                <Label htmlFor="scheduledFor">Schedule (Optional)</Label>
                <Input
                  id="scheduledFor"
                  type="datetime-local"
                  value={scheduledFor ? scheduledFor.slice(0, 16) : ''}
                  onChange={(e) =>
                    setScheduledFor(e.target.value ? new Date(e.target.value).toISOString() : '')
                  }
                />
                <p className="text-xs text-gray-500">
                  Leave empty to send immediately after approval
                </p>
              </div>

              {/* Expiration */}
              <div className="space-y-2">
                <Label htmlFor="expiresAt">Expires At (Optional)</Label>
                <Input
                  id="expiresAt"
                  type="datetime-local"
                  value={expiresAt ? expiresAt.slice(0, 16) : ''}
                  onChange={(e) =>
                    setExpiresAt(e.target.value ? new Date(e.target.value).toISOString() : '')
                  }
                />
                <p className="text-xs text-gray-500">
                  After this time, the notification will no longer be shown
                </p>
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4 mt-0">
              {/* Display Mode */}
              <div className="space-y-2">
                <Label>Display Mode</Label>
                <Select
                  value={displayMode}
                  onValueChange={(v) => setDisplayMode(v as DisplayMode)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popup">
                      <span className="flex items-center gap-2">
                        Popup Modal
                        <Badge variant="secondary" className="text-xs">
                          Recommended
                        </Badge>
                      </span>
                    </SelectItem>
                    <SelectItem value="banner">Banner (Top of screen)</SelectItem>
                    <SelectItem value="toast">Toast (Corner notification)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={priority}
                  onValueChange={(v) => setPriority(v as BroadcastPriority)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <span className={cn('flex items-center gap-2', config.color)}>
                          {config.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Higher priority notifications are shown first and have more prominent styling
                </p>
              </div>

              {/* Dismissible */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Dismiss</Label>
                  <p className="text-xs text-gray-500">
                    Users can close the notification without taking action
                  </p>
                </div>
                <Switch checked={dismissible} onCheckedChange={setDismissible} />
              </div>

              {/* Require Acknowledgment */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Acknowledgment</Label>
                  <p className="text-xs text-gray-500">
                    Users must click &quot;I Acknowledge&quot; to dismiss
                  </p>
                </div>
                <Switch
                  checked={requireAcknowledgment}
                  onCheckedChange={setRequireAcknowledgment}
                />
              </div>

              {/* Preview */}
              <Card className="bg-gray-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className={cn(
                      'rounded-lg p-4',
                      'bg-mi-navy/90 text-white',
                      'border',
                      priorityConfig.borderColor
                    )}
                  >
                    <Badge className={cn('mb-2', priorityConfig.bgColor, priorityConfig.color)}>
                      {priorityConfig.label}
                    </Badge>
                    <h4 className="font-semibold mb-1">{title || 'Notification Title'}</h4>
                    <p className="text-sm text-gray-300 line-clamp-2">
                      {message || 'Your notification message will appear here...'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving || isSending}>
            Cancel
          </Button>
          <Button variant="outline" onClick={handleSaveDraft} disabled={isSaving || isSending}>
            {isSaving ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Save className="h-4 w-4 mr-2" />
                </motion.div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </>
            )}
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSaving || isSending}
            className="bg-mi-cyan hover:bg-mi-cyan-dark"
          >
            {isSending ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Send className="h-4 w-4 mr-2" />
                </motion.div>
                {targetType === 'global' ? 'Submitting...' : 'Sending...'}
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                {targetType === 'global' ? 'Submit for Approval' : 'Send Now'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// -----------------------------------------------------------------------------
// Target Option Component
// -----------------------------------------------------------------------------

interface TargetOptionProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

function TargetOption({
  icon,
  label,
  description,
  selected,
  onClick,
  disabled,
}: TargetOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'p-4 rounded-lg border-2 text-left transition-all',
        selected
          ? 'border-mi-cyan bg-mi-cyan/5'
          : 'border-gray-200 hover:border-gray-300',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <div className={cn('mb-2', selected ? 'text-mi-cyan' : 'text-gray-500')}>{icon}</div>
      <p className="font-medium text-gray-900">{label}</p>
      <p className="text-xs text-gray-500">{description}</p>
      {disabled && <Badge variant="outline" className="mt-2 text-xs">Coming Soon</Badge>}
    </button>
  );
}

export default BroadcastComposer;
