// ============================================================================
// PROPERTY TIMELINE COMPONENT
// ============================================================================
// Displays milestones, notes, and events for a property in a chronological
// timeline format. Supports adding new entries and editing existing ones.
// ============================================================================

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Clock,
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
  Home,
  Trophy,
  FileText,
  Wrench,
  DollarSign,
  Target,
  Star,
  Calendar,
} from 'lucide-react';
import type { PropertyTimelineEvent, TimelineEventType } from '@/types/property';

// ============================================================================
// TYPES
// ============================================================================

export interface PropertyTimelineProps {
  propertyId: string;
  events: PropertyTimelineEvent[];
  onAddEvent: (event: Omit<PropertyTimelineEvent, 'id' | 'property_id' | 'created_at'>) => Promise<void>;
  onUpdateEvent: (eventId: string, data: Partial<PropertyTimelineEvent>) => Promise<void>;
  onDeleteEvent: (eventId: string) => Promise<void>;
  isLoading?: boolean;
  isReadOnly?: boolean;
  className?: string;
}

interface EventFormData {
  event_date: string;
  event_type: TimelineEventType;
  title: string;
  description: string;
  amount?: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const EVENT_TYPES: { value: TimelineEventType; label: string; icon: React.ReactNode; color: string }[] = [
  {
    value: 'milestone',
    label: 'Milestone',
    icon: <Trophy className="h-4 w-4" />,
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
  },
  {
    value: 'note',
    label: 'Note',
    icon: <FileText className="h-4 w-4" />,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
  },
  {
    value: 'goal',
    label: 'Goal',
    icon: <Target className="h-4 w-4" />,
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
  },
  {
    value: 'maintenance',
    label: 'Maintenance',
    icon: <Wrench className="h-4 w-4" />,
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
  },
  {
    value: 'expense',
    label: 'Expense',
    icon: <DollarSign className="h-4 w-4" />,
    color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getEventTypeConfig(type: TimelineEventType) {
  return EVENT_TYPES.find((t) => t.value === type) || EVENT_TYPES[1];
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PropertyTimeline({
  propertyId,
  events,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  isLoading = false,
  isReadOnly = false,
  className = '',
}: PropertyTimelineProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<PropertyTimelineEvent | null>(null);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<EventFormData>({
    event_date: getTodayString(),
    event_type: 'note',
    title: '',
    description: '',
    amount: undefined,
  });

  // Sort events by date (newest first)
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
  );

  // Group events by month
  const groupedEvents = sortedEvents.reduce((groups, event) => {
    const date = new Date(event.event_date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });

    if (!groups[monthKey]) {
      groups[monthKey] = { label: monthLabel, events: [] };
    }
    groups[monthKey].events.push(event);
    return groups;
  }, {} as Record<string, { label: string; events: PropertyTimelineEvent[] }>);

  // Open add dialog
  const handleOpenAdd = () => {
    setEditingEvent(null);
    setFormData({
      event_date: getTodayString(),
      event_type: 'note',
      title: '',
      description: '',
      amount: undefined,
    });
    setShowAddDialog(true);
  };

  // Open edit dialog
  const handleOpenEdit = (event: PropertyTimelineEvent) => {
    setEditingEvent(event);
    setFormData({
      event_date: event.event_date,
      event_type: event.event_type,
      title: event.title,
      description: event.description || '',
      amount: event.amount,
    });
    setShowAddDialog(true);
  };

  // Handle save
  const handleSave = async () => {
    if (!formData.title) return;

    setIsSaving(true);
    try {
      if (editingEvent) {
        await onUpdateEvent(editingEvent.id, {
          event_date: formData.event_date,
          event_type: formData.event_type,
          title: formData.title,
          description: formData.description || undefined,
          amount: formData.amount,
        });
      } else {
        await onAddEvent({
          event_date: formData.event_date,
          event_type: formData.event_type,
          title: formData.title,
          description: formData.description || undefined,
          amount: formData.amount,
        });
      }
      setShowAddDialog(false);
    } catch (error) {
      console.error('Failed to save event:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deletingEventId) return;

    try {
      await onDeleteEvent(deletingEventId);
    } catch (error) {
      console.error('Failed to delete event:', error);
    } finally {
      setShowDeleteDialog(false);
      setDeletingEventId(null);
    }
  };

  // Confirm delete
  const confirmDelete = (eventId: string) => {
    setDeletingEventId(eventId);
    setShowDeleteDialog(true);
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Property Timeline
            </CardTitle>

            {!isReadOnly && (
              <Button size="sm" onClick={handleOpenAdd}>
                <Plus className="h-4 w-4 mr-1" />
                Add Entry
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading timeline...
            </div>
          ) : sortedEvents.length === 0 ? (
            <div className="py-8 text-center">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Timeline Entries</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Track milestones, notes, and events for this property.
              </p>
              {!isReadOnly && (
                <Button variant="outline" onClick={handleOpenAdd}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add First Entry
                </Button>
              )}
            </div>
          ) : (
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

              {/* Events by Month */}
              {Object.entries(groupedEvents).map(([monthKey, { label, events }]) => (
                <div key={monthKey} className="mb-6 last:mb-0">
                  {/* Month Label */}
                  <div className="flex items-center gap-2 mb-4 pl-8">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">
                      {label}
                    </span>
                  </div>

                  {/* Events */}
                  <div className="space-y-4">
                    {events.map((event) => {
                      const config = getEventTypeConfig(event.event_type);
                      return (
                        <div key={event.id} className="relative pl-10">
                          {/* Timeline Dot */}
                          <div
                            className={`absolute left-2.5 w-3 h-3 rounded-full border-2 border-background ${
                              event.event_type === 'milestone'
                                ? 'bg-yellow-500'
                                : event.event_type === 'goal'
                                ? 'bg-purple-500'
                                : event.event_type === 'maintenance'
                                ? 'bg-orange-500'
                                : event.event_type === 'expense'
                                ? 'bg-red-500'
                                : 'bg-blue-500'
                            }`}
                          />

                          {/* Event Card */}
                          <div className="bg-muted/30 rounded-lg p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge className={config.color}>
                                    {config.icon}
                                    <span className="ml-1">{config.label}</span>
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(event.event_date)}
                                  </span>
                                </div>
                                <h4 className="font-medium">{event.title}</h4>
                                {event.description && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {event.description}
                                  </p>
                                )}
                                {event.amount !== undefined && event.amount > 0 && (
                                  <p className="text-sm font-medium text-primary mt-1">
                                    {formatCurrency(event.amount)}
                                  </p>
                                )}
                              </div>

                              {!isReadOnly && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 shrink-0"
                                    >
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => handleOpenEdit(event)}
                                    >
                                      <Edit2 className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => confirmDelete(event.id)}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? 'Edit Timeline Entry' : 'Add Timeline Entry'}
            </DialogTitle>
            <DialogDescription>
              Record a milestone, note, or event for this property.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={formData.event_date}
                  onChange={(e) =>
                    setFormData({ ...formData, event_date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={formData.event_type}
                  onValueChange={(v) =>
                    setFormData({
                      ...formData,
                      event_type: v as TimelineEventType,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <span className="flex items-center gap-2">
                          {type.icon}
                          {type.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="What happened?"
              />
            </div>

            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Add more details..."
                rows={3}
              />
            </div>

            {(formData.event_type === 'expense' ||
              formData.event_type === 'maintenance') && (
              <div className="space-y-2">
                <Label>Amount ($)</Label>
                <Input
                  type="number"
                  value={formData.amount || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      amount: parseInt(e.target.value) || undefined,
                    })
                  }
                  placeholder="0"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddDialog(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !formData.title}>
              {isSaving ? 'Saving...' : editingEvent ? 'Save Changes' : 'Add Entry'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Timeline Entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this entry from the timeline.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default PropertyTimeline;
