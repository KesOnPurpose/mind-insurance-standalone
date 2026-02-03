import { Button } from '@/components/ui/button';
import { Pause, Loader2 } from 'lucide-react';

interface PauseOfferProps {
  isMI: boolean;
  isPausing: boolean;
  onPause: () => void;
  onSkip: () => void;
}

export function PauseOffer({ isMI, isPausing, onPause, onSkip }: PauseOfferProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${
          isMI ? 'bg-mi-cyan/10' : 'bg-blue-50'
        }`}>
          <Pause className={`w-6 h-6 ${isMI ? 'text-mi-cyan' : 'text-blue-500'}`} />
        </div>
        <h3 className={`text-lg font-semibold ${isMI ? 'text-white' : 'text-foreground'}`}>
          Not ready to commit right now?
        </h3>
        <p className={`text-sm ${isMI ? 'text-white/60' : 'text-muted-foreground'}`}>
          Life gets busy. Instead of cancelling, you can pause for 30 days.
          Your data stays safe, and you can pick right back up.
        </p>
      </div>

      <div className={`rounded-lg border p-4 space-y-3 ${
        isMI ? 'bg-mi-cyan/5 border-mi-cyan/20' : 'bg-blue-50 border-blue-200'
      }`}>
        <h4 className={`font-medium ${isMI ? 'text-white' : 'text-foreground'}`}>
          What happens when you pause:
        </h4>
        <ul className={`space-y-2 text-sm ${isMI ? 'text-white/70' : 'text-muted-foreground'}`}>
          <li className="flex items-start gap-2">
            <span className={isMI ? 'text-mi-cyan' : 'text-blue-500'}>-</span>
            No charges for 30 days
          </li>
          <li className="flex items-start gap-2">
            <span className={isMI ? 'text-mi-cyan' : 'text-blue-500'}>-</span>
            All your data and progress stays saved
          </li>
          <li className="flex items-start gap-2">
            <span className={isMI ? 'text-mi-cyan' : 'text-blue-500'}>-</span>
            Resume anytime with one click
          </li>
        </ul>
      </div>

      <div className="space-y-3">
        <Button
          onClick={onPause}
          disabled={isPausing}
          className={`w-full ${
            isMI
              ? 'bg-mi-cyan hover:bg-mi-cyan/80 text-mi-navy font-semibold'
              : ''
          }`}
        >
          {isPausing ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Pausing...</>
          ) : (
            <><Pause className="w-4 h-4 mr-2" />Pause for 30 Days</>
          )}
        </Button>

        <div className="text-center">
          <button
            onClick={onSkip}
            disabled={isPausing}
            className={`text-sm underline-offset-4 hover:underline ${
              isMI ? 'text-white/50 hover:text-white/70' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            No thanks, continue to cancel
          </button>
        </div>
      </div>
    </div>
  );
}
