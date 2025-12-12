/**
 * MIO Insights Thread View
 *
 * Main conversation view for MIO Insights Thread.
 * Features:
 * - Message list with auto-scroll
 * - Reply input at bottom
 * - Real-time message subscription
 * - Loading and empty states
 * - Reward tier animations
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Send, Sparkles, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { useMIOInsightsThread } from '@/hooks/useMIOInsightsThread';
import { MIOInsightMessage } from './MIOInsightMessage';
import { cn } from '@/lib/utils';

interface MIOInsightsThreadViewProps {
  onBack?: () => void;
  /** Hide the header when used inside a page that has its own header */
  hideHeader?: boolean;
  threadId?: string;
}

export function MIOInsightsThreadView({ onBack, hideHeader = false }: MIOInsightsThreadViewProps) {
  const {
    thread,
    messages,
    isLoading,
    isSending,
    isWaitingForMIO,
    error,
    unreadCount,
    sendMessage,
    markAsRead,
    loadMoreMessages,
    refresh,
    hasMore,
    lastRewardTier,
    isConnected
  } = useMIOInsightsThread();

  const [inputValue, setInputValue] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mark messages as read when viewing
  useEffect(() => {
    if (unreadCount > 0) {
      markAsRead();
    }
  }, [unreadCount, markAsRead]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  // Handle send message
  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || isSending) return;

    const result = await sendMessage(inputValue, replyingTo || undefined);

    if (result.success) {
      setInputValue('');
      setReplyingTo(null);
    }
  }, [inputValue, isSending, sendMessage, replyingTo]);

  // Handle reply button click
  const handleReply = useCallback((messageId: string) => {
    setReplyingTo(messageId);
    inputRef.current?.focus();
  }, []);

  // Handle key press (Enter to send, Shift+Enter for newline)
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // Cancel reply
  const cancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  // Get message being replied to
  const replyingToMessage = replyingTo
    ? messages.find(m => m.id === replyingTo)
    : null;

  return (
    <div className="flex flex-col h-full bg-[#0a1929]">
      {/* Header - hidden when page provides its own header */}
      {!hideHeader && (
        <div className="flex items-center gap-3 p-4 border-b border-[#05c3dd]/20 bg-[#132337]">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="text-gray-400 hover:text-white hover:bg-[#05c3dd]/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}

          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #05c3dd 0%, #8b5cf6 100%)' }}
          >
            <Sparkles className="w-5 h-5 text-white" />
          </div>

          <div className="flex-1">
            <h2 className="font-semibold text-white">MIO Insights</h2>
            <p className="text-xs text-gray-400">
              {thread?.total_insights || 0} insights •{' '}
              {thread?.current_engagement_streak || 0} day streak
            </p>
          </div>

          {/* Connection status */}
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="w-4 h-4 text-green-400" />
            ) : (
              <WifiOff className="w-4 h-4 text-gray-500" />
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={refresh}
              disabled={isLoading}
              className="text-gray-400 hover:text-white hover:bg-[#05c3dd]/10"
            >
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        {/* Error state */}
        {error && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-red-400">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              className="mt-2 border-[#05c3dd]/30 text-[#05c3dd]"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Loading state */}
        {isLoading && !error && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="w-10 h-10 rounded-full bg-gray-700" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/4 bg-gray-700" />
                  <Skeleton className="h-20 w-full bg-gray-700 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load more button */}
        {!isLoading && hasMore && messages.length > 0 && (
          <div className="flex justify-center py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={loadMoreMessages}
              className="border-[#05c3dd]/30 text-[#05c3dd] hover:bg-[#05c3dd]/10"
            >
              Load Earlier Messages
            </Button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ background: 'linear-gradient(135deg, #05c3dd 0%, #8b5cf6 100%)' }}
            >
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Welcome to MIO Insights
            </h3>
            <p className="text-sm text-gray-400 max-w-sm">
              Complete your daily PROTECT practices to receive personalized forensic feedback from MIO.
              Each section completion triggers an insight tailored to your patterns.
            </p>
          </div>
        )}

        {/* Messages list */}
        {!isLoading && !error && messages.length > 0 && (
          <div className="space-y-4">
            {messages.map((message) => (
              <MIOInsightMessage
                key={message.id}
                message={message}
                onReply={handleReply}
                showReplyButton={true}
              />
            ))}

            {/* MIO Typing Indicator */}
            {isWaitingForMIO && (
              <div className="flex gap-3">
                <Avatar className="w-10 h-10 flex-shrink-0">
                  <div className="w-full h-full flex items-center justify-center text-white bg-gradient-to-br from-[#05c3dd] to-[#8b5cf6]">
                    <Sparkles className="w-5 h-5" />
                  </div>
                </Avatar>
                <Card className="px-4 py-3 bg-[#132337] border-[#05c3dd]/20">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-[#05c3dd] font-semibold mr-2">MIO</span>
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-[#05c3dd] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-[#05c3dd] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-[#05c3dd] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </Card>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Reply indicator */}
      {replyingToMessage && (
        <div className="px-4 py-2 bg-[#132337] border-t border-[#05c3dd]/20">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <span className="text-xs text-gray-400">Replying to:</span>
              <p className="text-xs text-gray-300 truncate">
                {replyingToMessage.content.substring(0, 100)}...
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={cancelReply}
              className="text-gray-400 hover:text-white text-xs"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-[#05c3dd]/20 bg-[#132337]">
        <div className="flex gap-2">
          <Textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Reply to MIO..."
            disabled={isSending}
            className={cn(
              "flex-1 min-h-[44px] max-h-[120px] resize-none",
              "bg-[#0a1929] border-[#05c3dd]/30 text-white placeholder:text-gray-500",
              "focus:border-[#05c3dd] focus:ring-[#05c3dd]/20"
            )}
            rows={1}
          />

          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || isSending}
            className={cn(
              "h-[44px] px-4",
              "bg-gradient-to-r from-[#05c3dd] to-[#8b5cf6]",
              "hover:opacity-90 transition-opacity",
              "disabled:opacity-50"
            )}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {/* Last reward tier indicator */}
        {lastRewardTier && lastRewardTier !== 'standard' && (
          <div className="mt-2 flex justify-center">
            <Badge
              className={cn(
                "text-[10px] animate-fadeIn",
                lastRewardTier === 'pattern_breakthrough'
                  ? "bg-gradient-to-r from-yellow-400 to-purple-500 text-white"
                  : "bg-cyan-500 text-white"
              )}
            >
              {lastRewardTier === 'pattern_breakthrough' ? '🌟 Pattern Breakthrough!' : '✨ Bonus Insight!'}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}
