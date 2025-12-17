import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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

  useEffect(() => {
    const checkAssessment = async () => {
      if (!user?.id || !requireAssessment) {
        setAssessmentStatus('completed');
        return;
      }

      try {
        const { data: onboarding, error } = await supabase
          .from('user_onboarding')
          .select('onboarding_step, assessment_completed_at')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking assessment status:', error);
          setAssessmentStatus('completed');
          return;
        }

        const isCompleted = onboarding?.assessment_completed_at != null || 
          ['assessment_complete', 'assessment_skipped', 'welcome_shown', 'roadmap_visited'].includes(onboarding?.onboarding_step || '');

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

  if (loading || (requireAssessment && assessmentStatus === 'loading')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // MI Standalone: Redirect to MI-specific assessment route
  // Also check for both legacy and new assessment paths to prevent infinite loops
  const isOnAssessmentPage = location.pathname === '/assessment' ||
                              location.pathname === '/mind-insurance/assessment';

  if (requireAssessment && assessmentStatus === 'not_completed' && !isOnAssessmentPage) {
    return <Navigate to="/mind-insurance/assessment" replace />;
  }

  return <>{children}</>;
}
