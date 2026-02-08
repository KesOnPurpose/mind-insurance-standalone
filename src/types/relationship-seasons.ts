/**
 * RIE Phase 2A: Marriage Seasons Types
 * 90 life seasons across 10 categories with predicted KPI impacts.
 *
 * Maps to: relationship_season_catalog, relationship_user_seasons,
 *          relationship_season_signals, relationship_season_kpi_impacts
 */

import type { RelationshipKPIName } from './relationship-kpis';

// ============================================================================
// Enums & Literal Types
// ============================================================================

export type SeasonCategory =
  | 'new_parents'
  | 'career_transition'
  | 'health_crisis'
  | 'financial_stress'
  | 'relocation'
  | 'grief_loss'
  | 'spiritual_growth'
  | 'empty_nest'
  | 'retirement'
  | 'blended_family';

export type LifeStage =
  | 'early_marriage'
  | 'young_family'
  | 'established_family'
  | 'midlife'
  | 'empty_nest'
  | 'retirement'
  | 'any';

export type UserSeasonStatus = 'current' | 'past_healed' | 'past_unhealed';

export type SignalType = 'temporal' | 'life_stage' | 'kpi_pattern' | 'emotional' | 'explicit';

// ============================================================================
// Category Metadata
// ============================================================================

export interface SeasonCategoryDefinition {
  category: SeasonCategory;
  label: string;
  icon: string;
  description: string;
}

export const SEASON_CATEGORIES: SeasonCategoryDefinition[] = [
  { category: 'new_parents', label: 'New Parents', icon: '👶', description: 'Navigating the arrival and early years of children.' },
  { category: 'career_transition', label: 'Career Transition', icon: '💼', description: 'Job changes, promotions, business launches, or retirement shifts.' },
  { category: 'health_crisis', label: 'Health Crisis', icon: '🏥', description: 'Dealing with illness, injury, or mental health challenges.' },
  { category: 'financial_stress', label: 'Financial Stress', icon: '💰', description: 'Debt, job loss, major purchases, or financial disagreements.' },
  { category: 'relocation', label: 'Relocation', icon: '🏠', description: 'Moving to a new city, country, or living situation.' },
  { category: 'grief_loss', label: 'Grief & Loss', icon: '🕊️', description: 'Processing death, miscarriage, divorce of parents, or other loss.' },
  { category: 'spiritual_growth', label: 'Spiritual Growth', icon: '🙏', description: 'Faith journeys, religious differences, or spiritual awakening.' },
  { category: 'empty_nest', label: 'Empty Nest', icon: '🏡', description: 'Children leaving home — rediscovering the partnership.' },
  { category: 'retirement', label: 'Retirement', icon: '🌅', description: 'Transitioning from work life to shared leisure and purpose.' },
  { category: 'blended_family', label: 'Blended Family', icon: '👨‍👩‍👧‍👦', description: 'Step-parenting, co-parenting, and merging households.' },
];

// ============================================================================
// KPI Impact
// ============================================================================

/** Predicted impact: -3 (strong negative) to +3 (strong positive) */
export type KPIImpactScore = -3 | -2 | -1 | 0 | 1 | 2 | 3;

export type PredictedKPIImpacts = Partial<Record<RelationshipKPIName, KPIImpactScore>>;

// ============================================================================
// Table 1: relationship_season_catalog
// ============================================================================

export interface RelationshipSeasonCatalog {
  id: string;
  season_number: number;
  category: SeasonCategory;
  season_name: string;
  season_description: string | null;
  typical_duration_months: number | null;
  life_stage: LifeStage;
  predicted_kpi_impacts: PredictedKPIImpacts;
  guidance_tips: string[];
  is_hero: boolean;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Table 2: relationship_user_seasons
// ============================================================================

export interface RelationshipUserSeason {
  id: string;
  user_id: string;
  partnership_id: string | null;
  season_id: string;
  status: UserSeasonStatus;
  healing_progress: number; // 0-100
  intensity: number; // 1-5
  started_at: string;
  ended_at: string | null;
  notes: string | null;
  is_private: boolean;
  created_at: string;
}

export interface UserSeasonInsert {
  season_id: string;
  partnership_id?: string | null;
  status?: UserSeasonStatus;
  healing_progress?: number;
  intensity?: number;
  started_at?: string;
  notes?: string | null;
  is_private?: boolean;
}

export interface UserSeasonUpdate {
  status?: UserSeasonStatus;
  healing_progress?: number;
  ended_at?: string | null;
  notes?: string | null;
  intensity?: number;
  is_private?: boolean;
}

// ============================================================================
// Table 3: relationship_season_kpi_impacts
// ============================================================================

export interface RelationshipSeasonKPIImpact {
  id: string;
  user_season_id: string;
  kpi_name: string;
  predicted_impact: number;
  actual_impact: number | null;
  measured_week: string;
  created_at: string;
}

// ============================================================================
// Composite / UI Types
// ============================================================================

/** A user season with its catalog entry joined */
export interface UserSeasonWithCatalog extends RelationshipUserSeason {
  season: RelationshipSeasonCatalog;
}

/** Season suggestion based on KPI patterns */
export interface SeasonSuggestion {
  season: RelationshipSeasonCatalog;
  confidence: number; // 0-1
  reason: string;
}

// ============================================================================
// Table: relationship_season_signals
// ============================================================================

export interface SeasonSignal {
  id: string;
  user_id: string;
  season_id: string;
  signal_type: SignalType;
  confidence_score: number; // 0-1
  signal_data: Record<string, unknown>;
  detected_at: string;
  dismissed: boolean;
}

// ============================================================================
// Life Stage Options (for UI selectors)
// ============================================================================

export const LIFE_STAGE_OPTIONS: { value: LifeStage; label: string }[] = [
  { value: 'early_marriage', label: 'Early Marriage (0-3 years)' },
  { value: 'young_family', label: 'Young Family (kids under 12)' },
  { value: 'established_family', label: 'Established Family (teens)' },
  { value: 'midlife', label: 'Midlife' },
  { value: 'empty_nest', label: 'Empty Nest' },
  { value: 'retirement', label: 'Retirement' },
  { value: 'any', label: 'Any / Not Sure' },
];
