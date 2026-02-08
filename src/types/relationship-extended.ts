/**
 * RIE Phases 3–6: Extended Feature Types
 * Solo User Protocol, Safe Space, Learning Hub, Date Nights, Journal.
 *
 * Maps to: relationship_solo_profiles, relationship_safe_space_sessions,
 *          relationship_learning_modules, relationship_learning_progress,
 *          relationship_date_nights, relationship_journal_entries
 */

import type { RelationshipKPIName } from './relationship-kpis';
import type { PartnerResistanceType } from './relationship-user-profile';

// ============================================================================
// Phase 3: Solo User Protocol
// ============================================================================

export interface RelationshipSoloProfile {
  id: string;
  user_id: string;
  resistance_type: PartnerResistanceType | null;
  solo_stage: number; // 1-5
  self_assessment_mode: boolean;
  softening_campaign_active: boolean;
  softening_campaign_started_at: string | null;
  partner_engagement_signals: PartnerEngagementSignal[];
  created_at: string;
  updated_at: string;
}

export interface SoloProfileInsert {
  resistance_type?: PartnerResistanceType | null;
  solo_stage?: number;
  self_assessment_mode?: boolean;
}

export interface SoloProfileUpdate {
  resistance_type?: PartnerResistanceType | null;
  solo_stage?: number;
  self_assessment_mode?: boolean;
  softening_campaign_active?: boolean;
  softening_campaign_started_at?: string | null;
  partner_engagement_signals?: PartnerEngagementSignal[];
}

export interface PartnerEngagementSignal {
  signal_type: string;
  description: string;
  detected_at: string;
}

// ============================================================================
// Phase 4: Safe Space Conversations
// ============================================================================

export type SafeSpaceCategory =
  | 'conflict_resolution'
  | 'emotional_check_in'
  | 'future_planning'
  | 'boundary_setting'
  | 'appreciation'
  | 'general';

export type SafeSpaceStatus = 'active' | 'paused' | 'completed' | 'abandoned';

export interface RelationshipSafeSpaceSession {
  id: string;
  partnership_id: string;
  initiated_by: string;
  topic: string;
  category: SafeSpaceCategory;
  status: SafeSpaceStatus;
  prompts_used: string[];
  outcome_summary: string | null;
  related_kpis: RelationshipKPIName[];
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

export interface SafeSpaceSessionInsert {
  partnership_id: string;
  topic: string;
  category?: SafeSpaceCategory;
  prompts_used?: string[];
  related_kpis?: RelationshipKPIName[];
}

export interface SafeSpaceSessionUpdate {
  status?: SafeSpaceStatus;
  prompts_used?: string[];
  outcome_summary?: string | null;
  related_kpis?: RelationshipKPIName[];
  completed_at?: string | null;
}

// ============================================================================
// Phase 5: Learning Hub
// ============================================================================

export type LearningCategory =
  | 'communication' | 'intimacy' | 'conflict' | 'finance'
  | 'parenting' | 'self_care' | 'trust' | 'fun';

export type LearningDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type LearningStatus = 'not_started' | 'in_progress' | 'completed';

export interface RelationshipLearningModule {
  id: string;
  title: string;
  description: string | null;
  category: LearningCategory;
  target_kpis: RelationshipKPIName[];
  content_blocks: LearningContentBlock[];
  difficulty: LearningDifficulty;
  estimated_minutes: number;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LearningContentBlock {
  type: 'text' | 'video' | 'exercise' | 'quiz' | 'reflection';
  title: string;
  content: string;
  order: number;
}

export interface RelationshipLearningProgress {
  id: string;
  user_id: string;
  module_id: string;
  status: LearningStatus;
  progress_percent: number;
  completed_at: string | null;
  time_spent_minutes: number;
  rating: number | null;
  created_at: string;
  updated_at: string;
}

export interface LearningProgressInsert {
  module_id: string;
  status?: LearningStatus;
  progress_percent?: number;
}

export interface LearningProgressUpdate {
  status?: LearningStatus;
  progress_percent?: number;
  completed_at?: string | null;
  time_spent_minutes?: number;
  rating?: number | null;
}

/** Module with the user's progress joined */
export interface LearningModuleWithProgress extends RelationshipLearningModule {
  progress: RelationshipLearningProgress | null;
}

// ============================================================================
// Phase 6: Date Night Generator
// ============================================================================

export type DateNightCategory =
  | 'romantic' | 'adventure' | 'relaxation' | 'creative'
  | 'intellectual' | 'spiritual' | 'physical' | 'social';

export type DateNightBudget = 'free' | 'low' | 'medium' | 'high';

export type DateNightStatus = 'suggested' | 'planned' | 'completed' | 'skipped';

export interface RelationshipDateNight {
  id: string;
  user_id: string;
  partnership_id: string | null;
  title: string;
  description: string | null;
  category: DateNightCategory;
  target_kpis: RelationshipKPIName[];
  budget_range: DateNightBudget;
  status: DateNightStatus;
  scheduled_for: string | null;
  enjoyment_rating: number | null;
  feedback_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DateNightInsert {
  partnership_id?: string | null;
  title: string;
  description?: string | null;
  category?: DateNightCategory;
  target_kpis?: RelationshipKPIName[];
  budget_range?: DateNightBudget;
  scheduled_for?: string | null;
}

export interface DateNightUpdate {
  title?: string;
  description?: string | null;
  category?: DateNightCategory;
  target_kpis?: RelationshipKPIName[];
  budget_range?: DateNightBudget;
  status?: DateNightStatus;
  scheduled_for?: string | null;
  enjoyment_rating?: number | null;
  feedback_notes?: string | null;
}

// ============================================================================
// Phase 6: Relationship Journal
// ============================================================================

export type JournalEntryType =
  | 'reflection' | 'gratitude' | 'goal' | 'milestone' | 'conflict_log' | 'shared';

export interface RelationshipJournalEntry {
  id: string;
  user_id: string;
  partnership_id: string | null;
  entry_type: JournalEntryType;
  title: string | null;
  content: string;
  mood_rating: number | null;
  related_kpis: RelationshipKPIName[];
  is_private: boolean;
  shared_with_partner: boolean;
  prompt_used: string | null;
  created_at: string;
  updated_at: string;
}

export interface JournalEntryInsert {
  partnership_id?: string | null;
  entry_type?: JournalEntryType;
  title?: string | null;
  content: string;
  mood_rating?: number | null;
  related_kpis?: RelationshipKPIName[];
  is_private?: boolean;
  shared_with_partner?: boolean;
  prompt_used?: string | null;
}

export interface JournalEntryUpdate {
  entry_type?: JournalEntryType;
  title?: string | null;
  content?: string;
  mood_rating?: number | null;
  related_kpis?: RelationshipKPIName[];
  is_private?: boolean;
  shared_with_partner?: boolean;
}
