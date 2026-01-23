// ============================================================================
// GROUPHOME STANDALONE: ORPHANED FILE
// This component depends on useMIAccessControl which was deleted during MI removal.
// The component is not currently used in the codebase.
// If access gating is needed, create a new GH-specific access control hook.
// ============================================================================

import { ReactNode, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
// GROUPHOME STANDALONE: Broken import - hook was deleted
// import { useMIAccessControl, MIUserTier } from '@/hooks/useMIAccessControl';
import { useAdmin } from '@/contexts/AdminContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Lock, Mail, Phone, MessageCircle, LogOut, AlertCircle, RefreshCw } from 'lucide-react';

// Maximum time to wait for loading states before showing timeout UI
const LOADING_TIMEOUT_MS = 10000; // 10 seconds

// GROUPHOME STANDALONE: Simplified tier type
type GHAccessTier = 'user' | 'admin' | 'super_admin';

interface AccessGateProps {
  children: ReactNode;
  requiredTier?: GHAccessTier;
  fallback?: ReactNode;
}

export function AccessGate({ children, requiredTier = 'user', fallback }: AccessGateProps) {
  const { user } = useAuth();
  // GROUPHOME STANDALONE: Using useAdmin for access control
  const { adminUser, isAdmin, isSuperAdmin, isLoading } = useAdmin();
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);

  // Timeout handler to prevent infinite loading spinner
  useEffect(() => {
    if (isLoading && !loadingTimedOut) {
      const timeout = setTimeout(() => {
        console.warn('[AccessGate] Loading timeout exceeded - showing timeout UI');
        setLoadingTimedOut(true);
      }, LOADING_TIMEOUT_MS);

      return () => clearTimeout(timeout);
    }
    // Reset timeout state when loading completes
    if (!isLoading) {
      setLoadingTimedOut(false);
    }
  }, [isLoading, loadingTimedOut]);

  // Show loading state (only while not timed out)
  if (isLoading && !loadingTimedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Show timeout UI with retry options
  if (loadingTimedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md mx-auto p-6">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-xl font-semibold">Taking longer than expected</h2>
          <p className="text-muted-foreground">
            We're having trouble verifying your access. This could be due to a slow connection.
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => {
                setLoadingTimedOut(false);
                // GROUPHOME STANDALONE: No refetch available - reload page instead
                window.location.reload();
              }}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // GROUPHOME STANDALONE: Check if user has required tier access
  // All authenticated users have 'user' access
  // Admin access requires isAdmin or isSuperAdmin
  // Super admin access requires isSuperAdmin
  const hasAccess = (() => {
    if (!user) return false;
    if (requiredTier === 'user') return true; // All authenticated users have user access
    if (requiredTier === 'admin') return isAdmin || isSuperAdmin;
    if (requiredTier === 'super_admin') return isSuperAdmin;
    return true;
  })();

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
