import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { detectAndMergeProviderAccounts } from '@/services/providerMergeService';
import { getUserSource, getSignupDomain } from '@/services/domainDetectionService';
import { toast } from 'sonner';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [isEmailVerification, setIsEmailVerification] = useState(false);

  // Handle provider merge and smart redirect after authentication
  const handleAuthenticatedUser = async (session: any) => {
    try {
      console.log('AuthCallback: Handling authenticated user:', session.user.email);

      // Check for multi-provider accounts and merge if needed
      const mergeResult = await detectAndMergeProviderAccounts(session.user);

      if (mergeResult.success && mergeResult.migrated) {
        console.log('AuthCallback: Provider accounts merged:', mergeResult.message);
        toast.success('Welcome back! Your previous assessment has been preserved.');
      }

      // Use primary user_id for redirect logic (in case of merge)
      const userId = mergeResult.primary_user_id || session.user.id;

      // Ensure user_source is set for OAuth signups
      // OAuth providers can't pass custom metadata, so we update the profile here
      await ensureUserSource(userId);

      await smartRedirect(userId);

    } catch (error) {
      console.error('AuthCallback: Provider merge failed, continuing with original user:', error);
      // Graceful fallback: continue with current session user_id
      await ensureUserSource(session.user.id);
      await smartRedirect(session.user.id);
    }
  };

  // Ensure user_source is set for OAuth signups (can't pass metadata during OAuth)
  const ensureUserSource = async (userId: string) => {
    try {
      // Check if user_source is already set
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('user_source')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.log('AuthCallback: Could not check user_source:', profileError.message);
        return;
      }

      // If user_source is unknown or missing, update it from current domain
      if (!profile?.user_source || profile.user_source === 'unknown') {
        const userSource = getUserSource();
        const signupDomain = getSignupDomain();

        console.log('AuthCallback: Setting user_source to:', userSource, 'from domain:', signupDomain);

        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({
            user_source: userSource,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (updateError) {
          console.error('AuthCallback: Failed to update user_source:', updateError);
        } else {
          console.log('AuthCallback: user_source updated successfully');
        }
      } else {
        console.log('AuthCallback: user_source already set to:', profile.user_source);
      }
    } catch (err) {
      console.error('AuthCallback: Error in ensureUserSource:', err);
    }
  };

  // Smart redirect based on Identity Collision assessment completion status
  // Mind Insurance uses Identity Collision Assessment as the gating assessment
  const smartRedirect = async (userId: string) => {
    try {
      console.log('AuthCallback: Checking Identity Collision assessment for smart redirect...');

      // Check if user has completed Identity Collision Assessment (MI-specific)
      // Check user_profiles.collision_patterns first (fastest check)
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('collision_patterns')
        .eq('id', userId)
        .single();

      // If collision_patterns exists and has data, user has completed assessment
      const hasCollisionPatterns = profile?.collision_patterns &&
        typeof profile.collision_patterns === 'object' &&
        Object.keys(profile.collision_patterns).length > 0 &&
        (profile.collision_patterns as Record<string, unknown>).primary_pattern;

      if (hasCollisionPatterns) {
        // Assessment completed - redirect to Mind Insurance Hub
        console.log('AuthCallback: Identity Collision completed - redirecting to /mind-insurance');
        window.location.href = '/mind-insurance';
        return;
      }

      // Also check identity_collision_assessments table as fallback
      const { data: collisionAssessment } = await supabase
        .from('identity_collision_assessments')
        .select('id')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

      if (collisionAssessment) {
        console.log('AuthCallback: Found assessment record - redirecting to /mind-insurance');
        window.location.href = '/mind-insurance';
        return;
      }

      // No assessment found - redirect to Identity Collision Assessment
      console.log('AuthCallback: No Identity Collision assessment - redirecting to /mind-insurance/assessment');
      window.location.href = '/mind-insurance/assessment';
    } catch (err) {
      console.error('Smart redirect error, defaulting to assessment:', err);
      // On error, default to assessment (safer - ensures onboarding)
      window.location.href = '/mind-insurance/assessment';
    }
  };

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('AuthCallback: Starting authentication process...');
        console.log('Full URL:', window.location.href);
        console.log('Hash:', window.location.hash);
        console.log('Search:', window.location.search);

        // First, let Supabase handle the URL automatically
        const { data: { session: autoSession }, error: autoError } = await supabase.auth.getSession();

        if (autoSession) {
          console.log('Supabase auto-detected session, checking for provider merge...');
          await handleAuthenticatedUser(autoSession);
          return;
        }

        // Get both hash and query parameters (different OAuth providers use different methods)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const queryParams = new URLSearchParams(window.location.search);

        // Try to get tokens from hash first (implicit flow)
        let accessToken = hashParams.get('access_token');
        let refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type') || queryParams.get('type');

        // Try to get code from query params (authorization code flow)
        const code = queryParams.get('code');
        const error = queryParams.get('error');
        const errorDescription = queryParams.get('error_description');

        console.log('Auth params:', {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          hasCode: !!code,
          type,
          error,
          errorDescription
        });

        // Handle OAuth errors
        if (error) {
          console.error('OAuth error:', error, errorDescription);
          setError(errorDescription || error || 'Authentication failed');
          setIsProcessing(false);
          return;
        }

        // Check if this is an email verification
        if (type === 'email' || type === 'signup') {
          setIsEmailVerification(true);
        }

        // If we have tokens in the hash, set the session
        if (accessToken && refreshToken) {
          console.log('Setting session with tokens from hash...');
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            console.error('Session error:', sessionError);
            setError(sessionError.message);
            setIsProcessing(false);
            return;
          }

          // Wait for session to be established
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Verify the session was set
          const { data: { session: verifySession } } = await supabase.auth.getSession();
          console.log('Session verification after setting:', !!verifySession);

          if (verifySession) {
            console.log('Session verified, checking for provider merge...');
            await handleAuthenticatedUser(verifySession);
            return;
          }
        }

        // If we have a code, exchange it for a session
        if (code) {
          console.log('Exchanging authorization code for session...');
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            console.error('Code exchange error:', exchangeError);
            // Check if it's a PKCE error and provide helpful message
            if (exchangeError.message.includes('PKCE')) {
              setError('Authentication configuration error. Please contact support.');
            } else {
              setError(exchangeError.message);
            }
            setIsProcessing(false);
            return;
          }

          // Wait for session to be established
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Verify the session after exchange
          const { data: { session: newSession } } = await supabase.auth.getSession();
          console.log('Session after code exchange:', !!newSession);

          if (newSession) {
            console.log('Session established, checking for provider merge...');
            await handleAuthenticatedUser(newSession);
            return;
          }
        }

        // Final check for session
        const { data: { session: finalSession } } = await supabase.auth.getSession();
        if (finalSession) {
          console.log('Final session check passed, checking for provider merge...');
          await handleAuthenticatedUser(finalSession);
          return;
        }

        // No authentication data found
        console.log('No authentication data found in URL or session');
        setError('No authentication session found. Please try signing in again.');
        setIsProcessing(false);
      } catch (err) {
        console.error('Auth callback error:', err);
        setError('An unexpected error occurred. Please try signing in again.');
        setIsProcessing(false);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-mi-navy flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full bg-mi-navy-light border-red-500/30">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-white">Authentication Error</h2>
            <p className="text-white/70 mb-6">{error}</p>
            <div className="space-y-3">
              <Button onClick={() => navigate('/auth')} className="w-full bg-mi-cyan hover:bg-mi-cyan/90 text-mi-navy">
                Back to Sign In
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="w-full border-white/30 text-white hover:bg-white/10"
              >
                Try Again
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Show email verification success message
  if (!isProcessing && isEmailVerification) {
    return (
      <div className="min-h-screen bg-mi-navy flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full bg-mi-navy-light border-mi-cyan/30">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-mi-cyan/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-mi-cyan" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-white">Email Verified!</h2>
            <p className="text-white/70 mb-4">
              Welcome to Mind Insurance
            </p>
            <p className="text-sm text-white/50">
              Redirecting you to your dashboard...
            </p>
            <div className="mt-6">
              <Loader2 className="w-6 h-6 animate-spin text-mi-cyan mx-auto" />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Default loading state
  return (
    <div className="min-h-screen bg-mi-navy flex items-center justify-center p-4">
      <Card className="p-8 max-w-md bg-mi-navy-light border-mi-cyan/30">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-mi-cyan mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white">Completing sign in...</h2>
          <p className="text-white/70 mt-2">
            Authenticating with Mind Insurance
          </p>
        </div>
      </Card>
    </div>
  );
};

export default AuthCallback;