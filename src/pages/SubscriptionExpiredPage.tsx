import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, ExternalLink, LogOut, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscriptionCheck } from '@/hooks/useSubscriptionCheck';

const CHECKOUT_URL = 'https://go.grouphomecashflow.com/checkout-page-nette-ai';
const SUPPORT_EMAIL = 'support@grouphomecashflow.com';

const SubscriptionExpiredPage = () => {
  const { signOut } = useAuth();
  const { status } = useSubscriptionCheck();

  const getStatusMessage = () => {
    switch (status.enrollmentStatus) {
      case 'cancelled':
        return {
          title: 'Your Subscription Has Been Cancelled',
          description: 'Your access to Nette AI and the Group Home Cash Flow portal has ended. Your progress and data are safely preserved.',
        };
      case 'past_due':
        return {
          title: 'Payment Issue Detected',
          description: 'We were unable to process your most recent payment. Please update your payment method to restore full access.',
        };
      case 'expired':
        return {
          title: 'Your Access Has Expired',
          description: 'Your subscription period has ended. Resubscribe to regain full access to all features.',
        };
      default:
        return {
          title: 'Subscription Required',
          description: 'An active subscription is required to access the Group Home Cash Flow portal.',
        };
    }
  };

  const { title, description } = getStatusMessage();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-destructive" />
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription className="text-sm">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            Your progress, documents, and data are safely preserved. When you resubscribe, everything will be right where you left it.
          </div>

          <Button
            className="w-full"
            onClick={() => window.open(CHECKOUT_URL, '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Resubscribe Now
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.location.href = `mailto:${SUPPORT_EMAIL}`}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Contact Support
          </Button>

          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={signOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionExpiredPage;
