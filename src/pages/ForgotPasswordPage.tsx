import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const { error } = await resetPassword(email);

    setIsLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setIsSuccess(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link
          to="/auth"
          className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to sign in</span>
        </Link>

        <Card>
          {!isSuccess ? (
            <>
              <CardHeader className="space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-gradient-hero flex items-center justify-center mb-4">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-2xl">Set or Reset Password</CardTitle>
                <CardDescription>
                  If you previously used Magic Links or forgot your password, enter your email below to set a new one.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email address</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      autoFocus
                    />
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Sending...' : 'Send Password Setup Link'}
                  </Button>

                  <div className="text-center">
                    <Link
                      to="/auth"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Remember your password? Sign in
                    </Link>
                  </div>
                </form>
              </CardContent>
            </>
          ) : (
            <CardContent className="py-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-success" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Check your email</h2>
                <p className="text-muted-foreground mb-6">
                  We've sent a link to <span className="font-semibold text-foreground">{email}</span>
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  Click the link in the email to set your permanent password.
                </p>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setIsSuccess(false);
                      setEmail('');
                    }}
                  >
                    Try another email
                  </Button>
                  <Link to="/auth" className="block">
                    <Button variant="default" className="w-full">
                      Back to sign in
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;