/**
 * Voice Opt-In Service
 *
 * Manages user phone collection and voice call preferences.
 * Used during onboarding to enable MIO voice check-ins.
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

export interface VoiceOptInStatus {
  hasPhone: boolean;
  phone: string | null;
  voiceCallsEnabled: boolean;
  preferredCallTime: string | null;
  optInDate: string | null;
}

export interface VoiceOptInParams {
  phone: string;
  enabled: boolean;
  preferredTime?: string;
}

// Preset notification times
export const CALL_TIME_OPTIONS = [
  { value: '06:00', label: 'Early Bird (6:00 AM)' },
  { value: '07:30', label: 'Morning (7:30 AM) - Recommended' },
  { value: '09:00', label: 'Mid-Morning (9:00 AM)' },
  { value: '18:00', label: 'Evening (6:00 PM)' },
  { value: '20:00', label: 'Night Owl (8:00 PM)' }
];

// ============================================================================
// PHONE VALIDATION
// ============================================================================

/**
 * Validate and format phone number
 * Returns formatted E.164 phone number or null if invalid
 */
export function validatePhone(phone: string): string | null {
  // Remove all non-numeric characters
  const digits = phone.replace(/\D/g, '');

  // US phone numbers
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  // Already has country code
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }

  // International format with +
  if (phone.startsWith('+') && digits.length >= 10 && digits.length <= 15) {
    return `+${digits}`;
  }

  return null;
}

/**
 * Format phone for display
 */
export function formatPhoneForDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, '');

  if (digits.length === 11 && digits.startsWith('1')) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  return phone;
}

// ============================================================================
// SERVICE FUNCTIONS
// ============================================================================

/**
 * Get current voice opt-in status for user
 */
export async function getVoiceOptInStatus(userId: string): Promise<VoiceOptInStatus> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('phone, voice_calls_enabled, preferred_call_time, voice_opt_in_date')
      .eq('id', userId)
      .single();

    if (error) throw error;

    return {
      hasPhone: !!data?.phone,
      phone: data?.phone || null,
      voiceCallsEnabled: data?.voice_calls_enabled || false,
      preferredCallTime: data?.preferred_call_time || null,
      optInDate: data?.voice_opt_in_date || null
    };
  } catch (error) {
    console.error('[VoiceOptIn] Error getting status:', error);
    return {
      hasPhone: false,
      phone: null,
      voiceCallsEnabled: false,
      preferredCallTime: null,
      optInDate: null
    };
  }
}

/**
 * Update voice opt-in status for user
 */
export async function updateVoiceOptIn(
  userId: string,
  params: VoiceOptInParams
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate phone
    const formattedPhone = validatePhone(params.phone);
    if (!formattedPhone) {
      return {
        success: false,
        error: 'Invalid phone number format'
      };
    }

    // Use RPC function for security
    const { data, error } = await supabase.rpc('update_voice_opt_in', {
      p_user_id: userId,
      p_phone: formattedPhone,
      p_enabled: params.enabled,
      p_preferred_time: params.preferredTime || '07:30'
    });

    if (error) throw error;

    console.log('[VoiceOptIn] Updated:', {
      userId,
      phone: formattedPhone,
      enabled: params.enabled
    });

    return { success: true };
  } catch (error) {
    console.error('[VoiceOptIn] Error updating:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update voice preferences'
    };
  }
}

/**
 * Disable voice calls (keep phone, just toggle off)
 */
export async function disableVoiceCalls(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({ voice_calls_enabled: false })
      .eq('id', userId);

    if (error) throw error;

    console.log('[VoiceOptIn] Disabled voice calls for:', userId);
    return { success: true };
  } catch (error) {
    console.error('[VoiceOptIn] Error disabling:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to disable voice calls'
    };
  }
}

/**
 * Check if user has completed voice opt-in flow
 */
export async function hasCompletedVoiceOptIn(userId: string): Promise<boolean> {
  const status = await getVoiceOptInStatus(userId);
  // User has "completed" the flow if they have a phone and made a choice
  // (either enabled or explicitly disabled after seeing the modal)
  return status.hasPhone || status.optInDate !== null;
}

/**
 * Get voice call logs for user
 */
export async function getVoiceCallLogs(
  userId: string,
  limit: number = 10
): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('mio_voice_call_logs')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('[VoiceOptIn] Error getting call logs:', error);
    return [];
  }
}

/**
 * Get voice context for in-app voice widget
 * Calls the mio-voice-context Edge Function
 */
export async function getVoiceContext(userId: string): Promise<any> {
  try {
    const { data, error } = await supabase.functions.invoke('mio-voice-context', {
      body: { user_id: userId }
    });

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('[VoiceOptIn] Error getting voice context:', error);
    return null;
  }
}
