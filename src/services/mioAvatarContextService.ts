/**
 * mioAvatarContextService
 *
 * Aggregates user's avatar data and practice insights for N8n protocol generation.
 * This service powers progressive personalization - as more user data is collected,
 * MIO's protocols become increasingly tailored to feel like "the most understood friend and coach."
 *
 * P6.5 - Identity Avatar User Journey Redesign
 */

import { supabase } from '@/integrations/supabase/client';
import { findMatchingAvatar } from './avatarAssignmentService';

// ============================================================================
// TYPES
// ============================================================================

export interface AvatarContext {
  avatar_name: string | null;
  pattern: string | null;
  pattern_display: string | null;
  sub_pattern: string | null;
  sub_pattern_secondary: string | null;
  wiring_primary: string | null;
  wiring_secondary: string | null;
  neural_rewiring_focus: string[];
  emergency_triggers: string[];
  is_complete: boolean;
}

export interface PracticeInsights {
  avg_completion_time: string | null;
  total_practices_completed: number;
  streak_count: number;
  protocols_completed: number;
  trigger_resets_this_week: number;
  best_practice_type: string | null;
  practice_response_breakdown: {
    yes_multiple: number;
    yes_once: number;
    tried: number;
    forgot: number;
  };
}

export interface PreviousProtocolContext {
  title: string | null;
  days_completed: number;
  days_skipped: number;
  completion_percentage: number;
  key_moments_captured: string[];
  breakthrough_detected: boolean;
}

export interface ProtocolGenerationContext {
  user_id: string;
  user_name: string | null;
  avatar_context: AvatarContext;
  practice_insights: PracticeInsights;
  previous_protocol: PreviousProtocolContext | null;
  assessments_completed: number;
  total_assessments: number;
}

// ============================================================================
// PATTERN DISPLAY MAPPING
// ============================================================================

const PATTERN_DISPLAY: Record<string, string> = {
  past_prison: 'Past Prison',
  success_sabotage: 'Success Sabotage',
  compass_crisis: 'Compass Crisis',
};

const WIRING_DISPLAY: Record<string, string> = {
  warrior: 'The Warrior',
  sage: 'The Sage',
  connector: 'The Connector',
  builder: 'The Builder',
};

// ============================================================================
// AVATAR CONTEXT
// ============================================================================

/**
 * Get user's avatar context from their assessment results
 */
export async function getAvatarContext(userId: string): Promise<AvatarContext> {
  const emptyContext: AvatarContext = {
    avatar_name: null,
    pattern: null,
    pattern_display: null,
    sub_pattern: null,
    sub_pattern_secondary: null,
    wiring_primary: null,
    wiring_secondary: null,
    neural_rewiring_focus: [],
    emergency_triggers: [],
    is_complete: false,
  };

  try {
    // Fetch all assessment data in parallel
    const [collisionResult, temperamentResult, subPatternResult] = await Promise.all([
      supabase
        .from('identity_collision_results')
        .select('primary_pattern, confidence')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single(),
      supabase
        .from('temperament_results')
        .select('primary_temperament, secondary_temperament')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single(),
      supabase
        .from('sub_pattern_results')
        .select('primary_sub_pattern, secondary_sub_pattern')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single(),
    ]);

    const collision = collisionResult.data;
    const temperament = temperamentResult.data;
    const subPattern = subPatternResult.data;

    // Build avatar context
    const context: AvatarContext = {
      ...emptyContext,
      pattern: collision?.primary_pattern || null,
      pattern_display: collision?.primary_pattern
        ? PATTERN_DISPLAY[collision.primary_pattern] || collision.primary_pattern
        : null,
      sub_pattern: subPattern?.primary_sub_pattern || null,
      sub_pattern_secondary: subPattern?.secondary_sub_pattern || null,
      wiring_primary: temperament?.primary_temperament || null,
      wiring_secondary: temperament?.secondary_temperament || null,
    };

    // Check if avatar is complete (all 3 assessments)
    context.is_complete = !!(collision?.primary_pattern && temperament?.primary_temperament && subPattern?.primary_sub_pattern);

    // If complete, look up the full avatar for neural rewiring data
    if (context.is_complete && context.pattern && context.sub_pattern && context.wiring_primary) {
      const matchedAvatar = findMatchingAvatar(
        context.pattern as 'past_prison' | 'success_sabotage' | 'compass_crisis',
        context.sub_pattern as Parameters<typeof findMatchingAvatar>[1],
        context.wiring_primary as 'warrior' | 'sage' | 'connector' | 'builder'
      );

      if (matchedAvatar) {
        context.avatar_name = matchedAvatar.name;
        context.neural_rewiring_focus = matchedAvatar.neuralRewiringProtocol.practices.map(p => p.name);
        context.emergency_triggers = [matchedAvatar.neuralRewiringProtocol.emergencyProtocol.trigger];
      }
    }

    return context;
  } catch (error) {
    console.error('[mioAvatarContextService] Error fetching avatar context:', error);
    return emptyContext;
  }
}

// ============================================================================
// PRACTICE INSIGHTS
// ============================================================================

/**
 * Analyze user's practice patterns from protocol completions
 */
export async function getPracticeInsights(userId: string): Promise<PracticeInsights> {
  const emptyInsights: PracticeInsights = {
    avg_completion_time: null,
    total_practices_completed: 0,
    streak_count: 0,
    protocols_completed: 0,
    trigger_resets_this_week: 0,
    best_practice_type: null,
    practice_response_breakdown: {
      yes_multiple: 0,
      yes_once: 0,
      tried: 0,
      forgot: 0,
    },
  };

  try {
    // Fetch practice data
    const [completionsResult, streakResult, protocolsResult, practicesResult] = await Promise.all([
      // Protocol day completions
      supabase
        .from('mio_protocol_completions')
        .select('completed_at, practice_response')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false }),
      // Streak data
      supabase
        .from('coverage_streaks')
        .select('current_streak')
        .eq('user_id', userId)
        .single(),
      // Completed protocols count
      supabase
        .from('mio_weekly_protocols')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'completed'),
      // Practice completions (from daily_practices table)
      supabase
        .from('daily_practices')
        .select('practice_type, completed_at')
        .eq('user_id', userId)
        .gte('completed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    ]);

    const completions = completionsResult.data || [];
    const streak = streakResult.data;
    const protocols = protocolsResult.data || [];
    const practices = practicesResult.data || [];

    // Calculate average completion time
    let avgTime = null;
    if (completions.length > 0) {
      const times = completions
        .filter(c => c.completed_at)
        .map(c => new Date(c.completed_at!).getHours());
      if (times.length > 0) {
        const avgHour = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
        avgTime = `${avgHour.toString().padStart(2, '0')}:00`;
      }
    }

    // Calculate practice response breakdown
    const breakdown = { yes_multiple: 0, yes_once: 0, tried: 0, forgot: 0 };
    completions.forEach(c => {
      if (c.practice_response && Object.prototype.hasOwnProperty.call(breakdown, c.practice_response)) {
        breakdown[c.practice_response as keyof typeof breakdown]++;
      }
    });

    // Find best practice type
    const practiceTypeCounts: Record<string, number> = {};
    practices.forEach(p => {
      if (p.practice_type) {
        practiceTypeCounts[p.practice_type] = (practiceTypeCounts[p.practice_type] || 0) + 1;
      }
    });
    const bestPractice = Object.entries(practiceTypeCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    // Count trigger resets this week
    const triggerResets = practices.filter(p => p.practice_type === 'trigger_reset').length;

    return {
      avg_completion_time: avgTime,
      total_practices_completed: completions.length,
      streak_count: streak?.current_streak || 0,
      protocols_completed: protocols.length,
      trigger_resets_this_week: triggerResets,
      best_practice_type: bestPractice,
      practice_response_breakdown: breakdown,
    };
  } catch (error) {
    console.error('[mioAvatarContextService] Error fetching practice insights:', error);
    return emptyInsights;
  }
}

// ============================================================================
// PREVIOUS PROTOCOL CONTEXT
// ============================================================================

/**
 * Get context from the user's most recently completed protocol
 */
export async function getPreviousProtocolContext(userId: string): Promise<PreviousProtocolContext | null> {
  try {
    const { data: protocol } = await supabase
      .from('mio_weekly_protocols')
      .select('title, days_completed, days_skipped, status')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    if (!protocol) return null;

    // Fetch moments captured from this protocol
    const { data: completions } = await supabase
      .from('mio_protocol_completions')
      .select('moment_captured')
      .eq('user_id', userId)
      .not('moment_captured', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(5);

    const moments = completions?.map(c => c.moment_captured).filter(Boolean) as string[] || [];
    const totalDays = (protocol.days_completed || 0) + (protocol.days_skipped || 0);
    const completionPct = totalDays > 0
      ? Math.round(((protocol.days_completed || 0) / totalDays) * 100)
      : 0;

    return {
      title: protocol.title,
      days_completed: protocol.days_completed || 0,
      days_skipped: protocol.days_skipped || 0,
      completion_percentage: completionPct,
      key_moments_captured: moments.slice(0, 3),
      breakthrough_detected: completionPct >= 85 && (protocol.days_completed || 0) >= 6,
    };
  } catch (error) {
    console.error('[mioAvatarContextService] Error fetching previous protocol:', error);
    return null;
  }
}

// ============================================================================
// MAIN AGGREGATOR
// ============================================================================

/**
 * Build complete protocol generation context for N8n webhook
 * This is the main function called when generating new protocols
 */
export async function buildProtocolGenerationContext(
  userId: string,
  userName?: string | null
): Promise<ProtocolGenerationContext> {
  console.log('[mioAvatarContextService] Building context for user:', userId);

  const [avatarContext, practiceInsights, previousProtocol] = await Promise.all([
    getAvatarContext(userId),
    getPracticeInsights(userId),
    getPreviousProtocolContext(userId),
  ]);

  // Count completed assessments
  let assessmentsCompleted = 0;
  if (avatarContext.pattern) assessmentsCompleted++;
  if (avatarContext.wiring_primary) assessmentsCompleted++;
  if (avatarContext.sub_pattern) assessmentsCompleted++;

  const context: ProtocolGenerationContext = {
    user_id: userId,
    user_name: userName || null,
    avatar_context: avatarContext,
    practice_insights: practiceInsights,
    previous_protocol: previousProtocol,
    assessments_completed: assessmentsCompleted,
    total_assessments: 3,
  };

  console.log('[mioAvatarContextService] Context built:', {
    avatar_complete: avatarContext.is_complete,
    avatar_name: avatarContext.avatar_name,
    streak: practiceInsights.streak_count,
    protocols_completed: practiceInsights.protocols_completed,
  });

  return context;
}

export default {
  getAvatarContext,
  getPracticeInsights,
  getPreviousProtocolContext,
  buildProtocolGenerationContext,
};
