/**
 * Notification Preferences Service
 * MIO Protocol Notifications - User Settings Management
 *
 * Manages user notification preferences:
 * - Notification time (when to receive daily reminders)
 * - Skip token balance
 * - Notification history/logs
 *
 * GHL SMS is handled server-side in the Edge Function.
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

export interface NotificationPreferences {
  notification_time: string; // Time in HH:MM:SS format
  skip_tokens: number;
}

export interface NotificationLog {
  id: string;
  user_id: string;
  protocol_id: string | null;
  notification_type: 'push' | 'sms' | 'email';
  trigger: 'daily_reminder' | 'missed_2_days' | 'day7_final' | 'welcome';
  sent_at: string;
  delivered: boolean;
  error_message: string | null;
}

// Preset notification times
export const NOTIFICATION_TIME_PRESETS = [
  { value: '06:00:00', label: '6:00 AM (Early Bird)' },
  { value: '07:30:00', label: '7:30 AM (Morning)', default: true },
  { value: '09:00:00', label: '9:00 AM (Mid-Morning)' },
  { value: '12:00:00', label: '12:00 PM (Noon)' },
  { value: '18:00:00', label: '6:00 PM (Evening)' },
] as const;

// ============================================================================
// GET NOTIFICATION PREFERENCES
// ============================================================================

export async function getNotificationPreferences(
  userId: string
): Promise<NotificationPreferences | null> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('notification_time, skip_tokens')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[NotificationPrefs] Error fetching preferences:', error);
      return null;
    }

    return {
      notification_time: data.notification_time || '07:30:00',
      skip_tokens: data.skip_tokens ?? 1,
    };
  } catch (error) {
    console.error('[NotificationPrefs] Exception:', error);
    return null;
  }
}

// ============================================================================
// UPDATE NOTIFICATION TIME
// ============================================================================

export async function updateNotificationTime(
  userId: string,
  time: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate time format (HH:MM:SS)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
    if (!timeRegex.test(time)) {
      return { success: false, error: 'Invalid time format. Use HH:MM:SS' };
    }

    const { error } = await supabase
      .from('user_profiles')
      .update({
        notification_time: time,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('[NotificationPrefs] Error updating time:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('[NotificationPrefs] Exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// GET SKIP TOKEN BALANCE
// ============================================================================

export async function getSkipTokenBalance(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('skip_tokens')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[NotificationPrefs] Error fetching skip tokens:', error);
      return 0;
    }

    return data.skip_tokens ?? 0;
  } catch (error) {
    console.error('[NotificationPrefs] Exception:', error);
    return 0;
  }
}

// ============================================================================
// USE SKIP TOKEN (marks a day as skipped)
// ============================================================================

export async function useSkipToken(
  userId: string,
  protocolId: string,
  dayNumber: number
): Promise<{
  success: boolean;
  tokens_remaining?: number;
  error?: string;
}> {
  try {
    // Call the RPC function
    const { data, error } = await supabase.rpc('use_skip_token_and_mark_skipped', {
      p_user_id: userId,
      p_protocol_id: protocolId,
      p_day_number: dayNumber,
    });

    if (error) {
      console.error('[NotificationPrefs] Error using skip token:', error);
      return { success: false, error: error.message };
    }

    // Parse response
    const result = data as {
      success: boolean;
      tokens_remaining?: number;
      error?: string;
    };

    return result;
  } catch (error) {
    console.error('[NotificationPrefs] Exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// GET NOTIFICATION HISTORY
// ============================================================================

export async function getNotificationHistory(
  userId: string,
  limit: number = 20
): Promise<NotificationLog[]> {
  try {
    const { data, error } = await supabase
      .from('notification_logs')
      .select('*')
      .eq('user_id', userId)
      .order('sent_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[NotificationPrefs] Error fetching history:', error);
      return [];
    }

    return data as NotificationLog[];
  } catch (error) {
    console.error('[NotificationPrefs] Exception:', error);
    return [];
  }
}

// ============================================================================
// FORMAT TIME FOR DISPLAY
// ============================================================================

export function formatNotificationTime(time: string): string {
  try {
    // Parse HH:MM:SS format
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const minute = minutes;

    // Convert to 12-hour format
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;

    return `${displayHour}:${minute} ${period}`;
  } catch {
    return time;
  }
}

// ============================================================================
// CHECK IF NOTIFICATIONS ARE ENABLED
// ============================================================================

export async function areNotificationsEnabled(userId: string): Promise<{
  push: boolean;
  sms: boolean;
}> {
  try {
    // Check for push subscription
    const { data: pushSubs, error: pushError } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .limit(1);

    // Check for GHL contact (for SMS capability)
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('ghl_contact_id, phone')
      .eq('id', userId)
      .single();

    const pushEnabled = !pushError && pushSubs && pushSubs.length > 0;
    const smsEnabled =
      !profileError && profile && !!(profile.ghl_contact_id && profile.phone);

    return { push: pushEnabled, sms: smsEnabled };
  } catch (error) {
    console.error('[NotificationPrefs] Exception:', error);
    return { push: false, sms: false };
  }
}

export default {
  getNotificationPreferences,
  updateNotificationTime,
  getSkipTokenBalance,
  useSkipToken,
  getNotificationHistory,
  formatNotificationTime,
  areNotificationsEnabled,
  NOTIFICATION_TIME_PRESETS,
};
