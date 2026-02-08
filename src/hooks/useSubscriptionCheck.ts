import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SubscriptionStatus {
  isActive: boolean;
  isPaused: boolean;
  enrollmentStatus: string | null;
  paymentTier: string | null;
  expiresAt: string | null;
  isGracePeriod: boolean;
  hasRecord: boolean;
}

const DEFAULT_STATUS: SubscriptionStatus = {
  isActive: true,           // Keep true for backwards compatibility
  isPaused: false,
  enrollmentStatus: null,
  paymentTier: 'trial',     // Default to trial when no record exists (fail-closed for gating)
  expiresAt: null,
  isGracePeriod: false,
  hasRecord: false,
};

/**
 * useSubscriptionCheck - Checks current user's subscription status in gh_approved_users.
 *
 * FAIL-OPEN: If no record exists or any error occurs, returns active=true.
 * This ensures backwards compatibility for existing users without gh_approved_users records.
 *
 * Returns cached result for the session, re-checks on app focus.
 */
export function useSubscriptionCheck() {
  const { user } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus>(DEFAULT_STATUS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const checkSubscription = useCallback(async () => {
    if (!user?.id || !user?.email) {
      // No user = fail-open (let ProtectedRoute handle auth)
      setStatus(DEFAULT_STATUS);
      setIsLoading(false);
      return;
    }

    try {
      // Query gh_approved_users for this user
      // Try by user_id first, then by email
      let record = null;

      const { data: byUserId, error: userIdError } = await supabase
        .from('gh_approved_users')
        .select('is_active, enrollment_status, payment_tier, expires_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (userIdError && userIdError.code !== 'PGRST116') {
        console.error('[useSubscriptionCheck] Query by user_id error:', userIdError);
      }

      record = byUserId;

      // If not found by user_id, try by email
      if (!record && user.email) {
        const { data: byEmail, error: emailError } = await supabase
          .from('gh_approved_users')
          .select('is_active, enrollment_status, payment_tier, expires_at')
          .eq('email', user.email.toLowerCase())
          .maybeSingle();

        if (emailError && emailError.code !== 'PGRST116') {
          console.error('[useSubscriptionCheck] Query by email error:', emailError);
        }

        record = byEmail;
      }

      // FAIL-OPEN: No record means user was created before GHCF system
      if (!record) {
        setStatus({ ...DEFAULT_STATUS, hasRecord: false });
        setIsLoading(false);
        return;
      }

      // Check grace period: cancelled or past_due but before expires_at
      const now = new Date();
      const expiresAt = record.expires_at ? new Date(record.expires_at) : null;
      const isGracePeriod =
        (record.enrollment_status === 'cancelled' || record.enrollment_status === 'past_due') &&
        expiresAt !== null &&
        now < expiresAt;

      // Determine if actually active
      // Active if: is_active=true OR in grace period
      const isActive = record.is_active === true || isGracePeriod;

      const isPaused = record.enrollment_status === 'paused';

      setStatus({
        isActive,
        isPaused,
        enrollmentStatus: record.enrollment_status,
        paymentTier: record.payment_tier,
        expiresAt: record.expires_at,
        isGracePeriod,
        hasRecord: true,
      });
    } catch (err) {
      console.error('[useSubscriptionCheck] Unexpected error:', err);
      setError(err as Error);
      // FAIL-OPEN on error
      setStatus(DEFAULT_STATUS);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.email]);

  // Initial check
  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Re-check on window focus (user returning to tab)
  useEffect(() => {
    const handleFocus = () => {
      checkSubscription();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [checkSubscription]);

  return { status, isLoading, error, refetch: checkSubscription };
}
