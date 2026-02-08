/**
 * FEAT-GH-005-B: Video Progress Service
 *
 * Handles all database operations for video progress tracking:
 * - Recording video watch progress
 * - Updating completion gates
 * - Retrieving progress for display
 *
 * Tables used:
 * - gh_lesson_video_progress (video watch tracking)
 * - gh_user_tactic_progress (completion gates)
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  VideoProgressRecord,
  VideoProgressInput,
  VideoProgressServiceResult,
  GetVideoProgressOptions,
  UpdateVideoProgressOptions,
  WatchInterval,
  VideoPlaybackEvent,
  VideoEventType,
  UserTacticProgress,
  CompletionGateCheck,
  TacticCompletionRequirements,
  VideoProgressWithUI,
} from '@/types/video';

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_COMPLETION_THRESHOLD = 90; // 90% default
const PROGRESS_SAVE_DEBOUNCE_MS = 5000; // Save progress every 5 seconds max

// =============================================================================
// VIDEO PROGRESS CRUD
// =============================================================================

/**
 * Get video progress for a specific user and tactic
 */
export async function getVideoProgress(
  options: GetVideoProgressOptions
): Promise<VideoProgressServiceResult<VideoProgressRecord>> {
  try {
    const { userId, tacticId, videoUrl } = options;

    let query = supabase
      .from('gh_lesson_video_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('tactic_id', tacticId);

    if (videoUrl) {
      query = query.eq('video_url', videoUrl);
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('Error fetching video progress:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as VideoProgressRecord | undefined };
  } catch (error) {
    console.error('Failed to get video progress:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Update or create video progress record
 */
export async function updateVideoProgress(
  options: UpdateVideoProgressOptions
): Promise<VideoProgressServiceResult<VideoProgressRecord>> {
  try {
    const {
      user_id,
      tactic_id,
      video_url,
      position_seconds,
      duration_seconds,
      event_type,
      device_type,
      browser,
      createIfNotExists = true,
    } = options;

    // Calculate watch percentage
    const watchPercentage =
      duration_seconds > 0
        ? Math.min(100, (position_seconds / duration_seconds) * 100)
        : 0;

    // Get existing progress record
    const { data: existing } = await supabase
      .from('gh_lesson_video_progress')
      .select('*')
      .eq('user_id', user_id)
      .eq('tactic_id', tactic_id)
      .eq('video_url', video_url)
      .single();

    if (existing) {
      // Update existing record
      const updates: Partial<VideoProgressRecord> = {
        last_position_seconds: position_seconds,
        last_watched_at: new Date().toISOString(),
        furthest_position_seconds: Math.max(
          existing.furthest_position_seconds || 0,
          position_seconds
        ),
        watch_percentage: Math.max(existing.watch_percentage || 0, watchPercentage),
        total_watch_time_seconds:
          (existing.total_watch_time_seconds || 0) + getIncrementalWatchTime(existing, position_seconds),
      };

      // Check if completion threshold met
      if (watchPercentage >= DEFAULT_COMPLETION_THRESHOLD && !existing.completion_threshold_met) {
        updates.completion_threshold_met = true;
        updates.completed_at = new Date().toISOString();

        // Update tactic progress video gate
        await updateVideoGateStatus(user_id, tactic_id, true, watchPercentage);
      }

      // Add playback event
      if (event_type) {
        const newEvent: VideoPlaybackEvent = {
          event_type,
          timestamp: new Date().toISOString(),
          position_seconds,
        };
        updates.playback_events = [...(existing.playback_events || []), newEvent];
      }

      const { data, error } = await supabase
        .from('gh_lesson_video_progress')
        .update(updates)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating video progress:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data as VideoProgressRecord };
    } else if (createIfNotExists) {
      // Create new record
      const newRecord = {
        user_id,
        tactic_id,
        video_url,
        total_watch_time_seconds: 0,
        furthest_position_seconds: position_seconds,
        watch_percentage: watchPercentage,
        completion_threshold_met: watchPercentage >= DEFAULT_COMPLETION_THRESHOLD,
        completed_at:
          watchPercentage >= DEFAULT_COMPLETION_THRESHOLD
            ? new Date().toISOString()
            : null,
        session_count: 1,
        last_position_seconds: position_seconds,
        last_watched_at: new Date().toISOString(),
        watch_intervals: [],
        playback_events: event_type
          ? [
              {
                event_type,
                timestamp: new Date().toISOString(),
                position_seconds,
              },
            ]
          : [],
        device_type,
        browser,
      };

      const { data, error } = await supabase
        .from('gh_lesson_video_progress')
        .insert(newRecord)
        .select()
        .single();

      if (error) {
        console.error('Error creating video progress:', error);
        return { success: false, error: error.message };
      }

      // Update tactic progress if threshold met immediately
      if (watchPercentage >= DEFAULT_COMPLETION_THRESHOLD) {
        await updateVideoGateStatus(user_id, tactic_id, true, watchPercentage);
      }

      return { success: true, data: data as VideoProgressRecord };
    }

    return { success: false, error: 'No existing record and createIfNotExists is false' };
  } catch (error) {
    console.error('Failed to update video progress:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Record a video playback event
 */
export async function recordVideoEvent(
  userId: string,
  tacticId: string,
  videoUrl: string,
  eventType: VideoEventType,
  positionSeconds: number,
  metadata?: Record<string, unknown>
): Promise<VideoProgressServiceResult<void>> {
  try {
    // Get existing progress
    const { data: existing } = await supabase
      .from('gh_lesson_video_progress')
      .select('id, playback_events')
      .eq('user_id', userId)
      .eq('tactic_id', tacticId)
      .eq('video_url', videoUrl)
      .single();

    if (!existing) {
      return { success: false, error: 'No video progress record found' };
    }

    const newEvent: VideoPlaybackEvent = {
      event_type: eventType,
      timestamp: new Date().toISOString(),
      position_seconds: positionSeconds,
      metadata,
    };

    const { error } = await supabase
      .from('gh_lesson_video_progress')
      .update({
        playback_events: [...(existing.playback_events || []), newEvent],
        last_watched_at: new Date().toISOString(),
      })
      .eq('id', existing.id);

    if (error) {
      console.error('Error recording video event:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to record video event:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Mark video as complete (manual override or threshold met)
 */
export async function markVideoComplete(
  userId: string,
  tacticId: string,
  videoUrl: string
): Promise<VideoProgressServiceResult<VideoProgressRecord>> {
  try {
    const { data, error } = await supabase
      .from('gh_lesson_video_progress')
      .update({
        completion_threshold_met: true,
        completed_at: new Date().toISOString(),
        watch_percentage: 100,
      })
      .eq('user_id', userId)
      .eq('tactic_id', tacticId)
      .eq('video_url', videoUrl)
      .select()
      .single();

    if (error) {
      console.error('Error marking video complete:', error);
      return { success: false, error: error.message };
    }

    // Update tactic progress video gate
    await updateVideoGateStatus(userId, tacticId, true, 100);

    return { success: true, data: data as VideoProgressRecord };
  } catch (error) {
    console.error('Failed to mark video complete:', error);
    return { success: false, error: String(error) };
  }
}

// =============================================================================
// TACTIC PROGRESS / COMPLETION GATES
// =============================================================================

/**
 * Update the video gate status on user tactic progress
 */
export async function updateVideoGateStatus(
  userId: string,
  tacticId: string,
  gateMet: boolean,
  watchPercentage: number
): Promise<VideoProgressServiceResult<UserTacticProgress>> {
  try {
    // First, get or create the tactic progress record
    const { data: existing } = await supabase
      .from('gh_user_tactic_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('tactic_id', tacticId)
      .single();

    const updates: Partial<UserTacticProgress> = {
      video_watched: watchPercentage >= DEFAULT_COMPLETION_THRESHOLD,
      video_watch_percentage: watchPercentage,
      video_gate_met: gateMet,
      last_accessed_at: new Date().toISOString(),
    };

    if (gateMet && (!existing || !existing.video_gate_met)) {
      updates.video_gate_met_at = new Date().toISOString();
    }

    // Check if this completes all gates
    if (gateMet && existing?.assessment_gate_met) {
      updates.all_gates_met = true;
      updates.gates_met_at = new Date().toISOString();
    }

    // Update status based on gate completion
    if (existing) {
      if (updates.all_gates_met) {
        updates.status = 'completed';
        updates.completed_at = new Date().toISOString();
      } else if (existing.status === 'not_started') {
        updates.status = 'in_progress';
        updates.started_at = new Date().toISOString();
      }
    }

    if (existing) {
      const { data, error } = await supabase
        .from('gh_user_tactic_progress')
        .update(updates)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating tactic progress:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data as UserTacticProgress };
    } else {
      // Create new progress record
      const newRecord = {
        user_id: userId,
        tactic_id: tacticId,
        status: 'in_progress',
        ...updates,
        first_accessed_at: new Date().toISOString(),
        started_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('gh_user_tactic_progress')
        .insert(newRecord)
        .select()
        .single();

      if (error) {
        console.error('Error creating tactic progress:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data as UserTacticProgress };
    }
  } catch (error) {
    console.error('Failed to update video gate status:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Get user's tactic progress including gate status
 */
export async function getUserTacticProgress(
  userId: string,
  tacticId: string
): Promise<VideoProgressServiceResult<UserTacticProgress>> {
  try {
    const { data, error } = await supabase
      .from('gh_user_tactic_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('tactic_id', tacticId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching tactic progress:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as UserTacticProgress | undefined };
  } catch (error) {
    console.error('Failed to get tactic progress:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Check if user can complete a tactic (all gates met)
 */
export async function checkCompletionGates(
  userId: string,
  tacticId: string
): Promise<VideoProgressServiceResult<CompletionGateCheck>> {
  try {
    // Call the database function
    const { data, error } = await supabase.rpc('can_complete_tactic', {
      p_user_id: userId,
      p_tactic_id: tacticId,
    });

    if (error) {
      console.error('Error checking completion gates:', error);
      return { success: false, error: error.message };
    }

    // Parse the result
    const result = data?.[0] || {
      can_complete: false,
      video_gate_met: false,
      assessment_gate_met: false,
      missing_requirements: [],
    };

    return { success: true, data: result as CompletionGateCheck };
  } catch (error) {
    console.error('Failed to check completion gates:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Get completion requirements for a tactic
 */
export async function getTacticCompletionRequirements(
  tacticId: string
): Promise<VideoProgressServiceResult<TacticCompletionRequirements>> {
  try {
    const { data, error } = await supabase.rpc('get_tactic_completion_requirements', {
      p_tactic_id: tacticId,
    });

    if (error) {
      console.error('Error getting completion requirements:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data?.[0] as TacticCompletionRequirements | undefined };
  } catch (error) {
    console.error('Failed to get completion requirements:', error);
    return { success: false, error: String(error) };
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Calculate incremental watch time based on position change
 */
function getIncrementalWatchTime(
  existing: Partial<VideoProgressRecord>,
  newPosition: number
): number {
  const lastPosition = existing.last_position_seconds || 0;
  const diff = newPosition - lastPosition;

  // Only count positive forward progress, cap at 30 seconds to handle seeks
  if (diff > 0 && diff <= 30) {
    return diff;
  }
  return 0;
}

/**
 * Format watch time for display
 */
export function formatWatchTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

/**
 * Format position for display (mm:ss or hh:mm:ss)
 */
export function formatPosition(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Add UI-ready computed fields to video progress record
 */
export function enrichVideoProgressForUI(
  progress: VideoProgressRecord,
  completionThreshold: number = DEFAULT_COMPLETION_THRESHOLD
): VideoProgressWithUI {
  return {
    ...progress,
    formattedWatchTime: formatWatchTime(progress.total_watch_time_seconds),
    formattedLastPosition: formatPosition(progress.last_position_seconds),
    percentageFormatted: `${Math.round(progress.watch_percentage)}%`,
    isAlmostComplete:
      progress.watch_percentage >= completionThreshold - 10 &&
      progress.watch_percentage < completionThreshold,
    remainingPercentage: Math.max(0, completionThreshold - progress.watch_percentage),
  };
}

/**
 * Detect device type from user agent
 */
export function detectDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';

  const ua = navigator.userAgent.toLowerCase();

  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)) {
    return 'mobile';
  }
  if (/ipad|tablet|playbook|silk/i.test(ua)) {
    return 'tablet';
  }
  return 'desktop';
}

/**
 * Detect browser from user agent
 */
export function detectBrowser(): string {
  if (typeof window === 'undefined') return 'unknown';

  const ua = navigator.userAgent;

  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';

  return 'Other';
}
