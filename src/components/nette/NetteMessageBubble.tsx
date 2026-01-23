// ============================================================================
// FEAT-GH-020: Nette Message Bubble Component
// ============================================================================
// Individual message display with user/assistant styling and feedback
// ============================================================================

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ThumbsUp, ThumbsDown, Copy, Check, Bookmark } from 'lucide-react';
import type { NetteMessage } from '@/types/programs';

interface NetteMessageBubbleProps {
  message: NetteMessage;
  onFeedback?: (messageId: string, feedback: 'positive' | 'negative') => void;
  onSaveInsight?: (messageId: string, content: string) => void;
}

/**
 * NetteMessageBubble - Individual message display
 * User messages right-aligned, assistant messages left-aligned
 */
export const NetteMessageBubble = ({
  message,
  onFeedback,
  onSaveInsight,
}: NetteMessageBubbleProps) => {
  const [copied, setCopied] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<'positive' | 'negative' | null>(
    message.metadata.feedback || null
  );

  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleFeedback = (feedback: 'positive' | 'negative') => {
    setFeedbackGiven(feedback);
    onFeedback?.(message.id, feedback);
  };

  const handleSaveInsight = () => {
    onSaveInsight?.(message.id, message.content);
  };

  // Format timestamp
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div
      className={cn(
        'flex w-full mb-4',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[85%] md:max-w-[75%]',
          isUser ? 'order-1' : 'order-2'
        )}
      >
        {/* Avatar for assistant */}
        {isAssistant && (
          <div className="flex items-center gap-2 mb-1.5">
            <img
              src="/nette-avatar.png"
              alt="Nette"
              className="w-6 h-6 rounded-full object-cover"
            />
            <span className="text-xs font-medium text-muted-foreground">Nette</span>
          </div>
        )}

        {/* Message bubble */}
        <div
          className={cn(
            'rounded-2xl px-4 py-3 shadow-sm',
            isUser
              ? 'bg-primary text-primary-foreground rounded-br-md'
              : 'bg-muted rounded-bl-md'
          )}
        >
          <p className="text-sm whitespace-pre-wrap leading-relaxed">
            {message.content}
          </p>

          {/* Video timestamp context */}
          {message.metadata.video_timestamp && (
            <div className="mt-2 pt-2 border-t border-current/10">
              <span className="text-xs opacity-70">
                At {Math.floor(message.metadata.video_timestamp / 60)}:
                {(message.metadata.video_timestamp % 60).toString().padStart(2, '0')}
              </span>
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div
          className={cn(
            'text-[10px] text-muted-foreground mt-1',
            isUser ? 'text-right' : 'text-left'
          )}
        >
          {formatTime(message.created_at)}
        </div>

        {/* Assistant message actions */}
        {isAssistant && (
          <div className="flex items-center gap-1 mt-2">
            {/* Feedback buttons */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-7 w-7',
                feedbackGiven === 'positive' && 'text-green-600 bg-green-50'
              )}
              onClick={() => handleFeedback('positive')}
              disabled={feedbackGiven !== null}
              aria-label="Helpful"
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-7 w-7',
                feedbackGiven === 'negative' && 'text-red-600 bg-red-50'
              )}
              onClick={() => handleFeedback('negative')}
              disabled={feedbackGiven !== null}
              aria-label="Not helpful"
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </Button>

            <div className="w-px h-4 bg-border mx-1" />

            {/* Copy button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleCopy}
              aria-label="Copy message"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>

            {/* Save insight button */}
            {onSaveInsight && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                onClick={handleSaveInsight}
                aria-label="Save as insight"
              >
                <Bookmark className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NetteMessageBubble;
