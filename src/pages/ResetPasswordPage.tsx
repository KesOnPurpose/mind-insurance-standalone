import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { validatePassword, getPasswordStrengthColor, getPasswordStrengthWidth } from '@/utils/passwordValidator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(true);
  const [isValidSession, setIsValidSession] = useState(false);
  const resolvedRef = useRef(false);

  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const passwordValidation = validatePassword(password);
  const passwordsMatch = password === confirmPassword && password.length > 0;

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    let subscription: { unsubscribe: () => void } | null = null;

    const markValid = (source: string) => {
      if (resolvedRef.current) return;
      resolvedRef.current = true;
      console.log('[ResetPassword] Session validated via:', source);
      setIsValidSession(true);
      setIsValidating(false);
      if (timeoutId) clearTimeout(timeoutId);
      if (subscription) subscription.unsubscribe();
    };

    const markInvalid = (reason: string) => {
      if (resolvedRef.current) return;
      resolvedRef.current = true;
      console.log('[ResetPassword] Session invalid:', reason);
      setIsValidating(false);
      toast({
        title: "Invalid or expired link",
        description: "Please request a new password reset link.",
        variant: "destructive",
      });
      navigate('/forgot-password');
    };

    const handleRecoveryFlow = async () => {
      console.log('[ResetPassword] Starting recovery flow...');
      console.log('[ResetPassword] URL:', window.location.href);
      console.log('[ResetPassword] Hash:', window.location.hash ? 'present' : 'empty');
      console.log('[ResetPassword] Search:', window.location.search || 'empty');

      // Step 1: Listen for auth state changes (catches events that fire after mount)
      const sub = supabase.auth.onAuthStateChange((event, session) => {
        console.log('[ResetPassword] Auth event:', event, session ? 'has session' : 'no session');
        if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
          markValid(`auth event: ${event}`);
        }
      });
      subscription = sub.data.subscription;

      // Step 2: Handle PKCE code flow (query param ?code=XXX)
      // Supabase may send ?code= instead of #access_token= if server uses PKCE
      const queryParams = new URLSearchParams(window.location.search);
      const code = queryParams.get('code');

      if (code) {
        console.log('[ResetPassword] Found PKCE code in URL, exchanging...');
        try {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.error('[ResetPassword] Code exchange error:', exchangeError);
            markInvalid(`code exchange failed: ${exchangeError.message}`);
            return;
          }
          // Code exchange fires auth events; wait briefly for them to propagate
          await new Promise(resolve => setTimeout(resolve, 500));
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            markValid('PKCE code exchange');
            return;
          }
        } catch (err) {
          console.error('[ResetPassword] Code exchange exception:', err);
        }
      }

      // Step 3: Handle implicit flow tokens in hash (#access_token=...&type=recovery)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      if (accessToken && refreshToken) {
        console.log('[ResetPassword] Found tokens in hash, setting session...');
        try {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionError) {
            console.error('[ResetPassword] setSession error:', sessionError);
          } else {
            // Wait for session to propagate
            await new Promise(resolve => setTimeout(resolve, 500));
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              markValid('hash token setSession');
              return;
            }
          }
        } catch (err) {
          console.error('[ResetPassword] setSession exception:', err);
        }
      }

      // Step 4: Check if detectSessionInUrl already processed the tokens
      // (getSession waits for Supabase initialization to complete)
      try {
        console.log('[ResetPassword] Checking existing session...');
        const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
        if (sessionErr) {
          console.error('[ResetPassword] getSession error:', sessionErr);
        }
        if (session) {
          markValid('existing session (detectSessionInUrl)');
          return;
        }
      } catch (err) {
        console.error('[ResetPassword] getSession exception:', err);
      }

      // Step 5: No session found yet — wait up to 15s for auth event
      console.log('[ResetPassword] No session yet, waiting for auth events (15s timeout)...');
      timeoutId = setTimeout(() => {
        markInvalid('timeout after 15s');
      }, 15000);
    };

    handleRecoveryFlow();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (subscription) subscription.unsubscribe();
    };
  }, [navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!passwordValidation.isValid) {
      setError('Please meet all password requirements');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    const { error } = await updatePassword(password);

    setIsLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-8">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
              <h2 className="text-xl font-semibold">Validating reset link...</h2>
              <p className="text-muted-foreground mt-2">
                Please wait while we verify your password reset request.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Password updated!</h2>
              <p className="text-muted-foreground mb-6">
                Your password has been successfully reset.
              </p>
              <p className="text-sm text-muted-foreground">
                Redirecting to dashboard...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isValidSession) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-gradient-hero flex items-center justify-center mb-4">
            {/* Fixed: Changed LockIcon to Lock since that is what is imported */}
            <Lock className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl">Create new password</CardTitle>
          <CardDescription>
            Enter your new password below. Make sure it's secure!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                  required
                  disabled={isLoading}
                  autoFocus
                  data-testid="input-new-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  data-testid="button-toggle-password"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>

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
                    <span className={`text-sm ${getPasswordStrengthColor(passwordValidation.strength)}`} data-testid="text-password-strength">
                      {passwordValidation.strength}
                    </span>
                  </div>
                  {passwordValidation.feedback.length > 0 && (
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {passwordValidation.feedback.map((feedback, index) => (
                        <li key={index}>• {feedback}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                data-testid="input-confirm-password"
              />
              {confirmPassword && !passwordsMatch && (
                <p className="text-xs text-red-500">Passwords do not match</p>
              )}
              {confirmPassword && passwordsMatch && (
                <p className="text-xs text-green-500">Passwords match</p>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !passwordValidation.isValid || !passwordsMatch}
              data-testid="button-update-password"
            >
              {isLoading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;