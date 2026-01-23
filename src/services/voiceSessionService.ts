// ============================================================================
// VOICE SESSION SERVICE
// Manages voice_sessions for GHL Voice AI web widget caller identification
//
// Flow:
// 1. User loads Voice tab → createVoiceSession() creates session record
// 2. User clicks to call → Voice AI starts, calls our lookup webhook
// 3. Voice AI webhook → lookupVoiceSession() finds session, returns context
// 4. Voice AI uses phone → Gets full GHL contact data for personalization
// ============================================================================

import { supabase } from "@/integrations/supabase/client";
import { buildVoiceContext } from "./voiceContextService";
import type { VoiceContextPayload } from "@/types/voice";

// ============================================================================
// TYPES
// ============================================================================

export interface VoiceSession {
  id: string;
  user_id: string | null;
  phone: string;
  ghl_contact_id: string | null;
  context: VoiceContextPayload | Record<string, unknown>;
  greeting_hint: string | null;
  created_at: string;
  matched_at: string | null;
  expires_at: string;
  call_started_at: string | null;
  call_ended_at: string | null;
  status: 'pending' | 'matched' | 'expired' | 'completed';
}

export interface CreateSessionParams {
  userId: string;
  phone: string;
  ghlContactId?: string | null;
}

export interface CreateSessionResult {
  success: boolean;
  session?: VoiceSession;
  error?: string;
}

export interface LookupSessionResult {
  success: boolean;
  phone?: string;
  ghl_contact_id?: string | null;
  context?: VoiceContextPayload | Record<string, unknown>;
  greeting_hint?: string;
  session_id?: string;
  error?: string;
}

// ============================================================================
// SESSION CREATION
// Called when user loads the Voice tab
// ============================================================================

/**
 * Create a new voice session when user loads the Voice tab
 * This session will be looked up by Voice AI at the start of the call
 */
export async function createVoiceSession(
  params: CreateSessionParams
): Promise<CreateSessionResult> {
  const { userId, phone, ghlContactId } = params;

  console.log('[VoiceSession] Creating session for user:', userId);

  try {
    // Build voice context from user data
    const context = await buildVoiceContext(userId);

    // Create session record
    const sessionData = {
      user_id: userId,
      phone,
      ghl_contact_id: ghlContactId || null,
      context,
      greeting_hint: context.greeting_name,
      status: 'pending' as const,
      // Expires in 5 minutes
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString()
    };

    const { data, error } = await supabase
      .from('voice_sessions')
      .insert(sessionData)
      .select()
      .single();

    if (error) {
      console.error('[VoiceSession] Error creating session:', error);
      return {
        success: false,
        error: error.message
      };
    }

    console.log('[VoiceSession] Session created:', {
      id: data.id,
      greeting_hint: data.greeting_hint,
      expires_at: data.expires_at
    });

    return {
      success: true,
      session: data as VoiceSession
    };

  } catch (err) {
    console.error('[VoiceSession] Exception creating session:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error'
    };
  }
}

// ============================================================================
// SESSION CLEANUP
// Expire old pending sessions
// ============================================================================

/**
 * Mark expired sessions as expired
 * Called periodically or before creating new sessions
 */
export async function expireOldSessions(): Promise<void> {
  try {
    const { error } = await supabase
      .from('voice_sessions')
      .update({ status: 'expired' })
      .eq('status', 'pending')
      .lt('expires_at', new Date().toISOString());

    if (error) {
      console.warn('[VoiceSession] Error expiring sessions:', error);
    }
  } catch (err) {
    console.warn('[VoiceSession] Exception expiring sessions:', err);
  }
}

// ============================================================================
// SESSION LOOKUP (For N8n Webhook / Edge Function)
// Called by Voice AI at the start of each call
// ============================================================================

/**
 * Find the most recent unmatched session within the lookup window
 * This is called by the N8n webhook when Voice AI starts a call
 *
 * @param lookupWindowSeconds - How far back to search (default: 60 seconds)
 */
export async function lookupVoiceSession(
  lookupWindowSeconds: number = 60
): Promise<LookupSessionResult> {
  console.log('[VoiceSession] Looking up session within', lookupWindowSeconds, 'seconds');

  try {
    const windowStart = new Date(Date.now() - lookupWindowSeconds * 1000).toISOString();

    // Find most recent pending session created within the window
    const { data, error } = await supabase
      .from('voice_sessions')
      .select('*')
      .eq('status', 'pending')
      .gte('created_at', windowStart)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No matching session found
        console.log('[VoiceSession] No pending session found in window');
        return {
          success: false,
          error: 'No pending session found'
        };
      }
      console.error('[VoiceSession] Error looking up session:', error);
      return {
        success: false,
        error: error.message
      };
    }

    // Mark session as matched
    await supabase
      .from('voice_sessions')
      .update({
        status: 'matched',
        matched_at: new Date().toISOString()
      })
      .eq('id', data.id);

    console.log('[VoiceSession] Session matched:', {
      id: data.id,
      phone: data.phone,
      greeting_hint: data.greeting_hint
    });

    return {
      success: true,
      phone: data.phone,
      ghl_contact_id: data.ghl_contact_id,
      context: data.context as VoiceContextPayload,
      greeting_hint: data.greeting_hint,
      session_id: data.id
    };

  } catch (err) {
    console.error('[VoiceSession] Exception looking up session:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error'
    };
  }
}

// ============================================================================
// SESSION COMPLETION
// Called when Voice AI call ends
// ============================================================================

/**
 * Mark a session as completed after the call ends
 */
export async function completeVoiceSession(sessionId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('voice_sessions')
      .update({
        status: 'completed',
        call_ended_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (error) {
      console.error('[VoiceSession] Error completing session:', error);
      return false;
    }

    console.log('[VoiceSession] Session completed:', sessionId);
    return true;

  } catch (err) {
    console.error('[VoiceSession] Exception completing session:', err);
    return false;
  }
}

// ============================================================================
// SESSION STATUS
// Check current session state
// ============================================================================

/**
 * Get the current active session for a user (if any)
 */
export async function getActiveSession(userId: string): Promise<VoiceSession | null> {
  try {
    const { data, error } = await supabase
      .from('voice_sessions')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['pending', 'matched'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      return null;
    }

    return data as VoiceSession;

  } catch {
    return null;
  }
}
