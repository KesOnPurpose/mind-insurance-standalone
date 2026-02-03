import { useState, useEffect, useMemo, useRef } from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TimeSlot, ActivityType, DayOfWeek } from '@/types/modelWeek';
import { ACTIVITY_TYPES, getActivityConfig, getTextColor, COLOR_SWATCHES } from '@/config/activityTypes';
import { TacticLinkSection } from './TacticLinkSection';
import { useModelWeek } from '@/hooks/useModelWeek';
import { useAuth } from '@/contexts/AuthContext';

// Common time slots for quick selection (15-minute intervals from 5AM to 11PM)
const TIME_OPTIONS = Array.from({ length: 73 }, (_, i) => {
  const totalMinutes = 5 * 60 + i * 15; // Start at 5:00 AM
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const time24 = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const time12 = `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
  return { value: time24, label: time12 };
});

// Convert 24h time to 12h display format
const formatTo12Hour = (time24: string): string => {
  const [hours, mins] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
};

// Parse 12h time to 24h format
const parseTo24Hour = (time12: string): string | null => {
  const match = time12.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const mins = parseInt(match[2], 10);
  const period = match[3]?.toUpperCase();

  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  if (hours > 23 || mins > 59) return null;

  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

export interface EventEditData {
  id: string | null; // null means new event
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  title?: string;
  tacticId?: string;
  tacticName?: string;
  notes?: string;
  activityType?: ActivityType;
  customColor?: string;
}

interface EventEditModalProps {
  open: boolean;
  onClose: () => void;
  event: EventEditData | null;
  onSave: (slot: TimeSlot, dayOfWeek: DayOfWeek) => void;
  onDelete: (slotId: string, dayOfWeek: DayOfWeek) => void;
}

export function EventEditModal({
  open,
  onClose,
  event,
  onSave,
  onDelete,
}: EventEditModalProps) {
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [notes, setNotes] = useState('');
  const [activityType, setActivityType] = useState<ActivityType>('work');
  const [customColor, setCustomColor] = useState('#8B5CF6');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Time picker states
  const [startTimeInput, setStartTimeInput] = useState('9:00 AM');
  const [endTimeInput, setEndTimeInput] = useState('10:00 AM');
  const [showStartTimeDropdown, setShowStartTimeDropdown] = useState(false);
  const [showEndTimeDropdown, setShowEndTimeDropdown] = useState(false);

  // Tactic linking state
  const [linkedTacticId, setLinkedTacticId] = useState<string | null>(null);
  const [linkedTacticName, setLinkedTacticName] = useState<string | null>(null);

  const { user } = useAuth();
  const { modelWeek } = useModelWeek(user?.id || 'guest');

  const isDesktop = useMediaQuery('(min-width: 768px)');
  const isNewEvent = !event?.id;

  // Handle time input changes
  const handleStartTimeInputChange = (value: string) => {
    setStartTimeInput(value);
    const parsed = parseTo24Hour(value);
    if (parsed) setStartTime(parsed);
  };

  const handleEndTimeInputChange = (value: string) => {
    setEndTimeInput(value);
    const parsed = parseTo24Hour(value);
    if (parsed) setEndTime(parsed);
  };

  const handleStartTimeSelect = (time24: string) => {
    setStartTime(time24);
    setStartTimeInput(formatTo12Hour(time24));
    setShowStartTimeDropdown(false);
  };

  const handleEndTimeSelect = (time24: string) => {
    setEndTime(time24);
    setEndTimeInput(formatTo12Hour(time24));
    setShowEndTimeDropdown(false);
  };

  // Get all existing tactic IDs for duplicate warning
  const existingTacticIds = useMemo(() => {
    if (!modelWeek) return [];
    const ids: string[] = [];
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
    days.forEach((day) => {
      const daySlots = modelWeek[day] || [];
      daySlots.forEach((slot) => {
        if (slot.tacticId) {
          ids.push(slot.tacticId);
        }
      });
    });
    return ids;
  }, [modelWeek]);

  // Reset form when event changes
  useEffect(() => {
    if (event) {
      setTitle(event.title || event.tacticName || '');
      const eventStartTime = event.startTime || '09:00';
      const eventEndTime = event.endTime || '10:00';
      setStartTime(eventStartTime);
      setEndTime(eventEndTime);
      setStartTimeInput(formatTo12Hour(eventStartTime));
      setEndTimeInput(formatTo12Hour(eventEndTime));
      setNotes(event.notes || '');
      setActivityType(event.activityType || 'work');
      setCustomColor(event.customColor || '#8B5CF6');
      setLinkedTacticId(event.tacticId || null);
      setLinkedTacticName(event.tacticName || null);
    }
  }, [event]);

  // Handle tactic selection - auto-fills fields
  const handleTacticSelect = (tacticId: string, tacticName: string, durationMinutes: number | null) => {
    setLinkedTacticId(tacticId);
    setLinkedTacticName(tacticName);
    setActivityType('tactic');
    setTitle(tacticName);

    // Auto-calculate end time based on tactic duration
    if (durationMinutes && startTime) {
      const [hours, mins] = startTime.split(':').map(Number);
      const totalMins = hours * 60 + mins + durationMinutes;
      const endHours = Math.floor(totalMins / 60) % 24;
      const endMins = totalMins % 60;
      const newEndTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
      setEndTime(newEndTime);
      setEndTimeInput(formatTo12Hour(newEndTime));
    }
  };

  // Handle clearing tactic link
  const handleClearTactic = () => {
    setLinkedTacticId(null);
    setLinkedTacticName(null);
  };

  const handleSave = () => {
    if (!event) return;

    const slot: TimeSlot = {
      id: event.id || `${event.dayOfWeek}-${Date.now()}`,
      startTime,
      endTime,
      title: title || undefined,
      tacticId: linkedTacticId || undefined,
      tacticName: linkedTacticName || undefined,
      notes: notes || undefined,
      activityType,
      customColor: activityType === 'custom' ? customColor : undefined,
    };

    onSave(slot, event.dayOfWeek);
    onClose();
  };

  const handleDelete = () => {
    if (event?.id) {
      onDelete(event.id, event.dayOfWeek);
      onClose();
    }
    setShowDeleteConfirm(false);
  };

  const selectedConfig = getActivityConfig(activityType);
  const displayColor = activityType === 'custom' ? customColor : selectedConfig.color;

  // Form content JSX - shared between Dialog and Drawer
  // NOTE: This is JSX, not a component, to prevent re-mounting on state changes
  // Added px-1 to give focus rings room to render without being clipped
  const formContent = (
    <div className="space-y-3 md:space-y-4 px-1">
      {/* Title Input */}
      <div className="space-y-1.5">
        <Label htmlFor="event-title" className="text-sm font-medium">Title (optional)</Label>
        <Input
          id="event-title"
          placeholder="e.g., Morning Focus Session"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-10"
          autoComplete="off"
        />
      </div>

      {/* Link Mentorship Tactic Section */}
      <TacticLinkSection
        selectedTacticId={linkedTacticId}
        selectedTacticName={linkedTacticName}
        onSelectTactic={handleTacticSelect}
        onClearTactic={handleClearTactic}
        existingTacticIds={existingTacticIds}
      />

      {/* Time Inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Start Time</Label>
          <Popover open={showStartTimeDropdown} onOpenChange={setShowStartTimeDropdown}>
            <PopoverTrigger asChild>
              <div className="relative">
                <Input
                  type="text"
                  value={startTimeInput}
                  onChange={(e) => handleStartTimeInputChange(e.target.value)}
                  onFocus={() => setShowStartTimeDropdown(true)}
                  placeholder="9:00 AM"
                  className="h-10 pr-8"
                />
                <button
                  type="button"
                  onClick={() => setShowStartTimeDropdown(!showStartTimeDropdown)}
                  className="absolute right-0 top-0 h-full px-2 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronDown className={cn("h-4 w-4 transition-transform", showStartTimeDropdown && "rotate-180")} />
                </button>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-[140px] p-0 max-h-[250px] overflow-y-auto" align="start">
              <div className="p-1">
                {TIME_OPTIONS.map((time) => (
                  <button
                    key={time.value}
                    type="button"
                    onClick={() => handleStartTimeSelect(time.value)}
                    className={cn(
                      "w-full px-2 py-1.5 text-sm text-left rounded hover:bg-muted transition-colors",
                      startTime === time.value && "bg-primary/10 text-primary font-medium"
                    )}
                  >
                    {time.label}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">End Time</Label>
          <Popover open={showEndTimeDropdown} onOpenChange={setShowEndTimeDropdown}>
            <PopoverTrigger asChild>
              <div className="relative">
                <Input
                  type="text"
                  value={endTimeInput}
                  onChange={(e) => handleEndTimeInputChange(e.target.value)}
                  onFocus={() => setShowEndTimeDropdown(true)}
                  placeholder="10:00 AM"
                  className="h-10 pr-8"
                />
                <button
                  type="button"
                  onClick={() => setShowEndTimeDropdown(!showEndTimeDropdown)}
                  className="absolute right-0 top-0 h-full px-2 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronDown className={cn("h-4 w-4 transition-transform", showEndTimeDropdown && "rotate-180")} />
                </button>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-[140px] p-0 max-h-[250px] overflow-y-auto" align="start">
              <div className="p-1">
                {TIME_OPTIONS.map((time) => (
                  <button
                    key={time.value}
                    type="button"
                    onClick={() => handleEndTimeSelect(time.value)}
                    className={cn(
                      "w-full px-2 py-1.5 text-sm text-left rounded hover:bg-muted transition-colors",
                      endTime === time.value && "bg-primary/10 text-primary font-medium"
                    )}
                  >
                    {time.label}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Activity Type Grid - Responsive 4 columns */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Activity Type</Label>
        <div className="grid grid-cols-4 gap-1.5 md:gap-2">
          {ACTIVITY_TYPES.map((activity) => {
            const isSelected = activityType === activity.type;
            const textColor = getTextColor(activity.color);

            return (
              <button
                key={activity.type}
                type="button"
                onClick={() => setActivityType(activity.type)}
                className={cn(
                  'flex flex-col items-center justify-center p-1 md:p-2 rounded-lg border-2 transition-all',
                  'hover:scale-[1.02] active:scale-[0.98] touch-manipulation',
                  'min-h-[48px] md:min-h-[60px]',
                  isSelected
                    ? 'border-primary ring-1 md:ring-2 ring-primary ring-offset-1'
                    : 'border-transparent'
                )}
                style={{
                  backgroundColor: activity.color,
                  color: textColor,
                }}
              >
                <span className="text-sm md:text-lg leading-none">{activity.emoji}</span>
                <span className="text-[7px] md:text-[9px] font-medium truncate w-full text-center leading-tight mt-0.5">
                  {activity.label.split('/')[0].split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Color Picker (shown only when custom is selected) */}
      {activityType === 'custom' && (
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Custom Color</Label>
          <div className="flex flex-wrap gap-1.5">
            {COLOR_SWATCHES.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setCustomColor(color)}
                className={cn(
                  'w-7 h-7 md:w-8 md:h-8 rounded-lg border-2 transition-all active:scale-95 touch-manipulation',
                  customColor === color
                    ? 'border-primary ring-2 ring-primary ring-offset-1'
                    : 'border-gray-200 dark:border-gray-700'
                )}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
            <div className="flex items-center gap-1.5 ml-1">
              <Input
                type="color"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="w-8 h-7 md:w-9 md:h-8 p-0 border-0 cursor-pointer"
              />
              <Input
                type="text"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                placeholder="#HEX"
                className="w-16 md:w-20 h-7 md:h-8 text-xs px-2"
                autoComplete="off"
              />
            </div>
          </div>
        </div>
      )}

      {/* Color Preview - Compact */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Preview</Label>
        <div
          className="p-2.5 rounded-lg border flex items-center gap-2"
          style={{
            backgroundColor: displayColor,
            borderColor: selectedConfig.borderColor,
            color: getTextColor(displayColor),
          }}
        >
          <span className="text-lg">{selectedConfig.emoji}</span>
          <div className="min-w-0 flex-1">
            <div className="font-medium text-sm truncate">
              {title || selectedConfig.label}
            </div>
            <div className="text-xs opacity-80">
              {startTime} - {endTime}
            </div>
          </div>
        </div>
      </div>

      {/* Notes - Compact */}
      <div className="space-y-1.5">
        <Label htmlFor="event-notes" className="text-sm font-medium">Notes (optional)</Label>
        <Textarea
          id="event-notes"
          placeholder="Add any additional notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="resize-none text-sm"
        />
      </div>
    </div>
  );

  // Delete confirmation alert - shared
  const DeleteAlert = () => (
    <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" className="flex-shrink-0 h-9">
          <Trash2 className="h-4 w-4 md:mr-1.5" />
          <span className="hidden md:inline text-sm">Delete</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this time block?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  // Desktop: Use Dialog
  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[440px] max-h-[85dvh] overflow-y-auto flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0">
            <DialogTitle>{isNewEvent ? 'Create Time Block' : 'Edit Time Block'}</DialogTitle>
            <DialogDescription>
              {isNewEvent
                ? 'Add a new time block to your schedule'
                : 'Update the details of this time block'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="px-5 pb-4">
              {formContent}
            </div>
          </div>
          <DialogFooter className="px-6 py-4 border-t bg-muted/30 flex-shrink-0">
            <div className="flex w-full justify-between items-center">
              {!isNewEvent ? <DeleteAlert /> : <div />}
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose} size="sm" className="h-9">
                  Cancel
                </Button>
                <Button onClick={handleSave} size="sm" className="h-9">
                  {isNewEvent ? 'Create' : 'Save'}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Mobile: Use Drawer (slides up from bottom) - optimized for touch
  return (
    <Drawer open={open} onOpenChange={onClose}>
      <DrawerContent className="max-h-[85vh] flex flex-col">
        <DrawerHeader className="text-left pb-2 px-4 flex-shrink-0">
          <DrawerTitle className="text-lg">{isNewEvent ? 'Create Time Block' : 'Edit Time Block'}</DrawerTitle>
          <DrawerDescription className="text-sm">
            {isNewEvent ? 'Add a new time block' : 'Update time block details'}
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto min-h-0 px-4 pb-2">
          {formContent}
        </div>
        <DrawerFooter className="pt-3 pb-6 border-t bg-muted/30 flex-shrink-0">
          <div className="flex w-full justify-between items-center gap-2">
            {!isNewEvent ? <DeleteAlert /> : <div />}
            <div className="flex gap-2">
              <DrawerClose asChild>
                <Button variant="outline" size="sm" className="h-10 px-4 touch-manipulation">
                  Cancel
                </Button>
              </DrawerClose>
              <Button onClick={handleSave} size="sm" className="h-10 px-4 touch-manipulation">
                {isNewEvent ? 'Create' : 'Save'}
              </Button>
            </div>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
