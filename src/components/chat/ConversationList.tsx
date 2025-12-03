import { useMemo } from 'react';
import { MessageSquareOff } from 'lucide-react';
import { ConversationMetadata } from '@/services/conversationMetadataService';
import { ConversationFolder } from './ConversationFolder';
import { Skeleton } from '@/components/ui/skeleton';
import { CoachType } from '@/types/coach';
import { useProduct } from '@/contexts/ProductContext';

interface ConversationListProps {
  conversations: ConversationMetadata[];
  activeConversationId: string | null;
  isLoading: boolean;
  error: string | null;
  onSelectConversation: (conversationId: string) => void;
  onRenameConversation: (conversationId: string, newTitle: string) => Promise<boolean>;
  onArchiveConversation: (conversationId: string) => Promise<boolean>;
}

// Map product types to their default coach
const PRODUCT_TO_COACH: Record<string, CoachType> = {
  'grouphome': 'nette',
  'mind-insurance': 'mio',
  'me-wealth': 'me',
};

// Define folder order based on current product
const FOLDER_ORDER: CoachType[] = ['nette', 'mio', 'me'];

export function ConversationList({
  conversations,
  activeConversationId,
  isLoading,
  error,
  onSelectConversation,
  onRenameConversation,
  onArchiveConversation,
}: ConversationListProps) {
  const { currentProduct } = useProduct();

  // Determine which coach folder should be open by default based on current product
  const defaultOpenCoach = PRODUCT_TO_COACH[currentProduct] || 'nette';

  // Group conversations by coach_type
  const groupedConversations = useMemo(() => {
    const groups: Record<CoachType, ConversationMetadata[]> = {
      nette: [],
      mio: [],
      me: [],
    };

    conversations.forEach((conv) => {
      const coachType = (conv.coach_type as CoachType) || 'nette';
      if (groups[coachType]) {
        groups[coachType].push(conv);
      } else {
        // Default to nette if unknown coach type
        groups.nette.push(conv);
      }
    });

    return groups;
  }, [conversations]);

  // Debug logging to trace rendering issues
  console.log('[ConversationList] Rendering with:', {
    conversationsCount: conversations.length,
    isLoading,
    error,
    activeConversationId,
    currentProduct,
    defaultOpenCoach,
    groupedCounts: {
      nette: groupedConversations.nette.length,
      mio: groupedConversations.mio.length,
      me: groupedConversations.me.length,
    }
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

  // Conversations list grouped by coach
  return (
    <div className="space-y-2 p-2">
      {FOLDER_ORDER.map((coachType) => (
        <ConversationFolder
          key={coachType}
          coachType={coachType}
          conversations={groupedConversations[coachType]}
          activeConversationId={activeConversationId}
          isDefaultOpen={coachType === defaultOpenCoach}
          onSelectConversation={onSelectConversation}
          onRenameConversation={onRenameConversation}
          onArchiveConversation={onArchiveConversation}
        />
      ))}
    </div>
  );
}
