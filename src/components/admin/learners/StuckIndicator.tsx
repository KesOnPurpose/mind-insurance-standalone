// ============================================================================
// FEAT-GH-018: Stuck Indicator Component
// ============================================================================
// Visual indicator for stuck learners with warning icon and tooltip
// ============================================================================

import { AlertTriangle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatDistanceToNow } from 'date-fns';

// ============================================================================
// Types
// ============================================================================

interface StuckIndicatorProps {
  isStuck: boolean;
  stuckSince?: string | null;
  stuckLessonTitle?: string | null;
  variant?: 'badge' | 'icon' | 'full';
  className?: string;
}

// ============================================================================
// Main Component
// ============================================================================

export const StuckIndicator = ({
  isStuck,
  stuckSince,
  stuckLessonTitle,
  variant = 'icon',
  className = '',
}: StuckIndicatorProps) => {
  if (!isStuck) {
    return null;
  }

  const stuckDuration = stuckSince
    ? formatDistanceToNow(new Date(stuckSince), { addSuffix: false })
    : 'Unknown duration';

  const tooltipContent = (
    <div className="space-y-1">
      <p className="font-medium">Learner is stuck</p>
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <Clock className="h-3 w-3" />
        Stuck for {stuckDuration}
      </p>
      {stuckLessonTitle && (
        <p className="text-xs text-muted-foreground">
          On: {stuckLessonTitle}
        </p>
      )}
    </div>
  );

  if (variant === 'badge') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="destructive"
            className={`gap-1 cursor-help ${className}`}
          >
            <AlertTriangle className="h-3 w-3" />
            Stuck
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top">{tooltipContent}</TooltipContent>
      </Tooltip>
    );
  }

  if (variant === 'full') {
    return (
      <div className={`flex items-center gap-2 text-destructive ${className}`}>
        <AlertTriangle className="h-4 w-4" />
        <div className="text-sm">
          <span className="font-medium">Stuck</span>
          <span className="text-muted-foreground ml-1">for {stuckDuration}</span>
        </div>
      </div>
    );
  }

  // Default: icon variant
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={`text-destructive cursor-help ${className}`}>
          <AlertTriangle className="h-4 w-4" />
        </div>
      </TooltipTrigger>
      <TooltipContent side="top">{tooltipContent}</TooltipContent>
    </Tooltip>
  );
};

export default StuckIndicator;
