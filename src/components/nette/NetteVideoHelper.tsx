// ============================================================================
// FEAT-GH-020: Nette Video Helper Component
// ============================================================================
// "Ask about this moment" button for video player - captures timestamp
// ============================================================================

import { Button } from '@/components/ui/button';
import { MessageCircleQuestion, Sparkles, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NetteChatContext } from '@/types/programs';

interface NetteVideoHelperProps {
  videoTimestamp: number; // Current video position in seconds
  lessonId?: string;
  lessonTitle?: string;
  onAskClick: (context: NetteChatContext) => void;
  variant?: 'overlay' | 'button';
  className?: string;
}

/**
 * NetteVideoHelper - "Ask about this moment" button
 * Captures current video timestamp and opens chat with context
 */
export const NetteVideoHelper = ({
  videoTimestamp,
  lessonId,
  lessonTitle,
  onAskClick,
  variant = 'button',
  className,
}: NetteVideoHelperProps) => {
  const formatTimestamp = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClick = () => {
    onAskClick({
      videoTimestamp,
      lessonId,
      lessonTitle,
    });
  };

  if (variant === 'overlay') {
    // Overlay button for video player (appears on hover)
    return (
      <button
        onClick={handleClick}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg',
          'bg-black/70 text-white text-sm',
          'hover:bg-black/80 transition-colors',
          'backdrop-blur-sm',
          className
        )}
        aria-label="Ask about this moment in the video"
      >
        <Sparkles className="h-4 w-4 text-purple-400" />
        <span>Ask about this moment</span>
        <div className="flex items-center gap-1 text-xs text-white/70 ml-2">
          <Clock className="h-3 w-3" />
          {formatTimestamp(videoTimestamp)}
        </div>
      </button>
    );
  }

  // Button variant (below video)
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      className={cn(
        'gap-2 text-purple-600 border-purple-200 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300',
        className
      )}
      aria-label="Ask about this moment in the video"
    >
      <MessageCircleQuestion className="h-4 w-4" />
      Ask about {formatTimestamp(videoTimestamp)}
    </Button>
  );
};

export default NetteVideoHelper;
