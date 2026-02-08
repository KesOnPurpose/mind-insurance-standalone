// CEO Blueprint Week Section (Premium Schedule / Model Week)
// Time-blocking for executing premium payments
// Uses Mind Insurance branding: Strategic, Buffer, Breakout blocks

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  DragStartEvent,
  DragEndEvent,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Save,
  Edit3,
  Briefcase,
  Mail,
  Coffee,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Settings,
  BarChart3,
  Link2,
  Sun,
  Moon,
  Dumbbell,
  Users,
  Church,
  Heart,
  Utensils,
  DollarSign,
  Smile,
  Sparkles,
  Brain,
  LayoutGrid,
  CalendarDays,
  GripVertical,
  Check,
  type LucideIcon,
} from 'lucide-react';

// Custom hook for mobile detection
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < breakpoint;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return isMobile;
}
import type {
  CEOPremiumSchedule,
  CEOPremiumBlock,
  CEOActivePolicy,
  CEOCoverageTarget,
  PremiumBlockType,
  DayOfWeek,
} from '@/types/ceoDashboard';
import {
  DEFAULT_PREMIUM_SCHEDULE,
  DAYS_OF_WEEK,
  createEmptyPremiumBlock,
} from '@/types/ceoDashboard';

interface BlueprintWeekSectionProps {
  schedule: CEOPremiumSchedule | null;
  activePolicy: CEOActivePolicy | null;
  onSave: (schedule: CEOPremiumSchedule) => Promise<void>;
  onAddBlock: (day: DayOfWeek, block: CEOPremiumBlock) => Promise<void>;
  onUpdateBlock: (day: DayOfWeek, blockId: string, updates: Partial<CEOPremiumBlock>) => Promise<void>;
  onRemoveBlock: (day: DayOfWeek, blockId: string) => Promise<void>;
  isSaving: boolean;
}

// Day display names
const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

// Day short names
const DAY_SHORT_LABELS: Record<DayOfWeek, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

// Block type configuration - Extended from Purpose Waze Model Week
const BLOCK_TYPE_CONFIG: Record<
  PremiumBlockType,
  { label: string; icon: LucideIcon; bgColor: string; textColor: string; borderColor: string; emoji: string }
> = {
  // Core Types (Original 3)
  strategic: {
    label: 'Strategic',
    icon: Brain,
    bgColor: 'bg-mi-gold/20',
    textColor: 'text-mi-gold',
    borderColor: 'border-mi-gold/30',
    emoji: '💭',
  },
  buffer: {
    label: 'Buffer',
    icon: Mail,
    bgColor: 'bg-blue-500/20',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    emoji: '📧',
  },
  breakout: {
    label: 'Breakout',
    icon: Coffee,
    bgColor: 'bg-green-500/20',
    textColor: 'text-green-400',
    borderColor: 'border-green-500/30',
    emoji: '☕',
  },
  // Extended Types
  work: {
    label: 'Work',
    icon: Briefcase,
    bgColor: 'bg-amber-500/20',
    textColor: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    emoji: '💼',
  },
  morning_routine: {
    label: 'Morning Routine',
    icon: Sun,
    bgColor: 'bg-orange-500/20',
    textColor: 'text-orange-400',
    borderColor: 'border-orange-500/30',
    emoji: '🌅',
  },
  evening_routine: {
    label: 'Evening Routine',
    icon: Moon,
    bgColor: 'bg-purple-500/20',
    textColor: 'text-purple-400',
    borderColor: 'border-purple-500/30',
    emoji: '🌙',
  },
  fitness: {
    label: 'Fitness',
    icon: Dumbbell,
    bgColor: 'bg-emerald-500/20',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    emoji: '💪',
  },
  connection: {
    label: 'Connection',
    icon: Users,
    bgColor: 'bg-pink-500/20',
    textColor: 'text-pink-400',
    borderColor: 'border-pink-500/30',
    emoji: '👥',
  },
  church: {
    label: 'Church',
    icon: Church,
    bgColor: 'bg-sky-500/20',
    textColor: 'text-sky-400',
    borderColor: 'border-sky-500/30',
    emoji: '⛪',
  },
  date_night: {
    label: 'Date Night',
    icon: Heart,
    bgColor: 'bg-red-500/20',
    textColor: 'text-red-400',
    borderColor: 'border-red-500/30',
    emoji: '❤️',
  },
  eat: {
    label: 'Eat',
    icon: Utensils,
    bgColor: 'bg-orange-400/20',
    textColor: 'text-orange-300',
    borderColor: 'border-orange-400/30',
    emoji: '🍽️',
  },
  business: {
    label: 'Business',
    icon: DollarSign,
    bgColor: 'bg-yellow-500/20',
    textColor: 'text-yellow-400',
    borderColor: 'border-yellow-500/30',
    emoji: '💰',
  },
  sleep: {
    label: 'Sleep',
    icon: Moon,
    bgColor: 'bg-indigo-500/20',
    textColor: 'text-indigo-400',
    borderColor: 'border-indigo-500/30',
    emoji: '😴',
  },
  fun: {
    label: 'Fun',
    icon: Smile,
    bgColor: 'bg-yellow-400/20',
    textColor: 'text-yellow-300',
    borderColor: 'border-yellow-400/30',
    emoji: '🎉',
  },
  relax: {
    label: 'Relax',
    icon: Sparkles,
    bgColor: 'bg-teal-500/20',
    textColor: 'text-teal-400',
    borderColor: 'border-teal-500/30',
    emoji: '🧘',
  },
  other: {
    label: 'Other',
    icon: Sparkles,
    bgColor: 'bg-gray-500/20',
    textColor: 'text-gray-400',
    borderColor: 'border-gray-500/30',
    emoji: '✨',
  },
};

// Time grid constants
const HOUR_HEIGHT = 48; // pixels per hour
const START_HOUR = 4; // 4 AM
const END_HOUR = 23; // 11 PM (last visible hour - use spans_overnight for blocks that go past midnight)
const TOTAL_HOURS = END_HOUR - START_HOUR + 1; // +1 to show 11 PM row

// Helper to clamp time to valid range (max 23:59 for HTML time inputs)
function clampTimeString(hours: number, minutes: number): string {
  const clampedHours = Math.min(23, Math.max(0, hours));
  const clampedMinutes = Math.min(59, Math.max(0, minutes));
  return `${clampedHours.toString().padStart(2, '0')}:${clampedMinutes.toString().padStart(2, '0')}`;
}

// Resizable Block Component for Time Grid Week View
// Now always allows drag/resize (no edit mode required) and double-click to edit
function ResizableTimeBlock({
  block,
  day,
  onBlockClick,
  onDoubleClick,
  onResize,
  onDragMove,
  onDragEnd,
  formatTime,
}: {
  block: CEOPremiumBlock;
  day: DayOfWeek;
  onBlockClick: () => void;
  onDoubleClick: () => void;
  onResize: (blockId: string, day: DayOfWeek, newEndTime: string) => void;
  onDragMove: (blockId: string, sourceDay: DayOfWeek, targetDay: DayOfWeek, newStartTime: string) => void;
  onDragEnd: () => void;
  formatTime: (time: string) => string;
}) {
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartX, setDragStartX] = useState(0);
  const [initialEndTime, setInitialEndTime] = useState('');
  const [initialStartTime, setInitialStartTime] = useState('');
  const blockRef = useRef<HTMLDivElement>(null);

  const config = BLOCK_TYPE_CONFIG[block.block_type];
  const Icon = config.icon;

  // Calculate position and height based on time
  const [startH, startM] = block.start_time.split(':').map(Number);
  const [endH, endM] = block.end_time.split(':').map(Number);
  const startMinutes = (startH - START_HOUR) * 60 + startM;
  let endMinutes = (endH - START_HOUR) * 60 + endM;

  // For overnight blocks, this block shows from start_time to end of visible grid (11:59 PM)
  const isOvernightBlock = block.spans_overnight || endMinutes < startMinutes;
  if (isOvernightBlock) {
    // Show until end of visible grid (TOTAL_HOURS covers 4 AM to 11:59 PM)
    endMinutes = TOTAL_HOURS * 60;
  }

  const durationMinutes = endMinutes - startMinutes;
  const topPosition = (startMinutes / 60) * HOUR_HEIGHT;
  const blockHeight = Math.max((durationMinutes / 60) * HOUR_HEIGHT, 24); // Min 24px

  // Handle resize from bottom edge - Always enabled
  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    setDragStartY(e.clientY);
    setInitialEndTime(block.end_time);
  };

  // Handle drag from main area - Always enabled
  const handleDragStart = (e: React.MouseEvent) => {
    if (isResizing) return;
    e.stopPropagation();
    setIsDragging(true);
    setDragStartY(e.clientY);
    setDragStartX(e.clientX);
    setInitialStartTime(block.start_time);
    setInitialEndTime(block.end_time);
  };

  useEffect(() => {
    if (!isResizing && !isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        const deltaY = e.clientY - dragStartY;
        const deltaMinutes = Math.round((deltaY / HOUR_HEIGHT) * 60 / 15) * 15; // Snap to 15 min

        const [endH, endM] = initialEndTime.split(':').map(Number);
        let newEndMinutes = endH * 60 + endM + deltaMinutes;

        // Clamp to valid range
        const [startH, startM] = block.start_time.split(':').map(Number);
        const startTotalMinutes = startH * 60 + startM;
        newEndMinutes = Math.max(startTotalMinutes + 15, newEndMinutes); // Min 15 min duration
        newEndMinutes = Math.min(23 * 60 + 59, newEndMinutes); // Max 23:59 (valid HTML time input)

        const newEndH = Math.floor(newEndMinutes / 60);
        const newEndM = newEndMinutes % 60;
        const newEndTime = clampTimeString(newEndH, newEndM);

        onResize(block.id, day, newEndTime);
      } else if (isDragging) {
        const deltaY = e.clientY - dragStartY;
        const deltaMinutes = Math.round((deltaY / HOUR_HEIGHT) * 60 / 15) * 15; // Snap to 15 min

        const [startH, startM] = initialStartTime.split(':').map(Number);
        let newStartMinutes = startH * 60 + startM + deltaMinutes;

        // Clamp to valid range
        newStartMinutes = Math.max(START_HOUR * 60, newStartMinutes);
        const [endH, endM] = initialEndTime.split(':').map(Number);
        const duration = (endH * 60 + endM) - (startH * 60 + startM);
        newStartMinutes = Math.min((23 * 60 + 59) - duration, newStartMinutes); // Max so end time doesn't exceed 23:59

        const newStartH = Math.floor(newStartMinutes / 60);
        const newStartM = newStartMinutes % 60;
        const newStartTime = clampTimeString(newStartH, newStartM);

        // Check for horizontal movement (day change)
        const deltaX = e.clientX - dragStartX;
        const dayWidth = blockRef.current?.parentElement?.getBoundingClientRect().width || 100;
        const dayOffset = Math.round(deltaX / dayWidth);
        const dayIndex = DAYS_OF_WEEK.indexOf(day);
        const newDayIndex = Math.max(0, Math.min(6, dayIndex + dayOffset));
        const targetDay = DAYS_OF_WEEK[newDayIndex];

        onDragMove(block.id, day, targetDay, newStartTime);
      }
    };

    const handleMouseUp = () => {
      if (isResizing || isDragging) {
        onDragEnd(); // Save changes when drag/resize ends
      }
      setIsResizing(false);
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, isDragging, dragStartY, dragStartX, initialEndTime, initialStartTime, block, day, onResize, onDragMove, onDragEnd]);

  return (
    <div
      ref={blockRef}
      className={cn(
        'absolute left-1 right-1 rounded border overflow-hidden transition-shadow cursor-move',
        config.bgColor,
        config.borderColor,
        'hover:ring-1 hover:ring-mi-cyan/30',
        (isResizing || isDragging) && 'shadow-lg ring-2 ring-mi-cyan/50 z-50'
      )}
      style={{
        top: `${topPosition}px`,
        height: `${blockHeight}px`,
        minHeight: '24px',
      }}
      onMouseDown={handleDragStart}
      onClick={(e) => {
        if (!isDragging && !isResizing) {
          e.stopPropagation();
          onBlockClick();
        }
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick();
      }}
    >
      {/* Block content */}
      <div className="p-1 h-full flex flex-col">
        <div className="flex items-center gap-1">
          <GripVertical className="h-3 w-3 text-white/40 flex-shrink-0" />
          <Icon className={cn('h-3 w-3 flex-shrink-0', config.textColor)} />
          <span className={cn('text-[10px] font-medium truncate', config.textColor)}>
            {block.title || config.label}
          </span>
          {isOvernightBlock && (
            <span className="text-[8px] px-1 py-0.5 rounded bg-indigo-500/30 text-indigo-300 flex-shrink-0">
              →
            </span>
          )}
        </div>
        <p className="text-[9px] text-white/50 mt-auto">
          {formatTime(block.start_time)} - {isOvernightBlock ? '→' : ''}{formatTime(block.end_time)}
        </p>
      </div>

      {/* Resize handle at bottom - Always visible on hover */}
      <div
        className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize bg-transparent hover:bg-mi-cyan/30 transition-colors group"
        onMouseDown={handleResizeStart}
      >
        <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-white/20 group-hover:bg-white/50" />
      </div>
    </div>
  );
}

// Overnight Block Continuation - Shows the continuation of an overnight block on the next day
function OvernightContinuationBlock({
  block,
  sourceDay,
  onDoubleClick,
  formatTime,
}: {
  block: CEOPremiumBlock;
  sourceDay: DayOfWeek;
  onDoubleClick: () => void;
  formatTime: (time: string) => string;
}) {
  const config = BLOCK_TYPE_CONFIG[block.block_type];
  const Icon = config.icon;

  // Calculate position: starts at midnight (00:00 = START_HOUR for next day)
  const [endH, endM] = block.end_time.split(':').map(Number);
  const endMinutes = (endH - START_HOUR) * 60 + endM;
  // Starts at the beginning of the visible day (START_HOUR)
  const startMinutes = 0;
  const durationMinutes = endMinutes - startMinutes;

  // Only show if end time is after START_HOUR (4 AM)
  if (durationMinutes <= 0) return null;

  const topPosition = 0;
  const blockHeight = Math.max((durationMinutes / 60) * HOUR_HEIGHT, 24);

  return (
    <div
      className={cn(
        'absolute left-1 right-1 rounded border overflow-hidden cursor-pointer opacity-70',
        config.bgColor,
        config.borderColor,
        'border-dashed hover:opacity-100'
      )}
      style={{
        top: `${topPosition}px`,
        height: `${blockHeight}px`,
        minHeight: '24px',
      }}
      onDoubleClick={onDoubleClick}
    >
      <div className="p-1 h-full flex flex-col">
        <div className="flex items-center gap-1">
          <span className="text-[8px] px-1 py-0.5 rounded bg-indigo-500/30 text-indigo-300 flex-shrink-0">
            ←
          </span>
          <Icon className={cn('h-3 w-3 flex-shrink-0', config.textColor)} />
          <span className={cn('text-[10px] font-medium truncate', config.textColor)}>
            {block.title || config.label}
          </span>
        </div>
        <p className="text-[9px] text-white/50 mt-auto">
          ← {DAY_SHORT_LABELS[sourceDay]} {formatTime(block.start_time)} - {formatTime(block.end_time)}
        </p>
      </div>
    </div>
  );
}

// Short day labels for overnight continuation
const DAY_SHORT_LABELS_INTERNAL: Record<DayOfWeek, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

// Draggable Block Component for simple list view
function DraggableBlock({
  block,
  isEditing,
  onBlockClick,
  formatTime,
}: {
  block: CEOPremiumBlock;
  isEditing: boolean;
  onBlockClick: () => void;
  formatTime: (time: string) => string;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: block.id,
    disabled: !isEditing,
  });

  const config = BLOCK_TYPE_CONFIG[block.block_type];
  const Icon = config.icon;

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'w-full p-2 rounded text-left border transition-all',
        config.bgColor,
        config.borderColor,
        isDragging ? 'opacity-50 scale-105 z-50' : 'hover:scale-[1.02]',
        isEditing && 'cursor-grab active:cursor-grabbing'
      )}
      onClick={onBlockClick}
      {...(isEditing ? { ...listeners, ...attributes } : {})}
    >
      <div className="flex items-center gap-1 mb-1">
        {isEditing && (
          <GripVertical className="h-3 w-3 text-white/30 flex-shrink-0" />
        )}
        <Icon className={cn('h-3 w-3', config.textColor)} />
        <span className={cn('text-xs font-medium truncate', config.textColor)}>
          {block.title || config.label}
        </span>
      </div>
      <p className="text-[10px] text-white/50">{formatTime(block.start_time)}</p>
    </div>
  );
}

// Droppable Day Column Component for simple list view
function DroppableDay({
  day,
  children,
  isEditing,
}: {
  day: DayOfWeek;
  children: React.ReactNode;
  isEditing: boolean;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: day,
    disabled: !isEditing,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'border border-t-0 border-mi-cyan/10 rounded-b-lg p-1 space-y-1 min-h-[260px] transition-colors',
        isOver && isEditing && 'bg-mi-cyan/10 border-mi-cyan/40'
      )}
    >
      {children}
    </div>
  );
}

export function BlueprintWeekSection({
  schedule,
  activePolicy,
  onSave,
  onAddBlock,
  onUpdateBlock,
  onRemoveBlock,
  isSaving,
}: BlueprintWeekSectionProps) {
  // Mobile detection
  const isMobile = useIsMobile();

  const [localSchedule, setLocalSchedule] = useState<CEOPremiumSchedule>(
    schedule || DEFAULT_PREMIUM_SCHEDULE
  );
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('monday');
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('week');
  const [activeBlock, setActiveBlock] = useState<{ block: CEOPremiumBlock; sourceDay: DayOfWeek } | null>(null);

  // New block form state
  const [newBlock, setNewBlock] = useState<CEOPremiumBlock>(createEmptyPremiumBlock('strategic'));

  // DnD sensors - require some movement before starting drag
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Note: Week View is the default for all devices
  // Mobile users can manually switch to Day View if needed via the view toggle

  // Sync with props when they change
  useMemo(() => {
    if (schedule) {
      setLocalSchedule(schedule);
    }
  }, [schedule]);

  // Block type categories for stats
  const BLOCK_CATEGORIES = {
    work: ['strategic', 'work', 'business'] as PremiumBlockType[],
    personal: ['morning_routine', 'evening_routine', 'fitness', 'connection', 'church', 'date_night', 'eat', 'fun', 'relax'] as PremiumBlockType[],
    buffer: ['buffer'] as PremiumBlockType[],
    rest: ['breakout', 'sleep'] as PremiumBlockType[],
  };

  // Calculate weekly stats - Grouped by category
  const weeklyStats = useMemo(() => {
    let workHours = 0;
    let personalHours = 0;
    let bufferHours = 0;
    let restHours = 0;

    DAYS_OF_WEEK.forEach((day) => {
      const blocks = localSchedule[day] || [];
      blocks.forEach((block) => {
        const hours = calculateBlockDuration(block.start_time, block.end_time, block.spans_overnight);
        if (BLOCK_CATEGORIES.work.includes(block.block_type)) {
          workHours += hours;
        } else if (BLOCK_CATEGORIES.personal.includes(block.block_type)) {
          personalHours += hours;
        } else if (BLOCK_CATEGORIES.buffer.includes(block.block_type)) {
          bufferHours += hours;
        } else if (BLOCK_CATEGORIES.rest.includes(block.block_type)) {
          restHours += hours;
        }
      });
    });

    return {
      work: Math.round(workHours * 10) / 10,
      personal: Math.round(personalHours * 10) / 10,
      buffer: Math.round(bufferHours * 10) / 10,
      rest: Math.round(restHours * 10) / 10,
      total: Math.round((workHours + personalHours + bufferHours + restHours) * 10) / 10,
    };
  }, [localSchedule]);

  // Calculate block duration in hours (handles overnight blocks)
  function calculateBlockDuration(startTime: string, endTime: string, spansOvernight?: boolean): number {
    if (!startTime || !endTime) return 0;
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    let endMinutes = endH * 60 + endM;

    // If block spans overnight, add 24 hours to end time
    if (spansOvernight || endMinutes < startMinutes) {
      endMinutes += 24 * 60;
    }

    return (endMinutes - startMinutes) / 60;
  }

  // Format time for display
  function formatTime(time: string): string {
    if (!time) return '';
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  // Get blocks for selected day, sorted by start time
  const dayBlocks = useMemo(() => {
    const blocks = localSchedule[selectedDay] || [];
    return [...blocks].sort((a, b) => {
      const [aH, aM] = a.start_time.split(':').map(Number);
      const [bH, bM] = b.start_time.split(':').map(Number);
      return aH * 60 + aM - (bH * 60 + bM);
    });
  }, [localSchedule, selectedDay]);

  // Get coverage targets for linking
  const coverageTargets = activePolicy?.coverage_targets || [];

  // Handle preferences update
  const updatePreferences = (field: string, value: any) => {
    setLocalSchedule((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, [field]: value },
    }));
    setHasChanges(true);
  };

  // Handle adding a new block
  const handleAddBlock = async () => {
    if (!newBlock.title) return;

    const blockToAdd = { ...newBlock, id: crypto.randomUUID() };
    setLocalSchedule((prev) => ({
      ...prev,
      [selectedDay]: [...(prev[selectedDay] || []), blockToAdd],
    }));

    try {
      await onAddBlock(selectedDay, blockToAdd);
    } catch (error) {
      // Revert on error
      setLocalSchedule((prev) => ({
        ...prev,
        [selectedDay]: prev[selectedDay].filter((b) => b.id !== blockToAdd.id),
      }));
    }

    setNewBlock(createEmptyPremiumBlock('strategic'));
    setShowAddBlock(false);
  };

  // Handle removing a block - searches across all days if not found in selectedDay
  const handleRemoveBlock = async (blockId: string) => {
    // First try to find in selected day
    let blockToRemove = localSchedule[selectedDay]?.find((b) => b.id === blockId);
    let blockDay: DayOfWeek = selectedDay;

    // If not found, search all days
    if (!blockToRemove) {
      for (const day of DAYS_OF_WEEK) {
        const found = localSchedule[day]?.find((b) => b.id === blockId);
        if (found) {
          blockToRemove = found;
          blockDay = day;
          break;
        }
      }
    }

    if (!blockToRemove) return;

    setLocalSchedule((prev) => ({
      ...prev,
      [blockDay]: prev[blockDay].filter((b) => b.id !== blockId),
    }));

    try {
      await onRemoveBlock(blockDay, blockId);
    } catch (error) {
      // Revert on error
      setLocalSchedule((prev) => ({
        ...prev,
        [blockDay]: [...prev[blockDay], blockToRemove!],
      }));
    }
  };

  // Handle updating a block - searches across all days if not found in selectedDay
  const handleUpdateBlock = async (blockId: string, updates: Partial<CEOPremiumBlock>) => {
    // First try to find in selected day
    let currentBlock = localSchedule[selectedDay]?.find((b) => b.id === blockId);
    let blockDay: DayOfWeek = selectedDay;

    // If not found, search all days (handles edge case when switching views)
    if (!currentBlock) {
      for (const day of DAYS_OF_WEEK) {
        const found = localSchedule[day]?.find((b) => b.id === blockId);
        if (found) {
          currentBlock = found;
          blockDay = day;
          break;
        }
      }
    }

    if (!currentBlock) return;

    setLocalSchedule((prev) => ({
      ...prev,
      [blockDay]: prev[blockDay].map((b) =>
        b.id === blockId ? { ...b, ...updates } : b
      ),
    }));

    try {
      await onUpdateBlock(blockDay, blockId, updates);
    } catch (error) {
      // Revert on error
      setLocalSchedule((prev) => ({
        ...prev,
        [blockDay]: prev[blockDay].map((b) =>
          b.id === blockId ? currentBlock : b
        ),
      }));
    }
  };

  // Handle save preferences
  const handleSave = async () => {
    await onSave(localSchedule);
    setHasChanges(false);
  };

  // Navigate days
  const navigateDay = (direction: 'prev' | 'next') => {
    const currentIndex = DAYS_OF_WEEK.indexOf(selectedDay);
    if (direction === 'prev' && currentIndex > 0) {
      setSelectedDay(DAYS_OF_WEEK[currentIndex - 1]);
    } else if (direction === 'next' && currentIndex < DAYS_OF_WEEK.length - 1) {
      setSelectedDay(DAYS_OF_WEEK[currentIndex + 1]);
    }
  };

  // DnD: Find block and its source day
  const findBlockById = useCallback((blockId: string): { block: CEOPremiumBlock; day: DayOfWeek } | null => {
    for (const day of DAYS_OF_WEEK) {
      const block = localSchedule[day]?.find((b) => b.id === blockId);
      if (block) {
        return { block, day };
      }
    }
    return null;
  }, [localSchedule]);

  // DnD: Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const blockId = active.id as string;
    const found = findBlockById(blockId);
    if (found) {
      setActiveBlock({ block: found.block, sourceDay: found.day });
    }
  };

  // DnD: Handle drag end - move block between days
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveBlock(null);

    if (!over || !active) return;

    const blockId = active.id as string;
    const targetDayId = over.id as string;

    // Check if target is a day (droppable area)
    if (!DAYS_OF_WEEK.includes(targetDayId as DayOfWeek)) return;

    const found = findBlockById(blockId);
    if (!found) return;

    const sourceDay = found.day;
    const targetDay = targetDayId as DayOfWeek;

    // If dropped on same day, no change needed
    if (sourceDay === targetDay) return;

    // Move block from source day to target day
    const blockToMove = found.block;

    // Update local state optimistically
    setLocalSchedule((prev) => ({
      ...prev,
      [sourceDay]: prev[sourceDay].filter((b) => b.id !== blockId),
      [targetDay]: [...(prev[targetDay] || []), blockToMove],
    }));
    setHasChanges(true);

    // Call parent handlers to persist the change
    try {
      await onRemoveBlock(sourceDay, blockId);
      await onAddBlock(targetDay, blockToMove);
    } catch (error) {
      // Revert on error
      setLocalSchedule((prev) => ({
        ...prev,
        [sourceDay]: [...(prev[sourceDay] || []), blockToMove],
        [targetDay]: prev[targetDay].filter((b) => b.id !== blockId),
      }));
    }
  };

  // Time Grid: Handle resize (change end time)
  const handleTimeGridResize = useCallback((blockId: string, day: DayOfWeek, newEndTime: string) => {
    setLocalSchedule((prev) => ({
      ...prev,
      [day]: prev[day].map((b) =>
        b.id === blockId ? { ...b, end_time: newEndTime } : b
      ),
    }));
    setHasChanges(true);
  }, []);

  // Time Grid: Handle drag move (change start time and possibly day)
  const handleTimeGridDragMove = useCallback(async (
    blockId: string,
    sourceDay: DayOfWeek,
    targetDay: DayOfWeek,
    newStartTime: string
  ) => {
    const block = localSchedule[sourceDay]?.find((b) => b.id === blockId);
    if (!block) return;

    // Calculate new end time maintaining duration
    const [oldStartH, oldStartM] = block.start_time.split(':').map(Number);
    const [oldEndH, oldEndM] = block.end_time.split(':').map(Number);
    const duration = (oldEndH * 60 + oldEndM) - (oldStartH * 60 + oldStartM);

    const [newStartH, newStartM] = newStartTime.split(':').map(Number);
    let newEndMinutes = newStartH * 60 + newStartM + duration;
    // Clamp to max 23:59
    newEndMinutes = Math.min(23 * 60 + 59, newEndMinutes);
    const newEndH = Math.floor(newEndMinutes / 60);
    const newEndM = newEndMinutes % 60;
    const newEndTime = clampTimeString(newEndH, newEndM);

    if (sourceDay === targetDay) {
      // Same day - just update times
      setLocalSchedule((prev) => ({
        ...prev,
        [sourceDay]: prev[sourceDay].map((b) =>
          b.id === blockId ? { ...b, start_time: newStartTime, end_time: newEndTime } : b
        ),
      }));
    } else {
      // Different day - move block
      const updatedBlock = { ...block, start_time: newStartTime, end_time: newEndTime };
      setLocalSchedule((prev) => ({
        ...prev,
        [sourceDay]: prev[sourceDay].filter((b) => b.id !== blockId),
        [targetDay]: [...(prev[targetDay] || []), updatedBlock],
      }));
    }
    setHasChanges(true);
  }, [localSchedule]);

  // Generate time labels for time grid
  const timeLabels = useMemo(() => {
    const labels = [];
    for (let hour = START_HOUR; hour <= END_HOUR; hour++) {
      const displayHour = hour % 12 || 12;
      const period = hour >= 12 ? 'PM' : 'AM';
      labels.push({ hour, label: `${displayHour} ${period}` });
    }
    return labels;
  }, []);

  // Handle click on empty time grid area to create new block
  const [isCreatingBlock, setIsCreatingBlock] = useState(false);
  const [creatingDay, setCreatingDay] = useState<DayOfWeek | null>(null);
  const [creatingStartY, setCreatingStartY] = useState(0);
  const [creatingStartTime, setCreatingStartTime] = useState('');
  const [creatingEndTime, setCreatingEndTime] = useState('');
  const timeGridRef = useRef<HTMLDivElement>(null);

  // Convert Y position to time
  const yToTime = useCallback((y: number, gridTop: number): string => {
    const relativeY = y - gridTop;
    const minutes = Math.round((relativeY / HOUR_HEIGHT) * 60 / 15) * 15; // Snap to 15 min
    const totalMinutes = START_HOUR * 60 + Math.max(0, Math.min(TOTAL_HOURS * 60, minutes));
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    // Clamp to valid HTML time range (max 23:59)
    return clampTimeString(hours, mins);
  }, []);

  // Handle mousedown on time grid to start creating a block
  const handleTimeGridMouseDown = useCallback((e: React.MouseEvent, day: DayOfWeek) => {
    // Only start if clicking on empty area (not on a block)
    if ((e.target as HTMLElement).closest('[data-block]')) return;

    const gridRect = e.currentTarget.getBoundingClientRect();
    const startTime = yToTime(e.clientY, gridRect.top);

    setIsCreatingBlock(true);
    setCreatingDay(day);
    setCreatingStartY(e.clientY);
    setCreatingStartTime(startTime);
    setCreatingEndTime(startTime);
  }, [yToTime]);

  // Handle drag while creating block
  useEffect(() => {
    if (!isCreatingBlock || !creatingDay) return;

    const handleMouseMove = (e: MouseEvent) => {
      const gridEl = document.querySelector(`[data-day="${creatingDay}"]`);
      if (!gridEl) return;

      const gridRect = gridEl.getBoundingClientRect();
      const endTime = yToTime(e.clientY, gridRect.top);

      // Ensure end time is after start time
      const [startH, startM] = creatingStartTime.split(':').map(Number);
      const [endH, endM] = endTime.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      if (endMinutes > startMinutes) {
        setCreatingEndTime(endTime);
      } else if (endMinutes < startMinutes) {
        // Allow dragging upward
        setCreatingStartTime(endTime);
        setCreatingEndTime(creatingStartTime);
      }
    };

    const handleMouseUp = async () => {
      if (creatingDay && creatingStartTime && creatingEndTime) {
        const [startH, startM] = creatingStartTime.split(':').map(Number);
        const [endH, endM] = creatingEndTime.split(':').map(Number);
        const duration = (endH * 60 + endM) - (startH * 60 + startM);

        // Only create if dragged for at least 15 minutes
        if (duration >= 15) {
          const newBlockToCreate = {
            ...createEmptyPremiumBlock('strategic'),
            id: crypto.randomUUID(),
            start_time: creatingStartTime,
            end_time: creatingEndTime,
            title: 'New Block',
          };

          setLocalSchedule((prev) => ({
            ...prev,
            [creatingDay]: [...(prev[creatingDay] || []), newBlockToCreate],
          }));
          setHasChanges(true);

          // Open edit dialog for the new block
          setSelectedDay(creatingDay);
          setEditingBlockId(newBlockToCreate.id);
          setShowAddBlock(false);
        }
      }

      setIsCreatingBlock(false);
      setCreatingDay(null);
      setCreatingStartTime('');
      setCreatingEndTime('');
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isCreatingBlock, creatingDay, creatingStartTime, creatingEndTime, yToTime]);

  // Handle tap on time grid (mobile) - creates a 1-hour block at tapped position
  const handleTimeGridTap = useCallback((e: React.TouchEvent | React.MouseEvent, day: DayOfWeek) => {
    // Only allow tap-to-create when in edit mode
    if (!isEditing) return;

    // Don't create if tapping on an existing block
    if ((e.target as HTMLElement).closest('[data-block]')) return;

    const gridRect = e.currentTarget.getBoundingClientRect();
    const clientY = 'touches' in e ? e.touches[0]?.clientY ?? e.changedTouches[0]?.clientY : e.clientY;
    const startTime = yToTime(clientY, gridRect.top);

    // Calculate end time (1 hour later, capped at END_HOUR)
    const [startH, startM] = startTime.split(':').map(Number);
    let endH = startH + 1;
    let endM = startM;

    // Cap at END_HOUR (23:00 by default)
    if (endH >= END_HOUR) {
      endH = END_HOUR;
      endM = 0;
    }
    const endTime = clampTimeString(endH, endM);

    // Create the new block
    const newBlockToCreate = {
      ...createEmptyPremiumBlock('strategic'),
      id: crypto.randomUUID(),
      start_time: startTime,
      end_time: endTime,
      title: 'New Block',
    };

    setLocalSchedule((prev) => ({
      ...prev,
      [day]: [...(prev[day] || []), newBlockToCreate],
    }));
    setHasChanges(true);

    // Open edit dialog for the new block
    setSelectedDay(day);
    setEditingBlockId(newBlockToCreate.id);
    setViewMode('day');
  }, [isEditing, yToTime]);

  // Handle save after drag/resize ends
  const handleDragResizeEnd = useCallback(() => {
    setHasChanges(true);
  }, []);

  // Handle double-click on block to edit
  const handleBlockDoubleClick = useCallback((block: CEOPremiumBlock, day: DayOfWeek) => {
    setSelectedDay(day);
    setEditingBlockId(block.id);
    setViewMode('day'); // Switch to day view for editing
  }, []);

  // Render block type selector - Grid layout for 15 block types (scrollable on mobile)
  const renderBlockTypeSelector = (
    value: PremiumBlockType,
    onChange: (type: PremiumBlockType) => void
  ) => (
    <div className="space-y-2">
      <Label className="text-white/70 text-xs">Block Type</Label>
      {/* Scrollable container on mobile to prevent layout issues */}
      <div className="max-h-[180px] sm:max-h-none overflow-y-auto sm:overflow-visible p-1 -m-1">
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
          {(Object.keys(BLOCK_TYPE_CONFIG) as PremiumBlockType[]).map((type) => {
            const config = BLOCK_TYPE_CONFIG[type];
            const Icon = config.icon;
            return (
              <button
                key={type}
                type="button"
                onClick={() => onChange(type)}
                className={cn(
                  'flex flex-col items-center gap-1 p-2 rounded-lg border transition-all text-center min-h-[56px]',
                  value === type
                    ? cn(config.bgColor, config.borderColor, config.textColor, 'ring-2 ring-offset-1 ring-offset-mi-navy')
                    : 'border-mi-cyan/20 text-white/50 hover:border-mi-cyan/40 hover:text-white/70'
                )}
                style={value === type ? { ringColor: 'currentColor' } : undefined}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs leading-tight">{config.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  // Render time block card
  const renderBlockCard = (block: CEOPremiumBlock) => {
    const config = BLOCK_TYPE_CONFIG[block.block_type];
    const Icon = config.icon;
    const isEditingThis = editingBlockId === block.id;
    const linkedTarget = coverageTargets.find((t) => t.id === block.linked_target_id);
    const duration = calculateBlockDuration(block.start_time, block.end_time);

    return (
      <div
        key={block.id}
        className={cn(
          'p-4 rounded-lg border transition-all',
          config.bgColor,
          config.borderColor
        )}
      >
        {isEditingThis ? (
          // Edit mode
          <div className="space-y-3">
            <Input
              value={block.title}
              onChange={(e) => handleUpdateBlock(block.id, { title: e.target.value })}
              placeholder="Block title..."
              className="bg-mi-navy border-mi-cyan/30 text-white"
            />
            <div className="flex gap-2">
              <div className="flex-1 space-y-1">
                <Label className="text-white/70 text-xs">Start</Label>
                <Input
                  type="time"
                  value={block.start_time}
                  onChange={(e) => handleUpdateBlock(block.id, { start_time: e.target.value })}
                  className="bg-mi-navy border-mi-cyan/30 text-white"
                />
              </div>
              <div className="flex-1 space-y-1">
                <Label className="text-white/70 text-xs">End</Label>
                <Input
                  type="time"
                  value={block.end_time}
                  onChange={(e) => handleUpdateBlock(block.id, { end_time: e.target.value })}
                  className="bg-mi-navy border-mi-cyan/30 text-white"
                />
              </div>
            </div>
            {/* Overnight toggle - especially useful for sleep blocks */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={block.spans_overnight || false}
                onChange={(e) => handleUpdateBlock(block.id, { spans_overnight: e.target.checked })}
                className="w-4 h-4 rounded border-mi-cyan/30 bg-mi-navy text-mi-cyan focus:ring-mi-cyan/50"
              />
              <span className="text-sm text-white/70">
                Spans overnight (ends next day)
              </span>
              <Moon className="h-4 w-4 text-indigo-400" />
            </label>
            {renderBlockTypeSelector(block.block_type, (type) =>
              handleUpdateBlock(block.id, { block_type: type })
            )}
            {block.block_type === 'strategic' && coverageTargets.length > 0 && (
              <div className="space-y-1">
                <Label className="text-white/70 text-xs">Link to Coverage Target</Label>
                <select
                  value={block.linked_target_id || ''}
                  onChange={(e) =>
                    handleUpdateBlock(block.id, {
                      linked_target_id: e.target.value || undefined,
                    })
                  }
                  className="w-full h-9 rounded-md border border-mi-cyan/30 bg-mi-navy text-white px-3 text-sm"
                >
                  <option value="">No target linked</option>
                  {coverageTargets.map((target) => (
                    <option key={target.id} value={target.id}>
                      {target.title || `Target ${target.order}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <Input
              value={block.notes || ''}
              onChange={(e) => handleUpdateBlock(block.id, { notes: e.target.value })}
              placeholder="Notes (optional)..."
              className="bg-mi-navy border-mi-cyan/30 text-white text-sm"
            />
            {/* Touch-friendly buttons: min 44x44px tap target on mobile */}
            <div className="flex justify-end gap-2 sm:gap-2 mt-2">
              <Button
                variant="ghost"
                onClick={() => handleRemoveBlock(block.id)}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 sm:h-9 sm:px-3"
              >
                <Trash2 className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="ml-1 hidden sm:inline">Delete</span>
              </Button>
              <Button
                onClick={() => setEditingBlockId(null)}
                className="bg-mi-cyan hover:bg-mi-cyan/90 text-mi-navy min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 sm:h-9 sm:px-3"
              >
                <Check className="h-5 w-5 sm:hidden" />
                <span className="hidden sm:inline">Done</span>
              </Button>
            </div>
          </div>
        ) : (
          // View mode
          <div
            className="cursor-pointer"
            onClick={() => isEditing && setEditingBlockId(block.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'p-2 rounded-lg',
                    config.bgColor.replace('/20', '/40'),
                    config.borderColor
                  )}
                >
                  <Icon className={cn('h-4 w-4', config.textColor)} />
                </div>
                <div>
                  <p className={cn('font-medium', config.textColor)}>
                    {block.title || 'Untitled Block'}
                  </p>
                  <p className="text-xs text-white/50">
                    {formatTime(block.start_time)} - {formatTime(block.end_time)}
                    <span className="ml-2 text-white/40">({duration}h)</span>
                  </p>
                </div>
              </div>
              <Badge className={cn('text-xs', config.bgColor, config.textColor, config.borderColor)}>
                {config.label}
              </Badge>
            </div>
            {linkedTarget && (
              <div className="mt-2 flex items-center gap-2 text-xs text-white/50">
                <Link2 className="h-3 w-3" />
                <span>{linkedTarget.title || `Target ${linkedTarget.order}`}</span>
              </div>
            )}
            {block.notes && (
              <p className="mt-2 text-xs text-white/40 italic">{block.notes}</p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-mi-navy-light border-mi-cyan/20">
        <CardHeader className="pb-4">
          {/* Mobile-responsive header with flex-wrap */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-mi-cyan/20 to-mi-cyan/5 border border-mi-cyan/30">
                <Calendar className="h-6 w-6 text-mi-cyan" />
              </div>
              <div>
                <CardTitle className="text-lg text-white">Premium Schedule</CardTitle>
                <CardDescription className="text-white/50 text-sm">
                  {isMobile ? 'Model week' : 'Model week for executing premium payments'}
                </CardDescription>
              </div>
            </div>
            {/* Desktop buttons - hidden on mobile (FAB replaces these) */}
            <div className="hidden sm:flex items-center gap-2">
              {hasChanges && (
                <Badge className="bg-mi-gold/20 text-mi-gold border-mi-gold/30">
                  Unsaved Changes
                </Badge>
              )}
              <Button
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="bg-mi-cyan/20 border border-mi-cyan/50 text-mi-cyan hover:bg-mi-cyan/30"
              >
                {isEditing ? 'Done Editing' : 'Edit Schedule'}
              </Button>
              {hasChanges && (
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-mi-cyan hover:bg-mi-cyan/90 text-mi-navy"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Weekly Stats - Mobile responsive: 2 cols on mobile, 5 on desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 rounded-lg bg-mi-gold/10 border border-mi-gold/20">
              <div className="flex items-center gap-1 sm:gap-2 mb-1">
                <Briefcase className="h-3 w-3 sm:h-4 sm:w-4 text-mi-gold" />
                <span className="text-[10px] sm:text-xs text-white/70">Work</span>
              </div>
              <p className="text-lg sm:text-xl font-bold text-mi-gold">{weeklyStats.work}h</p>
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-pink-500/10 border border-pink-500/20">
              <div className="flex items-center gap-1 sm:gap-2 mb-1">
                <Users className="h-3 w-3 sm:h-4 sm:w-4 text-pink-400" />
                <span className="text-[10px] sm:text-xs text-white/70">Personal</span>
              </div>
              <p className="text-lg sm:text-xl font-bold text-pink-400">{weeklyStats.personal}h</p>
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center gap-1 sm:gap-2 mb-1">
                <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400" />
                <span className="text-[10px] sm:text-xs text-white/70">Buffer</span>
              </div>
              <p className="text-lg sm:text-xl font-bold text-blue-400">{weeklyStats.buffer}h</p>
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-1 sm:gap-2 mb-1">
                <Coffee className="h-3 w-3 sm:h-4 sm:w-4 text-green-400" />
                <span className="text-[10px] sm:text-xs text-white/70">Rest</span>
              </div>
              <p className="text-lg sm:text-xl font-bold text-green-400">{weeklyStats.rest}h</p>
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-mi-cyan/10 border border-mi-cyan/20 col-span-2 sm:col-span-1">
              <div className="flex items-center gap-1 sm:gap-2 mb-1">
                <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 text-mi-cyan" />
                <span className="text-[10px] sm:text-xs text-white/70">Total</span>
              </div>
              <p className="text-lg sm:text-xl font-bold text-mi-cyan">{weeklyStats.total}h</p>
            </div>
          </div>

          {/* Preferences (when editing) */}
          {isEditing && (
            <div className="p-4 rounded-lg bg-mi-navy border border-mi-cyan/10 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="h-4 w-4 text-mi-cyan" />
                <span className="text-sm font-medium text-white/70">Schedule Preferences</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="space-y-1">
                  <Label className="text-white/70 text-xs">Strategic/Day</Label>
                  <Input
                    type="number"
                    value={localSchedule.preferences.strategic_blocks_per_day}
                    onChange={(e) =>
                      updatePreferences('strategic_blocks_per_day', parseInt(e.target.value) || 0)
                    }
                    className="bg-mi-navy-light border-mi-cyan/30 text-white"
                    min={0}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-white/70 text-xs">Buffer/Day</Label>
                  <Input
                    type="number"
                    value={localSchedule.preferences.buffer_blocks_per_day}
                    onChange={(e) =>
                      updatePreferences('buffer_blocks_per_day', parseInt(e.target.value) || 0)
                    }
                    className="bg-mi-navy-light border-mi-cyan/30 text-white"
                    min={0}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-white/70 text-xs">Buffer Time</Label>
                  <Input
                    type="number"
                    value={localSchedule.preferences.buffer_time_minutes}
                    onChange={(e) =>
                      updatePreferences('buffer_time_minutes', parseInt(e.target.value) || 0)
                    }
                    className="bg-mi-navy-light border-mi-cyan/30 text-white"
                    min={0}
                    placeholder="minutes"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-white/70 text-xs">Work Start</Label>
                  <Input
                    type="time"
                    value={localSchedule.preferences.work_start_time}
                    onChange={(e) => updatePreferences('work_start_time', e.target.value)}
                    className="bg-mi-navy-light border-mi-cyan/30 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-white/70 text-xs">Work End</Label>
                  <Input
                    type="time"
                    value={localSchedule.preferences.work_end_time}
                    onChange={(e) => updatePreferences('work_end_time', e.target.value)}
                    className="bg-mi-navy-light border-mi-cyan/30 text-white"
                  />
                </div>
              </div>
            </div>
          )}
          {/* View Toggle */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => setViewMode('day')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg transition-all',
                viewMode === 'day'
                  ? 'bg-mi-cyan text-mi-navy font-medium'
                  : 'text-white/50 hover:text-white hover:bg-mi-cyan/10'
              )}
            >
              <CalendarDays className="h-4 w-4" />
              <span>Day View</span>
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg transition-all',
                viewMode === 'week'
                  ? 'bg-mi-cyan text-mi-navy font-medium'
                  : 'text-white/50 hover:text-white hover:bg-mi-cyan/10'
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              <span>Week View</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Week View - Time Grid with Drag & Resize */}
      {viewMode === 'week' && (
        <Card className="bg-mi-navy-light border-mi-cyan/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Weekly Time Grid</CardTitle>
                <CardDescription className="text-mi-cyan/70 text-xs mt-1">
                  <GripVertical className="h-3 w-3 inline mr-1" />
                  Drag to move • Drag bottom edge to resize • Click & drag empty area to create
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {hasChanges && (
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-mi-cyan hover:bg-mi-cyan/90 text-mi-navy"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto relative">
            {/* Time Grid Container */}
            <div ref={timeGridRef} className="flex min-w-[800px] relative">
              {/* Time Labels Column */}
              <div className="w-16 flex-shrink-0 border-r border-mi-cyan/10">
                <div className="h-10" /> {/* Header spacer */}
                <div style={{ height: `${TOTAL_HOURS * HOUR_HEIGHT}px` }} className="relative">
                  {timeLabels.map(({ hour, label }) => (
                    <div
                      key={hour}
                      className="absolute left-0 right-0 text-[10px] text-white/40 text-right pr-2 -translate-y-2"
                      style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT}px` }}
                    >
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Day Columns */}
              <div className="flex-1 grid grid-cols-7 relative">
                {/* Current time indicator - spans across all days */}
                {(() => {
                  const now = new Date();
                  const currentHour = now.getHours();
                  const currentMinute = now.getMinutes();
                  if (currentHour >= START_HOUR && currentHour < END_HOUR) {
                    const position = ((currentHour - START_HOUR) * 60 + currentMinute) / 60 * HOUR_HEIGHT + 40; // +40 for header
                    return (
                      <div
                        className="absolute left-0 right-0 border-t-2 border-red-500 pointer-events-none z-40"
                        style={{ top: `${position}px` }}
                      >
                        <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-red-500" />
                      </div>
                    );
                  }
                  return null;
                })()}

                {DAYS_OF_WEEK.map((day) => {
                  const blocks = localSchedule[day] || [];

                  return (
                    <div key={day} className="border-r border-mi-cyan/10 last:border-r-0">
                      {/* Day Header */}
                      <button
                        onClick={() => {
                          setSelectedDay(day);
                          setViewMode('day');
                        }}
                        className="w-full h-10 bg-mi-navy border-b border-mi-cyan/20 text-center hover:bg-mi-cyan/10 transition-all"
                      >
                        <span className="text-sm font-medium text-white">
                          {DAY_SHORT_LABELS[day]}
                        </span>
                        <span className="text-xs text-white/40 ml-1">
                          ({blocks.length})
                        </span>
                      </button>

                      {/* Time Grid for Day - Click/Tap to create */}
                      <div
                        data-day={day}
                        className="relative cursor-crosshair"
                        style={{ height: `${TOTAL_HOURS * HOUR_HEIGHT}px` }}
                        onMouseDown={(e) => handleTimeGridMouseDown(e, day)}
                        onTouchEnd={(e) => {
                          // Prevent double-firing on devices that send both touch and mouse events
                          e.preventDefault();
                          handleTimeGridTap(e, day);
                        }}
                      >
                        {/* Hour grid lines */}
                        {timeLabels.map(({ hour }) => (
                          <div
                            key={hour}
                            className="absolute left-0 right-0 border-t border-mi-cyan/5"
                            style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT}px` }}
                          />
                        ))}

                        {/* Creating block preview */}
                        {isCreatingBlock && creatingDay === day && creatingStartTime && creatingEndTime && (
                          (() => {
                            const [startH, startM] = creatingStartTime.split(':').map(Number);
                            const [endH, endM] = creatingEndTime.split(':').map(Number);
                            const startMinutes = (startH - START_HOUR) * 60 + startM;
                            const endMinutes = (endH - START_HOUR) * 60 + endM;
                            const top = (startMinutes / 60) * HOUR_HEIGHT;
                            const height = Math.max(((endMinutes - startMinutes) / 60) * HOUR_HEIGHT, 12);

                            return (
                              <div
                                className="absolute left-1 right-1 rounded border-2 border-dashed border-mi-cyan bg-mi-cyan/20 z-30 pointer-events-none"
                                style={{ top: `${top}px`, height: `${height}px` }}
                              >
                                <span className="text-[10px] text-mi-cyan p-1">
                                  {formatTime(creatingStartTime)} - {formatTime(creatingEndTime)}
                                </span>
                              </div>
                            );
                          })()
                        )}

                        {/* Time Blocks */}
                        {blocks.map((block) => (
                          <ResizableTimeBlock
                            key={block.id}
                            block={block}
                            day={day}
                            onBlockClick={() => {
                              // Single click - just select (no action needed)
                            }}
                            onDoubleClick={() => handleBlockDoubleClick(block, day)}
                            onResize={handleTimeGridResize}
                            onDragMove={handleTimeGridDragMove}
                            onDragEnd={handleDragResizeEnd}
                            formatTime={formatTime}
                          />
                        ))}

                        {/* Overnight Block Continuations - Show blocks from previous day that extend into this day */}
                        {(() => {
                          const dayIndex = DAYS_OF_WEEK.indexOf(day);
                          if (dayIndex === 0) return null; // Monday has no previous day
                          const previousDay = DAYS_OF_WEEK[dayIndex - 1];
                          const previousBlocks = localSchedule[previousDay] || [];
                          return previousBlocks
                            .filter((block) => {
                              const [startH] = block.start_time.split(':').map(Number);
                              const [endH] = block.end_time.split(':').map(Number);
                              return block.spans_overnight || endH < startH;
                            })
                            .map((block) => (
                              <OvernightContinuationBlock
                                key={`continuation-${block.id}`}
                                block={block}
                                sourceDay={previousDay}
                                onDoubleClick={() => handleBlockDoubleClick(block, previousDay)}
                                formatTime={formatTime}
                              />
                            ));
                        })()}

                        {/* Empty day hint */}
                        {blocks.length === 0 && !isCreatingBlock && isEditing && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-[10px] text-white/20">{isMobile ? 'Tap to add' : 'Drag to create'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Day Schedule - Single day view */}
      {viewMode === 'day' && (
      <Card className="bg-mi-navy-light border-mi-cyan/20">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            {/* Day Navigation - Touch-friendly on mobile */}
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="ghost"
                onClick={() => navigateDay('prev')}
                disabled={selectedDay === 'monday'}
                className="text-white/50 hover:text-white hover:bg-mi-cyan/10 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 sm:h-9 p-2"
              >
                <ChevronLeft className="h-5 w-5 sm:h-4 sm:w-4" />
              </Button>
              <h3 className="text-base sm:text-lg font-semibold text-white min-w-[100px] sm:min-w-[120px] text-center">
                {DAY_LABELS[selectedDay]}
              </h3>
              <Button
                variant="ghost"
                onClick={() => navigateDay('next')}
                disabled={selectedDay === 'sunday'}
                className="text-white/50 hover:text-white hover:bg-mi-cyan/10 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 sm:h-9 p-2"
              >
                <ChevronRight className="h-5 w-5 sm:h-4 sm:w-4" />
              </Button>
            </div>

            {/* Day Tabs */}
            <div className="hidden md:flex items-center gap-1">
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                    selectedDay === day
                      ? 'bg-mi-cyan text-mi-navy'
                      : 'text-white/50 hover:text-white hover:bg-mi-cyan/10'
                  )}
                >
                  {DAY_SHORT_LABELS[day]}
                </button>
              ))}
            </div>

            {/* Add Block Button - hidden on mobile (FAB replaces it) */}
            {isEditing && !isMobile && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddBlock(true)}
                className="border-mi-cyan/30 text-mi-cyan hover:bg-mi-cyan/10"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Block
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Block Form */}
          {showAddBlock && (
            <div className="p-4 rounded-lg bg-mi-navy border border-mi-cyan/20 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">New Time Block</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAddBlock(false);
                    setNewBlock(createEmptyPremiumBlock('strategic'));
                  }}
                  className="text-white/50 hover:text-white"
                >
                  Cancel
                </Button>
              </div>
              <Input
                value={newBlock.title}
                onChange={(e) => setNewBlock((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Block title..."
                className="bg-mi-navy-light border-mi-cyan/30 text-white"
              />
              <div className="flex gap-2">
                <div className="flex-1 space-y-1">
                  <Label className="text-white/70 text-xs">Start Time</Label>
                  <Input
                    type="time"
                    value={newBlock.start_time}
                    onChange={(e) => setNewBlock((prev) => ({ ...prev, start_time: e.target.value }))}
                    className="bg-mi-navy-light border-mi-cyan/30 text-white"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <Label className="text-white/70 text-xs">End Time</Label>
                  <Input
                    type="time"
                    value={newBlock.end_time}
                    onChange={(e) => setNewBlock((prev) => ({ ...prev, end_time: e.target.value }))}
                    className="bg-mi-navy-light border-mi-cyan/30 text-white"
                  />
                </div>
              </div>
              {/* Overnight toggle for new blocks */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newBlock.spans_overnight || false}
                  onChange={(e) => setNewBlock((prev) => ({ ...prev, spans_overnight: e.target.checked }))}
                  className="w-4 h-4 rounded border-mi-cyan/30 bg-mi-navy text-mi-cyan focus:ring-mi-cyan/50"
                />
                <span className="text-sm text-white/70">
                  Spans overnight (ends next day)
                </span>
                <Moon className="h-4 w-4 text-indigo-400" />
              </label>
              {renderBlockTypeSelector(newBlock.block_type, (type) =>
                setNewBlock((prev) => ({ ...prev, block_type: type }))
              )}
              {newBlock.block_type === 'strategic' && coverageTargets.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-white/70 text-xs">Link to Coverage Target (optional)</Label>
                  <select
                    value={newBlock.linked_target_id || ''}
                    onChange={(e) =>
                      setNewBlock((prev) => ({
                        ...prev,
                        linked_target_id: e.target.value || undefined,
                      }))
                    }
                    className="w-full h-9 rounded-md border border-mi-cyan/30 bg-mi-navy text-white px-3 text-sm"
                  >
                    <option value="">No target linked</option>
                    {coverageTargets.map((target) => (
                      <option key={target.id} value={target.id}>
                        {target.title || `Target ${target.order}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <Input
                value={newBlock.notes || ''}
                onChange={(e) => setNewBlock((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Notes (optional)..."
                className="bg-mi-navy-light border-mi-cyan/30 text-white text-sm"
              />
              {/* Touch-friendly Add Block button */}
              <Button
                onClick={handleAddBlock}
                disabled={!newBlock.title || isSaving}
                className="w-full bg-mi-cyan hover:bg-mi-cyan/90 text-mi-navy min-h-[48px] text-base"
              >
                {isSaving ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Plus className="h-5 w-5 mr-2" />
                    Add Block
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Day Blocks */}
          {dayBlocks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="h-12 w-12 text-mi-cyan/30 mb-4" />
              <p className="text-white/60 mb-2">No blocks scheduled for {DAY_LABELS[selectedDay]}</p>
              <p className="text-sm text-white/40 mb-4">
                {isEditing
                  ? isMobile
                    ? 'Tap the + button to add a time block'
                    : 'Click "Add Block" to create a time block'
                  : isMobile
                    ? 'Tap the pencil button to start editing'
                    : 'Click "Edit Schedule" to add time blocks'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">{dayBlocks.map((block) => renderBlockCard(block))}</div>
          )}

          {/* Day Summary */}
          {dayBlocks.length > 0 && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-mi-navy border border-mi-cyan/10 text-sm">
              <span className="text-white/70">{DAY_LABELS[selectedDay]} Summary</span>
              <div className="flex flex-wrap items-center gap-3 text-white/50">
                <span>
                  <span className="text-mi-gold">{dayBlocks.filter((b) => BLOCK_CATEGORIES.work.includes(b.block_type)).length}</span> Work
                </span>
                <span>
                  <span className="text-pink-400">{dayBlocks.filter((b) => BLOCK_CATEGORIES.personal.includes(b.block_type)).length}</span> Personal
                </span>
                <span>
                  <span className="text-blue-400">{dayBlocks.filter((b) => BLOCK_CATEGORIES.buffer.includes(b.block_type)).length}</span> Buffer
                </span>
                <span>
                  <span className="text-green-400">{dayBlocks.filter((b) => BLOCK_CATEGORIES.rest.includes(b.block_type)).length}</span> Rest
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* Block Type Legend - Grid layout for 15 types */}
      <Card className="bg-mi-navy-light border-mi-cyan/20">
        <CardContent className="py-4">
          <p className="text-xs text-white/50 text-center mb-3">Block Types</p>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
            {(Object.keys(BLOCK_TYPE_CONFIG) as PremiumBlockType[]).map((type) => {
              const config = BLOCK_TYPE_CONFIG[type];
              const Icon = config.icon;
              return (
                <div
                  key={type}
                  className={cn(
                    'flex items-center gap-2 p-2 rounded-lg border',
                    config.bgColor,
                    config.borderColor
                  )}
                >
                  <Icon className={cn('h-4 w-4 flex-shrink-0', config.textColor)} />
                  <span className={cn('text-xs font-medium truncate', config.textColor)}>
                    {config.label}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Mobile Floating Action Buttons (FAB) */}
      {isMobile && (
        <div className="fixed bottom-6 right-4 z-50 flex flex-col gap-3">
          {/* Save button - only show when there are changes */}
          {hasChanges && (
            <Button
              size="lg"
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-full w-14 h-14 shadow-lg bg-mi-gold hover:bg-mi-gold/90 text-mi-navy p-0"
            >
              {isSaving ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <Save className="h-6 w-6" />
              )}
            </Button>
          )}

          {/* Add Block button - only show when editing */}
          {isEditing && (
            <Button
              size="lg"
              onClick={() => {
                // If in Week View, switch to Day View first
                if (viewMode === 'week') {
                  setViewMode('day');
                }
                setShowAddBlock(true);
              }}
              className="rounded-full w-14 h-14 shadow-lg bg-mi-cyan hover:bg-mi-cyan/90 text-mi-navy p-0"
            >
              <Plus className="h-7 w-7" />
            </Button>
          )}

          {/* Edit/Done toggle button */}
          <Button
            size="lg"
            onClick={() => setIsEditing(!isEditing)}
            className={cn(
              'rounded-full w-14 h-14 shadow-lg p-0',
              isEditing
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-mi-cyan/20 border-2 border-mi-cyan text-mi-cyan hover:bg-mi-cyan/30'
            )}
          >
            {isEditing ? <Check className="h-6 w-6" /> : <Edit3 className="h-6 w-6" />}
          </Button>
        </div>
      )}
    </div>
  );
}

export default BlueprintWeekSection;
