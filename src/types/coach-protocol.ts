// Coach Protocols V2 - Multi-Week Protocol System Types
// Phase: Coach Protocols Enhancement

// =============================================
// ENUMS & BASIC TYPES
// =============================================

/**
 * Task types supported in coach protocols
 */
export type CoachTaskType =
  | 'action'
  | 'reflection'
  | 'reading'
  | 'video'
  | 'worksheet'
  | 'voice_recording';

/**
 * Time of day for task scheduling
 */
export type TaskTimeOfDay = 'morning' | 'throughout' | 'evening';

/**
 * Visibility options for protocols (extended with custom_group)
 */
export type CoachProtocolVisibility =
  | 'all_users'
  | 'tier_based'
  | 'individual'
  | 'custom_group';

/**
 * Import source tracking
 */
export type ProtocolImportSource =
  | 'manual'
  | 'csv'
  | 'google_doc'
  | 'google_sheet';

/**
 * Assignment slot - users can have max 2 protocols (primary + secondary)
 */
export type AssignmentSlot = 'primary' | 'secondary';

/**
 * Protocol status
 */
export type CoachProtocolStatusV2 = 'draft' | 'published' | 'archived' | 'paused';

/**
 * Assignment status
 */
export type AssignmentStatus =
  | 'active'
  | 'paused'
  | 'completed'
  | 'abandoned'
  | 'expired';

/**
 * Schedule type for protocol start
 */
export type ProtocolScheduleType = 'immediate' | 'date_specific' | 'rolling';

/**
 * Resource type for task attachments
 */
export type TaskResourceType =
  | 'video'
  | 'pdf'
  | 'article'
  | 'audio'
  | 'worksheet'
  | 'external';

/**
 * Completion event types for analytics
 */
export type CompletionEventType =
  | 'protocol_started'
  | 'week_completed'
  | 'protocol_completed'
  | 'protocol_abandoned'
  | 'protocol_expired';

// =============================================
// CORE INTERFACES
// =============================================

/**
 * Visibility configuration for targeting users
 */
export interface VisibilityConfig {
  tiers?: string[];
  user_ids?: string[];
  group_ids?: string[]; // Supports multiple custom groups
}

/**
 * Main coach protocol entity
 */
export interface CoachProtocolV2 {
  id: string;
  title: string;
  description?: string;
  coach_id: string;

  // Multi-week structure
  total_weeks: number;

  // Import tracking
  import_source: ProtocolImportSource;
  import_metadata: Record<string, unknown>;

  // Visibility
  visibility: CoachProtocolVisibility;
  visibility_config: VisibilityConfig;

  // Scheduling
  schedule_type: ProtocolScheduleType;
  start_date?: string;

  // Status
  status: CoachProtocolStatusV2;
  version: number;
  published_at?: string;

  // UI customization
  theme_color: string;
  icon: string;

  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * Protocol with tasks included
 */
export interface CoachProtocolV2WithTasks extends CoachProtocolV2 {
  tasks: CoachProtocolTaskV2[];
}

/**
 * Protocol task entity
 */
export interface CoachProtocolTaskV2 {
  id: string;
  protocol_id: string;

  // Position
  week_number: number;
  day_number: number;
  task_order: number;

  // Content
  title: string;
  instructions: string;
  task_type: CoachTaskType;
  time_of_day: TaskTimeOfDay;

  // Optional resources
  estimated_minutes?: number;
  resource_url?: string;
  resource_type?: TaskResourceType;

  // Success criteria
  success_criteria: string[];

  // Week theme
  week_theme?: string;

  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * User assignment to a coach protocol
 */
export interface UserCoachProtocolAssignment {
  id: string;
  user_id: string;
  protocol_id: string;

  // Slot
  assignment_slot: AssignmentSlot;

  // Progress
  current_week: number;
  current_day: number;
  status: AssignmentStatus;

  // Timing
  assigned_at: string;
  started_at?: string;
  completed_at?: string;
  last_advanced_at?: string;

  // Stats
  days_completed: number;
  days_skipped: number;
  total_tasks_completed: number;

  // MIO integration
  paused_mio_protocol_id?: string;

  // Assignment source
  assigned_by?: string;
  assignment_note?: string;

  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * Assignment with protocol details
 */
export interface UserCoachProtocolAssignmentWithProtocol extends UserCoachProtocolAssignment {
  protocol: CoachProtocolV2;
}

/**
 * Task completion record
 */
export interface CoachProtocolCompletion {
  id: string;
  assignment_id: string;
  task_id: string;
  user_id: string;

  // Completion data
  completed_at: string;
  response_data: Record<string, unknown>;
  notes?: string;
  time_spent_minutes?: number;

  // Skip tracking
  was_skipped: boolean;
  auto_skipped: boolean;
  skip_reason?: string;

  // Self-assessment
  self_rating?: number;

  created_at: string;
}

/**
 * Completion event for analytics
 */
export interface CoachProtocolCompletionEvent {
  id: string;
  assignment_id: string;
  user_id: string;
  protocol_id: string;
  coach_id: string;

  event_type: CompletionEventType;

  // Stats at time of event
  days_completed: number;
  days_skipped: number;
  completion_percentage: number;

  // Notification tracking
  coach_notified: boolean;
  coach_notified_at?: string;

  created_at: string;
}

// =============================================
// IMPORT/PARSE TYPES
// =============================================

/**
 * Parsed task from CSV/Google Doc
 */
export interface ParsedProtocolTask {
  week_number: number;
  day_number: number;
  task_order: number;
  title: string;
  instructions: string;
  task_type: CoachTaskType;
  time_of_day: TaskTimeOfDay;
  estimated_minutes?: number;
  resource_url?: string;
  success_criteria?: string[];
  week_theme?: string;
}

/**
 * Parsed day structure
 */
export interface ParsedProtocolDay {
  day_number: number;
  tasks: ParsedProtocolTask[];
}

/**
 * Parsed week structure
 */
export interface ParsedProtocolWeek {
  week_number: number;
  theme?: string;
  days: ParsedProtocolDay[];
}

/**
 * Complete parsed protocol data from import
 */
export interface ParsedProtocolData {
  title: string;
  description?: string;
  weeks: ParsedProtocolWeek[];
  total_weeks: number;
  total_days: number;
  total_tasks: number;
  validation_warnings: string[];
  validation_errors: string[];
  is_valid: boolean;
}

/**
 * CSV row structure
 */
export interface CSVProtocolRow {
  week: string;
  day: string;
  time_of_day: string;
  task_type: string;
  title: string;
  instructions: string;
  duration_minutes?: string;
  resource_url?: string;
  success_criteria?: string;
  week_theme?: string;
}

/**
 * Validation result for import
 */
export interface ImportValidationResult {
  is_valid: boolean;
  errors: ImportValidationError[];
  warnings: ImportValidationWarning[];
}

export interface ImportValidationError {
  row?: number;
  field: string;
  message: string;
}

export interface ImportValidationWarning {
  row?: number;
  field: string;
  message: string;
}

// =============================================
// SERVICE REQUEST/RESPONSE TYPES
// =============================================

/**
 * Create protocol form data
 */
export interface CreateCoachProtocolForm {
  title: string;
  description?: string;
  total_weeks: number;
  visibility: CoachProtocolVisibility;
  visibility_config?: VisibilityConfig;
  schedule_type: ProtocolScheduleType;
  start_date?: string;
  theme_color?: string;
  icon?: string;
  tasks: CreateCoachProtocolTaskForm[];
}

/**
 * Create task form data
 */
export interface CreateCoachProtocolTaskForm {
  week_number: number;
  day_number: number;
  task_order: number;
  title: string;
  instructions: string;
  task_type: CoachTaskType;
  time_of_day: TaskTimeOfDay;
  estimated_minutes?: number;
  resource_url?: string;
  resource_type?: TaskResourceType;
  success_criteria?: string[];
  week_theme?: string;
}

/**
 * Assignment options
 */
export interface AssignmentOptions {
  slot: AssignmentSlot;
  start_date?: string; // 'immediate' | specific date
  override_existing?: boolean;
  assignment_note?: string;
}

/**
 * Assignment result
 */
export interface AssignmentResult {
  user_id: string;
  success: boolean;
  assignment_id?: string;
  error?: string;
  conflict?: {
    existing_protocol_id: string;
    existing_protocol_title: string;
  };
}

/**
 * Complete task request
 */
export interface CompleteTaskRequest {
  assignment_id: string;
  task_id: string;
  user_id?: string; // Required for virtual assignments (all_users visibility protocols)
  notes?: string;
  response_data?: Record<string, unknown>;
  time_spent_minutes?: number;
  self_rating?: number;
}

/**
 * Complete task response
 */
export interface CompleteTaskResponse {
  success: boolean;
  all_today_tasks_completed: boolean;
  protocol_completed: boolean;
}

/**
 * Today's tasks response for user
 */
export interface TodayCoachTasksResponse {
  primary?: {
    assignment: UserCoachProtocolAssignment;
    protocol: CoachProtocolV2;
    tasks: CoachProtocolTaskV2[];
    completed_task_ids: string[];
    total_days: number;
    absolute_day: number;
  };
  secondary?: {
    assignment: UserCoachProtocolAssignment;
    protocol: CoachProtocolV2;
    tasks: CoachProtocolTaskV2[];
    completed_task_ids: string[];
    total_days: number;
    absolute_day: number;
  };
}

/**
 * User protocols response
 */
export interface UserCoachProtocolsResponse {
  primary: UserProtocolWithProgress | null;
  secondary: UserProtocolWithProgress | null;
}

/**
 * Protocol with progress for user view
 */
export interface UserProtocolWithProgress {
  assignment: UserCoachProtocolAssignment;
  protocol: CoachProtocolV2;
  progress: {
    absolute_day: number;
    total_days: number;
    completion_percentage: number;
    days_remaining: number;
  };
}

// =============================================
// DASHBOARD TYPES
// =============================================

/**
 * Dashboard stats for a protocol
 */
export interface CoachProtocolDashboardStats {
  total_assigned: number;
  active: number;
  completed: number;
  abandoned: number;
  expired: number;
  avg_completion_rate: number;
  avg_days_to_complete: number;
}

/**
 * Assignment with progress for dashboard
 */
export interface DashboardAssignmentWithProgress {
  assignment: UserCoachProtocolAssignment;
  user: {
    id: string;
    full_name: string;
    email: string;
  };
  progress: {
    absolute_day: number;
    total_days: number;
    completion_percentage: number;
    is_behind: boolean;
    days_behind: number;
  };
  last_activity?: string;
}

/**
 * Dashboard filters
 */
export interface DashboardFilters {
  status?: AssignmentStatus[];
  week?: number;
  is_behind?: boolean;
  search?: string;
}

// =============================================
// N8N WEBHOOK TYPES
// =============================================

/**
 * N8N payload for daily advancement
 */
export interface N8nAdvancementPayload {
  assignments_advanced: number;
  assignments_completed: number;
  assignments_expired: number;
  notifications_sent: number;
  errors: string[];
}

/**
 * N8N payload for protocol completion notification
 */
export interface N8nCompletionNotificationPayload {
  user_id: string;
  user_name: string;
  user_email: string;
  protocol_id: string;
  protocol_title: string;
  coach_id: string;
  completion_stats: {
    days_completed: number;
    days_skipped: number;
    total_tasks_completed: number;
    completion_percentage: number;
  };
}

/**
 * N8N payload for assignment notification
 */
export interface N8nAssignmentNotificationPayload {
  user_id: string;
  user_name: string;
  protocol_id: string;
  protocol_title: string;
  assignment_slot: AssignmentSlot;
  start_date: string;
}

// =============================================
// MIO INTEGRATION TYPES
// =============================================

/**
 * Coach protocol context for MIO insights
 */
export interface CoachProtocolContextForMIO {
  has_active_protocol: boolean;
  primary_protocol?: {
    title: string;
    current_week: number;
    current_day: number;
    completion_rate: number;
    today_tasks: string[];
    week_theme?: string;
  };
  secondary_protocol?: {
    title: string;
    current_week: number;
    current_day: number;
    completion_rate: number;
    today_tasks: string[];
    week_theme?: string;
  };
  recent_completions: {
    task_title: string;
    notes?: string;
    completed_at: string;
  }[];
}

/**
 * MIO pause/resume result
 */
export interface MIOPauseResult {
  success: boolean;
  paused_mio_protocol_id?: string;
  error?: string;
}

export interface MIOResumeResult {
  success: boolean;
  new_mio_protocol_id?: string;
  completed_coach_protocol_context?: {
    title: string;
    days_completed: number;
    days_skipped: number;
    completion_percentage: number;
  };
  error?: string;
}
