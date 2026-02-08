import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ExitSurvey } from './ExitSurvey';
import { ValueReminder } from './ValueReminder';
import { PauseOffer } from './PauseOffer';
import { ConfirmCancel } from './ConfirmCancel';

type Step = 'survey' | 'value' | 'pause' | 'confirm';

const STEPS: Step[] = ['survey', 'value', 'pause', 'confirm'];

interface CancelFlowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isMI: boolean;
  expiresAt: string | null;
  daysMember?: number;
  conversationsHeld?: number;
  programsAccessed?: number;
  onCancel: (reason?: string, reasonText?: string) => Promise<boolean>;
  onPause: () => Promise<boolean>;
}

export function CancelFlowDialog({
  open,
  onOpenChange,
  isMI,
  expiresAt,
  daysMember,
  conversationsHeld,
  programsAccessed,
  onCancel,
  onPause,
}: CancelFlowDialogProps) {
  const [currentStep, setCurrentStep] = useState<Step>('survey');
  const [cancelReason, setCancelReason] = useState('');
  const [cancelReasonText, setCancelReasonText] = useState<string | undefined>();
  const [isCancelling, setIsCancelling] = useState(false);
  const [isPausing, setIsPausing] = useState(false);

  const currentIndex = STEPS.indexOf(currentStep);

  const resetAndClose = () => {
    setCurrentStep('survey');
    setCancelReason('');
    setCancelReasonText(undefined);
    setIsCancelling(false);
    setIsPausing(false);
    onOpenChange(false);
  };

  const handleSurveyNext = (reason: string, reasonText?: string) => {
    setCancelReason(reason);
    setCancelReasonText(reasonText);
    setCurrentStep('value');
  };

  const handleSurveySkip = () => {
    setCurrentStep('value');
  };

  const handleValueNext = () => {
    setCurrentStep('pause');
  };

  const handlePause = async () => {
    setIsPausing(true);
    const success = await onPause();
    setIsPausing(false);
    if (success) {
      resetAndClose();
    }
  };

  const handlePauseSkip = () => {
    setCurrentStep('confirm');
  };

  const handleConfirmCancel = async () => {
    setIsCancelling(true);
    const success = await onCancel(cancelReason, cancelReasonText);
    setIsCancelling(false);
    if (success) {
      resetAndClose();
    }
  };

  const handleKeep = () => {
    resetAndClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetAndClose(); }}>
      <DialogContent
        className={`sm:max-w-md ${
          isMI ? 'bg-mi-navy-light border-mi-cyan/20 text-white' : ''
        }`}
      >
        <DialogHeader>
          <DialogTitle className={`sr-only`}>
            Cancel Subscription
          </DialogTitle>
        </DialogHeader>

        {/* Step indicator dots */}
        <div className="flex justify-center gap-2 pb-2">
          {STEPS.map((step, i) => (
            <div
              key={step}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === currentIndex
                  ? isMI ? 'bg-mi-cyan' : 'bg-primary'
                  : i < currentIndex
                    ? isMI ? 'bg-mi-cyan/40' : 'bg-primary/40'
                    : isMI ? 'bg-white/20' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {currentStep === 'survey' && (
          <ExitSurvey
            isMI={isMI}
            onNext={handleSurveyNext}
            onSkip={handleSurveySkip}
          />
        )}

        {currentStep === 'value' && (
          <ValueReminder
            isMI={isMI}
            daysMember={daysMember}
            conversationsHeld={conversationsHeld}
            programsAccessed={programsAccessed}
            onNext={handleValueNext}
          />
        )}

        {currentStep === 'pause' && (
          <PauseOffer
            isMI={isMI}
            isPausing={isPausing}
            onPause={handlePause}
            onSkip={handlePauseSkip}
          />
        )}

        {currentStep === 'confirm' && (
          <ConfirmCancel
            isMI={isMI}
            expiresAt={expiresAt}
            isCancelling={isCancelling}
            onKeep={handleKeep}
            onCancel={handleConfirmCancel}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
