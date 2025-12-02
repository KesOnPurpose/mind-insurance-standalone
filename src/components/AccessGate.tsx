import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAccessControl, UserTier } from '@/hooks/useAccessControl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Lock, Mail, Phone, MessageCircle, LogOut } from 'lucide-react';

interface AccessGateProps {
  children: ReactNode;
  requiredTier?: UserTier;
  fallback?: ReactNode;
}

export function AccessGate({ children, requiredTier = 'user', fallback }: AccessGateProps) {
  const { user } = useAuth();
  const { isApproved, tier, isLoading, hasTierAccess } = useAccessControl();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Check if user has required tier access
  const hasAccess = isApproved && (requiredTier ? hasTierAccess(requiredTier) : true);

  if (hasAccess) {
    return <>{children}</>;
  }

  // Show custom fallback if provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // Show paywall
  return <Paywall userEmail={user?.email} />;
}

interface PaywallProps {
  userEmail?: string | null;
}

function Paywall({ userEmail }: PaywallProps) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleContactClick = (method: 'email' | 'phone' | 'chat') => {
    switch (method) {
      case 'email':
        window.location.href = 'mailto:support@purposewaze.com?subject=Access%20Request%20-%20Mind%20Insurance%20Platform';
        break;
      case 'phone':
        window.location.href = 'tel:+1234567890'; // Replace with actual number
        break;
      case 'chat':
        // Email support with different subject line
        window.location.href = 'mailto:support@purposewaze.com?subject=Access%20Request%20-%20Account%20Support';
        break;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-lg border-primary/20">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Access Required</CardTitle>
          <CardDescription className="text-base">
            This platform is available to members who have completed their purchase.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {userEmail && (
            <div className="p-3 bg-muted rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Signed in as</p>
              <p className="font-medium">{userEmail}</p>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-sm text-center text-muted-foreground">
              If you've already made a purchase, please contact us to get access:
            </p>

            <div className="grid gap-3">
              <Button
                variant="default"
                className="w-full gap-2"
                onClick={() => handleContactClick('email')}
              >
                <Mail className="w-4 h-4" />
                Email Support
              </Button>

              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => handleContactClick('chat')}
              >
                <MessageCircle className="w-4 h-4" />
                Contact Us Online
              </Button>

              {userEmail && (
                <Button
                  variant="ghost"
                  className="w-full gap-2 text-muted-foreground hover:text-foreground"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out & Use Different Account
                </Button>
              )}
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-center text-muted-foreground">
              Haven't purchased yet?{' '}
              <a
                href="https://purposewaze.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Learn more about our programs
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AccessGate;
