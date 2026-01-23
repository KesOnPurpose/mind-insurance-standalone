// ============================================================================
// FEAT-GH-013: Tactics Checklist Component
// ============================================================================
// List of tactics grouped by required/optional with collapsible accordion sections
// THE KEY DIFFERENTIATOR - Action items that must be completed!
// Smart collapse logic: auto-expand incomplete, auto-collapse completed
// ============================================================================

import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { TacticItem, TacticItemSkeleton } from './TacticItem';
import { cn } from '@/lib/utils';
import { CheckSquare, Target, Gift, ChevronDown, CheckCircle2 } from 'lucide-react';
import type { TacticWithStatus } from '@/types/programs';

interface TacticsChecklistProps {
  tactics: TacticWithStatus[];
  onToggle: (tacticId: string, completed: boolean) => void;
  onHelpClick?: (tacticId: string) => void;
  togglingTacticId?: string | null;
  disabled?: boolean;
  isLoading?: boolean;
}

/**
 * TacticsChecklist - Main component for displaying lesson tactics
 * Groups tactics into Required and Optional collapsible accordion sections
 * Smart collapse logic:
 * - Required: Auto-expanded if incomplete, auto-collapsed when all complete
 * - Optional: Collapsed by default, expanded when required is complete
 */
export const TacticsChecklist = ({
  tactics,
  onToggle,
  onHelpClick,
  togglingTacticId,
  disabled = false,
  isLoading = false,
}: TacticsChecklistProps) => {
  // Group and calculate stats
  const { requiredTactics, optionalTactics, stats } = useMemo(() => {
    const required = tactics.filter(t => t.is_required).sort((a, b) => a.order_index - b.order_index);
    const optional = tactics.filter(t => !t.is_required).sort((a, b) => a.order_index - b.order_index);

    const requiredCompleted = required.filter(t => t.is_completed).length;
    const optionalCompleted = optional.filter(t => t.is_completed).length;
    const totalCompleted = requiredCompleted + optionalCompleted;

    return {
      requiredTactics: required,
      optionalTactics: optional,
      stats: {
        requiredTotal: required.length,
        requiredCompleted,
        requiredPercent: required.length > 0 ? Math.round((requiredCompleted / required.length) * 100) : 100,
        optionalTotal: optional.length,
        optionalCompleted,
        totalCompleted,
        totalPercent: tactics.length > 0 ? Math.round((totalCompleted / tactics.length) * 100) : 100,
        allRequiredComplete: requiredCompleted === required.length,
        allOptionalComplete: optionalCompleted === optional.length,
      },
    };
  }, [tactics]);

  // Smart collapse state - auto-calculate initial state based on completion
  const [requiredOpen, setRequiredOpen] = useState(true);
  const [optionalOpen, setOptionalOpen] = useState(false);

  // Smart collapse logic: Update accordion state when completion changes
  useEffect(() => {
    // Required section: collapsed when all complete, expanded otherwise
    setRequiredOpen(!stats.allRequiredComplete);

    // Optional section: expanded when required complete but optional incomplete
    // This draws attention to bonus items after required are done
    if (stats.allRequiredComplete && !stats.allOptionalComplete && optionalTactics.length > 0) {
      setOptionalOpen(true);
    }
  }, [stats.allRequiredComplete, stats.allOptionalComplete, optionalTactics.length]);

  if (isLoading) {
    return <TacticsChecklistSkeleton />;
  }

  if (tactics.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <CheckSquare className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">
            No action items for this lesson
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Action Items
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            {stats.totalCompleted} of {tactics.length} complete
          </span>
        </div>

        {/* Progress bar */}
        <div className="space-y-1 mt-2">
          <Progress
            value={stats.requiredPercent}
            className="h-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Required: {stats.requiredCompleted}/{stats.requiredTotal}</span>
            {stats.allRequiredComplete && (
              <span className="text-primary font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                All required complete
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Required Tactics - Collapsible Section */}
        {requiredTactics.length > 0 && (
          <Collapsible open={requiredOpen} onOpenChange={setRequiredOpen}>
            <CollapsibleTrigger asChild>
              <button
                className={cn(
                  'flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition-all',
                  'hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                  stats.allRequiredComplete
                    ? 'bg-primary/5 border border-primary/20'
                    : 'bg-muted/50 border border-border'
                )}
              >
                <div className="flex items-center gap-2">
                  {stats.allRequiredComplete ? (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  ) : (
                    <Target className="h-4 w-4 text-orange-500" />
                  )}
                  <span className={cn(
                    'text-sm font-medium',
                    stats.allRequiredComplete && 'text-primary'
                  )}>
                    Required
                  </span>
                  <span className={cn(
                    'text-xs px-1.5 py-0.5 rounded-full',
                    stats.allRequiredComplete
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground'
                  )}>
                    {stats.requiredCompleted}/{stats.requiredTotal}
                  </span>
                </div>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 text-muted-foreground transition-transform duration-200',
                    requiredOpen && 'rotate-180'
                  )}
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
              <div className="space-y-2 pt-3">
                {requiredTactics.map(tactic => (
                  <TacticItem
                    key={tactic.id}
                    tactic={tactic}
                    onToggle={onToggle}
                    onHelpClick={onHelpClick}
                    isToggling={togglingTacticId === tactic.id}
                    disabled={disabled}
                  />
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Optional Tactics - Collapsible Section */}
        {optionalTactics.length > 0 && (
          <Collapsible open={optionalOpen} onOpenChange={setOptionalOpen}>
            <CollapsibleTrigger asChild>
              <button
                className={cn(
                  'flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition-all',
                  'hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                  stats.allOptionalComplete
                    ? 'bg-primary/5 border border-primary/20'
                    : 'bg-muted/30 border border-border/50'
                )}
              >
                <div className="flex items-center gap-2">
                  {stats.allOptionalComplete ? (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  ) : (
                    <Gift className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className={cn(
                    'text-sm font-medium',
                    stats.allOptionalComplete ? 'text-primary' : 'text-muted-foreground'
                  )}>
                    Bonus
                  </span>
                  <span className={cn(
                    'text-xs px-1.5 py-0.5 rounded-full',
                    stats.allOptionalComplete
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted/50 text-muted-foreground'
                  )}>
                    {stats.optionalCompleted}/{stats.optionalTotal}
                  </span>
                </div>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 text-muted-foreground transition-transform duration-200',
                    optionalOpen && 'rotate-180'
                  )}
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
              <div className="space-y-2 pt-3">
                {optionalTactics.map(tactic => (
                  <TacticItem
                    key={tactic.id}
                    tactic={tactic}
                    onToggle={onToggle}
                    onHelpClick={onHelpClick}
                    isToggling={togglingTacticId === tactic.id}
                    disabled={disabled}
                  />
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * TacticsChecklistSkeleton - Loading state
 */
export const TacticsChecklistSkeleton = () => (
  <Card>
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-2 w-full mt-2" />
    </CardHeader>
    <CardContent className="space-y-3">
      <Skeleton className="h-4 w-28" />
      {[1, 2, 3].map(i => (
        <TacticItemSkeleton key={i} />
      ))}
    </CardContent>
  </Card>
);

/**
 * TacticsSummaryInline - Compact inline summary for lesson cards
 */
interface TacticsSummaryInlineProps {
  completedCount: number;
  totalCount: number;
  requiredCount?: number;
  className?: string;
}

export const TacticsSummaryInline = ({
  completedCount,
  totalCount,
  requiredCount,
  className,
}: TacticsSummaryInlineProps) => {
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 100;

  return (
    <div className={cn('flex items-center gap-2 text-xs', className)}>
      <CheckSquare className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-muted-foreground">
        {completedCount}/{totalCount} tactics
        {requiredCount !== undefined && requiredCount < totalCount && (
          <span className="text-muted-foreground/70"> ({requiredCount} req.)</span>
        )}
      </span>
      <div className="flex-1 max-w-[60px]">
        <Progress value={percent} className="h-1.5" />
      </div>
    </div>
  );
};
