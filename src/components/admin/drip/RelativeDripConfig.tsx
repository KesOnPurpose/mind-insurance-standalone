// ============================================================================
// FEAT-GH-017: Relative Drip Configuration Component
// ============================================================================
// Days offset table for relative drip scheduling (Phase 1: Day 0, Phase 2: Day 7, etc.)
// ============================================================================

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock, Unlock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Phase, RelativeDripSchedule } from '@/types/programs';

// ============================================================================
// Types
// ============================================================================

interface RelativeDripConfigProps {
  phases: Phase[];
  schedule: RelativeDripSchedule[];
  onChange: (schedule: RelativeDripSchedule[]) => void;
  disabled?: boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

const getScheduleForPhase = (
  schedule: RelativeDripSchedule[],
  phaseId: string
): RelativeDripSchedule | undefined => {
  return schedule.find((s) => s.phase_id === phaseId);
};

const formatDaysText = (days: number): string => {
  if (days === 0) return 'Day 0 (immediate)';
  if (days === 1) return 'Day 1';
  return `Day ${days}`;
};

// ============================================================================
// Phase Row Component
// ============================================================================

interface PhaseRowProps {
  phase: Phase;
  index: number;
  scheduleItem: RelativeDripSchedule | undefined;
  onDaysChange: (phaseId: string, days: number) => void;
  disabled?: boolean;
}

const PhaseRow = ({
  phase,
  index,
  scheduleItem,
  onDaysChange,
  disabled,
}: PhaseRowProps) => {
  const isFirstPhase = index === 0;
  const days = isFirstPhase ? 0 : scheduleItem?.offset_days ?? 0;

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

      <div className="flex items-center gap-3">
        {isFirstPhase ? (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <Unlock className="h-4 w-4" />
            <span>Day 0 - Unlocked immediately</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Label htmlFor={`days-${phase.id}`} className="text-sm text-muted-foreground whitespace-nowrap">
              Unlocks on
            </Label>
            <div className="relative">
              <Input
                id={`days-${phase.id}`}
                type="number"
                min="0"
                max="365"
                value={days}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10);
                  onDaysChange(phase.id, isNaN(value) ? 0 : Math.max(0, Math.min(365, value)));
                }}
                className="w-20 text-center"
                disabled={disabled}
              />
            </div>
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              days after enrollment
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Summary Component
// ============================================================================

interface ScheduleSummaryProps {
  phases: Phase[];
  schedule: RelativeDripSchedule[];
}

const ScheduleSummary = ({ phases, schedule }: ScheduleSummaryProps) => {
  const sortedPhases = [...phases].sort((a, b) => a.order_index - b.order_index);

  return (
    <div className="bg-muted/50 rounded-lg p-4 mt-4">
      <p className="text-sm font-medium mb-2">Quick Summary</p>
      <div className="flex flex-wrap gap-2">
        {sortedPhases.map((phase, index) => {
          const scheduleItem = getScheduleForPhase(schedule, phase.id);
          const days = index === 0 ? 0 : scheduleItem?.offset_days ?? 0;
          return (
            <div
              key={phase.id}
              className="inline-flex items-center gap-1.5 px-2 py-1 bg-background rounded border text-xs"
            >
              <span className="font-medium">P{index + 1}:</span>
              <span className="text-muted-foreground">{formatDaysText(days)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const RelativeDripConfig = ({
  phases,
  schedule,
  onChange,
  disabled = false,
}: RelativeDripConfigProps) => {
  // Sort phases by order_index
  const sortedPhases = [...phases].sort((a, b) => a.order_index - b.order_index);

  const handleDaysChange = (phaseId: string, days: number) => {
    const existingItem = getScheduleForPhase(schedule, phaseId);

    if (existingItem) {
      onChange(
        schedule.map((s) =>
          s.phase_id === phaseId ? { ...s, offset_days: days } : s
        )
      );
    } else {
      onChange([...schedule, { phase_id: phaseId, offset_days: days }]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-amber-500" />
          Phase Unlock Timing
        </CardTitle>
        <CardDescription>
          Set how many days after enrollment each phase becomes available
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedPhases.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No phases found. Add phases to configure their unlock timing.</p>
          </div>
        ) : (
          <>
            {sortedPhases.map((phase, index) => (
              <PhaseRow
                key={phase.id}
                phase={phase}
                index={index}
                scheduleItem={getScheduleForPhase(schedule, phase.id)}
                onDaysChange={handleDaysChange}
                disabled={disabled}
              />
            ))}
            <ScheduleSummary phases={sortedPhases} schedule={schedule} />
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default RelativeDripConfig;
