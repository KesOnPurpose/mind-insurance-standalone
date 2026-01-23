// ============================================================================
// FEAT-GH-017: Enhanced Program Drip Tab
// ============================================================================
// Comprehensive drip configuration UI with model selection, schedule config,
// lesson overrides, and preview functionality
// ============================================================================

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Save, Info, Settings, Eye, CalendarDays } from 'lucide-react';
import {
  useUpdateProgramDrip,
  useBatchUpdatePhaseDrip,
} from '@/hooks/useAdminPrograms';
import {
  DripModelSelector,
  CalendarDripConfig,
  RelativeDripConfig,
  ProgressDripConfig,
  LessonDripOverrides,
  SchedulePreview,
} from '@/components/admin/drip';
import type {
  Phase,
  AdminLesson,
  DripModel,
  DripConfig,
  CalendarDripSchedule,
  RelativeDripSchedule,
  ProgressPrerequisite,
  LessonDripOverride,
} from '@/types/programs';

// ============================================================================
// Types
// ============================================================================

interface ProgramDripTabProps {
  programId: string;
  phases: Phase[];
  lessons?: AdminLesson[];
  currentSettings: Record<string, unknown> | null;
  isLoading: boolean;
  onRefresh: () => void;
}

interface DripFormState {
  model: DripModel;
  requirePreviousCompletion: boolean;
  calendarSchedule: CalendarDripSchedule[];
  relativeSchedule: RelativeDripSchedule[];
  prerequisites: ProgressPrerequisite[];
  lessonOverrides: LessonDripOverride[];
}

// ============================================================================
// Loading Skeleton
// ============================================================================

const DripSkeleton = () => (
  <div className="space-y-6">
    <Skeleton className="h-64 w-full" />
    <Skeleton className="h-48 w-full" />
    <Skeleton className="h-32 w-full" />
  </div>
);

// ============================================================================
// Helper Functions
// ============================================================================

const parseCurrentSettings = (
  settings: Record<string, unknown> | null,
  phases: Phase[]
): DripFormState => {
  if (!settings) {
    return {
      model: 'progress',
      requirePreviousCompletion: true,
      calendarSchedule: [],
      relativeSchedule: [],
      prerequisites: [],
      lessonOverrides: [],
    };
  }

  const dripConfig = settings as Partial<DripConfig> & {
    drip_model?: DripModel;
    require_previous_completion?: boolean;
    phase_unlock_days?: Record<string, number>;
    phase_unlock_dates?: Record<string, string>;
  };

  // Convert legacy phase_unlock_days to relativeSchedule
  const relativeSchedule: RelativeDripSchedule[] = [];
  if (dripConfig.phase_unlock_days) {
    Object.entries(dripConfig.phase_unlock_days).forEach(([phaseId, days]) => {
      relativeSchedule.push({ phase_id: phaseId, offset_days: days });
    });
  } else if (dripConfig.relative_schedule) {
    relativeSchedule.push(...dripConfig.relative_schedule);
  }

  // Convert legacy phase_unlock_dates to calendarSchedule
  const calendarSchedule: CalendarDripSchedule[] = [];
  if (dripConfig.phase_unlock_dates) {
    Object.entries(dripConfig.phase_unlock_dates).forEach(([phaseId, date]) => {
      calendarSchedule.push({ phase_id: phaseId, unlock_at: date });
    });
  } else if (dripConfig.calendar_schedule) {
    calendarSchedule.push(...dripConfig.calendar_schedule);
  }

  return {
    model: dripConfig.drip_model || dripConfig.model || 'progress',
    requirePreviousCompletion: dripConfig.require_previous_completion ?? true,
    calendarSchedule,
    relativeSchedule,
    prerequisites: dripConfig.prerequisites || [],
    lessonOverrides: dripConfig.lesson_overrides || [],
  };
};

const buildSavePayload = (formState: DripFormState): DripConfig => {
  return {
    model: formState.model,
    calendar_schedule: formState.calendarSchedule,
    relative_schedule: formState.relativeSchedule,
    prerequisites: formState.prerequisites,
    require_previous_completion: formState.requirePreviousCompletion,
    lesson_overrides: formState.lessonOverrides,
  };
};

// ============================================================================
// Main Component
// ============================================================================

export const ProgramDripTab = ({
  programId,
  phases,
  lessons = [],
  currentSettings,
  isLoading,
  onRefresh,
}: ProgramDripTabProps) => {
  const { updateDrip, isUpdating: isProgramUpdating } = useUpdateProgramDrip();
  const { batchUpdatePhaseDrip, isUpdating: isPhasesUpdating } = useBatchUpdatePhaseDrip();

  const isUpdating = isProgramUpdating || isPhasesUpdating;

  // Initialize form state from current settings
  const [formState, setFormState] = useState<DripFormState>(() =>
    parseCurrentSettings(currentSettings, phases)
  );

  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'preview'>('config');

  // Update form state when settings change
  useEffect(() => {
    if (currentSettings) {
      setFormState(parseCurrentSettings(currentSettings, phases));
      setHasChanges(false);
    }
  }, [currentSettings, phases]);

  // Handle model change
  const handleModelChange = (model: DripModel) => {
    setFormState((prev) => ({ ...prev, model }));
    setHasChanges(true);
  };

  // Handle require previous completion change
  const handleRequirePreviousChange = (value: boolean) => {
    setFormState((prev) => ({ ...prev, requirePreviousCompletion: value }));
    setHasChanges(true);
  };

  // Handle calendar schedule change
  const handleCalendarScheduleChange = (schedule: CalendarDripSchedule[]) => {
    setFormState((prev) => ({ ...prev, calendarSchedule: schedule }));
    setHasChanges(true);
  };

  // Handle relative schedule change
  const handleRelativeScheduleChange = (schedule: RelativeDripSchedule[]) => {
    setFormState((prev) => ({ ...prev, relativeSchedule: schedule }));
    setHasChanges(true);
  };

  // Handle prerequisites change
  const handlePrerequisitesChange = (prerequisites: ProgressPrerequisite[]) => {
    setFormState((prev) => ({ ...prev, prerequisites }));
    setHasChanges(true);
  };

  // Handle lesson overrides change
  const handleLessonOverridesChange = (overrides: LessonDripOverride[]) => {
    setFormState((prev) => ({ ...prev, lessonOverrides: overrides }));
    setHasChanges(true);
  };

  // Save settings
  const handleSave = async () => {
    const payload = buildSavePayload(formState);

    // Save program-level drip config
    const programSuccess = await updateDrip(programId, {
      drip_model: formState.model,
      require_previous_completion: formState.requirePreviousCompletion,
      ...payload,
    });

    if (!programSuccess) return;

    // Batch update phases with their individual drip settings
    const phaseUpdates = phases.map((phase) => {
      const calendarItem = formState.calendarSchedule.find((s) => s.phase_id === phase.id);
      const relativeItem = formState.relativeSchedule.find((s) => s.phase_id === phase.id);
      const prereqItem = formState.prerequisites.find((p) => p.phase_id === phase.id);

      return {
        phase_id: phase.id,
        drip_model: formState.model as 'inherit' | 'calendar' | 'relative' | 'progress' | 'hybrid',
        unlock_at: calendarItem?.unlock_at || null,
        unlock_offset_days: relativeItem?.offset_days ?? null,
        prerequisite_phase_id: prereqItem?.prerequisite_phase_id || null,
      };
    });

    const phasesSuccess = await batchUpdatePhaseDrip(phaseUpdates);

    if (phasesSuccess) {
      setHasChanges(false);
      onRefresh();
    }
  };

  // Render model-specific configuration
  const renderModelConfig = () => {
    switch (formState.model) {
      case 'calendar':
        return (
          <CalendarDripConfig
            phases={phases}
            schedule={formState.calendarSchedule}
            onChange={handleCalendarScheduleChange}
            disabled={isUpdating}
          />
        );

      case 'relative':
        return (
          <RelativeDripConfig
            phases={phases}
            schedule={formState.relativeSchedule}
            onChange={handleRelativeScheduleChange}
            disabled={isUpdating}
          />
        );

      case 'progress':
        return (
          <ProgressDripConfig
            phases={phases}
            prerequisites={formState.prerequisites}
            requirePreviousCompletion={formState.requirePreviousCompletion}
            onChange={handlePrerequisitesChange}
            onRequirePreviousChange={handleRequirePreviousChange}
            disabled={isUpdating}
          />
        );

      case 'hybrid':
        return (
          <div className="space-y-6">
            <RelativeDripConfig
              phases={phases}
              schedule={formState.relativeSchedule}
              onChange={handleRelativeScheduleChange}
              disabled={isUpdating}
            />
            <ProgressDripConfig
              phases={phases}
              prerequisites={formState.prerequisites}
              requirePreviousCompletion={formState.requirePreviousCompletion}
              onChange={handlePrerequisitesChange}
              onRequirePreviousChange={handleRequirePreviousChange}
              disabled={isUpdating}
            />
          </div>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return <DripSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Tabs for Config vs Preview */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'config' | 'preview')}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </TabsTrigger>
        </TabsList>

        {/* Configuration Tab */}
        <TabsContent value="config" className="space-y-6 mt-6">
          {/* Drip Model Selection */}
          <DripModelSelector
            value={formState.model}
            onChange={handleModelChange}
            disabled={isUpdating}
          />

          {/* Model-Specific Configuration */}
          {renderModelConfig()}

          {/* Lesson-Level Overrides (Optional) */}
          {lessons.length > 0 && (
            <LessonDripOverrides
              phases={phases}
              lessons={lessons}
              overrides={formState.lessonOverrides}
              onChange={handleLessonOverridesChange}
              disabled={isUpdating}
            />
          )}

          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Drip settings apply to new enrollments. Existing learners keep their
              current access unless you manually reset their progress.
            </AlertDescription>
          </Alert>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="mt-6">
          <SchedulePreview
            phases={phases}
            dripModel={formState.model}
            calendarSchedule={formState.calendarSchedule}
            relativeSchedule={formState.relativeSchedule}
            prerequisites={formState.prerequisites}
            requirePreviousCompletion={formState.requirePreviousCompletion}
          />
        </TabsContent>
      </Tabs>

      {/* Save Button (Always Visible) */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div>
          {hasChanges && (
            <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              You have unsaved changes
            </p>
          )}
        </div>
        <Button onClick={handleSave} disabled={!hasChanges || isUpdating}>
          {isUpdating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ProgramDripTab;
