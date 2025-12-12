/**
 * Section Completion Service
 *
 * Handles detection of section completion and triggers MIO feedback.
 * Sections:
 * - PRO (Champion Setup): P, R, O practices (3 AM - 10 AM)
 * - TE (NASCAR Pit Stop): T, E practices (10 AM - 3 PM)
 * - CT (Victory Lap): C, T2 practices (3 PM - 10 PM)
 */

import { supabase } from "@/integrations/supabase/client";
import {
  SectionType,
  SECTION_PRACTICES,
  SECTION_NAMES,
  getSectionFromPracticeType
} from "@/types/mio-insights";
import { getSafeTodayDate, getSafeCurrentHour } from "@/utils/safeDateUtils";

// ============================================================================
// TYPES
// ============================================================================

export interface SectionCompletionStatus {
  section: SectionType;
  practicesRequired: readonly string[];
  practicesCompleted: string[];
  isComplete: boolean;
  completionPercentage: number;
}

export interface DailyCompletionStatus {
  date: string;
  sections: Record<SectionType, SectionCompletionStatus>;
  totalPracticesCompleted: number;
  totalPracticesRequired: number;
  isComplete: boolean;
}

export interface TriggerFeedbackResult {
  success: boolean;
  feedbackTriggered: boolean;
  section?: SectionType;
  error?: string;
  // Data from edge function response for banner display
  insightPreview?: string;
  rewardTier?: 'standard' | 'bonus_insight' | 'pattern_breakthrough';
}

// ============================================================================
// SECTION COMPLETION DETECTION
// ============================================================================

/**
 * Get the completion status for a specific section on a given date
 */
export async function getSectionCompletionStatus(
  userId: string,
  section: SectionType,
  practiceDate: string
): Promise<SectionCompletionStatus> {
  const practicesRequired = SECTION_PRACTICES[section];

  // Fetch completed practices for this section on this date
  const { data: completedPractices, error } = await supabase
    .from('daily_practices')
    .select('practice_type')
    .eq('user_id', userId)
    .eq('practice_date', practiceDate)
    .eq('completed', true)
    .in('practice_type', [...practicesRequired]);

  if (error) {
    console.error('[SectionCompletion] Error fetching practices:', error);
    return {
      section,
      practicesRequired,
      practicesCompleted: [],
      isComplete: false,
      completionPercentage: 0
    };
  }

  const practicesCompleted = (completedPractices || []).map(p => p.practice_type);
  const isComplete = practicesRequired.every(p => practicesCompleted.includes(p));
  const completionPercentage = (practicesCompleted.length / practicesRequired.length) * 100;

  return {
    section,
    practicesRequired,
    practicesCompleted,
    isComplete,
    completionPercentage
  };
}

/**
 * Get the completion status for all sections on a given date
 */
export async function getDailyCompletionStatus(
  userId: string,
  practiceDate: string
): Promise<DailyCompletionStatus> {
  const [proStatus, teStatus, ctStatus] = await Promise.all([
    getSectionCompletionStatus(userId, 'PRO', practiceDate),
    getSectionCompletionStatus(userId, 'TE', practiceDate),
    getSectionCompletionStatus(userId, 'CT', practiceDate)
  ]);

  const sections: Record<SectionType, SectionCompletionStatus> = {
    PRO: proStatus,
    TE: teStatus,
    CT: ctStatus
  };

  const totalPracticesCompleted =
    proStatus.practicesCompleted.length +
    teStatus.practicesCompleted.length +
    ctStatus.practicesCompleted.length;

  const totalPracticesRequired = 7; // P, R, O, T, E, C, T2

  const isComplete = proStatus.isComplete && teStatus.isComplete && ctStatus.isComplete;

  return {
    date: practiceDate,
    sections,
    totalPracticesCompleted,
    totalPracticesRequired,
    isComplete
  };
}

// ============================================================================
// FEEDBACK TRIGGER
// ============================================================================

/**
 * Check if completing this practice completes a section, and trigger feedback if so
 *
 * This should be called after a practice is saved/completed.
 * It checks if the section is now complete and triggers MIO feedback.
 */
export async function checkAndTriggerSectionFeedback(
  userId: string,
  practiceType: string,
  practiceDate: string
): Promise<TriggerFeedbackResult> {
  try {
    // Determine which section this practice belongs to
    const section = getSectionFromPracticeType(practiceType);

    if (!section) {
      console.log('[SectionCompletion] Unknown practice type:', practiceType);
      return { success: true, feedbackTriggered: false };
    }

    // Check if this section is now complete
    const sectionStatus = await getSectionCompletionStatus(userId, section, practiceDate);

    if (!sectionStatus.isComplete) {
      console.log('[SectionCompletion] Section not yet complete:', {
        section,
        completed: sectionStatus.practicesCompleted,
        required: sectionStatus.practicesRequired
      });
      return { success: true, feedbackTriggered: false };
    }

    // Check if we've already sent feedback for this section today
    const alreadySent = await hasFeedbackBeenSent(userId, section, practiceDate);

    if (alreadySent) {
      console.log('[SectionCompletion] Feedback already sent for this section today');
      return { success: true, feedbackTriggered: false };
    }

    // Trigger MIO section feedback
    console.log('[SectionCompletion] Triggering MIO feedback for section:', section);

    const { data, error } = await supabase.functions.invoke('mio-section-feedback', {
      body: {
        user_id: userId,
        section: section,
        practice_date: practiceDate
      }
    });

    if (error) {
      console.error('[SectionCompletion] Error triggering feedback:', error);
      return { success: false, feedbackTriggered: false, error: error.message };
    }

    console.log('[SectionCompletion] Feedback triggered successfully:', data);

    // Extract insight preview and reward tier from edge function response
    const insightPreview = data?.feedback?.substring(0, 80) || 'MIO has analyzed your practices...';
    const rewardTier = data?.reward_tier || 'standard';

    return {
      success: true,
      feedbackTriggered: true,
      section,
      insightPreview,
      rewardTier
    };

  } catch (err) {
    console.error('[SectionCompletion] Unexpected error:', err);
    return {
      success: false,
      feedbackTriggered: false,
      error: err instanceof Error ? err.message : 'Unknown error'
    };
  }
}

/**
 * Check if feedback has already been sent for a section today
 */
async function hasFeedbackBeenSent(
  userId: string,
  section: SectionType,
  practiceDate: string
): Promise<boolean> {
  // Check mio_insights_messages for a message with this section_type today
  const { data, error } = await supabase
    .from('mio_insights_messages')
    .select('id')
    .eq('user_id', userId)
    .eq('section_type', section)
    .eq('role', 'mio')
    .gte('created_at', `${practiceDate}T00:00:00`)
    .lt('created_at', `${practiceDate}T23:59:59`)
    .limit(1);

  if (error) {
    console.error('[SectionCompletion] Error checking feedback status:', error);
    return false; // Assume not sent on error to allow retry
  }

  return (data || []).length > 0;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get the current practice date in YYYY-MM-DD format
 * Uses Safari-safe date utility
 */
export function getCurrentPracticeDate(timezone: string = 'America/Los_Angeles'): string {
  return getSafeTodayDate(timezone);
}

/**
 * Get the section name for display
 */
export function getSectionName(section: SectionType): string {
  return SECTION_NAMES[section];
}

/**
 * Check if current time is within a section's window
 * Uses Safari-safe hour utility
 */
export function isWithinSectionWindow(
  section: SectionType,
  timezone: string = 'America/Los_Angeles'
): boolean {
  const currentHour = getSafeCurrentHour(timezone);

  const windows: Record<SectionType, { start: number; end: number }> = {
    PRO: { start: 3, end: 10 },   // 3 AM - 10 AM
    TE: { start: 10, end: 15 },   // 10 AM - 3 PM
    CT: { start: 15, end: 22 }    // 3 PM - 10 PM
  };

  const window = windows[section];
  return currentHour >= window.start && currentHour < window.end;
}

/**
 * Get the remaining practices needed to complete a section
 */
export function getRemainingPractices(status: SectionCompletionStatus): string[] {
  return status.practicesRequired.filter(
    p => !status.practicesCompleted.includes(p)
  );
}
