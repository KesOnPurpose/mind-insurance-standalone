// ============================================================================
// FEAT-GH-017: Calendar Drip Configuration Component
// ============================================================================
// Date/time pickers per phase for calendar-based drip scheduling
// ============================================================================

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Clock, Unlock } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Phase, CalendarDripSchedule } from '@/types/programs';

// ============================================================================
// Types
// ============================================================================

interface CalendarDripConfigProps {
  phases: Phase[];
  schedule: CalendarDripSchedule[];
  onChange: (schedule: CalendarDripSchedule[]) => void;
  disabled?: boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

const getScheduleForPhase = (
  schedule: CalendarDripSchedule[],
  phaseId: string
): CalendarDripSchedule | undefined => {
  return schedule.find((s) => s.phase_id === phaseId);
};

const formatDateTime = (isoString: string | undefined): { date: Date | undefined; time: string } => {
  if (!isoString) {
    return { date: undefined, time: '09:00' };
  }
  try {
    const date = parseISO(isoString);
    if (!isValid(date)) {
      return { date: undefined, time: '09:00' };
    }
    return {
      date,
      time: format(date, 'HH:mm'),
    };
  } catch {
    return { date: undefined, time: '09:00' };
  }
};

const combineDateAndTime = (date: Date, time: string): string => {
  const [hours, minutes] = time.split(':').map(Number);
  const combined = new Date(date);
  combined.setHours(hours || 9, minutes || 0, 0, 0);
  return combined.toISOString();
};

// ============================================================================
// Phase Row Component
// ============================================================================

interface PhaseRowProps {
  phase: Phase;
  index: number;
  scheduleItem: CalendarDripSchedule | undefined;
  onDateChange: (phaseId: string, date: Date | undefined) => void;
  onTimeChange: (phaseId: string, time: string) => void;
  disabled?: boolean;
}

const PhaseRow = ({
  phase,
  index,
  scheduleItem,
  onDateChange,
  onTimeChange,
  disabled,
}: PhaseRowProps) => {
  const { date, time } = formatDateTime(scheduleItem?.unlock_at);
  const isFirstPhase = index === 0;

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg',
        isFirstPhase && 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
      )}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div
          className={cn(
            'h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0',
            isFirstPhase
              ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
              : 'bg-muted text-muted-foreground'
          )}
        >
          {index + 1}
        </div>
        <div className="min-w-0">
          <p className="font-medium truncate">{phase.title}</p>
          <p className="text-sm text-muted-foreground">
            {phase.total_lessons} lessons
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
        {isFirstPhase ? (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <Unlock className="h-4 w-4" />
            <span>Unlocked immediately</span>
          </div>
        ) : (
          <>
            {/* Date Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-[180px] justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
                  )}
                  disabled={disabled}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'MMM d, yyyy') : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => onDateChange(phase.id, newDate)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {/* Time Input */}
            <div className="flex items-center gap-2">
              <Label htmlFor={`time-${phase.id}`} className="sr-only">
                Unlock time
              </Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id={`time-${phase.id}`}
                  type="time"
                  value={time}
                  onChange={(e) => onTimeChange(phase.id, e.target.value)}
                  className="w-[120px] pl-9"
                  disabled={disabled || !date}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const CalendarDripConfig = ({
  phases,
  schedule,
  onChange,
  disabled = false,
}: CalendarDripConfigProps) => {
  // Sort phases by order_index
  const sortedPhases = [...phases].sort((a, b) => a.order_index - b.order_index);

  const handleDateChange = (phaseId: string, date: Date | undefined) => {
    const existingItem = getScheduleForPhase(schedule, phaseId);
    const currentTime = existingItem
      ? formatDateTime(existingItem.unlock_at).time
      : '09:00';

    if (!date) {
      // Remove the schedule item if date is cleared
      onChange(schedule.filter((s) => s.phase_id !== phaseId));
      return;
    }

    const newUnlockAt = combineDateAndTime(date, currentTime);

    if (existingItem) {
      onChange(
        schedule.map((s) =>
          s.phase_id === phaseId ? { ...s, unlock_at: newUnlockAt } : s
        )
      );
    } else {
      onChange([...schedule, { phase_id: phaseId, unlock_at: newUnlockAt }]);
    }
  };

  const handleTimeChange = (phaseId: string, time: string) => {
    const existingItem = getScheduleForPhase(schedule, phaseId);
    if (!existingItem) return;

    const currentDate = parseISO(existingItem.unlock_at);
    if (!isValid(currentDate)) return;

    const newUnlockAt = combineDateAndTime(currentDate, time);
    onChange(
      schedule.map((s) =>
        s.phase_id === phaseId ? { ...s, unlock_at: newUnlockAt } : s
      )
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-blue-500" />
          Phase Unlock Schedule
        </CardTitle>
        <CardDescription>
          Set specific dates and times when each phase becomes available to learners
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedPhases.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No phases found. Add phases to configure their unlock schedule.</p>
          </div>
        ) : (
          sortedPhases.map((phase, index) => (
            <PhaseRow
              key={phase.id}
              phase={phase}
              index={index}
              scheduleItem={getScheduleForPhase(schedule, phase.id)}
              onDateChange={handleDateChange}
              onTimeChange={handleTimeChange}
              disabled={disabled}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default CalendarDripConfig;
