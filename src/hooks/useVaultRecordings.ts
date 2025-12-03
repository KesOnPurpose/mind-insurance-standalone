import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface VaultRecording {
  id: string;
  recording_url: string;
  recording_duration: number;
  recording_type: 'identity' | 'celebration' | 'pattern' | 'visualization' | 'other';
  transcription_text: string | null;
  transcription_status: 'pending' | 'completed' | 'failed' | null;
  created_at: string;
}

export interface VaultStats {
  totalRecordings: number;
  totalDuration: number; // in seconds
  byType: Record<string, number>;
}

export interface UseVaultRecordingsReturn {
  recordings: VaultRecording[];
  isLoading: boolean;
  error: Error | null;
  stats: VaultStats;
  deleteRecording: (id: string) => Promise<void>;
  refetch: () => void;
}

/**
 * Format duration in seconds to "Xm Ys" or "X:YY" format
 */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format total duration in seconds to "Xh Ym" format
 */
export function formatTotalDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "0m";
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

/**
 * Get badge color class based on recording type
 */
export function getRecordingTypeColor(type: string): string {
  switch (type) {
    case 'identity':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'celebration':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'pattern':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'visualization':
      return 'bg-green-100 text-green-700 border-green-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

/**
 * Get display label for recording type
 */
export function getRecordingTypeLabel(type: string): string {
  switch (type) {
    case 'identity':
      return 'Identity';
    case 'celebration':
      return 'Celebration';
    case 'pattern':
      return 'Pattern';
    case 'visualization':
      return 'Visualization';
    default:
      return 'Other';
  }
}

/**
 * Hook to fetch and manage voice recordings from the vault
 */
export function useVaultRecordings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['vaultRecordings', user?.id],
    queryFn: async (): Promise<{ recordings: VaultRecording[]; stats: VaultStats }> => {
      if (!user?.id) throw new Error('User not authenticated');

      // Fetch all recordings for the user (excluding soft-deleted)
      const { data: recordings, error } = await supabase
        .from('voice_recordings')
        .select('id, recording_url, recording_duration, recording_type, transcription_text, transcription_status, created_at')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching vault recordings:', error);
        throw error;
      }

      const recordingsList = (recordings || []) as VaultRecording[];

      // Calculate stats
      const stats: VaultStats = {
        totalRecordings: recordingsList.length,
        totalDuration: recordingsList.reduce((sum, r) => sum + (r.recording_duration || 0), 0),
        byType: recordingsList.reduce((acc, r) => {
          const type = r.recording_type || 'other';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      };

      return { recordings: recordingsList, stats };
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
  });

  // Delete mutation (soft delete)
  const deleteMutation = useMutation({
    mutationFn: async (recordingId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Soft delete by setting deleted_at timestamp
      const { error } = await supabase
        .from('voice_recordings')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', recordingId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting recording:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['vaultRecordings', user?.id] });
    },
  });

  return {
    recordings: query.data?.recordings || [],
    stats: query.data?.stats || { totalRecordings: 0, totalDuration: 0, byType: {} },
    isLoading: query.isLoading,
    error: query.error,
    deleteRecording: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    refetch: query.refetch,
  };
}

export default useVaultRecordings;
