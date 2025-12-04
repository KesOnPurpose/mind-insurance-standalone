import { useMemo } from 'react';
import { addDays, setHours, setMinutes, startOfWeek } from 'date-fns';
import type { EventInput } from '@fullcalendar/core';
import type { ModelWeek, DayOfWeek, ActivityType } from '@/types/modelWeek';
import { DAYS_OF_WEEK } from '@/types/modelWeek';
import { getActivityConfig, getActivityColor, getTextColor } from '@/config/activityTypes';

export interface CalendarEvent extends EventInput {
  id: string;
  title: string;
  start: Date;
  end: Date;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  extendedProps?: {
    type: 'time_block' | 'assigned_tactic';
    tacticId?: string;
    tacticName?: string;
    notes?: string;
    dayOfWeek: DayOfWeek;
    originalStartTime: string;
    originalEndTime: string;
    activityType?: ActivityType;
    customColor?: string;
    title?: string;
  };
}

interface UseCalendarEventsOptions {
  modelWeek: ModelWeek | null;
  weekStart?: Date;
}

export function useCalendarEvents({ modelWeek, weekStart }: UseCalendarEventsOptions) {
  // Default to current week starting Monday
  const effectiveWeekStart = useMemo(
    () => weekStart || startOfWeek(new Date(), { weekStartsOn: 1 }),
    [weekStart]
  );

  return useMemo(() => {
    if (!modelWeek) return [];

    const events: CalendarEvent[] = [];

    DAYS_OF_WEEK.forEach((dayKey, dayIndex) => {
      const timeSlots = modelWeek[dayKey] || [];
      const dayDate = addDays(effectiveWeekStart, dayIndex);

      timeSlots.forEach((slot) => {
        // Parse start time (HH:mm format)
        const [startHour, startMin] = slot.startTime.split(':').map(Number);
        // Parse end time (HH:mm format)
        const [endHour, endMin] = slot.endTime.split(':').map(Number);

        // Create Date objects for this specific day
        const startDate = setMinutes(setHours(dayDate, startHour), startMin);
        const endDate = setMinutes(setHours(dayDate, endHour), endMin);

        const isAssignedTactic = !!slot.tacticName;

        // Determine effective activity type - force 'tactic' for linked tactics
        // This ensures purple styling even for legacy slots without activityType set
        const effectiveActivityType: ActivityType = slot.tacticId
          ? 'tactic'
          : (slot.activityType || 'custom');

        // Get colors based on activity type (or use custom color)
        const activityConfig = getActivityConfig(effectiveActivityType);
        const colors = getActivityColor(effectiveActivityType, slot.customColor);
        const textColor = getTextColor(colors.bg);

        // Determine display title
        const displayTitle = slot.title || slot.tacticName || activityConfig.label;

        events.push({
          id: slot.id,
          title: `${activityConfig.emoji} ${displayTitle}`,
          start: startDate,
          end: endDate,
          backgroundColor: colors.bg,
          borderColor: colors.border,
          textColor: textColor,
          extendedProps: {
            type: isAssignedTactic ? 'assigned_tactic' : 'time_block',
            tacticId: slot.tacticId,
            tacticName: slot.tacticName,
            notes: slot.notes,
            dayOfWeek: dayKey,
            originalStartTime: slot.startTime,
            originalEndTime: slot.endTime,
            activityType: slot.activityType,
            customColor: slot.customColor,
            title: slot.title,
          },
        });
      });
    });

    return events;
  }, [modelWeek, effectiveWeekStart]);
}
