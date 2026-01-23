// ============================================================================
// FEAT-GH-020: Nette Escalation Panel Component
// ============================================================================
// Coach panel for reviewing and resolving support escalations
// ============================================================================

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  MessageSquare,
  User,
  BookOpen,
  ChevronRight,
  Loader2,
  XCircle,
} from 'lucide-react';
import type { SupportEscalation } from '@/types/programs';

interface NetteEscalationPanelProps {
  escalations: SupportEscalation[];
  isLoading?: boolean;
  onResolve: (escalationId: string, status: 'resolved' | 'closed') => Promise<void>;
  className?: string;
}

const PRIORITY_CONFIG: Record<
  SupportEscalation['priority'],
  { label: string; color: string }
> = {
  low: { label: 'Low', color: 'bg-gray-100 text-gray-700' },
  normal: { label: 'Normal', color: 'bg-blue-100 text-blue-700' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-700' },
  urgent: { label: 'Urgent', color: 'bg-red-100 text-red-700' },
};

const STATUS_CONFIG: Record<
  SupportEscalation['status'],
  { label: string; icon: typeof AlertCircle; color: string }
> = {
  open: { label: 'Open', icon: AlertCircle, color: 'text-orange-500' },
  in_progress: { label: 'In Progress', icon: Clock, color: 'text-blue-500' },
  resolved: { label: 'Resolved', icon: CheckCircle, color: 'text-green-500' },
  closed: { label: 'Closed', icon: XCircle, color: 'text-gray-500' },
};

/**
 * NetteEscalationPanel - Coach escalation review panel
 * List of pending escalations with full context view
 */
export const NetteEscalationPanel = ({
  escalations,
  isLoading = false,
  onResolve,
  className,
}: NetteEscalationPanelProps) => {
  const [selectedEscalation, setSelectedEscalation] = useState<SupportEscalation | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const handleResolve = async (status: 'resolved' | 'closed') => {
    if (!selectedEscalation) return;

    setIsResolving(true);
    try {
      await onResolve(selectedEscalation.id, status);
      setIsDetailOpen(false);
      setSelectedEscalation(null);
    } catch (error) {
      console.error('Error resolving escalation:', error);
    } finally {
      setIsResolving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const openEscalations = escalations.filter((e) => e.status === 'open');
  const inProgressEscalations = escalations.filter((e) => e.status === 'in_progress');

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="h-5 w-5 text-purple-600" />
              Support Escalations
            </CardTitle>
            {openEscalations.length > 0 && (
              <Badge variant="destructive" className="font-medium">
                {openEscalations.length} pending
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {escalations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-sm">No pending escalations</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {/* Open escalations first */}
                {openEscalations.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Needs Attention
                    </p>
                    {openEscalations.map((escalation) => (
                      <EscalationCard
                        key={escalation.id}
                        escalation={escalation}
                        onClick={() => {
                          setSelectedEscalation(escalation);
                          setIsDetailOpen(true);
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* In progress */}
                {inProgressEscalations.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      In Progress
                    </p>
                    {inProgressEscalations.map((escalation) => (
                      <EscalationCard
                        key={escalation.id}
                        escalation={escalation}
                        onClick={() => {
                          setSelectedEscalation(escalation);
                          setIsDetailOpen(true);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Detail dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[600px]">
          {selectedEscalation && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={PRIORITY_CONFIG[selectedEscalation.priority].color}>
                    {PRIORITY_CONFIG[selectedEscalation.priority].label} Priority
                  </Badge>
                  <Badge variant="outline">
                    {STATUS_CONFIG[selectedEscalation.status].label}
                  </Badge>
                </div>
                <DialogTitle>Support Escalation</DialogTitle>
                <DialogDescription>
                  Created {formatDate(selectedEscalation.created_at)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* AI Summary */}
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-purple-500" />
                    AI Summary
                  </h4>
                  <p className="text-sm text-muted-foreground bg-muted rounded-lg p-3">
                    {selectedEscalation.ai_summary}
                  </p>
                </div>

                {/* Context */}
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-blue-500" />
                    Context
                  </h4>
                  <div className="bg-muted rounded-lg p-3 text-sm">
                    <pre className="whitespace-pre-wrap text-xs">
                      {JSON.stringify(selectedEscalation.context_snapshot, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleResolve('closed')}
                  disabled={isResolving}
                >
                  Close without action
                </Button>
                <Button
                  onClick={() => handleResolve('resolved')}
                  disabled={isResolving}
                  className="gap-1.5 bg-green-600 hover:bg-green-700"
                >
                  {isResolving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Resolving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Mark Resolved
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

// Individual escalation card component
function EscalationCard({
  escalation,
  onClick,
}: {
  escalation: SupportEscalation;
  onClick: () => void;
}) {
  const StatusIcon = STATUS_CONFIG[escalation.status].icon;

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 rounded-lg border hover:border-primary/30 hover:bg-accent/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <StatusIcon
              className={cn(
                'h-4 w-4',
                STATUS_CONFIG[escalation.status].color
              )}
            />
            <Badge
              variant="outline"
              className={cn('text-[10px]', PRIORITY_CONFIG[escalation.priority].color)}
            >
              {PRIORITY_CONFIG[escalation.priority].label}
            </Badge>
          </div>
          <p className="text-sm line-clamp-2">{escalation.ai_summary}</p>
          <p className="text-[10px] text-muted-foreground mt-1">
            {new Date(escalation.created_at).toLocaleDateString()}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
      </div>
    </button>
  );
}

export default NetteEscalationPanel;
