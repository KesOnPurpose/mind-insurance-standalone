// Protocol Service - MIO Dynamic Protocols
// Phase 26: Weekly Insights Feature

import { supabase } from '@/integrations/supabase/client';
import type {
  MIOWeeklyProtocol,
  MIOUserProtocolProgress,
  MIOProtocolWithProgress,
  MIODailyCompletion,
  CreateMIOProtocolRequest,
  UpdateMIOProgressRequest,
} from '@/types/protocol';

// =============================================
// MIO Weekly Protocols
// =============================================

/**
 * Get the current active protocol for a user
 */
export async function getCurrentMIOProtocol(
  userId: string
): Promise<MIOProtocolWithProgress | null> {
  // Get current week number and year
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(
    ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
  );
  const year = now.getFullYear();

  // First try to get an active protocol for the current week
  const { data: protocol, error: protocolError } = await supabase
    .from('mio_weekly_protocols')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (protocolError) {
    console.error('Error fetching MIO protocol:', protocolError);
    throw protocolError;
  }

  if (!protocol) {
    return null;
  }

  // Get the progress for this protocol
  const { data: progress, error: progressError } = await supabase
    .from('mio_user_protocol_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('protocol_id', protocol.id)
    .maybeSingle();

  if (progressError) {
    console.error('Error fetching MIO progress:', progressError);
    throw progressError;
  }

  // Safely cast the JSONB fields
  const typedProtocol: MIOWeeklyProtocol = {
    ...protocol,
    day_tasks: Array.isArray(protocol.day_tasks) ? protocol.day_tasks : [],
    success_criteria: Array.isArray(protocol.success_criteria) ? protocol.success_criteria : undefined,
    source_context: protocol.source_context as Record<string, unknown> | undefined,
  };

  return {
    ...typedProtocol,
    progress: progress ? {
      ...progress,
      daily_completions: (progress.daily_completions || {}) as Record<string, MIODailyCompletion>,
    } : undefined,
  };
}

/**
 * Get all MIO protocols for a user
 */
export async function getUserMIOProtocols(
  userId: string,
  status?: string
): Promise<MIOWeeklyProtocol[]> {
  let query = supabase
    .from('mio_weekly_protocols')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching MIO protocols:', error);
    throw error;
  }

  return (data || []).map(p => ({
    ...p,
    day_tasks: Array.isArray(p.day_tasks) ? p.day_tasks : [],
    success_criteria: Array.isArray(p.success_criteria) ? p.success_criteria : undefined,
    source_context: p.source_context as Record<string, unknown> | undefined,
  }));
}

/**
 * Create a new MIO protocol for a user
 */
export async function createMIOProtocol(
  userId: string,
  request: CreateMIOProtocolRequest
): Promise<MIOWeeklyProtocol> {
  // Calculate week number and year
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(
    ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
  );
  const year = now.getFullYear();

  // Calculate start of week (Monday)
  const dayOfWeek = now.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - daysToMonday);
  const assignedWeekStart = weekStart.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('mio_weekly_protocols')
    .insert({
      user_id: userId,
      protocol_type: request.protocol_type,
      protocol_theme: request.protocol_theme,
      protocol_summary: request.protocol_summary,
      day_tasks: request.day_tasks,
      success_criteria: request.success_criteria,
      source: request.source,
      source_context: request.source_context,
      week_number: weekNumber,
      year: year,
      assigned_week_start: assignedWeekStart,
      status: 'active',
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating MIO protocol:', error);
    throw error;
  }

  // Create initial progress record
  await supabase
    .from('mio_user_protocol_progress')
    .insert({
      user_id: userId,
      protocol_id: data.id,
      current_day: 1,
      daily_completions: {},
      status: 'in_progress',
      started_at: new Date().toISOString(),
    });

  return {
    ...data,
    day_tasks: Array.isArray(data.day_tasks) ? data.day_tasks : [],
    success_criteria: Array.isArray(data.success_criteria) ? data.success_criteria : undefined,
    source_context: data.source_context as Record<string, unknown> | undefined,
  };
}

/**
 * Update protocol progress (complete a day)
 */
export async function updateMIOProgress(
  userId: string,
  request: UpdateMIOProgressRequest
): Promise<MIOUserProtocolProgress> {
  // Get current progress
  const { data: currentProgress, error: fetchError } = await supabase
    .from('mio_user_protocol_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('protocol_id', request.protocol_id)
    .single();

  if (fetchError) {
    console.error('Error fetching progress:', fetchError);
    throw fetchError;
  }

  // Update daily completions
  const dailyCompletions = (currentProgress.daily_completions || {}) as Record<string, MIODailyCompletion>;
  dailyCompletions[request.day_number.toString()] = {
    completed: request.completed,
    completed_at: new Date().toISOString(),
    response_data: request.response_data,
    notes: request.notes,
  };

  // Calculate new current day (next incomplete day)
  let newCurrentDay = request.day_number;
  for (let i = 1; i <= 7; i++) {
    if (!dailyCompletions[i.toString()]?.completed) {
      newCurrentDay = i;
      break;
    }
    if (i === 7) {
      newCurrentDay = 7; // All days completed
    }
  }

  // Check if all days completed
  const allCompleted = Array.from({ length: 7 }, (_, i) => i + 1).every(
    day => dailyCompletions[day.toString()]?.completed
  );

  const updateData: Record<string, unknown> = {
    daily_completions: dailyCompletions,
    current_day: newCurrentDay,
    status: allCompleted ? 'completed' : 'in_progress',
  };

  if (allCompleted) {
    updateData.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('mio_user_protocol_progress')
    .update(updateData)
    .eq('id', currentProgress.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating progress:', error);
    throw error;
  }

  // If all completed, update protocol status
  if (allCompleted) {
    await supabase
      .from('mio_weekly_protocols')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', request.protocol_id);
  }

  return {
    ...data,
    daily_completions: data.daily_completions as Record<string, MIODailyCompletion>,
  };
}

/**
 * Get the protocol streak (consecutive days of completing protocols)
 */
export async function getMIOProtocolStreak(userId: string): Promise<number> {
  // Get all completed progress records ordered by completion date
  const { data: completedDays, error } = await supabase
    .from('mio_user_protocol_progress')
    .select('daily_completions, updated_at')
    .eq('user_id', userId)
    .not('daily_completions', 'eq', '{}')
    .order('updated_at', { ascending: false });

  if (error || !completedDays) {
    console.error('Error fetching streak:', error);
    return 0;
  }

  // Flatten all completions with dates
  const allCompletions: Date[] = [];
  completedDays.forEach(progress => {
    const completions = progress.daily_completions as Record<string, MIODailyCompletion>;
    Object.values(completions).forEach(c => {
      if (c.completed && c.completed_at) {
        allCompletions.push(new Date(c.completed_at));
      }
    });
  });

  if (allCompletions.length === 0) return 0;

  // Sort by date descending
  allCompletions.sort((a, b) => b.getTime() - a.getTime());

  // Count consecutive days from today
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Check if most recent completion is today or yesterday (streak continues)
  const mostRecent = new Date(allCompletions[0]);
  mostRecent.setHours(0, 0, 0, 0);

  if (mostRecent.getTime() === today.getTime() || mostRecent.getTime() === yesterday.getTime()) {
    const uniqueDays = new Set<string>();
    allCompletions.forEach(date => {
      const dayKey = date.toISOString().split('T')[0];
      uniqueDays.add(dayKey);
    });

    // Count consecutive days
    let checkDate = mostRecent;
    while (uniqueDays.has(checkDate.toISOString().split('T')[0])) {
      streak++;
      checkDate = new Date(checkDate);
      checkDate.setDate(checkDate.getDate() - 1);
    }
  }

  return streak;
}

/**
 * Abandon a protocol (user gives up)
 */
export async function abandonMIOProtocol(
  userId: string,
  protocolId: string
): Promise<void> {
  const { error } = await supabase
    .from('mio_weekly_protocols')
    .update({ status: 'abandoned' })
    .eq('id', protocolId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error abandoning protocol:', error);
    throw error;
  }

  // Also update progress status
  await supabase
    .from('mio_user_protocol_progress')
    .update({ status: 'skipped' })
    .eq('protocol_id', protocolId)
    .eq('user_id', userId);
}

/**
 * Get weekly insights summary data
 */
export async function getWeeklyInsightsSummary(userId: string): Promise<{
  currentWeek: number;
  currentDay: number;
  weekProgress: number;
  protocolStreak: number;
  hasActiveProtocol: boolean;
}> {
  // Get current protocol
  const protocol = await getCurrentMIOProtocol(userId);
  const streak = await getMIOProtocolStreak(userId);

  // Calculate current week in the 30-day challenge
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('challenge_start_date, challenge_day')
    .eq('id', userId)
    .single();

  const challengeDay = profile?.challenge_day || 1;
  const currentWeek = Math.ceil(challengeDay / 7);

  // Calculate day within current protocol
  let currentDay = 1;
  let weekProgress = 0;

  if (protocol?.progress) {
    currentDay = protocol.progress.current_day;
    const completedDays = Object.values(protocol.progress.daily_completions).filter(
      c => c.completed
    ).length;
    weekProgress = Math.round((completedDays / 7) * 100);
  }

  return {
    currentWeek,
    currentDay,
    weekProgress,
    protocolStreak: streak,
    hasActiveProtocol: !!protocol,
  };
}
