// ============================================================================
// USE SESSION HOOK
// ============================================================================
// Automatic user session tracking for analytics dashboard metrics
// Tracks session start/end, activity counts, and duration
// ============================================================================

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface SessionState {
  sessionId: string | null;
  isTracking: boolean;
}

/**
 * Hook to automatically track user sessions
 * Creates/updates sessions based on user activity
 *
 * @param entryPoint - Where the user entered (dashboard, chat, assessment, etc.)
 * @returns Session tracking functions
 */
export function useSession(entryPoint?: string) {
  const { user } = useAuth();
  const [session, setSession] = useState<SessionState>({
    sessionId: null,
    isTracking: false,
  });
  const activityTimerRef = useRef<NodeJS.Timeout>();
  const sessionIdRef = useRef<string | null>(null);

  // Initialize session when user logs in
  useEffect(() => {
    if (!user) {
      // End session when user logs out
      if (sessionIdRef.current) {
        endSession('logout').catch(console.error);
      }
      return;
    }

    // Start new session
    startSession(entryPoint).catch(console.error);

    // Set up activity timer (auto-end after 30 min inactivity)
    const resetActivityTimer = () => {
      if (activityTimerRef.current) {
        clearTimeout(activityTimerRef.current);
      }

      activityTimerRef.current = setTimeout(() => {
        if (sessionIdRef.current) {
          endSession('timeout').catch(console.error);
        }
      }, 30 * 60 * 1000); // 30 minutes
    };

    // Track user activity
    const handleActivity = () => {
      if (sessionIdRef.current) {
        updateSessionActivity().catch(console.error);
        resetActivityTimer();
      }
    };

    // Listen for user activity
    window.addEventListener('click', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('scroll', handleActivity);

    resetActivityTimer();

    // Cleanup
    return () => {
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      if (activityTimerRef.current) {
        clearTimeout(activityTimerRef.current);
      }
      // Don't end session on component unmount (only on logout/timeout)
    };
  }, [user?.id, entryPoint]);

  /**
   * Start a new session or get existing active session
   */
  const startSession = async (entry?: string) => {
    if (!user) return;

    try {
      // Call database function to create/get session
      const { data, error } = await supabase.rpc('update_session_activity', {
        p_user_id: user.id,
        p_increment_actions: false,
      });

      if (error) throw error;

      sessionIdRef.current = data;
      setSession({ sessionId: data, isTracking: true });

      // Update entry point if provided
      if (entry) {
        await supabase
          .from('user_sessions')
          .update({ entry_point: entry })
          .eq('id', data);
      }
    } catch (error) {
      console.error('[useSession] Failed to start session:', error);
    }
  };

  /**
   * Update session activity
   */
  const updateSessionActivity = async () => {
    if (!user || !sessionIdRef.current) return;

    try {
      await supabase.rpc('update_session_activity', {
        p_user_id: user.id,
        p_increment_actions: true,
      });
    } catch (error) {
      console.error('[useSession] Failed to update activity:', error);
    }
  };

  /**
   * Track a conversation in the current session
   */
  const trackConversation = async () => {
    if (!user || !sessionIdRef.current) return;

    try {
      await supabase.rpc('update_session_activity', {
        p_user_id: user.id,
        p_increment_actions: false,
        p_increment_conversations: true,
      });
    } catch (error) {
      console.error('[useSession] Failed to track conversation:', error);
    }
  };

  /**
   * Track a completed tactic in the current session
   */
  const trackTactic = async () => {
    if (!user || !sessionIdRef.current) return;

    try {
      await supabase.rpc('update_session_activity', {
        p_user_id: user.id,
        p_increment_actions: false,
        p_increment_tactics: true,
      });
    } catch (error) {
      console.error('[useSession] Failed to track tactic:', error);
    }
  };

  /**
   * End the current session
   */
  const endSession = async (exitAction?: string) => {
    if (!sessionIdRef.current) return;

    try {
      await supabase
        .from('user_sessions')
        .update({
          ended_at: new Date().toISOString(),
          exit_action: exitAction || 'navigation',
        })
        .eq('id', sessionIdRef.current);

      sessionIdRef.current = null;
      setSession({ sessionId: null, isTracking: false });
    } catch (error) {
      console.error('[useSession] Failed to end session:', error);
    }
  };

  return {
    sessionId: session.sessionId,
    isTracking: session.isTracking,
    trackConversation,
    trackTactic,
    updateActivity: updateSessionActivity,
    endSession,
  };
}
