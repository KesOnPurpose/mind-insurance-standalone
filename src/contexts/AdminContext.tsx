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

      // Query mi_approved_users table (MI Standalone access control)
      const { data, error } = await supabase
        .from('mi_approved_users')
        .select('id, user_id, tier, is_active, created_at, last_access_at')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        if (error.code === 'PGRST116') {
          // No matching user found
          console.log('[AdminContext] User not found in mi_approved_users');
          setAdminUser(null);
        } else if (error.code === '42501' || error.message?.includes('406') || error.message?.includes('permission denied')) {
          // RLS policy denied access
          console.log('[AdminContext] User does not have admin permissions (RLS denied)');
          setAdminUser(null);
        } else {
          // Unexpected error - log but fail gracefully
          console.error('[AdminContext] Unexpected error fetching admin user:', error);
          setAdminUser(null);
        }
      } else if (data) {
        // Only set as admin if tier is admin or super_admin
        const tier = data.tier as string;
        if (tier === 'admin' || tier === 'super_admin') {
          console.log('[AdminContext] Admin user loaded:', tier);
          setAdminUser({
            id: data.id,
            user_id: data.user_id || '',
            role: tier as AdminRole,
            permissions: getPermissionsForTier(tier),
            created_at: data.created_at || '',
            last_login_at: data.last_access_at,
            is_active: data.is_active,
          });

          // Update last_access_at timestamp
          await supabase
            .from('mi_approved_users')
            .update({ last_access_at: new Date().toISOString() })
            .eq('id', data.id);
        } else {
          // User tier = not an admin
          console.log('[AdminContext] User is not an admin (tier:', tier, ')');
          setAdminUser(null);
        }
      } else {
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
