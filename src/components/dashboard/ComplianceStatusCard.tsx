import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { ClipboardCheck, FileText, AlertTriangle, CheckCircle2, ArrowRight, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBinderList } from '@/hooks/useComplianceBinder';
import { STATE_NAMES, type StateCode } from '@/types/compliance';

/**
 * ComplianceStatusCard - Dashboard card showing compliance readiness
 *
 * Displays:
 * - Primary state compliance status
 * - Overall readiness percentage
 * - Outstanding items needing attention
 * - Review Compliance CTA
 * - Inline Ask Nette link with compliance context
 */
export function ComplianceStatusCard() {
  const { binders, isLoading, error } = useBinderList();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-32 mb-3" />
          <Skeleton className="h-2 w-full mb-4" />
          <Skeleton className="h-16 w-full mb-3" />
          <Skeleton className="h-9 w-full" />
        </CardContent>
      </Card>
    );
  }

  // No binders - show CTA to start compliance
  if (!binders || binders.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">Compliance Status</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Start your compliance journey. Create a binder to track your state's requirements and documents.
          </p>
          <Link to="/compliance">
            <Button variant="outline" size="sm" className="w-full gap-2">
              Start Compliance Binder
              <ArrowRight className="w-4 h-4" />
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
  // This is a simplified calculation - could be enhanced with assessment data
  const itemCount = primaryBinder.item_count || 0;
  const documentCount = primaryBinder.document_count || 0;

  // Simple readiness calculation (items + documents weighted)
  // Assume ~10 items and ~5 docs for "complete" status
  const itemScore = Math.min((itemCount / 10) * 50, 50);
  const docScore = Math.min((documentCount / 5) * 50, 50);
  const readinessPercent = Math.round(itemScore + docScore);

  // Determine status
  const getReadinessStatus = (percent: number) => {
    if (percent >= 80) return { label: 'Ready', color: 'bg-green-600', textColor: 'text-green-600' };
    if (percent >= 50) return { label: 'In Progress', color: 'bg-yellow-600', textColor: 'text-yellow-600' };
    return { label: 'Getting Started', color: 'bg-blue-600', textColor: 'text-blue-600' };
  };

  const status = getReadinessStatus(readinessPercent);

  // Determine items that need attention
  const needsAttention: { icon: React.ReactNode; label: string }[] = [];

  if (itemCount < 5) {
    needsAttention.push({
      icon: <FileText className="w-3.5 h-3.5" />,
      label: 'Add more compliance requirements',
    });
  }

  if (documentCount === 0) {
    needsAttention.push({
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
      label: 'Upload required documents',
    });
  }

  if (!primaryBinder.model_definition) {
    needsAttention.push({
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
      label: 'Define your housing model',
    });
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">Compliance Status</CardTitle>
          </div>
          <Badge variant="secondary" className={`${status.color} text-white text-xs`}>
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* State and readiness */}
        <div className="mb-3">
          <p className="font-medium text-sm">{stateName}</p>
          <p className="text-xs text-muted-foreground">
            {binders.length} binder{binders.length !== 1 ? 's' : ''} &bull; {itemCount} items &bull; {documentCount} docs
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Readiness</span>
            <span className={`font-medium ${status.textColor}`}>{readinessPercent}%</span>
          </div>
          <Progress value={readinessPercent} className="h-2" />
        </div>

        {/* Items needing attention */}
        {needsAttention.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 mb-2">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">{needsAttention.length} item{needsAttention.length !== 1 ? 's' : ''} need attention</span>
            </div>
            <ul className="space-y-1.5">
              {needsAttention.slice(0, 2).map((item, idx) => (
                <li key={idx} className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-500">
                  {item.icon}
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* All good state */}
        {needsAttention.length === 0 && readinessPercent >= 80 && (
          <div className="bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm font-medium">Looking good!</span>
            </div>
            <p className="text-xs text-green-600 dark:text-green-500 mt-1">
              Your compliance binder is well-documented.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <Link to="/compliance">
            <Button size="sm" className="w-full gap-2">
              Review Compliance
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>

          {/* Inline Ask Nette link with context */}
          <Link
            to={`/chat?context=compliance&state=${stateCode}&stateName=${encodeURIComponent(stateName)}`}
            className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors py-1"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Ask Nette about {stateName} requirements</span>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default ComplianceStatusCard;
