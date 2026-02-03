import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface WhopMembership {
  id: string;
  status: 'active' | 'past_due' | 'canceled' | 'paused' | 'trialing' | 'completed';
  valid: boolean;
  cancel_at_period_end: boolean;
  expires_at: number | null;
  renewal_period_start: number | null;
  renewal_period_end: number | null;
  manage_url: string | null;
  plan: string | null;
  product: string | null;
}

export interface SubscriptionStatus {
  membership: WhopMembership | null;
  tier: string | null;
  expiresAt: string | null;
  isActive: boolean;
  isPendingCancel: boolean;
  isPaused: boolean;
  manageUrl: string | null;
  hasWhopLink: boolean;
  isAdmin: boolean;
}

interface ActionState {
  isLoading: boolean;
  error: string | null;
}

export function useSubscriptionManagement() {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [fetchState, setFetchState] = useState<ActionState>({ isLoading: false, error: null });
  const [actionState, setActionState] = useState<ActionState>({ isLoading: false, error: null });

  const callEdgeFunction = useCallback(async (
    action: string,
    data?: Record<string, unknown>,
  ) => {
    const { data: response, error } = await supabase.functions.invoke('manage-subscription', {
      body: { action, data },
    });

    if (error) {
      throw new Error(error.message || 'Failed to call subscription API');
    }

    if (response?.error) {
      throw new Error(response.error);
    }

    return response;
  }, []);

  const fetchStatus = useCallback(async () => {
    setFetchState({ isLoading: true, error: null });
    try {
      const response = await callEdgeFunction('get_status');

      // Admin bypass — edge function returns is_admin: true for admin users
      if (response?.is_admin) {
        const adminStatus: SubscriptionStatus = {
          membership: null,
          tier: response.subscription?.tier || 'admin',
          expiresAt: response.subscription?.expires_at || null,
          isActive: true,
          isPendingCancel: false,
          isPaused: false,
          manageUrl: null,
          hasWhopLink: false,
          isAdmin: true,
        };
        setStatus(adminStatus);
        setFetchState({ isLoading: false, error: null });
        return adminStatus;
      }

      const membership = response?.data as WhopMembership | null;

      // Whop v2: "completed" with valid=true means active; expires_at is a unix timestamp
      const expiresAtDate = membership?.renewal_period_end
        ? new Date(membership.renewal_period_end * 1000).toISOString()
        : membership?.expires_at
          ? new Date(membership.expires_at * 1000).toISOString()
          : null;

      const subscriptionStatus: SubscriptionStatus = {
        membership,
        tier: null, // Will be enriched from gh_approved_users tier
        expiresAt: expiresAtDate,
        isActive: membership?.valid === true && (membership?.status === 'completed' || membership?.status === 'active' || membership?.status === 'trialing'),
        isPendingCancel: membership?.cancel_at_period_end === true,
        isPaused: membership?.status === 'paused',
        manageUrl: membership?.manage_url || null,
        hasWhopLink: !!membership,
        isAdmin: false,
      };

      setStatus(subscriptionStatus);
      setFetchState({ isLoading: false, error: null });
      return subscriptionStatus;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch subscription status';
      setFetchState({ isLoading: false, error: message });

      // If no Whop link, set a minimal status from the error response
      setStatus({
        membership: null,
        tier: null,
        expiresAt: null,
        isActive: false,
        isPendingCancel: false,
        isPaused: false,
        manageUrl: null,
        hasWhopLink: false,
        isAdmin: false,
      });

      return null;
    }
  }, [callEdgeFunction]);

  const cancel = useCallback(async (reason?: string, reasonText?: string) => {
    setActionState({ isLoading: true, error: null });
    try {
      await callEdgeFunction('cancel', {
        cancel_reason: reason,
        cancel_reason_text: reasonText,
      });
      // Refresh status after action
      await fetchStatus();
      setActionState({ isLoading: false, error: null });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel subscription';
      setActionState({ isLoading: false, error: message });
      return false;
    }
  }, [callEdgeFunction, fetchStatus]);

  const uncancel = useCallback(async () => {
    setActionState({ isLoading: true, error: null });
    try {
      await callEdgeFunction('uncancel');
      await fetchStatus();
      setActionState({ isLoading: false, error: null });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to undo cancellation';
      setActionState({ isLoading: false, error: message });
      return false;
    }
  }, [callEdgeFunction, fetchStatus]);

  const pause = useCallback(async () => {
    setActionState({ isLoading: true, error: null });
    try {
      await callEdgeFunction('pause');
      await fetchStatus();
      setActionState({ isLoading: false, error: null });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to pause subscription';
      setActionState({ isLoading: false, error: message });
      return false;
    }
  }, [callEdgeFunction, fetchStatus]);

  const resume = useCallback(async () => {
    setActionState({ isLoading: true, error: null });
    try {
      await callEdgeFunction('resume');
      await fetchStatus();
      setActionState({ isLoading: false, error: null });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resume subscription';
      setActionState({ isLoading: false, error: message });
      return false;
    }
  }, [callEdgeFunction, fetchStatus]);

  return {
    status,
    fetchStatus,
    cancel,
    uncancel,
    pause,
    resume,
    isFetching: fetchState.isLoading,
    fetchError: fetchState.error,
    isActioning: actionState.isLoading,
    actionError: actionState.error,
  };
}
