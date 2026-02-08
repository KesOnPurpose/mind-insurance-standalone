// ============================================================================
// FEAT-GH-020: Nette Chat Window Component
// ============================================================================
// Main chat interface with message list, input, and quick replies
// ============================================================================

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Send,
  RefreshCw,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { NetteMessageBubble } from './NetteMessageBubble';
import { NetteTypingIndicator } from './NetteTypingIndicator';
import { NetteQuickReplies } from './NetteQuickReplies';
import type { NetteMessage, NetteChatContext, QuickReply } from '@/types/programs';

interface NetteChatWindowProps {
  messages: NetteMessage[];
  quickReplies: QuickReply[];
  context: NetteChatContext;
  isSending: boolean;
  onSendMessage: (content: string) => void;
  onQuickReply: (reply: QuickReply) => void;
  onNewConversation?: () => void;
  onFeedback?: (messageId: string, feedback: 'positive' | 'negative') => void;
  onSaveInsight?: (messageId: string, content: string) => void;
  className?: string;
}

/**
 * NetteChatWindow - Main chat interface
 * Message list with scroll, input field, quick replies
 */
export const NetteChatWindow = ({
  messages,
  quickReplies,
  context,
  isSending,
  onSendMessage,
  onQuickReply,
  onNewConversation,
  onFeedback,
  onSaveInsight,
  className,
}: NetteChatWindowProps) => {
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isSending]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmedValue = inputValue.trim();
      if (trimmedValue && !isSending) {
        onSendMessage(trimmedValue);
        setInputValue('');
      }
    },
    [inputValue, isSending, onSendMessage]
  );

  const handleQuickReply = useCallback(
    (reply: QuickReply) => {
      if (!isSending) {
        onQuickReply(reply);
      }
    },
    [isSending, onQuickReply]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    },
    [handleSubmit]
  );

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Context banner (when tactic or video context is active) */}
      {(context.tacticLabel || context.videoTimestamp) && (
        <div className="px-4 py-2 bg-purple-50 border-b text-xs text-purple-700 flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5" />
          <span>
            {context.tacticLabel
              ? `Helping with: ${context.tacticLabel}`
              : context.videoTimestamp
              ? `Discussing: ${Math.floor(context.videoTimestamp / 60)}:${(context.videoTimestamp % 60).toString().padStart(2, '0')} in video`
              : 'General help'}
          </span>
        </div>
      )}

      {/* Messages area */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-medium text-lg mb-2">Hi, I'm Nette!</h3>
            <p className="text-sm text-muted-foreground max-w-[240px]">
              I'm your learning companion. Ask me anything about the lesson, or use the quick replies below.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((message) => (
              <NetteMessageBubble
                key={message.id}
                message={message}
                onFeedback={onFeedback}
                onSaveInsight={onSaveInsight}
              />
            ))}
            {isSending && <NetteTypingIndicator />}
          </div>
        )}
      </ScrollArea>

      {/* Quick replies */}
      <NetteQuickReplies
        quickReplies={quickReplies}
        onSelect={handleQuickReply}
        disabled={isSending}
      />

      {/* Input area */}
      <form
        onSubmit={handleSubmit}
        className="p-4 border-t bg-background"
      >
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Type a message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSending}
            className="flex-1"
            aria-label="Message input"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!inputValue.trim() || isSending}
            className="shrink-0"
            aria-label="Send message"
          >
            {isSending ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* New conversation option */}
        {messages.length > 2 && onNewConversation && (
          <div className="mt-2 text-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={onNewConversation}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Start new conversation
            </Button>
          </div>
        )}
      </form>
    </div>
  );
};

export default NetteChatWindow;
