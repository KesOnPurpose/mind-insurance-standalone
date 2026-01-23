import { VoiceCallCard } from './VoiceCallCard';
import { VoiceEmptyState } from './VoiceEmptyState';
import type { VoiceCallForChat } from '@/services/netteVoiceCallService';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceCallHistoryProps {
  voiceCalls: VoiceCallForChat[];
  userTimezone?: string;
  isLoading?: boolean;
  className?: string;
}

export function VoiceCallHistory({
  voiceCalls,
  userTimezone,
  isLoading = false,
  className,
}: VoiceCallHistoryProps) {
  if (isLoading) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12', className)}>
        <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
        <p className="mt-3 text-sm text-muted-foreground">Loading voice calls...</p>
      </div>
    );
  }

  if (voiceCalls.length === 0) {
    return <VoiceEmptyState className={className} />;
  }

  // Sort by date, most recent first
  const sortedCalls = [...voiceCalls].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-foreground">Recent Voice Calls</h3>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {voiceCalls.length}
        </span>
      </div>

      <div className="space-y-3">
        {sortedCalls.map((call) => (
          <VoiceCallCard
            key={call.id}
            call={call}
            userTimezone={userTimezone}
          />
        ))}
      </div>
    </div>
  );
}
