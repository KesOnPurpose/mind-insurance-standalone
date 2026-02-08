// =============================================================================
// BROADCAST SERVICE
// API service for managing notification broadcasts
// =============================================================================

import { supabase } from '@/integrations/supabase/client';
import {
  NotificationBroadcast,
  BroadcastDelivery,
  UserNotificationGroup,
  GroupMember,
  UserNotificationPreferences,
  BroadcastAuditLog,
  PendingBroadcast,
  BroadcastStatistics,
  CreateBroadcastInput,
  UpdateBroadcastInput,
  CreateGroupInput,
  UpdateGroupInput,
  AddGroupMembersInput,
  UpdatePreferencesInput,
  BroadcastWithCreator,
  AuditAction,
  BroadcastStatus,
} from '@/types/broadcast';
import { v4 as uuidv4 } from 'uuid';

// =============================================================================
// BROADCAST CRUD OPERATIONS
// =============================================================================

/**
 * Get all broadcasts with optional filtering
 */
export async function getBroadcasts(options?: {
  status?: BroadcastStatus | BroadcastStatus[];
  limit?: number;
  offset?: number;
}): Promise<{ data: BroadcastWithCreator[] | null; error: Error | null }> {
  try {
    let query = supabase
      .from('notification_broadcasts')
      .select('*')
      .order('created_at', { ascending: false });

    if (options?.status) {
      if (Array.isArray(options.status)) {
        query = query.in('status', options.status);
      } else {
        query = query.eq('status', options.status);
      }
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { data: data as BroadcastWithCreator[], error: null };
  } catch (error) {
    console.error('Error fetching broadcasts:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get a single broadcast by ID
 */
export async function getBroadcastById(
  id: string
): Promise<{ data: NotificationBroadcast | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('notification_broadcasts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data: data as NotificationBroadcast, error: null };
  } catch (error) {
    console.error('Error fetching broadcast:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Create a new broadcast
 */
export async function createBroadcast(
  input: CreateBroadcastInput
): Promise<{ data: NotificationBroadcast | null; error: Error | null }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check rate limit
    const { data: canCreate } = await supabase.rpc('check_broadcast_rate_limit', {
      p_user_id: user.id,
    });

    if (!canCreate) {
      throw new Error('Rate limit exceeded. Maximum 5 broadcasts per hour.');
    }

    const broadcastData = {
      ...input,
      created_by: user.id,
      idempotency_key: `${user.id}-${Date.now()}-${uuidv4().slice(0, 8)}`,
      status: input.scheduled_for ? 'scheduled' : 'draft',
    };

    const { data, error } = await supabase
      .from('notification_broadcasts')
      .insert(broadcastData)
      .select()
      .single();

    if (error) throw error;

    // Log audit
    await logAuditEvent(data.id, 'created', { input });

    return { data: data as NotificationBroadcast, error: null };
  } catch (error) {
    console.error('Error creating broadcast:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Update an existing broadcast
 */
export async function updateBroadcast(
  input: UpdateBroadcastInput
): Promise<{ data: NotificationBroadcast | null; error: Error | null }> {
  try {
    const { id, ...updateData } = input;

    const { data, error } = await supabase
      .from('notification_broadcasts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return { data: data as NotificationBroadcast, error: null };
  } catch (error) {
    console.error('Error updating broadcast:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Delete a broadcast
 */
export async function deleteBroadcast(
  id: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase.from('notification_broadcasts').delete().eq('id', id);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting broadcast:', error);
    return { success: false, error: error as Error };
  }
}

// =============================================================================
// BROADCAST ACTIONS
// =============================================================================

/**
 * Submit a broadcast for approval (for global broadcasts)
 */
export async function submitForApproval(
  id: string
): Promise<{ data: NotificationBroadcast | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('notification_broadcasts')
      .update({ status: 'pending_approval' })
      .eq('id', id)
      .eq('status', 'draft')
      .select()
      .single();

    if (error) throw error;

    await logAuditEvent(id, 'submitted', {});

    return { data: data as NotificationBroadcast, error: null };
  } catch (error) {
    console.error('Error submitting for approval:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Approve a broadcast (for super admins)
 */
export async function approveBroadcast(
  id: string
): Promise<{ data: NotificationBroadcast | null; error: Error | null }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get current broadcast to verify it's pending approval
    const { data: current } = await supabase
      .from('notification_broadcasts')
      .select('created_by, status')
      .eq('id', id)
      .single();

    if (!current) throw new Error('Broadcast not found');
    if (current.status !== 'pending_approval') {
      throw new Error('Broadcast is not pending approval');
    }

    // Four-eyes principle: approver must be different from creator
    if (current.created_by === user.id) {
      throw new Error('Cannot approve your own broadcast');
    }

    const { data, error } = await supabase
      .from('notification_broadcasts')
      .update({
        status: 'approved',
        approved_by: user.id,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await logAuditEvent(id, 'approved', {});

    return { data: data as NotificationBroadcast, error: null };
  } catch (error) {
    console.error('Error approving broadcast:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Reject a broadcast
 */
export async function rejectBroadcast(
  id: string,
  reason?: string
): Promise<{ data: NotificationBroadcast | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('notification_broadcasts')
      .update({ status: 'draft' })
      .eq('id', id)
      .eq('status', 'pending_approval')
      .select()
      .single();

    if (error) throw error;

    await logAuditEvent(id, 'rejected', { reason });

    return { data: data as NotificationBroadcast, error: null };
  } catch (error) {
    console.error('Error rejecting broadcast:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Send a broadcast immediately
 */
export async function sendBroadcast(
  id: string
): Promise<{ success: boolean; recipientCount: number; error: Error | null }> {
  try {
    // Resolve recipients
    const { data: recipientIds } = await supabase.rpc('resolve_broadcast_recipients', {
      p_broadcast_id: id,
    });

    if (!recipientIds || recipientIds.length === 0) {
      throw new Error('No recipients found for broadcast');
    }

    // Update broadcast status
    await supabase
      .from('notification_broadcasts')
      .update({
        status: 'sending',
        total_recipients: recipientIds.length,
        sent_at: new Date().toISOString(),
      })
      .eq('id', id);

    // Create delivery records in batches
    const BATCH_SIZE = 500;
    let deliveredCount = 0;

    for (let i = 0; i < recipientIds.length; i += BATCH_SIZE) {
      const batch = recipientIds.slice(i, i + BATCH_SIZE);
      const deliveries = batch.map((userId: string) => ({
        broadcast_id: id,
        user_id: userId,
        status: 'delivered',
        delivered_at: new Date().toISOString(),
      }));

      const { error: insertError } = await supabase
        .from('notification_broadcast_deliveries')
        .upsert(deliveries, { onConflict: 'broadcast_id,user_id' });

      if (insertError) {
        console.error('Error inserting delivery batch:', insertError);
      } else {
        deliveredCount += batch.length;
      }

      // Update progress
      await supabase
        .from('notification_broadcasts')
        .update({ delivered_count: deliveredCount })
        .eq('id', id);
    }

    // Mark as sent
    await supabase.from('notification_broadcasts').update({ status: 'sent' }).eq('id', id);

    await logAuditEvent(id, 'sent', { recipient_count: deliveredCount });

    return { success: true, recipientCount: deliveredCount, error: null };
  } catch (error) {
    console.error('Error sending broadcast:', error);

    // Mark as draft on failure
    await supabase.from('notification_broadcasts').update({ status: 'draft' }).eq('id', id);

    return { success: false, recipientCount: 0, error: error as Error };
  }
}

/**
 * Send a broadcast via Edge Function (server-side processing)
 * This is preferred for large broadcasts as it handles batching on the server
 */
export async function sendBroadcastViaEdgeFunction(
  id: string
): Promise<{ success: boolean; recipientCount: number; error: Error | null }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      throw new Error('Not authenticated');
    }

    const response = await supabase.functions.invoke('send-broadcast', {
      body: { broadcast_id: id },
    });

    if (response.error) {
      throw new Error(response.error.message || 'Failed to send broadcast');
    }

    const data = response.data as { success: boolean; recipients_delivered: number; total_recipients: number };

    if (!data.success) {
      throw new Error('Broadcast sending failed');
    }

    return {
      success: true,
      recipientCount: data.recipients_delivered,
      error: null,
    };
  } catch (error) {
    console.error('Error sending broadcast via Edge Function:', error);
    return { success: false, recipientCount: 0, error: error as Error };
  }
}

/**
 * Cancel a scheduled or pending broadcast
 */
export async function cancelBroadcast(
  id: string
): Promise<{ data: NotificationBroadcast | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('notification_broadcasts')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .in('status', ['draft', 'pending_approval', 'approved', 'scheduled'])
      .select()
      .single();

    if (error) throw error;

    await logAuditEvent(id, 'cancelled', {});

    return { data: data as NotificationBroadcast, error: null };
  } catch (error) {
    console.error('Error cancelling broadcast:', error);
    return { data: null, error: error as Error };
  }
}

// =============================================================================
// USER-FACING FUNCTIONS
// =============================================================================

/**
 * Get pending broadcasts for the current user
 */
export async function getPendingBroadcastsForUser(): Promise<{
  data: PendingBroadcast[] | null;
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase.rpc('get_pending_broadcasts_for_user');

    if (error) throw error;
    return { data: data as PendingBroadcast[], error: null };
  } catch (error) {
    console.error('Error fetching pending broadcasts:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Mark a broadcast interaction (read, dismissed, acknowledged)
 */
export async function markBroadcastInteraction(
  broadcastId: string,
  action: 'read' | 'dismissed' | 'acknowledged'
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { data, error } = await supabase.rpc('mark_broadcast_interaction', {
      p_broadcast_id: broadcastId,
      p_action: action,
    });

    if (error) throw error;
    return { success: data, error: null };
  } catch (error) {
    console.error('Error marking broadcast interaction:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Get unread broadcast count for current user
 */
export async function getUnreadBroadcastCount(): Promise<{
  count: number;
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase.rpc('get_unread_broadcast_count');

    if (error) throw error;
    return { count: data ?? 0, error: null };
  } catch (error) {
    console.error('Error getting unread count:', error);
    return { count: 0, error: error as Error };
  }
}

/**
 * Get broadcast statistics
 */
export async function getBroadcastStatistics(
  broadcastId: string
): Promise<{ data: BroadcastStatistics | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.rpc('get_broadcast_statistics', {
      p_broadcast_id: broadcastId,
    });

    if (error) throw error;
    return { data: data?.[0] as BroadcastStatistics, error: null };
  } catch (error) {
    console.error('Error getting broadcast statistics:', error);
    return { data: null, error: error as Error };
  }
}

// =============================================================================
// GROUP MANAGEMENT
// =============================================================================

/**
 * Get all notification groups
 */
export async function getGroups(): Promise<{
  data: UserNotificationGroup[] | null;
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase
      .from('user_notification_groups')
      .select('*')
      .order('name');

    if (error) throw error;
    return { data: data as UserNotificationGroup[], error: null };
  } catch (error) {
    console.error('Error fetching groups:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get a single group with members
 */
export async function getGroupWithMembers(
  id: string
): Promise<{ data: UserNotificationGroup | null; error: Error | null }> {
  try {
    const { data: group, error: groupError } = await supabase
      .from('user_notification_groups')
      .select('*')
      .eq('id', id)
      .single();

    if (groupError) throw groupError;

    const { data: members, error: membersError } = await supabase
      .from('user_notification_group_members')
      .select('*')
      .eq('group_id', id);

    if (membersError) throw membersError;

    return {
      data: { ...group, members, member_count: members?.length || 0 } as UserNotificationGroup,
      error: null,
    };
  } catch (error) {
    console.error('Error fetching group:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Create a new group
 */
export async function createGroup(
  input: CreateGroupInput
): Promise<{ data: UserNotificationGroup | null; error: Error | null }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('user_notification_groups')
      .insert({ ...input, created_by: user.id })
      .select()
      .single();

    if (error) throw error;
    return { data: data as UserNotificationGroup, error: null };
  } catch (error) {
    console.error('Error creating group:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Update a group
 */
export async function updateGroup(
  input: UpdateGroupInput
): Promise<{ data: UserNotificationGroup | null; error: Error | null }> {
  try {
    const { id, ...updateData } = input;

    const { data, error } = await supabase
      .from('user_notification_groups')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data: data as UserNotificationGroup, error: null };
  } catch (error) {
    console.error('Error updating group:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Delete a group
 */
export async function deleteGroup(id: string): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase.from('user_notification_groups').delete().eq('id', id);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting group:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Add members to a group
 */
export async function addGroupMembers(
  input: AddGroupMembersInput
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const members = input.user_ids.map((userId) => ({
      group_id: input.group_id,
      user_id: userId,
      added_by: user.id,
    }));

    const { error } = await supabase
      .from('user_notification_group_members')
      .upsert(members, { onConflict: 'group_id,user_id' });

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error('Error adding group members:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Remove a member from a group
 */
export async function removeGroupMember(
  groupId: string,
  userId: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase
      .from('user_notification_group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error('Error removing group member:', error);
    return { success: false, error: error as Error };
  }
}

// =============================================================================
// USER PREFERENCES
// =============================================================================

/**
 * Get user notification preferences
 */
export async function getUserPreferences(): Promise<{
  data: UserNotificationPreferences | null;
  error: Error | null;
}> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows

    return { data: data as UserNotificationPreferences | null, error: null };
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Update user notification preferences
 */
export async function updateUserPreferences(
  input: UpdatePreferencesInput
): Promise<{ data: UserNotificationPreferences | null; error: Error | null }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('user_notification_preferences')
      .upsert({ user_id: user.id, ...input }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;
    return { data: data as UserNotificationPreferences, error: null };
  } catch (error) {
    console.error('Error updating preferences:', error);
    return { data: null, error: error as Error };
  }
}

// =============================================================================
// AUDIT LOGGING
// =============================================================================

/**
 * Log an audit event
 */
async function logAuditEvent(
  broadcastId: string,
  action: AuditAction,
  details: Record<string, unknown>
): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('notification_broadcast_audit_log').insert({
      broadcast_id: broadcastId,
      actor_id: user.id,
      action,
      details,
    });
  } catch (error) {
    console.error('Error logging audit event:', error);
  }
}

/**
 * Get audit log for a broadcast
 */
export async function getBroadcastAuditLog(
  broadcastId: string
): Promise<{ data: BroadcastAuditLog[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('notification_broadcast_audit_log')
      .select('*')
      .eq('broadcast_id', broadcastId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data as BroadcastAuditLog[], error: null };
  } catch (error) {
    console.error('Error fetching audit log:', error);
    return { data: null, error: error as Error };
  }
}

// =============================================================================
// REALTIME SUBSCRIPTIONS
// =============================================================================

/**
 * Subscribe to new broadcasts for the current user
 */
export function subscribeToBroadcasts(
  onNewBroadcast: (broadcast: PendingBroadcast) => void
): () => void {
  const channel = supabase
    .channel('broadcast-notifications')
    .on('broadcast', { event: 'new_broadcast' }, async (payload) => {
      // Fetch the new broadcast for this user
      const { data } = await getPendingBroadcastsForUser();
      if (data && data.length > 0) {
        onNewBroadcast(data[0]);
      }
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to delivery status changes for admins
 */
export function subscribeToDeliveryUpdates(
  broadcastId: string,
  onUpdate: (stats: BroadcastStatistics) => void
): () => void {
  const channel = supabase
    .channel(`broadcast-stats-${broadcastId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notification_broadcast_deliveries',
        filter: `broadcast_id=eq.${broadcastId}`,
      },
      async () => {
        const { data } = await getBroadcastStatistics(broadcastId);
        if (data) {
          onUpdate(data);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
