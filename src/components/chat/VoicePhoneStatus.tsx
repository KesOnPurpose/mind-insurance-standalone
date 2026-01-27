import { CheckCircle2, Phone, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VoicePhoneStatusProps {
  verifiedPhone: string | null;
  onVerifyClick: () => void;
  compact?: boolean;
  className?: string;
}

export function VoicePhoneStatus({
  verifiedPhone,
  onVerifyClick,
  compact = false,
  className
}: VoicePhoneStatusProps) {
  const isVerified = !!verifiedPhone;

  // Mask phone number for display (show last 4 digits)
  const maskedPhone = verifiedPhone
    ? verifiedPhone.replace(/(\d{1,3})(\d{3})(\d{4})$/, '+1 ***-$3')
    : null;

  if (isVerified) {
    return (
      <div
        className={cn(
          'phone-status-verified',
          'flex items-center gap-2',
          compact ? 'px-3 py-2 rounded-lg bg-muted/50' : 'px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20',
          className
        )}
      >
        <CheckCircle2 className={cn(
          'text-emerald-500 shrink-0',
          compact ? 'w-4 h-4' : 'w-5 h-5'
        )} />
        <span className={cn(
          'font-medium text-foreground',
          compact ? 'text-sm' : 'text-base'
        )}>
          Phone Verified
        </span>
        <span className={cn(
          'text-muted-foreground font-mono',
          compact ? 'text-xs' : 'text-sm'
        )}>
          {maskedPhone}
        </span>
      </div>
    );
  }

  // Unverified state
  return (
    <div
      className={cn(
        'phone-status-unverified',
        'flex items-center gap-2',
        compact ? 'px-3 py-2 rounded-lg bg-muted/50' : 'px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20',
        className
      )}
    >
      <AlertCircle className={cn(
        'text-amber-500 shrink-0',
        compact ? 'w-4 h-4' : 'w-5 h-5'
      )} />
      <span className={cn(
        'flex-1 text-muted-foreground',
        compact ? 'text-sm' : 'text-base'
      )}>
        Verify your phone to call Nette
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={onVerifyClick}
        className={cn(
          'shrink-0',
          compact ? 'h-7 px-2 text-xs' : 'h-8 px-3 text-sm'
        )}
      >
        <Phone className="w-3 h-3 mr-1" />
        Verify
      </Button>
    </div>
  );
}
