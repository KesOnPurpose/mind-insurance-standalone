// ============================================================================
// FEAT-GH-017: Schedule Preview Component
// ============================================================================
// Visual timeline showing when phases unlock for a learner enrolled today
// ============================================================================

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import {
  Eye,
  CalendarIcon,
  Lock,
  Unlock,
  ArrowRight,
  Clock,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { format, addDays, parseISO, isValid, isBefore, isAfter, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import type {
  Phase,
  DripModel,
  CalendarDripSchedule,
  RelativeDripSchedule,
  ProgressPrerequisite,
  DripPreviewItem,
} from '@/types/programs';

// ============================================================================
// Types
// ============================================================================

interface SchedulePreviewProps {
  phases: Phase[];
  dripModel: DripModel;
  calendarSchedule: CalendarDripSchedule[];
  relativeSchedule: RelativeDripSchedule[];
  prerequisites: ProgressPrerequisite[];
  requirePreviousCompletion: boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

const calculatePreview = (
  phases: Phase[],
  dripModel: DripModel,
  calendarSchedule: CalendarDripSchedule[],
  relativeSchedule: RelativeDripSchedule[],
  prerequisites: ProgressPrerequisite[],
  requirePreviousCompletion: boolean,
  enrollmentDate: Date
): DripPreviewItem[] => {
  const sortedPhases = [...phases].sort((a, b) => a.order_index - b.order_index);
  const today = startOfDay(new Date());

  return sortedPhases.map((phase, index) => {
    const isFirstPhase = index === 0;

    // First phase is always unlocked
    if (isFirstPhase) {
      return {
        phase_id: phase.id,
        phase_title: phase.title,
        phase_order: index + 1,
        unlock_date: enrollmentDate,
        unlock_reason: 'Available immediately upon enrollment',
        is_unlocked: true,
      };
    }

    let unlockDate: Date | null = null;
    let unlockReason = '';
    let dependsOn: string | undefined;

    switch (dripModel) {
      case 'calendar': {
        const scheduleItem = calendarSchedule.find((s) => s.phase_id === phase.id);
        if (scheduleItem?.unlock_at) {
          const parsedDate = parseISO(scheduleItem.unlock_at);
          if (isValid(parsedDate)) {
            unlockDate = parsedDate;
            unlockReason = `Unlocks on ${format(parsedDate, 'MMM d, yyyy')} at ${format(parsedDate, 'h:mm a')}`;
          }
        }
        if (!unlockDate) {
          unlockReason = 'No unlock date set';
        }
        break;
      }

      case 'relative': {
        const scheduleItem = relativeSchedule.find((s) => s.phase_id === phase.id);
        const offsetDays = scheduleItem?.offset_days ?? 0;
        unlockDate = addDays(startOfDay(enrollmentDate), offsetDays);
        unlockReason = offsetDays === 0
          ? 'Unlocks immediately after enrollment'
          : `Unlocks ${offsetDays} day${offsetDays !== 1 ? 's' : ''} after enrollment`;
        break;
      }

      case 'progress': {
        if (requirePreviousCompletion) {
          const previousPhase = sortedPhases[index - 1];
          dependsOn = previousPhase?.title;
          unlockReason = `Requires completion of ${previousPhase?.title || 'previous phase'}`;
        } else {
          const prereq = prerequisites.find((p) => p.phase_id === phase.id);
          if (prereq) {
            const prereqPhase = phases.find((p) => p.id === prereq.prerequisite_phase_id);
            dependsOn = prereqPhase?.title;
            unlockReason = `Requires completion of ${prereqPhase?.title || 'prerequisite phase'}`;
          } else {
            unlockReason = 'No prerequisite set';
          }
        }
        break;
      }

      case 'hybrid': {
        // Hybrid combines time-based with progress requirements
        const relativeItem = relativeSchedule.find((s) => s.phase_id === phase.id);
        const offsetDays = relativeItem?.offset_days ?? 0;
        unlockDate = addDays(startOfDay(enrollmentDate), offsetDays);

        if (requirePreviousCompletion) {
          const previousPhase = sortedPhases[index - 1];
          dependsOn = previousPhase?.title;
          unlockReason = offsetDays === 0
            ? `Requires completion of ${previousPhase?.title || 'previous phase'}`
            : `Unlocks ${offsetDays} day${offsetDays !== 1 ? 's' : ''} after enrollment AND requires ${previousPhase?.title || 'previous phase'}`;
        } else {
          unlockReason = offsetDays === 0
            ? 'Unlocks immediately (no time delay)'
            : `Unlocks ${offsetDays} day${offsetDays !== 1 ? 's' : ''} after enrollment`;
        }
        break;
      }

      default:
        unlockReason = 'Inherits program settings';
    }

    const isUnlocked = unlockDate
      ? !isAfter(startOfDay(unlockDate), today)
      : false;

    return {
      phase_id: phase.id,
      phase_title: phase.title,
      phase_order: index + 1,
      unlock_date: unlockDate,
      unlock_reason: unlockReason,
      is_unlocked: isUnlocked,
      depends_on: dependsOn,
    };
  });
};

// ============================================================================
// Preview Item Component
// ============================================================================

interface PreviewItemProps {
  item: DripPreviewItem;
  isLast: boolean;
  dripModel: DripModel;
}

const PreviewItem = ({ item, isLast, dripModel }: PreviewItemProps) => {
  const isProgressBased = dripModel === 'progress' || (dripModel === 'hybrid' && item.depends_on);

  return (
    <div className="relative flex gap-4">
      {/* Timeline Line */}
      {!isLast && (
        <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-border" />
      )}

      {/* Status Icon */}
      <div
        className={cn(
          'relative z-10 h-10 w-10 rounded-full flex items-center justify-center shrink-0',
          item.is_unlocked
            ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
            : 'bg-muted text-muted-foreground'
        )}
      >
        {item.is_unlocked ? (
          <Unlock className="h-5 w-5" />
        ) : isProgressBased ? (
          <TrendingUp className="h-5 w-5" />
        ) : (
          <Lock className="h-5 w-5" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-muted-foreground font-mono">
            Phase {item.phase_order}
          </span>
          {item.is_unlocked && (
            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
              Unlocked
            </Badge>
          )}
        </div>
        <h4 className="font-medium mb-1">{item.phase_title}</h4>
        <p className="text-sm text-muted-foreground">{item.unlock_reason}</p>
        {item.unlock_date && (
          <p className="text-xs text-muted-foreground mt-1">
            <Clock className="inline h-3 w-3 mr-1" />
            {format(item.unlock_date, 'EEEE, MMMM d, yyyy')}
          </p>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const SchedulePreview = ({
  phases,
  dripModel,
  calendarSchedule,
  relativeSchedule,
  prerequisites,
  requirePreviousCompletion,
}: SchedulePreviewProps) => {
  const [enrollmentDate, setEnrollmentDate] = useState<Date>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const previewItems = useMemo(
    () =>
      calculatePreview(
        phases,
        dripModel,
        calendarSchedule,
        relativeSchedule,
        prerequisites,
        requirePreviousCompletion,
        enrollmentDate
      ),
    [phases, dripModel, calendarSchedule, relativeSchedule, prerequisites, requirePreviousCompletion, enrollmentDate]
  );

  const resetToToday = () => {
    setEnrollmentDate(new Date());
  };

  const getDripModelLabel = (model: DripModel): string => {
    switch (model) {
      case 'calendar':
        return 'Calendar-Based';
      case 'relative':
        return 'Relative Days';
      case 'progress':
        return 'Progress-Based';
      case 'hybrid':
        return 'Hybrid';
      default:
        return 'Inherited';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-indigo-500" />
          Schedule Preview
        </CardTitle>
        <CardDescription>
          Preview how content unlocks for a learner enrolled on a specific date
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enrollment Date Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex-1">
            <Label htmlFor="enrollment-date" className="text-sm font-medium">
              Simulated Enrollment Date
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Preview the unlock schedule for a user enrolled on this date
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[180px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(enrollmentDate, 'MMM d, yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={enrollmentDate}
                  onSelect={(date) => {
                    if (date) {
                      setEnrollmentDate(date);
                      setIsCalendarOpen(false);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button
              variant="ghost"
              size="icon"
              onClick={resetToToday}
              title="Reset to today"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Model Indicator */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Active Model:</span>
          <Badge variant="outline">{getDripModelLabel(dripModel)}</Badge>
        </div>

        {/* Timeline */}
        {previewItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No phases to preview. Add phases to see the unlock schedule.</p>
          </div>
        ) : (
          <div className="pt-2">
            {previewItems.map((item, index) => (
              <PreviewItem
                key={item.phase_id}
                item={item}
                isLast={index === previewItems.length - 1}
                dripModel={dripModel}
              />
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {previewItems.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {previewItems.filter((i) => i.is_unlocked).length}
              </p>
              <p className="text-xs text-muted-foreground">Currently Unlocked</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600">
                {previewItems.filter((i) => !i.is_unlocked).length}
              </p>
              <p className="text-xs text-muted-foreground">Locked</p>
            </div>
            <div className="text-center sm:col-span-1 col-span-2">
              <p className="text-2xl font-bold">
                {previewItems.length}
              </p>
              <p className="text-xs text-muted-foreground">Total Phases</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SchedulePreview;
