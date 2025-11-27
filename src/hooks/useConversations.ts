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
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch conversations on mount and when user changes
  const fetchConversations = useCallback(async () => {
    if (!user?.id) {
      setConversations([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await getConversationsList(user.id);
      setConversations(data);
    } catch (err) {
      console.error('[useConversations] Error:', err);
      setError('Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

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
