import { Loader2, MessageSquareOff } from 'lucide-react';
import { ConversationMetadata } from '@/services/conversationMetadataService';
import { ConversationListItem } from './ConversationListItem';
import { Skeleton } from '@/components/ui/skeleton';

interface ConversationListProps {
  conversations: ConversationMetadata[];
  activeConversationId: string | null;
  isLoading: boolean;
  error: string | null;
  onSelectConversation: (conversationId: string) => void;
  onRenameConversation: (conversationId: string, newTitle: string) => Promise<boolean>;
  onArchiveConversation: (conversationId: string) => Promise<boolean>;
}

export function ConversationList({
  conversations,
  activeConversationId,
  isLoading,
  error,
  onSelectConversation,
  onRenameConversation,
  onArchiveConversation,
}: ConversationListProps) {
  // Debug logging to trace rendering issues
  console.log('[ConversationList] Rendering with:', {
    conversationsCount: conversations.length,
    isLoading,
    error,
    activeConversationId,
    firstConversation: conversations[0]?.title || 'none'
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-2 p-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-start gap-3 p-2">
            <Skeleton className="w-8 h-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <p className="text-xs text-muted-foreground mt-1">
          Try refreshing the page
        </p>
      </div>
    );
  }

  // Empty state
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <MessageSquareOff className="h-10 w-10 text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground">No conversations yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Start a new chat to begin
        </p>
      </div>
    );
  }

  // Conversations list
  return (
    <div className="space-y-1 p-2">
      {conversations.map((conversation) => (
        <ConversationListItem
          key={conversation.id}
          conversation={conversation}
          isActive={conversation.conversation_id === activeConversationId}
          onClick={() => onSelectConversation(conversation.conversation_id)}
          onRename={(newTitle) => onRenameConversation(conversation.conversation_id, newTitle)}
          onArchive={() => onArchiveConversation(conversation.conversation_id)}
        />
      ))}
    </div>
  );
}
