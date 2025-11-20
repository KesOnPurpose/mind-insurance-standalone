import React from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { ShieldCheck, Users, BarChart3, Settings, Activity } from 'lucide-react';

// ============================================================================
// ADMIN DASHBOARD - PLACEHOLDER
// ============================================================================
// Temporary admin dashboard showing admin status and permissions
// Will be replaced with full analytics dashboard in future iterations
// ============================================================================

export default function AdminDashboard() {
  const { adminUser, isSuperAdmin } = useAdmin();

  if (!adminUser) {
    return null; // Should never happen due to AdminRoute guard
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <ShieldCheck className="h-12 w-12 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground">
                Welcome back, {adminUser.role === 'super_admin' ? 'Super Admin' : adminUser.role}
              </p>
            </div>
          </div>

          {/* Role Badge */}
          <div className="mt-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              isSuperAdmin
                ? 'bg-purple-100 text-purple-800'
                : 'bg-blue-100 text-blue-800'
            }`}>
              {adminUser.role.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>

        {/* Permissions Grid */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
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

        {/* Coming Soon */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-8 border-2 border-dashed border-primary/20">
          <h3 className="text-xl font-bold text-foreground mb-2">
            Full Dashboard Coming Soon
          </h3>
          <p className="text-muted-foreground">
            The complete admin analytics dashboard with real-time metrics, user management,
            and system monitoring will be available in the next update.
          </p>
        </div>
      </div>
    </div>
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
