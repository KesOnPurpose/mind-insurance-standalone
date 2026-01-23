// ============================================================================
// FEAT-GH-020: Nette Escalation Badge Component
// ============================================================================
// Badge showing pending escalation count for coaches
// ============================================================================

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

interface NetteEscalationBadgeProps {
  count: number;
  className?: string;
}

/**
 * NetteEscalationBadge - Coach pending count badge
 * Shows number of pending escalations requiring attention
 */
export const NetteEscalationBadge = ({
  count,
  className,
}: NetteEscalationBadgeProps) => {
  if (count === 0) return null;

  return (
    <Badge
      variant={count > 5 ? 'destructive' : 'default'}
      className={cn(
        'gap-1 font-medium',
        count > 5 ? 'bg-red-500' : 'bg-orange-500',
        className
      )}
    >
      <AlertCircle className="h-3 w-3" />
      {count} {count === 1 ? 'escalation' : 'escalations'}
    </Badge>
  );
};

export default NetteEscalationBadge;
