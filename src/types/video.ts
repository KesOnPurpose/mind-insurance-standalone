/**
 * FEAT-GH-005-A: Video Progress Tracking Types
 *
 * TypeScript definitions for video tracking, completion gates, and progress monitoring.
 * Maps to database tables:
 * - gh_lesson_video_progress (video watch tracking)
 * - gh_tactic_instructions (video/assessment columns)
 * - gh_user_tactic_progress (completion gates)
 */

// =============================================================================
// VIDEO PROVIDER AND PLAYER TYPES
// =============================================================================

/**
 * Supported video hosting providers
 */
export type VideoProvider = 'vimeo' | 'youtube' | 'wistia' | 'loom' | 'custom';

/**
 * Video player event types for tracking
 */
export type VideoEventType =
  | 'play'
  | 'pause'
  | 'seek'
  | 'ended'
  | 'progress'
  | 'speed_change'
  | 'quality_change'
  | 'fullscreen_enter'
  | 'fullscreen_exit'
  | 'error';

/**
 * Video player state
 */
export interface VideoPlayerState {
  isPlaying: boolean;
  isPaused: boolean;
  isBuffering: boolean;
  isEnded: boolean;
  isMuted: boolean;
  isFullscreen: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  volume: number;
  quality: string;
}

// =============================================================================
// VIDEO METADATA TYPES (from gh_tactic_instructions)
// =============================================================================

/**
 * Video metadata attached to a tactic
 * Matches columns added in FEAT-GH-004-E
 */
export interface TacticVideoMetadata {
  video_url: string | null;
  video_provider: VideoProvider | null;
  video_duration_seconds: number | null;
  video_completion_threshold: number; // Default 90
  video_thumbnail_url: string | null;
}

/**
 * Assessment metadata attached to a tactic
 * Matches columns added in FEAT-GH-004-E
 */
export interface TacticAssessmentMetadata {
  has_assessment: boolean;
  assessment_required_for_completion: boolean;
  primary_assessment_id: string | null;
}

/**
 * Completion gate configuration (JSONB field)
 * Matches completion_gate_config column
 */
export interface CompletionGateConfig {
  require_video: boolean;
  require_assessment: boolean;
  video_threshold: number;
  assessment_threshold: number;
  allow_skip_with_note: boolean;
  max_assessment_attempts: number | null;
}

/**
 * Extended tactic with video and gate info
 * Combines TacticVideoMetadata, TacticAssessmentMetadata, and gate config
 */
export interface TacticWithVideoGates {
  tactic_id: string;
  tactic_name: string;

  // Video metadata
  video_url: string | null;
  video_provider: VideoProvider | null;
  video_duration_seconds: number | null;
  video_completion_threshold: number;
  video_thumbnail_url: string | null;

  // Assessment metadata
  has_assessment: boolean;
  assessment_required_for_completion: boolean;
  primary_assessment_id: string | null;

  // Completion gates
  completion_gate_enabled: boolean;
  completion_gate_config: CompletionGateConfig | null;

  // Display settings
  display_order: number;
  show_estimated_time: boolean;
}

// =============================================================================
// VIDEO PROGRESS TRACKING (from gh_lesson_video_progress)
// =============================================================================

/**
 * Video watch interval for precise tracking
 */
export interface WatchInterval {
  start_seconds: number;
  end_seconds: number;
  watched_at?: string;
}

/**
 * Video progress record from database
 * Matches gh_lesson_video_progress table
 */
export interface VideoProgressRecord {
  id: string;
  user_id: string;
  tactic_id: string;
  video_url: string;

  // Watch tracking
  total_watch_time_seconds: number;
  furthest_position_seconds: number;
  watch_percentage: number;
  completion_threshold_met: boolean;
  completed_at: string | null;

  // Session tracking
  session_count: number;
  last_position_seconds: number;
  last_watched_at: string | null;

  // Detailed tracking (JSONB)
  watch_intervals: WatchInterval[] | null;
  playback_events: VideoPlaybackEvent[] | null;

  // Device info
  device_type: 'mobile' | 'tablet' | 'desktop' | null;
  browser: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * Video playback event for analytics
 */
export interface VideoPlaybackEvent {
  event_type: VideoEventType;
  timestamp: string;
  position_seconds: number;
  metadata?: Record<string, unknown>;
}

/**
 * Input for creating/updating video progress
 */
export interface VideoProgressInput {
  user_id: string;
  tactic_id: string;
  video_url: string;
  position_seconds: number;
  duration_seconds: number;
  event_type?: VideoEventType;
  device_type?: 'mobile' | 'tablet' | 'desktop';
  browser?: string;
}

// =============================================================================
// USER TACTIC PROGRESS (completion gates from gh_user_tactic_progress)
// =============================================================================

/**
 * Tactic progress status
 */
export type TacticProgressStatus =
  | 'not_started'
  | 'in_progress'
  | 'gates_pending'
  | 'completed'
  | 'skipped';

/**
 * User's overall progress on a tactic with gate status
 * Matches gh_user_tactic_progress table
 */
export interface UserTacticProgress {
  id: string;
  user_id: string;
  tactic_id: string;
  status: TacticProgressStatus;

  // Video completion gate
  video_watched: boolean;
  video_watch_percentage: number;
  video_gate_met: boolean;
  video_gate_met_at: string | null;

  // Assessment completion gate
  assessment_attempted: boolean;
  assessment_passed: boolean;
  assessment_best_score: number | null;
  assessment_attempts_count: number;
  assessment_gate_met: boolean;
  assessment_gate_met_at: string | null;

  // Overall completion gate status
  all_gates_met: boolean;
  gates_met_at: string | null;

  // Skip tracking
  was_skipped: boolean;
  skip_reason: string | null;
  skipped_at: string | null;
  skipped_by: string | null;

  // Progress details
  progress_percentage: number;
  steps_completed: number;
  total_steps: number;

  // Time tracking
  time_spent_seconds: number;
  first_accessed_at: string | null;
  last_accessed_at: string | null;
  started_at: string | null;
  completed_at: string | null;

  // Notes and feedback
  user_notes: string | null;
  coach_notes: string | null;
  difficulty_rating: number | null;
  usefulness_rating: number | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * Result from can_complete_tactic() function
 */
export interface CompletionGateCheck {
  can_complete: boolean;
  video_gate_met: boolean;
  assessment_gate_met: boolean;
  missing_requirements: string[];
}

/**
 * Tactic completion requirements result
 */
export interface TacticCompletionRequirements {
  tactic_id: string;
  requires_video: boolean;
  video_threshold: number;
  requires_assessment: boolean;
  assessment_threshold: number;
  can_skip: boolean;
}

// =============================================================================
// UI COMPONENT PROPS
// =============================================================================

/**
 * Props for VideoPlayer component
 */
export interface VideoPlayerProps {
  tacticId: string;
  videoUrl: string;
  videoProvider?: VideoProvider;
  duration?: number;
  thumbnailUrl?: string;
  completionThreshold?: number;
  autoplay?: boolean;
  startPosition?: number;
  onProgress?: (progress: VideoProgressState) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
  className?: string;
}

/**
 * Video progress state for UI
 */
export interface VideoProgressState {
  currentTime: number;
  duration: number;
  watchPercentage: number;
  isComplete: boolean;
  thresholdMet: boolean;
}

/**
 * Props for VideoProgressGauge component
 */
export interface VideoProgressGaugeProps {
  watchPercentage: number;
  completionThreshold: number;
  isComplete: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

/**
 * Props for completion gate display
 */
export interface CompletionGateDisplayProps {
  videoGateMet: boolean;
  assessmentGateMet: boolean;
  requiresVideo: boolean;
  requiresAssessment: boolean;
  videoPercentage?: number;
  assessmentScore?: number;
  videoThreshold?: number;
  assessmentThreshold?: number;
  className?: string;
}

// =============================================================================
// SERVICE TYPES
// =============================================================================

/**
 * Result from video progress service operations
 */
export interface VideoProgressServiceResult<T = VideoProgressRecord> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Options for fetching video progress
 */
export interface GetVideoProgressOptions {
  userId: string;
  tacticId: string;
  videoUrl?: string;
}

/**
 * Options for updating video progress
 */
export interface UpdateVideoProgressOptions extends VideoProgressInput {
  createIfNotExists?: boolean;
}

/**
 * Video progress with UI-ready computed fields
 */
export interface VideoProgressWithUI extends VideoProgressRecord {
  formattedWatchTime: string;
  formattedLastPosition: string;
  percentageFormatted: string;
  isAlmostComplete: boolean;
  remainingPercentage: number;
}
