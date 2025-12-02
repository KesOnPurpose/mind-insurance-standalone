// Admin Protocol Service
// Phase 27: CRUD operations for Coach Protocols and MIO Reports

import { supabase } from '@/integrations/supabase/client';
import type {
  CoachProtocol,
  CoachProtocolTask,
  CoachProtocolWithTasks,
  CreateCoachProtocolForm,
  CreateCoachTaskForm,
  MIOUserReport,
  CreateMIOReportForm,
  CoachProtocolStatus,
  MIOReportDisplayStatus,
} from '@/types/protocol';

// =============================================
// Coach Protocol CRUD Operations
// =============================================

/**
 * Get all coach protocols (for admin dashboard)
 */
export async function getAllCoachProtocols(): Promise<CoachProtocol[]> {
  const { data, error } = await supabase
    .from('coach_protocols')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching coach protocols:', error);
    throw new Error(`Failed to fetch coach protocols: ${error.message}`);
  }

  return (data || []) as CoachProtocol[];
}

/**
 * Get a single coach protocol with its tasks
 */
export async function getCoachProtocolWithTasks(
  protocolId: string
): Promise<CoachProtocolWithTasks | null> {
  // Fetch protocol
  const { data: protocol, error: protocolError } = await supabase
    .from('coach_protocols')
    .select('*')
    .eq('id', protocolId)
    .single();

  if (protocolError) {
    console.error('Error fetching coach protocol:', protocolError);
    return null;
  }

  // Fetch tasks
  const { data: tasks, error: tasksError } = await supabase
    .from('coach_protocol_tasks')
    .select('*')
    .eq('protocol_id', protocolId)
    .order('day_number', { ascending: true })
    .order('task_order', { ascending: true });

  if (tasksError) {
    console.error('Error fetching protocol tasks:', tasksError);
  }

  return {
    ...(protocol as CoachProtocol),
    tasks: (tasks || []) as CoachProtocolTask[],
  };
}

/**
 * Create a new coach protocol
 */
export async function createCoachProtocol(
  form: CreateCoachProtocolForm,
  coachId: string
): Promise<CoachProtocol> {
  const { data, error } = await supabase
    .from('coach_protocols')
    .insert({
      ...form,
      coach_id: coachId,
      status: 'draft',
      version: 1,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating coach protocol:', error);
    throw new Error(`Failed to create protocol: ${error.message}`);
  }

  return data as CoachProtocol;
}

/**
 * Update a coach protocol
 */
export async function updateCoachProtocol(
  protocolId: string,
  updates: Partial<CreateCoachProtocolForm>
): Promise<CoachProtocol> {
  const { data, error } = await supabase
    .from('coach_protocols')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', protocolId)
    .select()
    .single();

  if (error) {
    console.error('Error updating coach protocol:', error);
    throw new Error(`Failed to update protocol: ${error.message}`);
  }

  return data as CoachProtocol;
}

/**
 * Update coach protocol status (draft, published, archived)
 */
export async function updateCoachProtocolStatus(
  protocolId: string,
  status: CoachProtocolStatus
): Promise<CoachProtocol> {
  const updates: Partial<CoachProtocol> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'published') {
    updates.published_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('coach_protocols')
    .update(updates)
    .eq('id', protocolId)
    .select()
    .single();

  if (error) {
    console.error('Error updating protocol status:', error);
    throw new Error(`Failed to update protocol status: ${error.message}`);
  }

  return data as CoachProtocol;
}

/**
 * Delete a coach protocol (and its tasks via cascade)
 */
export async function deleteCoachProtocol(protocolId: string): Promise<void> {
  const { error } = await supabase
    .from('coach_protocols')
    .delete()
    .eq('id', protocolId);

  if (error) {
    console.error('Error deleting coach protocol:', error);
    throw new Error(`Failed to delete protocol: ${error.message}`);
  }
}

// =============================================
// Coach Protocol Task CRUD Operations
// =============================================

/**
 * Create a task for a protocol
 */
export async function createCoachTask(
  protocolId: string,
  form: CreateCoachTaskForm
): Promise<CoachProtocolTask> {
  const { data, error } = await supabase
    .from('coach_protocol_tasks')
    .insert({
      ...form,
      protocol_id: protocolId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating coach task:', error);
    throw new Error(`Failed to create task: ${error.message}`);
  }

  return data as CoachProtocolTask;
}

/**
 * Update a task
 */
export async function updateCoachTask(
  taskId: string,
  updates: Partial<CreateCoachTaskForm>
): Promise<CoachProtocolTask> {
  const { data, error } = await supabase
    .from('coach_protocol_tasks')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single();

  if (error) {
    console.error('Error updating coach task:', error);
    throw new Error(`Failed to update task: ${error.message}`);
  }

  return data as CoachProtocolTask;
}

/**
 * Delete a task
 */
export async function deleteCoachTask(taskId: string): Promise<void> {
  const { error } = await supabase
    .from('coach_protocol_tasks')
    .delete()
    .eq('id', taskId);

  if (error) {
    console.error('Error deleting coach task:', error);
    throw new Error(`Failed to delete task: ${error.message}`);
  }
}

/**
 * Bulk create tasks for a protocol (for 7-day setup)
 */
export async function bulkCreateCoachTasks(
  protocolId: string,
  tasks: CreateCoachTaskForm[]
): Promise<CoachProtocolTask[]> {
  const tasksWithProtocolId = tasks.map((task) => ({
    ...task,
    protocol_id: protocolId,
  }));

  const { data, error } = await supabase
    .from('coach_protocol_tasks')
    .insert(tasksWithProtocolId)
    .select();

  if (error) {
    console.error('Error bulk creating tasks:', error);
    throw new Error(`Failed to create tasks: ${error.message}`);
  }

  return (data || []) as CoachProtocolTask[];
}

// =============================================
// MIO Report CRUD Operations
// =============================================

/**
 * Get all MIO reports (admin view - across all users)
 */
export async function getAllMIOReports(options?: {
  limit?: number;
  offset?: number;
  reportType?: string;
  userId?: string;
}): Promise<MIOUserReport[]> {
  let query = supabase
    .from('mio_user_reports')
    .select('*')
    .order('created_at', { ascending: false });

  if (options?.reportType) {
    query = query.eq('report_type', options.reportType);
  }

  if (options?.userId) {
    query = query.eq('user_id', options.userId);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching MIO reports:', error);
    throw new Error(`Failed to fetch MIO reports: ${error.message}`);
  }

  return (data || []) as MIOUserReport[];
}

/**
 * Get MIO reports for a specific user
 */
export async function getUserMIOReports(
  userId: string,
  options?: {
    status?: MIOReportDisplayStatus;
    limit?: number;
  }
): Promise<MIOUserReport[]> {
  let query = supabase
    .from('mio_user_reports')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (options?.status) {
    query = query.eq('display_status', options.status);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching user MIO reports:', error);
    throw new Error(`Failed to fetch user reports: ${error.message}`);
  }

  return (data || []) as MIOUserReport[];
}

/**
 * Get a single MIO report by ID
 */
export async function getMIOReport(reportId: string): Promise<MIOUserReport | null> {
  const { data, error } = await supabase
    .from('mio_user_reports')
    .select('*')
    .eq('id', reportId)
    .single();

  if (error) {
    console.error('Error fetching MIO report:', error);
    return null;
  }

  return data as MIOUserReport;
}

/**
 * Create a new MIO report (used by admin or n8n webhook)
 */
export async function createMIOReport(form: CreateMIOReportForm): Promise<MIOUserReport> {
  const { data, error } = await supabase
    .from('mio_user_reports')
    .insert({
      ...form,
      source: form.source || 'manual',
      priority: form.priority || 'normal',
      display_status: 'unread',
      pinned: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating MIO report:', error);
    throw new Error(`Failed to create report: ${error.message}`);
  }

  return data as MIOUserReport;
}

/**
 * Update MIO report display status
 */
export async function updateMIOReportStatus(
  reportId: string,
  status: MIOReportDisplayStatus
): Promise<MIOUserReport> {
  const updates: Partial<MIOUserReport> = {
    display_status: status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'read') {
    updates.read_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('mio_user_reports')
    .update(updates)
    .eq('id', reportId)
    .select()
    .single();

  if (error) {
    console.error('Error updating report status:', error);
    throw new Error(`Failed to update report status: ${error.message}`);
  }

  return data as MIOUserReport;
}

/**
 * Pin/unpin a MIO report
 */
export async function toggleMIOReportPin(
  reportId: string,
  pinned: boolean
): Promise<MIOUserReport> {
  const { data, error } = await supabase
    .from('mio_user_reports')
    .update({
      pinned,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId)
    .select()
    .single();

  if (error) {
    console.error('Error toggling report pin:', error);
    throw new Error(`Failed to toggle pin: ${error.message}`);
  }

  return data as MIOUserReport;
}

/**
 * Add user feedback/rating to a report
 */
export async function addMIOReportFeedback(
  reportId: string,
  rating?: number,
  feedback?: string
): Promise<MIOUserReport> {
  const { data, error } = await supabase
    .from('mio_user_reports')
    .update({
      user_rating: rating,
      user_feedback: feedback,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId)
    .select()
    .single();

  if (error) {
    console.error('Error adding report feedback:', error);
    throw new Error(`Failed to add feedback: ${error.message}`);
  }

  return data as MIOUserReport;
}

/**
 * Delete a MIO report (admin only)
 */
export async function deleteMIOReport(reportId: string): Promise<void> {
  const { error } = await supabase
    .from('mio_user_reports')
    .delete()
    .eq('id', reportId);

  if (error) {
    console.error('Error deleting MIO report:', error);
    throw new Error(`Failed to delete report: ${error.message}`);
  }
}

/**
 * Get unread report count for a user
 */
export async function getUnreadReportCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('mio_user_reports')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('display_status', 'unread');

  if (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }

  return count || 0;
}

// =============================================
// Helper Functions
// =============================================

/**
 * Get protocol statistics for admin dashboard
 */
export async function getProtocolStats(): Promise<{
  totalProtocols: number;
  publishedProtocols: number;
  draftProtocols: number;
  totalReports: number;
  unreadReports: number;
}> {
  // Get protocol counts
  const { data: protocols } = await supabase
    .from('coach_protocols')
    .select('status');

  const totalProtocols = protocols?.length || 0;
  const publishedProtocols = protocols?.filter((p) => p.status === 'published').length || 0;
  const draftProtocols = protocols?.filter((p) => p.status === 'draft').length || 0;

  // Get report counts
  const { count: totalReports } = await supabase
    .from('mio_user_reports')
    .select('*', { count: 'exact', head: true });

  const { count: unreadReports } = await supabase
    .from('mio_user_reports')
    .select('*', { count: 'exact', head: true })
    .eq('display_status', 'unread');

  return {
    totalProtocols,
    publishedProtocols,
    draftProtocols,
    totalReports: totalReports || 0,
    unreadReports: unreadReports || 0,
  };
}

/**
 * Duplicate a coach protocol (for creating variations)
 */
export async function duplicateCoachProtocol(
  protocolId: string,
  coachId: string,
  newTitle?: string
): Promise<CoachProtocolWithTasks> {
  // Fetch original protocol with tasks
  const original = await getCoachProtocolWithTasks(protocolId);
  if (!original) {
    throw new Error('Protocol not found');
  }

  // Create new protocol
  const newProtocol = await createCoachProtocol(
    {
      title: newTitle || `${original.title} (Copy)`,
      description: original.description,
      schedule_type: original.schedule_type,
      cycle_week_number: original.cycle_week_number,
      visibility: original.visibility,
      target_tiers: original.target_tiers,
      target_users: original.target_users,
      theme_color: original.theme_color,
    },
    coachId
  );

  // Create tasks for new protocol
  if (original.tasks.length > 0) {
    const taskForms: CreateCoachTaskForm[] = original.tasks.map((task) => ({
      day_number: task.day_number,
      task_order: task.task_order,
      title: task.title,
      instructions: task.instructions,
      task_type: task.task_type,
      estimated_duration: task.estimated_duration,
      resource_url: task.resource_url,
      document_id: task.document_id,
    }));

    await bulkCreateCoachTasks(newProtocol.id, taskForms);
  }

  // Return the new protocol with tasks
  return (await getCoachProtocolWithTasks(newProtocol.id))!;
}
