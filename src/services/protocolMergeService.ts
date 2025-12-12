/**
 * Protocol Merge Service
 * Handles intelligent protocol enrichment based on assessment results
 *
 * Core Principle: ENRICH current protocol, never queue or restart
 * - Max 1 supplementary micro-practice per remaining day
 * - Micro-practices must be 2-5 minutes max
 * - Frame as "Bonus Insight Practice" (optional feel)
 */

import { supabase } from '@/integrations/supabase/client';
import type { MIOInsightDayTask, MIOInsightProtocolWithProgress } from '@/types/protocol';

// ============================================================================
// TYPES
// ============================================================================

export type WiringType = 'connector' | 'warrior' | 'sage' | 'builder';
export type CollisionPattern = 'past_prison' | 'success_sabotage' | 'compass_crisis';

export interface AssessmentContext {
  // Identity Collision results
  collisionPattern?: CollisionPattern;
  collisionConfidence?: number;
  impactArea?: string;

  // Inner Wiring results
  primaryWiring?: WiringType;
  secondaryWiring?: WiringType | null;
  wiringConfidence?: number;
}

export interface SupplementaryTask {
  day: number;
  title: string;
  micro_practice: string;
  duration_minutes: number;
  wiring_connection?: string;
  pattern_connection?: string;
}

export interface ProtocolMergeResult {
  action: 'create_new' | 'enrich_current' | 'no_action';
  supplementary_tasks?: SupplementaryTask[];
  enrichment_context?: string;
  error?: string;
}

// ============================================================================
// WIRING-SPECIFIC FRAMING
// ============================================================================

const WIRING_FRAMING: Record<WiringType, {
  task_intro: string;
  success_metric: string;
  recovery_style: string;
}> = {
  connector: {
    task_intro: 'Reach out to someone who energizes you and',
    success_metric: 'notice how connection restored your energy',
    recovery_style: 'through meaningful dialogue',
  },
  warrior: {
    task_intro: 'Challenge yourself to',
    success_metric: 'track your progress and beat yesterday',
    recovery_style: 'through physical action and quick wins',
  },
  sage: {
    task_intro: 'Reflect deeply on',
    success_metric: 'journal what patterns you noticed',
    recovery_style: 'through solitude and contemplation',
  },
  builder: {
    task_intro: 'Create a system for',
    success_metric: 'document the process for future use',
    recovery_style: 'through structured routine and tangible output',
  },
};

// ============================================================================
// PATTERN-SPECIFIC MICRO-PRACTICES
// ============================================================================

const PATTERN_MICRO_PRACTICES: Record<CollisionPattern, {
  practices: Array<{
    title: string;
    practice: string;
    duration: number;
  }>;
}> = {
  past_prison: {
    practices: [
      {
        title: 'Identity Statement Reset',
        practice: 'Write one sentence about who you are BECOMING, not where you came from. Read it aloud.',
        duration: 3,
      },
      {
        title: 'Permission Slip',
        practice: 'Write yourself permission to succeed without guilt. "I give myself permission to..."',
        duration: 2,
      },
      {
        title: 'Future Self Check-In',
        practice: 'Ask: "What would the version of me who already broke free do right now?"',
        duration: 3,
      },
    ],
  },
  success_sabotage: {
    practices: [
      {
        title: 'Pre-Commitment Anchor',
        practice: 'Before starting anything important, state: "I commit to seeing this through to [specific outcome]."',
        duration: 2,
      },
      {
        title: 'Success Safety Check',
        practice: 'Ask: "What am I afraid will happen if this actually works?" Write the honest answer.',
        duration: 4,
      },
      {
        title: 'Momentum Protection',
        practice: 'Identify your "quit signals" - what thoughts come up right before you pull back?',
        duration: 3,
      },
    ],
  },
  compass_crisis: {
    practices: [
      {
        title: 'North Star Moment',
        practice: 'Complete this: "Today, the one thing that matters most is..." Then do only that.',
        duration: 2,
      },
      {
        title: 'Decision Anchor',
        practice: 'For any choice today, ask: "Does this move me toward my ONE goal or away from it?"',
        duration: 3,
      },
      {
        title: 'Comparison Detox',
        practice: 'Notice when you compare yourself to others. Replace with: "Their path is not my path."',
        duration: 2,
      },
    ],
  },
};

// ============================================================================
// WIRING-SPECIFIC MICRO-PRACTICES
// ============================================================================

const WIRING_MICRO_PRACTICES: Record<WiringType, {
  practices: Array<{
    title: string;
    practice: string;
    duration: number;
  }>;
}> = {
  connector: {
    practices: [
      {
        title: 'Connection Spark',
        practice: 'Text or call one person who makes you feel energized. Share one win or ask how they are.',
        duration: 5,
      },
      {
        title: 'Gratitude Bridge',
        practice: 'Think of someone who helped you recently. Send them a quick thank you message.',
        duration: 3,
      },
    ],
  },
  warrior: {
    practices: [
      {
        title: 'Action Burst',
        practice: 'Set a 5-minute timer. Attack one task with full intensity. Stop when it rings.',
        duration: 5,
      },
      {
        title: 'Win Stack',
        practice: 'List 3 small wins from today. Even tiny ones count. Celebrate completing this list.',
        duration: 3,
      },
    ],
  },
  sage: {
    practices: [
      {
        title: 'Insight Capture',
        practice: 'Find 5 minutes of quiet. Write the ONE insight from today that feels most true.',
        duration: 5,
      },
      {
        title: 'Pattern Recognition',
        practice: 'Review your day. What repeated? What pattern is emerging?',
        duration: 4,
      },
    ],
  },
  builder: {
    practices: [
      {
        title: 'System Snapshot',
        practice: 'Document one process you did well today. Write 3 steps so you can repeat it.',
        duration: 5,
      },
      {
        title: 'Progress Marker',
        practice: 'Add a checkmark or note to track your streak. Visual progress = motivation.',
        duration: 2,
      },
    ],
  },
};

// ============================================================================
// MAIN MERGE FUNCTION
// ============================================================================

/**
 * Merge assessment results into the current active protocol
 * Returns supplementary tasks without disrupting the main protocol
 */
export async function mergeAssessmentWithProtocol(
  userId: string,
  assessmentContext: AssessmentContext,
  currentProtocol: MIOInsightProtocolWithProgress | null
): Promise<ProtocolMergeResult> {
  try {
    // If no active protocol, we'll queue insights for next protocol generation
    if (!currentProtocol) {
      // Save context to user_profiles for next protocol generation
      await saveAssessmentContextForFutureProtocol(userId, assessmentContext);

      return {
        action: 'no_action',
        enrichment_context: 'Assessment insights saved. Will inform your next personalized protocol.',
      };
    }

    // Calculate remaining days in the protocol
    const currentDay = currentProtocol.current_day || 1;
    const remainingDays = 7 - currentDay;

    // If only 0-1 days remaining, don't add enrichments (too late)
    if (remainingDays <= 1) {
      await saveAssessmentContextForFutureProtocol(userId, assessmentContext);

      return {
        action: 'no_action',
        enrichment_context: 'Assessment insights saved. Will inform your next personalized protocol (current one almost complete).',
      };
    }

    // Generate supplementary tasks based on assessment
    const supplementaryTasks = generateSupplementaryTasks(
      assessmentContext,
      currentDay,
      remainingDays
    );

    // Save enrichments to the protocol
    if (supplementaryTasks.length > 0) {
      await saveProtocolEnrichments(currentProtocol.id, supplementaryTasks, assessmentContext);
    }

    return {
      action: 'enrich_current',
      supplementary_tasks: supplementaryTasks,
      enrichment_context: buildEnrichmentMessage(assessmentContext, supplementaryTasks.length),
    };
  } catch (error) {
    console.error('[ProtocolMerge] Error:', error);
    return {
      action: 'no_action',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate supplementary micro-practices based on assessment results
 * Max 1 per remaining day, spread evenly
 */
function generateSupplementaryTasks(
  context: AssessmentContext,
  currentDay: number,
  remainingDays: number
): SupplementaryTask[] {
  const tasks: SupplementaryTask[] = [];

  // Collect available practices
  const availablePractices: Array<{
    title: string;
    practice: string;
    duration: number;
    connection: string;
  }> = [];

  // Add pattern-specific practices
  if (context.collisionPattern) {
    const patternPractices = PATTERN_MICRO_PRACTICES[context.collisionPattern];
    patternPractices.practices.forEach((p) => {
      availablePractices.push({
        ...p,
        connection: `pattern:${context.collisionPattern}`,
      });
    });
  }

  // Add wiring-specific practices
  if (context.primaryWiring) {
    const wiringPractices = WIRING_MICRO_PRACTICES[context.primaryWiring];
    wiringPractices.practices.forEach((p) => {
      availablePractices.push({
        ...p,
        connection: `wiring:${context.primaryWiring}`,
      });
    });
  }

  // Shuffle and select practices for remaining days
  const shuffled = availablePractices.sort(() => Math.random() - 0.5);

  // Spread practices across remaining days (max 1 per day, max 3 total to avoid overwhelm)
  const maxEnrichments = Math.min(remainingDays, 3, shuffled.length);
  const dayGap = Math.floor(remainingDays / maxEnrichments);

  for (let i = 0; i < maxEnrichments; i++) {
    const practice = shuffled[i];
    const assignedDay = currentDay + 1 + i * dayGap;

    if (assignedDay <= 7) {
      tasks.push({
        day: assignedDay,
        title: `Bonus: ${practice.title}`,
        micro_practice: practice.practice,
        duration_minutes: practice.duration,
        wiring_connection: practice.connection.startsWith('wiring:')
          ? practice.connection.replace('wiring:', '')
          : undefined,
        pattern_connection: practice.connection.startsWith('pattern:')
          ? practice.connection.replace('pattern:', '')
          : undefined,
      });
    }
  }

  return tasks;
}

/**
 * Save supplementary tasks to the protocol
 */
async function saveProtocolEnrichments(
  protocolId: string,
  supplementaryTasks: SupplementaryTask[],
  context: AssessmentContext
): Promise<void> {
  // Get current protocol data
  const { data: protocol, error: fetchError } = await supabase
    .from('mio_weekly_protocols')
    .select('day_tasks, source_context')
    .eq('id', protocolId)
    .single();

  if (fetchError || !protocol) {
    throw new Error('Failed to fetch protocol for enrichment');
  }

  // Add supplementary tasks to existing day_tasks
  const existingTasks = protocol.day_tasks as MIOInsightDayTask[];
  const enrichedTasks = existingTasks.map((task) => {
    const supplementary = supplementaryTasks.find((s) => s.day === task.day);
    if (supplementary) {
      return {
        ...task,
        supplementary_practice: {
          title: supplementary.title,
          micro_practice: supplementary.micro_practice,
          duration_minutes: supplementary.duration_minutes,
          wiring_connection: supplementary.wiring_connection,
          pattern_connection: supplementary.pattern_connection,
        },
      };
    }
    return task;
  });

  // Update protocol with enrichments
  const { error: updateError } = await supabase
    .from('mio_weekly_protocols')
    .update({
      day_tasks: enrichedTasks,
      source_context: {
        ...(protocol.source_context as Record<string, unknown> || {}),
        enriched_at: new Date().toISOString(),
        enrichment_source: 'assessment',
        enrichment_context: context,
      },
    })
    .eq('id', protocolId);

  if (updateError) {
    throw new Error('Failed to save protocol enrichments');
  }
}

/**
 * Save assessment context to user profile for future protocol generation
 */
async function saveAssessmentContextForFutureProtocol(
  userId: string,
  context: AssessmentContext
): Promise<void> {
  // This context will be used by n8n when generating the next protocol
  const { error } = await supabase
    .from('user_profiles')
    .update({
      last_assessment_context: context,
      last_assessment_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('[ProtocolMerge] Failed to save assessment context:', error);
  }
}

/**
 * Build user-friendly enrichment message
 */
function buildEnrichmentMessage(
  context: AssessmentContext,
  taskCount: number
): string {
  const parts: string[] = [];

  if (context.primaryWiring) {
    const wiringName = {
      connector: 'Connector',
      warrior: 'Warrior',
      sage: 'Sage',
      builder: 'Builder',
    }[context.primaryWiring];
    parts.push(`your ${wiringName} wiring`);
  }

  if (context.collisionPattern) {
    const patternName = {
      past_prison: 'Past Prison',
      success_sabotage: 'Success Sabotage',
      compass_crisis: 'Compass Crisis',
    }[context.collisionPattern];
    parts.push(`your ${patternName} pattern`);
  }

  if (parts.length === 0) {
    return `Added ${taskCount} bonus insight practice${taskCount > 1 ? 's' : ''} to your protocol.`;
  }

  return `Your protocol just got smarter! Added ${taskCount} bonus practice${taskCount > 1 ? 's' : ''} based on ${parts.join(' and ')}.`;
}

// ============================================================================
// UTILITY: GET WIRING FRAMING FOR TASK
// ============================================================================

/**
 * Get wiring-specific framing for a task
 * Used by protocol generation to personalize task language
 */
export function getWiringFramingForTask(
  wiring: WiringType,
  baseTask: string
): string {
  const framing = WIRING_FRAMING[wiring];

  // Simple prefix replacement for personalization
  return `${framing.task_intro} ${baseTask.toLowerCase()}. ${framing.success_metric}.`;
}

/**
 * Check if user has completed wiring assessment
 */
export async function hasCompletedWiringAssessment(
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('inner_wiring')
    .eq('id', userId)
    .single();

  if (error || !data) return false;
  return !!(data.inner_wiring as Record<string, unknown> | null)?.primary;
}

/**
 * Get user's assessment context for protocol generation
 */
export async function getUserAssessmentContext(
  userId: string
): Promise<AssessmentContext | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('collision_patterns, inner_wiring')
    .eq('id', userId)
    .single();

  if (error || !data) return null;

  const collision = data.collision_patterns as Record<string, unknown> | null;
  const wiring = data.inner_wiring as Record<string, unknown> | null;

  return {
    collisionPattern: collision?.primary_pattern as CollisionPattern | undefined,
    collisionConfidence: collision?.confidence as number | undefined,
    impactArea: collision?.impact_area as string | undefined,
    primaryWiring: wiring?.primary as WiringType | undefined,
    secondaryWiring: wiring?.secondary as WiringType | null | undefined,
    wiringConfidence: wiring?.confidence as number | undefined,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export const protocolMergeService = {
  mergeAssessmentWithProtocol,
  getWiringFramingForTask,
  hasCompletedWiringAssessment,
  getUserAssessmentContext,
  WIRING_FRAMING,
  PATTERN_MICRO_PRACTICES,
  WIRING_MICRO_PRACTICES,
};

export default protocolMergeService;
