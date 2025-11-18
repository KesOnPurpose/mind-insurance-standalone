import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isEmailVerification, setIsEmailVerification] = useState(false);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check if this is an email verification callback
        const type = searchParams.get('type');
        if (type === 'email' || type === 'signup') {
          setIsEmailVerification(true);
        }

        const { error } = await supabase.auth.getSession();

        if (error) {
          setError(error.message);
          return;
        }

        // If email verification, show success message briefly before redirecting
        if (isEmailVerification) {
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 2000);
        } else {
          // Direct redirect for other auth types
          navigate('/dashboard', { replace: true });
        }
      } catch (err) {
        setError('An unexpected error occurred. Please try again.');
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams, isEmailVerification]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <Card className="p-8 max-w-md">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Authentication Failed</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => navigate('/auth')} className="w-full">
              Back to Sign In
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Show email verification success message
  if (isEmailVerification) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <Card className="p-8 max-w-md">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Email Verified! ✓</h2>
            <p className="text-muted-foreground mb-4">
              Your email has been successfully verified.
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
      <Card className="p-8">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Completing sign in...</h2>
          <p className="text-muted-foreground mt-2">Please wait while we log you in.</p>
        </div>
      </Card>
    </div>
  );
};

export default AuthCallback;
