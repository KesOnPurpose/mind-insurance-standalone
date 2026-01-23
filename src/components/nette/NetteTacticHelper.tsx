// ============================================================================
// FEAT-GH-020: Nette Tactic Helper Component
// ============================================================================
// "Help me with this" button for tactics - opens chat with tactic context
// ============================================================================

import { Button } from '@/components/ui/button';
import { HelpCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NetteChatContext } from '@/types/programs';

interface NetteTacticHelperProps {
  tacticId: string;
  tacticLabel: string;
  lessonId?: string;
  phaseId?: string;
  onHelpClick: (context: NetteChatContext) => void;
  variant?: 'icon' | 'button' | 'inline';
  className?: string;
}

/**
 * NetteTacticHelper - "Help me with this" button for tactics
 * One-click opens chat pre-loaded with tactic context
 */
export const NetteTacticHelper = ({
  tacticId,
  tacticLabel,
  lessonId,
  phaseId,
  onHelpClick,
  variant = 'icon',
  className,
}: NetteTacticHelperProps) => {
  const handleClick = () => {
    onHelpClick({
      tacticId,
      tacticLabel,
      lessonId,
      phaseId,
    });
  };

  if (variant === 'inline') {
    return (
      <button
        onClick={handleClick}
        className={cn(
          'inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 hover:underline transition-colors',
          className
        )}
        aria-label={`Get help with ${tacticLabel}`}
      >
        <Sparkles className="h-3 w-3" />
        Need help?
      </button>
    );
  }

  if (variant === 'button') {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        className={cn(
          'gap-1.5 text-purple-600 border-purple-200 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300',
          className
        )}
        aria-label={`Get help with ${tacticLabel}`}
      >
        <Sparkles className="h-3.5 w-3.5" />
        Help me with this
      </Button>
    );
  }

  // Icon variant (default)
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className={cn(
        'h-7 w-7 text-purple-600 hover:text-purple-700 hover:bg-purple-50',
        className
      )}
      aria-label={`Get help with ${tacticLabel}`}
    >
      <HelpCircle className="h-3.5 w-3.5" />
    </Button>
  );
};

export default NetteTacticHelper;
