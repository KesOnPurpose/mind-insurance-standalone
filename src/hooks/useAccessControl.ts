import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export type UserTier = 'user' | 'coach' | 'admin' | 'super_admin' | 'owner' | null;

interface ApprovedUser {
  id: string;
  email: string;
  user_id: string | null;
  tier: UserTier;
  is_active: boolean;
  full_name: string | null;
  expires_at: string | null;
  approved_at: string;
}

interface AccessControlState {
  isApproved: boolean;
  tier: UserTier;
  isLoading: boolean;
  error: Error | null;
  approvedUser: ApprovedUser | null;
}

const TIER_HIERARCHY: Record<NonNullable<UserTier>, number> = {
  user: 1,
  coach: 2,
  admin: 3,
  super_admin: 4,
  owner: 5,
};

export function useAccessControl() {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<AccessControlState>({
    isApproved: false,
    tier: null,
    isLoading: true,
    error: null,
    approvedUser: null,
  });

  const checkAccess = useCallback(async () => {
    if (authLoading) return;

    if (!user?.email) {
      setState({
        isApproved: false,
        tier: null,
        isLoading: false,
        error: null,
        approvedUser: null,
      });
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Use RPC function to bypass RLS and get access details
      const { data, error } = await supabase
        .rpc('gh_get_current_user_access');

      if (error) {
        throw error;
      }

      // The RPC function returns a JSON object with is_approved, tier, and user
      const accessData = data as {
        is_approved: boolean;
        tier: string | null;
        user: ApprovedUser | null;
      };

      if (accessData.is_approved && accessData.user) {
        setState({
          isApproved: true,
          tier: accessData.tier as UserTier,
          isLoading: false,
          error: null,
          approvedUser: accessData.user,
        });
      } else {
        setState({
          isApproved: false,
          tier: null,
          isLoading: false,
          error: null,
          approvedUser: null,
        });
      }
    } catch (error) {
      console.error('[useAccessControl] Error checking access:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error as Error,
      }));
    }
  }, [user?.email, authLoading]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  // Check if user has at least the required tier level
  const hasTierAccess = useCallback((requiredTier: NonNullable<UserTier>): boolean => {
    if (!state.tier) return false;
    return TIER_HIERARCHY[state.tier] >= TIER_HIERARCHY[requiredTier];
  }, [state.tier]);

  // Permission checks
  const isUser = state.tier !== null;
  const isCoach = hasTierAccess('coach');
  const isAdmin = hasTierAccess('admin');
  const isSuperAdmin = hasTierAccess('super_admin');
  const isOwner = hasTierAccess('owner');

  // Specific permission checks
  const canManageUsers = isAdmin;
  const canManageContent = isCoach;
  const canAccessAdminPanel = isAdmin;
  const canDeleteUsers = isSuperAdmin;
  const canModifyOwnerSettings = isOwner;

  return {
    // State
    ...state,

    // Refresh function
    refreshAccess: checkAccess,

    // Tier checks
    hasTierAccess,
    isUser,
    isCoach,
    isAdmin,
    isSuperAdmin,
    isOwner,

    // Permission checks
    canManageUsers,
    canManageContent,
    canAccessAdminPanel,
    canDeleteUsers,
    canModifyOwnerSettings,
  };
}

// Export tier hierarchy for external use
export { TIER_HIERARCHY };
