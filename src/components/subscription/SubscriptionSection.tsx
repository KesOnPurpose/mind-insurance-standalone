import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CreditCard,
  ExternalLink,
  Loader2,
  Undo2,
  Play,
  AlertCircle,
} from 'lucide-react';
import { useSubscriptionManagement } from '@/hooks/useSubscriptionManagement';
import { useSubscriptionMetrics } from '@/hooks/useSubscriptionMetrics';
import { CancelFlowDialog } from './CancelFlowDialog';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionSectionProps {
  isMI: boolean;
}

export function SubscriptionSection({ isMI }: SubscriptionSectionProps) {
  const {
    status,
    fetchStatus,
    cancel,
    uncancel,
    pause,
    resume,
    isFetching,
    fetchError,
    isActioning,
    actionError,
  } = useSubscriptionManagement();
  const { metrics } = useSubscriptionMetrics();
  const { toast } = useToast();

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (actionError) {
      toast({
        title: 'Error',
        description: actionError,
        variant: 'destructive',
      });
    }
  }, [actionError, toast]);

  const handleUncancel = async () => {
    const success = await uncancel();
    if (success) {
      toast({
        title: 'Cancellation undone',
        description: 'Your subscription has been reactivated.',
      });
    }
  };

  const handleResume = async () => {
    const success = await resume();
    if (success) {
      toast({
        title: 'Subscription resumed',
        description: 'Welcome back! Your subscription is active again.',
      });
    }
  };

  const handleCancel = async (reason?: string, reasonText?: string) => {
    const success = await cancel(reason, reasonText);
    if (success) {
      toast({
        title: 'Subscription cancelled',
        description: 'Your access continues until the end of your billing period.',
      });
    }
    return success;
  };

  const handlePause = async () => {
    const success = await pause();
    if (success) {
      toast({
        title: 'Subscription paused',
        description: 'Your subscription is paused for 30 days. Resume anytime.',
      });
    }
    return success;
  };

  // Format date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Loading state
  if (isFetching && !status) {
    return (
      <Card className={isMI ? 'bg-mi-navy-light border-mi-cyan/20' : ''}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className={`w-6 h-6 animate-spin ${isMI ? 'text-mi-cyan' : 'text-primary'}`} />
        </CardContent>
      </Card>
    );
  }

  // Error state (couldn't fetch at all)
  if (fetchError && !status) {
    return (
      <Card className={isMI ? 'bg-mi-navy-light border-mi-cyan/20' : ''}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isMI ? 'text-white' : ''}`}>
            <CreditCard className={`h-5 w-5 ${isMI ? 'text-mi-cyan' : 'text-primary'}`} />
            Subscription
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`flex items-center gap-2 text-sm ${isMI ? 'text-white/60' : 'text-muted-foreground'}`}>
            <AlertCircle className="w-4 h-4" />
            <span>Unable to load subscription details. Please try again later.</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchStatus()}
            className={`mt-3 ${isMI ? 'border-mi-cyan/30 text-white hover:bg-mi-navy' : ''}`}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Determine display state
  const isActive = status?.isActive && !status?.isPendingCancel;
  const isPendingCancel = status?.isPendingCancel;
  const isPaused = status?.isPaused;

  // Admin users — show read-only info card
  if (status?.isAdmin) {
    return (
      <Card className={isMI ? 'bg-mi-navy-light border-mi-cyan/20' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className={`flex items-center gap-2 ${isMI ? 'text-white' : ''}`}>
              <CreditCard className={`h-5 w-5 ${isMI ? 'text-mi-cyan' : 'text-primary'}`} />
              Subscription
            </CardTitle>
            <Badge className={isMI ? 'bg-mi-cyan/20 text-mi-cyan border-0' : 'bg-primary/10 text-primary border-0'}>
              {status.tier || 'Admin'}
            </Badge>
          </div>
          <CardDescription className={isMI ? 'text-white/60' : ''}>
            Admin accounts have full access without a subscription.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Status badge
  const statusBadge = () => {
    if (isPaused) {
      return (
        <Badge className={isMI ? 'bg-orange-400/20 text-orange-400 border-0' : 'bg-orange-100 text-orange-700 border-0'}>
          Paused
        </Badge>
      );
    }
    if (isPendingCancel) {
      return (
        <Badge className={isMI ? 'bg-red-400/20 text-red-400 border-0' : 'bg-red-100 text-red-700 border-0'}>
          Cancelling
        </Badge>
      );
    }
    if (isActive) {
      return (
        <Badge className={isMI ? 'bg-green-400/20 text-green-400 border-0' : 'bg-green-100 text-green-700 border-0'}>
          Active
        </Badge>
      );
    }
    return null;
  };

  return (
    <>
      <Card className={isMI ? 'bg-mi-navy-light border-mi-cyan/20' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className={`flex items-center gap-2 ${isMI ? 'text-white' : ''}`}>
              <CreditCard className={`h-5 w-5 ${isMI ? 'text-mi-cyan' : 'text-primary'}`} />
              Subscription
            </CardTitle>
            {statusBadge()}
          </div>
          <CardDescription className={isMI ? 'text-white/60' : ''}>
            Manage your Nette AI subscription
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Plan info */}
          <div className={`rounded-lg border p-4 space-y-3 ${
            isMI ? 'bg-mi-navy border-mi-cyan/20' : 'bg-muted/50 border-border'
          }`}>
            <div className="flex justify-between items-start">
              <div>
                <p className={`text-sm font-medium ${isMI ? 'text-white/70' : 'text-muted-foreground'}`}>
                  Plan
                </p>
                <p className={`font-semibold ${isMI ? 'text-white' : 'text-foreground'}`}>
                  {status?.tier || 'Nette AI'}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-medium ${isMI ? 'text-white/70' : 'text-muted-foreground'}`}>
                  {isPendingCancel ? 'Access until' : isPaused ? 'Paused since' : 'Next billing'}
                </p>
                <p className={`font-semibold ${
                  isPendingCancel
                    ? isMI ? 'text-red-400' : 'text-red-600'
                    : isMI ? 'text-white' : 'text-foreground'
                }`}>
                  {formatDate(status?.expiresAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Grace period warning */}
          {isPendingCancel && (
            <div className={`rounded-lg border p-4 ${
              isMI ? 'bg-red-400/5 border-red-400/20' : 'bg-red-50 border-red-200'
            }`}>
              <p className={`text-sm ${isMI ? 'text-red-400' : 'text-red-700'}`}>
                Your subscription is set to cancel on {formatDate(status?.expiresAt)}.
                You'll still have full access until then.
              </p>
            </div>
          )}

          {/* Paused info */}
          {isPaused && (
            <div className={`rounded-lg border p-4 ${
              isMI ? 'bg-orange-400/5 border-orange-400/20' : 'bg-orange-50 border-orange-200'
            }`}>
              <p className={`text-sm ${isMI ? 'text-orange-400' : 'text-orange-700'}`}>
                Your subscription is paused. Resume anytime to pick up where you left off.
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            {/* Payment method — always show for active/pending cancel */}
            {(isActive || isPendingCancel) && status?.manageUrl && (
              <Button
                variant="outline"
                size="sm"
                asChild
                className={isMI ? 'border-mi-cyan/30 text-white hover:bg-mi-navy' : ''}
              >
                <a href="https://whop.com/billing/manage/payment-methods/" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Update Payment Method
                </a>
              </Button>
            )}

            {/* Undo cancellation */}
            {isPendingCancel && (
              <Button
                size="sm"
                onClick={handleUncancel}
                disabled={isActioning}
                className={
                  isMI
                    ? 'bg-mi-cyan hover:bg-mi-cyan/80 text-mi-navy font-semibold'
                    : ''
                }
              >
                {isActioning ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Undo2 className="w-4 h-4 mr-2" />
                )}
                Undo Cancellation
              </Button>
            )}

            {/* Resume from pause */}
            {isPaused && (
              <Button
                size="sm"
                onClick={handleResume}
                disabled={isActioning}
                className={
                  isMI
                    ? 'bg-mi-cyan hover:bg-mi-cyan/80 text-mi-navy font-semibold'
                    : ''
                }
              >
                {isActioning ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                Resume Subscription
              </Button>
            )}

            {/* Cancel — only for active, non-pending-cancel subscriptions */}
            {isActive && (
              <button
                onClick={() => setCancelDialogOpen(true)}
                className={`text-sm underline-offset-4 hover:underline px-2 py-1 ${
                  isMI ? 'text-white/40 hover:text-white/60' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Cancel subscription
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      <CancelFlowDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        isMI={isMI}
        expiresAt={status?.expiresAt || null}
        daysMember={metrics.daysMember}
        conversationsHeld={metrics.conversationsHeld}
        programsAccessed={metrics.programsAccessed}
        onCancel={handleCancel}
        onPause={handlePause}
      />
    </>
  );
}
