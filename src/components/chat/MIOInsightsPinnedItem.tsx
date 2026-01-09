/**
 * MIO Insights Pinned Item - Minimal Elegance Design
 *
 * Pinned item at the top of the conversation list for MIO Insights Thread.
 * Features:
 * - Clean, premium design without emoji clutter
 * - Contextual preview messages instead of raw content
 * - Progress bar showing insights collected
 * - Subtle hover effects (no constant animations)
 */

import { Pin, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { MIOInsightsThread, MIOInsightsMessage } from '@/types/mio-insights';
import { formatMessageTime } from '@/services/mioInsightsThreadService';
import { cn } from '@/lib/utils';

interface MIOInsightsPinnedItemProps {
  thread: MIOInsightsThread | null;
  lastMessage?: MIOInsightsMessage;
  unreadCount: number;
  isActive: boolean;
  isLoading: boolean;
  onClick: () => void;
  userTimezone?: string;
}

// Clean preview text - no emojis, no raw markdown
function getCleanPreviewText(
  lastMessage: MIOInsightsMessage | undefined,
  thread: MIOInsightsThread | null
): string {
  if (!lastMessage) return 'Complete a practice to receive insights';

  if (lastMessage.role === 'mio') {
    if (lastMessage.reward_tier === 'pattern_breakthrough') {
      return 'New breakthrough insight waiting';
    }
    if (lastMessage.reward_tier === 'bonus_insight') {
      return 'Bonus insight available';
    }
    return 'Your latest insight is ready';
  }

  return 'New insight available';
}

export function MIOInsightsPinnedItem({
  thread,
  lastMessage,
  unreadCount,
  isActive,
  isLoading,
  onClick,
  userTimezone
}: MIOInsightsPinnedItemProps) {
  // Don't render if no thread (user hasn't completed any sections yet)
  if (!thread && !isLoading) {
    return null;
  }

  return (
    <div className="px-2 mb-2">
      <button
        onClick={onClick}
        className={cn(
          "w-full flex items-start gap-3 p-3 rounded-lg transition-all duration-200",
          "bg-gradient-to-r from-[#132337] to-[#1a2f47] border",
          isActive
            ? "border-[#05c3dd] shadow-[0_0_12px_rgba(5,195,221,0.3)]"
            : "border-[#05c3dd]/30 hover:border-[#05c3dd]/60 hover:shadow-[0_0_8px_rgba(5,195,221,0.2)]"
        )}
      >
        {/* MIO Avatar - Clean single icon */}
        <div className="relative flex-shrink-0">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white"
            style={{ background: 'linear-gradient(135deg, #05c3dd 0%, #8b5cf6 100%)' }}
          >
            <Sparkles className="w-5 h-5" />
          </div>

          {/* Pinned indicator */}
          <div className="absolute -top-1 -right-1 bg-[#05c3dd] rounded-full p-0.5">
            <Pin className="w-2.5 h-2.5 text-white" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-white text-sm">
              MIO Insights
            </span>

            <div className="flex items-center gap-1.5">
              {lastMessage && (
                <span className="text-[10px] text-gray-400">
                  {formatMessageTime(lastMessage.created_at, userTimezone)}
                </span>
              )}

              {/* Unread badge - no pulse animation for calmer UI */}
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className={cn(
                    "min-w-[18px] h-[18px] px-1 text-[10px] font-bold",
                    "bg-[#05c3dd] hover:bg-[#05c3dd] text-white border-0"
                  )}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </div>
          </div>

          {/* Clean preview text */}
          <div className="mt-1">
            {isLoading ? (
              <div className="h-4 bg-gray-700/50 rounded animate-pulse w-3/4" />
            ) : (
              <p className="text-xs text-gray-400">
                {getCleanPreviewText(lastMessage, thread)}
              </p>
            )}
          </div>

          {/* Progress bar + total count */}
          {thread && (
            <div className="mt-2 flex items-center gap-2 text-[10px]">
              <div className="flex-1 h-1 bg-gray-700/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#05c3dd] to-[#8b5cf6] rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((thread.total_insights || 0) / 50 * 100, 100)}%` }}
                />
              </div>
              <span className="text-gray-500">{thread.total_insights || 0} total</span>
            </div>
          )}
        </div>
      </button>
    </div>
  );
}
