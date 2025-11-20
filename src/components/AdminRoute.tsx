import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAdmin } from '@/contexts/AdminContext';
import { Loader2, ShieldAlert } from 'lucide-react';

// ============================================================================
// ADMIN ROUTE GUARD
// ============================================================================
// Protected route wrapper that enforces admin authentication
// Shows loading state while verifying admin status
// Redirects non-admin users to home page with error message
// ============================================================================

interface AdminRouteProps {
  children: React.ReactNode;
  requiredPermission?: {
    category: 'users' | 'analytics' | 'content' | 'system';
    action: string;
  };
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children, requiredPermission }) => {
  const { isAdmin, isLoading, hasPermission } = useAdmin();

  // Loading state while checking admin status
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Verifying admin permissions...</p>
        </div>
      </div>
    );
  }

  // Not an admin - redirect to home
  if (!isAdmin) {
    console.warn('[AdminRoute] Access denied - user is not an admin');
    return (
      <Navigate
        to="/"
        replace
        state={{
          error: 'Admin access required. Please contact support if you believe this is an error.'
        }}
      />
    );
  }

  // Check specific permission if required
  if (requiredPermission) {
    const { category, action } = requiredPermission;

    if (!hasPermission(category, action)) {
      console.warn(`[AdminRoute] Access denied - missing ${category}.${action} permission`);

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center space-y-4">
            <ShieldAlert className="h-16 w-16 text-destructive mx-auto" />
            <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
            <p className="text-muted-foreground">
              You don't have permission to access this section.
            </p>
            <p className="text-sm text-muted-foreground">
              Required: <code className="bg-slate-100 px-2 py-1 rounded">{category}.{action}</code>
            </p>
            <button
              onClick={() => window.history.back()}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }
  }

  // Admin user with required permissions - render protected content
  return <>{children}</>;
};
