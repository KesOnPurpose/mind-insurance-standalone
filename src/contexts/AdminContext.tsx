import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// ============================================================================
// ADMIN CONTEXT - Role-Based Access Control
// ============================================================================
// Manages admin authentication state and permission checking
// Integrates with admin_users table and RLS policies
// ============================================================================

interface AdminPermissions {
  users: { read: boolean; write: boolean; delete: boolean };
  analytics: { read: boolean; export: boolean };
  content: { read: boolean; write: boolean; publish: boolean };
  system: { read: boolean; configure: boolean };
}

export type AdminRole = 'super_admin' | 'analyst' | 'content_manager' | 'support';

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

      // Query admin_users table (RLS policies will handle access control)
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No matching admin user found (not an error, user is just not an admin)
          console.log('[AdminContext] User is not an admin');
          setAdminUser(null);
        } else {
          console.error('[AdminContext] Error fetching admin user:', error);
          throw error;
        }
      } else {
        console.log('[AdminContext] Admin user loaded:', data.role);
        setAdminUser(data as AdminUser);

        // Update last_login_at timestamp
        await supabase
          .from('admin_users')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', data.id);
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
