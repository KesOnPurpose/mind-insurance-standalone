import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { FullCalendarWrapper } from '@/components/model-week/FullCalendarWrapper';
import { EventEditModal, EventEditData } from '@/components/model-week/EventEditModal';
import { useModelWeek } from '@/hooks/useModelWeek';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { toast } from '@/hooks/use-toast';
import { format, setHours, setMinutes } from 'date-fns';
import type { EventDropArg, EventResizeDoneArg, DateClickArg, EventClickArg, DateSelectArg } from '@fullcalendar/interaction';
import type { TimeSlot, DayOfWeek, ActivityType } from '@/types/modelWeek';
import { DAYS_OF_WEEK } from '@/types/modelWeek';

const ModelWeekPage = () => {
  const { user } = useAuth();
  const userId = user?.id || 'guest';

  const { modelWeek, saveModelWeek, isLoading } = useModelWeek(userId);
  const calendarEvents = useCalendarEvents({ modelWeek });

  // Modal state for event editing
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventEditData | null>(null);

  // Helper: Convert Date to DayOfWeek string
  const getDayOfWeek = (date: Date): DayOfWeek => {
    const dayIndex = (date.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
    return DAYS_OF_WEEK[dayIndex];
  };

  // Helper: Check for time slot overlaps
  const hasOverlap = (newSlot: TimeSlot, existingSlots: TimeSlot[]): boolean => {
    const newStart = newSlot.startTime;
    const newEnd = newSlot.endTime;

    return existingSlots.some(slot => {
      if (slot.id === newSlot.id) return false; // Ignore self
      const existingStart = slot.startTime;
      const existingEnd = slot.endTime;

      return (
        (newStart >= existingStart && newStart < existingEnd) ||
        (newEnd > existingStart && newEnd <= existingEnd) ||
        (newStart <= existingStart && newEnd >= existingEnd)
      );
    });
  };

  // Helper: Calculate duration in minutes
  const getDuration = (slot: TimeSlot): number => {
    const [startHour, startMin] = slot.startTime.split(':').map(Number);
    const [endHour, endMin] = slot.endTime.split(':').map(Number);
    return (endHour * 60 + endMin) - (startHour * 60 + startMin);
  };

  // Handle drag-and-drop
  const handleEventDrop = useCallback((info: EventDropArg) => {
    if (!modelWeek) return;

    const { event } = info;
    const dayOfWeek = getDayOfWeek(event.start!);
    const originalDayOfWeek = event.extendedProps.dayOfWeek as DayOfWeek;

    const updatedSlot: TimeSlot = {
      id: event.id,
      startTime: format(event.start!, 'HH:mm'),
      endTime: format(event.end!, 'HH:mm'),
      tacticId: event.extendedProps.tacticId,
      tacticName: event.extendedProps.tacticName,
      notes: event.extendedProps.notes,
      activityType: event.extendedProps.activityType,
      customColor: event.extendedProps.customColor,
      title: event.extendedProps.title,
    };

    // Get slots for the target day (excluding the moving slot if same day)
    const targetDaySlots = modelWeek[dayOfWeek].filter(
      slot => !(dayOfWeek === originalDayOfWeek && slot.id === event.id)
    );

    // Check for overlaps
    if (hasOverlap(updatedSlot, targetDaySlots)) {
      info.revert();
      toast({
        title: 'Overlap Detected',
        description: 'This time slot overlaps with an existing block.',
        variant: 'destructive',
      });
      return;
    }

    // Update model week
    const updated = { ...modelWeek };

    // Remove from original day
    updated[originalDayOfWeek] = updated[originalDayOfWeek].filter(s => s.id !== event.id);

    // Add to new day
    updated[dayOfWeek] = [...updated[dayOfWeek], updatedSlot]
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    saveModelWeek(updated);
  }, [modelWeek, saveModelWeek]);

  // Handle resize
  const handleEventResize = useCallback((info: EventResizeDoneArg) => {
    if (!modelWeek) return;

    const { event } = info;
    const dayOfWeek = event.extendedProps.dayOfWeek as DayOfWeek;

    const updatedSlot: TimeSlot = {
      id: event.id,
      startTime: format(event.start!, 'HH:mm'),
      endTime: format(event.end!, 'HH:mm'),
      tacticId: event.extendedProps.tacticId,
      tacticName: event.extendedProps.tacticName,
      notes: event.extendedProps.notes,
      activityType: event.extendedProps.activityType,
      customColor: event.extendedProps.customColor,
      title: event.extendedProps.title,
    };

    // Enforce minimum duration (15 minutes)
    if (getDuration(updatedSlot) < 15) {
      info.revert();
      toast({
        title: 'Too Short',
        description: 'Time blocks must be at least 15 minutes.',
        variant: 'destructive',
      });
      return;
    }

    // Check for overlaps
    const otherSlots = modelWeek[dayOfWeek].filter(s => s.id !== event.id);
    if (hasOverlap(updatedSlot, otherSlots)) {
      info.revert();
      toast({
        title: 'Overlap Detected',
        description: 'This time slot overlaps with an existing block.',
        variant: 'destructive',
      });
      return;
    }

    // Update model week
    const updated = { ...modelWeek };
    updated[dayOfWeek] = updated[dayOfWeek]
      .map(s => s.id === event.id ? updatedSlot : s)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    saveModelWeek(updated);
  }, [modelWeek, saveModelWeek]);

  // Handle clicking empty slot - opens modal for creation
  const handleDateClick = useCallback((info: DateClickArg) => {
    if (!modelWeek) return;

    const dayOfWeek = getDayOfWeek(info.date);
    const clickTime = format(info.date, 'HH:mm');

    // Default 1-hour block
    const endDate = setMinutes(setHours(info.date, info.date.getHours() + 1), info.date.getMinutes());
    const endTime = format(endDate, 'HH:mm');

    // Open modal with pre-filled time
    setEditingEvent({
      id: null, // null indicates new event
      dayOfWeek,
      startTime: clickTime,
      endTime: endTime,
      activityType: 'work', // Default activity type
    });
    setEditModalOpen(true);
  }, [modelWeek]);

  // Handle clicking existing event - opens modal for editing
  const handleEventClick = useCallback((info: EventClickArg) => {
    const { event } = info;
    const extendedProps = event.extendedProps;

    setEditingEvent({
      id: event.id,
      dayOfWeek: extendedProps.dayOfWeek as DayOfWeek,
      startTime: extendedProps.originalStartTime,
      endTime: extendedProps.originalEndTime,
      title: extendedProps.title,
      tacticId: extendedProps.tacticId,
      tacticName: extendedProps.tacticName,
      notes: extendedProps.notes,
      activityType: extendedProps.activityType as ActivityType,
      customColor: extendedProps.customColor,
    });
    setEditModalOpen(true);
  }, []);

  // Handle drag-to-select - opens modal for creation with selected time range
  const handleSelect = useCallback((info: DateSelectArg) => {
    if (!modelWeek) return;

    const dayOfWeek = getDayOfWeek(info.start);
    const startTime = format(info.start, 'HH:mm');
    const endTime = format(info.end, 'HH:mm');

    setEditingEvent({
      id: null,
      dayOfWeek,
      startTime,
      endTime,
      activityType: 'work',
    });
    setEditModalOpen(true);
  }, [modelWeek]);

  // Handle saving event from modal (create or update)
  const handleEventSave = useCallback((slot: TimeSlot, dayOfWeek: DayOfWeek) => {
    if (!modelWeek) return;

    const updated = { ...modelWeek };
    const existingIndex = updated[dayOfWeek].findIndex(s => s.id === slot.id);

    if (existingIndex >= 0) {
      // Update existing slot
      updated[dayOfWeek][existingIndex] = slot;
    } else {
      // Check for overlaps before adding
      if (hasOverlap(slot, modelWeek[dayOfWeek])) {
        toast({
          title: 'Cannot Add',
          description: 'This time overlaps with an existing block.',
          variant: 'destructive',
        });
        return;
      }
      // Add new slot
      updated[dayOfWeek] = [...updated[dayOfWeek], slot];
    }

    // Sort by start time
    updated[dayOfWeek] = updated[dayOfWeek].sort((a, b) =>
      a.startTime.localeCompare(b.startTime)
    );

    saveModelWeek(updated);
    toast({
      title: existingIndex >= 0 ? 'Event Updated' : 'Event Created',
      description: existingIndex >= 0
        ? 'Your time block has been updated.'
        : `Added to ${dayOfWeek}`,
    });
  }, [modelWeek, saveModelWeek, hasOverlap]);

  // Handle deleting event from modal
  const handleEventDelete = useCallback((slotId: string, dayOfWeek: DayOfWeek) => {
    if (!modelWeek) return;

    const updated = { ...modelWeek };
    updated[dayOfWeek] = updated[dayOfWeek].filter(s => s.id !== slotId);

    saveModelWeek(updated);
    toast({
      title: 'Event Deleted',
      description: 'The time block has been removed.',
    });
  }, [modelWeek, saveModelWeek]);

  if (isLoading) {
    return (
      <SidebarLayout mode="model-week">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your model week...</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout mode="model-week">
      <div className="max-w-7xl mx-auto px-2 py-3 md:p-6 space-y-3 md:space-y-6">
        {/* Page Header - Compact on mobile */}
        <div className="space-y-1 md:space-y-2 px-2 md:px-0">
          <h1 className="text-xl md:text-3xl font-bold tracking-tight">Model Week</h1>
          <p className="text-xs md:text-sm text-muted-foreground hidden md:block">
            Time-block your week with drag-and-drop. Click empty slots to create new blocks.
          </p>
          <p className="text-xs text-muted-foreground md:hidden">
            Tap slots to add blocks. Drag to move.
          </p>
        </div>

        {/* FullCalendar - Responsive padding */}
        <div className="bg-card rounded-lg border p-2 md:p-4 shadow-sm overflow-hidden">
          <FullCalendarWrapper
            events={calendarEvents}
            onEventDrop={handleEventDrop}
            onEventResize={handleEventResize}
            onDateClick={handleDateClick}
            onEventClick={handleEventClick}
            onSelect={handleSelect}
          />
        </div>
      </div>

      {/* Event Edit Modal - Uses Drawer on mobile */}
      <EventEditModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        event={editingEvent}
        onSave={handleEventSave}
        onDelete={handleEventDelete}
      />
    </SidebarLayout>
  );
};

export default ModelWeekPage;
