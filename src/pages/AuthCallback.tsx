import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [isEmailVerification, setIsEmailVerification] = useState(false);

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
          console.log('Supabase auto-detected session, redirecting to dashboard...');
          window.location.href = '/dashboard';
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
            console.log('Session verified, redirecting to dashboard...');
            window.location.href = '/dashboard';
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
            console.log('Session established, redirecting to dashboard...');
            window.location.href = '/dashboard';
            return;
          }
        }

        // Final check for session
        const { data: { session: finalSession } } = await supabase.auth.getSession();
        if (finalSession) {
          console.log('Final session check passed, redirecting...');
          window.location.href = '/dashboard';
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
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Authentication Error</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <div className="space-y-3">
              <Button onClick={() => navigate('/auth')} className="w-full">
                Back to Sign In
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="w-full"
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
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Email Verified! ✓</h2>
            <p className="text-muted-foreground mb-4">
              Welcome to Grouphomes4newbies!
            </p>
            <p className="text-sm text-muted-foreground">
              Redirecting you to your dashboard...
            </p>
            <div className="mt-6">
              <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Default loading state
  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="p-8 max-w-md">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Completing sign in...</h2>
          <p className="text-muted-foreground mt-2">
            Authenticating with Grouphomes4newbies
          </p>
        </div>
      </Card>
    </div>
  );
};

export default AuthCallback;