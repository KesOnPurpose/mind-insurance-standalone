import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// ============================================================================
// ADMIN CONTEXT - Role-Based Access Control (MI Standalone)
// ============================================================================
// Manages admin authentication state and permission checking
// Uses mi_approved_users table with tier-based access (user/admin/super_admin)
// ============================================================================

interface AdminPermissions {
  users: { read: boolean; write: boolean; delete: boolean };
  analytics: { read: boolean; export: boolean };
  content: { read: boolean; write: boolean; publish: boolean };
  system: { read: boolean; configure: boolean };
}

// MI uses tier-based roles: user, admin, super_admin
export type AdminRole = 'super_admin' | 'admin' | 'user';

interface AdminUser {
  id: string;
  user_id: string;
  role: AdminRole;
  permissions: AdminPermissions;
  created_at: string;
  last_login_at: string | null;
  is_active: boolean;
}

interface AdminContextType {
  adminUser: AdminUser | null;
  isAdmin: boolean;
  isLoading: boolean;
  hasPermission: (category: keyof AdminPermissions, action: string) => boolean;
  isSuperAdmin: boolean;
  refreshAdminStatus: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

// Map MI tiers to permission sets
function getPermissionsForTier(tier: string): AdminPermissions {
  switch (tier) {
    case 'super_admin':
      return {
        users: { read: true, write: true, delete: true },
        analytics: { read: true, export: true },
        content: { read: true, write: true, publish: true },
        system: { read: true, configure: true },
      };
    case 'admin':
      return {
        users: { read: true, write: true, delete: false },
        analytics: { read: true, export: true },
        content: { read: true, write: true, publish: false },
        system: { read: true, configure: false },
      };
    default: // 'user'
      return {
        users: { read: false, write: false, delete: false },
        analytics: { read: false, export: false },
        content: { read: false, write: false, publish: false },
        system: { read: false, configure: false },
      };
  }
}

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAdminUser = async () => {
    // Wait for AuthContext to finish loading before making decisions
    if (authLoading) {
      return;
    }

    if (!user) {
      setAdminUser(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Use RPC function to avoid RLS infinite recursion
      // The mi_get_current_user_access function uses SECURITY DEFINER to bypass RLS
      const { data, error } = await supabase.rpc('mi_get_current_user_access');

      if (error) {
        // RPC function might not exist or other error
        console.error('[AdminContext] Error calling mi_get_current_user_access:', error);
        setAdminUser(null);
      } else if (data && data.is_approved && data.tier) {
        const tier = data.tier as string;
        // Only set as admin if tier is admin or super_admin
        if (tier === 'admin' || tier === 'super_admin') {
          console.log('[AdminContext] Admin user loaded via RPC:', tier);
          setAdminUser({
            id: data.user?.id || user.id,
            user_id: user.id,
            role: tier as AdminRole,
            permissions: getPermissionsForTier(tier),
            created_at: data.approved_at || new Date().toISOString(),
            last_login_at: null,
            is_active: true,
          });
        } else {
          // User tier = not an admin
          console.log('[AdminContext] User is not an admin (tier:', tier, ')');
          setAdminUser(null);
        }
      } else {
        // User not found or not approved
        console.log('[AdminContext] User not in mi_approved_users or not approved');
        setAdminUser(null);
      }
    } catch (error) {
      console.error('[AdminContext] Fatal error:', error);
      toast({
        title: 'Admin Access Error',
        description: 'Failed to verify admin permissions. Please contact support.',
        variant: 'destructive',
      });
      setAdminUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminUser();
  }, [user?.id, authLoading]);

  const hasPermission = (category: keyof AdminPermissions, action: string): boolean => {
    if (!adminUser) return false;

    const categoryPerms = adminUser.permissions[category];
    if (!categoryPerms) return false;

    return (categoryPerms as any)[action] === true;
  };

  const isSuperAdmin = adminUser?.role === 'super_admin';

  const value: AdminContextType = {
    adminUser,
    isAdmin: !!adminUser,
    isLoading,
    hasPermission,
    isSuperAdmin,
    refreshAdminStatus: fetchAdminUser,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};

export const useAdmin = (): AdminContextType => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

// ============================================================================
// PERMISSION HELPER HOOKS
// ============================================================================

export const useCanReadUsers = () => {
  const { hasPermission } = useAdmin();
  return hasPermission('users', 'read');
};

export const useCanWriteUsers = () => {
  const { hasPermission } = useAdmin();
  return hasPermission('users', 'write');
};

export const useCanDeleteUsers = () => {
  const { hasPermission } = useAdmin();
  return hasPermission('users', 'delete');
};

export const useCanReadAnalytics = () => {
  const { hasPermission } = useAdmin();
  return hasPermission('analytics', 'read');
};

export const useCanExportAnalytics = () => {
  const { hasPermission } = useAdmin();
  return hasPermission('analytics', 'export');
};

export const useCanWriteContent = () => {
  const { hasPermission } = useAdmin();
  return hasPermission('content', 'write');
};

export const useCanPublishContent = () => {
  const { hasPermission } = useAdmin();
  return hasPermission('content', 'publish');
};

export const useCanConfigureSystem = () => {
  const { hasPermission } = useAdmin();
  return hasPermission('system', 'configure');
};
