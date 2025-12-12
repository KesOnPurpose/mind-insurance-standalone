/**
 * MIO Insights Pinned Item
 *
 * Pinned item at the top of the conversation list for MIO Insights Thread.
 * Features:
 * - Special MIO gradient styling
 * - Unread count badge
 * - Last message preview
 * - Click to open MIO Insights Thread
 */

import { Pin, Sparkles, Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { MIOInsightsThread, MIOInsightsMessage } from '@/types/mio-insights';
import { formatMessageTime, getRewardBadgeStyling } from '@/services/mioInsightsThreadService';
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

  // Get reward tier styling for last message
  const rewardStyling = lastMessage?.reward_tier
    ? getRewardBadgeStyling(lastMessage.reward_tier as any)
    : null;

  // Get section badge for last message
  const sectionBadge = lastMessage?.section_type ? {
    PRO: { label: 'Champion Setup', color: 'bg-yellow-500' },
    TE: { label: 'Pit Stop', color: 'bg-cyan-500' },
    CT: { label: 'Victory Lap', color: 'bg-purple-500' },
    reengagement: { label: 'Check-in', color: 'bg-orange-500' },
    breakthrough: { label: 'Breakthrough', color: 'bg-gradient-to-r from-yellow-400 to-purple-500' }
  }[lastMessage.section_type] : null;

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
        {/* MIO Avatar */}
        <div className="relative flex-shrink-0">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
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

              {/* Unread badge */}
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className={cn(
                    "min-w-[18px] h-[18px] px-1 text-[10px] font-bold",
                    "bg-[#05c3dd] hover:bg-[#05c3dd] text-white border-0",
                    "animate-pulse"
                  )}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </div>
          </div>

          {/* Preview text */}
          <div className="mt-1">
            {isLoading ? (
              <div className="h-4 bg-gray-700/50 rounded animate-pulse w-3/4" />
            ) : lastMessage ? (
              <p className="text-xs text-gray-400 truncate">
                {lastMessage.role === 'mio' && rewardStyling && (
                  <span className="mr-1">{rewardStyling.icon}</span>
                )}
                {lastMessage.content.substring(0, 60)}
                {lastMessage.content.length > 60 ? '...' : ''}
              </p>
            ) : (
              <p className="text-xs text-gray-500 italic">
                Complete a practice section to receive MIO insights
              </p>
            )}
          </div>

          {/* Stats row */}
          {thread && (
            <div className="mt-2 flex items-center gap-3 text-[10px] text-gray-500">
              <span>{thread.total_insights || 0} insights</span>
              {thread.current_engagement_streak > 0 && (
                <>
                  <span>•</span>
                  <span className="text-[#05c3dd]">
                    {thread.current_engagement_streak} day streak
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </button>
    </div>
  );
}
