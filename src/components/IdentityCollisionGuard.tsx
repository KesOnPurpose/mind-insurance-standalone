import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { useIdentityCollisionStatus, hasCompletedCollisionAssessment } from '@/hooks/useIdentityCollisionStatus';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Maximum time to wait for loading states before showing retry UI
// Reduced to 10s to match other guards - 30s was masking real issues
const LOADING_TIMEOUT_MS = 10000; // 10 seconds

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
  const { data: collisionStatus, isLoading: statusLoading, refetch } = useIdentityCollisionStatus(user?.id);

  // Timeout state for showing retry UI
  const [hasTimedOut, setHasTimedOut] = useState(false);

  // Track loading timeout
  useEffect(() => {
    // Reset timeout state when dependencies change
    setHasTimedOut(false);

    const isStillLoading = authLoading || adminLoading || statusLoading;

    if (!isStillLoading) {
      // Not loading, no need for timeout
      return;
    }

    const timeoutId = setTimeout(() => {
      setHasTimedOut(true);
      console.warn('[IdentityCollisionGuard] Loading timeout reached after', LOADING_TIMEOUT_MS, 'ms');
    }, LOADING_TIMEOUT_MS);

    return () => clearTimeout(timeoutId);
  }, [authLoading, adminLoading, statusLoading, user?.id]);

  // Calculate overall loading state
  const isLoading = authLoading || adminLoading || statusLoading;

  // Handle retry action
  const handleRetry = () => {
    setHasTimedOut(false);
    refetch();
  };

  // Debug logging
  useEffect(() => {
    console.log('[IdentityCollisionGuard] State:', {
      userId: user?.id,
      authLoading,
      adminLoading,
      statusLoading,
      isAdmin,
      hasPattern: collisionStatus?.hasPattern,
      source: collisionStatus?.source,
      hasTimedOut,
      path: location.pathname,
    });
  }, [user?.id, authLoading, adminLoading, statusLoading, isAdmin, collisionStatus, hasTimedOut, location.pathname]);

  // Show timeout retry UI if loading takes too long
  if (hasTimedOut && isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-xl font-semibold text-foreground">Taking longer than expected</h2>
          <p className="text-muted-foreground">
            We're having trouble loading your assessment status. This could be due to a slow connection.
          </p>
          <Button onClick={handleRetry} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Show loading spinner while checking auth and status
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Checking assessment status...</p>
        </div>
      </div>
    );
  }

  // If no user, let AuthGuard handle the redirect
  if (!user) {
    console.log('[IdentityCollisionGuard] No user, deferring to AuthGuard');
    return <>{children}</>;
  }

  // Admins can bypass the guard (for testing/support purposes)
  if (isAdmin) {
    console.log('[IdentityCollisionGuard] Admin bypass - allowing access');
    return <>{children}</>;
  }

  // Check if user has completed the Identity Collision Assessment
  const hasCompleted = hasCompletedCollisionAssessment(collisionStatus);

  if (!hasCompleted) {
    console.log('[IdentityCollisionGuard] Assessment not completed, redirecting to /mind-insurance/assessment');
    // Redirect to assessment page, preserving the intended destination
    return (
      <Navigate
        to="/mind-insurance/assessment"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  // User has completed assessment, allow access
  console.log('[IdentityCollisionGuard] Assessment completed, allowing access');
  return <>{children}</>;
};

export default IdentityCollisionGuard;
