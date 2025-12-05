// Weekly Insights Protocol Types
// Phase 26: MIO Dynamic Protocols + Coach Manual Protocols

// =============================================
// MIO Dynamic Protocols (AI-Generated)
// =============================================

export type MIOProtocolType =
  | 'recovery'
  | 'breakthrough'
  | 'success_sabotage'
  | 'guardian_protection'
  | 'identity_shift'
  | 'pattern_interrupt';

export type MIOProtocolSource =
  | 'assessment'
  | 'chat_recommendation'
  | 'manual_assignment'
  | 'streak_milestone';

export type MIOProtocolStatus = 'active' | 'completed' | 'abandoned' | 'paused';

export type MIOProgressStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped';

export interface MIODayTask {
  day: number;
  theme: string;
  morning_task: {
    title: string;
    instructions: string;
    duration_minutes?: number;
  };
  throughout_day: {
    title: string;
    instructions: string;
  };
  evening_task: {
    title: string;
    instructions: string;
    duration_minutes?: number;
  };
  success_criteria: string[];
}

export interface MIODailyCompletion {
  completed: boolean;
  completed_at: string;
  response_data?: Record<string, unknown>;
  notes?: string;
}

export interface MIOWeeklyProtocol {
  id: string;
  user_id: string;
  protocol_type: MIOProtocolType;
  protocol_theme: string;
  protocol_summary?: string;
  day_tasks: MIODayTask[];
  success_criteria?: string[];
  source: MIOProtocolSource;
  source_context?: Record<string, unknown>;
  week_number: number;
  year: number;
  assigned_week_start?: string;
  status: MIOProtocolStatus;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface MIOUserProtocolProgress {
  id: string;
  user_id: string;
  protocol_id: string;
  current_day: number;
  daily_completions: Record<string, MIODailyCompletion>;
  status: MIOProgressStatus;
  started_at?: string;
  completed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Extended type with protocol details
export interface MIOProtocolWithProgress extends MIOWeeklyProtocol {
  progress?: MIOUserProtocolProgress;
}

// =============================================
// Coach Manual Protocols
// =============================================

export type CoachScheduleType = 'weekly_cycle' | 'evergreen' | 'date_specific';

export type CoachVisibility = 'all_users' | 'tier_based' | 'individual';

export type CoachProtocolStatus = 'draft' | 'published' | 'archived';

export type CoachTaskType =
  | 'action'
  | 'reflection'
  | 'reading'
  | 'video'
  | 'worksheet'
  | 'voice_recording';

export interface CoachProtocol {
  id: string;
  title: string;
  description?: string;
  coach_id: string;
  schedule_type: CoachScheduleType;
  cycle_week_number?: number;
  start_date?: string;
  visibility: CoachVisibility;
  target_tiers: string[];
  target_users: string[];
  status: CoachProtocolStatus;
  version: number;
  published_at?: string;
  theme_color?: string;
  created_at: string;
  updated_at: string;
}

export interface CoachProtocolTask {
  id: string;
  protocol_id: string;
  day_number: number;
  task_order: number;
  title: string;
  instructions: string;
  task_type: CoachTaskType;
  estimated_duration?: number;
  resource_url?: string;
  document_id?: number;
  created_at: string;
}

export interface UserCoachProtocolProgress {
  id: string;
  user_id: string;
  protocol_id: string;
  task_id: string;
  completed: boolean;
  completed_at?: string;
  notes?: string;
  started_at: string;
}

// Extended type with tasks
export interface CoachProtocolWithTasks extends CoachProtocol {
  tasks: CoachProtocolTask[];
  progress?: UserCoachProtocolProgress[];
}

// =============================================
// Weekly Insights Hub Types
// =============================================

export interface WeeklyInsightsData {
  currentWeek: number;
  totalWeeks: number; // 30-day challenge = ~4 weeks, but can be longer
  currentDay: number; // Day within the current protocol (1-7)
  weekProgress: number; // Percentage 0-100
  protocolStreak: number; // Days in a row completing protocols

  // Active protocols
  mioProtocol?: MIOProtocolWithProgress;
  coachProtocol?: CoachProtocolWithTasks;
}

export interface ProtocolDayProgress {
  day: number;
  completed: boolean;
  completedAt?: string;
  isToday: boolean;
  isFuture: boolean;
}

// =============================================
// API Response Types
// =============================================

export interface CreateMIOProtocolRequest {
  protocol_type: MIOProtocolType;
  protocol_theme: string;
  protocol_summary?: string;
  day_tasks: MIODayTask[];
  success_criteria?: string[];
  source: MIOProtocolSource;
  source_context?: Record<string, unknown>;
}

export interface UpdateMIOProgressRequest {
  protocol_id: string;
  day_number: number;
  completed: boolean;
  response_data?: Record<string, unknown>;
  notes?: string;
}

export interface CompleteCoachTaskRequest {
  task_id: string;
  notes?: string;
}

// =============================================
// Notification Types
// =============================================

export type ProtocolNotificationType =
  | 'protocol_daily_task'      // "Day 3 Protocol ready: The Patience Experiment"
  | 'protocol_new_assigned'    // "New weekly protocol from MIO"
  | 'coach_content_new'        // "New coach content: Week 2 Identity Foundation"
  | 'protocol_streak_milestone' // "7-day protocol streak!"
  | 'protocol_reminder';        // "Don't forget today's protocol!"

export interface ProtocolNotification {
  type: ProtocolNotificationType;
  title: string;
  body: string;
  protocol_id?: string;
  task_id?: string;
  day_number?: number;
  streak_count?: number;
}

// =============================================
// MIO Reports (AI-Generated from n8n)
// =============================================

export type MIOReportType =
  | 'weekly_insight'
  | 'pattern_analysis'
  | 'breakthrough_detection'
  | 'dropout_risk'
  | 'celebration'
  | 'intervention'
  | 'custom';

export type MIOReportPriority = 'urgent' | 'high' | 'normal' | 'low';

export type MIOReportDisplayStatus = 'unread' | 'read' | 'archived' | 'dismissed';

export type MIOReportSource = 'n8n' | 'manual' | 'system';

export interface MIOReportSection {
  title: string;
  content: string;
  type: 'insight' | 'warning' | 'celebration' | 'action' | 'metric';
}

export interface MIOReportMetrics {
  streak?: number;
  completion_rate?: number;
  pattern_awareness_score?: number;
  dropout_risk_score?: number;
  breakthrough_probability?: number;
  [key: string]: number | string | boolean | undefined;
}

export interface MIOReportActionItem {
  title: string;
  description?: string;
  priority: 'high' | 'medium' | 'low';
  completed?: boolean;
}

export interface MIOReportContent {
  sections: MIOReportSection[];
  metrics?: MIOReportMetrics;
  recommendations?: string[];
  action_items?: MIOReportActionItem[];
  raw_analysis?: string; // For longer-form AI insights
}

export interface MIOUserReport {
  id: string;
  user_id: string;
  report_type: MIOReportType;
  title: string;
  summary?: string;
  content: MIOReportContent;
  priority: MIOReportPriority;
  confidence_score?: number;
  source: MIOReportSource;
  source_workflow_id?: string;
  source_execution_id?: string;
  source_context?: Record<string, unknown>;
  display_status: MIOReportDisplayStatus;
  pinned: boolean;
  valid_from: string;
  valid_until?: string;
  user_rating?: number;
  user_feedback?: string;
  read_at?: string;
  created_at: string;
  updated_at: string;
}

// =============================================
// Admin Protocol Management Types
// =============================================

export interface AdminApiKey {
  id: string;
  name: string;
  key_hash: string;
  key_prefix: string;
  permissions: string[];
  rate_limit_per_minute: number;
  is_active: boolean;
  last_used_at?: string;
  created_by?: string;
  description?: string;
  created_at: string;
  expires_at?: string;
}

// Form types for creating/editing
export interface CreateCoachProtocolForm {
  title: string;
  description?: string;
  schedule_type: CoachScheduleType;
  cycle_week_number?: number;
  start_date?: string;
  visibility: CoachVisibility;
  target_tiers?: string[];
  target_users?: string[];
  theme_color?: string;
}

export interface CreateCoachTaskForm {
  day_number: number;
  task_order: number;
  title: string;
  instructions: string;
  task_type: CoachTaskType;
  estimated_duration?: number;
  resource_url?: string;
  document_id?: number;
}

export interface CreateMIOReportForm {
  user_id: string;
  report_type: MIOReportType;
  title: string;
  summary?: string;
  content: MIOReportContent;
  priority?: MIOReportPriority;
  confidence_score?: number;
  source?: MIOReportSource;
  source_workflow_id?: string;
  source_execution_id?: string;
  source_context?: Record<string, unknown>;
  valid_until?: string;
}

// n8n Webhook payload type
export interface N8nMIOReportPayload {
  user_id: string;
  user_email?: string; // For lookup if user_id not provided
  report_type: MIOReportType;
  title: string;
  summary?: string;
  content: MIOReportContent;
  priority?: MIOReportPriority;
  confidence_score?: number;
  workflow_id?: string;
  execution_id?: string;
  context?: Record<string, unknown>;
  valid_until?: string;
}

// =============================================
// MIO Weekly Protocol System (Phase 27)
// AI-Generated 7-Day Protocols from Insights
// =============================================

export type MIOInsightProtocolStatus = 'active' | 'completed' | 'skipped' | 'muted' | 'expired';

export type MIOInsightType = 'dropout_risk' | 'breakthrough' | 'pattern_grip' | 'general';

export type MIOInsightUrgency = 'critical' | 'high' | 'moderate' | 'low';

/**
 * Extended day task structure for insight-based protocols
 * Supports simpler single-task-per-day or full morning/day/evening structure
 */
export interface MIOInsightDayTask {
  day: number;
  theme: string;
  task_title: string;
  task_instructions: string;
  duration_minutes?: number;
  success_criteria: string[];
  // Optional structured tasks (for more complex protocols)
  morning_task?: {
    title: string;
    instructions: string;
    duration_minutes?: number;
  };
  throughout_day?: {
    title: string;
    instructions: string;
  };
  evening_task?: {
    title: string;
    instructions: string;
    duration_minutes?: number;
  };
}

/**
 * MIO Weekly Insight Protocol
 * Generated by n8n workflow using AGENT-MIO-MASTER-v2.1.md capabilities
 */
export interface MIOInsightProtocol {
  id: string;
  user_id: string;
  report_id?: string; // Links to mio_user_reports

  // Protocol metadata
  protocol_type: string;
  title: string;
  insight_summary: string;
  why_it_matters?: string;
  neural_principle?: string;

  // 7-day structure
  day_tasks: MIOInsightDayTask[];

  // Timing
  week_number?: number;
  year?: number;
  assigned_week_start?: string;

  // Progress tracking
  current_day: number;
  status: MIOInsightProtocolStatus;
  started_at?: string;
  completed_at?: string;
  days_completed: number;
  days_skipped: number;

  // Coach control
  muted_by_coach: boolean;
  muted_at?: string;
  muted_by?: string;
  muted_reason?: string;

  // Source tracking (analytics)
  source: 'n8n_weekly' | 'manual_assignment' | 'assessment' | 'chat_recommendation';
  source_context?: Record<string, unknown>;
  rag_chunks_used?: string[];
  capability_triggers?: number[];
  confidence_score?: number;

  // User engagement
  insight_viewed_at?: string;
  first_task_started_at?: string;

  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * Protocol day completion record
 */
export interface MIOProtocolCompletion {
  id: string;
  protocol_id: string;
  user_id: string;
  day_number: number;
  completed_at: string;
  response_data?: Record<string, unknown>;
  notes?: string;
  time_spent_minutes?: number;
  was_skipped: boolean;
  skip_reason?: string;
  auto_skipped: boolean;
  self_rating?: number;
  created_at: string;
}

/**
 * Protocol with completions for display
 */
export interface MIOInsightProtocolWithProgress extends MIOInsightProtocol {
  completions: MIOProtocolCompletion[];
  today_task?: MIOInsightDayTask;
  is_today_completed: boolean;
}

/**
 * Capability analysis result from Claude
 */
export interface MIOCapabilityResult {
  number: number;
  name: string;
  triggered: boolean;
  confidence: number;
  finding?: string;
  evidence?: string[];
  insight_type: MIOInsightType;
}

/**
 * Full analysis result from Claude
 */
export interface MIOAnalysisResult {
  capabilities: MIOCapabilityResult[];
  recommended_insight: {
    capability_number: number;
    title: string;
    body: string;
    urgency: MIOInsightUrgency;
  };
}

/**
 * n8n webhook payload for creating insight protocol
 */
export interface N8nMIOInsightProtocolPayload {
  user_id: string;
  report_id?: string;
  title: string;
  insight_summary: string;
  why_it_matters?: string;
  neural_principle?: string;
  day_tasks: MIOInsightDayTask[];
  capability_triggers?: number[];
  confidence_score?: number;
  rag_chunks_used?: string[];
  source_context?: Record<string, unknown>;
}

/**
 * Request to complete a protocol day
 */
export interface CompleteProtocolDayRequest {
  protocol_id: string;
  day_number: number;
  response_data?: Record<string, unknown>;
  notes?: string;
  time_spent_minutes?: number;
}

/**
 * Response from completing a protocol day
 */
export interface CompleteProtocolDayResponse {
  success: boolean;
  completion_id?: string;
  days_completed?: number;
  protocol_completed?: boolean;
  error?: string;
}

/**
 * Today's protocol task for display in hub
 */
export interface TodayProtocolTask {
  protocol_id: string;
  protocol_title: string;
  day_number: number;
  total_days: number;
  task: MIOInsightDayTask;
  is_completed: boolean;
  days_completed: number;
  insight_summary: string;
}
