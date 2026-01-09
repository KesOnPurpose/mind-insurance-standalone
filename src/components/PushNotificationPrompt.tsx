/**
 * PushNotificationPrompt Component
 *
 * A non-intrusive prompt to encourage users to enable push notifications.
 * Shown after completing their first practice or when opening MIO Insights.
 */

import { useState, useEffect } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface PushNotificationPromptProps {
  onClose?: () => void;
  variant?: 'card' | 'banner' | 'inline';
  showDismiss?: boolean;
}

export function PushNotificationPrompt({
  onClose,
  variant = 'card',
  showDismiss = true
}: PushNotificationPromptProps) {
  const {
    isSupported,
    isSubscribed,
    permission,
    isLoading,
    subscribe
  } = usePushNotifications();

  const [isDismissed, setIsDismissed] = useState(false);
  const [isEnabling, setIsEnabling] = useState(false);

  // Check if we should hide the prompt
  const shouldHide =
    isDismissed ||
    !isSupported ||
    isSubscribed ||
    permission === 'denied';

  // Don't render if should hide
  if (shouldHide) {
    return null;
  }

  const handleEnable = async () => {
    setIsEnabling(true);
    try {
      const success = await subscribe();
      if (success && onClose) {
        onClose();
      }
    } finally {
      setIsEnabling(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onClose) {
      onClose();
    }
  };

  // Banner variant - slim, top of screen
  if (variant === 'banner') {
    return (
      <div className="bg-gradient-to-r from-mi-cyan/20 to-mi-gold/20 border-b border-mi-cyan/30 px-4 py-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-mi-cyan" />
            <span className="text-sm text-gray-200">
              Get notified when MIO has insights for you
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleEnable}
              disabled={isEnabling || isLoading}
              className="bg-mi-cyan hover:bg-mi-cyan/80 text-mi-navy"
            >
              {isEnabling ? 'Enabling...' : 'Enable'}
            </Button>
            {showDismiss && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Inline variant - minimal, fits within other content
  if (variant === 'inline') {
    return (
      <div className="flex items-center justify-between p-3 rounded-lg bg-mi-cyan/10 border border-mi-cyan/20">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-mi-cyan" />
          <span className="text-sm text-gray-300">
            Enable notifications for MIO insights
          </span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleEnable}
          disabled={isEnabling || isLoading}
          className="text-mi-cyan hover:text-mi-cyan/80"
        >
          {isEnabling ? 'Enabling...' : 'Enable'}
        </Button>
      </div>
    );
  }

  // Card variant - more prominent, standalone
  return (
    <Card className="bg-gradient-to-br from-mi-navy-light to-mi-navy border-mi-cyan/30">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-full bg-mi-cyan/20">
            <Bell className="h-6 w-6 text-mi-cyan" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white mb-1">
              Never Miss an Insight
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              MIO analyzes your practices and sends personalized insights.
              Enable notifications to receive them instantly.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={handleEnable}
                disabled={isEnabling || isLoading}
                className="bg-mi-cyan hover:bg-mi-cyan/80 text-mi-navy"
              >
                <Bell className="mr-2 h-4 w-4" />
                {isEnabling ? 'Enabling...' : 'Enable Notifications'}
              </Button>
              {showDismiss && (
                <Button
                  variant="ghost"
                  onClick={handleDismiss}
                  className="text-gray-400 hover:text-white"
                >
                  Maybe Later
                </Button>
              )}
            </div>
          </div>
          {showDismiss && (
            <Button
              size="icon"
              variant="ghost"
              onClick={handleDismiss}
              className="text-gray-500 hover:text-white -mt-2 -mr-2"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Notification Settings Toggle
 *
 * A simple toggle for notification settings pages.
 */
export function NotificationToggle() {
  const {
    isSupported,
    isSubscribed,
    permission,
    isLoading,
    subscribe,
    unsubscribe
  } = usePushNotifications();

  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      if (isSubscribed) {
        await unsubscribe();
      } else {
        await subscribe();
      }
    } finally {
      setIsToggling(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="flex items-center justify-between p-4 rounded-lg bg-mi-navy-light border border-gray-700">
        <div className="flex items-center gap-3">
          <BellOff className="h-5 w-5 text-gray-500" />
          <div>
            <p className="font-medium text-gray-400">Push Notifications</p>
            <p className="text-sm text-gray-500">
              Not supported in this browser
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className="flex items-center justify-between p-4 rounded-lg bg-mi-navy-light border border-red-500/30">
        <div className="flex items-center gap-3">
          <BellOff className="h-5 w-5 text-red-400" />
          <div>
            <p className="font-medium text-gray-300">Push Notifications</p>
            <p className="text-sm text-red-400">
              Blocked - Enable in browser settings
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-mi-navy-light border border-mi-cyan/20">
      <div className="flex items-center gap-3">
        <Bell className={`h-5 w-5 ${isSubscribed ? 'text-mi-cyan' : 'text-gray-400'}`} />
        <div>
          <p className="font-medium text-gray-200">Push Notifications</p>
          <p className="text-sm text-gray-400">
            {isSubscribed
              ? 'Receiving MIO insights'
              : 'Get notified of new insights'}
          </p>
        </div>
      </div>
      <Button
        variant={isSubscribed ? 'outline' : 'default'}
        size="sm"
        onClick={handleToggle}
        disabled={isLoading || isToggling}
        className={isSubscribed
          ? 'border-mi-cyan/30 text-mi-cyan hover:bg-mi-cyan/10'
          : 'bg-mi-cyan text-mi-navy hover:bg-mi-cyan/80'
        }
      >
        {isToggling || isLoading
          ? 'Loading...'
          : isSubscribed
            ? 'Disable'
            : 'Enable'}
      </Button>
    </div>
  );
}
