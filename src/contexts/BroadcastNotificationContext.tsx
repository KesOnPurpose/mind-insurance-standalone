// =============================================================================
// BROADCAST NOTIFICATION CONTEXT
// Provides broadcast notification state and display management for the app
// =============================================================================

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { BroadcastNotificationModal } from '@/components/notifications/BroadcastNotificationModal';
import {
  getPendingBroadcastsForUser,
  getUnreadBroadcastCount,
  subscribeToBroadcasts,
} from '@/services/broadcastService';
import { PendingBroadcast, BroadcastPriority } from '@/types/broadcast';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface BroadcastNotificationContextType {
  /** Number of pending notifications */
  pendingCount: number;
  /** List of pending notifications */
  pendingNotifications: PendingBroadcast[];
  /** Currently displayed notification */
  currentNotification: PendingBroadcast | null;
  /** Whether notifications are loading */
  isLoading: boolean;
  /** Refresh notifications from server */
  refreshNotifications: () => Promise<void>;
  /** Manually dismiss current notification */
  dismissCurrentNotification: () => void;
}

// Priority order for sorting (lower = higher priority)
const PRIORITY_ORDER: Record<BroadcastPriority, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
};

// -----------------------------------------------------------------------------
// Context
// -----------------------------------------------------------------------------

const BroadcastNotificationContext = createContext<BroadcastNotificationContextType | undefined>(
  undefined
);

// -----------------------------------------------------------------------------
// Provider
// -----------------------------------------------------------------------------

interface BroadcastNotificationProviderProps {
  children: React.ReactNode;
  /** Delay before showing first notification (ms) - allows user to settle */
  settleDelay?: number;
  /** Minimum delay between notifications (ms) */
  notificationInterval?: number;
}

export function BroadcastNotificationProvider({
  children,
  settleDelay = 3000,
  notificationInterval = 1000,
}: BroadcastNotificationProviderProps) {
  const { user, authInitialized } = useAuth();

  // State
  const [notifications, setNotifications] = useState<PendingBroadcast[]>([]);
  const [currentNotification, setCurrentNotification] = useState<PendingBroadcast | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSettled, setHasSettled] = useState(false);

  // Refs for timers
  const settleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const nextNotificationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // -----------------------------------------------------------------------------
  // Fetch notifications
  // -----------------------------------------------------------------------------

  const fetchPendingNotifications = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const { data, error } = await getPendingBroadcastsForUser();

      if (error) {
        throw error;
      }

      setNotifications(data || []);
    } catch (error) {
      console.error('BroadcastNotificationContext: Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // -----------------------------------------------------------------------------
  // Initial fetch with settle delay
  // -----------------------------------------------------------------------------

  useEffect(() => {
    if (!user?.id || !authInitialized) {
      setNotifications([]);
      setCurrentNotification(null);
      setHasSettled(false);
      return;
    }

    // Clear any existing settle timer
    if (settleTimerRef.current) {
      clearTimeout(settleTimerRef.current);
    }

    // Wait for user to settle before showing notifications
    settleTimerRef.current = setTimeout(() => {
      setHasSettled(true);
      fetchPendingNotifications();
    }, settleDelay);

    return () => {
      if (settleTimerRef.current) {
        clearTimeout(settleTimerRef.current);
      }
    };
  }, [user?.id, authInitialized, settleDelay, fetchPendingNotifications]);

  // -----------------------------------------------------------------------------
  // Show next notification when queue updates
  // -----------------------------------------------------------------------------

  useEffect(() => {
    if (!hasSettled || notifications.length === 0 || currentNotification) {
      return;
    }

    // Sort by priority (urgent first) then by creation date (newest first)
    const sorted = [...notifications].sort((a, b) => {
      const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    // Show highest priority notification
    setCurrentNotification(sorted[0]);
  }, [notifications, currentNotification, hasSettled]);

  // -----------------------------------------------------------------------------
  // Realtime subscription for new broadcasts
  // -----------------------------------------------------------------------------

  useEffect(() => {
    if (!user?.id || !authInitialized) return;

    const unsubscribe = subscribeToBroadcasts((broadcast) => {
      console.log('BroadcastNotificationContext: New broadcast received:', broadcast.id);
      // Refetch notifications when new broadcast arrives
      fetchPendingNotifications();
    });

    return () => {
      unsubscribe();
    };
  }, [user?.id, authInitialized, fetchPendingNotifications]);

  // -----------------------------------------------------------------------------
  // Dismiss handler
  // -----------------------------------------------------------------------------

  const handleDismiss = useCallback(() => {
    const dismissedId = currentNotification?.id;

    // Remove from queue
    setNotifications((prev) => prev.filter((n) => n.id !== dismissedId));
    setCurrentNotification(null);

    // Clear any pending next notification timer
    if (nextNotificationTimerRef.current) {
      clearTimeout(nextNotificationTimerRef.current);
    }

    // Schedule next notification with a small delay for smooth UX
    nextNotificationTimerRef.current = setTimeout(() => {
      // The effect will automatically show the next notification
    }, notificationInterval);
  }, [currentNotification?.id, notificationInterval]);

  // -----------------------------------------------------------------------------
  // Cleanup on unmount
  // -----------------------------------------------------------------------------

  useEffect(() => {
    return () => {
      if (settleTimerRef.current) {
        clearTimeout(settleTimerRef.current);
      }
      if (nextNotificationTimerRef.current) {
        clearTimeout(nextNotificationTimerRef.current);
      }
    };
  }, []);

  // -----------------------------------------------------------------------------
  // Context value
  // -----------------------------------------------------------------------------

  const value: BroadcastNotificationContextType = {
    pendingCount: notifications.length,
    pendingNotifications: notifications,
    currentNotification,
    isLoading,
    refreshNotifications: fetchPendingNotifications,
    dismissCurrentNotification: handleDismiss,
  };

  return (
    <BroadcastNotificationContext.Provider value={value}>
      {children}
      <BroadcastNotificationModal
        notification={currentNotification}
        onDismiss={handleDismiss}
        onAcknowledge={handleDismiss}
      />
    </BroadcastNotificationContext.Provider>
  );
}

// -----------------------------------------------------------------------------
// Hook
// -----------------------------------------------------------------------------

export function useBroadcastNotifications() {
  const context = useContext(BroadcastNotificationContext);
  if (context === undefined) {
    throw new Error(
      'useBroadcastNotifications must be used within a BroadcastNotificationProvider'
    );
  }
  return context;
}

export default BroadcastNotificationProvider;
