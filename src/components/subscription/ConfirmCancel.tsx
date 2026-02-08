import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmCancelProps {
  isMI: boolean;
  expiresAt: string | null;
  isCancelling: boolean;
  onKeep: () => void;
  onCancel: () => void;
}

export function ConfirmCancel({ isMI, expiresAt, isCancelling, onKeep, onCancel }: ConfirmCancelProps) {
  const formattedDate = expiresAt
    ? new Date(expiresAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'the end of your billing period';

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${
          isMI ? 'bg-orange-400/10' : 'bg-orange-50'
        }`}>
          <AlertTriangle className={`w-6 h-6 ${isMI ? 'text-orange-400' : 'text-orange-500'}`} />
        </div>
        <h3 className={`text-lg font-semibold ${isMI ? 'text-white' : 'text-foreground'}`}>
          Confirm cancellation
        </h3>
      </div>

      <div className={`rounded-lg border p-4 space-y-3 ${
        isMI ? 'bg-white/5 border-white/10' : 'bg-muted/50 border-border'
      }`}>
        <p className={`text-sm ${isMI ? 'text-white/80' : 'text-foreground'}`}>
          Here's what will happen:
        </p>
        <ul className={`space-y-2 text-sm ${isMI ? 'text-white/60' : 'text-muted-foreground'}`}>
          <li className="flex items-start gap-2">
            <span>-</span>
            Your access continues until <strong className={isMI ? 'text-white' : 'text-foreground'}>{formattedDate}</strong>
          </li>
          <li className="flex items-start gap-2">
            <span>-</span>
            No further charges after that date
          </li>
          <li className="flex items-start gap-2">
            <span>-</span>
            Your data and progress will be safely preserved
          </li>
          <li className="flex items-start gap-2">
            <span>-</span>
            You can undo this anytime before {formattedDate}
          </li>
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2">
        <Button
          onClick={onKeep}
          disabled={isCancelling}
          variant="outline"
          className={`${
            isMI
              ? 'border-mi-cyan/30 text-white hover:bg-mi-cyan/10'
              : ''
          }`}
        >
          Keep My Subscription
        </Button>
        <Button
          onClick={onCancel}
          disabled={isCancelling}
          variant="outline"
          className={`${
            isMI
              ? 'border-red-400/30 text-red-400 hover:bg-red-400/10'
              : 'border-red-200 text-red-600 hover:bg-red-50'
          }`}
        >
          {isCancelling ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Cancelling...</>
          ) : (
            'Cancel Subscription'
          )}
        </Button>
      </div>
    </div>
  );
}
