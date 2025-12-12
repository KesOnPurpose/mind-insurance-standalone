/**
 * MIO Insight Message Component
 *
 * Individual message in the MIO Insights Thread.
 * Features:
 * - Section badges (PRO/TE/CT)
 * - Energy indicators (Commander/Strategist/Celebration)
 * - Reward tier styling (standard/bonus/breakthrough)
 * - Reply threading
 * - Pattern detection display
 */

import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Crown, Target, Trophy, Reply, Lightbulb } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import {
  MIOInsightsMessage,
  SectionType,
  SectionEnergy,
  RewardTier,
  SECTION_NAMES,
  SECTION_ENERGY_CONFIG
} from '@/types/mio-insights';
import { getRewardBadgeStyling, formatMessageTime } from '@/services/mioInsightsThreadService';
import { cn } from '@/lib/utils';

interface MIOInsightMessageProps {
  message: MIOInsightsMessage;
  onReply?: (messageId: string) => void;
  showReplyButton?: boolean;
  userTimezone?: string;
}

// Section energy icons
const ENERGY_ICONS: Record<SectionEnergy, React.ReactNode> = {
  commander: <Crown className="w-3 h-3" />,
  strategist: <Target className="w-3 h-3" />,
  celebration: <Trophy className="w-3 h-3" />
};

export function MIOInsightMessage({
  message,
  onReply,
  showReplyButton = true,
  userTimezone
}: MIOInsightMessageProps) {
  const isMIO = message.role === 'mio';
  const isUser = message.role === 'user';

  // Get section config
  const sectionConfig = message.section_type && message.section_type !== 'reengagement' && message.section_type !== 'protocol' && message.section_type !== 'breakthrough'
    ? SECTION_ENERGY_CONFIG[message.section_type as SectionType]
    : null;

  // Get reward tier styling
  const rewardStyling = useMemo(() => {
    if (!isMIO || !message.reward_tier) return null;
    return getRewardBadgeStyling(message.reward_tier as RewardTier);
  }, [isMIO, message.reward_tier]);

  // Check if this is a special message type
  const isBreakthrough = message.reward_tier === 'pattern_breakthrough';
  const isBonusInsight = message.reward_tier === 'bonus_insight';
  const isReengagement = message.section_type === 'reengagement';

  // Patterns detected display - handle both array and JSON string formats
  const patternsDetected = useMemo(() => {
    const raw = message.patterns_detected;
    if (!raw) return null;

    // If it's already an array, use it directly
    if (Array.isArray(raw)) return raw;

    // If it's a JSON string, parse it
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : null;
      } catch {
        return null;
      }
    }

    return null;
  }, [message.patterns_detected]) as Array<{
    pattern_name: string;
    pattern_type?: string;
    confidence_score?: number;
    confidence?: number;
  }> | null;

  return (
    <div className={cn(
      "flex gap-3",
      isUser ? "flex-row-reverse" : "flex-row"
    )}>
      {/* Avatar */}
      <Avatar className="w-10 h-10 flex-shrink-0">
        <div
          className={cn(
            "w-full h-full flex items-center justify-center text-white font-semibold text-sm",
            isUser
              ? "bg-gray-600"
              : isBreakthrough
                ? "bg-gradient-to-br from-yellow-400 via-purple-500 to-pink-500"
                : "bg-gradient-to-br from-[#05c3dd] to-[#8b5cf6]"
          )}
        >
          {isUser ? 'Y' : <Sparkles className="w-5 h-5" />}
        </div>
      </Avatar>

      {/* Message Card */}
      <Card
        className={cn(
          "p-4 max-w-[85%] relative group",
          // Add bottom padding for MIO messages with reply button to prevent overlap
          isMIO && showReplyButton && onReply && "pb-10",
          isUser
            ? "bg-[#05c3dd] text-white"
            : "bg-[#132337] border-[#05c3dd]/20 text-white",
          isBreakthrough && !isUser && "border-2 border-yellow-400/50 shadow-[0_0_20px_rgba(250,204,21,0.2)]",
          isBonusInsight && !isUser && "border border-cyan-400/50 shadow-[0_0_12px_rgba(5,195,221,0.15)]",
          rewardStyling?.animate && "animate-pulse"
        )}
      >
        {/* MIO Header */}
        {isMIO && (
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#05c3dd]">
                MIO
              </span>

              {/* Section Badge */}
              {sectionConfig && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 h-4 border-0"
                  style={{
                    backgroundColor: `${sectionConfig.color}20`,
                    color: sectionConfig.color
                  }}
                >
                  {ENERGY_ICONS[sectionConfig.energy]}
                  <span className="ml-1">{sectionConfig.name}</span>
                </Badge>
              )}

              {/* Re-engagement Badge */}
              {isReengagement && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 h-4 bg-orange-500/20 text-orange-400 border-0"
                >
                  Check-in
                </Badge>
              )}

              {/* Reward Tier Badge */}
              {rewardStyling && message.reward_tier !== 'standard' && (
                <Badge
                  className={cn(
                    "text-[10px] px-1.5 py-0 h-4 border-0",
                    rewardStyling.className
                  )}
                >
                  {rewardStyling.icon}
                  <span className="ml-1">
                    {message.reward_tier === 'pattern_breakthrough' ? 'Breakthrough' : 'Bonus'}
                  </span>
                </Badge>
              )}
            </div>

            {/* Time */}
            <span className="text-[10px] text-gray-400">
              {formatMessageTime(message.created_at, userTimezone)}
            </span>
          </div>
        )}

        {/* Message Content */}
        <div className={cn(
          "text-sm leading-relaxed prose prose-sm max-w-none",
          "prose-headings:text-[#05c3dd] prose-strong:text-white",
          "prose-p:text-gray-100 prose-li:text-gray-100",
          "prose-a:text-[#05c3dd]",
          isUser && "prose-p:text-white prose-strong:text-white"
        )}>
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>

        {/* Patterns Detected (for MIO messages) */}
        {isMIO && patternsDetected && patternsDetected.length > 0 && (
          <div className="mt-3 pt-3 border-t border-[#05c3dd]/10">
            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mb-1.5">
              <Lightbulb className="w-3 h-3" />
              <span>Patterns Detected</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {patternsDetected.map((pattern, idx) => {
                const confidence = pattern.confidence_score ?? pattern.confidence;
                return (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="text-[9px] px-1.5 py-0 h-4 bg-[#05c3dd]/10 text-[#05c3dd] border-[#05c3dd]/30"
                  >
                    {pattern.pattern_name.replace(/_/g, ' ')}
                    {confidence && (
                      <span className="ml-1 opacity-60">
                        {Math.round(confidence * 100)}%
                      </span>
                    )}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* User message timestamp */}
        {isUser && (
          <span className="text-xs mt-2 block text-white/70">
            {formatMessageTime(message.created_at, userTimezone)}
          </span>
        )}

        {/* Reply button */}
        {isMIO && showReplyButton && onReply && (
          <button
            onClick={() => onReply(message.id)}
            className="absolute bottom-2 right-2 p-1.5 rounded-full bg-[#05c3dd]/10 hover:bg-[#05c3dd]/20 transition-colors"
          >
            <Reply className="w-3.5 h-3.5 text-[#05c3dd]" />
          </button>
        )}
      </Card>
    </div>
  );
}
