// ============================================================================
// RELATIONAL PROFILE SERVICE
// Persistent user relationship profile that enriches every RAG query.
// The profile accumulates context over sessions - attachment style, patterns,
// triggers, strengths, framework preferences - so the system "remembers" you.
//
// Usage:
//   const profile = await getOrCreateProfile(userId);
//   const enriched = await enrichProfileFromMessage(userId, message, triage);
//   const ragProfile = getProfileForRAG(profile);
// ============================================================================

import { supabase } from '@/integrations/supabase/client';
import type { TriageDecision } from './relational-triage-service';
import type { FrameworkDomain, IssueType, LifeStage } from './relational-metadata-maps';

// ============================================================================
// TYPES
// ============================================================================

export interface RelationalProfile {
  id: string;
  user_id: string;

  // Attachment patterns
  attachment_style: AttachmentStyle;
  partner_attachment_style: PartnerAttachmentStyle;
  primary_pattern: RelationalPattern;

  // Relationship context
  relationship_season: string | null;
  life_stage: LifeStage;
  relationship_type: string[];

  // Detected patterns (accumulated)
  key_issues: string[];
  contraindications: string[];
  cultural_context: string[];
  triggers: string[];
  strengths: string[];
  growth_edges: string[];

  // Framework preferences (learned)
  frameworks_that_resonate: string[];
  frameworks_that_dont: string[];

  // Emotional baseline
  emotional_baseline: Record<string, unknown>;
  readiness_stage: ReadinessStage;

  // Partner
  partner_joined: boolean;
  partner_profile_id: string | null;

  // Progress
  vertex_score_current: number | null;
  vertex_score_trend: 'improving' | 'stable' | 'declining';
  sessions_completed: number;
  last_session_at: string | null;
  profile_completeness: number;

  created_at: string;
  updated_at: string;
}

export type AttachmentStyle =
  | 'secure'
  | 'anxious_preoccupied'
  | 'dismissive_avoidant'
  | 'fearful_avoidant'
  | 'unassessed';

export type PartnerAttachmentStyle = AttachmentStyle | 'unknown';

export type RelationalPattern =
  | 'pursuer_withdrawer'
  | 'withdrawer_withdrawer'
  | 'pursuer_pursuer'
  | 'volatile'
  | 'validating'
  | 'avoidant'
  | 'unassessed';

export type ReadinessStage =
  | 'precontemplation'
  | 'contemplation'
  | 'preparation'
  | 'action'
  | 'maintenance';

export interface RAGProfileContext {
  attachment_style: AttachmentStyle;
  partner_attachment_style: PartnerAttachmentStyle;
  primary_pattern: RelationalPattern;
  life_stage: LifeStage;
  key_issues: IssueType[];
  contraindications: string[];
  cultural_flags: string[];
  readiness_stage: ReadinessStage;
  frameworks_preferred: string[];
  frameworks_avoided: string[];
  known_triggers: string[];
  sessions_completed: number;
  profile_completeness: number;
}

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Get existing profile or create a new one for the user.
 */
export async function getOrCreateProfile(userId: string): Promise<RelationalProfile> {
  // Try to fetch existing
  const { data: existing, error: fetchError } = await supabase
    .from('mio_relational_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (fetchError) {
    console.error('Error fetching relational profile:', fetchError);
    throw new Error(`Profile fetch failed: ${fetchError.message}`);
  }

  if (existing) {
    return existing as RelationalProfile;
  }

  // Create new profile
  const { data: created, error: createError } = await supabase
    .from('mio_relational_profiles')
    .insert({ user_id: userId })
    .select('*')
    .single();

  if (createError) {
    console.error('Error creating relational profile:', createError);
    throw new Error(`Profile creation failed: ${createError.message}`);
  }

  return created as RelationalProfile;
}

/**
 * Update specific fields on a user's relational profile.
 */
export async function updateProfile(
  userId: string,
  updates: Partial<Omit<RelationalProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>,
): Promise<RelationalProfile> {
  const { data, error } = await supabase
    .from('mio_relational_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating relational profile:', error);
    throw new Error(`Profile update failed: ${error.message}`);
  }

  return data as RelationalProfile;
}

/**
 * Enrich a user's profile based on a message and its triage results.
 * Accumulates new issues, frameworks, and patterns without overwriting existing data.
 */
export async function enrichProfileFromMessage(
  userId: string,
  _message: string,
  triageDecision: TriageDecision,
): Promise<RelationalProfile> {
  const profile = await getOrCreateProfile(userId);

  const updates: Partial<RelationalProfile> = {};
  let changed = false;

  // Accumulate new issues (don't duplicate)
  if (triageDecision.recommended_domains.length > 0) {
    const newIssues = [...new Set([
      ...profile.key_issues,
      ...triageDecision.keyword_triage.matched_keywords.map(k => k.category),
    ])];
    if (newIssues.length > profile.key_issues.length) {
      updates.key_issues = newIssues;
      changed = true;
    }
  }

  // Accumulate contraindications
  if (triageDecision.active_contraindications.length > 0) {
    const newContraindications = [...new Set([
      ...profile.contraindications,
      ...triageDecision.active_contraindications,
    ])];
    if (newContraindications.length > profile.contraindications.length) {
      updates.contraindications = newContraindications;
      changed = true;
    }
  }

  // Track recommended frameworks (builds resonance data over time)
  if (triageDecision.recommended_frameworks.length > 0) {
    const newFrameworks = [...new Set([
      ...profile.frameworks_that_resonate,
      ...triageDecision.recommended_frameworks,
    ])];
    if (newFrameworks.length > profile.frameworks_that_resonate.length) {
      updates.frameworks_that_resonate = newFrameworks;
      changed = true;
    }
  }

  // Detect readiness shifts
  const readinessFromTriage = detectReadinessFromTriage(triageDecision);
  if (readinessFromTriage && readinessFromTriage !== profile.readiness_stage) {
    updates.readiness_stage = readinessFromTriage;
    changed = true;
  }

  // Update session tracking
  updates.last_session_at = new Date().toISOString();

  // Recalculate profile completeness
  updates.profile_completeness = calculateCompleteness({
    ...profile,
    ...updates,
  } as RelationalProfile);

  if (changed || updates.last_session_at) {
    return updateProfile(userId, updates);
  }

  return profile;
}

/**
 * Get profile data optimized for RAG search parameters.
 * This is what gets injected into the search pipeline.
 */
export function getProfileForRAG(profile: RelationalProfile): RAGProfileContext {
  return {
    attachment_style: profile.attachment_style,
    partner_attachment_style: profile.partner_attachment_style,
    primary_pattern: profile.primary_pattern,
    life_stage: profile.life_stage as LifeStage,
    key_issues: profile.key_issues as IssueType[],
    contraindications: profile.contraindications,
    cultural_flags: profile.cultural_context,
    readiness_stage: profile.readiness_stage,
    frameworks_preferred: profile.frameworks_that_resonate,
    frameworks_avoided: profile.frameworks_that_dont,
    known_triggers: profile.triggers,
    sessions_completed: profile.sessions_completed,
    profile_completeness: profile.profile_completeness,
  };
}

/**
 * Increment session counter. Call at end of conversation.
 */
export async function incrementSessionCount(userId: string): Promise<void> {
  const profile = await getOrCreateProfile(userId);
  await updateProfile(userId, {
    sessions_completed: profile.sessions_completed + 1,
    last_session_at: new Date().toISOString(),
  });
}

/**
 * Record that a user resonated with or dismissed a specific framework.
 */
export async function recordFrameworkPreference(
  userId: string,
  frameworkName: string,
  resonated: boolean,
): Promise<void> {
  const profile = await getOrCreateProfile(userId);

  if (resonated) {
    const updated = [...new Set([...profile.frameworks_that_resonate, frameworkName])];
    // Remove from "don't" list if it was there
    const cleaned = profile.frameworks_that_dont.filter(f => f !== frameworkName);
    await updateProfile(userId, {
      frameworks_that_resonate: updated,
      frameworks_that_dont: cleaned,
    });
  } else {
    const updated = [...new Set([...profile.frameworks_that_dont, frameworkName])];
    const cleaned = profile.frameworks_that_resonate.filter(f => f !== frameworkName);
    await updateProfile(userId, {
      frameworks_that_dont: updated,
      frameworks_that_resonate: cleaned,
    });
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function detectReadinessFromTriage(triage: TriageDecision): ReadinessStage | null {
  // High confidence + green triage + multiple frameworks = action stage
  if (triage.confidence > 0.8 && triage.triage_color === 'green') {
    return 'action';
  }

  // Yellow triage = preparation (aware of issues, starting to work)
  if (triage.triage_color === 'yellow') {
    return 'preparation';
  }

  // Crisis/orange = contemplation (forced awareness)
  if (triage.triage_color === 'orange' || triage.triage_color === 'red') {
    return 'contemplation';
  }

  return null;
}

function calculateCompleteness(profile: RelationalProfile): number {
  let score = 0;
  const fields = [
    { check: profile.attachment_style !== 'unassessed', weight: 0.15 },
    { check: profile.partner_attachment_style !== 'unknown', weight: 0.10 },
    { check: profile.primary_pattern !== 'unassessed', weight: 0.10 },
    { check: profile.life_stage !== 'established', weight: 0.05 }, // Non-default
    { check: profile.key_issues.length > 0, weight: 0.10 },
    { check: profile.cultural_context.length > 0, weight: 0.05 },
    { check: profile.triggers.length > 0, weight: 0.10 },
    { check: profile.strengths.length > 0, weight: 0.10 },
    { check: profile.growth_edges.length > 0, weight: 0.05 },
    { check: profile.frameworks_that_resonate.length > 0, weight: 0.05 },
    { check: profile.readiness_stage !== 'contemplation', weight: 0.05 }, // Non-default
    { check: profile.sessions_completed >= 3, weight: 0.05 },
    { check: profile.sessions_completed >= 7, weight: 0.05 },
  ];

  for (const field of fields) {
    if (field.check) score += field.weight;
  }

  return Math.min(score, 1.0);
}
