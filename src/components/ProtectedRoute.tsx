import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscriptionCheck } from '@/hooks/useSubscriptionCheck';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAssessment?: boolean;
}

export function ProtectedRoute({ children, requireAssessment = true }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [assessmentStatus, setAssessmentStatus] = useState<'loading' | 'completed' | 'not_completed'>('loading');
  // FEAT-GHCF-007: Subscription check (fail-open)
  const { status: subscriptionStatus, isLoading: subLoading } = useSubscriptionCheck();

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

  // First, handle auth loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // If not authenticated, redirect to auth page (check this BEFORE assessment status)
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Now we know user exists, check assessment status loading
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

  // FEAT-GHCF-007: Redirect to subscription-expired if explicitly inactive
  // FAIL-OPEN: Only redirect when edge function explicitly returns active=false
  // Loading, errors, or missing status = allow access
  if (!subLoading && subscriptionStatus && !subscriptionStatus.active) {
    return <Navigate to="/subscription-expired" replace />;
  }

  return <>{children}</>;
}
