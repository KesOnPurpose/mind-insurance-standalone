// Coach Protocol Service - Manual Protocols from Coaches
// Phase 26: Weekly Insights Feature

import { supabase } from '@/integrations/supabase/client';
import type {
  CoachProtocol,
  CoachProtocolTask,
  UserCoachProtocolProgress,
  CoachProtocolWithTasks,
  CompleteCoachTaskRequest,
} from '@/types/protocol';

// =============================================
// Coach Protocols
// =============================================

/**
 * Get the current active coach protocol for a user
 * Considers user tier, schedule type, and current week
 */
export async function getCurrentCoachProtocol(
  userId: string,
  userTier?: string
): Promise<CoachProtocolWithTasks | null> {
  // Calculate current week number
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(
    ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
  );

  // Build query for published protocols
  let query = supabase
    .from('coach_protocols')
    .select('*')
    .eq('status', 'published');

  // Filter by schedule type and week
  // Priority: date_specific > weekly_cycle > evergreen
  const { data: protocols, error: protocolError } = await query
    .order('schedule_type', { ascending: true }) // date_specific first
    .order('created_at', { ascending: false });

  if (protocolError) {
    console.error('Error fetching coach protocols:', protocolError);
    throw protocolError;
  }

  if (!protocols || protocols.length === 0) {
    return null;
  }

  // Find the best matching protocol
  let selectedProtocol: CoachProtocol | null = null;

  for (const p of protocols) {
    // Check visibility
    if (p.visibility === 'tier_based' && userTier) {
      if (!p.target_tiers.includes(userTier)) continue;
    }
    if (p.visibility === 'individual') {
      if (!p.target_users.includes(userId)) continue;
    }

    // Check schedule
    if (p.schedule_type === 'date_specific') {
      const startDate = new Date(p.start_date);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);

      if (now >= startDate && now < endDate) {
        selectedProtocol = p as CoachProtocol;
        break;
      }
    } else if (p.schedule_type === 'weekly_cycle') {
      // Match by week number (1-52 cycle)
      if (p.cycle_week_number === weekNumber % 52 || p.cycle_week_number === weekNumber) {
        selectedProtocol = p as CoachProtocol;
        break;
      }
    } else if (p.schedule_type === 'evergreen') {
      // Evergreen is always valid, but lowest priority
      if (!selectedProtocol) {
        selectedProtocol = p as CoachProtocol;
      }
    }
  }

  if (!selectedProtocol) {
    return null;
  }

  // Get tasks for this protocol
  const { data: tasks, error: tasksError } = await supabase
    .from('coach_protocol_tasks')
    .select('*')
    .eq('protocol_id', selectedProtocol.id)
    .order('day_number', { ascending: true })
    .order('task_order', { ascending: true });

  if (tasksError) {
    console.error('Error fetching coach tasks:', tasksError);
    throw tasksError;
  }

  // Get user progress for these tasks
  const taskIds = (tasks || []).map(t => t.id);
  const { data: progress, error: progressError } = await supabase
    .from('user_coach_protocol_progress')
    .select('*')
    .eq('user_id', userId)
    .in('task_id', taskIds);

  if (progressError) {
    console.error('Error fetching coach progress:', progressError);
    throw progressError;
  }

  return {
    ...selectedProtocol,
    tasks: (tasks || []) as CoachProtocolTask[],
    progress: (progress || []) as UserCoachProtocolProgress[],
  };
}

/**
 * Get all published coach protocols
 */
export async function getAllCoachProtocols(): Promise<CoachProtocol[]> {
  const { data, error } = await supabase
    .from('coach_protocols')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all coach protocols:', error);
    throw error;
  }

  return (data || []) as CoachProtocol[];
}

/**
 * Get tasks for a specific coach protocol
 */
export async function getCoachProtocolTasks(
  protocolId: string
): Promise<CoachProtocolTask[]> {
  const { data, error } = await supabase
    .from('coach_protocol_tasks')
    .select('*')
    .eq('protocol_id', protocolId)
    .order('day_number', { ascending: true })
    .order('task_order', { ascending: true });

  if (error) {
    console.error('Error fetching coach tasks:', error);
    throw error;
  }

  return (data || []) as CoachProtocolTask[];
}

/**
 * Get today's coach task for a user
 */
export async function getTodaysCoachTask(
  userId: string,
  userTier?: string
): Promise<{ task: CoachProtocolTask; protocol: CoachProtocol; completed: boolean } | null> {
  const protocol = await getCurrentCoachProtocol(userId, userTier);
  if (!protocol || !protocol.tasks.length) {
    return null;
  }

  // Calculate which day of the week (1-7)
  // If protocol has a start_date, calculate days since start
  // Otherwise, use day of week (Monday = 1)
  let dayNumber: number;

  if (protocol.schedule_type === 'date_specific' && protocol.start_date) {
    const startDate = new Date(protocol.start_date);
    const now = new Date();
    const daysSinceStart = Math.floor(
      (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    dayNumber = (daysSinceStart % 7) + 1; // 1-7
  } else {
    // Use day of week (Monday = 1, Sunday = 7)
    const now = new Date();
    const dayOfWeek = now.getDay();
    dayNumber = dayOfWeek === 0 ? 7 : dayOfWeek;
  }

  // Find today's task(s)
  const todaysTasks = protocol.tasks.filter(t => t.day_number === dayNumber);
  if (todaysTasks.length === 0) {
    return null;
  }

  // Get the first uncompleted task, or the first task if all completed
  const progress = protocol.progress || [];
  const completedTaskIds = new Set(progress.filter(p => p.completed).map(p => p.task_id));

  let selectedTask = todaysTasks.find(t => !completedTaskIds.has(t.id));
  if (!selectedTask) {
    selectedTask = todaysTasks[0];
  }

  return {
    task: selectedTask,
    protocol: {
      id: protocol.id,
      title: protocol.title,
      description: protocol.description,
      coach_id: protocol.coach_id,
      schedule_type: protocol.schedule_type,
      cycle_week_number: protocol.cycle_week_number,
      start_date: protocol.start_date,
      visibility: protocol.visibility,
      target_tiers: protocol.target_tiers,
      target_users: protocol.target_users,
      status: protocol.status,
      version: protocol.version,
      published_at: protocol.published_at,
      theme_color: protocol.theme_color,
      created_at: protocol.created_at,
      updated_at: protocol.updated_at,
    },
    completed: completedTaskIds.has(selectedTask.id),
  };
}

/**
 * Complete a coach protocol task
 */
export async function completeCoachTask(
  userId: string,
  request: CompleteCoachTaskRequest
): Promise<UserCoachProtocolProgress> {
  // Get the task to find protocol_id
  const { data: task, error: taskError } = await supabase
    .from('coach_protocol_tasks')
    .select('protocol_id')
    .eq('id', request.task_id)
    .single();

  if (taskError || !task) {
    console.error('Error fetching task:', taskError);
    throw taskError || new Error('Task not found');
  }

  // Check if progress already exists
  const { data: existing } = await supabase
    .from('user_coach_protocol_progress')
    .select('id')
    .eq('user_id', userId)
    .eq('task_id', request.task_id)
    .maybeSingle();

  if (existing) {
    // Update existing
    const { data, error } = await supabase
      .from('user_coach_protocol_progress')
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
        notes: request.notes,
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating coach progress:', error);
      throw error;
    }

    return data as UserCoachProtocolProgress;
  } else {
    // Create new
    const { data, error } = await supabase
      .from('user_coach_protocol_progress')
      .insert({
        user_id: userId,
        protocol_id: task.protocol_id,
        task_id: request.task_id,
        completed: true,
        completed_at: new Date().toISOString(),
        notes: request.notes,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating coach progress:', error);
      throw error;
    }

    return data as UserCoachProtocolProgress;
  }
}

/**
 * Get user's progress for a coach protocol
 */
export async function getCoachProtocolProgress(
  userId: string,
  protocolId: string
): Promise<{
  totalTasks: number;
  completedTasks: number;
  progressPercent: number;
  dayProgress: { day: number; completed: number; total: number }[];
}> {
  // Get all tasks for the protocol
  const { data: tasks, error: tasksError } = await supabase
    .from('coach_protocol_tasks')
    .select('id, day_number')
    .eq('protocol_id', protocolId);

  if (tasksError) {
    console.error('Error fetching tasks:', tasksError);
    throw tasksError;
  }

  // Get user's completed tasks
  const taskIds = (tasks || []).map(t => t.id);
  const { data: progress, error: progressError } = await supabase
    .from('user_coach_protocol_progress')
    .select('task_id, completed')
    .eq('user_id', userId)
    .in('task_id', taskIds);

  if (progressError) {
    console.error('Error fetching progress:', progressError);
    throw progressError;
  }

  const completedTaskIds = new Set(
    (progress || []).filter(p => p.completed).map(p => p.task_id)
  );

  const totalTasks = tasks?.length || 0;
  const completedTasks = completedTaskIds.size;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Calculate per-day progress
  const dayMap = new Map<number, { completed: number; total: number }>();
  (tasks || []).forEach(task => {
    const current = dayMap.get(task.day_number) || { completed: 0, total: 0 };
    current.total++;
    if (completedTaskIds.has(task.id)) {
      current.completed++;
    }
    dayMap.set(task.day_number, current);
  });

  const dayProgress = Array.from(dayMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([day, stats]) => ({ day, ...stats }));

  return {
    totalTasks,
    completedTasks,
    progressPercent,
    dayProgress,
  };
}

// =============================================
// Coach Management (for coaches/admins)
// =============================================

/**
 * Create a new coach protocol (coach only)
 */
export async function createCoachProtocol(
  coachId: string,
  protocol: Omit<CoachProtocol, 'id' | 'coach_id' | 'created_at' | 'updated_at'>
): Promise<CoachProtocol> {
  const { data, error } = await supabase
    .from('coach_protocols')
    .insert({
      ...protocol,
      coach_id: coachId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating coach protocol:', error);
    throw error;
  }

  return data as CoachProtocol;
}

/**
 * Add tasks to a coach protocol
 */
export async function addCoachProtocolTasks(
  protocolId: string,
  tasks: Omit<CoachProtocolTask, 'id' | 'protocol_id' | 'created_at'>[]
): Promise<CoachProtocolTask[]> {
  const { data, error } = await supabase
    .from('coach_protocol_tasks')
    .insert(
      tasks.map(t => ({
        ...t,
        protocol_id: protocolId,
      }))
    )
    .select();

  if (error) {
    console.error('Error adding coach tasks:', error);
    throw error;
  }

  return (data || []) as CoachProtocolTask[];
}

/**
 * Publish a coach protocol (make it visible to users)
 */
export async function publishCoachProtocol(
  protocolId: string,
  coachId: string
): Promise<CoachProtocol> {
  const { data, error } = await supabase
    .from('coach_protocols')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
    })
    .eq('id', protocolId)
    .eq('coach_id', coachId)
    .select()
    .single();

  if (error) {
    console.error('Error publishing coach protocol:', error);
    throw error;
  }

  return data as CoachProtocol;
}

/**
 * Archive a coach protocol (hide from users)
 */
export async function archiveCoachProtocol(
  protocolId: string,
  coachId: string
): Promise<void> {
  const { error } = await supabase
    .from('coach_protocols')
    .update({ status: 'archived' })
    .eq('id', protocolId)
    .eq('coach_id', coachId);

  if (error) {
    console.error('Error archiving coach protocol:', error);
    throw error;
  }
}
