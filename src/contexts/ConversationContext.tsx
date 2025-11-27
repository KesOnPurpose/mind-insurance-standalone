import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CoachType } from '@/types/coach';

interface ConversationState {
  activeConversationId: string | null;
  isNewConversation: boolean;
}

interface ConversationContextType {
  activeConversationId: string | null;
  isNewConversation: boolean;
  setActiveConversation: (conversationId: string | null) => void;
  startNewConversation: () => void;
  selectConversation: (conversationId: string) => void;
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

export function ConversationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConversationState>({
    activeConversationId: null,
    isNewConversation: true,
  });

  // Set active conversation (for internal use)
  const setActiveConversation = useCallback((conversationId: string | null) => {
    setState(prev => ({
      ...prev,
      activeConversationId: conversationId,
      isNewConversation: conversationId === null,
    }));
  }, []);

  // Start a new conversation (shows welcome screen)
  const startNewConversation = useCallback(() => {
    setState({
      activeConversationId: null,
      isNewConversation: true,
    });
    // Clear localStorage
    localStorage.removeItem('mio_conversation_id');
    console.log('[ConversationContext] Started new conversation');
  }, []);

  // Select an existing conversation
  const selectConversation = useCallback((conversationId: string) => {
    setState({
      activeConversationId: conversationId,
      isNewConversation: false,
    });
    // Save to localStorage for persistence
    localStorage.setItem('mio_conversation_id', conversationId);
    console.log('[ConversationContext] Selected conversation:', conversationId);
  }, []);

  return (
    <ConversationContext.Provider value={{
      activeConversationId: state.activeConversationId,
      isNewConversation: state.isNewConversation,
      setActiveConversation,
      startNewConversation,
      selectConversation,
    }}>
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversationContext() {
  const context = useContext(ConversationContext);
  if (context === undefined) {
    throw new Error('useConversationContext must be used within a ConversationProvider');
  }
  return context;
}
