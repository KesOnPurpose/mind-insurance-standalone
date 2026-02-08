import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const CANCEL_REASONS = [
  { value: 'too_expensive', label: "It's too expensive right now" },
  { value: 'not_using', label: "I'm not using it enough" },
  { value: 'not_helpful', label: "It's not helping me the way I expected" },
  { value: 'found_alternative', label: 'I found something else that works better' },
  { value: 'temporary_break', label: 'I just need a break' },
] as const;

interface ExitSurveyProps {
  isMI: boolean;
  onNext: (reason: string, reasonText?: string) => void;
  onSkip: () => void;
}

export function ExitSurvey({ isMI, onNext, onSkip }: ExitSurveyProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [otherText, setOtherText] = useState('');
  const [showOther, setShowOther] = useState(false);

  const handleReasonChange = (value: string) => {
    setSelectedReason(value);
    setShowOther(value === 'other');
  };

  const handleContinue = () => {
    const reasonText = selectedReason === 'other' ? otherText : undefined;
    onNext(selectedReason, reasonText);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className={`text-lg font-semibold ${isMI ? 'text-white' : 'text-foreground'}`}>
          Before you go...
        </h3>
        <p className={`text-sm ${isMI ? 'text-white/60' : 'text-muted-foreground'}`}>
          We'd love to understand what's happening. This helps us improve for everyone.
        </p>
      </div>

      <RadioGroup value={selectedReason} onValueChange={handleReasonChange}>
        <div className="space-y-2">
          {CANCEL_REASONS.map((reason) => (
            <div
              key={reason.value}
              className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                selectedReason === reason.value
                  ? isMI
                    ? 'border-mi-cyan/50 bg-mi-cyan/10'
                    : 'border-primary/50 bg-primary/5'
                  : isMI
                    ? 'border-white/10 hover:bg-white/5'
                    : 'border-border hover:bg-muted/50'
              }`}
            >
              <RadioGroupItem
                value={reason.value}
                id={`reason-${reason.value}`}
                className={isMI ? 'border-mi-cyan/50 text-mi-cyan' : ''}
              />
              <Label
                htmlFor={`reason-${reason.value}`}
                className={`cursor-pointer flex-1 ${isMI ? 'text-white' : ''}`}
              >
                {reason.label}
              </Label>
            </div>
          ))}

          {/* Other option */}
          <div
            className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${
              selectedReason === 'other'
                ? isMI
                  ? 'border-mi-cyan/50 bg-mi-cyan/10'
                  : 'border-primary/50 bg-primary/5'
                : isMI
                  ? 'border-white/10 hover:bg-white/5'
                  : 'border-border hover:bg-muted/50'
            }`}
          >
            <RadioGroupItem
              value="other"
              id="reason-other"
              className={isMI ? 'border-mi-cyan/50 text-mi-cyan' : ''}
            />
            <Label
              htmlFor="reason-other"
              className={`cursor-pointer flex-1 ${isMI ? 'text-white' : ''}`}
            >
              Something else
            </Label>
          </div>
        </div>
      </RadioGroup>

      {showOther && (
        <Textarea
          placeholder="Tell us more (optional)..."
          value={otherText}
          onChange={(e) => setOtherText(e.target.value)}
          className={`resize-none ${
            isMI
              ? 'bg-mi-navy border-mi-cyan/30 text-white placeholder:text-white/40'
              : ''
          }`}
          rows={3}
        />
      )}

      <div className="flex items-center justify-between pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onSkip}
          className={isMI ? 'text-white/50 hover:text-white/70 hover:bg-transparent' : 'text-muted-foreground'}
        >
          Skip
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!selectedReason}
          className={
            isMI
              ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
              : ''
          }
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
