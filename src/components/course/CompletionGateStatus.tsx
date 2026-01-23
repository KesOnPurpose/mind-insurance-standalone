/**
 * FEAT-GH-006-F: CompletionGateStatus Component
 *
 * Displays completion gate requirements for a tactic:
 * - Video watch progress gate
 * - Assessment pass gate
 * - Prerequisites completion gate
 * - Overall completion status with action buttons
 */

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle,
  XCircle,
  Play,
  ClipboardCheck,
  ListChecks,
  Lock,
  Unlock,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import type {
  CompletionGateStatus as GateStatus,
  CompletionGateResult,
  CompletionGateType,
} from '@/types/assessment';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

interface CompletionGateStatusProps {
  /** The completion gate result */
  gateResult: CompletionGateResult;
  /** Callback when video watch action is clicked */
  onWatchVideo?: () => void;
  /** Callback when assessment action is clicked */
  onTakeAssessment?: () => void;
  /** Callback when prerequisite tactic is clicked */
  onViewPrerequisite?: (tacticId: string) => void;
  /** Whether to show compact mode */
  compact?: boolean;
  /** Custom class name */
  className?: string;
}

interface SingleGateItemProps {
  gate: GateStatus;
  onAction?: () => void;
  compact?: boolean;
}

// =============================================================================
// ICONS BY GATE TYPE
// =============================================================================

const gateIcons: Record<CompletionGateType, typeof Play> = {
  video: Play,
  assessment: ClipboardCheck,
  prerequisites: ListChecks,
};

// =============================================================================
// SINGLE GATE ITEM
// =============================================================================

function SingleGateItem({ gate, onAction, compact }: SingleGateItemProps) {
  const Icon = gateIcons[gate.type];
  const isPassed = gate.passed;

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
          isPassed
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-amber-50 text-amber-700 border border-amber-200'
        )}
      >
        {isPassed ? (
          <CheckCircle className="w-4 h-4 text-green-600" />
        ) : (
          <AlertTriangle className="w-4 h-4 text-amber-600" />
        )}
        <span className="font-medium">{gate.label}</span>
        {gate.details && <span className="text-xs opacity-80">({gate.details})</span>}
        {!isPassed && gate.action && onAction && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onAction}
            className="ml-auto h-6 px-2 text-xs"
          >
            {gate.action.label}
            <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border transition-all',
        isPassed
          ? 'bg-green-50/50 border-green-200'
          : gate.required
            ? 'bg-amber-50/50 border-amber-200'
            : 'bg-muted/30 border-muted'
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
          isPassed
            ? 'bg-green-100 text-green-600'
            : gate.required
              ? 'bg-amber-100 text-amber-600'
              : 'bg-muted text-muted-foreground'
        )}
      >
        <Icon className="w-5 h-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">{gate.label}</span>
          {gate.required && !isPassed && (
            <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700 border-amber-300">
              Required
            </Badge>
          )}
          {isPassed && (
            <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
              Complete
            </Badge>
          )}
        </div>
        {gate.details && (
          <p className="text-xs text-muted-foreground">{gate.details}</p>
        )}

        {/* Action Button */}
        {!isPassed && gate.action && onAction && (
          <Button
            size="sm"
            variant={gate.required ? 'default' : 'outline'}
            onClick={onAction}
            className="mt-2"
          >
            {gate.action.label}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>

      {/* Status Icon */}
      <div className="flex-shrink-0">
        {isPassed ? (
          <CheckCircle className="w-5 h-5 text-green-600" />
        ) : (
          <XCircle className="w-5 h-5 text-muted-foreground/50" />
        )}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function CompletionGateStatus({
  gateResult,
  onWatchVideo,
  onTakeAssessment,
  onViewPrerequisite,
  compact = false,
  className,
}: CompletionGateStatusProps) {
  const { canComplete, gates, blockedBy, message } = gateResult;
  const passedCount = gates.filter((g) => g.passed).length;
  const totalCount = gates.length;
  const progressPercent = totalCount > 0 ? (passedCount / totalCount) * 100 : 0;

  // Get action handler based on gate type
  const getActionHandler = (gate: GateStatus) => {
    switch (gate.action?.type) {
      case 'watch_video':
        return onWatchVideo;
      case 'take_assessment':
        return onTakeAssessment;
      case 'complete_tactic':
        return gate.action?.targetId
          ? () => onViewPrerequisite?.(gate.action!.targetId!)
          : undefined;
      default:
        return undefined;
    }
  };

  if (compact) {
    return (
      <div className={cn('space-y-2', className)}>
        {/* Compact Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {canComplete ? (
              <Unlock className="w-4 h-4 text-green-600" />
            ) : (
              <Lock className="w-4 h-4 text-amber-600" />
            )}
            <span className="text-sm font-medium">
              {canComplete ? 'Ready to Complete' : `${passedCount}/${totalCount} Requirements Met`}
            </span>
          </div>
          <Progress value={progressPercent} className="w-20 h-1.5" />
        </div>

        {/* Compact Gate List (only show incomplete) */}
        {!canComplete && (
          <div className="space-y-1">
            {gates
              .filter((g) => !g.passed && g.required)
              .map((gate) => (
                <SingleGateItem
                  key={gate.type}
                  gate={gate}
                  onAction={getActionHandler(gate)}
                  compact
                />
              ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center',
              canComplete ? 'bg-green-100' : 'bg-amber-100'
            )}
          >
            {canComplete ? (
              <Unlock className="w-5 h-5 text-green-600" />
            ) : (
              <Lock className="w-5 h-5 text-amber-600" />
            )}
          </div>
          <div>
            <h4 className="font-semibold text-sm">
              {canComplete ? 'Ready to Complete!' : 'Completion Requirements'}
            </h4>
            <p className="text-xs text-muted-foreground">
              {passedCount} of {totalCount} requirements met
            </p>
          </div>
        </div>
        <div className="w-24">
          <Progress value={progressPercent} className="h-2" />
        </div>
      </div>

      {/* Message */}
      {message && !canComplete && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">{message}</p>
        </div>
      )}

      {/* Gate List */}
      <div className="space-y-3">
        {gates.map((gate) => (
          <SingleGateItem key={gate.type} gate={gate} onAction={getActionHandler(gate)} />
        ))}
      </div>

      {/* Blocked Summary */}
      {blockedBy.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          Complete the required items above to unlock tactic completion.
        </p>
      )}
    </div>
  );
}

// =============================================================================
// INLINE BADGE VARIANT (for TacticCard)
// =============================================================================

interface CompletionGateBadgeProps {
  gateResult: CompletionGateResult;
  className?: string;
}

export function CompletionGateBadge({ gateResult, className }: CompletionGateBadgeProps) {
  const { canComplete, gates } = gateResult;
  const passedCount = gates.filter((g) => g.passed).length;
  const totalCount = gates.length;

  if (canComplete) {
    return (
      <Badge
        className={cn(
          'bg-green-100 text-green-700 border-green-300 hover:bg-green-200',
          className
        )}
      >
        <Unlock className="w-3 h-3 mr-1" />
        Ready
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn('bg-amber-50 text-amber-700 border-amber-300', className)}
    >
      <Lock className="w-3 h-3 mr-1" />
      {passedCount}/{totalCount}
    </Badge>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export default CompletionGateStatus;
