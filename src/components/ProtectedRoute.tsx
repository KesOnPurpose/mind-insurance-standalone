import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useSubscriptionCheck } from '@/hooks/useSubscriptionCheck';
import { useAccessControl } from '@/hooks/useAccessControl';
import { SubscriptionBanner } from '@/components/SubscriptionBanner';
import { Loader2, ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAssessment?: boolean;
}

export function ProtectedRoute({ children, requireAssessment = true }: ProtectedRouteProps) {
  const { user, loading, signOut } = useAuth();
  const location = useLocation();
  const { isApproved, isLoading: accessLoading, error: accessError } = useAccessControl();
  const [assessmentStatus, setAssessmentStatus] = useState<'loading' | 'completed' | 'not_completed'>('loading');
  const { status: subscriptionStatus, isLoading: subscriptionLoading } = useSubscriptionCheck();

  useEffect(() => {
    const checkAssessment = async () => {
      if (!user?.id || !requireAssessment) {
        setAssessmentStatus('completed');
        return;
      }

      try {
        // Check user_profiles for MI assessment completion
        // This is more reliable than user_onboarding which may be empty
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('mind_insurance_assessment_completed_at, collision_patterns')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking assessment status:', error);
          setAssessmentStatus('completed');
          return;
        }

        // Assessment is complete if either:
        // 1. mind_insurance_assessment_completed_at is set, OR
        // 2. collision_patterns is populated (legacy check)
        const isCompleted = profile?.mind_insurance_assessment_completed_at != null ||
          profile?.collision_patterns != null;

        setAssessmentStatus(isCompleted ? 'completed' : 'not_completed');
      } catch (err) {
        console.error('Assessment check failed:', err);
        setAssessmentStatus('completed');
      }
    };

    if (user?.id) {
      checkAssessment();
    }
  }, [user?.id, requireAssessment]);

  // 1. Handle auth loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // 2. If not authenticated, redirect to auth page
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // 3. Access control loading - show spinner while checking approval
  if (accessLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // 4. FAIL-CLOSED: Not approved OR access check error → Access Denied
  //    Only the users in gh_approved_users with is_active=true can proceed.
  //    If the RPC errors out or times out, deny access (fail-closed).
  if (!isApproved || accessError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <ShieldX className="h-16 w-16 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
          <p className="text-muted-foreground">
            Your account is not authorized to access this application.
            If you believe this is an error, please contact support.
          </p>
          {accessError && (
            <p className="text-sm text-muted-foreground">
              There was an issue verifying your access. Please try again later.
            </p>
          )}
          <div className="flex flex-col gap-3">
            <Button
              variant="default"
              onClick={async () => {
                await signOut();
              }}
            >
              Sign Out
            </Button>
            <a
              href="mailto:support@grouphome4newbies.com"
              className="text-sm text-primary hover:underline"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 5. Now we know user is authenticated AND approved.
  //    Check assessment status loading.
  if (requireAssessment && assessmentStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // MI Standalone: Redirect to MI-specific assessment route
  // Also check for both legacy and new assessment paths to prevent infinite loops
  const isOnAssessmentPage = location.pathname === '/assessment' ||
                              location.pathname === '/mind-insurance/assessment';

  if (requireAssessment && assessmentStatus === 'not_completed' && !isOnAssessmentPage) {
    return <Navigate to="/mind-insurance/assessment" replace />;
  }

  // 6. GHCF Subscription Check (AFTER assessment check)
  //    Only redirect if definitively inactive (has record AND not active).
  //    Since user already passed the approval gate, a missing record here
  //    would be unexpected but we handle it gracefully.
  if (!subscriptionLoading && subscriptionStatus.hasRecord && !subscriptionStatus.isActive) {
    return <Navigate to="/subscription-expired" replace />;
  }

  // Show warning banner for grace period users, then render children
  const showBanner = subscriptionStatus.hasRecord && subscriptionStatus.isGracePeriod;

  return (
    <>
      {showBanner && <SubscriptionBanner status={subscriptionStatus} />}
      {children}
    </>
  );
}
