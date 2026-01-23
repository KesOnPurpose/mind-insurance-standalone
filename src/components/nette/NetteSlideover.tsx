// ============================================================================
// FEAT-GH-020: Nette Slide-Over Component
// ============================================================================
// Slide-over panel for contextual Nette help during lessons
// Opens from the right side, keeping lesson content visible on the left
// THE KEY DIFFERENTIATOR from Teachable/Thinkific/Kajabi
// Uses the REAL Nette AI via N8N webhook (same as /chat page)
// ============================================================================

import { useCallback, useEffect, useState, useRef } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RotateCcw } from 'lucide-react';
import { NetteChatWindow } from './NetteChatWindow';
import { useAuth } from '@/contexts/AuthContext';
import { COACHES } from '@/types/coach';
import type { NetteChatContext, QuickReply, NetteMessage } from '@/types/programs';

interface NetteSlideoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context?: NetteChatContext;
  lessonId?: string;
  initialMessage?: string;
}

/**
 * NetteSlideover - Contextual help panel that slides in from the right
 *
 * Features:
 * - Keeps lesson content visible on the left (desktop)
 * - Full width on mobile for better usability
 * - Pre-loads tactic context when opening
 * - Auto-sends initial help message when tactic context is provided
 * - Uses the REAL Nette AI via N8N webhook (same as /chat page)
 */
export const NetteSlideover = ({
  open,
  onOpenChange,
  context: initialContext,
  lessonId,
  initialMessage,
}: NetteSlideoverProps) => {
  const { user } = useAuth();

  // Build chat context
  const [chatContext, setChatContext] = useState<NetteChatContext>(
    initialContext || {
      lessonId,
    }
  );

  // Track the current tactic ID to detect changes
  const currentTacticIdRef = useRef<string | null>(null);

  // Track if we've sent the initial message for this specific tactic
  const [sentInitialMessageFor, setSentInitialMessageFor] = useState<string | null>(null);

  // Messages state - managed locally for this slide-over
  const [messages, setMessages] = useState<NetteMessage[]>([]);
  const [isSending, setIsSending] = useState(false);

  // Conversation ID for this session
  const [conversationId, setConversationId] = useState<string | null>(null);

  // Quick replies for the current context
  const quickReplies: QuickReply[] = chatContext.tacticLabel
    ? [
        { id: '1', label: 'Break it down', prompt: `Can you break down "${chatContext.tacticLabel}" into smaller steps?` },
        { id: '2', label: 'Why is this important?', prompt: `Why is "${chatContext.tacticLabel}" important?` },
        { id: '3', label: 'Show me an example', prompt: `Can you give me an example of "${chatContext.tacticLabel}"?` },
      ]
    : [];

  // CRITICAL: Reset messages and state when tactic changes
  useEffect(() => {
    if (initialContext?.tacticId && initialContext.tacticId !== currentTacticIdRef.current) {
      console.log('[NetteSlideover] Tactic changed from', currentTacticIdRef.current, 'to', initialContext.tacticId);

      // Clear all state for the new tactic
      setMessages([]);
      setSentInitialMessageFor(null);
      setConversationId(null);
      currentTacticIdRef.current = initialContext.tacticId;

      // Update chat context
      setChatContext(initialContext);
    }
  }, [initialContext?.tacticId, initialContext]);

  // Update context when other props change (non-tactic changes)
  useEffect(() => {
    if (initialContext && initialContext.tacticId === currentTacticIdRef.current) {
      setChatContext(initialContext);
    }
  }, [initialContext]);

  // Send message to REAL Nette via N8N webhook (same as /chat page)
  const sendMessageToNette = useCallback(
    async (content: string) => {
      if (!user?.id || isSending) return;

      setIsSending(true);

      // Create conversation ID if needed
      let convId = conversationId;
      if (!convId) {
        convId = crypto.randomUUID();
        setConversationId(convId);
      }

      // Add user message to UI immediately
      const userMessage: NetteMessage = {
        id: `user-${Date.now()}`,
        conversation_id: convId,
        role: 'user',
        content,
        metadata: {},
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      try {
        const N8N_WEBHOOK_URL =
          import.meta.env.VITE_N8N_WEBHOOK_URL ||
          'https://n8n-n8n.vq00fr.easypanel.host/webhook/UnifiedChat';

        // Build context-aware message
        let contextualMessage = content;
        if (chatContext.tacticLabel && !content.includes(chatContext.tacticLabel)) {
          // Include tactic context in the message for Nette
          contextualMessage = `[Context: User is asking about the tactic "${chatContext.tacticLabel}"${
            chatContext.lessonTitle ? ` from lesson "${chatContext.lessonTitle}"` : ''
          }]\n\n${content}`;
        }

        console.log('[NetteSlideover] Sending to N8N:', {
          user_id: user.id,
          agent: 'nette',
          conversation_id: convId,
          message_preview: contextualMessage.substring(0, 100),
        });

        const response = await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            message: contextualMessage,
            agent: 'nette',
            conversation_id: convId,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to get response: ${response.status}`);
        }

        const data = await response.json();
        console.log('[NetteSlideover] Nette response received');

        // Add Nette's response
        const assistantMessage: NetteMessage = {
          id: `assistant-${Date.now()}`,
          conversation_id: convId,
          role: 'assistant',
          content: data.response || "I'm here to help you. Let me know what you'd like to explore.",
          metadata: {},
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error) {
        console.error('[NetteSlideover] Error sending message:', error);
        // Add error message
        const errorMessage: NetteMessage = {
          id: `error-${Date.now()}`,
          conversation_id: convId,
          role: 'assistant',
          content: "I'm sorry, I couldn't process your message. Please try again.",
          metadata: {},
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsSending(false);
      }
    },
    [user?.id, conversationId, chatContext, isSending]
  );

  // Auto-send initial message when opening with tactic context
  useEffect(() => {
    const sendInitialHelp = async () => {
      // Only send if:
      // 1. Panel is open
      // 2. We have an initial message
      // 3. We have a tactic context
      // 4. We haven't already sent for this tactic
      // 5. User is authenticated
      if (
        open &&
        initialMessage &&
        initialContext?.tacticId &&
        sentInitialMessageFor !== initialContext.tacticId &&
        !isSending &&
        user?.id
      ) {
        console.log('[NetteSlideover] Auto-sending initial help for tactic:', initialContext.tacticId);
        setSentInitialMessageFor(initialContext.tacticId);
        await sendMessageToNette(initialMessage);
      }
    };

    sendInitialHelp();
  }, [
    open,
    initialMessage,
    initialContext?.tacticId,
    sentInitialMessageFor,
    isSending,
    user?.id,
    sendMessageToNette,
  ]);

  // Handle sending message
  const handleSendMessage = useCallback(
    async (content: string) => {
      await sendMessageToNette(content);
    },
    [sendMessageToNette]
  );

  // Handle quick reply
  const handleQuickReply = useCallback(
    (reply: QuickReply) => {
      handleSendMessage(reply.prompt);
    },
    [handleSendMessage]
  );

  // Handle new conversation
  const handleNewConversation = useCallback(() => {
    setMessages([]);
    setSentInitialMessageFor(null);
    setConversationId(null);
  }, []);

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
      console.log('[NetteSlideover] Feedback recorded:', messageId, feedback);
    },
    []
  );

  // Handle save insight
  const handleSaveInsight = useCallback(
    (messageId: string, content: string) => {
      console.log('[NetteSlideover] Save insight requested:', messageId, content);
    },
    []
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:w-[480px] md:w-[520px] lg:w-[560px] p-0 flex flex-col"
      >
        {/* Custom header with Nette branding - uses SAME gradient as /chat page */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b text-white"
          style={{ background: COACHES.nette.gradient }}
        >
          <div className="flex items-center gap-3">
            <img
              src={COACHES.nette.avatar}
              alt={COACHES.nette.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <SheetTitle className="text-white text-base font-semibold">
                {COACHES.nette.name}
              </SheetTitle>
              <SheetDescription className="text-white/80 text-xs">
                {COACHES.nette.title}
              </SheetDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Context indicator - shows tactic being helped with */}
            {initialContext?.tacticLabel && (
              <Badge
                variant="secondary"
                className="bg-white/20 text-white border-0 text-[10px] max-w-[140px] truncate"
                title={initialContext.tacticLabel}
              >
                Helping with tactic
              </Badge>
            )}

            {/* New conversation button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={handleNewConversation}
              aria-label="Start new conversation"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* NOTE: Context banner is shown by NetteChatWindow - no duplicate here */}

        {/* Chat window - takes remaining space */}
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
      </SheetContent>
    </Sheet>
  );
};

export default NetteSlideover;
