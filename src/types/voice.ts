// ============================================================================
// VOICE CONTEXT TYPES
// Types for GHL Voice AI context injection
// ============================================================================

import type { JourneyPhase } from '@/hooks/useJourneyContext';

/**
 * Full payload for syncing user context to GHL Voice AI
 * This data gets written to GHL contact custom fields so Voice AI can access it
 */
export interface VoiceContextPayload {
  // Tier 1: Core Identity (REQUIRED)
  greeting_name: string;         // e.g., "Hi Keston!" - personalized greeting
  first_name: string;            // e.g., "Keston"
  tier_level: string;            // "foundation" | "premium" | "elite"

  // Tier 2: Journey Progress (REQUIRED)
  journey_day: number;           // 1-90 (current day in program)
  journey_week: number;          // 1-12 (current week)
  journey_phase: JourneyPhase;   // "foundation" | "building" | "launching" | "operating"
  tactics_completed: number;     // Number of completed tactics
  total_tactics: number;         // Total tactics available
  completion_rate: number;       // Percentage (0-100)

  // Tier 3: Assessment Context (REQUIRED)
  readiness_level: string;       // "foundation_building" | "intermediate" | "advanced" | "ready"
  assessment_score: number;      // 0-100
  target_state: string | null;   // e.g., "CA", "TX", "FL"
  target_demographics: string;   // Joined array: "Elderly, Disabled"
  ownership_model: string;       // "rental_arbitrage" | "ownership" | "hybrid"
  immediate_priority: string;    // User's immediate priority focus

  // Tier 4: Business Context (RECOMMENDED)
  capital_available: string;     // "less-5k" | "5k-25k" | "25k-50k" | "50k-100k" | "100k+"
  licensing_familiarity: string; // "not-familiar" | "somewhat" | "very-familiar"
  caregiving_experience: string; // "no-experience" | "some" | "extensive"
  timeline: string;              // "3-months" | "6-months" | "within-year" | "flexible"

  // Formatted context for agent prompt (compound field)
  context_for_agent: string;     // Full text block for Voice AI system prompt

  // Metadata
  synced_at: string;             // ISO timestamp of last sync
}

/**
 * GHL custom field mapping for Voice AI
 * Maps VoiceContextPayload fields to GHL custom field keys
 */
export const GHL_VOICE_CUSTOM_FIELDS = {
  greeting_name: 'greeting_name',
  tier_level: 'tier_level',
  journey_day: 'journey_day',
  journey_week: 'journey_week',
  journey_phase: 'journey_phase',
  tactics_completed: 'tactics_completed',
  completion_rate: 'completion_rate',
  readiness_level: 'readiness_level',
  assessment_score: 'assessment_score',
  target_state: 'target_state',
  target_demographics: 'target_demographics',
  ownership_model: 'ownership_model',
  immediate_priority: 'immediate_priority',
  capital_available: 'capital_available',
  licensing_familiarity: 'licensing_familiarity',
  caregiving_experience: 'caregiving_experience',
  timeline: 'timeline',
  context_for_agent: 'user_context',
  synced_at: 'voice_context_synced_at',
} as const;

/**
 * Response from voice context sync operation
 */
export interface VoiceContextSyncResponse {
  success: boolean;
  message: string;
  context?: VoiceContextPayload;
  error?: string;
  ghl_contact_updated?: boolean;
}

/**
 * Minimal user profile data needed for voice context
 */
export interface VoiceUserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  tier_level: string | null;
  current_journey_day: number | null;
  ghl_contact_id: string | null;
  verified_phone: string | null;
}

/**
 * Default values for voice context when data is unavailable
 */
export const VOICE_CONTEXT_DEFAULTS: Partial<VoiceContextPayload> = {
  greeting_name: 'Hey there',
  tier_level: 'foundation',
  journey_day: 1,
  journey_week: 1,
  journey_phase: 'foundation',
  tactics_completed: 0,
  total_tactics: 48,
  completion_rate: 0,
  readiness_level: 'foundation_building',
  assessment_score: 0,
  target_state: null,
  target_demographics: 'Not specified',
  ownership_model: 'not_decided',
  immediate_priority: 'Not specified',
  capital_available: 'not_specified',
  licensing_familiarity: 'not-familiar',
  caregiving_experience: 'no-experience',
  timeline: 'flexible',
};
