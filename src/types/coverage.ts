// =============================================
// Coverage Center Types
// Phase 1: Coverage Center - $100M Mind Insurance Feature
// =============================================

// =============================================
// Coverage Streak Types
// =============================================

/**
 * Coverage streak data for a user
 * Tracks consecutive protocol completion days
 */
export interface CoverageStreak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  skip_tokens: number;
  last_completion_date: string | null;
  streak_started_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Simplified streak data for display
 */
export interface CoverageStreakDisplay {
  current_streak: number;
  longest_streak: number;
  skip_tokens: number;
  streak_broken?: boolean;
}

// =============================================
// Coverage Milestone Types
// =============================================

export type MilestoneType = 'day_7' | 'day_21' | 'day_66' | 'protocol_complete';

/**
 * Milestone achievement record
 */
export interface CoverageMilestone {
  id: string;
  user_id: string;
  milestone_type: MilestoneType;
  achieved_at: string;
  protocol_id: string | null;
  context?: Record<string, unknown>;
}

/**
 * Milestone with protocol details for display
 */
export interface CoverageMilestoneWithProtocol extends CoverageMilestone {
  protocol_title?: string;
}

/**
 * Milestone display configuration
 */
export interface MilestoneConfig {
  type: MilestoneType;
  label: string;
  description: string;
  icon: string;
  color: string;
  daysRequired?: number;
}

// =============================================
// Coverage History Types
// =============================================

/**
 * Protocol history item for Coverage Center display
 */
export interface CoverageHistoryItem {
  protocol_id: string;
  protocol_title: string;
  pattern_targeted: string;
  completion_percentage: number;
  days_completed: number;
  total_days: number;
  status: 'active' | 'completed' | 'skipped' | 'muted' | 'expired';
  skip_token_earned: boolean;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

/**
 * Combined MIO and Coach history
 */
export interface CoverageHistory {
  mio_protocols: CoverageHistoryItem[];
  coach_protocols: CoverageHistoryItem[];
  total_completed: number;
  total_skip_tokens_earned: number;
}

// =============================================
// Skip Token Types
// =============================================

export interface SkipTokenState {
  tokens_available: number;
  max_tokens: number;
  can_use: boolean;
  streak_at_risk: boolean;
}

export interface UseSkipTokenResult {
  success: boolean;
  skip_tokens_remaining?: number;
  streak_protected?: boolean;
  error?: string;
}

// =============================================
// Protocol Day Completion Types
// =============================================

export type PracticeResponse =
  | 'yes_multiple'    // Practiced multiple times
  | 'yes_once'        // Practiced at least once
  | 'tried'           // Tried but didn't notice
  | 'forgot';         // Forgot to practice

/**
 * Request payload for completing a protocol day with streak tracking
 */
export interface CompleteProtocolDayWithStreakRequest {
  protocol_id: string;
  day_number: number;
  response_data?: Record<string, unknown>;
  notes?: string;
  time_spent_minutes?: number;
  practice_response?: PracticeResponse;
  moment_captured?: string;
  insight_captured?: string;
}

/**
 * Response from completing a protocol day with streak
 */
export interface CompleteProtocolDayWithStreakResponse {
  success: boolean;
  completion_id?: string;
  days_completed?: number;
  protocol_completed?: boolean;
  streak?: CoverageStreakDisplay;
  milestone_achieved?: MilestoneType;
  skip_token_awarded?: boolean;
  error?: string;
}

// =============================================
// Coverage Center Page Types
// =============================================

export type CoverageTab = 'mio' | 'coach';

/**
 * Active protocol summary for display
 */
export interface ActiveProtocolSummary {
  id: string;
  title: string;
  pattern_targeted: string;
  insight_summary?: string;
  current_day: number;
  total_days: number;
  days_completed: number;
  status: string;
  today_task?: {
    day: number;
    theme: string;
    task_title: string;
    task_instructions: string;
    success_criteria: string[];
  };
  is_today_completed: boolean;
  started_at: string | null;
  created_at: string;
}

/**
 * Dashboard coverage card data
 */
export interface DashboardCoverageData {
  has_active_protocol: boolean;
  active_protocol_type: 'mio' | 'coach' | null;
  active_protocol_title?: string;
  current_day?: number;
  total_days?: number;
  coverage_streak: number;
  skip_tokens: number;
  is_today_completed: boolean;
}

// =============================================
// First Session Types
// =============================================

export interface FirstSessionState {
  step: 'welcome' | 'analyzing' | 'reveal' | 'question' | 'complete';
  user_name: string;
  pattern_name?: string;
  protocol_id?: string;
  protocol_title?: string;
  mio_welcome_message?: string;
  mio_question?: string;
  user_response?: string;
}

export interface FirstSessionProtocolReveal {
  protocol_id: string;
  title: string;
  pattern_name: string;
  insight_summary: string;
  why_it_matters: string;
  neural_principle?: string;
  first_day_preview: {
    theme: string;
    task_title: string;
  };
}

// =============================================
// Transformation Metrics Types
// =============================================

export interface TransformationMetrics {
  // Assessment scores (before/after)
  initial_collision_score?: number;
  current_collision_score?: number;
  collision_improvement?: number;

  // Protocol metrics
  protocols_completed: number;
  total_days_practiced: number;
  average_completion_rate: number;

  // Streak metrics
  current_streak: number;
  longest_streak: number;

  // Pattern insights
  primary_pattern?: string;
  patterns_addressed: string[];

  // Time metrics
  member_since: string;
  days_active: number;
}

// =============================================
// In-App Alert Types
// =============================================

export type CoverageAlertType =
  | 'ct_window_open'       // "Your coverage window is open"
  | 'ct_window_reminder'   // "2 hours left to complete"
  | 'streak_at_risk'       // "30 min left, use skip token?"
  | 'day_complete'         // "Day complete! MIO has a message"
  | 'streak_broken'        // "Coverage lapsed"
  | 'skip_token_used'      // "Streak protected"
  | 'protocol_complete'    // "Protocol complete! Skip token earned"
  | 'variable_insight';    // "MIO noticed something..."

export interface CoverageAlert {
  type: CoverageAlertType;
  title: string;
  body: string;
  action_url?: string;
  action_label?: string;
  streak_count?: number;
  skip_tokens?: number;
  protocol_id?: string;
  day_number?: number;
}

// =============================================
// N8n Webhook Payload Types
// =============================================

/**
 * Payload sent to N8n for first protocol generation
 * POST /webhook/first-protocol-generation
 */
export interface FirstProtocolGenerationPayload {
  user_id: string;
  user_name: string;
  identity_collision_pattern: string;
  assessment_scores: {
    overall_score: number;
    pattern_scores: Record<string, number>;
    temperament?: string;
  };
  stated_intentions?: string;
  onboarding_answers?: Record<string, unknown>;
}

/**
 * Payload sent to N8n after protocol day completion
 * POST /webhook/protocol-day-completion
 */
export interface ProtocolDayCompletionPayload {
  user_id: string;
  user_name: string;
  protocol_id: string;
  day_number: number;
  practice_response: PracticeResponse;
  moment_captured?: string;
  insight_captured?: string;
  collision_pattern: string;
  previous_insights: string[];
  streak_count: number;
  protocol_title: string;
  day_theme: string;
}

// =============================================
// Constants
// =============================================

export const MILESTONE_CONFIGS: Record<MilestoneType, MilestoneConfig> = {
  day_7: {
    type: 'day_7',
    label: '7-Day Streak',
    description: 'Completed 7 consecutive days of coverage',
    icon: 'flame',
    color: 'orange',
    daysRequired: 7,
  },
  day_21: {
    type: 'day_21',
    label: '21-Day Breakthrough',
    description: 'Neural pathways forming - habit foundation built',
    icon: 'brain',
    color: 'purple',
    daysRequired: 21,
  },
  day_66: {
    type: 'day_66',
    label: '66-Day Transformation',
    description: 'Identity shift complete - new default installed',
    icon: 'trophy',
    color: 'gold',
    daysRequired: 66,
  },
  protocol_complete: {
    type: 'protocol_complete',
    label: 'Protocol Complete',
    description: 'Completed a full 7-day protocol',
    icon: 'check-circle',
    color: 'green',
  },
};

export const MAX_SKIP_TOKENS = 3;

export const COVERAGE_TIME_WINDOWS = {
  CT_START_HOUR: 15, // 3 PM
  CT_END_HOUR: 22,   // 10 PM
} as const;

// Insurance-themed language mappings
export const COVERAGE_LANGUAGE = {
  streak: 'Coverage Streak',
  skipToken: 'Coverage Protection',
  milestone: 'Coverage Milestone',
  protocol: 'Coverage Protocol',
  completion: 'Coverage Completion',
  lapsed: 'Coverage Lapsed',
} as const;
