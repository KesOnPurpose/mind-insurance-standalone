/**
 * GHL Tag Service
 *
 * Manages GoHighLevel contact tags for MIO users to enable:
 * - Lifecycle tracking (onboarding → active → champion)
 * - Engagement segmentation (high-risk, celebrations)
 * - Pattern-based targeting (Past Prison, Success Sabotage, Compass Crisis)
 *
 * Tag Strategy:
 * - Tags are additive (we add milestones, rarely remove)
 * - High-risk tag is removed when user re-engages
 * - Pattern tags persist for content personalization
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

// Valid MIO lifecycle tags
export type MioTag =
  // Lifecycle
  | 'mind-insurance'
  | 'app-signup'
  | 'mio-onboarding-started'
  | 'mio-onboarding-complete'
  | 'mio-protocol-active'
  | 'mio-protocol-complete'
  | 'mio-sms-opted-in'
  | 'mio-push-enabled'
  // Engagement
  | 'mio-high-risk-dropout'
  | 'mio-day3-celebration'
  | 'mio-7day-champion'
  // Patterns
  | 'mio-pattern-past-prison'
  | 'mio-pattern-success-sabotage'
  | 'mio-pattern-compass-crisis';

interface TagUpdateResult {
  success: boolean;
  contact_id?: string;
  current_tags?: string[];
  error?: string;
}

// ============================================================================
// TAG UPDATE FUNCTION
// ============================================================================

/**
 * Add or remove tags from a user's GHL contact
 */
export async function updateGhlTags(
  userId: string,
  addTags: MioTag[] = [],
  removeTags: MioTag[] = []
): Promise<TagUpdateResult> {
  try {
    const { data, error } = await supabase.functions.invoke('update-ghl-tags', {
      body: {
        user_id: userId,
        add_tags: addTags,
        remove_tags: removeTags
      }
    });

    if (error) {
      console.error('[GHL Tags] Error:', error);
      return { success: false, error: error.message };
    }

    return data as TagUpdateResult;
  } catch (error) {
    console.error('[GHL Tags] Exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// ============================================================================
// LIFECYCLE TAG HELPERS
// ============================================================================

/**
 * Mark user as having completed onboarding (assessment + avatar)
 */
export async function tagOnboardingComplete(userId: string): Promise<TagUpdateResult> {
  return updateGhlTags(
    userId,
    ['mio-onboarding-complete'],
    ['mio-onboarding-started'] // Remove started tag
  );
}

/**
 * Mark user as having started first protocol
 */
export async function tagProtocolActive(userId: string): Promise<TagUpdateResult> {
  return updateGhlTags(userId, ['mio-protocol-active']);
}

/**
 * Mark user as having completed a protocol
 */
export async function tagProtocolComplete(userId: string): Promise<TagUpdateResult> {
  return updateGhlTags(
    userId,
    ['mio-protocol-complete', 'mio-7day-champion'],
    ['mio-protocol-active', 'mio-high-risk-dropout'] // Clear risk tags
  );
}

/**
 * Mark user as high-risk for dropout
 */
export async function tagHighRiskDropout(userId: string): Promise<TagUpdateResult> {
  return updateGhlTags(userId, ['mio-high-risk-dropout']);
}

/**
 * Remove high-risk tag when user re-engages
 */
export async function clearHighRiskTag(userId: string): Promise<TagUpdateResult> {
  return updateGhlTags(userId, [], ['mio-high-risk-dropout']);
}

/**
 * Mark Day 3 celebration milestone
 */
export async function tagDay3Celebration(userId: string): Promise<TagUpdateResult> {
  return updateGhlTags(
    userId,
    ['mio-day3-celebration'],
    ['mio-high-risk-dropout'] // Clear risk tag on celebration
  );
}

/**
 * Mark user as having enabled push notifications
 */
export async function tagPushEnabled(userId: string): Promise<TagUpdateResult> {
  return updateGhlTags(userId, ['mio-push-enabled']);
}

/**
 * Add pattern tag based on assessment result
 */
export async function tagPattern(
  userId: string,
  pattern: 'past-prison' | 'success-sabotage' | 'compass-crisis'
): Promise<TagUpdateResult> {
  const tagMap: Record<string, MioTag> = {
    'past-prison': 'mio-pattern-past-prison',
    'success-sabotage': 'mio-pattern-success-sabotage',
    'compass-crisis': 'mio-pattern-compass-crisis'
  };

  return updateGhlTags(userId, [tagMap[pattern]]);
}

// ============================================================================
// EXPORT
// ============================================================================

export default {
  updateGhlTags,
  tagOnboardingComplete,
  tagProtocolActive,
  tagProtocolComplete,
  tagHighRiskDropout,
  clearHighRiskTag,
  tagDay3Celebration,
  tagPushEnabled,
  tagPattern
};
