/**
 * CreateAccountPage
 * FEAT-GHCF-005: Smart polling signup page for GHL contract-to-portal flow.
 *
 * User lands here from GHL contract redirect after signing.
 * The page:
 * 1. Reads ?email=, ?name=, ?ghl_contact_id= from URL params
 * 2. Polls check_email_approved RPC every 2s for up to 30s
 * 3. Once approved: allows signup via password or Google OAuth
 * 4. After signup: calls link-user-after-signup edge function
 * 5. Redirects to /dashboard
 *
 * Mobile-first design - users often come from GHL on phones.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Loader2, CheckCircle2, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { validatePassword, getPasswordStrengthColor, getPasswordStrengthWidth } from '@/utils/passwordValidator';
import { getUserSource, getSignupDomain } from '@/services/domainDetectionService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

type ApprovalStatus = 'idle' | 'checking' | 'approved' | 'not_approved' | 'error';

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_DURATION_MS = 30000;
const MAX_POLL_ATTEMPTS = Math.floor(MAX_POLL_DURATION_MS / POLL_INTERVAL_MS);

const CreateAccountPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signInWithGoogle } = useAuth();

  // Form state
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [fullName, setFullName] = useState(searchParams.get('name') || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const ghlContactId = searchParams.get('ghl_contact_id') || '';

  // Approval polling state
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>('idle');
  const [pollCount, setPollCount] = useState(0);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Password validation
  const passwordValidation = validatePassword(password);
  const passwordsMatch = password === confirmPassword && password.length > 0;

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // Clean up poll timer on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, []);

  // Start polling for approval
  const startPolling = useCallback(async (emailToCheck: string) => {
    if (!emailToCheck || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToCheck)) {
      return;
    }

    // Clear any existing poll
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
    }

    setApprovalStatus('checking');
    setPollCount(0);

    let attempts = 0;

    // Check immediately first
    try {
      const { data, error } = await supabase.rpc('check_email_approved', {
        p_email: emailToCheck,
      });

      if (!error && data === true) {
        setApprovalStatus('approved');
        return;
      }
    } catch {
      // Continue to polling
    }

    attempts++;
    setPollCount(1);

    // Start interval polling
    pollTimerRef.current = setInterval(async () => {
      attempts++;
      setPollCount(attempts);

      if (attempts >= MAX_POLL_ATTEMPTS) {
        if (pollTimerRef.current) {
          clearInterval(pollTimerRef.current);
          pollTimerRef.current = null;
        }
        setApprovalStatus('not_approved');
        return;
      }

      try {
        const { data, error } = await supabase.rpc('check_email_approved', {
          p_email: emailToCheck,
        });

        if (!error && data === true) {
          if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
          }
          setApprovalStatus('approved');
        }
      } catch (err) {
        console.error('[CreateAccount] Poll error:', err);
        // Keep polling on error - don't give up
      }
    }, POLL_INTERVAL_MS);
  }, []);

  // Auto-start polling when email is pre-filled from URL
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailParam)) {
      startPolling(emailParam);
    }
  }, [searchParams, startPolling]);

  // Handle email blur - start polling when user finishes typing email
  const handleEmailBlur = () => {
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && approvalStatus !== 'checking' && approvalStatus !== 'approved') {
      startPolling(email);
    }
  };

  // Handle retry
  const handleRetry = () => {
    if (email) {
      startPolling(email);
    }
  };

  // Handle form submission (password signup)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (approvalStatus !== 'approved') {
      setFormError('Your account has not been approved yet. Please wait for approval.');
      return;
    }

    if (!passwordValidation.isValid) {
      setFormError('Please meet all password requirements');
      return;
    }

    if (!passwordsMatch) {
      setFormError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Sign up with Supabase Auth
      const userSource = getUserSource();
      const signupDomain = getSignupDomain();

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            user_source: userSource,
            signup_domain: signupDomain,
          },
        },
      });

      if (signUpError) {
        setFormError(signUpError.message);
        return;
      }

      if (!signUpData.user) {
        setFormError('Account creation failed. Please try again.');
        return;
      }

      // 2. Link user to gh_approved_users via edge function
      try {
        await supabase.functions.invoke('link-user-after-signup', {
          body: {
            user_id: signUpData.user.id,
            email: email.toLowerCase(),
          },
        });
      } catch (linkError) {
        // Non-blocking: log but don't prevent access
        console.error('[CreateAccount] Link error (non-blocking):', linkError);
      }

      toast({
        title: 'Account created!',
        description: 'Welcome to Group Home Cash Flow. Redirecting to your dashboard...',
      });

      // 3. Redirect to dashboard
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('[CreateAccount] Signup error:', err);
      setFormError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Google OAuth signup
  const handleGoogleSignUp = async () => {
    if (approvalStatus !== 'approved') {
      setFormError('Your account has not been approved yet. Please wait for approval.');
      return;
    }

    setFormError('');
    setIsSubmitting(true);

    try {
      toast({
        title: 'Redirecting to Google',
        description: "You'll be securely authenticated via Google",
      });

      const { error } = await signInWithGoogle();
      if (error) {
        setFormError(error.message);
      }
      // Note: Google OAuth will redirect away, so link-user-after-signup
      // will need to be handled via auth callback or database trigger
    } catch (err) {
      setFormError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render approval status indicator
  const renderApprovalStatus = () => {
    switch (approvalStatus) {
      case 'idle':
        return null;
      case 'checking':
        return (
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            <span>Checking your approval status... ({pollCount}/{MAX_POLL_ATTEMPTS})</span>
          </div>
        );
      case 'approved':
        return (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>You're approved! Create your account below.</span>
          </div>
        );
      case 'not_approved':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
              <Clock className="h-4 w-4 shrink-0" />
              <span>Your approval is still processing. Please wait a moment and try again.</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Check Again
            </Button>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Error checking approval. Please try again.</span>
          </div>
        );
      default:
        return null;
    }
  };

  const isFormDisabled = isSubmitting || approvalStatus !== 'approved';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto bg-white border-gray-200 shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Create Your Account
          </CardTitle>
          <CardDescription className="text-gray-600">
            Welcome to Group Home Cash Flow! Set up your account to access your portal.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Approval Status */}
          {renderApprovalStatus()}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="full-name" className="text-gray-700">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="full-name"
                  type="text"
                  placeholder="Your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-10"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={handleEmailBlur}
                  className="pl-10"
                  required
                  disabled={isSubmitting}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                  disabled={isFormDisabled}
                  autoComplete="new-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isFormDisabled}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {/* Password Strength Meter */}
              {password && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          passwordValidation.strength === 'weak' ? 'bg-red-500' :
                          passwordValidation.strength === 'fair' ? 'bg-orange-500' :
                          passwordValidation.strength === 'good' ? 'bg-yellow-500' :
                          passwordValidation.strength === 'strong' ? 'bg-green-500' :
                          'bg-green-600'
                        }`}
                        style={{ width: getPasswordStrengthWidth(passwordValidation.score) }}
                      />
                    </div>
                    <span className={`text-sm ${getPasswordStrengthColor(passwordValidation.strength)}`}>
                      {passwordValidation.strength}
                    </span>
                  </div>
                  {passwordValidation.feedback.length > 0 && (
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {passwordValidation.feedback.map((fb, i) => (
                        <li key={i}>• {fb}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-gray-700">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                  required
                  disabled={isFormDisabled}
                  autoComplete="new-password"
                />
              </div>
              {confirmPassword && !passwordsMatch && (
                <p className="text-xs text-red-500">Passwords do not match</p>
              )}
              {confirmPassword && passwordsMatch && (
                <p className="text-xs text-green-500">Passwords match</p>
              )}
            </div>

            {/* Error Alert */}
            {formError && (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full font-semibold bg-teal-500 hover:bg-teal-600 text-white"
              disabled={isFormDisabled || !passwordValidation.isValid || !passwordsMatch}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </Button>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or</span>
              </div>
            </div>

            {/* Google OAuth */}
            <Button
              type="button"
              variant="outline"
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
              onClick={handleGoogleSignUp}
              disabled={isFormDisabled}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          <p className="text-xs text-center text-muted-foreground w-full">
            Already have an account?{' '}
            <a href="/auth" className="text-teal-600 hover:underline font-medium">
              Sign in
            </a>
          </p>
          <p className="text-xs text-center text-muted-foreground w-full">
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CreateAccountPage;
