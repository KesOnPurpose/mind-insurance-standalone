import { AlertTriangle, Clock, X } from 'lucide-react';
import { useState } from 'react';
import type { SubscriptionStatus } from '@/hooks/useSubscriptionCheck';

interface SubscriptionBannerProps {
  status: SubscriptionStatus;
}

export function SubscriptionBanner({ status }: SubscriptionBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  // Only show banner for warning states (not expired - that redirects)
  if (!status.hasRecord) return null;
  if (status.enrollmentStatus !== 'cancelled' && status.enrollmentStatus !== 'past_due') return null;
  if (!status.isGracePeriod) return null;

  const expiresAt = status.expiresAt ? new Date(status.expiresAt) : null;
  const daysRemaining = expiresAt
    ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const isCancelled = status.enrollmentStatus === 'cancelled';
  const isPastDue = status.enrollmentStatus === 'past_due';

  return (
    <div className={`relative px-4 py-3 text-sm ${
      isPastDue
        ? 'bg-destructive/10 text-destructive border-b border-destructive/20'
        : 'bg-warning/10 text-warning-foreground border-b border-warning/20'
    }`}>
      <div className="flex items-center gap-2 max-w-screen-xl mx-auto">
        {isPastDue ? (
          <AlertTriangle className="w-4 h-4 shrink-0" />
        ) : (
          <Clock className="w-4 h-4 shrink-0" />
        )}
        <span className="flex-1">
          {isPastDue && (
            <>
              Payment issue detected. Please update your payment method.
              {daysRemaining !== null && ` Access expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}.`}
            </>
          )}
          {isCancelled && (
            <>
              Your subscription has been cancelled.
              {daysRemaining !== null && daysRemaining > 0
                ? ` You have ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} of access remaining.`
                : ' Your access ends today.'}
            </>
          )}
        </span>
        <a
          href="https://go.grouphomecashflow.com/checkout-page-nette-ai"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 underline font-medium hover:no-underline"
        >
          {isPastDue ? 'Update Payment' : 'Resubscribe'}
        </a>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 p-1 rounded hover:bg-black/10"
          aria-label="Dismiss banner"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
