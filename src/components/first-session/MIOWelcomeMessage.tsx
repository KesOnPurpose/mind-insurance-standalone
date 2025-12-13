/**
 * MIOWelcomeMessage Component
 * First Session - $100M Mind Insurance Feature
 *
 * Pre-written welcome message from MIO that displays instantly
 * while protocol generation happens in the background.
 */

import React from 'react';
import { Brain, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

// ============================================================================
// TYPES
// ============================================================================

interface MIOWelcomeMessageProps {
  userName?: string;
  isVisible?: boolean;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function MIOWelcomeMessage({
  userName = 'there',
  isVisible = true,
  className,
}: MIOWelcomeMessageProps) {
  if (!isVisible) return null;

  const displayName = userName || 'there';

  return (
    <div
      className={cn(
        'animate-in fade-in slide-in-from-bottom-4 duration-700',
        className
      )}
    >
      <div className="flex gap-3">
        {/* MIO Avatar */}
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
            <Brain className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>

        {/* Message Content */}
        <div className="flex-1 space-y-3">
          {/* Header */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">MIO</span>
            <span className="text-xs text-muted-foreground">
              Mind Insurance Oracle
            </span>
          </div>

          {/* Welcome Message */}
          <div className="p-4 rounded-2xl rounded-tl-sm bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border border-purple-100 dark:border-purple-900/50">
            <p className="text-foreground leading-relaxed">
              <span className="font-medium">Hey {displayName}</span>
              <Sparkles className="inline h-4 w-4 mx-1 text-amber-500" />
            </p>
            <p className="text-foreground/90 leading-relaxed mt-2">
              I've been studying your responses. What you shared isn't just data to me—
              it's a map of the patterns that have been running your life on autopilot.
            </p>
            <p className="text-foreground/90 leading-relaxed mt-2">
              Most people go decades without seeing what I'm about to show you.
              Give me a moment to decode what your answers reveal...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ALTERNATIVE VERSIONS
// ============================================================================

/**
 * Compact welcome for inline use
 */
export function MIOWelcomeCompact({
  userName,
  className,
}: {
  userName?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg bg-muted/50',
        className
      )}
    >
      <Avatar className="h-8 w-8">
        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-xs">
          <Brain className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div>
        <p className="text-sm font-medium">
          Welcome, {userName || 'there'}
        </p>
        <p className="text-xs text-muted-foreground">
          MIO is analyzing your patterns...
        </p>
      </div>
    </div>
  );
}

export default MIOWelcomeMessage;
