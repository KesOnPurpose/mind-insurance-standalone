import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useSubscriptionCheck } from '@/hooks/useSubscriptionCheck';
import { useAccessControl } from '@/hooks/useAccessControl';
import { SubscriptionBanner } from '@/components/SubscriptionBanner';
import { Loader2, Lock, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

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

  // 4. FAIL-CLOSED: Not approved OR access check error → Members-only gate
  //    Only the users in gh_approved_users with is_active=true can proceed.
  //    If the RPC errors out or times out, deny access (fail-closed).
  //    Show branded conversion page with checkout link.
  if (!isApproved || accessError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-slate-50 px-4 py-12">
        <div className="max-w-lg w-full text-center space-y-8">
          {/* Lock icon with branded ring */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Lock className="h-10 w-10 text-primary" />
              </div>
            </div>
          </div>

          {/* Headline */}
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              Members-Only Access
            </h1>
            <p className="text-muted-foreground text-lg">
              This platform is exclusively for Grouphome Cash Flow members.
            </p>
          </div>

          {accessError && (
            <p className="text-sm text-muted-foreground">
              There was an issue verifying your access. Please try again later or contact support.
            </p>
          )}

          {/* Value proposition card */}
          <Card className="border-primary/20 bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6 pb-4 space-y-4">
              <p className="text-sm font-semibold text-primary uppercase tracking-wider">
                What members get access to
              </p>
              <ul className="text-left space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span><span className="font-medium text-foreground">Nette AI Assistant</span> — your personal group home business advisor, available 24/7</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span><span className="font-medium text-foreground">Step-by-step programs</span> — from licensing to your first resident, fully guided</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span><span className="font-medium text-foreground">Compliance tools</span> — state-specific requirements, document binders, and audit prep</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span><span className="font-medium text-foreground">Cash flow calculators</span> — property analysis and portfolio tracking built for group homes</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Primary CTA */}
          <div className="space-y-4">
            <Button
              asChild
              size="lg"
              className="w-full text-base font-semibold h-14 shadow-lg shadow-primary/25"
            >
              <a
                href="https://go.grouphomecashflow.com/checkout-page-nette-ai"
                target="_blank"
                rel="noopener noreferrer"
              >
                Get Access Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
            <p className="text-xs text-muted-foreground">
              Already a member? Your access may take a few minutes to activate after purchase.
            </p>
          </div>

          {/* Secondary actions */}
          <div className="flex items-center justify-center gap-4 pt-2 text-sm">
            <button
              onClick={async () => { await signOut(); }}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign Out
            </button>
            <span className="text-muted-foreground/40">|</span>
            <a
              href="mailto:support@grouphome4newbies.com"
              className="text-muted-foreground hover:text-foreground transition-colors"
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
