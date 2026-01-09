/**
 * useMIAccessControl - Mind Insurance Access Control Hook
 *
 * Purpose: Check user access for Mind Insurance standalone app.
 * Uses the mi_approved_users table (separate from Grouphome's gh_approved_users).
 *
 * Usage:
 * ```tsx
 * const { isApproved, tier, isAdmin, isSuperAdmin, loading, error } = useMIAccessControl();
 *
 * if (loading) return <Spinner />;
 * if (!isApproved) return <AccessDenied />;
 * if (isAdmin) return <AdminPanel />;
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Maximum time to wait for access check before timing out
const ACCESS_CHECK_TIMEOUT_MS = 10000; // 10 seconds

// MI-specific tier enum (simpler than GH - no coach/owner)
export type MIUserTier = 'user' | 'admin' | 'super_admin' | null;

// Tier hierarchy for permission checks
const MI_TIER_HIERARCHY: Record<NonNullable<MIUserTier>, number> = {
  user: 1,
  admin: 2,
  super_admin: 3,
};

interface MIAccessUser {
  id: string;
  email: string;
  full_name: string | null;
}

interface MIAccessResult {
  is_approved: boolean;
  tier: string | null;
  user: MIAccessUser | null;
  approved_at: string | null;
  expires_at: string | null;
}

interface MIAccessControlState {
  isApproved: boolean;
  tier: MIUserTier;
  user: MIAccessUser | null;
  approvedAt: string | null;
  expiresAt: string | null;
  loading: boolean;
  error: Error | null;
}

export function useMIAccessControl() {
  const { user: authUser, loading: authLoading } = useAuth();
  const [state, setState] = useState<MIAccessControlState>({
    isApproved: false,
    tier: null,
    user: null,
    approvedAt: null,
    expiresAt: null,
    loading: true,
    error: null,
  });

  const checkAccess = useCallback(async () => {
    if (authLoading) return;

    if (!authUser?.email) {
      setState({
        isApproved: false,
        tier: null,
        user: null,
        approvedAt: null,
        expiresAt: null,
        loading: false,
        error: null,
      });
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Create timeout promise to prevent infinite loading
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Access check timed out after 10 seconds'));
        }, ACCESS_CHECK_TIMEOUT_MS);
      });

      // Use MI-specific RPC function
      const rpcPromise = supabase.rpc('mi_get_current_user_access');

      const { data, error } = await Promise.race([rpcPromise, timeoutPromise]);

      if (error) {
        throw error;
      }

      const accessData = data as MIAccessResult;

      if (accessData.is_approved && accessData.user) {
        setState({
          isApproved: true,
          tier: accessData.tier as MIUserTier,
          user: accessData.user,
          approvedAt: accessData.approved_at,
          expiresAt: accessData.expires_at,
          loading: false,
          error: null,
        });

        // Update last access timestamp (fire and forget)
        supabase.rpc('mi_update_last_access').catch(() => {
          // Silently ignore errors updating last access
        });
      } else {
        setState({
          isApproved: false,
          tier: null,
          user: null,
          approvedAt: null,
          expiresAt: null,
          loading: false,
          error: null,
        });
      }
    } catch (error) {
      console.error('[useMIAccessControl] Error checking access:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error as Error,
      }));
    }
  }, [authUser?.email, authLoading]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  // Check if user has at least the required tier level
  const hasTierAccess = useCallback((requiredTier: NonNullable<MIUserTier>): boolean => {
    if (!state.tier) return false;
    return MI_TIER_HIERARCHY[state.tier] >= MI_TIER_HIERARCHY[requiredTier];
  }, [state.tier]);

  // Permission checks
  const isUser = state.tier !== null;
  const isAdmin = hasTierAccess('admin');
  const isSuperAdmin = hasTierAccess('super_admin');

  // Specific permission checks for MI
  const canAccessApp = state.isApproved;
  const canManageUsers = isAdmin;
  const canAccessAdminPanel = isAdmin;
  const canDeleteUsers = isSuperAdmin;
  const canManageSettings = isSuperAdmin;

  return {
    // Core state
    isApproved: state.isApproved,
    tier: state.tier,
    user: state.user,
    approvedAt: state.approvedAt,
    expiresAt: state.expiresAt,
    loading: state.loading,
    error: state.error,

    // Legacy alias for isLoading (for compatibility with existing patterns)
    isLoading: state.loading,

    // Refresh function
    refreshAccess: checkAccess,
    refetch: checkAccess,

    // Tier checks
    hasTierAccess,
    isUser,
    isAdmin,
    isSuperAdmin,

    // Permission checks
    canAccessApp,
    canManageUsers,
    canAccessAdminPanel,
    canDeleteUsers,
    canManageSettings,
  };
}

// Export tier hierarchy for external use
export { MI_TIER_HIERARCHY };

// Default export for convenience
export default useMIAccessControl;
