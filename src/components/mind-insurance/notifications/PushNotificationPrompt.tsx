/**
 * Push Notification Subscription UI Component
 *
 * Prompts users to enable push notifications for daily protocol reminders.
 * Uses behavioral science principles:
 * - Clear value proposition
 * - Low-friction single action
 * - Visual feedback on success
 */

import { useState, useEffect } from 'react';
import { Bell, BellOff, Check, X, Loader2, AlertCircle, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import {
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
  getPushPermissionStatus,
  initializePushNotifications,
  type PushPermissionStatus
} from '@/services/pushNotificationService';
import { tagPushEnabled } from '@/services/ghlTagService';
import { cn } from '@/lib/utils';

interface PushNotificationPromptProps {
  variant?: 'card' | 'inline' | 'banner';
  onStatusChange?: (enabled: boolean) => void;
  className?: string;
}

export function PushNotificationPrompt({
  variant = 'card',
  onStatusChange,
  className
}: PushNotificationPromptProps) {
  const { user } = useAuth();
  const [status, setStatus] = useState<PushPermissionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Check initial status
  useEffect(() => {
    const checkStatus = async () => {
      // Initialize service worker first
      await initializePushNotifications();
      const permStatus = await getPushPermissionStatus();
      setStatus(permStatus);
      setIsLoading(false);
    };
    checkStatus();
  }, []);

  const handleEnableNotifications = async () => {
    if (!user?.id) return;

    setIsSubscribing(true);
    try {
      const success = await subscribeToPush(user.id);
      if (success) {
        setShowSuccess(true);
        const newStatus = await getPushPermissionStatus();
        setStatus(newStatus);
        onStatusChange?.(true);

        // Tag user in GHL for push notifications
        tagPushEnabled(user.id).catch(err =>
          console.error('[PushPrompt] Failed to tag GHL:', err)
        );

        // Hide success message after 3 seconds
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (error) {
      console.error('[PushPrompt] Error:', error);
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleDisableNotifications = async () => {
    if (!user?.id) return;

    setIsSubscribing(true);
    try {
      await unsubscribeFromPush(user.id);
      const newStatus = await getPushPermissionStatus();
      setStatus(newStatus);
      onStatusChange?.(false);
    } catch (error) {
      console.error('[PushPrompt] Error:', error);
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  // Don't render if loading, dismissed, not supported, or already subscribed (for card/banner)
  if (isLoading || dismissed) {
    return null;
  }

  if (!status?.isSupported) {
    // For inline variant, show unsupported message
    if (variant === 'inline') {
      return (
        <div className={cn("flex items-center gap-3 text-muted-foreground", className)}>
          <BellOff className="w-5 h-5" />
          <span className="text-sm">Push notifications not supported in this browser</span>
        </div>
      );
    }
    return null;
  }

  // For card/banner variants, hide if already subscribed (unless showing success)
  if ((variant === 'card' || variant === 'banner') && status.isSubscribed && !showSuccess) {
    return null;
  }

  // Permission was denied - show how to enable
  if (status.permission === 'denied') {
    if (variant === 'inline') {
      return (
        <div className={cn("flex items-center gap-3", className)}>
          <AlertCircle className="w-5 h-5 text-amber-500" />
          <div className="flex-1">
            <span className="text-sm text-muted-foreground">
              Notifications blocked. Enable in browser settings.
            </span>
          </div>
        </div>
      );
    }
    return null;
  }

  // Success state
  if (showSuccess) {
    return (
      <Card className={cn(
        "bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/20",
        className
      )}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Check className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-emerald-600">Notifications enabled!</p>
              <p className="text-sm text-muted-foreground">
                You'll receive daily protocol reminders at 7:30 AM
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Inline variant (for Settings page)
  if (variant === 'inline') {
    return (
      <div className={cn("flex items-center justify-between gap-4", className)}>
        <div className="flex items-center gap-3">
          {status.isSubscribed ? (
            <Bell className="w-5 h-5 text-mi-cyan" />
          ) : (
            <BellOff className="w-5 h-5 text-muted-foreground" />
          )}
          <div>
            <p className="text-sm font-medium">
              Push Notifications
            </p>
            <p className="text-xs text-muted-foreground">
              {status.isSubscribed
                ? 'Daily reminders enabled'
                : 'Get reminded about your protocol'}
            </p>
          </div>
        </div>
        <Button
          variant={status.isSubscribed ? "outline" : "default"}
          size="sm"
          onClick={status.isSubscribed ? handleDisableNotifications : handleEnableNotifications}
          disabled={isSubscribing}
        >
          {isSubscribing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : status.isSubscribed ? (
            'Disable'
          ) : (
            'Enable'
          )}
        </Button>
      </div>
    );
  }

  // Banner variant (compact, for Hub page)
  if (variant === 'banner') {
    return (
      <div className={cn(
        "relative bg-gradient-to-r from-mi-cyan/10 to-mi-gold/10 rounded-lg p-4 border border-mi-cyan/20",
        className
      )}>
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        <div className="flex items-center gap-4 pr-6">
          <div className="w-10 h-10 rounded-full bg-mi-cyan/20 flex items-center justify-center flex-shrink-0">
            <Bell className="w-5 h-5 text-mi-cyan" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">Never miss a practice day</p>
            <p className="text-xs text-muted-foreground">
              Get gentle reminders each morning
            </p>
          </div>

          <Button
            size="sm"
            onClick={handleEnableNotifications}
            disabled={isSubscribing}
            className="flex-shrink-0 bg-mi-cyan hover:bg-mi-cyan/90 text-mi-navy"
          >
            {isSubscribing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Enable'
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Card variant (default - detailed, for onboarding or modals)
  return (
    <Card className={cn(
      "bg-gradient-to-br from-mi-navy via-mi-navy to-mi-navy/90 border-mi-cyan/20",
      className
    )}>
      <CardContent className="p-6">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        <div className="flex flex-col items-center text-center space-y-4">
          {/* Icon */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-mi-cyan/20 to-mi-gold/20 flex items-center justify-center">
            <Bell className="w-8 h-8 text-mi-cyan" />
          </div>

          {/* Copy */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-white">
              Stay on track with gentle nudges
            </h3>
            <p className="text-sm text-mi-silver/80 max-w-sm">
              Get a daily reminder each morning to complete your protocol practice.
              Just 3 minutes to keep rewiring your neural pathways.
            </p>
          </div>

          {/* Benefits */}
          <div className="flex flex-wrap justify-center gap-4 text-xs text-mi-silver/70">
            <div className="flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5" />
              <span>Works on all devices</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5" />
              <span>Max 1 per day</span>
            </div>
          </div>

          {/* CTA */}
          <Button
            onClick={handleEnableNotifications}
            disabled={isSubscribing}
            className="w-full sm:w-auto bg-mi-cyan hover:bg-mi-cyan/90 text-mi-navy font-medium"
          >
            {isSubscribing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enabling...
              </>
            ) : (
              <>
                <Bell className="w-4 h-4 mr-2" />
                Enable Daily Reminders
              </>
            )}
          </Button>

          {/* Skip */}
          <button
            onClick={handleDismiss}
            className="text-xs text-mi-silver/50 hover:text-mi-silver/70 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

export default PushNotificationPrompt;
