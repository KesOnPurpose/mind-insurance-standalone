// ============================================================================
// FEAT-GH-017: Lesson Drip Overrides Component
// ============================================================================
// Per-lesson custom rules (optional drip override for individual lessons)
// ============================================================================

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import {
  Settings2,
  ChevronDown,
  ChevronRight,
  CalendarIcon,
  Clock,
  TrendingUp,
  X,
  Plus,
} from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Phase, AdminLesson, LessonDripOverride } from '@/types/programs';

// ============================================================================
// Types
// ============================================================================

interface LessonDripOverridesProps {
  phases: Phase[];
  lessons: AdminLesson[];
  overrides: LessonDripOverride[];
  onChange: (overrides: LessonDripOverride[]) => void;
  disabled?: boolean;
}

interface PhaseWithLessons {
  phase: Phase;
  lessons: AdminLesson[];
}

// ============================================================================
// Helper Functions
// ============================================================================

const getOverrideForLesson = (
  overrides: LessonDripOverride[],
  lessonId: string
): LessonDripOverride | undefined => {
  return overrides.find((o) => o.lesson_id === lessonId);
};

const groupLessonsByPhase = (
  phases: Phase[],
  lessons: AdminLesson[]
): PhaseWithLessons[] => {
  const sortedPhases = [...phases].sort((a, b) => a.order_index - b.order_index);
  return sortedPhases.map((phase) => ({
    phase,
    lessons: lessons
      .filter((l) => l.phase_id === phase.id)
      .sort((a, b) => a.order_index - b.order_index),
  }));
};

// ============================================================================
// Lesson Override Row Component
// ============================================================================

interface LessonOverrideRowProps {
  lesson: AdminLesson;
  lessonIndex: number;
  override: LessonDripOverride | undefined;
  availableLessons: AdminLesson[];
  onOverrideChange: (lessonId: string, override: Partial<LessonDripOverride> | null) => void;
  disabled?: boolean;
}

const LessonOverrideRow = ({
  lesson,
  lessonIndex,
  override,
  availableLessons,
  onOverrideChange,
  disabled,
}: LessonOverrideRowProps) => {
  const hasOverride = !!override;

  const handleAddOverride = () => {
    onOverrideChange(lesson.id, {
      lesson_id: lesson.id,
      drip_model: 'relative',
      offset_days: 0,
    });
  };

  const handleRemoveOverride = () => {
    onOverrideChange(lesson.id, null);
  };

  const handleModelChange = (model: 'calendar' | 'relative' | 'progress') => {
    onOverrideChange(lesson.id, {
      ...override,
      drip_model: model,
      // Reset other fields when model changes
      unlock_at: model === 'calendar' ? override?.unlock_at : null,
      offset_days: model === 'relative' ? (override?.offset_days ?? 0) : null,
      prerequisite_lesson_id: model === 'progress' ? override?.prerequisite_lesson_id : null,
    });
  };

  return (
    <div className="flex flex-col gap-2 py-3 px-4 border-b last:border-b-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-mono">
            L{lessonIndex + 1}
          </span>
          <span className="text-sm font-medium">{lesson.title}</span>
          {hasOverride && (
            <Badge variant="secondary" className="text-xs">
              Custom
            </Badge>
          )}
        </div>

        {!hasOverride ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAddOverride}
            disabled={disabled}
            className="text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Override
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemoveOverride}
            disabled={disabled}
            className="text-xs text-destructive hover:text-destructive"
          >
            <X className="h-3 w-3 mr-1" />
            Remove
          </Button>
        )}
      </div>

      {/* Override Configuration */}
      {hasOverride && (
        <div className="flex flex-wrap items-center gap-3 pl-6 pt-2">
          {/* Model Selector */}
          <Select
            value={override.drip_model}
            onValueChange={(v) => handleModelChange(v as 'calendar' | 'relative' | 'progress')}
            disabled={disabled}
          >
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="calendar">
                <div className="flex items-center gap-1.5">
                  <CalendarIcon className="h-3 w-3" />
                  Calendar
                </div>
              </SelectItem>
              <SelectItem value="relative">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  Relative
                </div>
              </SelectItem>
              <SelectItem value="progress">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-3 w-3" />
                  Progress
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Model-Specific Config */}
          {override.drip_model === 'calendar' && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    'h-8 text-xs',
                    !override.unlock_at && 'text-muted-foreground'
                  )}
                  disabled={disabled}
                >
                  <CalendarIcon className="mr-1 h-3 w-3" />
                  {override.unlock_at && isValid(parseISO(override.unlock_at))
                    ? format(parseISO(override.unlock_at), 'MMM d, yyyy')
                    : 'Pick date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={
                    override.unlock_at && isValid(parseISO(override.unlock_at))
                      ? parseISO(override.unlock_at)
                      : undefined
                  }
                  onSelect={(date) =>
                    onOverrideChange(lesson.id, {
                      ...override,
                      unlock_at: date?.toISOString() || null,
                    })
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          )}

          {override.drip_model === 'relative' && (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                max="365"
                value={override.offset_days ?? 0}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10);
                  onOverrideChange(lesson.id, {
                    ...override,
                    offset_days: isNaN(value) ? 0 : Math.max(0, Math.min(365, value)),
                  });
                }}
                className="w-16 h-8 text-xs"
                disabled={disabled}
              />
              <span className="text-xs text-muted-foreground">days after enrollment</span>
            </div>
          )}

          {override.drip_model === 'progress' && (
            <Select
              value={override.prerequisite_lesson_id || 'none'}
              onValueChange={(v) =>
                onOverrideChange(lesson.id, {
                  ...override,
                  prerequisite_lesson_id: v === 'none' ? null : v,
                })
              }
              disabled={disabled}
            >
              <SelectTrigger className="w-[180px] h-8 text-xs">
                <SelectValue placeholder="Select prerequisite..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No prerequisite</SelectItem>
                {availableLessons.map((prereqLesson) => (
                  <SelectItem key={prereqLesson.id} value={prereqLesson.id}>
                    {prereqLesson.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Phase Collapsible Component
// ============================================================================

interface PhaseCollapsibleProps {
  phaseWithLessons: PhaseWithLessons;
  phaseIndex: number;
  allLessons: AdminLesson[];
  overrides: LessonDripOverride[];
  onOverrideChange: (lessonId: string, override: Partial<LessonDripOverride> | null) => void;
  disabled?: boolean;
}

const PhaseCollapsible = ({
  phaseWithLessons,
  phaseIndex,
  allLessons,
  overrides,
  onOverrideChange,
  disabled,
}: PhaseCollapsibleProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { phase, lessons } = phaseWithLessons;

  const overrideCount = lessons.filter((l) => getOverrideForLesson(overrides, l.id)).length;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-3">
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <div
              className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium"
            >
              {phaseIndex + 1}
            </div>
            <div>
              <p className="font-medium">{phase.title}</p>
              <p className="text-sm text-muted-foreground">
                {lessons.length} lessons
              </p>
            </div>
          </div>
          {overrideCount > 0 && (
            <Badge variant="secondary">
              {overrideCount} override{overrideCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border border-t-0 rounded-b-lg bg-muted/20">
          {lessons.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground text-center">
              No lessons in this phase
            </div>
          ) : (
            lessons.map((lesson, lessonIndex) => (
              <LessonOverrideRow
                key={lesson.id}
                lesson={lesson}
                lessonIndex={lessonIndex}
                override={getOverrideForLesson(overrides, lesson.id)}
                availableLessons={allLessons.filter((l) => l.id !== lesson.id)}
                onOverrideChange={onOverrideChange}
                disabled={disabled}
              />
            ))
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const LessonDripOverrides = ({
  phases,
  lessons,
  overrides,
  onChange,
  disabled = false,
}: LessonDripOverridesProps) => {
  const groupedLessons = groupLessonsByPhase(phases, lessons);
  const totalOverrides = overrides.length;

  const handleOverrideChange = (lessonId: string, override: Partial<LessonDripOverride> | null) => {
    if (!override) {
      // Remove override
      onChange(overrides.filter((o) => o.lesson_id !== lessonId));
      return;
    }

    const existingIndex = overrides.findIndex((o) => o.lesson_id === lessonId);
    if (existingIndex >= 0) {
      // Update existing
      const updated = [...overrides];
      updated[existingIndex] = { ...overrides[existingIndex], ...override } as LessonDripOverride;
      onChange(updated);
    } else {
      // Add new
      onChange([...overrides, override as LessonDripOverride]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-slate-500" />
          Lesson-Level Overrides
          {totalOverrides > 0 && (
            <Badge variant="secondary" className="ml-2">
              {totalOverrides} active
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Configure custom unlock rules for individual lessons (optional)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {groupedLessons.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No phases or lessons found.</p>
          </div>
        ) : (
          groupedLessons.map((phaseWithLessons, index) => (
            <PhaseCollapsible
              key={phaseWithLessons.phase.id}
              phaseWithLessons={phaseWithLessons}
              phaseIndex={index}
              allLessons={lessons}
              overrides={overrides}
              onOverrideChange={handleOverrideChange}
              disabled={disabled}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default LessonDripOverrides;
