// ============================================================================
// FEAT-GH-020: Nette Typing Indicator Component
// ============================================================================
// Animated typing dots shown when Nette AI is processing
// ============================================================================

import { Sparkles } from 'lucide-react';

/**
 * NetteTypingIndicator - Animated typing dots
 * Shows when Nette is processing a response
 */
export const NetteTypingIndicator = () => {
  return (
    <div className="flex items-start gap-2 mb-4">
      {/* Avatar */}
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
        <Sparkles className="h-3.5 w-3.5 text-white" />
      </div>

      {/* Typing bubble */}
      <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
        </div>
      </div>
    </div>
  );
};

export default NetteTypingIndicator;
