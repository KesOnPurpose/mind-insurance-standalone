import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface WhopMembership {
  id: string;
  status: 'active' | 'past_due' | 'canceled' | 'canceling' | 'paused' | 'trialing' | 'completed' | 'expired';
  valid?: boolean;
  cancel_at_period_end: boolean;
  expires_at: string | number | null;
  renewal_period_start: string | number | null;
  renewal_period_end: string | number | null;
  manage_url: string | null;
  plan: { id: string } | string | null;
  product: { id: string; title?: string } | string | null;
  payment_collection_paused?: boolean;
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

      // Parse date — v1 returns ISO 8601 strings, v2 returned Unix timestamps
      const parseDate = (val: string | number | null | undefined): string | null => {
        if (!val) return null;
        if (typeof val === 'string') return new Date(val).toISOString();
        if (typeof val === 'number') return new Date(val * 1000).toISOString();
        return null;
      };

      const expiresAtDate = parseDate(membership?.renewal_period_end)
        || parseDate(membership?.expires_at)
        || null;

      const activeStatuses = ['active', 'trialing', 'completed'];
      const isActive = membership
        ? (membership.valid === true || activeStatuses.includes(membership.status))
        : false;

      const subscriptionStatus: SubscriptionStatus = {
        membership,
        tier: null, // Will be enriched from gh_approved_users tier
        expiresAt: expiresAtDate,
        isActive: isActive && membership?.cancel_at_period_end !== true,
        isPendingCancel: membership?.cancel_at_period_end === true,
        isPaused: membership?.status === 'paused' || membership?.payment_collection_paused === true,
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
      // Don't set status on error — leave it null so the error card renders
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
