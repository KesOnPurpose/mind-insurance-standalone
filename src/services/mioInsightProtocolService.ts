/**
 * MIO Insight Protocol Service
 * Phase 27: Weekly AI-Generated Protocols from MIO Insights
 *
 * This service handles:
 * - Fetching active protocols for users
 * - Completing protocol days
 * - Tracking progress
 * - Getting today's task for display
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  MIOInsightProtocol,
  MIOInsightProtocolWithProgress,
  MIOProtocolCompletion,
  MIOInsightDayTask,
  TodayProtocolTask,
  CompleteProtocolDayRequest,
  CompleteProtocolDayResponse,
  N8nMIOInsightProtocolPayload,
} from '@/types/protocol';

// ============================================================================
// GET OPERATIONS
// ============================================================================

/**
 * Get the user's currently active MIO insight protocol
 */
export async function getActiveInsightProtocol(
  userId: string
): Promise<MIOInsightProtocolWithProgress | null> {
  const { data: protocol, error } = await supabase
    .from('mio_weekly_protocols')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .eq('muted_by_coach', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !protocol) {
    if (error?.code !== 'PGRST116') {
      // Not a "no rows" error
      console.error('Error fetching active protocol:', error);
    }
    return null;
  }

  // Fetch completions
  const { data: completions } = await supabase
    .from('mio_protocol_completions')
    .select('*')
    .eq('protocol_id', protocol.id)
    .order('day_number', { ascending: true });

  // Calculate today's task
  const dayTasks = protocol.day_tasks as MIOInsightDayTask[];
  const currentDay = protocol.current_day || 1;
  const todayTask = dayTasks.find((t) => t.day === currentDay);
  const todayCompletion = completions?.find(
    (c) => c.day_number === currentDay && !c.was_skipped
  );

  return {
    ...protocol,
    day_tasks: dayTasks,
    completions: (completions || []) as MIOProtocolCompletion[],
    today_task: todayTask,
    is_today_completed: !!todayCompletion,
  } as MIOInsightProtocolWithProgress;
}

/**
 * Get a specific protocol by ID with progress
 */
export async function getProtocolById(
  protocolId: string
): Promise<MIOInsightProtocolWithProgress | null> {
  const { data: protocol, error } = await supabase
    .from('mio_weekly_protocols')
    .select('*')
    .eq('id', protocolId)
    .single();

  if (error || !protocol) {
    console.error('Error fetching protocol:', error);
    return null;
  }

  const { data: completions } = await supabase
    .from('mio_protocol_completions')
    .select('*')
    .eq('protocol_id', protocolId)
    .order('day_number', { ascending: true });

  const dayTasks = protocol.day_tasks as MIOInsightDayTask[];
  const currentDay = protocol.current_day || 1;
  const todayTask = dayTasks.find((t) => t.day === currentDay);
  const todayCompletion = completions?.find(
    (c) => c.day_number === currentDay && !c.was_skipped
  );

  return {
    ...protocol,
    day_tasks: dayTasks,
    completions: (completions || []) as MIOProtocolCompletion[],
    today_task: todayTask,
    is_today_completed: !!todayCompletion,
  } as MIOInsightProtocolWithProgress;
}

/**
 * Get all protocols for a user (for history view)
 */
export async function getUserProtocols(
  userId: string,
  limit = 10
): Promise<MIOInsightProtocol[]> {
  const { data, error } = await supabase
    .from('mio_weekly_protocols')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching user protocols:', error);
    return [];
  }

  return (data || []).map((p) => ({
    ...p,
    day_tasks: p.day_tasks as MIOInsightDayTask[],
  })) as MIOInsightProtocol[];
}

/**
 * Get today's protocol task for display in the hub
 * Returns null if no active protocol or today is complete
 */
export async function getTodayProtocolTask(
  userId: string
): Promise<TodayProtocolTask | null> {
  const protocol = await getActiveInsightProtocol(userId);

  if (!protocol || !protocol.today_task) {
    return null;
  }

  return {
    protocol_id: protocol.id,
    protocol_title: protocol.title,
    day_number: protocol.current_day,
    total_days: 7,
    task: protocol.today_task,
    is_completed: protocol.is_today_completed,
    days_completed: protocol.days_completed,
    insight_summary: protocol.insight_summary,
  };
}

// ============================================================================
// COMPLETION OPERATIONS
// ============================================================================

/**
 * Complete a protocol day
 */
export async function completeProtocolDay(
  request: CompleteProtocolDayRequest
): Promise<CompleteProtocolDayResponse> {
  // Use the database function for atomic operation
  const { data, error } = await supabase.rpc('complete_protocol_day', {
    p_protocol_id: request.protocol_id,
    p_day_number: request.day_number,
    p_response_data: request.response_data || {},
    p_notes: request.notes || null,
    p_time_spent: request.time_spent_minutes || null,
  });

  if (error) {
    console.error('Error completing protocol day:', error);
    return {
      success: false,
      error: error.message,
    };
  }

  return data as CompleteProtocolDayResponse;
}

/**
 * Skip to a specific day (auto-skips missed days)
 */
export async function skipToDay(
  protocolId: string,
  targetDay: number
): Promise<{ success: boolean; days_skipped?: number; error?: string }> {
  const { data, error } = await supabase.rpc('skip_to_current_protocol_day', {
    p_protocol_id: protocolId,
    p_target_day: targetDay,
  });

  if (error) {
    console.error('Error skipping to day:', error);
    return { success: false, error: error.message };
  }

  return data;
}

// ============================================================================
// PROGRESS TRACKING
// ============================================================================

/**
 * Mark insight as viewed (for analytics)
 */
export async function markInsightViewed(protocolId: string): Promise<void> {
  await supabase
    .from('mio_weekly_protocols')
    .update({ insight_viewed_at: new Date().toISOString() })
    .eq('id', protocolId)
    .is('insight_viewed_at', null);
}

/**
 * Start the protocol (mark first task as started)
 */
export async function startProtocol(protocolId: string): Promise<void> {
  const now = new Date().toISOString();
  await supabase
    .from('mio_weekly_protocols')
    .update({
      started_at: now,
      first_task_started_at: now,
    })
    .eq('id', protocolId)
    .is('started_at', null);
}

/**
 * Calculate days since protocol was assigned (for skip logic)
 */
export function calculateCurrentProtocolDay(
  assignedDate: string | Date
): number {
  const assigned = new Date(assignedDate);
  const now = new Date();
  const diffTime = now.getTime() - assigned.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return Math.min(Math.max(diffDays, 1), 7);
}

// ============================================================================
// ADMIN/COACH OPERATIONS
// ============================================================================

/**
 * Mute a protocol (coach action)
 */
export async function muteProtocol(
  protocolId: string,
  mutedBy: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc('mute_mio_protocol', {
    p_protocol_id: protocolId,
    p_muted_by: mutedBy,
    p_reason: reason,
  });

  if (error) {
    console.error('Error muting protocol:', error);
    return { success: false, error: error.message };
  }

  return data;
}

/**
 * Unmute a protocol
 */
export async function unmuteProtocol(
  protocolId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('mio_weekly_protocols')
    .update({
      muted_by_coach: false,
      muted_at: null,
      muted_by: null,
      muted_reason: null,
      status: 'active',
    })
    .eq('id', protocolId);

  if (error) {
    console.error('Error unmuting protocol:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ============================================================================
// PROTOCOL CREATION (for n8n webhook)
// ============================================================================

/**
 * Create a new insight protocol (called by n8n workflow)
 */
export async function createInsightProtocol(
  payload: N8nMIOInsightProtocolPayload
): Promise<{ success: boolean; protocol_id?: string; error?: string }> {
  // Deactivate any existing active protocols for this user
  await supabase
    .from('mio_weekly_protocols')
    .update({ status: 'expired' })
    .eq('user_id', payload.user_id)
    .eq('status', 'active');

  // Create the new protocol
  const { data, error } = await supabase
    .from('mio_weekly_protocols')
    .insert({
      user_id: payload.user_id,
      report_id: payload.report_id,
      protocol_type: 'insight_based',
      title: payload.title,
      insight_summary: payload.insight_summary,
      why_it_matters: payload.why_it_matters,
      neural_principle: payload.neural_principle,
      day_tasks: payload.day_tasks,
      source: 'n8n_weekly',
      source_context: payload.source_context || {},
      rag_chunks_used: payload.rag_chunks_used || [],
      capability_triggers: payload.capability_triggers || [],
      confidence_score: payload.confidence_score,
      status: 'active',
      current_day: 1,
      days_completed: 0,
      days_skipped: 0,
      muted_by_coach: false,
      week_number: getWeekNumber(new Date()),
      year: new Date().getFullYear(),
      assigned_week_start: getWeekStart(new Date()).toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating insight protocol:', error);
    return { success: false, error: error.message };
  }

  return { success: true, protocol_id: data?.id };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

// ============================================================================
// REAL-TIME SUBSCRIPTION
// ============================================================================

/**
 * Subscribe to protocol updates for a user
 */
export function subscribeToProtocolUpdates(
  userId: string,
  onUpdate: (protocol: MIOInsightProtocol) => void
) {
  return supabase
    .channel(`protocol-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'mio_weekly_protocols',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (payload.new) {
          onUpdate(payload.new as MIOInsightProtocol);
        }
      }
    )
    .subscribe();
}

// ============================================================================
// EXPORTS
// ============================================================================

export const mioInsightProtocolService = {
  // Get operations
  getActiveInsightProtocol,
  getProtocolById,
  getUserProtocols,
  getTodayProtocolTask,

  // Completion operations
  completeProtocolDay,
  skipToDay,

  // Progress tracking
  markInsightViewed,
  startProtocol,
  calculateCurrentProtocolDay,

  // Admin/Coach operations
  muteProtocol,
  unmuteProtocol,

  // Creation (for n8n)
  createInsightProtocol,

  // Real-time
  subscribeToProtocolUpdates,
};

export default mioInsightProtocolService;
