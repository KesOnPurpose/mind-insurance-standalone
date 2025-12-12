/**
 * usePushNotifications Hook
 *
 * React hook for managing push notification subscriptions.
 * Provides an easy way to subscribe/unsubscribe and check status.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  isPushSupported,
  getPushPermissionStatus,
  subscribeToPush,
  unsubscribeFromPush,
  initializePushNotifications,
  PushPermissionStatus
} from '@/services/pushNotificationService';

export interface UsePushNotificationsReturn {
  // Status
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission | 'unsupported';
  isLoading: boolean;
  error: string | null;

  // Actions
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const { user } = useAuth();

  const [status, setStatus] = useState<PushPermissionStatus>({
    isSupported: false,
    permission: 'unsupported',
    isSubscribed: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Refresh the current push notification status
   */
  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const newStatus = await getPushPermissionStatus();
      setStatus(newStatus);
    } catch (err) {
      console.error('[usePushNotifications] Error refreshing status:', err);
      setError('Failed to check notification status');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Subscribe to push notifications
   */
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!user?.id) {
      setError('Please log in to enable notifications');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const success = await subscribeToPush(user.id);

      if (success) {
        await refresh();
        return true;
      } else {
        setError('Failed to enable notifications. Please check your browser settings.');
        return false;
      }
    } catch (err) {
      console.error('[usePushNotifications] Subscribe error:', err);
      setError('Failed to enable notifications');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, refresh]);

  /**
   * Unsubscribe from push notifications
   */
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!user?.id) {
      setError('Please log in');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const success = await unsubscribeFromPush(user.id);

      if (success) {
        await refresh();
        return true;
      } else {
        setError('Failed to disable notifications');
        return false;
      }
    } catch (err) {
      console.error('[usePushNotifications] Unsubscribe error:', err);
      setError('Failed to disable notifications');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, refresh]);

  // Initialize on mount
  useEffect(() => {
    async function init() {
      // Initialize service worker
      await initializePushNotifications();

      // Get initial status
      await refresh();
    }

    init();
  }, [refresh]);

  return {
    isSupported: status.isSupported,
    isSubscribed: status.isSubscribed,
    permission: status.permission,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    refresh
  };
}

/**
 * Simple hook to just check if user has notifications enabled
 * Lighter weight than full usePushNotifications
 */
export function useNotificationStatus(): {
  isEnabled: boolean;
  isLoading: boolean;
} {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function check() {
      try {
        const status = await getPushPermissionStatus();
        setIsEnabled(status.isSubscribed);
      } catch {
        setIsEnabled(false);
      } finally {
        setIsLoading(false);
      }
    }

    check();
  }, []);

  return { isEnabled, isLoading };
}
