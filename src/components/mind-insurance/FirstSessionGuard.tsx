/**
 * FirstSessionGuard Component
 * Mind Insurance - $100M Feature
 *
 * Ensures users complete their First Session (protocol reveal + engagement)
 * before accessing the Coverage Center and daily practices.
 *
 * Pattern: Follows existing IdentityCollisionGuard implementation
 * - Admins can bypass (for testing/support purposes)
 * - Regular users MUST complete first session first
 * - Redirects to /mind-insurance/first-session if not completed
 */

import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { hasCompletedFirstEngagement } from '@/services/mioInsightsThreadService';

// ============================================================================
// CONSTANTS
// ============================================================================

// Maximum time to wait for loading before redirecting to first-session
const LOADING_TIMEOUT_MS = 10000; // 10 seconds (matches IdentityCollisionGuard)

// ============================================================================
// COMPONENT
// ============================================================================

interface FirstSessionGuardProps {
  children: React.ReactNode;
}

export const FirstSessionGuard: React.FC<FirstSessionGuardProps> = ({ children }) => {
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdmin();

  // Local state for first session check
  const [isChecking, setIsChecking] = useState(true);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);

  // Check if user has completed first engagement
  useEffect(() => {
    const checkFirstSession = async () => {
      if (!user?.id || authLoading || adminLoading) return;

      // Admin bypass - skip check
      if (isAdmin) {
        setHasCompleted(true);
        setIsChecking(false);
        return;
      }

      try {
        const completed = await hasCompletedFirstEngagement(user.id);
        setHasCompleted(completed);
      } catch (error) {
        console.error('[FirstSessionGuard] Error checking first session:', error);
        // On error, allow access (fail open for UX)
        setHasCompleted(true);
      } finally {
        setIsChecking(false);
      }
    };

    checkFirstSession();
  }, [user?.id, authLoading, adminLoading, isAdmin]);

  // Timeout handler to prevent infinite loading spinner
  useEffect(() => {
    const isLoading = authLoading || adminLoading || isChecking;

    if (isLoading && !loadingTimedOut) {
      const timeout = setTimeout(() => {
        console.warn('[FirstSessionGuard] Loading timeout exceeded - redirecting to first-session');
        setLoadingTimedOut(true);
      }, LOADING_TIMEOUT_MS);

      return () => clearTimeout(timeout);
    }
  }, [authLoading, adminLoading, isChecking, loadingTimedOut]);

  // Combined loading state
  const isLoading = authLoading || adminLoading || isChecking;

  // If loading timed out, redirect to first-session
  if (loadingTimedOut && location.pathname !== '/mind-insurance/first-session') {
    console.log('[FirstSessionGuard] Timeout redirect to first-session');
    return <Navigate to="/mind-insurance/first-session" state={{ from: location }} replace />;
  }

  // Show loading spinner while checking
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mi-navy">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-mi-cyan" />
          <p className="text-gray-400 text-sm">Checking your progress...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - let ProtectedRoute handle this
  if (!user) {
    return <>{children}</>;
  }

  // ADMIN BYPASS: Admins can skip first session for testing/support
  if (isAdmin) {
    console.log('[FirstSessionGuard] Admin user - bypassing first session requirement');
    return <>{children}</>;
  }

  // Don't redirect if we're already on the first-session page
  if (location.pathname === '/mind-insurance/first-session') {
    return <>{children}</>;
  }

  // Check if first session is completed
  if (!hasCompleted) {
    console.log('[FirstSessionGuard] First session not completed - redirecting to /mind-insurance/first-session');
    // Preserve the intended destination so we can redirect after completion
    return <Navigate to="/mind-insurance/first-session" state={{ from: location }} replace />;
  }

  // First session completed - allow access
  return <>{children}</>;
};

export default FirstSessionGuard;
