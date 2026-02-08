// ============================================================================
// FEAT-GH-020: Nette Chat Component
// ============================================================================
// Main floating chat widget with minimized/expanded states
// THE KEY DIFFERENTIATOR from Teachable/Thinkific/Kajabi
// ============================================================================

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  MessageCircle,
  X,
  Minus,
  Maximize2,
  Sparkles,
} from 'lucide-react';
import { NetteChatWindow } from './NetteChatWindow';
import {
  useNetteConversation,
  useNetteMessages,
  useSendNetteMessage,
  useNetteQuickReplies,
} from '@/hooks/usePrograms';
import type { NetteChatContext, QuickReply } from '@/types/programs';

interface NetteChatProps {
  lessonId?: string;
  context?: NetteChatContext;
  className?: string;
}

/**
 * NetteChat - Main floating chat widget
 * Minimized state: Chat bubble icon with unread badge
 * Expanded state: Full chat window
 */
export const NetteChat = ({
  lessonId,
  context: initialContext,
  className,
}: NetteChatProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  // Build chat context
  const [chatContext, setChatContext] = useState<NetteChatContext>(
    initialContext || {
      lessonId,
    }
  );

  // Hooks for conversation management
  const { conversation, createConversation, updateContext } = useNetteConversation(lessonId);
  const { messages, setMessages } = useNetteMessages(conversation?.id);
  const { sendMessage, isSending } = useSendNetteMessage();
  const { quickReplies } = useNetteQuickReplies(chatContext);

  // Track previous tacticId to detect when a NEW tactic help is requested
  const [lastTacticId, setLastTacticId] = useState<string | undefined>(undefined);

  // Update context when props change - AUTO-OPEN when tactic help is requested
  useEffect(() => {
    if (initialContext) {
      setChatContext(initialContext);
      updateContext(initialContext);

      // Auto-open chat when a NEW tactic "Help me" is clicked
      if (initialContext.tacticId && initialContext.tacticId !== lastTacticId) {
        setLastTacticId(initialContext.tacticId);
        setIsOpen(true);
        setHasUnread(false);

        // Create or update conversation with new context
        if (!conversation) {
          createConversation(initialContext);
        }
      }
    }
  }, [initialContext, updateContext, lastTacticId, conversation, createConversation]);

  // Initialize conversation when opening chat
  const handleOpen = useCallback(async () => {
    setIsOpen(true);
    setHasUnread(false);

    if (!conversation) {
      await createConversation(chatContext);
    }
  }, [conversation, createConversation, chatContext]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setIsFullScreen(false);
  }, []);

  const handleMinimize = useCallback(() => {
    setIsOpen(false);
    setIsFullScreen(false);
  }, []);

  const handleToggleFullScreen = useCallback(() => {
    setIsFullScreen((prev) => !prev);
  }, []);

  // Handle sending message
  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!conversation) {
        const newConv = await createConversation(chatContext);
        await sendMessage(newConv.id, content, chatContext, messages, setMessages);
      } else {
        await sendMessage(conversation.id, content, chatContext, messages, setMessages);
      }
    },
    [conversation, createConversation, chatContext, messages, sendMessage, setMessages]
  );

  // Handle quick reply
  const handleQuickReply = useCallback(
    (reply: QuickReply) => {
      handleSendMessage(reply.prompt);
    },
    [handleSendMessage]
  );

  // Handle new conversation
  const handleNewConversation = useCallback(async () => {
    setMessages([]);
    await createConversation(chatContext);
  }, [createConversation, chatContext, setMessages]);

  // Handle feedback
  const handleFeedback = useCallback(
    (messageId: string, feedback: 'positive' | 'negative') => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, metadata: { ...msg.metadata, feedback } }
            : msg
        )
      );
      // In real implementation, would send to backend
      console.log('Feedback recorded:', messageId, feedback);
    },
    [setMessages]
  );

  // Handle save insight
  const handleSaveInsight = useCallback(
    (messageId: string, content: string) => {
      // Open insight capture modal (would trigger a parent callback)
      console.log('Save insight requested:', messageId, content);
      // In real implementation, would open NetteInsightCapture dialog
    },
    []
  );

  // External method to open chat with context (used by NetteTacticHelper)
  const openWithContext = useCallback(
    async (newContext: NetteChatContext) => {
      setChatContext(newContext);
      setIsOpen(true);
      setHasUnread(false);

      if (!conversation) {
        await createConversation(newContext);
      } else {
        updateContext(newContext);
      }
    },
    [conversation, createConversation, updateContext]
  );

  // Expose openWithContext method via ref or context if needed
  // For now, we'll handle it through the parent component

  return (
    <>
      {/* Floating chat bubble (minimized state) */}
      {!isOpen && (
        <div className={cn('fixed bottom-6 right-6 z-50', className)}>
          <Button
            onClick={handleOpen}
            size="lg"
            className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 relative"
            aria-label="Open Nette AI chat"
          >
            <Sparkles className="h-6 w-6" />
            {hasUnread && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
              >
                1
              </Badge>
            )}
          </Button>
        </div>
      )}

      {/* Expanded chat window */}
      {isOpen && (
        <div
          className={cn(
            'fixed z-50 transition-all duration-200',
            isFullScreen
              ? 'inset-0 md:inset-4'
              : 'bottom-6 right-6 w-[calc(100vw-48px)] md:w-[400px] h-[min(600px,calc(100vh-100px))]',
            className
          )}
        >
          <Card className="flex flex-col h-full shadow-2xl overflow-hidden border-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-purple-600 to-pink-600 text-white">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Nette AI</h3>
                  <p className="text-[10px] text-white/80">Your learning companion</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={handleMinimize}
                  aria-label="Minimize chat"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20 hidden md:flex"
                  onClick={handleToggleFullScreen}
                  aria-label={isFullScreen ? 'Exit full screen' : 'Full screen'}
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={handleClose}
                  aria-label="Close chat"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Chat window */}
            <NetteChatWindow
              messages={messages}
              quickReplies={quickReplies}
              context={chatContext}
              isSending={isSending}
              onSendMessage={handleSendMessage}
              onQuickReply={handleQuickReply}
              onNewConversation={handleNewConversation}
              onFeedback={handleFeedback}
              onSaveInsight={handleSaveInsight}
              className="flex-1 min-h-0"
            />
          </Card>
        </div>
      )}
    </>
  );
};

export default NetteChat;
