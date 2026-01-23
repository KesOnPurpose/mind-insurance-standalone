/**
 * FEAT-GH-005-C: useVideoProgress Hook
 *
 * React hook for managing video progress tracking with:
 * - Real-time progress updates with debouncing
 * - Automatic gate status tracking
 * - Optimistic updates for smooth UX
 * - Auto-resume from last position
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  getVideoProgress,
  updateVideoProgress,
  markVideoComplete,
  getUserTacticProgress,
  checkCompletionGates,
  enrichVideoProgressForUI,
  detectDeviceType,
  detectBrowser,
  formatPosition,
  formatWatchTime,
} from '@/services/videoProgressService';
import type {
  VideoProgressRecord,
  VideoProgressState,
  VideoEventType,
  UserTacticProgress,
  CompletionGateCheck,
  VideoProgressWithUI,
} from '@/types/video';

// =============================================================================
// CONSTANTS
// =============================================================================

const PROGRESS_SAVE_INTERVAL_MS = 5000; // Save progress every 5 seconds
const PROGRESS_QUERY_STALE_TIME = 30000; // 30 seconds stale time
const DEFAULT_COMPLETION_THRESHOLD = 90;

// =============================================================================
// TYPES
// =============================================================================

interface UseVideoProgressOptions {
  tacticId: string;
  videoUrl: string;
  duration?: number;
  completionThreshold?: number;
  onComplete?: () => void;
  onGatesMet?: () => void;
}

interface UseVideoProgressReturn {
  // State
  progress: VideoProgressWithUI | null;
  tacticProgress: UserTacticProgress | null;
  gateCheck: CompletionGateCheck | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  // Current playback state
  currentState: VideoProgressState;

  // Actions
  updateProgress: (positionSeconds: number, durationSeconds: number) => void;
  recordEvent: (eventType: VideoEventType, positionSeconds: number) => void;
  markComplete: () => void;
  resetProgress: () => void;

  // Helpers
  getResumePosition: () => number;
  isGateMet: boolean;
  isAlmostComplete: boolean;
  remainingPercentage: number;
}

// =============================================================================
// HOOK
// =============================================================================

export function useVideoProgress(options: UseVideoProgressOptions): UseVideoProgressReturn {
  const {
    tacticId,
    videoUrl,
    duration = 0,
    completionThreshold = DEFAULT_COMPLETION_THRESHOLD,
    onComplete,
    onGatesMet,
  } = options;

  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Local state for current playback
  const [currentState, setCurrentState] = useState<VideoProgressState>({
    currentTime: 0,
    duration: duration,
    watchPercentage: 0,
    isComplete: false,
    thresholdMet: false,
  });

  // Refs for debouncing
  const lastSaveTime = useRef<number>(0);
  const pendingSave = useRef<NodeJS.Timeout | null>(null);
  const hasTriggeredComplete = useRef(false);
  const hasTriggeredGatesMet = useRef(false);

  // =============================================================================
  // QUERIES
  // =============================================================================

  // Fetch existing video progress
  const {
    data: progressResult,
    isLoading: isLoadingProgress,
    error: progressError,
  } = useQuery({
    queryKey: ['videoProgress', user?.id, tacticId, videoUrl],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      const result = await getVideoProgress({
        userId: user.id,
        tacticId,
        videoUrl,
      });
      if (!result.success && result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!user?.id && !!tacticId && !!videoUrl,
    staleTime: PROGRESS_QUERY_STALE_TIME,
  });

  // Fetch tactic progress (gate status)
  const {
    data: tacticProgressResult,
    isLoading: isLoadingTacticProgress,
  } = useQuery({
    queryKey: ['tacticProgress', user?.id, tacticId],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      const result = await getUserTacticProgress(user.id, tacticId);
      if (!result.success && result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!user?.id && !!tacticId,
    staleTime: PROGRESS_QUERY_STALE_TIME,
  });

  // Fetch gate check status
  const { data: gateCheckResult } = useQuery({
    queryKey: ['gateCheck', user?.id, tacticId],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      const result = await checkCompletionGates(user.id, tacticId);
      if (!result.success && result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!user?.id && !!tacticId,
    staleTime: PROGRESS_QUERY_STALE_TIME,
  });

  // =============================================================================
  // MUTATIONS
  // =============================================================================

  const saveProgressMutation = useMutation({
    mutationFn: async ({
      positionSeconds,
      durationSeconds,
      eventType,
    }: {
      positionSeconds: number;
      durationSeconds: number;
      eventType?: VideoEventType;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const result = await updateVideoProgress({
        user_id: user.id,
        tactic_id: tacticId,
        video_url: videoUrl,
        position_seconds: positionSeconds,
        duration_seconds: durationSeconds,
        event_type: eventType,
        device_type: detectDeviceType(),
        browser: detectBrowser(),
        createIfNotExists: true,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to save progress');
      }

      return result.data;
    },
    onSuccess: (data) => {
      // Update cache
      queryClient.setQueryData(['videoProgress', user?.id, tacticId, videoUrl], data);

      // Check if completion threshold just met
      if (data?.completion_threshold_met && !hasTriggeredComplete.current) {
        hasTriggeredComplete.current = true;
        onComplete?.();
        toast.success('Video completed! 🎉', { duration: 3000 });
      }

      // Invalidate tactic progress to refresh gate status
      queryClient.invalidateQueries({ queryKey: ['tacticProgress', user?.id, tacticId] });
      queryClient.invalidateQueries({ queryKey: ['gateCheck', user?.id, tacticId] });
    },
    onError: (error: Error) => {
      console.error('Failed to save video progress:', error);
      // Don't show toast for every save error - would be too noisy
    },
  });

  const markCompleteMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      const result = await markVideoComplete(user.id, tacticId, videoUrl);
      if (!result.success) {
        throw new Error(result.error || 'Failed to mark video complete');
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videoProgress', user?.id, tacticId, videoUrl] });
      queryClient.invalidateQueries({ queryKey: ['tacticProgress', user?.id, tacticId] });
      queryClient.invalidateQueries({ queryKey: ['gateCheck', user?.id, tacticId] });
      toast.success('Video marked as complete! ✅');
      onComplete?.();
    },
    onError: (error: Error) => {
      console.error('Failed to mark video complete:', error);
      toast.error('Failed to mark video complete');
    },
  });

  // =============================================================================
  // CALLBACKS
  // =============================================================================

  /**
   * Update progress with debouncing
   */
  const updateProgress = useCallback(
    (positionSeconds: number, durationSeconds: number) => {
      // Update local state immediately for smooth UI
      const watchPercentage =
        durationSeconds > 0
          ? Math.min(100, (positionSeconds / durationSeconds) * 100)
          : 0;

      setCurrentState({
        currentTime: positionSeconds,
        duration: durationSeconds,
        watchPercentage,
        isComplete: watchPercentage >= 100,
        thresholdMet: watchPercentage >= completionThreshold,
      });

      // Debounce saves to the database
      const now = Date.now();
      if (now - lastSaveTime.current >= PROGRESS_SAVE_INTERVAL_MS) {
        // Save immediately if enough time has passed
        lastSaveTime.current = now;
        saveProgressMutation.mutate({ positionSeconds, durationSeconds });
      } else {
        // Schedule a save
        if (pendingSave.current) {
          clearTimeout(pendingSave.current);
        }
        pendingSave.current = setTimeout(() => {
          lastSaveTime.current = Date.now();
          saveProgressMutation.mutate({ positionSeconds, durationSeconds });
        }, PROGRESS_SAVE_INTERVAL_MS);
      }
    },
    [saveProgressMutation, completionThreshold]
  );

  /**
   * Record a specific video event
   */
  const recordEvent = useCallback(
    (eventType: VideoEventType, positionSeconds: number) => {
      saveProgressMutation.mutate({
        positionSeconds,
        durationSeconds: currentState.duration,
        eventType,
      });
    },
    [saveProgressMutation, currentState.duration]
  );

  /**
   * Manually mark video as complete
   */
  const markComplete = useCallback(() => {
    markCompleteMutation.mutate();
  }, [markCompleteMutation]);

  /**
   * Reset local progress state
   */
  const resetProgress = useCallback(() => {
    setCurrentState({
      currentTime: 0,
      duration: duration,
      watchPercentage: 0,
      isComplete: false,
      thresholdMet: false,
    });
    hasTriggeredComplete.current = false;
    hasTriggeredGatesMet.current = false;
  }, [duration]);

  /**
   * Get the position to resume from
   */
  const getResumePosition = useCallback((): number => {
    if (progressResult?.last_position_seconds) {
      // Resume a few seconds before last position for context
      return Math.max(0, progressResult.last_position_seconds - 5);
    }
    return 0;
  }, [progressResult]);

  // =============================================================================
  // EFFECTS
  // =============================================================================

  // Initialize current state from loaded progress
  useEffect(() => {
    if (progressResult) {
      setCurrentState((prev) => ({
        ...prev,
        watchPercentage: progressResult.watch_percentage || 0,
        isComplete: progressResult.completion_threshold_met || false,
        thresholdMet: (progressResult.watch_percentage || 0) >= completionThreshold,
      }));

      // Set completion flag if already complete
      if (progressResult.completion_threshold_met) {
        hasTriggeredComplete.current = true;
      }
    }
  }, [progressResult, completionThreshold]);

  // Trigger gates met callback
  useEffect(() => {
    if (gateCheckResult?.can_complete && !hasTriggeredGatesMet.current) {
      hasTriggeredGatesMet.current = true;
      onGatesMet?.();
    }
  }, [gateCheckResult, onGatesMet]);

  // Cleanup pending save on unmount
  useEffect(() => {
    return () => {
      if (pendingSave.current) {
        clearTimeout(pendingSave.current);
      }
    };
  }, []);

  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================

  const enrichedProgress = progressResult
    ? enrichVideoProgressForUI(progressResult, completionThreshold)
    : null;

  const isGateMet = tacticProgressResult?.video_gate_met ?? false;
  const isAlmostComplete =
    currentState.watchPercentage >= completionThreshold - 10 &&
    currentState.watchPercentage < completionThreshold;
  const remainingPercentage = Math.max(
    0,
    completionThreshold - currentState.watchPercentage
  );

  // =============================================================================
  // RETURN
  // =============================================================================

  return {
    // State
    progress: enrichedProgress,
    tacticProgress: tacticProgressResult || null,
    gateCheck: gateCheckResult || null,
    isLoading: isLoadingProgress || isLoadingTacticProgress,
    isSaving: saveProgressMutation.isPending,
    error: progressError?.message || null,

    // Current playback state
    currentState,

    // Actions
    updateProgress,
    recordEvent,
    markComplete,
    resetProgress,

    // Helpers
    getResumePosition,
    isGateMet,
    isAlmostComplete,
    remainingPercentage,
  };
}

// =============================================================================
// ADDITIONAL HOOKS
// =============================================================================

/**
 * Simple hook for just displaying video progress (read-only)
 */
export function useVideoProgressDisplay(
  tacticId: string,
  videoUrl?: string
): {
  progress: VideoProgressRecord | null;
  isLoading: boolean;
  watchPercentage: number;
  isComplete: boolean;
} {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['videoProgress', user?.id, tacticId, videoUrl || 'any'],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      const result = await getVideoProgress({
        userId: user.id,
        tacticId,
        videoUrl,
      });
      return result.data || null;
    },
    enabled: !!user?.id && !!tacticId,
    staleTime: PROGRESS_QUERY_STALE_TIME,
  });

  return {
    progress: data || null,
    isLoading,
    watchPercentage: data?.watch_percentage || 0,
    isComplete: data?.completion_threshold_met || false,
  };
}

/**
 * Hook for batch fetching video progress for multiple tactics
 */
export function useMultipleTacticsProgress(tacticIds: string[]): {
  progressMap: Record<string, VideoProgressRecord>;
  isLoading: boolean;
} {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['videoProgressBatch', user?.id, tacticIds.join(',')],
    queryFn: async () => {
      if (!user?.id || tacticIds.length === 0) return {};

      // This would ideally be a batch query, but for now we'll use individual queries
      const results: Record<string, VideoProgressRecord> = {};

      for (const tacticId of tacticIds) {
        const result = await getVideoProgress({
          userId: user.id,
          tacticId,
        });
        if (result.data) {
          results[tacticId] = result.data;
        }
      }

      return results;
    },
    enabled: !!user?.id && tacticIds.length > 0,
    staleTime: PROGRESS_QUERY_STALE_TIME,
  });

  return {
    progressMap: data || {},
    isLoading,
  };
}

// Re-export helpers for convenience
export { formatPosition, formatWatchTime };
