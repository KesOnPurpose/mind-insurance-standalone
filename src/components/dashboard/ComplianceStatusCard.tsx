import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ClipboardCheck, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBinderList } from '@/hooks/useComplianceBinder';
import { STATE_NAMES, type StateCode } from '@/types/compliance';

/**
 * ComplianceStatusCard - Apple-style simplified dashboard card
 *
 * Design Philosophy:
 * - ONE dominant metric (readiness %)
 * - Glanceable in <1 second
 * - Generous whitespace
 * - Single focused CTA
 */
export function ComplianceStatusCard() {
  const { binders, isLoading } = useBinderList();

  if (isLoading) {
    return (
      <Card className="relative overflow-hidden">
        <CardContent className="pt-6 pb-6 text-center">
          <Skeleton className="h-5 w-32 mx-auto mb-4" />
          <Skeleton className="h-12 w-20 mx-auto mb-2" />
          <Skeleton className="h-4 w-28 mx-auto mb-6" />
          <Skeleton className="h-9 w-32 mx-auto" />
        </CardContent>
      </Card>
    );
  }

  // No binders - show CTA to start compliance
  if (!binders || binders.length === 0) {
    return (
      <Card className="relative overflow-hidden">
        <CardContent className="pt-6 pb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <ClipboardCheck className="w-5 h-5 text-primary" />
            <span className="font-medium text-muted-foreground text-sm">Compliance</span>
          </div>

          <p className="text-4xl font-bold text-foreground mb-1">—</p>
          <p className="text-sm text-muted-foreground mb-6">No binder yet</p>

          <Link to="/compliance">
            <Button size="sm" variant="ghost" className="gap-2">
              Start Binder <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Get primary binder or first one
  const primaryBinder = binders.find(b => b.is_primary) || binders[0];
  const stateCode = primaryBinder.state_code as StateCode;
  const stateName = STATE_NAMES[stateCode] || stateCode;

  // Calculate readiness based on item count and documents
  const itemCount = primaryBinder.item_count || 0;
  const documentCount = primaryBinder.document_count || 0;

  // Simple readiness calculation (items + documents weighted)
  const itemScore = Math.min((itemCount / 10) * 50, 50);
  const docScore = Math.min((documentCount / 5) * 50, 50);
  const readinessPercent = Math.round(itemScore + docScore);

  // Determine status label and color
  const getReadinessStatus = (percent: number) => {
    if (percent >= 80) return { label: 'Ready!', textColor: 'text-green-600' };
    if (percent >= 50) return { label: 'In Progress', textColor: 'text-yellow-600' };
    return { label: 'Getting Started', textColor: 'text-blue-600' };
  };

  const status = getReadinessStatus(readinessPercent);

  return (
    <Card className="relative overflow-hidden" data-tour-target="compliance-status">
      <CardContent className="pt-6 pb-6 text-center">
        {/* Icon + Title row */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <ClipboardCheck className="w-5 h-5 text-primary" />
          <span className="font-medium text-muted-foreground text-sm">Compliance</span>
        </div>

        {/* Hero Metric */}
        <p className={`text-4xl font-bold mb-1 ${status.textColor}`}>
          {readinessPercent}%
        </p>

        {/* Context - State name and status */}
        <p className="text-sm text-muted-foreground mb-6">
          {stateName} • {status.label}
        </p>

        {/* Single CTA */}
        <Link to="/compliance">
          <Button size="sm" variant="ghost" className="gap-2">
            Review Binder <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export default ComplianceStatusCard;
