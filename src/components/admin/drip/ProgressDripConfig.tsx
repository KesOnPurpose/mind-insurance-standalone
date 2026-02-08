// ============================================================================
// FEAT-GH-017: Progress Drip Configuration Component
// ============================================================================
// Prerequisite phase toggles for progress-based drip scheduling
// ============================================================================

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, Unlock, ArrowRight, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Phase, ProgressPrerequisite } from '@/types/programs';

// ============================================================================
// Types
// ============================================================================

interface ProgressDripConfigProps {
  phases: Phase[];
  prerequisites: ProgressPrerequisite[];
  requirePreviousCompletion: boolean;
  onChange: (prerequisites: ProgressPrerequisite[]) => void;
  onRequirePreviousChange: (value: boolean) => void;
  disabled?: boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

const getPrerequisiteForPhase = (
  prerequisites: ProgressPrerequisite[],
  phaseId: string
): ProgressPrerequisite | undefined => {
  return prerequisites.find((p) => p.phase_id === phaseId);
};

// Detect circular dependencies
const detectCircularDependency = (
  prerequisites: ProgressPrerequisite[],
  phaseId: string,
  prerequisitePhaseId: string,
  visited: Set<string> = new Set()
): boolean => {
  if (prerequisitePhaseId === phaseId) return true;
  if (visited.has(prerequisitePhaseId)) return false;

  visited.add(prerequisitePhaseId);

  const prereq = prerequisites.find((p) => p.phase_id === prerequisitePhaseId);
  if (!prereq) return false;

  return detectCircularDependency(prerequisites, phaseId, prereq.prerequisite_phase_id, visited);
};

// ============================================================================
// Phase Row Component
// ============================================================================

interface PhaseRowProps {
  phase: Phase;
  index: number;
  phases: Phase[];
  prerequisiteItem: ProgressPrerequisite | undefined;
  onPrerequisiteChange: (phaseId: string, prerequisitePhaseId: string | null) => void;
  disabled?: boolean;
  requirePreviousCompletion: boolean;
}

const PhaseRow = ({
  phase,
  index,
  phases,
  prerequisiteItem,
  onPrerequisiteChange,
  disabled,
  requirePreviousCompletion,
}: PhaseRowProps) => {
  const isFirstPhase = index === 0;
  const sortedPhases = [...phases].sort((a, b) => a.order_index - b.order_index);

  // Get available prerequisite phases (only phases before this one to prevent obvious issues)
  const availablePrerequisites = sortedPhases.filter((p) => p.order_index < phase.order_index);

  // Determine effective prerequisite
  const effectivePrerequisite = useMemo(() => {
    if (isFirstPhase) return null;
    if (requirePreviousCompletion) {
      // When require previous completion is on, always use the previous phase
      return sortedPhases[index - 1] || null;
    }
    // Custom prerequisite selection
    if (prerequisiteItem) {
      return phases.find((p) => p.id === prerequisiteItem.prerequisite_phase_id) || null;
    }
    return null;
  }, [isFirstPhase, requirePreviousCompletion, prerequisiteItem, phases, sortedPhases, index]);

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
            <span>Always unlocked</span>
          </div>
        ) : requirePreviousCompletion ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Requires</span>
            <ArrowRight className="h-4 w-4" />
            <span className="font-medium text-foreground">
              {effectivePrerequisite?.title || `Phase ${index}`}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Label htmlFor={`prereq-${phase.id}`} className="text-sm text-muted-foreground whitespace-nowrap">
              Requires completion of
            </Label>
            <Select
              value={prerequisiteItem?.prerequisite_phase_id || 'none'}
              onValueChange={(value) => onPrerequisiteChange(phase.id, value === 'none' ? null : value)}
              disabled={disabled}
            >
              <SelectTrigger id={`prereq-${phase.id}`} className="w-[180px]">
                <SelectValue placeholder="Select phase..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No prerequisite</SelectItem>
                {availablePrerequisites.map((prereqPhase, prereqIndex) => (
                  <SelectItem key={prereqPhase.id} value={prereqPhase.id}>
                    Phase {prereqIndex + 1}: {prereqPhase.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const ProgressDripConfig = ({
  phases,
  prerequisites,
  requirePreviousCompletion,
  onChange,
  onRequirePreviousChange,
  disabled = false,
}: ProgressDripConfigProps) => {
  // Sort phases by order_index
  const sortedPhases = [...phases].sort((a, b) => a.order_index - b.order_index);

  // Check for circular dependencies
  const [circularWarning, setCircularWarning] = useState<string | null>(null);

  const handlePrerequisiteChange = (phaseId: string, prerequisitePhaseId: string | null) => {
    // Clear any previous warning
    setCircularWarning(null);

    if (!prerequisitePhaseId) {
      // Remove the prerequisite
      onChange(prerequisites.filter((p) => p.phase_id !== phaseId));
      return;
    }

    // Check for circular dependency
    const wouldCreateCircle = detectCircularDependency(
      prerequisites.filter((p) => p.phase_id !== phaseId),
      phaseId,
      prerequisitePhaseId
    );

    if (wouldCreateCircle) {
      setCircularWarning('This would create a circular dependency. Please select a different prerequisite.');
      return;
    }

    const existingItem = getPrerequisiteForPhase(prerequisites, phaseId);

    if (existingItem) {
      onChange(
        prerequisites.map((p) =>
          p.phase_id === phaseId ? { ...p, prerequisite_phase_id: prerequisitePhaseId } : p
        )
      );
    } else {
      onChange([...prerequisites, { phase_id: phaseId, prerequisite_phase_id: prerequisitePhaseId }]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-500" />
          Progress Requirements
        </CardTitle>
        <CardDescription>
          Control how learners progress through phases based on completion
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Require Previous Completion Toggle */}
        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
          <div className="space-y-0.5">
            <Label className="text-base font-medium">Sequential Progression</Label>
            <p className="text-sm text-muted-foreground">
              Learners must complete each phase before accessing the next one
            </p>
          </div>
          <Switch
            checked={requirePreviousCompletion}
            onCheckedChange={onRequirePreviousChange}
            disabled={disabled}
          />
        </div>

        {/* Circular Dependency Warning */}
        {circularWarning && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{circularWarning}</AlertDescription>
          </Alert>
        )}

        {/* Custom Prerequisites (only shown when sequential is off) */}
        {!requirePreviousCompletion && (
          <div className="pt-2">
            <p className="text-sm text-muted-foreground mb-4">
              Configure custom prerequisites for each phase:
            </p>
          </div>
        )}

        {/* Phase List */}
        {sortedPhases.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No phases found. Add phases to configure progress requirements.</p>
          </div>
        ) : (
          sortedPhases.map((phase, index) => (
            <PhaseRow
              key={phase.id}
              phase={phase}
              index={index}
              phases={phases}
              prerequisiteItem={getPrerequisiteForPhase(prerequisites, phase.id)}
              onPrerequisiteChange={handlePrerequisiteChange}
              disabled={disabled}
              requirePreviousCompletion={requirePreviousCompletion}
            />
          ))
        )}

        {/* Visual Flow */}
        {requirePreviousCompletion && sortedPhases.length > 1 && (
          <div className="bg-muted/50 rounded-lg p-4 mt-4">
            <p className="text-sm font-medium mb-2">Progression Flow</p>
            <div className="flex flex-wrap items-center gap-2">
              {sortedPhases.map((phase, index) => (
                <div key={phase.id} className="flex items-center gap-2">
                  <div className="px-3 py-1 bg-background rounded border text-sm font-medium">
                    Phase {index + 1}
                  </div>
                  {index < sortedPhases.length - 1 && (
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProgressDripConfig;
