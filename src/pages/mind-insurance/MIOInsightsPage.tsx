/**
 * MIO Insights Page
 *
 * Dedicated page for the MIO Insights Thread - a pinned conversation
 * where MIO provides personalized behavioral feedback after completing
 * practice sections.
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { MIOInsightsThreadView } from '@/components/chat/MIOInsightsThreadView';
import { PushNotificationPrompt } from '@/components/PushNotificationPrompt';
import { useMIOInsightsThread } from '@/hooks/useMIOInsightsThread';
import { useNotificationStatus } from '@/hooks/usePushNotifications';
import { MindInsuranceErrorBoundary } from '@/components/mind-insurance/MindInsuranceErrorBoundary';

export default function MIOInsightsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { thread, isLoading: threadLoading } = useMIOInsightsThread();
  const { isEnabled: notificationsEnabled, isLoading: notifLoading } = useNotificationStatus();

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  // Show notification prompt if not enabled
  const showNotificationPrompt = !notifLoading && !notificationsEnabled;

  return (
    <MindInsuranceErrorBoundary fallbackTitle="Error loading MIO Insights" showHomeButton>
    <div className="min-h-screen bg-mi-navy flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-mi-cyan/20 to-mi-gold/20 border-b border-mi-cyan/30">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/mind-insurance/practice')}
                className="text-gray-400 hover:text-white hover:bg-mi-navy"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-gradient-to-br from-mi-cyan to-mi-gold">
                  <Sparkles className="h-5 w-5 text-mi-navy" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">MIO Insights</h1>
                  <p className="text-sm text-mi-cyan">Your personalized behavioral feedback</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Prompt */}
      {showNotificationPrompt && (
        <div className="max-w-4xl mx-auto px-4 pt-4">
          <PushNotificationPrompt variant="banner" />
        </div>
      )}

      {/* Thread View */}
      <div className="flex-1 max-w-4xl mx-auto w-full">
        {threadLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-mi-cyan">Loading insights...</div>
          </div>
        ) : thread ? (
          <MIOInsightsThreadView threadId={thread.id} hideHeader={true} />
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center px-4">
            <Sparkles className="h-12 w-12 text-mi-cyan/50 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              No Insights Yet
            </h3>
            <p className="text-gray-400 max-w-md">
              Complete your daily practices and MIO will analyze your patterns
              and provide personalized insights here.
            </p>
            <Button
              onClick={() => navigate('/mind-insurance/practice')}
              className="mt-6 bg-mi-cyan hover:bg-mi-cyan/80 text-mi-navy"
            >
              Start Today's Practice
            </Button>
          </div>
        )}
      </div>
    </div>
    </MindInsuranceErrorBoundary>
  );
}
