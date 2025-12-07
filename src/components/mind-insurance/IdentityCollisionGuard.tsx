import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { useIdentityCollisionStatus, hasCompletedCollisionAssessment } from '@/hooks/useIdentityCollisionStatus';
import { Loader2 } from 'lucide-react';

// ============================================================================
// IDENTITY COLLISION GUARD COMPONENT
// ============================================================================
// Enforces mandatory Identity Collision Assessment before accessing Mind Insurance
// - Admins can bypass (for testing/support purposes)
// - Regular users MUST complete assessment first
// - Redirects to /mind-insurance/assessment if not completed
// ============================================================================

interface IdentityCollisionGuardProps {
  children: React.ReactNode;
}

export const IdentityCollisionGuard: React.FC<IdentityCollisionGuardProps> = ({ children }) => {
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const { data: collisionStatus, isLoading: statusLoading } = useIdentityCollisionStatus(user?.id);

  // Show loading spinner while checking auth, admin status, or collision status
  const isLoading = authLoading || adminLoading || statusLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mi-navy">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-mi-cyan" />
          <p className="text-gray-400 text-sm">Checking your profile...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - let ProtectedRoute handle this
  if (!user) {
    return <>{children}</>;
  }

  // ADMIN BYPASS: Admins can skip assessment for testing/support
  if (isAdmin) {
    console.log('[IdentityCollisionGuard] Admin user - bypassing assessment requirement');
    return <>{children}</>;
  }

  // Don't redirect if we're already on the assessment page
  if (location.pathname === '/mind-insurance/assessment') {
    return <>{children}</>;
  }

  // Check if assessment is completed
  const hasPattern = hasCompletedCollisionAssessment(collisionStatus);

  if (!hasPattern) {
    console.log('[IdentityCollisionGuard] Assessment not completed - redirecting to /mind-insurance/assessment');
    // Preserve the intended destination so we can redirect after assessment
    return <Navigate to="/mind-insurance/assessment" state={{ from: location }} replace />;
  }

  // Assessment completed - allow access
  return <>{children}</>;
};

export default IdentityCollisionGuard;
