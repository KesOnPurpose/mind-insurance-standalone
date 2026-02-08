// ============================================================================
// FEAT-GH-020: Nette Proactive Popup Component
// ============================================================================
// Proactive help popup when user struggles (rewind pattern, stuck, etc.)
// ============================================================================

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { X, Sparkles, MessageCircle, ArrowRight } from 'lucide-react';

interface NetteProactivePopupProps {
  trigger: {
    type: string;
    message: string;
  } | null;
  onAccept: () => void;
  onDismiss: () => void;
  className?: string;
}

/**
 * NetteProactivePopup - Proactive help notification
 * Appears when user is struggling (rewind patterns, stuck on tactic, etc.)
 */
export const NetteProactivePopup = ({
  trigger,
  onAccept,
  onDismiss,
  className,
}: NetteProactivePopupProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (trigger) {
      // Small delay for entrance animation
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [trigger]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsExiting(false);
      onDismiss();
    }, 200);
  };

  const handleAccept = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsExiting(false);
      onAccept();
    }, 200);
  };

  if (!trigger) return null;

  // Map trigger type to user-friendly message
  const getTriggerMessage = () => {
    switch (trigger.type) {
      case 'rewind_pattern':
        return "I noticed you've rewound this section a few times. Would you like me to explain it differently?";
      case 'tactic_stagnation':
        return "Taking your time with this tactic? I can help break it down into smaller steps.";
      case 'lesson_return':
        return "Welcome back! Would you like a quick recap of where you left off?";
      case 'stuck_detected':
        return "It looks like you might be stuck. I'm here to help whenever you're ready.";
      default:
        return trigger.message || "Need some help? I'm here for you!";
    }
  };

  return (
    <div
      className={cn(
        'fixed bottom-24 right-6 z-40 max-w-[320px]',
        'transition-all duration-200',
        isVisible && !isExiting
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-4 pointer-events-none',
        className
      )}
    >
      <Card className="shadow-lg border-purple-200 overflow-hidden">
        {/* Gradient accent bar */}
        <div className="h-1 bg-gradient-to-r from-purple-500 to-pink-500" />

        <CardContent className="p-4">
          {/* Header with dismiss */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="font-medium text-sm">Nette</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={handleDismiss}
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Message */}
          <p className="text-sm text-muted-foreground mb-4">
            {getTriggerMessage()}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={handleAccept}
              className="flex-1 gap-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Chat with me
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-muted-foreground"
            >
              Maybe later
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NetteProactivePopup;
