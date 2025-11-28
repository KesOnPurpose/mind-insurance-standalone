import { VaultRecording } from '@/hooks/useVaultRecordings';
import { RecordingCard } from './RecordingCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Mic, MicOff } from 'lucide-react';

interface RecordingListProps {
  recordings: VaultRecording[];
  isLoading: boolean;
  onDelete: (id: string) => Promise<void>;
  isDeleting?: boolean;
  emptyMessage?: string;
}

/**
 * Loading skeleton for the recording list
 */
function RecordingListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-4 border rounded-lg">
          <div className="flex items-start gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Empty state when no recordings exist
 */
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-4">
        <MicOff className="w-8 h-8 text-purple-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No Recordings Yet</h3>
      <p className="text-muted-foreground max-w-sm">
        {message}
      </p>
    </div>
  );
}

/**
 * Component to display a list of vault recordings
 */
export function RecordingList({
  recordings,
  isLoading,
  onDelete,
  isDeleting,
  emptyMessage = "Your voice recordings from Mind Insurance practices will appear here. Complete a practice with voice recording to get started.",
}: RecordingListProps) {
  if (isLoading) {
    return <RecordingListSkeleton />;
  }

  if (recordings.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <div className="space-y-4">
      {recordings.map((recording) => (
        <RecordingCard
          key={recording.id}
          recording={recording}
          onDelete={onDelete}
          isDeleting={isDeleting}
        />
      ))}
    </div>
  );
}

export default RecordingList;
