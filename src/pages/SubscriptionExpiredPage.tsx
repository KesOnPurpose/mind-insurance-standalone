/**
 * SubscriptionExpiredPage
 * FEAT-GHCF-007: Displayed when user's gh_approved_users.is_active = false.
 *
 * Shows:
 * - Subscription expired message
 * - Link to checkout to renew
 * - Contact support link
 * - Logout button
 * - Mobile-friendly layout
 */

import { LogOut, CreditCard, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

const CHECKOUT_URL = 'https://go.grouphomecashflow.com/checkout-page-nette-ai';

const SubscriptionExpiredPage = () => {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/auth';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto bg-white border-gray-200 shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-amber-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Subscription Expired
          </CardTitle>
          <CardDescription className="text-gray-600">
            Your access to Group Home Cash Flow has expired. Renew your subscription to continue your group home journey.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Renew Button */}
          <Button
            asChild
            className="w-full font-semibold bg-teal-500 hover:bg-teal-600 text-white"
          >
            <a href={CHECKOUT_URL} target="_blank" rel="noopener noreferrer">
              <CreditCard className="mr-2 h-4 w-4" />
              Renew Subscription
            </a>
          </Button>

          {/* Contact Support */}
          <Button
            asChild
            variant="outline"
            className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <a href="mailto:support@grouphomecashflow.com">
              <HelpCircle className="mr-2 h-4 w-4" />
              Contact Support
            </a>
          </Button>

          {/* Logout */}
          <Button
            variant="ghost"
            className="w-full text-gray-500 hover:text-gray-700"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionExpiredPage;
