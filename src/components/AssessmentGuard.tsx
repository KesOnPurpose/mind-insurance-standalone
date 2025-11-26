import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { useOnboardingStatus, isAssessmentCompleted } from '@/hooks/useOnboardingStatus';
import { Loader2 } from 'lucide-react';

// ============================================================================
// ASSESSMENT GUARD COMPONENT
// ============================================================================
// Enforces mandatory assessment completion before accessing dashboard routes
// - Admins can bypass (for testing/support purposes)
// - Regular users MUST complete assessment first
// - Redirects to /assessment if not completed
// ============================================================================

interface AssessmentGuardProps {
  children: React.ReactNode;
}

export const AssessmentGuard: React.FC<AssessmentGuardProps> = ({ children }) => {
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const { data: onboardingStatus, isLoading: onboardingLoading } = useOnboardingStatus(user?.id);

  // Show loading spinner while checking auth, admin status, or onboarding status
  const isLoading = authLoading || adminLoading || onboardingLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Loading your experience...</p>
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
    console.log('[AssessmentGuard] Admin user - bypassing assessment requirement');
    return <>{children}</>;
  }

  // Check if assessment is completed
  const assessmentDone = isAssessmentCompleted(onboardingStatus);

  if (!assessmentDone) {
    console.log('[AssessmentGuard] Assessment not completed - redirecting to /assessment');
    // Preserve the intended destination so we can redirect after assessment
    return <Navigate to="/assessment" state={{ from: location }} replace />;
  }

  // Assessment completed - allow access
  return <>{children}</>;
};

export default AssessmentGuard;
