/**
 * RKPI Module: Relationship KPIs Type Definitions
 * Mind Insurance - Relationship KPIs Integration
 *
 * Maps to 7 database tables:
 *   relationship_partnerships, relationship_check_ins, relationship_kpi_scores,
 *   relationship_action_items, relationship_insights, relationship_connection_prompts,
 *   relationship_trend_cache
 */

// ============================================================================
// Enums & Literal Types
// ============================================================================

/** 10 KPIs based on "His Needs, Her Needs" framework */
export type RelationshipKPIName =
  | 'affection'
  | 'sexual_fulfillment'
  | 'intimate_conversation'
  | 'recreational_companionship'
  | 'honesty_openness'
  | 'physical_attractiveness'
  | 'financial_support'
  | 'domestic_support'
  | 'family_commitment'
  | 'admiration';

/** Score category derived from 1-10 score */
export type ScoreCategory = 'critical' | 'needs_attention' | 'good' | 'excellent' | 'unknown';

/** Partnership invitation status */
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired';

/** Partnership status */
export type PartnershipStatus = 'active' | 'paused' | 'ended';

/** Check-in status */
export type CheckInStatus = 'draft' | 'completed';

/** Action item assignment */
export type ActionItemAssignee = 'self' | 'partner' | 'both';

/** Insight type */
export type InsightType = 'weekly_summary' | 'pattern_detected' | 'celebration' | 'warning';

/** Connection prompt category */
export type PromptCategory = 'emotional' | 'physical' | 'intellectual' | 'spiritual' | 'fun';

/** Intimacy level for prompts */
export type IntimacyLevel = 'light' | 'medium' | 'deep';

/** Prompt audience: partner conversation or child connection */
export type PromptAudience = 'partner' | 'child';

/** Age range for kid-targeted prompts */
export type KidAgeRange = 'toddler_0_4' | 'child_5_9' | 'tween_10_13' | 'teen_14_18';

/** Sub-category for richer prompt filtering */
export type PromptSubCategory =
  | 'romance' | 'sex_intimacy' | 'growth' | 'play' | 'faith' | 'finance' | 'dreams'
  | 'bonding' | 'mentoring' | 'fun' | 'emotional' | 'values';

/** Trend timeframe */
export type TrendTimeframe = '4_weeks' | '3_months' | '6_months' | 'all_time';

/** Trend direction */
export type TrendDirection = 'improving' | 'stable' | 'declining';

// ============================================================================
// KPI Metadata
// ============================================================================

export interface KPIDefinition {
  name: RelationshipKPIName;
  label: string;
  description: string;
  category: 'emotional' | 'physical' | 'practical' | 'intellectual';
}

/** All 10 KPI definitions with labels and descriptions */
export const KPI_DEFINITIONS: KPIDefinition[] = [
  {
    name: 'affection',
    label: 'Affection',
    description: 'Expressions of love, care, and tenderness',
    category: 'emotional',
  },
  {
    name: 'sexual_fulfillment',
    label: 'Sexual Fulfillment',
    description: 'Physical intimacy satisfaction and connection',
    category: 'physical',
  },
  {
    name: 'intimate_conversation',
    label: 'Intimate Conversation',
    description: 'Deep, meaningful communication and emotional sharing',
    category: 'emotional',
  },
  {
    name: 'recreational_companionship',
    label: 'Recreational Companionship',
    description: 'Shared activities, fun, and quality time together',
    category: 'physical',
  },
  {
    name: 'honesty_openness',
    label: 'Honesty & Openness',
    description: 'Transparency, trust, and vulnerability',
    category: 'emotional',
  },
  {
    name: 'physical_attractiveness',
    label: 'Physical Attractiveness',
    description: 'Mutual effort in appearance and physical well-being',
    category: 'physical',
  },
  {
    name: 'financial_support',
    label: 'Financial Support',
    description: 'Shared financial responsibility and security',
    category: 'practical',
  },
  {
    name: 'domestic_support',
    label: 'Domestic Support',
    description: 'Household management and daily life partnership',
    category: 'practical',
  },
  {
    name: 'family_commitment',
    label: 'Family Commitment',
    description: 'Dedication to family life and parenting partnership',
    category: 'practical',
  },
  {
    name: 'admiration',
    label: 'Admiration',
    description: 'Respect, appreciation, and pride in each other',
    category: 'emotional',
  },
];

// ============================================================================
// Score Thresholds
// ============================================================================

export const SCORE_THRESHOLDS = {
  critical: { min: 1, max: 3, color: 'red' },
  needs_attention: { min: 4, max: 6, color: 'amber' },
  good: { min: 7, max: 8, color: 'green' },
  excellent: { min: 9, max: 10, color: 'emerald' },
} as const;

// ============================================================================
// Table 1: relationship_partnerships
// ============================================================================

export interface RelationshipPartnership {
  id: string;
  user_id: string;
  partner_id: string | null;
  invitation_status: InvitationStatus;
  status: PartnershipStatus;
  partner_email: string;
  partner_phone: string | null;
  partner_name: string | null;
  invitation_token: string;
  invitation_sent_at: string | null;
  invitation_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RelationshipPartnershipInsert {
  partner_email: string;
  partner_phone?: string | null;
  partner_name?: string | null;
}

export interface RelationshipPartnershipUpdate {
  invitation_status?: InvitationStatus;
  status?: PartnershipStatus;
  partner_id?: string | null;
  partner_email?: string;
  partner_phone?: string | null;
  partner_name?: string | null;
}

// ============================================================================
// Table 2: relationship_check_ins
// ============================================================================

export interface RelationshipCheckIn {
  id: string;
  user_id: string;
  partnership_id: string | null;
  check_in_week: string;
  check_in_date: string;
  overall_score: number | null;
  completed_at: string | null;
  status: CheckInStatus;
  created_at: string;
}

export interface RelationshipCheckInInsert {
  partnership_id?: string | null;
  check_in_week: string;
  check_in_date?: string;
  status?: CheckInStatus;
}

export interface RelationshipCheckInUpdate {
  overall_score?: number | null;
  completed_at?: string | null;
  status?: CheckInStatus;
  partnership_id?: string | null;
}

// ============================================================================
// Table 3: relationship_kpi_scores
// ============================================================================

export interface RelationshipKPIScore {
  id: string;
  check_in_id: string;
  user_id: string;
  kpi_name: RelationshipKPIName;
  score: number;
  notes: string | null;
  is_private: boolean;
  shared_with_partner: boolean;
  score_category: ScoreCategory;
  created_at: string;
}

export interface RelationshipKPIScoreInsert {
  check_in_id: string;
  kpi_name: RelationshipKPIName;
  score: number;
  notes?: string | null;
  is_private?: boolean;
  shared_with_partner?: boolean;
}

export interface RelationshipKPIScoreUpdate {
  score?: number;
  notes?: string | null;
  is_private?: boolean;
  shared_with_partner?: boolean;
}

// ============================================================================
// Table 4: relationship_action_items
// ============================================================================

export interface RelationshipActionItem {
  id: string;
  check_in_id: string;
  user_id: string;
  item_text: string;
  assigned_to: ActionItemAssignee;
  completed: boolean;
  completed_at: string | null;
  related_kpi: RelationshipKPIName | null;
  created_at: string;
}

export interface RelationshipActionItemInsert {
  check_in_id: string;
  item_text: string;
  assigned_to?: ActionItemAssignee;
  related_kpi?: RelationshipKPIName | null;
}

export interface RelationshipActionItemUpdate {
  item_text?: string;
  assigned_to?: ActionItemAssignee;
  completed?: boolean;
  completed_at?: string | null;
  related_kpi?: RelationshipKPIName | null;
}

// ============================================================================
// Table 5: relationship_insights
// ============================================================================

export interface RelationshipInsight {
  id: string;
  check_in_id: string;
  user_id: string;
  insight_text: string;
  insight_type: InsightType;
  kpi_scores_snapshot: Record<string, unknown> | null;
  generated_at: string;
  rating: number | null;
}

export interface RelationshipInsightUpdate {
  rating?: number | null;
}

// ============================================================================
// Table 6: relationship_connection_prompts
// ============================================================================

export interface RelationshipConnectionPrompt {
  id: string;
  prompt_text: string;
  prompt_category: PromptCategory;
  intimacy_level: IntimacyLevel;
  focus_kpi: RelationshipKPIName | null;
  is_active: boolean;
  created_at: string;
  audience: PromptAudience;
  kid_age_range: KidAgeRange | null;
  sub_category: PromptSubCategory | null;
}

// ============================================================================
// Table 7: relationship_trend_cache
// ============================================================================

export interface RelationshipTrendCache {
  id: string;
  user_id: string;
  kpi_name: RelationshipKPIName;
  timeframe: TrendTimeframe;
  average_score: number | null;
  trend_direction: TrendDirection | null;
  week_over_week_change: number | null;
  last_calculated: string;
  created_at: string;
}

export interface RelationshipTrendCacheInsert {
  kpi_name: RelationshipKPIName;
  timeframe: TrendTimeframe;
  average_score?: number | null;
  trend_direction?: TrendDirection | null;
  week_over_week_change?: number | null;
}

export interface RelationshipTrendCacheUpdate {
  average_score?: number | null;
  trend_direction?: TrendDirection | null;
  week_over_week_change?: number | null;
  last_calculated?: string;
}

// ============================================================================
// Composite / UI Types
// ============================================================================

/** A check-in with its associated KPI scores */
export interface CheckInWithScores extends RelationshipCheckIn {
  scores: RelationshipKPIScore[];
  action_items?: RelationshipActionItem[];
  insight?: RelationshipInsight | null;
}

/** Dashboard summary data */
export interface RelationshipDashboardData {
  partnership: RelationshipPartnership | null;
  latestCheckIn: CheckInWithScores | null;
  trends: RelationshipTrendCache[];
  weeklyPrompt: RelationshipConnectionPrompt | null;
  pendingActionItems: RelationshipActionItem[];
  recentInsights: RelationshipInsight[];
}

/** KPI heat map cell data */
export interface HeatMapCell {
  kpiName: RelationshipKPIName;
  week: string;
  score: number | null;
  category: ScoreCategory | null;
}

/** KPI trend chart data point */
export interface TrendDataPoint {
  week: string;
  score: number;
}

/** Partner comparison data (only non-private scores) */
export interface PartnerScoreComparison {
  kpiName: RelationshipKPIName;
  userScore: number | null;
  partnerScore: number | null;
  difference: number | null;
}

/** Check-in wizard step data */
export interface CheckInWizardState {
  currentStep: number;
  checkInId: string | null;
  scores: Partial<Record<RelationshipKPIName, { score: number; notes: string; isPrivate: boolean }>>;
  actionItems: Array<{ text: string; assignedTo: ActionItemAssignee; relatedKpi: RelationshipKPIName | null }>;
  isSubmitting: boolean;
}
