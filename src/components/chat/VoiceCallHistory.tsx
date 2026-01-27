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

  // Check if call is within last 24 hours (considered "recent")
  const isRecent = (call: VoiceCallForChat) => {
    const callDate = new Date(call.created_at);
    const now = new Date();
    const hoursDiff = (now.getTime() - callDate.getTime()) / (1000 * 60 * 60);
    return hoursDiff < 24;
  };

  return (
    <div className={cn('space-y-4', className)}>
      {sortedCalls.map((call, index) => (
        <VoiceCallCard
          key={call.id}
          call={call}
          userTimezone={userTimezone}
          isRecent={index === 0 && isRecent(call)}
        />
      ))}
    </div>
  );
}
