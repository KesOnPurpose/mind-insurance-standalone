/**
 * MIO Insights Thread Types
 *
 * Types for the MIO Section Completion Feedback feature:
 * - MIO Insights Thread (dedicated conversation for section feedback)
 * - Variable reward system (60/25/15 distribution)
 * - Section-specific energies (Commander, Strategist, Celebration)
 * - Push notification subscriptions
 */

// ============================================================================
// SECTION TYPES
// ============================================================================

/** Practice sections and their practice types */
export const SECTION_PRACTICES = {
  PRO: ['P', 'R', 'O'] as const,  // Champion Setup (3 AM - 10 AM)
  TE: ['T', 'E'] as const,         // NASCAR Pit Stop (10 AM - 3 PM)
  CT: ['C', 'T2'] as const,        // Victory Lap (3 PM - 10 PM)
} as const;

export type SectionType = keyof typeof SECTION_PRACTICES;

/** Section names for display */
export const SECTION_NAMES: Record<SectionType, string> = {
  PRO: 'Morning Protocol',
  TE: 'Midday Protocol',
  CT: 'Evening Protocol',
};

/** Section time windows */
export const SECTION_WINDOWS: Record<SectionType, { start: number; end: number }> = {
  PRO: { start: 3, end: 10 },   // 3 AM - 10 AM
  TE: { start: 10, end: 15 },   // 10 AM - 3 PM
  CT: { start: 15, end: 22 },   // 3 PM - 10 PM
};

// ============================================================================
// ENERGY TYPES
// ============================================================================

/** MIO's section-specific energy/persona */
export type SectionEnergy = 'commander' | 'strategist' | 'celebration';

/** Energy configuration for each section */
export const SECTION_ENERGY_CONFIG: Record<SectionType, {
  energy: SectionEnergy;
  name: string;
  description: string;
  icon: string;
  color: string;
}> = {
  PRO: {
    energy: 'commander',
    name: 'Commander Energy',
    description: 'Decisive, vision-casting, identity-focused',
    icon: '👑',
    color: '#FFD700', // Gold
  },
  TE: {
    energy: 'strategist',
    name: 'Strategist Energy',
    description: 'Analytical, course-correcting, tactical',
    icon: '🎯',
    color: '#00D4FF', // Cyan
  },
  CT: {
    energy: 'celebration',
    name: 'Celebration Energy',
    description: 'Reflective, identity-affirming, gratitude',
    icon: '🏆',
    color: '#8A2BE2', // Purple
  },
};

// ============================================================================
// VARIABLE REWARD TYPES
// ============================================================================

/** Reward tiers for variable reward system */
export type RewardTier = 'standard' | 'bonus_insight' | 'pattern_breakthrough';

/** Reward tier configuration */
export const REWARD_TIER_CONFIG: Record<RewardTier, {
  name: string;
  description: string;
  probability: number; // Cumulative probability (0-1)
  icon: string;
  badgeColor: string;
  animationClass?: string;
}> = {
  standard: {
    name: 'Standard Insight',
    description: 'Solid, personalized feedback',
    probability: 0.60, // 60%
    icon: '💡',
    badgeColor: 'bg-slate-500',
  },
  bonus_insight: {
    name: 'Bonus Insight',
    description: 'Deeper forensic connection',
    probability: 0.85, // 25% (60% + 25%)
    icon: '✨',
    badgeColor: 'bg-cyan-500',
    animationClass: 'animate-pulse-once', // One-time pulse to prevent strobe effect
  },
  pattern_breakthrough: {
    name: 'Pattern Breakthrough',
    description: 'Significant pattern detection',
    probability: 1.00, // 15% (remaining)
    icon: '🌟',
    badgeColor: 'bg-gradient-to-r from-yellow-400 to-purple-500',
    animationClass: 'animate-bounce-once animate-glow-once', // One-time bounce + glow
  },
};

/** Roll result for variable reward */
export interface RewardRoll {
  tier: RewardTier;
  probability: number;
}

// ============================================================================
// MIO INSIGHTS THREAD
// ============================================================================

/** MIO Insights Thread - one per user */
export interface MIOInsightsThread {
  id: string;
  user_id: string;
  thread_title: string;
  thread_subtitle: string | null;
  is_pinned: boolean;
  total_messages: number;
  total_insights: number;
  unread_count: number;
  last_insight_at: string | null;
  last_user_reply_at: string | null;
  days_with_insights: number;
  current_engagement_streak: number;
  created_at: string;
  updated_at: string;
}

/** Create thread payload */
export interface CreateMIOInsightsThreadPayload {
  user_id: string;
  thread_title?: string;
  thread_subtitle?: string;
}

// ============================================================================
// MIO INSIGHTS MESSAGES
// ============================================================================

/** Pattern detection result */
export interface PatternDetection {
  pattern_name: string;
  pattern_type: string;
  confidence_score: number;
  evidence: string;
}

/** MIO Insights Message - individual message in thread */
export interface MIOInsightsMessage {
  id: string;
  thread_id: string;
  user_id: string;
  role: 'mio' | 'user';
  content: string;
  section_type: SectionType | 'reengagement' | 'protocol' | 'breakthrough' | 'first_engagement' | null;
  section_energy: SectionEnergy | null;
  reward_tier: RewardTier;
  reward_probability: number | null;
  feedback_id: string | null;
  forensic_analysis_ids: string[];
  patterns_detected: PatternDetection[];
  protocol_suggested: string | null;
  quality_score: number | null;
  depth_score: number | null;
  delivered_at: string;
  read_at: string | null;
  in_reply_to: string | null;
  created_at: string;
  updated_at: string;
}

/** Create MIO message payload (from edge function) */
export interface CreateMIOInsightMessagePayload {
  thread_id: string;
  user_id: string;
  content: string;
  section_type: SectionType;
  section_energy: SectionEnergy;
  reward_tier: RewardTier;
  reward_probability: number;
  feedback_id?: string;
  forensic_analysis_ids?: string[];
  patterns_detected?: PatternDetection[];
  protocol_suggested?: string;
  quality_score?: number;
  depth_score?: number;
}

/** Create user reply payload */
export interface CreateUserReplyPayload {
  thread_id: string;
  content: string;
  in_reply_to?: string;
}

// ============================================================================
// USER ACTIVITY TRACKING
// ============================================================================

/** User activity tracking for 2-day inactivity trigger */
export interface MIOUserActivityTracking {
  id: string;
  user_id: string;
  last_practice_at: string | null;
  last_section_completed_at: string | null;
  last_section_completed: SectionType | null;
  last_app_open_at: string | null;
  inactive_days: number;
  is_at_risk: boolean;
  last_reengagement_sent_at: string | null;
  reengagement_count: number;
  last_reengagement_responded: boolean | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// PUSH SUBSCRIPTIONS
// ============================================================================

export type DeviceType = 'desktop' | 'mobile' | 'tablet' | 'unknown';

/** Push subscription record */
export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
  user_agent: string | null;
  device_type: DeviceType | null;
  is_active: boolean;
  last_used_at: string | null;
  error_count: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

/** Create push subscription payload */
export interface CreatePushSubscriptionPayload {
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
  user_agent?: string;
  device_type?: DeviceType;
}

/** Push notification payload */
export interface PushNotificationPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  notification_id?: string;
  data?: Record<string, unknown>;
}

// ============================================================================
// SECTION FEEDBACK REQUEST/RESPONSE
// ============================================================================

/** Request to trigger section feedback */
export interface SectionFeedbackRequest {
  user_id: string;
  section: SectionType;
  practice_date: string; // ISO date string (YYYY-MM-DD)
}

/** Response from section feedback edge function */
export interface SectionFeedbackResponse {
  success: boolean;
  feedback_text: string;
  message_id: string;
  thread_id: string;
  reward_tier: RewardTier;
  section_energy: SectionEnergy;
  patterns_detected: PatternDetection[];
  protocol_suggested: string | null;
  push_sent: boolean;
  error?: string;
}

// ============================================================================
// RE-ENGAGEMENT
// ============================================================================

/** Re-engagement trigger result */
export interface ReengagementResult {
  user_id: string;
  message_sent: boolean;
  message_id: string | null;
  push_sent: boolean;
  inactive_days: number;
  error?: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/** Section completion status */
export interface SectionCompletionStatus {
  section: SectionType;
  practices_required: string[];
  practices_completed: string[];
  is_complete: boolean;
  completion_percentage: number;
}

/** Full day completion status */
export interface DayCompletionStatus {
  date: string;
  sections: Record<SectionType, SectionCompletionStatus>;
  total_practices_completed: number;
  total_practices_required: number;
  is_complete: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Roll for variable reward tier
 * 60% standard, 25% bonus insight, 15% pattern breakthrough
 */
export function rollVariableReward(): RewardRoll {
  const roll = Math.random();

  if (roll < 0.15) {
    return { tier: 'pattern_breakthrough', probability: roll };
  } else if (roll < 0.40) {
    return { tier: 'bonus_insight', probability: roll };
  } else {
    return { tier: 'standard', probability: roll };
  }
}

/**
 * Get section from practice type
 */
export function getSectionFromPracticeType(practiceType: string): SectionType | null {
  for (const [section, practices] of Object.entries(SECTION_PRACTICES)) {
    if (practices.includes(practiceType as any)) {
      return section as SectionType;
    }
  }
  return null;
}

/**
 * Get section energy config
 */
export function getSectionEnergyConfig(section: SectionType) {
  return SECTION_ENERGY_CONFIG[section];
}

/**
 * Check if current time is within section window
 */
export function isWithinSectionWindow(section: SectionType, timezone: string = 'America/Los_Angeles'): boolean {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    hour12: false,
    timeZone: timezone,
  });
  const currentHour = parseInt(formatter.format(now), 10);

  const window = SECTION_WINDOWS[section];
  return currentHour >= window.start && currentHour < window.end;
}

/**
 * Get current section based on time
 */
export function getCurrentSection(timezone: string = 'America/Los_Angeles'): SectionType | null {
  for (const section of Object.keys(SECTION_WINDOWS) as SectionType[]) {
    if (isWithinSectionWindow(section, timezone)) {
      return section;
    }
  }
  return null;
}
