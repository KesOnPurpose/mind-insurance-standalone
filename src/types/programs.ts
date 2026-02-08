// ============================================================================
// FEAT-GH-010: Program & Progress Types
// ============================================================================
// TypeScript definitions for the Phase-Based Course Platform
// ============================================================================

// ============================================================================
// Core Program Entities
// ============================================================================

export interface Program {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  thumbnail_url: string | null;
  banner_url: string | null;
  instructor_name: string | null;
  instructor_avatar_url: string | null;
  instructor_bio: string | null;
  status: 'draft' | 'published' | 'archived';
  is_public: boolean;
  total_phases: number;
  total_lessons: number;
  total_tactics: number;
  estimated_duration_hours: number | null;
  created_at: string;
  updated_at: string;
  settings: Record<string, unknown>;
}

export interface Phase {
  id: string;
  program_id: string;
  title: string;
  description: string | null;
  short_description: string | null;
  thumbnail_url: string | null;
  order_index: number;
  is_required: boolean;
  status: 'draft' | 'published';
  // Drip configuration
  drip_model: 'inherit' | 'calendar' | 'relative' | 'progress' | 'hybrid';
  unlock_at: string | null;
  unlock_offset_days: number | null;
  prerequisite_phase_id: string | null;  // Was unlock_after_phase_id - matches DB column
  // Note: total_lessons/total_tactics are on gh_programs, not gh_program_phases
  // These can be computed from lessons if needed
  estimated_duration_minutes: number | null;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: string;
  phase_id: string;
  title: string;
  description: string | null;
  short_description: string | null;
  thumbnail_url: string | null;
  order_index: number;
  lesson_type: 'video' | 'text' | 'audio' | 'assessment' | 'mixed';
  is_required: boolean;
  status: 'draft' | 'published';
  // Video content
  video_url: string | null;
  video_duration_seconds: number | null;
  video_provider: 'youtube' | 'vimeo' | 'wistia' | 'bunny' | 'custom' | null;
  video_thumbnail_url: string | null;
  // Rich text content
  content_html: string | null;
  // Completion rules (THE DIFFERENTIATOR!)
  required_watch_percent: number;
  requires_tactics_complete: boolean;
  has_assessment: boolean;
  requires_assessment_pass: boolean;
  assessment_passing_score: number | null;
  // Drip override
  drip_override: {
    model?: 'calendar' | 'relative' | 'progress';
    unlock_at?: string;
    offset_days?: number;
    prerequisite_lesson_id?: string;
  } | null;
  // Counts
  total_tactics: number;
  total_required_tactics: number;
  estimated_duration_minutes: number | null;
  created_at: string;
  updated_at: string;
}

export interface Tactic {
  id: string;
  lesson_id: string;
  label: string;
  description: string | null;
  is_required: boolean;
  order_index: number;
  tactic_type: 'checkbox' | 'text_input' | 'file_upload' | 'link_submit' | 'reflection';
  reference_url: string | null;
  placeholder_text: string | null;
  validation_rules: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Progress Entities
// ============================================================================

export interface UserProgramEnrollment {
  id: string;
  user_id: string;
  program_id: string;
  enrolled_at: string;
  enrollment_source: 'manual' | 'purchase' | 'import' | 'promo' | 'gift' | 'scholarship';
  purchase_id: string | null;
  purchase_amount_cents: number | null;
  purchase_currency: string;
  coupon_code: string | null;
  status: 'active' | 'completed' | 'paused' | 'cancelled' | 'expired';
  progress_percent: number;
  completed_phases: number;
  completed_lessons: number;
  total_watch_time_seconds: number;
  started_at: string | null;
  completed_at: string | null;
  last_activity_at: string;
  expires_at: string | null;
  certificate_issued_at: string | null;
  certificate_url: string | null;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface UserPhaseProgress {
  id: string;
  user_id: string;
  phase_id: string;
  status: 'locked' | 'not_started' | 'in_progress' | 'completed';
  completed_lessons: number;
  total_required_lessons: number;
  progress_percent: number;
  unlocked_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  last_activity_at: string;
  created_at: string;
  updated_at: string;
}

export interface UserLessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  status: 'locked' | 'not_started' | 'in_progress' | 'completed' | 'stuck';
  // Video progress (THE VIDEO GAUGE!)
  video_watched_percent: number;
  video_last_position_ms: number;
  video_completed_at: string | null;
  video_watch_sessions: number;
  video_total_watch_seconds: number;
  // Tactics progress (THE TACTICS GAUGE!)
  tactics_completed_count: number;
  tactics_required_count: number;
  tactics_completion_percent: number;
  // Assessment progress
  assessment_status: 'not_started' | 'in_progress' | 'passed' | 'failed' | null;
  assessment_score: number | null;
  assessment_attempts: number;
  assessment_best_score: number | null;
  assessment_last_attempt_at: string | null;
  // Completion gates (THE DIFFERENTIATOR!)
  video_gate_met: boolean;
  tactics_gate_met: boolean;
  assessment_gate_met: boolean;
  all_gates_met: boolean;
  // Stuck detection
  stuck_detected_at: string | null;
  stuck_reason: string | null;
  stuck_nudge_count: number;
  stuck_last_nudge_at: string | null;
  // Timestamps
  unlocked_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  last_activity_at: string;
  // Nette AI
  nette_help_count: number;
  nette_last_interaction_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserTacticCompletion {
  id: string;
  user_id: string;
  tactic_id: string;
  completed_at: string;
  response_data: {
    text?: string;
    file_url?: string;
    link_url?: string;
  };
  nette_helped: boolean;
  nette_conversation_id: string | null;
  created_at: string;
}

// ============================================================================
// Composite Types for UI Components
// ============================================================================

/**
 * Program with user's enrollment and progress data
 * Used in Programs Hub (FEAT-GH-010)
 */
export interface ProgramWithProgress {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  thumbnail_url: string | null;
  instructor_name: string | null;
  instructor_avatar_url: string | null;
  total_phases: number;
  total_lessons: number;
  estimated_duration_hours: number | null;
  // Enrollment data
  enrollment_id: string;
  enrolled_at: string;
  enrollment_status: 'active' | 'completed' | 'paused' | 'cancelled' | 'expired';
  // Progress data
  progress_percent: number;
  completed_phases: number;
  completed_lessons: number;
  total_required_lessons: number;
  last_activity_at: string;
  // Computed status
  computed_status: 'not_started' | 'in_progress' | 'completed';
  // UI helpers
  is_new: boolean; // Enrolled within last 7 days
  days_since_activity: number;
}

/**
 * Phase with user's progress data
 * Used in Phase Roadmap (FEAT-GH-011)
 */
export interface PhaseWithProgress {
  id: string;
  program_id: string;
  title: string;
  description: string | null;
  short_description: string | null;
  thumbnail_url: string | null;
  order_index: number;
  is_required: boolean;
  total_lessons: number;
  total_tactics: number;
  estimated_duration_minutes: number | null;
  // Progress data
  status: 'locked' | 'not_started' | 'in_progress' | 'completed';
  progress_percent: number;
  completed_lessons: number;
  total_required_lessons: number;
  // Unlock info
  is_unlocked: boolean;
  unlock_reason: string | null; // "Unlocks on Jan 23" or "Complete Phase 1 first"
  unlock_date: string | null;
}

/**
 * Lesson with user's progress data
 * Used in Phase View (FEAT-GH-012) and Lesson Experience (FEAT-GH-013)
 */
export interface LessonWithProgress {
  id: string;
  phase_id: string;
  title: string;
  description: string | null;
  short_description: string | null;
  thumbnail_url: string | null;
  order_index: number;
  lesson_type: 'video' | 'text' | 'audio' | 'assessment' | 'mixed';
  is_required: boolean;
  video_duration_seconds: number | null;
  total_tactics: number;
  total_required_tactics: number;
  estimated_duration_minutes: number | null;
  // Progress data
  status: 'locked' | 'not_started' | 'in_progress' | 'completed' | 'stuck';
  video_watched_percent: number;
  tactics_completed_count: number;
  tactics_completion_percent: number;
  // Completion gates
  video_gate_met: boolean;
  tactics_gate_met: boolean;
  assessment_gate_met: boolean;
  all_gates_met: boolean;
  // Unlock info
  is_unlocked: boolean;
  unlock_reason: string | null;
  unlock_date: string | null;
}

/**
 * Tactic with user's completion status
 * Used in Lesson Experience (FEAT-GH-013)
 */
export interface TacticWithStatus {
  id: string;
  lesson_id: string;
  label: string;
  description: string | null;
  is_required: boolean;
  order_index: number;
  tactic_type: 'checkbox' | 'text_input' | 'file_upload' | 'link_submit' | 'reflection';
  reference_url: string | null;
  placeholder_text: string | null;
  // Completion status
  is_completed: boolean;
  completed_at: string | null;
  response_data: {
    text?: string;
    file_url?: string;
    link_url?: string;
  } | null;
  // Nette AI
  nette_helped: boolean;
}

// ============================================================================
// Filter Types
// ============================================================================

export type ProgramsFilterStatus = 'all' | 'in_progress' | 'completed' | 'not_started';

export interface ProgramsFilterOptions {
  status: ProgramsFilterStatus;
  searchQuery?: string;
}

// ============================================================================
// FEAT-GH-014: Admin Program Management Types
// ============================================================================
// Types for admin-side program management with aggregated statistics
// ============================================================================

/**
 * Program with admin-level statistics
 * Used in Admin Programs Page (FEAT-GH-014)
 */
export interface AdminProgram {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  instructor_name: string | null;
  status: 'draft' | 'published' | 'archived';
  is_public: boolean;
  created_at: string;
  updated_at: string;
  // Aggregated stats
  enrolled_count: number;
  avg_completion_percent: number;
  phase_count: number;
  lesson_count: number;
}

/**
 * Learner enrolled in a program with progress data
 * Used in Admin Program Learners Tab (FEAT-GH-014)
 */
export interface AdminProgramLearner {
  user_id: string;
  email: string;
  full_name: string | null;
  enrolled_at: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  completed_at: string | null;
  completed_lessons: number;
  total_required_lessons: number;
  completion_percent: number;
  last_activity_at: string | null;
}

/**
 * Drip model configuration for program access control
 */
export type DripModel = 'inherit' | 'calendar' | 'relative' | 'progress' | 'hybrid';

/**
 * Phase drip schedule entry for calendar-based drip
 */
export interface CalendarDripSchedule {
  phase_id: string;
  unlock_at: string; // ISO datetime
}

/**
 * Phase drip schedule entry for relative drip
 */
export interface RelativeDripSchedule {
  phase_id: string;
  offset_days: number;
}

/**
 * Phase prerequisite for progress-based drip
 */
export interface ProgressPrerequisite {
  phase_id: string;
  prerequisite_phase_id: string;
}

/**
 * Lesson-level drip override
 */
export interface LessonDripOverride {
  lesson_id: string;
  drip_model: 'calendar' | 'relative' | 'progress';
  unlock_at?: string | null;
  offset_days?: number | null;
  prerequisite_lesson_id?: string | null;
}

/**
 * Complete drip configuration for a program
 */
export interface DripConfig {
  model: DripModel;
  // Calendar model settings
  calendar_schedule?: CalendarDripSchedule[];
  // Relative model settings
  relative_schedule?: RelativeDripSchedule[];
  // Progress model settings
  prerequisites?: ProgressPrerequisite[];
  // Hybrid model - combines calendar/relative with progress
  require_previous_completion?: boolean;
  // Lesson-level overrides (optional for any model)
  lesson_overrides?: LessonDripOverride[];
}

/**
 * Phase drip settings for individual phase configuration
 */
export interface PhaseDripSettings {
  phase_id: string;
  drip_model: DripModel;
  unlock_at: string | null;
  unlock_offset_days: number | null;
  prerequisite_phase_id: string | null;
}

/**
 * Drip preview item for schedule visualization
 */
export interface DripPreviewItem {
  phase_id: string;
  phase_title: string;
  phase_order: number;
  unlock_date: Date | null;
  unlock_reason: string;
  is_unlocked: boolean;
  depends_on?: string; // phase title if progress-based
}

/**
 * Form data for creating/updating a program
 */
export interface ProgramFormData {
  title: string;
  description: string;
  short_description: string;
  thumbnail_url: string;
  instructor_name: string;
  instructor_bio: string;
  status: 'draft' | 'published' | 'archived';
  is_public: boolean;
  estimated_duration_hours: number | null;
}

// ============================================================================
// FEAT-GH-015: Admin Phase & Lesson Builder Types
// ============================================================================
// Types for admin-side phase and lesson management
// ============================================================================

/**
 * Lesson with admin-level data including tactics count
 * Used in Phase Builder (FEAT-GH-015)
 */
export interface AdminLesson {
  id: string;
  phase_id: string;
  title: string;
  description: string | null;
  order_index: number;
  lesson_type: 'video' | 'text' | 'audio' | 'assessment';
  is_required: boolean;
  video_url: string | null;
  video_duration_seconds: number | null;
  required_watch_percent: number;
  has_assessment: boolean;
  requires_assessment_pass: boolean;
  status: 'draft' | 'published';
  created_at: string;
  tactics_count: number;
}

/**
 * Form data for creating/updating a lesson
 */
export interface LessonFormData {
  title: string;
  description?: string;
  lesson_type: 'video' | 'text' | 'audio' | 'assessment';
  is_required: boolean;
  video_url?: string;
  required_watch_percent?: number;
  has_assessment?: boolean;
  requires_assessment_pass?: boolean;
  status?: 'draft' | 'published';
}

/**
 * Phase with detailed data for Phase Builder
 * Extends Phase with additional computed fields
 */
export interface AdminPhaseWithLessons {
  id: string;
  program_id: string;
  title: string;
  description: string | null;
  short_description: string | null;
  order_index: number;
  is_required: boolean;
  status: 'draft' | 'published';
  drip_model: 'inherit' | 'calendar' | 'relative' | 'progress' | 'hybrid';
  unlock_at: string | null;
  unlock_offset_days: number | null;
  total_lessons: number;
  total_tactics: number;
  estimated_duration_minutes: number | null;
  created_at: string;
  updated_at: string;
  lessons: AdminLesson[];
}

/**
 * Form data for updating phase details
 */
export interface PhaseFormData {
  title: string;
  description?: string;
  short_description?: string;
  is_required?: boolean;
  status?: 'draft' | 'published';
  drip_model?: 'inherit' | 'calendar' | 'relative' | 'progress' | 'hybrid';
  unlock_at?: string;
  unlock_offset_days?: number;
}

// ============================================================================
// FEAT-GH-016: Admin Lesson Editor Types
// ============================================================================
// Types for the full lesson editor with tactics management
// ============================================================================

/**
 * Full lesson data for admin editor
 * Includes phase/program context and tactics list
 */
export interface AdminLessonFull {
  id: string;
  phase_id: string;
  title: string;
  description: string | null;
  order_index: number;
  lesson_type: 'video' | 'text' | 'audio' | 'assessment';
  is_required: boolean;
  video_url: string | null;
  video_provider: 'youtube' | 'vimeo' | 'wistia' | 'bunny' | 'custom' | null;
  video_duration_seconds: number | null;
  content_html: string | null;
  required_watch_percent: number;
  has_assessment: boolean;
  requires_assessment_pass: boolean;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
  // Relations
  phase_title: string;
  program_id: string;
  program_title: string;
  tactics: AdminTactic[];
}

/**
 * Tactic for admin management
 * Used in TacticsTab and TacticEditor
 */
export interface AdminTactic {
  id: string;
  lesson_id: string;
  label: string;
  description: string | null;
  is_required: boolean;
  order_index: number;
  reference_url: string | null;
  tactic_type: 'checkbox' | 'text_input' | 'file_upload' | 'link_submit' | 'reflection';
  placeholder_text: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Form data for creating/updating a tactic
 */
export interface TacticFormData {
  label: string;
  description?: string;
  is_required: boolean;
  reference_url?: string;
  tactic_type?: 'checkbox' | 'text_input' | 'file_upload' | 'link_submit' | 'reflection';
  placeholder_text?: string;
}

/**
 * Lesson content update payload
 */
export interface LessonContentUpdate {
  title?: string;
  description?: string;
  lesson_type?: 'video' | 'text' | 'audio' | 'assessment';
  is_required?: boolean;
  video_url?: string;
  video_provider?: 'youtube' | 'vimeo' | 'wistia' | 'bunny' | 'custom' | null;
  video_duration_seconds?: number | null;
  content_html?: string;
  required_watch_percent?: number;
  has_assessment?: boolean;
  requires_assessment_pass?: boolean;
  status?: 'draft' | 'published';
}

// ============================================================================
// FEAT-GH-018: Admin Learner Progress Drill-down Types
// ============================================================================
// Types for detailed learner progress views in admin
// ============================================================================

/**
 * Full learner detail with progress across all phases
 * Used in Admin Learner Detail Page (FEAT-GH-018)
 */
export interface AdminLearnerDetail {
  user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  enrolled_at: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  completed_at: string | null;
  last_activity_at: string | null;
  // Progress
  completed_lessons: number;
  total_required_lessons: number;
  completion_percent: number;
  // Phase progress
  phases: AdminLearnerPhaseProgress[];
  // Stuck detection
  is_stuck: boolean;
  stuck_since: string | null;
  stuck_lesson_id: string | null;
}

/**
 * Per-phase progress for a learner
 * Used in Admin Learner Detail Page (FEAT-GH-018)
 */
export interface AdminLearnerPhaseProgress {
  phase_id: string;
  phase_title: string;
  order_index: number;
  status: 'locked' | 'not_started' | 'in_progress' | 'completed';
  completed_lessons: number;
  total_lessons: number;
  started_at: string | null;
  completed_at: string | null;
}

/**
 * Per-lesson progress for a learner
 * Used in Lesson Breakdown Table (FEAT-GH-018)
 */
export interface AdminLearnerLessonProgress {
  lesson_id: string;
  lesson_title: string;
  phase_id: string;
  phase_title: string;
  order_index: number;
  status: 'locked' | 'not_started' | 'in_progress' | 'completed' | 'stuck';
  video_watched_percent: number;
  tactics_completed: number;
  tactics_required: number;
  assessment_status: string | null;
  assessment_score: number | null;
  started_at: string | null;
  completed_at: string | null;
  last_activity_at: string | null;
}

/**
 * Filter options for learners table
 * Used in LearnerFilters component (FEAT-GH-018)
 */
export interface LearnerFilterOptions {
  phaseId: string | null;
  minCompletionPercent: number | null;
  maxCompletionPercent: number | null;
  isStuck: boolean | null;
  dripStatus: 'all' | 'on_schedule' | 'ahead' | 'behind' | null;
  status: 'all' | 'active' | 'completed' | 'paused' | 'cancelled';
  searchQuery: string;
}

/**
 * Drip status for a learner
 */
export type DripStatusType = 'on_schedule' | 'ahead' | 'behind';

// ============================================================================
// FEAT-GH-019: Enrollment System Types
// ============================================================================
// Types for enrolling learners manually, via purchase webhooks, or bulk import
// ============================================================================

/**
 * Source of enrollment
 */
export type EnrollmentSource = 'manual' | 'purchase' | 'import';

/**
 * Request payload for enrolling a single learner
 */
export interface EnrollmentRequest {
  program_id: string;
  user_id?: string;  // For existing users
  email?: string;    // For inviting new users
  enrollment_source: EnrollmentSource;
  send_welcome_email?: boolean;
  notes?: string;
}

/**
 * Enrollment history entry for tracking who enrolled whom and when
 * Used in EnrollmentHistory component (FEAT-GH-019)
 */
export interface EnrollmentHistoryItem {
  id: string;
  program_id: string;
  program_title: string;
  user_id: string;
  user_email: string;
  user_name: string | null;
  enrolled_at: string;
  enrollment_source: EnrollmentSource;
  enrolled_by: string | null;  // Admin who enrolled (null for webhook)
  enrolled_by_name?: string | null;
  purchase_id: string | null;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  notes: string | null;
}

/**
 * Result of bulk enrollment operation
 * Used in BulkEnrollUpload component (FEAT-GH-019)
 */
export interface BulkEnrollResult {
  success_count: number;
  failed_count: number;
  failures: BulkEnrollFailure[];
}

/**
 * Individual failure in bulk enrollment
 */
export interface BulkEnrollFailure {
  email: string;
  reason: string;
}

/**
 * Row from CSV import for bulk enrollment
 */
export interface BulkEnrollRow {
  email: string;
  name?: string;
}

/**
 * Parsed and validated CSV data for bulk enrollment preview
 */
export interface BulkEnrollPreview {
  valid_rows: BulkEnrollRow[];
  invalid_rows: { row: number; email: string; error: string }[];
  total_rows: number;
}

/**
 * User profile for enrollment selection
 * Used in EnrollLearnerModal component (FEAT-GH-019)
 */
export interface EnrollableUser {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  tier: string | null;
}

/**
 * Enrollment statistics for display
 * Used in EnrollmentStats component (FEAT-GH-019)
 */
export interface EnrollmentStatistics {
  total_enrolled: number;
  enrolled_this_month: number;
  by_source: {
    manual: number;
    purchase: number;
    import: number;
  };
}

// ============================================================================
// FEAT-GH-020: Nette AI Learning Companion Types
// ============================================================================
// Types for the context-aware AI assistant integrated at every learning touchpoint
// THE KEY DIFFERENTIATOR from Teachable/Thinkific/Kajabi
// ============================================================================

/**
 * Nette conversation session
 */
export interface NetteConversation {
  id: string;
  user_id: string;
  lesson_id?: string;
  started_at: string;
  last_message_at: string;
  message_count: number;
  context: {
    current_lesson_id?: string;
    video_timestamp?: number;
    tactic_id?: string;
    phase_id?: string;
  };
}

/**
 * Individual message in a Nette conversation
 */
export interface NetteMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata: {
    video_timestamp?: number;
    tactic_id?: string;
    lesson_reference?: string;
    was_proactive?: boolean;
    feedback?: 'positive' | 'negative' | null;
  };
  created_at: string;
}

/**
 * User insight captured from meaningful exchanges
 */
export interface UserInsight {
  id: string;
  user_id: string;
  lesson_id?: string;
  conversation_id?: string;
  insight_text: string;
  insight_type: 'breakthrough' | 'question' | 'connection' | 'goal';
  captured_at: string;
}

/**
 * Support escalation to coach
 */
export interface SupportEscalation {
  id: string;
  user_id: string;
  conversation_id: string;
  lesson_id?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  ai_summary: string;
  context_snapshot: Record<string, unknown>;
  created_at: string;
  resolved_at?: string;
}

/**
 * Proactive trigger for Nette AI help popups
 */
export interface NetteProactiveTrigger {
  type: 'rewind_pattern' | 'tactic_stagnation' | 'lesson_return' | 'stuck_detected';
  lesson_id?: string;
  tactic_id?: string;
  trigger_data: Record<string, unknown>;
  suggested_message: string;
}

/**
 * Context passed to Nette chat for awareness
 */
export interface NetteChatContext {
  lessonId?: string;
  lessonTitle?: string;
  videoTimestamp?: number;
  tacticId?: string;
  tacticLabel?: string;
  phaseId?: string;
  phaseTitle?: string;
  programId?: string;
  programTitle?: string;
}

/**
 * Quick reply suggestion for the chat
 */
export interface QuickReply {
  id: string;
  label: string;
  prompt: string;
}

// ============================================================================
// FEAT-GH-021: Library Tactics Feature Types
// ============================================================================
// Types for loading tactics from gh_tactic_instructions master library
// ============================================================================

/**
 * Tactic from the master library (gh_tactic_instructions)
 * Used in TacticLibraryBrowser component
 */
export interface LibraryTactic {
  id: string;
  tactic_id: string; // Internal code like M001, M002 (NOT displayed to users)
  tactic_name: string;
  category: string;
  week_assignment: number | null;
  tactic_source: 'mentorship' | 'cashflow_course' | 'general' | null;
  estimated_time: string | null;
  why_it_matters: string | null;
  video_url: string | null;
}

/**
 * Group of tactics organized by week/lesson
 * Used for displaying tactics in organized sections
 */
export interface TacticLibraryGroup {
  week_number: number;
  week_title: string;
  tactics: LibraryTactic[];
}

/**
 * Tactic already used in a lesson (for duplicate prevention)
 */
export interface UsedTactic {
  source_tactic_id: string;
  lesson_id: string;
  lesson_title: string;
}

/**
 * Data for copying a library tactic to a lesson
 */
export interface CopyLibraryTacticData {
  lesson_id: string;
  library_tactic: LibraryTactic;
  order_index: number;
}

/**
 * Result of copying tactics from library
 */
export interface CopyTacticsResult {
  success_count: number;
  failed_count: number;
  created_tactic_ids: string[];
}
