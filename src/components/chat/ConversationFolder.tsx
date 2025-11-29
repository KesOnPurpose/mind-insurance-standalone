import { useState, useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ConversationMetadata } from '@/services/conversationMetadataService';
import { ConversationListItem } from './ConversationListItem';
import { COACHES, CoachType } from '@/types/coach';
import { cn } from '@/lib/utils';

interface ConversationFolderProps {
  coachType: CoachType;
  conversations: ConversationMetadata[];
  activeConversationId: string | null;
  isDefaultOpen?: boolean;
  onSelectConversation: (conversationId: string) => void;
  onRenameConversation: (conversationId: string, newTitle: string) => Promise<boolean>;
  onArchiveConversation: (conversationId: string) => Promise<boolean>;
}

export function ConversationFolder({
  coachType,
  conversations,
  activeConversationId,
  isDefaultOpen = false,
  onSelectConversation,
  onRenameConversation,
  onArchiveConversation,
}: ConversationFolderProps) {
  const [isOpen, setIsOpen] = useState(isDefaultOpen);
  const location = useLocation();
  const coach = COACHES[coachType];

  // Check if we're in the Mind Insurance section for dark theme
  const isMindInsurance = useMemo(() => {
    return location.pathname.startsWith('/mind-insurance');
  }, [location.pathname]);

  // Don't render if no conversations for this coach
  if (conversations.length === 0) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger className={cn(
        "flex items-center gap-2 w-full px-2 py-2 rounded-md transition-colors group",
        isMindInsurance
          ? "hover:bg-mi-navy"
          : "hover:bg-sidebar-accent/50"
      )}>
        {/* Chevron with rotation animation */}
        <ChevronRight
          className={cn(
            'h-4 w-4 shrink-0 transition-transform duration-200',
            isOpen && 'rotate-90',
            isMindInsurance ? 'text-gray-400' : 'text-muted-foreground'
          )}
        />

        {/* Coach Avatar */}
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0"
          style={{ background: coach.gradient }}
        >
          {coach.avatar}
        </div>

        {/* Coach Name & Count */}
        <span className={cn(
          "flex-1 text-sm font-medium text-left truncate",
          isMindInsurance && "text-white"
        )}>
          {coach.name}
        </span>
        <span className={cn(
          "text-xs px-1.5 py-0.5 rounded-full",
          isMindInsurance
            ? "text-mi-cyan bg-mi-navy"
            : "text-muted-foreground bg-muted"
        )}>
          {conversations.length}
        </span>
      </CollapsibleTrigger>

      <CollapsibleContent className="pl-4 space-y-1">
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
      </CollapsibleContent>
    </Collapsible>
  );
}
