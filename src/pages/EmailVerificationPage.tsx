import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const EmailVerificationPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [lastSentTime, setLastSentTime] = useState<Date | null>(null);
  const [canResend, setCanResend] = useState(true);
  const [countdown, setCountdown] = useState(0);

  const { user } = useAuth();
  const { toast } = useToast();

  // Check if email is already verified
  useEffect(() => {
    if (user?.email_confirmed_at) {
      window.location.href = '/dashboard';
    }
  }, [user]);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleResendVerification = async () => {
    if (!user?.email) {
      toast({
        title: "No email found",
        description: "Please sign in again to verify your email.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setCanResend(false);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });

      if (error) throw error;

      setVerificationSent(true);
      setLastSentTime(new Date());
      setCountdown(60); // 60 second cooldown

      toast({
        title: "Verification email sent!",
        description: "Please check your inbox and spam folder.",
      });
    } catch (error) {
      console.error('Error resending verification:', error);
      toast({
        title: "Failed to resend",
        description: "Please try again later or contact support.",
        variant: "destructive",
      });
      setCanResend(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-check verification status every 5 seconds
  useEffect(() => {
    const checkVerification = async () => {
      const { data: { user: refreshedUser } } = await supabase.auth.getUser();
      if (refreshedUser?.email_confirmed_at) {
        toast({
          title: "Email verified!",
          description: "Redirecting to dashboard...",
        });
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
      }
    };

    const interval = setInterval(checkVerification, 5000);
    return () => clearInterval(interval);
  }, [toast]);

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="w-16 h-16 rounded-2xl bg-gradient-hero flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl text-center">Verify your email</CardTitle>
          <CardDescription className="text-center">
            We've sent a verification link to{' '}
            <span className="font-semibold text-foreground">{user?.email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertTitle>Check your inbox</AlertTitle>
            <AlertDescription>
              Click the verification link in your email to activate your account.
              The link will expire in 24 hours.
            </AlertDescription>
          </Alert>

          {verificationSent && lastSentTime && (
            <Alert className="border-success/50 bg-success/10">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <AlertTitle className="text-success">Verification email sent!</AlertTitle>
              <AlertDescription>
                Sent at {lastSentTime.toLocaleTimeString()}. Please check your spam folder if you don't see it.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleResendVerification}
              disabled={!canResend || isLoading}
              className="w-full"
              variant="outline"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : countdown > 0 ? (
                `Resend in ${countdown}s`
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Resend verification email
                </>
              )}
            </Button>

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Already verified?{' '}
                <Link
                  to="/dashboard"
                  className="text-primary hover:underline"
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.reload();
                  }}
                >
                  Go to dashboard
                </Link>
              </p>
              <p className="text-sm text-muted-foreground">
                Wrong email?{' '}
                <Link to="/auth" className="text-primary hover:underline">
                  Sign in with different email
                </Link>
              </p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <h3 className="font-semibold text-sm mb-2">Didn't receive the email?</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Check your spam or junk folder</li>
              <li>• Make sure you entered the correct email</li>
              <li>• Wait a few minutes and try resending</li>
              <li>• Contact support if the issue persists</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailVerificationPage;