/**
 * Coverage Streak Service
 * Coverage Center - $100M Mind Insurance Feature
 *
 * This service handles:
 * - Getting and creating coverage streaks
 * - Using skip tokens to protect streaks
 * - Getting coverage history (MIO + Coach protocols)
 * - Getting user milestones
 * - Completing protocol days with streak tracking
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  CoverageStreak,
  CoverageStreakDisplay,
  CoverageMilestoneWithProtocol,
  CoverageHistoryItem,
  UseSkipTokenResult,
  CompleteProtocolDayWithStreakRequest,
  CompleteProtocolDayWithStreakResponse,
  ProtocolDayCompletionPayload,
} from '@/types/coverage';

// ============================================================================
// COVERAGE STREAK OPERATIONS
// ============================================================================

/**
 * Get or create coverage streak for a user
 */
export async function getCoverageStreak(
  userId: string
): Promise<CoverageStreak | null> {
  const { data, error } = await supabase.rpc('get_or_create_coverage_streak', {
    p_user_id: userId,
  });

  if (error) {
    console.error('Error getting coverage streak:', error);
    return null;
  }

  // RPC returns array, get first result
  const streak = Array.isArray(data) ? data[0] : data;
  return streak as CoverageStreak | null;
}

/**
 * Get simplified streak display data
 */
export async function getCoverageStreakDisplay(
  userId: string
): Promise<CoverageStreakDisplay | null> {
  const streak = await getCoverageStreak(userId);

  if (!streak) {
    return {
      current_streak: 0,
      longest_streak: 0,
      skip_tokens: 0,
    };
  }

  return {
    current_streak: streak.current_streak,
    longest_streak: streak.longest_streak,
    skip_tokens: streak.skip_tokens,
  };
}

/**
 * Check if user's streak is at risk (missed yesterday, still within grace period)
 */
export async function checkStreakAtRisk(userId: string): Promise<{
  at_risk: boolean;
  skip_tokens_available: number;
  last_completion_date: string | null;
}> {
  const streak = await getCoverageStreak(userId);

  if (!streak) {
    return {
      at_risk: false,
      skip_tokens_available: 0,
      last_completion_date: null,
    };
  }

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // At risk if last completion was before yesterday AND current streak > 0
  const at_risk =
    streak.current_streak > 0 &&
    streak.last_completion_date !== today &&
    streak.last_completion_date !== yesterday;

  return {
    at_risk,
    skip_tokens_available: streak.skip_tokens,
    last_completion_date: streak.last_completion_date,
  };
}

// ============================================================================
// SKIP TOKEN OPERATIONS
// ============================================================================

/**
 * Use a skip token to protect the streak
 */
export async function useSkipToken(userId: string): Promise<UseSkipTokenResult> {
  const { data, error } = await supabase.rpc('use_skip_token', {
    p_user_id: userId,
  });

  if (error) {
    console.error('Error using skip token:', error);
    return {
      success: false,
      error: error.message,
    };
  }

  return data as UseSkipTokenResult;
}

/**
 * Check if user can use a skip token
 */
export async function canUseSkipToken(userId: string): Promise<boolean> {
  const streak = await getCoverageStreak(userId);
  return streak ? streak.skip_tokens > 0 : false;
}

// ============================================================================
// COVERAGE HISTORY OPERATIONS
// ============================================================================

/**
 * Get coverage history (completed and active protocols)
 */
export async function getCoverageHistory(
  userId: string,
  limit = 10
): Promise<CoverageHistoryItem[]> {
  const { data, error } = await supabase.rpc('get_coverage_history', {
    p_user_id: userId,
    p_limit: limit,
  });

  if (error) {
    console.error('Error getting coverage history:', error);
    return [];
  }

  return (data || []) as CoverageHistoryItem[];
}

/**
 * Get MIO protocol history specifically
 */
export async function getMIOProtocolHistory(
  userId: string,
  limit = 10
): Promise<CoverageHistoryItem[]> {
  const { data, error } = await supabase
    .from('mio_weekly_protocols')
    .select(`
      id,
      title,
      protocol_type,
      source_context,
      days_completed,
      status,
      skip_token_earned,
      started_at,
      completed_at,
      created_at
    `)
    .eq('user_id', userId)
    .in('status', ['completed', 'active', 'expired'])
    .eq('muted_by_coach', false)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error getting MIO protocol history:', error);
    return [];
  }

  return (data || []).map((p) => ({
    protocol_id: p.id,
    protocol_title: p.title,
    pattern_targeted:
      (p.source_context as Record<string, string>)?.collision_pattern ||
      p.protocol_type,
    completion_percentage: Math.round((p.days_completed / 7) * 100),
    days_completed: p.days_completed,
    total_days: 7,
    status: p.status as CoverageHistoryItem['status'],
    skip_token_earned: p.skip_token_earned || false,
    started_at: p.started_at,
    completed_at: p.completed_at,
    created_at: p.created_at,
  }));
}

/**
 * Get Coach protocol history
 */
export async function getCoachProtocolHistory(
  userId: string,
  limit = 10
): Promise<CoverageHistoryItem[]> {
  const { data, error } = await supabase
    .from('user_coach_protocol_assignments')
    .select(`
      id,
      protocol:coach_protocols_v2(id, title, total_weeks),
      days_completed,
      status,
      started_at,
      completed_at,
      created_at
    `)
    .eq('user_id', userId)
    .in('status', ['completed', 'active', 'dropped'])
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error getting coach protocol history:', error);
    return [];
  }

  return (data || []).map((a) => {
    const protocol = a.protocol as {
      id: string;
      title: string;
      total_weeks: number;
    };
    const totalDays = protocol.total_weeks * 7;

    return {
      protocol_id: protocol.id,
      protocol_title: protocol.title,
      pattern_targeted: 'Coach Protocol',
      completion_percentage: Math.round((a.days_completed / totalDays) * 100),
      days_completed: a.days_completed,
      total_days: totalDays,
      status: a.status as CoverageHistoryItem['status'],
      skip_token_earned: a.status === 'completed',
      started_at: a.started_at,
      completed_at: a.completed_at,
      created_at: a.created_at,
    };
  });
}

// ============================================================================
// MILESTONE OPERATIONS
// ============================================================================

/**
 * Get all milestones for a user
 */
export async function getUserMilestones(
  userId: string
): Promise<CoverageMilestoneWithProtocol[]> {
  const { data, error } = await supabase.rpc('get_user_milestones', {
    p_user_id: userId,
  });

  if (error) {
    console.error('Error getting user milestones:', error);
    return [];
  }

  return (data || []) as CoverageMilestoneWithProtocol[];
}

/**
 * Check if user has achieved a specific milestone
 */
export async function hasMilestone(
  userId: string,
  milestoneType: string
): Promise<boolean> {
  const milestones = await getUserMilestones(userId);
  return milestones.some((m) => m.milestone_type === milestoneType);
}

// ============================================================================
// PROTOCOL COMPLETION WITH STREAK
// ============================================================================

/**
 * Complete a protocol day with full streak tracking
 * This is the main function called when user completes CT with protocol check-in
 */
export async function completeProtocolDayWithStreak(
  request: CompleteProtocolDayWithStreakRequest
): Promise<CompleteProtocolDayWithStreakResponse> {
  const { data, error } = await supabase.rpc('complete_protocol_day_with_streak', {
    p_protocol_id: request.protocol_id,
    p_day_number: request.day_number,
    p_response_data: request.response_data || {},
    p_notes: request.notes || null,
    p_time_spent: request.time_spent_minutes || null,
    p_practice_response: request.practice_response || null,
    p_moment_captured: request.moment_captured || null,
    p_insight_captured: request.insight_captured || null,
  });

  if (error) {
    console.error('Error completing protocol day with streak:', error);
    return {
      success: false,
      error: error.message,
    };
  }

  return data as CompleteProtocolDayWithStreakResponse;
}

/**
 * Fire async webhook for MIO response generation (fire and forget)
 */
export async function fireProtocolDayCompletionWebhook(
  payload: ProtocolDayCompletionPayload
): Promise<void> {
  try {
    // Get webhook URL from environment or use default
    const webhookUrl =
      import.meta.env.VITE_N8N_PROTOCOL_COMPLETION_WEBHOOK ||
      'https://purposewaze.app.n8n.cloud/webhook/protocol-day-completion';

    // Fire and forget - don't await
    fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }).catch((err) => {
      console.warn('Protocol completion webhook failed (non-blocking):', err);
    });
  } catch (err) {
    console.warn('Error preparing protocol completion webhook:', err);
  }
}

// ============================================================================
// TRANSFORMATION METRICS
// ============================================================================

/**
 * Get transformation metrics for a user
 */
export async function getTransformationMetrics(userId: string): Promise<{
  protocols_completed: number;
  total_days_practiced: number;
  average_completion_rate: number;
  patterns_addressed: string[];
}> {
  // Get all completed protocols
  const { data: protocols } = await supabase
    .from('mio_weekly_protocols')
    .select('days_completed, source_context, status')
    .eq('user_id', userId)
    .in('status', ['completed', 'active', 'expired']);

  const protocolList = protocols || [];

  // Calculate metrics
  const completedProtocols = protocolList.filter(
    (p) => p.status === 'completed'
  ).length;
  const totalDaysPracticed = protocolList.reduce(
    (sum, p) => sum + p.days_completed,
    0
  );
  const averageCompletion =
    protocolList.length > 0
      ? protocolList.reduce((sum, p) => sum + (p.days_completed / 7) * 100, 0) /
        protocolList.length
      : 0;

  // Extract unique patterns
  const patterns = new Set<string>();
  protocolList.forEach((p) => {
    const pattern = (p.source_context as Record<string, string>)
      ?.collision_pattern;
    if (pattern) {
      patterns.add(pattern);
    }
  });

  return {
    protocols_completed: completedProtocols,
    total_days_practiced: totalDaysPracticed,
    average_completion_rate: Math.round(averageCompletion),
    patterns_addressed: Array.from(patterns),
  };
}

// ============================================================================
// REAL-TIME SUBSCRIPTIONS
// ============================================================================

/**
 * Subscribe to streak updates for a user
 */
export function subscribeToStreakUpdates(
  userId: string,
  onUpdate: (streak: CoverageStreak) => void
) {
  return supabase
    .channel(`coverage-streak-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'coverage_streaks',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (payload.new) {
          onUpdate(payload.new as CoverageStreak);
        }
      }
    )
    .subscribe();
}

/**
 * Subscribe to milestone achievements
 */
export function subscribeToMilestones(
  userId: string,
  onMilestone: (milestone: CoverageMilestoneWithProtocol) => void
) {
  return supabase
    .channel(`coverage-milestones-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'coverage_milestones',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (payload.new) {
          onMilestone(payload.new as CoverageMilestoneWithProtocol);
        }
      }
    )
    .subscribe();
}

// ============================================================================
// EXPORTS
// ============================================================================

export const coverageStreakService = {
  // Streak operations
  getCoverageStreak,
  getCoverageStreakDisplay,
  checkStreakAtRisk,

  // Skip token operations
  useSkipToken,
  canUseSkipToken,

  // History operations
  getCoverageHistory,
  getMIOProtocolHistory,
  getCoachProtocolHistory,

  // Milestone operations
  getUserMilestones,
  hasMilestone,

  // Completion operations
  completeProtocolDayWithStreak,
  fireProtocolDayCompletionWebhook,

  // Metrics
  getTransformationMetrics,

  // Real-time
  subscribeToStreakUpdates,
  subscribeToMilestones,
};

export default coverageStreakService;
