import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  ConversationMetadata,
  getConversationsList,
  createConversation,
  updateConversationTitle,
  archiveConversation,
  updateLastMessage,
  generateConversationTitle,
  CreateConversationParams
} from '@/services/conversationMetadataService';
import { CoachType } from '@/types/coach';

export function useConversations() {
  const { user, session, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<ConversationMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debug: Log state on every render
  console.log('[useConversations] Current state:', {
    conversationsCount: conversations.length,
    isLoading,
    error,
    authLoading,
    hasUser: !!user?.id,
    hasSession: !!session
  });

  // Fetch conversations on mount and when user/session changes
  const fetchConversations = useCallback(async () => {
    // Don't fetch if auth is still loading
    if (authLoading) {
      console.log('[useConversations] Auth still loading, waiting...');
      return;
    }

    // Don't fetch if no user or no session (RLS will block anyway)
    if (!user?.id || !session) {
      console.log('[useConversations] No user or session, clearing conversations', {
        hasUser: !!user?.id,
        hasSession: !!session
      });
      setConversations([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('[useConversations] Fetching conversations for user:', user.id);
      const data = await getConversationsList(user.id);
      console.log('[useConversations] Received data from service:', {
        count: data.length,
        firstTitle: data[0]?.title || 'none'
      });
      setConversations(data);
      console.log('[useConversations] State updated with conversations');
    } catch (err) {
      console.error('[useConversations] Error:', err);
      setError('Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, session, authLoading]);

  // Fetch on mount and when user changes
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Force refresh on initial component mount (handles stale browser cache scenarios)
  // This is separate from the above useEffect to ensure it runs once regardless of deps
  useEffect(() => {
    if (user?.id && session && !authLoading) {
      console.log('[useConversations] Initial mount - forcing refresh (session available)');
      fetchConversations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]); // Trigger when session becomes available

  // Auto-refresh when user returns to the tab (visibility change)
  // This ensures conversations are synced when user comes back from another tab/app
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user?.id && session) {
        console.log('[useConversations] Tab visible - refreshing conversations');
        fetchConversations();
      }
    };

    // Also refresh on window focus (covers cases visibility API doesn't catch)
    const handleFocus = () => {
      if (user?.id && session) {
        console.log('[useConversations] Window focused - refreshing conversations');
        fetchConversations();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchConversations, user?.id, session]);

  // Create a new conversation
  const addConversation = useCallback(async (
    conversationId: string,
    firstMessage: string,
    coachType: CoachType = 'nette'
  ): Promise<ConversationMetadata | null> => {
    if (!user?.id) return null;

    const title = generateConversationTitle(firstMessage);

    const params: CreateConversationParams = {
      userId: user.id,
      conversationId,
      title,
      coachType,
      previewText: firstMessage.substring(0, 100)
    };

    const newConversation = await createConversation(params);

    if (newConversation) {
      // Add to local state at the beginning (most recent)
      setConversations(prev => [newConversation, ...prev]);
    }

    return newConversation;
  }, [user?.id]);

  // Rename a conversation
  const renameConversation = useCallback(async (
    conversationId: string,
    newTitle: string
  ): Promise<boolean> => {
    const success = await updateConversationTitle(conversationId, newTitle);

    if (success) {
      // Update local state
      setConversations(prev =>
        prev.map(conv =>
          conv.conversation_id === conversationId
            ? { ...conv, title: newTitle }
            : conv
        )
      );
    }

    return success;
  }, []);

  // Archive a conversation
  const removeConversation = useCallback(async (
    conversationId: string
  ): Promise<boolean> => {
    const success = await archiveConversation(conversationId);

    if (success) {
      // Remove from local state
      setConversations(prev =>
        prev.filter(conv => conv.conversation_id !== conversationId)
      );
    }

    return success;
  }, []);

  // Update conversation after new message
  const updateConversation = useCallback(async (
    conversationId: string,
    lastMessage: string,
    coachType?: CoachType
  ): Promise<boolean> => {
    const success = await updateLastMessage(conversationId, lastMessage, coachType);

    if (success) {
      // Update local state
      setConversations(prev =>
        prev.map(conv =>
          conv.conversation_id === conversationId
            ? {
                ...conv,
                preview_text: lastMessage.substring(0, 100),
                last_message_at: new Date().toISOString(),
                ...(coachType && { coach_type: coachType })
              }
            : conv
        )
      );
    }

    return success;
  }, []);

  // Refresh the conversation list
  const refresh = useCallback(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    isLoading,
    error,
    addConversation,
    renameConversation,
    removeConversation,
    updateConversation,
    refresh
  };
}
