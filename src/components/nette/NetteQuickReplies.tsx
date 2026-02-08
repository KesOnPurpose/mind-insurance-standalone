// ============================================================================
// FEAT-GH-020: Nette Quick Replies Component
// ============================================================================
// Context-aware quick reply chips for common questions
// ============================================================================

import { Button } from '@/components/ui/button';
import type { QuickReply } from '@/types/programs';

interface NetteQuickRepliesProps {
  quickReplies: QuickReply[];
  onSelect: (reply: QuickReply) => void;
  disabled?: boolean;
}

/**
 * NetteQuickReplies - Quick reply chips
 * Context-aware suggestions that update based on current lesson/tactic
 */
export const NetteQuickReplies = ({
  quickReplies,
  onSelect,
  disabled = false,
}: NetteQuickRepliesProps) => {
  if (quickReplies.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-4 py-3 border-t bg-muted/30">
      {quickReplies.map((reply) => (
        <Button
          key={reply.id}
          variant="outline"
          size="sm"
          className="h-8 text-xs rounded-full border-primary/30 hover:border-primary hover:bg-primary/5 transition-colors"
          onClick={() => onSelect(reply)}
          disabled={disabled}
        >
          {reply.label}
        </Button>
      ))}
    </div>
  );
};

export default NetteQuickReplies;
