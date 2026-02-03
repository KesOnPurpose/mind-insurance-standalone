import { useState, useMemo, useEffect } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Calendar, Clock, GraduationCap } from 'lucide-react';
import { useModelWeek } from '@/hooks/useModelWeek';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { TimeSlot, DayOfWeek, ModelWeek } from '@/types/modelWeek';
import { getActivityConfig, getTextColor } from '@/config/activityTypes';

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

export interface ScheduleTacticData {
  tacticId: string;
  tacticName: string;
  durationMinutes: number | null;
  category?: string;
}

interface QuickScheduleModalProps {
  open: boolean;
  onClose: () => void;
  tactic: ScheduleTacticData | null;
}

const DAY_OPTIONS: { value: DayOfWeek; label: string }[] = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
];

// Helper to convert time string to minutes from midnight
function timeToMinutes(time: string): number {
  const [hours, mins] = time.split(':').map(Number);
  return hours * 60 + mins;
}

// Helper to format minutes back to time string
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// Check if two time ranges overlap
function timesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  return s1 < e2 && s2 < e1;
}

export function QuickScheduleModal({
  open,
  onClose,
  tactic,
}: QuickScheduleModalProps) {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('monday');
  const [startTime, setStartTime] = useState('09:00');

  const { user } = useAuth();
  const { modelWeek, saveModelWeek } = useModelWeek(user?.id || 'guest');
  const { toast } = useToast();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [timeInputValue, setTimeInputValue] = useState('09:00 AM');

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

  // Sync display value when startTime changes
  useEffect(() => {
    setTimeInputValue(formatTo12Hour(startTime));
  }, [startTime]);

  // Handle time input change
  const handleTimeInputChange = (value: string) => {
    setTimeInputValue(value);
    const parsed = parseTo24Hour(value);
    if (parsed) {
      setStartTime(parsed);
    }
  };

  // Handle time selection from dropdown
  const handleTimeSelect = (time24: string) => {
    setStartTime(time24);
    setTimeInputValue(formatTo12Hour(time24));
    setShowTimeDropdown(false);
  };

  // Calculate end time based on tactic duration
  const endTime = useMemo(() => {
    if (!tactic?.durationMinutes) {
      // Default to 1 hour if no duration
      return minutesToTime(timeToMinutes(startTime) + 60);
    }
    return minutesToTime(timeToMinutes(startTime) + tactic.durationMinutes);
  }, [startTime, tactic?.durationMinutes]);

  // Get existing slots for selected day
  const existingSlots = useMemo(() => {
    if (!modelWeek) return [];
    return modelWeek[selectedDay] || [];
  }, [modelWeek, selectedDay]);

  // Check for overlaps with existing blocks
  const overlappingSlots = useMemo(() => {
    return existingSlots.filter((slot) =>
      timesOverlap(startTime, endTime, slot.startTime, slot.endTime)
    );
  }, [existingSlots, startTime, endTime]);

  const hasOverlap = overlappingSlots.length > 0;

  // Check if this tactic is already scheduled anywhere
  const existingSchedules = useMemo(() => {
    if (!modelWeek || !tactic) return [];
    const schedules: { day: DayOfWeek; time: string }[] = [];
    const days: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    days.forEach((day) => {
      const daySlots = modelWeek[day] || [];
      daySlots.forEach((slot) => {
        if (slot.tacticId === tactic.tacticId) {
          schedules.push({ day, time: `${slot.startTime} - ${slot.endTime}` });
        }
      });
    });

    return schedules;
  }, [modelWeek, tactic]);

  const isDuplicate = existingSchedules.length > 0;

  // Handle adding the tactic to schedule
  const handleSchedule = () => {
    if (!tactic || !modelWeek || hasOverlap) return;

    const newSlot: TimeSlot = {
      id: `${selectedDay}-${Date.now()}`,
      startTime,
      endTime,
      tacticId: tactic.tacticId,
      tacticName: tactic.tacticName,
      activityType: 'tactic',
      title: tactic.tacticName,
    };

    // Create updated model week
    const updatedWeek: ModelWeek = {
      ...modelWeek,
      [selectedDay]: [...(modelWeek[selectedDay] || []), newSlot],
    };

    saveModelWeek(updatedWeek);

    toast({
      title: 'Tactic Scheduled',
      description: `"${tactic.tacticName}" added to ${DAY_OPTIONS.find(d => d.value === selectedDay)?.label} at ${startTime}`,
    });

    onClose();
  };

  // Tactic config for preview
  const tacticConfig = getActivityConfig('tactic');

  // Form content shared between Dialog and Drawer
  const formContent = (
    <div className="space-y-4 px-1">
      {/* Tactic Info */}
      <div className="p-3 rounded-xl border bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50">
            <GraduationCap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm text-purple-900 dark:text-purple-100 line-clamp-2">
              {tactic?.tacticName}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              {tactic?.category && (
                <Badge variant="secondary" className="text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border-0">
                  {tactic.category}
                </Badge>
              )}
              {tactic?.durationMinutes && (
                <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400">
                  <Clock className="h-3.5 w-3.5" />
                  {tactic.durationMinutes} minutes
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Duplicate Warning */}
      {isDuplicate && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-700 dark:text-amber-300">
            <div className="font-medium">Already scheduled:</div>
            <ul className="mt-1 space-y-0.5">
              {existingSchedules.map((schedule, i) => (
                <li key={i} className="capitalize">
                  {schedule.day} ({schedule.time})
                </li>
              ))}
            </ul>
            <div className="mt-1 opacity-80">You can still add another session.</div>
          </div>
        </div>
      )}

      {/* Day Selector */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Day</Label>
        <Select value={selectedDay} onValueChange={(v) => setSelectedDay(v as DayOfWeek)}>
          <SelectTrigger className="h-11 rounded-lg">
            <SelectValue placeholder="Select day" />
          </SelectTrigger>
          <SelectContent>
            {DAY_OPTIONS.map((day) => (
              <SelectItem key={day.value} value={day.value}>
                {day.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Time Input - Select dropdown */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Start Time</Label>
        <Select value={startTime} onValueChange={handleTimeSelect}>
          <SelectTrigger className="h-11 rounded-lg">
            <SelectValue placeholder="Select time">{timeInputValue}</SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {TIME_OPTIONS.map((time) => (
              <SelectItem key={time.value} value={time.value}>
                {time.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Calculated End Time */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground">End Time (calculated)</Label>
        <div className="h-11 px-3 border rounded-lg bg-muted/50 flex items-center text-sm font-medium">
          {formatTo12Hour(endTime)}
        </div>
      </div>

      {/* Overlap Error */}
      {hasOverlap && (
        <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-800">
          <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-red-700 dark:text-red-300">
            <div className="font-medium">Time conflict!</div>
            <div className="mt-1">
              This overlaps with existing block(s):
              <ul className="mt-1 space-y-0.5">
                {overlappingSlots.map((slot) => (
                  <li key={slot.id}>
                    {slot.title || slot.tacticName || 'Untitled'} ({formatTo12Hour(slot.startTime)} - {formatTo12Hour(slot.endTime)})
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Preview */}
      {!hasOverlap && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Preview</Label>
          <div
            className="p-3 rounded-xl border-2 flex items-center gap-3"
            style={{
              backgroundColor: tacticConfig.color,
              borderColor: tacticConfig.borderColor,
              color: getTextColor(tacticConfig.color),
            }}
          >
            <span className="text-xl">{tacticConfig.emoji}</span>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm truncate">
                {tactic?.tacticName}
              </div>
              <div className="text-xs opacity-80 mt-0.5">
                {formatTo12Hour(startTime)} - {formatTo12Hour(endTime)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Desktop: Dialog
  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[420px] max-h-[85dvh] overflow-y-auto flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-3 border-b bg-muted/30 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50">
                <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <DialogTitle className="text-lg">Quick Schedule</DialogTitle>
                <DialogDescription className="text-sm">
                  Add this tactic to your Model Week
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="px-5 py-4">
              {formContent}
            </div>
          </div>
          <DialogFooter className="px-6 py-4 border-t bg-muted/30 flex-shrink-0">
            <Button variant="outline" onClick={onClose} className="h-10 px-5">
              Cancel
            </Button>
            <Button
              onClick={handleSchedule}
              className="h-10 px-5"
              disabled={hasOverlap}
            >
              Add to Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Mobile: Drawer - optimized for touch
  return (
    <Drawer open={open} onOpenChange={onClose}>
      <DrawerContent className="max-h-[85vh] flex flex-col">
        <DrawerHeader className="text-left pb-3 px-4 border-b bg-muted/30 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50">
              <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <DrawerTitle className="text-lg">Quick Schedule</DrawerTitle>
              <DrawerDescription className="text-sm">
                Add this tactic to your Model Week
              </DrawerDescription>
            </div>
          </div>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto min-h-0 px-4 py-4">
          {formContent}
        </div>
        <DrawerFooter className="pt-3 pb-6 border-t bg-muted/30 flex-shrink-0">
          <div className="flex w-full justify-end gap-3">
            <DrawerClose asChild>
              <Button variant="outline" className="h-11 px-5 touch-manipulation">
                Cancel
              </Button>
            </DrawerClose>
            <Button
              onClick={handleSchedule}
              className="h-11 px-5 touch-manipulation"
              disabled={hasOverlap}
            >
              Add to Schedule
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
