import { Phone, Sparkles, Shield, Waves } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceEmptyStateProps {
  className?: string;
}

export function VoiceEmptyState({ className }: VoiceEmptyStateProps) {
  return (
    <div
      className={cn(
        'voice-empty-state',
        'relative flex flex-col items-center justify-center',
        'py-16 px-8 text-center',
        'rounded-2xl',
        'bg-gradient-to-b from-muted/20 via-transparent to-transparent',
        'border border-border/30',
        className
      )}
    >
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-30 pointer-events-none overflow-hidden rounded-2xl">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-secondary/5 rounded-full blur-2xl" />
      </div>

      <div className="relative">
        {/* Outer decorative ring */}
        <div
          className="absolute -inset-4 rounded-full border border-primary/10 animate-pulse"
          style={{ animationDuration: '4s' }}
        />
        {/* Middle decorative ring */}
        <div
          className="absolute -inset-2 rounded-full border border-primary/20"
        />

        {/* Main icon container with premium gradient */}
        <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center shadow-lg shadow-primary/10 border border-primary/20">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-card to-card/80 flex items-center justify-center">
            <Phone className="w-9 h-9 text-primary" />
          </div>
        </div>

        {/* Sparkle accents */}
        <div className="absolute -top-2 -right-2 animate-bounce" style={{ animationDuration: '3s' }}>
          <Sparkles className="w-5 h-5 text-secondary" />
        </div>
        <div className="absolute -bottom-1 -left-3 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
          <Waves className="w-4 h-4 text-primary/50" />
        </div>
      </div>

      <div className="mt-8 space-y-3 max-w-[320px]">
        <h3 className="text-xl font-semibold text-foreground">
          No Voice Calls Yet
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Start your first voice conversation with Nette. Your call history and
          insights will appear here.
        </p>
      </div>

      {/* Feature highlights */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50">
          <Shield className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-xs text-muted-foreground">Private & Encrypted</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs text-muted-foreground">AI-Powered</span>
        </div>
      </div>
    </div>
  );
}
