// Coach Protocol V2 Service
// Multi-week coach protocol management with MIO integration

import { supabase } from '@/integrations/supabase/client';
import type {
  CoachProtocolV2,
  CoachProtocolV2WithTasks,
  CoachProtocolTaskV2,
  UserCoachProtocolAssignment,
  CoachProtocolCompletion,
  CreateCoachProtocolForm,
  CreateCoachProtocolTaskForm,
  AssignmentOptions,
  AssignmentResult,
  CompleteTaskRequest,
  CompleteTaskResponse,
  TodayCoachTasksResponse,
  UserCoachProtocolsResponse,
  UserProtocolWithProgress,
  CoachProtocolDashboardStats,
  DashboardAssignmentWithProgress,
  DashboardFilters,
  CoachProtocolContextForMIO,
  MIOPauseResult,
  MIOResumeResult,
  CoachProtocolStatusV2,
  AssignmentSlot,
  ParsedProtocolTask,
} from '@/types/coach-protocol';

// =============================================
// PROTOCOL CRUD OPERATIONS
// =============================================

/**
 * Create a new coach protocol
 */
export async function createProtocol(
  coachId: string,
  form: CreateCoachProtocolForm
): Promise<CoachProtocolV2> {
  const { data, error } = await supabase
    .from('coach_protocols_v2')
    .insert({
      title: form.title,
      description: form.description,
      coach_id: coachId,
      total_weeks: form.total_weeks,
      visibility: form.visibility,
      visibility_config: form.visibility_config || {},
      schedule_type: form.schedule_type,
      start_date: form.start_date,
      theme_color: form.theme_color || '#fac832',
      icon: form.icon || 'book',
      status: 'draft',
    })
    .select()
    .single();

  if (error) throw error;

  // Create tasks if provided
  if (form.tasks && form.tasks.length > 0) {
    await bulkCreateTasks(data.id, form.tasks);
  }

  return data as CoachProtocolV2;
}

/**
 * Update an existing protocol
 */
export async function updateProtocol(
  protocolId: string,
  updates: Partial<CreateCoachProtocolForm>
): Promise<CoachProtocolV2> {
  const { data, error } = await supabase
    .from('coach_protocols_v2')
    .update({
      title: updates.title,
      description: updates.description,
      total_weeks: updates.total_weeks,
      visibility: updates.visibility,
      visibility_config: updates.visibility_config,
      schedule_type: updates.schedule_type,
      start_date: updates.start_date,
      theme_color: updates.theme_color,
      icon: updates.icon,
    })
    .eq('id', protocolId)
    .select()
    .single();

  if (error) throw error;
  return data as CoachProtocolV2;
}

/**
 * Update protocol status
 */
export async function updateProtocolStatus(
  protocolId: string,
  status: CoachProtocolStatusV2
): Promise<CoachProtocolV2> {
  const updateData: Record<string, unknown> = { status };

  if (status === 'published') {
    updateData.published_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('coach_protocols_v2')
    .update(updateData)
    .eq('id', protocolId)
    .select()
    .single();

  if (error) throw error;
  return data as CoachProtocolV2;
}

/**
 * Delete a protocol
 */
export async function deleteProtocol(protocolId: string): Promise<void> {
  const { error } = await supabase
    .from('coach_protocols_v2')
    .delete()
    .eq('id', protocolId);

  if (error) throw error;
}

/**
 * Get protocol by ID
 */
export async function getProtocol(protocolId: string): Promise<CoachProtocolV2> {
  const { data, error } = await supabase
    .from('coach_protocols_v2')
    .select('*')
    .eq('id', protocolId)
    .single();

  if (error) throw error;
  return data as CoachProtocolV2;
}

/**
 * Get protocol with all tasks
 */
export async function getProtocolWithTasks(
  protocolId: string
): Promise<CoachProtocolV2WithTasks> {
  const { data: protocol, error: protocolError } = await supabase
    .from('coach_protocols_v2')
    .select('*')
    .eq('id', protocolId)
    .single();

  if (protocolError) throw protocolError;

  const { data: tasks, error: tasksError } = await supabase
    .from('coach_protocol_tasks_v2')
    .select('*')
    .eq('protocol_id', protocolId)
    .order('week_number', { ascending: true })
    .order('day_number', { ascending: true })
    .order('task_order', { ascending: true });

  if (tasksError) throw tasksError;

  return {
    ...protocol,
    tasks: tasks || [],
  } as CoachProtocolV2WithTasks;
}

/**
 * Get all protocols (for admin)
 */
export async function getAllProtocols(filters?: {
  status?: CoachProtocolStatusV2;
  coach_id?: string;
}): Promise<CoachProtocolV2[]> {
  let query = supabase
    .from('coach_protocols_v2')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.coach_id) {
    query = query.eq('coach_id', filters.coach_id);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as CoachProtocolV2[];
}

/**
 * Duplicate a protocol
 */
export async function duplicateProtocol(
  protocolId: string,
  coachId: string
): Promise<CoachProtocolV2> {
  // Get original protocol with tasks
  const original = await getProtocolWithTasks(protocolId);

  // Create new protocol
  const { data: newProtocol, error } = await supabase
    .from('coach_protocols_v2')
    .insert({
      title: `${original.title} (Copy)`,
      description: original.description,
      coach_id: coachId,
      total_weeks: original.total_weeks,
      visibility: original.visibility,
      visibility_config: original.visibility_config,
      schedule_type: original.schedule_type,
      theme_color: original.theme_color,
      icon: original.icon,
      status: 'draft',
    })
    .select()
    .single();

  if (error) throw error;

  // Copy tasks
  if (original.tasks.length > 0) {
    const newTasks = original.tasks.map((task) => ({
      protocol_id: newProtocol.id,
      week_number: task.week_number,
      day_number: task.day_number,
      task_order: task.task_order,
      title: task.title,
      instructions: task.instructions,
      task_type: task.task_type,
      time_of_day: task.time_of_day,
      estimated_minutes: task.estimated_minutes,
      resource_url: task.resource_url,
      resource_type: task.resource_type,
      success_criteria: task.success_criteria,
      week_theme: task.week_theme,
    }));

    await supabase.from('coach_protocol_tasks_v2').insert(newTasks);
  }

  return newProtocol as CoachProtocolV2;
}

// =============================================
// TASK MANAGEMENT
// =============================================

/**
 * Bulk create tasks for a protocol
 */
export async function bulkCreateTasks(
  protocolId: string,
  tasks: CreateCoachProtocolTaskForm[]
): Promise<CoachProtocolTaskV2[]> {
  const tasksToInsert = tasks.map((task) => ({
    protocol_id: protocolId,
    week_number: task.week_number,
    day_number: task.day_number,
    task_order: task.task_order,
    title: task.title,
    instructions: task.instructions,
    task_type: task.task_type,
    time_of_day: task.time_of_day,
    estimated_minutes: task.estimated_minutes,
    resource_url: task.resource_url,
    resource_type: task.resource_type,
    success_criteria: task.success_criteria || [],
    week_theme: task.week_theme,
  }));

  const { data, error } = await supabase
    .from('coach_protocol_tasks_v2')
    .insert(tasksToInsert)
    .select();

  if (error) throw error;
  return data as CoachProtocolTaskV2[];
}

/**
 * Create tasks from parsed import data
 */
export async function createTasksFromParsed(
  protocolId: string,
  tasks: ParsedProtocolTask[]
): Promise<CoachProtocolTaskV2[]> {
  return bulkCreateTasks(
    protocolId,
    tasks.map((t) => ({
      week_number: t.week_number,
      day_number: t.day_number,
      task_order: t.task_order,
      title: t.title,
      instructions: t.instructions,
      task_type: t.task_type,
      time_of_day: t.time_of_day,
      estimated_minutes: t.estimated_minutes,
      resource_url: t.resource_url,
      success_criteria: t.success_criteria,
      week_theme: t.week_theme,
    }))
  );
}

/**
 * Update a single task
 */
export async function updateTask(
  taskId: string,
  updates: Partial<CreateCoachProtocolTaskForm>
): Promise<CoachProtocolTaskV2> {
  const { data, error } = await supabase
    .from('coach_protocol_tasks_v2')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw error;
  return data as CoachProtocolTaskV2;
}

/**
 * Delete a task
 */
export async function deleteTask(taskId: string): Promise<void> {
  const { error } = await supabase
    .from('coach_protocol_tasks_v2')
    .delete()
    .eq('id', taskId);

  if (error) throw error;
}

/**
 * Delete all tasks for a protocol (for re-import)
 */
export async function deleteAllTasks(protocolId: string): Promise<void> {
  const { error } = await supabase
    .from('coach_protocol_tasks_v2')
    .delete()
    .eq('protocol_id', protocolId);

  if (error) throw error;
}

// =============================================
// ASSIGNMENT OPERATIONS
// =============================================

/**
 * Assign protocol to multiple users
 */
export async function assignToUsers(
  protocolId: string,
  userIds: string[],
  options: AssignmentOptions,
  assignedBy: string
): Promise<AssignmentResult[]> {
  const results: AssignmentResult[] = [];

  for (const userId of userIds) {
    try {
      // Check for existing assignment in the slot
      // Use maybeSingle() instead of single() to avoid 406 errors when no assignment exists
      const { data: existing } = await supabase
        .from('user_coach_protocol_assignments')
        .select('id, protocol_id')
        .eq('user_id', userId)
        .eq('assignment_slot', options.slot)
        .eq('status', 'active')
        .maybeSingle();

      if (existing && !options.override_existing) {
        // Get existing protocol title for conflict info
        const { data: existingProtocol } = await supabase
          .from('coach_protocols_v2')
          .select('title')
          .eq('id', existing.protocol_id)
          .single();

        results.push({
          user_id: userId,
          success: false,
          error: 'Slot already occupied',
          conflict: {
            existing_protocol_id: existing.protocol_id,
            existing_protocol_title: existingProtocol?.title || 'Unknown',
          },
        });
        continue;
      }

      // If override, remove existing assignment
      if (existing && options.override_existing) {
        await supabase
          .from('user_coach_protocol_assignments')
          .update({ status: 'abandoned' })
          .eq('id', existing.id);
      }

      // Pause MIO protocol if exists
      const mioResult = await pauseMIOForUser(userId);

      // Create new assignment
      const startDate = options.start_date === 'immediate'
        ? new Date().toISOString()
        : options.start_date;

      const { data: assignment, error } = await supabase
        .from('user_coach_protocol_assignments')
        .insert({
          user_id: userId,
          protocol_id: protocolId,
          assignment_slot: options.slot,
          assigned_by: assignedBy,
          assignment_note: options.assignment_note,
          started_at: startDate,
          paused_mio_protocol_id: mioResult.paused_mio_protocol_id,
        })
        .select()
        .single();

      if (error) throw error;

      results.push({
        user_id: userId,
        success: true,
        assignment_id: assignment.id,
      });

      // Create started event
      await createCompletionEvent(
        assignment.id,
        userId,
        protocolId,
        'protocol_started'
      );

    } catch (err) {
      results.push({
        user_id: userId,
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  return results;
}

/**
 * Assign protocol to a group
 */
export async function assignToGroup(
  protocolId: string,
  groupId: string,
  options: AssignmentOptions,
  assignedBy: string
): Promise<AssignmentResult[]> {
  // Get group members
  const { data: group, error: groupError } = await supabase
    .from('mio_user_groups')
    .select('member_ids')
    .eq('id', groupId)
    .single();

  if (groupError) throw groupError;

  const userIds = group.member_ids as string[];
  return assignToUsers(protocolId, userIds, options, assignedBy);
}

/**
 * Remove/abandon an assignment
 */
export async function removeAssignment(assignmentId: string): Promise<void> {
  const { data: assignment, error: getError } = await supabase
    .from('user_coach_protocol_assignments')
    .select('*')
    .eq('id', assignmentId)
    .single();

  if (getError) throw getError;

  // Update assignment status
  const { error } = await supabase
    .from('user_coach_protocol_assignments')
    .update({ status: 'abandoned' })
    .eq('id', assignmentId);

  if (error) throw error;

  // Resume MIO if it was paused
  if (assignment.paused_mio_protocol_id) {
    await resumeMIOForUser(assignment.user_id, assignmentId);
  }

  // Create abandoned event
  await createCompletionEvent(
    assignmentId,
    assignment.user_id,
    assignment.protocol_id,
    'protocol_abandoned'
  );
}

// =============================================
// USER ACCESS OPERATIONS
// =============================================

/**
 * Get user's active coach protocols (primary and secondary)
 */
export async function getUserActiveProtocols(
  userId: string
): Promise<UserCoachProtocolsResponse> {
  const { data, error } = await supabase
    .from('user_coach_protocol_assignments')
    .select(`
      *,
      protocol:coach_protocols_v2(*)
    `)
    .eq('user_id', userId)
    .eq('status', 'active');

  if (error) throw error;

  const assignments = data as (UserCoachProtocolAssignment & {
    protocol: CoachProtocolV2;
  })[];

  const buildProgress = (
    assignment: UserCoachProtocolAssignment,
    protocol: CoachProtocolV2
  ): UserProtocolWithProgress => {
    const totalDays = protocol.total_weeks * 7;
    const absoluteDay = (assignment.current_week - 1) * 7 + assignment.current_day;
    const completionPercentage = (absoluteDay / totalDays) * 100;

    return {
      assignment,
      protocol,
      progress: {
        absolute_day: absoluteDay,
        total_days: totalDays,
        completion_percentage: Math.min(completionPercentage, 100),
        days_remaining: Math.max(0, totalDays - absoluteDay),
      },
    };
  };

  const primary = assignments.find((a) => a.assignment_slot === 'primary');
  const secondary = assignments.find((a) => a.assignment_slot === 'secondary');

  return {
    primary: primary ? buildProgress(primary, primary.protocol) : null,
    secondary: secondary ? buildProgress(secondary, secondary.protocol) : null,
  };
}

/**
 * Get today's tasks for a user
 */
export async function getTodayTasks(
  userId: string
): Promise<TodayCoachTasksResponse> {
  const { data, error } = await supabase.rpc('get_coach_protocol_today_tasks', {
    p_user_id: userId,
  });

  if (error) throw error;

  // Group by assignment slot
  const result: TodayCoachTasksResponse = {};

  // Get unique assignments
  const assignmentIds = [...new Set(data?.map((t: any) => t.assignment_id) || [])];

  for (const assignmentId of assignmentIds) {
    const assignmentTasks = data?.filter((t: any) => t.assignment_id === assignmentId) || [];
    if (assignmentTasks.length === 0) continue;

    const first = assignmentTasks[0];
    const slot = first.assignment_slot as AssignmentSlot;

    // Get protocol details
    const { data: protocol } = await supabase
      .from('coach_protocols_v2')
      .select('*')
      .eq('id', first.protocol_id)
      .single();

    // Get assignment details
    const { data: assignment } = await supabase
      .from('user_coach_protocol_assignments')
      .select('*')
      .eq('id', assignmentId)
      .single();

    const totalDays = (protocol?.total_weeks || 1) * 7;
    const absoluteDay = ((assignment?.current_week || 1) - 1) * 7 + (assignment?.current_day || 1);

    const slotData = {
      assignment: assignment as UserCoachProtocolAssignment,
      protocol: protocol as CoachProtocolV2,
      tasks: assignmentTasks.map((t: any) => ({
        id: t.task_id,
        protocol_id: t.protocol_id,
        week_number: first.current_week,
        day_number: first.current_day,
        task_order: 1,
        title: t.task_title,
        instructions: t.task_instructions,
        task_type: t.task_type,
        time_of_day: t.time_of_day,
        estimated_minutes: t.estimated_minutes,
        resource_url: t.resource_url,
        success_criteria: [],
        created_at: '',
        updated_at: '',
      })) as CoachProtocolTaskV2[],
      completed_task_ids: assignmentTasks
        .filter((t: any) => t.is_completed)
        .map((t: any) => t.task_id),
      total_days: totalDays,
      absolute_day: absoluteDay,
    };

    if (slot === 'primary') {
      result.primary = slotData;
    } else {
      result.secondary = slotData;
    }
  }

  return result;
}

/**
 * Complete a task
 */
export async function completeTask(
  request: CompleteTaskRequest
): Promise<CompleteTaskResponse> {
  const { data, error } = await supabase.rpc('complete_coach_protocol_task', {
    p_assignment_id: request.assignment_id,
    p_task_id: request.task_id,
    p_notes: request.notes,
    p_response_data: request.response_data || {},
    p_time_spent_minutes: request.time_spent_minutes,
    p_self_rating: request.self_rating,
  });

  if (error) throw error;

  const result = data as CompleteTaskResponse;

  // If protocol completed, trigger events
  if (result.protocol_completed) {
    const { data: assignment } = await supabase
      .from('user_coach_protocol_assignments')
      .select('*')
      .eq('id', request.assignment_id)
      .single();

    if (assignment) {
      // Create completion event
      await createCompletionEvent(
        request.assignment_id,
        assignment.user_id,
        assignment.protocol_id,
        'protocol_completed'
      );

      // Resume MIO
      if (assignment.paused_mio_protocol_id) {
        await resumeMIOForUser(assignment.user_id, request.assignment_id);
      }
    }
  }

  return result;
}

/**
 * Advance protocol day (auto-skip to current day)
 */
export async function advanceDay(assignmentId: string): Promise<void> {
  const { error } = await supabase.rpc('advance_coach_protocol_assignment', {
    p_assignment_id: assignmentId,
  });

  if (error) throw error;
}

// =============================================
// MIO INTEGRATION
// =============================================

/**
 * Pause MIO protocol for user when coach protocol is assigned
 *
 * IMPORTANT: This function handles the case where a user might have multiple
 * active MIO protocols. It pauses ALL active protocols to ensure Coach V2
 * takes priority. Returns the ID of the first paused protocol for reference.
 */
export async function pauseMIOForUser(userId: string): Promise<MIOPauseResult> {
  try {
    console.log('[pauseMIOForUser] Starting MIO pause for user:', userId);

    // Find ALL active MIO protocols (don't use .single() - user might have multiple)
    const { data: mioProtocols, error: queryError } = await supabase
      .from('mio_weekly_protocols')
      .select('id, title, status')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (queryError) {
      console.error('[pauseMIOForUser] Query error:', queryError);
      throw queryError;
    }

    // No active protocols is OK - just nothing to pause
    if (!mioProtocols || mioProtocols.length === 0) {
      console.log('[pauseMIOForUser] No active MIO protocols found for user - nothing to pause');
      return { success: true };
    }

    console.log(`[pauseMIOForUser] Found ${mioProtocols.length} active protocol(s):`,
      mioProtocols.map(p => ({ id: p.id, title: p.title?.substring(0, 50) })));

    // Pause ALL active protocols
    const protocolIds = mioProtocols.map(p => p.id);
    const { error: updateError, count } = await supabase
      .from('mio_weekly_protocols')
      .update({ status: 'paused' })
      .in('id', protocolIds);

    if (updateError) {
      console.error('[pauseMIOForUser] Update error:', updateError);
      throw updateError;
    }

    console.log(`[pauseMIOForUser] Successfully paused ${protocolIds.length} protocol(s)`);

    return {
      success: true,
      paused_mio_protocol_id: protocolIds[0], // Return first one for reference
    };
  } catch (err) {
    console.error('[pauseMIOForUser] Error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Resume MIO for user when coach protocol ends
 */
export async function resumeMIOForUser(
  userId: string,
  completedAssignmentId: string
): Promise<MIOResumeResult> {
  try {
    // Get completed assignment details
    const { data: assignment } = await supabase
      .from('user_coach_protocol_assignments')
      .select(`
        *,
        protocol:coach_protocols_v2(title)
      `)
      .eq('id', completedAssignmentId)
      .single();

    // Mark paused MIO as expired (we'll generate a fresh one)
    if (assignment?.paused_mio_protocol_id) {
      await supabase
        .from('mio_weekly_protocols')
        .update({
          status: 'expired',
          paused_by_coach_protocol_id: null,
        })
        .eq('id', assignment.paused_mio_protocol_id);
    }

    // Build context about the completed coach protocol
    const context = assignment ? {
      title: assignment.protocol?.title || 'Unknown',
      days_completed: assignment.days_completed,
      days_skipped: assignment.days_skipped,
      completion_percentage: Math.round(
        (assignment.days_completed / (assignment.days_completed + assignment.days_skipped || 1)) * 100
      ),
    } : undefined;

    // Trigger N8n webhook to generate new MIO protocol
    // This creates a fresh AI-generated protocol with context from completed coach protocol
    const webhookUrl = 'https://n8n-n8n.vq00fr.easypanel.host/webhook/mio-report-generator';

    try {
      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target_type: 'specific_users',
          target_config: {
            user_ids: [userId],
          },
          triggered_by: 'coach_protocol_completion',
          context: context ? {
            completed_protocol_title: context.title,
            days_completed: context.days_completed,
            days_skipped: context.days_skipped,
            completion_percentage: context.completion_percentage,
          } : undefined,
        }),
      });

      if (!webhookResponse.ok) {
        console.warn('[resumeMIOForUser] Webhook returned non-OK status:', webhookResponse.status);
        // Don't fail the function - MIO will be generated on next scheduled run
      } else {
        console.log('[resumeMIOForUser] Successfully triggered MIO generation webhook');
      }
    } catch (webhookErr) {
      console.error('[resumeMIOForUser] Failed to trigger MIO generation webhook:', webhookErr);
      // Don't fail the resume - MIO will be generated on next scheduled run
    }

    return {
      success: true,
      completed_coach_protocol_context: context,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Get coach protocol context for MIO insights
 */
export async function getCoachProtocolContextForMIO(
  userId: string
): Promise<CoachProtocolContextForMIO> {
  const protocols = await getUserActiveProtocols(userId);

  const buildSlotContext = (slot: UserProtocolWithProgress | null) => {
    if (!slot) return undefined;

    return {
      title: slot.protocol.title,
      current_week: slot.assignment.current_week,
      current_day: slot.assignment.current_day,
      completion_rate: slot.progress.completion_percentage,
      today_tasks: [], // Will be populated from today's tasks
      week_theme: undefined,
    };
  };

  // Get recent completions
  const { data: recentCompletions } = await supabase
    .from('coach_protocol_completions')
    .select(`
      notes,
      completed_at,
      task:coach_protocol_tasks_v2(title)
    `)
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
    .limit(5);

  return {
    has_active_protocol: !!(protocols.primary || protocols.secondary),
    primary_protocol: buildSlotContext(protocols.primary),
    secondary_protocol: buildSlotContext(protocols.secondary),
    recent_completions: (recentCompletions || []).map((c: any) => ({
      task_title: c.task?.title || 'Unknown',
      notes: c.notes,
      completed_at: c.completed_at,
    })),
  };
}

// =============================================
// DASHBOARD OPERATIONS
// =============================================

/**
 * Get dashboard stats for a protocol
 */
export async function getDashboardStats(
  protocolId: string
): Promise<CoachProtocolDashboardStats> {
  const { data, error } = await supabase
    .from('user_coach_protocol_assignments')
    .select('status, days_completed, days_skipped, started_at, completed_at')
    .eq('protocol_id', protocolId);

  if (error) throw error;

  const assignments = data || [];
  const total = assignments.length;
  const active = assignments.filter((a) => a.status === 'active').length;
  const completed = assignments.filter((a) => a.status === 'completed').length;
  const abandoned = assignments.filter((a) => a.status === 'abandoned').length;
  const expired = assignments.filter((a) => a.status === 'expired').length;

  // Calculate average completion rate
  const completionRates = assignments
    .filter((a) => a.status === 'completed')
    .map((a) => {
      const totalDays = a.days_completed + a.days_skipped;
      return totalDays > 0 ? (a.days_completed / totalDays) * 100 : 0;
    });

  const avgCompletionRate =
    completionRates.length > 0
      ? completionRates.reduce((sum, r) => sum + r, 0) / completionRates.length
      : 0;

  // Calculate average days to complete
  const completionTimes = assignments
    .filter((a) => a.status === 'completed' && a.started_at && a.completed_at)
    .map((a) => {
      const start = new Date(a.started_at!);
      const end = new Date(a.completed_at!);
      return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    });

  const avgDaysToComplete =
    completionTimes.length > 0
      ? completionTimes.reduce((sum, d) => sum + d, 0) / completionTimes.length
      : 0;

  return {
    total_assigned: total,
    active,
    completed,
    abandoned,
    expired,
    avg_completion_rate: Math.round(avgCompletionRate),
    avg_days_to_complete: Math.round(avgDaysToComplete),
  };
}

/**
 * Get assignments with progress for dashboard
 */
export async function getDashboardAssignments(
  protocolId: string,
  filters?: DashboardFilters
): Promise<DashboardAssignmentWithProgress[]> {
  let query = supabase
    .from('user_coach_protocol_assignments')
    .select(`
      *,
      user:user_profiles!user_coach_protocol_assignments_user_id_fkey(id, full_name, email),
      protocol:coach_protocols_v2(total_weeks)
    `)
    .eq('protocol_id', protocolId);

  if (filters?.status && filters.status.length > 0) {
    query = query.in('status', filters.status);
  }
  if (filters?.week) {
    query = query.eq('current_week', filters.week);
  }

  const { data, error } = await query.order('assigned_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((item: any) => {
    const totalDays = (item.protocol?.total_weeks || 1) * 7;
    const absoluteDay = (item.current_week - 1) * 7 + item.current_day;
    const expectedDay = calculateExpectedDay(item.started_at);
    const daysBehind = Math.max(0, expectedDay - absoluteDay);

    return {
      assignment: item as UserCoachProtocolAssignment,
      user: {
        id: item.user?.id || '',
        full_name: item.user?.full_name || 'Unknown',
        email: item.user?.email || '',
      },
      progress: {
        absolute_day: absoluteDay,
        total_days: totalDays,
        completion_percentage: Math.min((absoluteDay / totalDays) * 100, 100),
        is_behind: daysBehind > 0,
        days_behind: daysBehind,
      },
      last_activity: item.last_advanced_at || item.assigned_at,
    };
  });
}

// =============================================
// HELPER FUNCTIONS
// =============================================

/**
 * Calculate expected day based on start date
 */
function calculateExpectedDay(startedAt: string | null): number {
  if (!startedAt) return 1;

  const start = new Date(startedAt);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  return Math.max(1, diffDays + 1);
}

/**
 * Create a completion event for analytics
 */
async function createCompletionEvent(
  assignmentId: string,
  userId: string,
  protocolId: string,
  eventType: 'protocol_started' | 'week_completed' | 'protocol_completed' | 'protocol_abandoned' | 'protocol_expired'
): Promise<void> {
  // Get protocol coach
  const { data: protocol } = await supabase
    .from('coach_protocols_v2')
    .select('coach_id')
    .eq('id', protocolId)
    .single();

  // Get assignment stats
  const { data: assignment } = await supabase
    .from('user_coach_protocol_assignments')
    .select('days_completed, days_skipped')
    .eq('id', assignmentId)
    .single();

  const totalDays = (assignment?.days_completed || 0) + (assignment?.days_skipped || 0);
  const completionPercentage = totalDays > 0
    ? ((assignment?.days_completed || 0) / totalDays) * 100
    : 0;

  await supabase.from('coach_protocol_completion_events').insert({
    assignment_id: assignmentId,
    user_id: userId,
    protocol_id: protocolId,
    coach_id: protocol?.coach_id,
    event_type: eventType,
    days_completed: assignment?.days_completed || 0,
    days_skipped: assignment?.days_skipped || 0,
    completion_percentage: Math.round(completionPercentage),
  });
}

/**
 * Subscribe to protocol updates for a user (real-time)
 */
export function subscribeToProtocolUpdates(
  userId: string,
  onUpdate: (payload: any) => void
) {
  return supabase
    .channel(`coach-protocol-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_coach_protocol_assignments',
        filter: `user_id=eq.${userId}`,
      },
      onUpdate
    )
    .subscribe();
}

/**
 * Get task titles for each day in the current week (for roadmap display)
 * Returns array of 7 titles, one per day (first task title for each day)
 *
 * Behavioral Science: Shows users what's coming without overwhelming them
 * with full task details. Creates anticipation without cognitive overload.
 */
export async function getWeekDayTitles(
  protocolId: string,
  weekNumber: number
): Promise<string[]> {
  const { data, error } = await supabase
    .from('coach_protocol_tasks_v2')
    .select('day_number, title')
    .eq('protocol_id', protocolId)
    .eq('week_number', weekNumber)
    .order('day_number')
    .order('task_order');

  if (error) {
    console.error('Error fetching week day titles:', error);
    return [];
  }

  // Get first task title for each day (days 1-7)
  const titles: string[] = [];
  for (let day = 1; day <= 7; day++) {
    const dayTask = data?.find(t => t.day_number === day);
    titles.push(dayTask?.title || `Day ${day}`);
  }
  return titles;
}
