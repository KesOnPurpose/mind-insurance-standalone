// ============================================================================
// FEAT-GH-013: Tactic Item Component
// ============================================================================
// Individual tactic checkbox with label, description, and help button
// THE KEY DIFFERENTIATOR - Action items that must be completed!
// ============================================================================

import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import {
  ExternalLink,
  ChevronDown,
  CheckCircle2,
  Sparkles,
  MessageCircle,
} from 'lucide-react';
import type { TacticWithStatus } from '@/types/programs';

interface TacticItemProps {
  tactic: TacticWithStatus;
  onToggle: (tacticId: string, completed: boolean) => void;
  onHelpClick?: (tacticId: string) => void;
  isToggling?: boolean;
  disabled?: boolean;
}

/**
 * TacticItem - Individual checkbox item for lesson tactics
 * THE DIFFERENTIATOR: These are action items that must be completed!
 */
export const TacticItem = ({
  tactic,
  onToggle,
  onHelpClick,
  isToggling = false,
  disabled = false,
}: TacticItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasDescription = !!tactic.description;
  const hasReferenceUrl = !!tactic.reference_url;

  const handleCheckedChange = (checked: boolean) => {
    if (!isToggling && !disabled) {
      onToggle(tactic.id, checked);
    }
  };

  const handleHelpClick = () => {
    if (onHelpClick) {
      onHelpClick(tactic.id);
    }
  };

  return (
    <div
      className={cn(
        'group relative rounded-lg border p-4 transition-all duration-200',
        tactic.is_completed
          ? 'border-primary/30 bg-primary/5'
          : 'border-border bg-card hover:border-primary/20',
        disabled && 'opacity-60 cursor-not-allowed',
        isToggling && 'animate-pulse'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <div className="pt-0.5">
          <Checkbox
            id={tactic.id}
            checked={tactic.is_completed}
            onCheckedChange={handleCheckedChange}
            disabled={isToggling || disabled}
            className={cn(
              'h-5 w-5 transition-all duration-200',
              'hover:scale-110 active:scale-95',
              tactic.is_completed && 'bg-primary border-primary animate-scale-check'
            )}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              {/* Label with badges */}
              <label
                htmlFor={tactic.id}
                className={cn(
                  'font-medium text-sm leading-tight cursor-pointer',
                  tactic.is_completed && 'text-muted-foreground line-through',
                  disabled && 'cursor-not-allowed'
                )}
              >
                {tactic.label}
              </label>

              {/* Badges row */}
              <div className="flex items-center gap-2 mt-1">
                {tactic.is_required ? (
                  <Badge variant="default" className="text-[10px] px-1.5 py-0">
                    Required
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    Optional
                  </Badge>
                )}

                {tactic.nette_helped && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-purple-500/30 text-purple-600">
                    <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                    Nette helped
                  </Badge>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {hasReferenceUrl && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  asChild
                >
                  <a
                    href={tactic.reference_url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Open reference link"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
              )}

              {onHelpClick && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-purple-600 hover:text-purple-700 hover:bg-purple-50 px-2"
                  onClick={handleHelpClick}
                  aria-label="Get help with this tactic from Nette AI"
                >
                  <Sparkles className="h-3 w-3" />
                  <span className="text-xs hidden sm:inline">Help me</span>
                </Button>
              )}
            </div>
          </div>

          {/* Expandable description */}
          {hasDescription && (
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-0 text-xs text-muted-foreground hover:text-foreground mt-1"
                >
                  <ChevronDown
                    className={cn(
                      'h-3 w-3 mr-1 transition-transform',
                      isExpanded && 'rotate-180'
                    )}
                  />
                  {isExpanded ? 'Hide details' : 'Show details'}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2 overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {tactic.description}
                </p>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Completed indicator */}
          {tactic.is_completed && tactic.completed_at && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3 w-3 text-primary" />
              Completed {new Date(tactic.completed_at).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * TacticItemSkeleton - Loading placeholder
 */
export const TacticItemSkeleton = () => (
  <div className="rounded-lg border p-4">
    <div className="flex items-start gap-3">
      <Skeleton className="h-5 w-5 rounded" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  </div>
);
