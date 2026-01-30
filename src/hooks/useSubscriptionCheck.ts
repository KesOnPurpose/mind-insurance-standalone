/**
 * useSubscriptionCheck Hook
 * FEAT-GHCF-006: Checks subscription status via check-subscription edge function.
 *
 * CRITICAL: FAIL-OPEN on ALL errors.
 * - No session = allow access
 * - Edge function error = allow access
 * - Network error = allow access
 * - Only blocks when edge function explicitly returns { active: false }
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SubscriptionStatus {
  active: boolean;
  reason: string;
  enrollment_status?: string;
  tier?: string;
}

export const useSubscriptionCheck = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const checkSubscription = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          // No session = fail-open (allow access)
          if (!cancelled) {
            setStatus({ active: true, reason: 'no_session' });
            setIsLoading(false);
          }
          return;
        }

        const response = await supabase.functions.invoke('check-subscription', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (cancelled) return;

        if (response.error) {
          // FAIL-OPEN on error
          console.error('[useSubscriptionCheck] Edge function error:', response.error);
          setStatus({ active: true, reason: 'check_error_fail_open' });
          return;
        }

        setStatus(response.data as SubscriptionStatus);
      } catch (err) {
        if (cancelled) return;
        // FAIL-OPEN on any error
        console.error('[useSubscriptionCheck] Exception:', err);
        setError(err as Error);
        setStatus({ active: true, reason: 'exception_fail_open' });
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    checkSubscription();

    return () => {
      cancelled = true;
    };
  }, [user]);

  return { status, isLoading, error };
};
