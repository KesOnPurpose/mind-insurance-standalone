import React, { useState } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { ShieldCheck, Users, BarChart3, Settings, Activity } from 'lucide-react';
import { AnalyticsDashboard } from '@/components/admin/analytics';
import { Button } from '@/components/ui/button';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { useMIAccessControl } from '@/hooks/useMIAccessControl';

// ============================================================================
// ADMIN DASHBOARD
// ============================================================================
// Full admin dashboard with:
// - Permission overview
// - Real-time analytics dashboard
// - Toggle between permissions and analytics views
// ============================================================================

type DashboardView = 'analytics' | 'permissions';

export default function AdminDashboard() {
  const { adminUser, isSuperAdmin } = useAdmin();
  const { tier } = useMIAccessControl();
  const [view, setView] = useState<DashboardView>('analytics');

  if (!adminUser) {
    return null; // Should never happen due to AdminRoute guard
  }

  return (
    <SidebarLayout
      mode="admin"
      showHeader
      headerTitle="Admin Dashboard"
      headerSubtitle={`Welcome back, ${tier?.replace('_', ' ') || adminUser.role}`}
      headerGradient="linear-gradient(135deg, hsl(270 70% 45%), hsl(240 70% 50%))"
    >
      <div className="space-y-6">
        {/* View Toggle */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={view === 'analytics' ? 'default' : 'outline'}
            onClick={() => setView('analytics')}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Analytics
          </Button>
          <Button
            variant={view === 'permissions' ? 'default' : 'outline'}
            onClick={() => setView('permissions')}
          >
            <Settings className="mr-2 h-4 w-4" />
            Permissions
          </Button>
        </div>

        {/* Content Area */}
        {view === 'analytics' ? (
          /* Analytics Dashboard */
          <AnalyticsDashboard />
        ) : (
          /* Permissions Grid */
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Your Permissions</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Users Permissions */}
              <PermissionCard
                icon={<Users className="h-6 w-6" />}
                title="User Management"
                permissions={adminUser.permissions.users}
              />

              {/* Analytics Permissions */}
              <PermissionCard
                icon={<BarChart3 className="h-6 w-6" />}
                title="Analytics"
                permissions={adminUser.permissions.analytics}
              />

              {/* Content Permissions */}
              <PermissionCard
                icon={<Activity className="h-6 w-6" />}
                title="Content Management"
                permissions={adminUser.permissions.content}
              />

              {/* System Permissions */}
              <PermissionCard
                icon={<Settings className="h-6 w-6" />}
                title="System Configuration"
                permissions={adminUser.permissions.system}
              />
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}

// ============================================================================
// PERMISSION CARD COMPONENT
// ============================================================================

interface PermissionCardProps {
  icon: React.ReactNode;
  title: string;
  permissions: Record<string, boolean>;
}

function PermissionCard({ icon, title, permissions }: PermissionCardProps) {
  const permissionEntries = Object.entries(permissions);
  const grantedCount = permissionEntries.filter(([_, value]) => value).length;
  const totalCount = permissionEntries.length;

  return (
    <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-primary/10 rounded-lg text-primary">
          {icon}
        </div>
        <h3 className="font-semibold text-lg">{title}</h3>
      </div>

      <div className="space-y-2">
        {permissionEntries.map(([action, granted]) => (
          <div key={action} className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground capitalize">
              {action.replace('_', ' ')}
            </span>
            {granted ? (
              <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full font-medium">
                ✓ Granted
              </span>
            ) : (
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full font-medium">
                ✗ Denied
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t">
        <p className="text-sm text-muted-foreground">
          {grantedCount} of {totalCount} permissions granted
        </p>
      </div>
    </div>
  );
}
