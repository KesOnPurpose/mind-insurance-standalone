import { CheckCircle2, Phone, AlertCircle, Shield, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VoicePhoneStatusProps {
  verifiedPhone: string | null;
  onVerifyClick: () => void;
  className?: string;
}

export function VoicePhoneStatus({ verifiedPhone, onVerifyClick, className }: VoicePhoneStatusProps) {
  const isVerified = !!verifiedPhone;

  // Mask phone number for display (show last 4 digits)
  const maskedPhone = verifiedPhone
    ? verifiedPhone.replace(/(\d{1,3})(\d{3})(\d{4})$/, '$1 ***-$3')
    : null;

  if (isVerified) {
    return (
      <div
        className={cn(
          'phone-status-verified relative overflow-hidden rounded-2xl',
          'border border-emerald-500/20',
          className
        )}
      >
        {/* Premium glass background with gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent" />
        <div className="absolute inset-0 backdrop-blur-xl" />

        {/* Subtle shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer" />

        {/* Content */}
        <div className="relative flex items-center gap-4 px-5 py-4">
          {/* Animated check icon with glow */}
          <div className="relative">
            {/* Pulsing glow ring */}
            <div
              className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping"
              style={{ animationDuration: '2s' }}
            />
            {/* Icon container */}
            <div className="relative w-11 h-11 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              Phone Verified
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            </p>
            <p className="text-sm text-muted-foreground font-mono tracking-wide truncate">
              {maskedPhone}
            </p>
          </div>

          {/* Subtle shield icon for security indicator */}
          <Shield className="w-5 h-5 text-emerald-500/40 shrink-0" />
        </div>
      </div>
    );
  }

  // Unverified state - Premium CTA design
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl',
        'border border-amber-500/20 bg-gradient-to-r from-amber-500/5 via-amber-500/3 to-transparent',
        className
      )}
    >
      {/* Glass effect */}
      <div className="absolute inset-0 backdrop-blur-xl" />

      {/* Content */}
      <div className="relative flex items-center gap-4 px-5 py-4">
        {/* Attention-grabbing icon */}
        <div className="relative">
          <div
            className="absolute inset-0 bg-amber-500/20 rounded-full animate-pulse"
          />
          <div className="relative w-11 h-11 rounded-full bg-gradient-to-br from-amber-400/80 to-amber-600/80 flex items-center justify-center border border-amber-400/30">
            <Phone className="w-5 h-5 text-white" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            Add Your Phone
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
          </p>
          <p className="text-xs text-muted-foreground">
            Enable voice calls with Nette
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onVerifyClick}
          className={cn(
            'shrink-0 px-4',
            'bg-gradient-to-r from-amber-500/10 to-amber-600/5',
            'border-amber-500/30 text-amber-600 dark:text-amber-400',
            'hover:bg-amber-500/20 hover:border-amber-500/50',
            'transition-all duration-200',
            'shadow-sm shadow-amber-500/10'
          )}
        >
          Verify
        </Button>
      </div>
    </div>
  );
}
