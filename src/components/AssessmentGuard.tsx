import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { useOnboardingStatus, isAssessmentCompleted } from '@/hooks/useOnboardingStatus';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Maximum time to wait for loading states before showing timeout UI
const LOADING_TIMEOUT_MS = 10000; // 10 seconds

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
  const { data: onboardingStatus, isLoading: onboardingLoading, refetch } = useOnboardingStatus(user?.id);
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);

  // Show loading spinner while checking auth, admin status, or onboarding status
  const isLoading = authLoading || adminLoading || onboardingLoading;

  // Timeout handler to prevent infinite loading spinner
  useEffect(() => {
    if (isLoading && !loadingTimedOut) {
      const timeout = setTimeout(() => {
        console.warn('[AssessmentGuard] Loading timeout exceeded - showing timeout UI');
        setLoadingTimedOut(true);
      }, LOADING_TIMEOUT_MS);

      return () => clearTimeout(timeout);
    }
    // Reset timeout state when loading completes
    if (!isLoading) {
      setLoadingTimedOut(false);
    }
  }, [isLoading, loadingTimedOut]);

  // Show loading state (only while not timed out)
  if (isLoading && !loadingTimedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Loading your experience...</p>
        </div>
      </div>
    );
  }

  // Show timeout UI with retry options
  if (loadingTimedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md mx-auto p-6">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-xl font-semibold">Taking longer than expected</h2>
          <p className="text-muted-foreground">
            We're having trouble loading your experience. This could be due to a slow connection.
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => {
                setLoadingTimedOut(false);
                refetch?.();
              }}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </div>
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
