/**
 * MIO Insight Banner
 *
 * A sticky banner that appears at the top of the screen after a user completes
 * a practice section and MIO generates an insight. Persists until viewed or dismissed.
 *
 * Features:
 * - Mobile-optimized with large tap targets
 * - Special styling for breakthrough/bonus insights
 * - Safe area padding for notch devices
 * - Smooth slide-in animation
 */

import { Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface PendingInsight {
  preview: string;
  sectionName: string;
  rewardTier: 'standard' | 'bonus_insight' | 'pattern_breakthrough';
  timestamp: number;
}

interface MIOInsightBannerProps {
  insight: PendingInsight;
  onView: () => void;
  onDismiss: () => void;
}

export function MIOInsightBanner({
  insight,
  onView,
  onDismiss
}: MIOInsightBannerProps) {
  const { preview, sectionName, rewardTier } = insight;
  const isBreakthrough = rewardTier === 'pattern_breakthrough';
  const isBonus = rewardTier === 'bonus_insight';

  return (
    <div
      className={cn(
        // Layout & positioning
        "fixed top-0 left-0 right-0 z-50",
        "px-4 py-3",
        // Safe area for notch devices
        "pt-[max(0.75rem,env(safe-area-inset-top))]",
        // Background
        "bg-gradient-to-r from-[#132337] to-[#1a2f47]",
        // Border & shadow based on tier
        "border-b-2",
        isBreakthrough
          ? "border-yellow-400 shadow-[0_4px_20px_rgba(250,204,21,0.3)]"
          : isBonus
            ? "border-purple-400 shadow-[0_4px_20px_rgba(168,85,247,0.25)]"
            : "border-mi-cyan shadow-[0_4px_20px_rgba(5,195,221,0.2)]",
        // Animation
        "animate-in slide-in-from-top duration-300"
      )}
    >
      <div className="max-w-4xl mx-auto flex items-center gap-3">
        {/* MIO Avatar */}
        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
            isBreakthrough
              ? "bg-gradient-to-br from-yellow-400 to-purple-500 animate-pulse"
              : isBonus
                ? "bg-gradient-to-br from-purple-400 to-mi-cyan"
                : "bg-gradient-to-br from-mi-cyan to-purple-500"
          )}
        >
          <Sparkles className="w-5 h-5 text-white" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-sm font-semibold",
            isBreakthrough ? "text-yellow-400" : "text-white"
          )}>
            {isBreakthrough
              ? '🌟 Pattern Breakthrough!'
              : isBonus
                ? '✨ Bonus Insight'
                : `💡 ${sectionName} Complete`}
          </p>
          <p className="text-xs text-gray-400 truncate">
            {preview}
          </p>
        </div>

        {/* View Button */}
        <Button
          size="sm"
          onClick={onView}
          className={cn(
            "flex-shrink-0 font-semibold",
            isBreakthrough
              ? "bg-yellow-400 hover:bg-yellow-500 text-black"
              : isBonus
                ? "bg-purple-500 hover:bg-purple-600 text-white"
                : "bg-mi-cyan hover:bg-mi-cyan/80 text-white"
          )}
        >
          View
        </Button>

        {/* Dismiss Button - 44x44 minimum touch target for mobile */}
        <button
          onClick={onDismiss}
          className="p-3 -mr-1 text-gray-400 hover:text-white active:text-white transition-colors rounded-full hover:bg-white/10 active:bg-white/20"
          aria-label="Dismiss notification"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

export default MIOInsightBanner;
