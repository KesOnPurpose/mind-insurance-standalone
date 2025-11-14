export interface TimeSlot {
  id: string;
  startTime: string; // HH:mm format
  endTime: string;
  tacticId?: string;
  tacticName?: string;
  notes?: string;
}

export interface DaySchedule {
  day: string;
  timeSlots: TimeSlot[];
}

export interface ModelWeek {
  userId: string;
  monday: TimeSlot[];
  tuesday: TimeSlot[];
  wednesday: TimeSlot[];
  thursday: TimeSlot[];
  friday: TimeSlot[];
  saturday: TimeSlot[];
  sunday: TimeSlot[];
  preferences: {
    maxTacticsPerDay: number;
    preferredTimes: ('morning' | 'afternoon' | 'evening')[];
    bufferTime: number; // minutes
  };
}

export const DAYS_OF_WEEK = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

export type DayOfWeek = typeof DAYS_OF_WEEK[number];
