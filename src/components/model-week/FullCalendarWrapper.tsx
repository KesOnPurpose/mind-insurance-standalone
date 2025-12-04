import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventDropArg, EventResizeDoneArg, DateClickArg, EventClickArg, DateSelectArg } from '@fullcalendar/interaction';
import type { EventInput } from '@fullcalendar/core';

interface FullCalendarWrapperProps {
  events: EventInput[];
  onEventDrop?: (info: EventDropArg) => void;
  onEventResize?: (info: EventResizeDoneArg) => void;
  onDateClick?: (info: DateClickArg) => void;
  onEventClick?: (info: EventClickArg) => void;
  onSelect?: (info: DateSelectArg) => void;
}

export function FullCalendarWrapper({
  events,
  onEventDrop,
  onEventResize,
  onDateClick,
  onEventClick,
  onSelect,
}: FullCalendarWrapperProps) {
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="w-full model-week-calendar">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        // Mobile: Show 3-day view by default, Desktop: Show full week
        initialView={isMobile ? 'timeGridThreeDay' : 'timeGridWeek'}
        views={{
          timeGridThreeDay: {
            type: 'timeGrid',
            duration: { days: 3 },
            buttonText: '3 Day',
          },
        }}
        // Responsive header toolbar
        headerToolbar={
          isMobile
            ? {
                left: 'prev,next',
                center: 'title',
                right: 'timeGridThreeDay,timeGridDay',
              }
            : {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay',
              }
        }
        editable={true}
        selectable={true}
        selectMirror={true}
        slotMinTime="05:00:00"
        slotMaxTime="24:00:00"
        // Larger slots on mobile for easier touch
        slotDuration={isMobile ? '01:00:00' : '00:30:00'}
        snapDuration="00:15:00"
        events={events}
        eventDrop={onEventDrop}
        eventResize={onEventResize}
        dateClick={onDateClick}
        eventClick={onEventClick}
        select={onSelect}
        unselectAuto={true}
        // Fixed height on mobile for better scrolling
        height={isMobile ? 600 : 'auto'}
        contentHeight={isMobile ? 550 : 'auto'}
        allDaySlot={false}
        nowIndicator={true}
        dayMaxEvents={isMobile ? 2 : true}
        // Compact time format on mobile
        eventTimeFormat={
          isMobile
            ? { hour: 'numeric', meridiem: 'narrow' }
            : { hour: 'numeric', minute: '2-digit', meridiem: 'short' }
        }
        slotLabelFormat={
          isMobile
            ? { hour: 'numeric', meridiem: 'narrow' }
            : { hour: 'numeric', minute: '2-digit', meridiem: 'short' }
        }
        // Shorter button text on mobile
        buttonText={{
          today: isMobile ? 'Now' : 'Today',
          month: 'Month',
          week: 'Week',
          day: 'Day',
        }}
        // Compact day header on mobile
        dayHeaderFormat={
          isMobile
            ? { weekday: 'narrow', day: 'numeric' }
            : { weekday: 'short', day: 'numeric' }
        }
        weekends={true}
        firstDay={1} // Start week on Monday
        scrollTime="08:00:00"
        slotEventOverlap={false}
        // Touch-friendly settings
        longPressDelay={isMobile ? 500 : 1000}
        eventLongPressDelay={isMobile ? 500 : 1000}
        selectLongPressDelay={isMobile ? 500 : 1000}
        // Better event display
        eventDisplay="block"
        eventMinHeight={isMobile ? 30 : 20}
        // Sticky header for scrolling
        stickyHeaderDates={true}
      />
      {/* Custom CSS for mobile optimization */}
      <style>{`
        .model-week-calendar .fc {
          font-size: ${isMobile ? '12px' : '14px'};
        }
        .model-week-calendar .fc-toolbar-title {
          font-size: ${isMobile ? '14px' : '18px'} !important;
        }
        .model-week-calendar .fc-button {
          padding: ${isMobile ? '4px 8px' : '6px 12px'} !important;
          font-size: ${isMobile ? '11px' : '14px'} !important;
        }
        .model-week-calendar .fc-timegrid-slot {
          height: ${isMobile ? '3em' : '2.5em'} !important;
        }
        .model-week-calendar .fc-event {
          border-radius: 4px;
          padding: ${isMobile ? '2px 4px' : '2px 6px'};
          font-size: ${isMobile ? '10px' : '12px'};
          cursor: pointer;
        }
        .model-week-calendar .fc-event-title {
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .model-week-calendar .fc-col-header-cell {
          padding: ${isMobile ? '4px 0' : '8px 0'} !important;
        }
        .model-week-calendar .fc-timegrid-slot-label {
          font-size: ${isMobile ? '10px' : '12px'};
        }
        /* Touch-friendly tap targets */
        @media (max-width: 767px) {
          .model-week-calendar .fc-timegrid-event {
            min-height: 35px !important;
          }
          .model-week-calendar .fc-toolbar {
            flex-wrap: wrap;
            gap: 8px;
          }
          .model-week-calendar .fc-toolbar-chunk {
            display: flex;
            align-items: center;
          }
        }
      `}</style>
    </div>
  );
}
