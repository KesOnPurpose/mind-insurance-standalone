/**
 * useMIOInsightsThread Hook
 *
 * React hook for managing the MIO Insights Thread feature.
 * Provides:
 * - Thread and messages state
 * - Real-time message subscription
 * - Send reply functionality
 * - Unread count management
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  MIOInsightsThread,
  MIOInsightsMessage,
  RewardTier
} from '@/types/mio-insights';
import {
  getOrCreateThread,
  getThreadMessages,
  sendReply,
  markAllRead,
  subscribeToThread,
  subscribeToThreadUpdates,
  SendReplyResult
} from '@/services/mioInsightsThreadService';

// ============================================================================
// TYPES
// ============================================================================

interface UseMIOInsightsThreadReturn {
  // State
  thread: MIOInsightsThread | null;
  messages: MIOInsightsMessage[];
  isLoading: boolean;
  isSending: boolean;
  isWaitingForMIO: boolean;
  error: string | null;
  unreadCount: number;

  // Actions
  sendMessage: (content: string, inReplyTo?: string) => Promise<SendReplyResult>;
  markAsRead: () => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  refresh: () => Promise<void>;

  // Metadata
  hasMore: boolean;
  lastRewardTier: RewardTier | null;
  isConnected: boolean;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useMIOInsightsThread(): UseMIOInsightsThreadReturn {
  const { user, session, loading: authLoading } = useAuth();

  // State
  const [thread, setThread] = useState<MIOInsightsThread | null>(null);
  const [messages, setMessages] = useState<MIOInsightsMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isWaitingForMIO, setIsWaitingForMIO] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastRewardTier, setLastRewardTier] = useState<RewardTier | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Refs for subscription management
  const messageSubscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  const threadSubscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  // Computed unread count
  const unreadCount = thread?.unread_count || 0;

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  /**
   * Initialize thread and load initial messages
   */
  const initialize = useCallback(async () => {
    if (authLoading || !user?.id || !session) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get or create thread
      const userThread = await getOrCreateThread(user.id);
      if (!userThread) {
        setError('Failed to initialize MIO Insights thread');
        setIsLoading(false);
        return;
      }

      setThread(userThread);

      // Load initial messages
      const initialMessages = await getThreadMessages(userThread.id, 50, 0);
      setMessages(initialMessages);
      setHasMore(initialMessages.length >= 50);

      console.log('[useMIOInsightsThread] Initialized:', {
        threadId: userThread.id,
        messageCount: initialMessages.length,
        unreadCount: userThread.unread_count
      });

    } catch (err) {
      console.error('[useMIOInsightsThread] Initialization error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load insights');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, session, authLoading]);

  // Initialize on mount and auth change
  useEffect(() => {
    initialize();
  }, [initialize]);

  // ============================================================================
  // REAL-TIME SUBSCRIPTIONS
  // ============================================================================

  /**
   * Set up real-time subscriptions when thread is available
   */
  useEffect(() => {
    if (!thread?.id || !user?.id) return;

    // Subscribe to new messages
    messageSubscriptionRef.current = subscribeToThread(thread.id, (newMessage) => {
      console.log('[useMIOInsightsThread] New message received:', newMessage.id);

      // Add to messages if not already present, or replace temp message
      setMessages(prev => {
        // Check if message already exists by ID (from API response)
        if (prev.some(m => m.id === newMessage.id)) {
          console.log('[useMIOInsightsThread] Message already exists, skipping:', newMessage.id);
          return prev;
        }

        // Check if this is replacing a temp message (same role and content)
        const tempIndex = prev.findIndex(m =>
          m.id.startsWith('temp-') && m.role === newMessage.role && m.content === newMessage.content
        );
        if (tempIndex >= 0) {
          console.log('[useMIOInsightsThread] Replacing temp message with real:', newMessage.id);
          const updated = [...prev];
          updated[tempIndex] = newMessage;
          return updated;
        }

        return [...prev, newMessage];
      });

      // Update last reward tier if MIO message
      if (newMessage.role === 'mio' && newMessage.reward_tier) {
        setLastRewardTier(newMessage.reward_tier as RewardTier);
      }
    });

    // Subscribe to thread updates
    threadSubscriptionRef.current = subscribeToThreadUpdates(user.id, (updatedThread) => {
      console.log('[useMIOInsightsThread] Thread updated:', updatedThread.unread_count);
      setThread(updatedThread);
    });

    setIsConnected(true);

    // Cleanup subscriptions on unmount
    return () => {
      if (messageSubscriptionRef.current) {
        messageSubscriptionRef.current.unsubscribe();
        messageSubscriptionRef.current = null;
      }
      if (threadSubscriptionRef.current) {
        threadSubscriptionRef.current.unsubscribe();
        threadSubscriptionRef.current = null;
      }
      setIsConnected(false);
    };
  }, [thread?.id, user?.id]);

  // ============================================================================
  // ACTIONS
  // ============================================================================

  /**
   * Send a message in the thread
   * Uses optimistic updates for instant UI feedback
   */
  const sendMessage = useCallback(async (
    content: string,
    inReplyTo?: string
  ): Promise<SendReplyResult> => {
    if (!thread?.id || !user?.id) {
      return { success: false, error: 'Thread not initialized' };
    }

    if (!content.trim()) {
      return { success: false, error: 'Message cannot be empty' };
    }

    const trimmedContent = content.trim();
    const tempUserId = `temp-user-${Date.now()}`;

    // 1. Create optimistic user message (shows immediately)
    const optimisticUserMessage: MIOInsightsMessage = {
      id: tempUserId,
      thread_id: thread.id,
      user_id: user.id,
      role: 'user',
      content: trimmedContent,
      section_type: null,
      reward_tier: 'standard',
      patterns_detected: [],
      read_at: null,
      in_reply_to: inReplyTo || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // 2. Add user message to state immediately
    setMessages(prev => [...prev, optimisticUserMessage]);
    setIsSending(true);
    setIsWaitingForMIO(true);
    setError(null);

    try {
      const result = await sendReply(thread.id, user.id, trimmedContent, inReplyTo);

      if (result.success) {
        // 3. Replace temp user message with real ID
        if (result.userMessageId) {
          setMessages(prev => prev.map(m =>
            m.id === tempUserId
              ? { ...m, id: result.userMessageId! }
              : m
          ));
        }

        // 4. Add MIO response directly from API (don't wait for subscription)
        if (result.mioResponse && result.mioResponseId) {
          const mioMessage: MIOInsightsMessage = {
            id: result.mioResponseId,
            thread_id: thread.id,
            user_id: user.id,
            role: 'mio',
            content: result.mioResponse,
            section_type: 'breakthrough',
            reward_tier: result.rewardTier || 'standard',
            patterns_detected: result.patternsDetected || [],
            read_at: null,
            in_reply_to: result.userMessageId || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          setMessages(prev => [...prev, mioMessage]);
        }

        // Update last reward tier
        if (result.rewardTier) {
          setLastRewardTier(result.rewardTier);
        }

        console.log('[useMIOInsightsThread] Message sent:', {
          userMessageId: result.userMessageId,
          mioResponseId: result.mioResponseId,
          rewardTier: result.rewardTier
        });
      } else {
        // Remove optimistic message on failure
        setMessages(prev => prev.filter(m => m.id !== tempUserId));
        setError(result.error || 'Failed to send message');
      }

      return result;

    } catch (err) {
      console.error('[useMIOInsightsThread] Send error:', err);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempUserId));
      const errorMsg = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsSending(false);
      setIsWaitingForMIO(false);
    }
  }, [thread?.id, user?.id]);

  /**
   * Mark all messages as read
   */
  const markAsRead = useCallback(async () => {
    if (!thread?.id || !user?.id || unreadCount === 0) return;

    try {
      const success = await markAllRead(thread.id, user.id);
      if (success) {
        // Update local state
        setThread(prev => prev ? { ...prev, unread_count: 0 } : null);

        // Mark all messages as read locally
        setMessages(prev =>
          prev.map(m =>
            m.read_at ? m : { ...m, read_at: new Date().toISOString() }
          )
        );
      }
    } catch (err) {
      console.error('[useMIOInsightsThread] Mark read error:', err);
    }
  }, [thread?.id, user?.id, unreadCount]);

  /**
   * Load more messages (pagination)
   */
  const loadMoreMessages = useCallback(async () => {
    if (!thread?.id || !hasMore || isLoading) return;

    try {
      const moreMessages = await getThreadMessages(
        thread.id,
        50,
        messages.length
      );

      if (moreMessages.length < 50) {
        setHasMore(false);
      }

      // Prepend older messages
      setMessages(prev => [...moreMessages, ...prev]);

    } catch (err) {
      console.error('[useMIOInsightsThread] Load more error:', err);
    }
  }, [thread?.id, hasMore, isLoading, messages.length]);

  /**
   * Refresh thread and messages
   */
  const refresh = useCallback(async () => {
    await initialize();
  }, [initialize]);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // State
    thread,
    messages,
    isLoading,
    isSending,
    isWaitingForMIO,
    error,
    unreadCount,

    // Actions
    sendMessage,
    markAsRead,
    loadMoreMessages,
    refresh,

    // Metadata
    hasMore,
    lastRewardTier,
    isConnected
  };
}

// ============================================================================
// LIGHTWEIGHT HOOK FOR UNREAD COUNT ONLY
// ============================================================================

/**
 * Hook to get just the unread count (for badges, notifications)
 */
export function useMIOInsightsUnreadCount(): {
  unreadCount: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
} {
  const { user, session, loading: authLoading } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUnreadCount = useCallback(async () => {
    if (authLoading || !user?.id || !session) {
      setIsLoading(false);
      return;
    }

    try {
      const thread = await getOrCreateThread(user.id);
      setUnreadCount(thread?.unread_count || 0);
    } catch (err) {
      console.error('[useMIOInsightsUnreadCount] Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, session, authLoading]);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Subscribe to thread updates for real-time unread count
  useEffect(() => {
    if (!user?.id) return;

    const subscription = subscribeToThreadUpdates(user.id, (updatedThread) => {
      setUnreadCount(updatedThread.unread_count || 0);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  return {
    unreadCount,
    isLoading,
    refresh: fetchUnreadCount
  };
}
