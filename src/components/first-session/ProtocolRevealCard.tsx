/**
 * ProtocolRevealCard Component
 * First Session - $100M Mind Insurance Feature
 *
 * Dramatic reveal of user's pattern and first protocol.
 * Creates anticipation and perceived value through staged reveal.
 */

import React, { useState, useEffect } from 'react';
import {
  Brain,
  Sparkles,
  Shield,
  Calendar,
  ChevronRight,
  Target,
  Zap,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// ============================================================================
// TYPES
// ============================================================================

interface ProtocolData {
  id: string;
  title: string;
  pattern_name: string;
  pattern_description?: string;
  day_count: number;
  mio_intro_message?: string;
  first_day_preview?: string;
}

interface ProtocolRevealCardProps {
  protocol: ProtocolData | null;
  isRevealing?: boolean;
  onViewProtocol?: () => void;
  className?: string;
}

// Pattern display configurations
const PATTERN_CONFIGS: Record<string, { icon: typeof Brain; color: string; gradient: string }> = {
  achiever_burnout: {
    icon: Zap,
    color: 'text-amber-500',
    gradient: 'from-amber-500 to-orange-600',
  },
  people_pleaser: {
    icon: Target,
    color: 'text-rose-500',
    gradient: 'from-rose-500 to-pink-600',
  },
  perfectionist: {
    icon: Shield,
    color: 'text-blue-500',
    gradient: 'from-blue-500 to-indigo-600',
  },
  impostor_syndrome: {
    icon: AlertTriangle,
    color: 'text-purple-500',
    gradient: 'from-purple-500 to-violet-600',
  },
  default: {
    icon: Brain,
    color: 'text-purple-500',
    gradient: 'from-purple-500 to-indigo-600',
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function ProtocolRevealCard({
  protocol,
  isRevealing = false,
  onViewProtocol,
  className,
}: ProtocolRevealCardProps) {
  const [revealStage, setRevealStage] = useState(0);
  // Stage 0: Hidden
  // Stage 1: Pattern name reveals
  // Stage 2: Protocol title reveals
  // Stage 3: Full reveal with CTA

  // Staged reveal animation
  useEffect(() => {
    if (!protocol || !isRevealing) return;

    const timers: NodeJS.Timeout[] = [];

    // Stage 1: Pattern reveal (after 500ms)
    timers.push(setTimeout(() => setRevealStage(1), 500));

    // Stage 2: Protocol title (after 2s)
    timers.push(setTimeout(() => setRevealStage(2), 2000));

    // Stage 3: Full reveal (after 3.5s)
    timers.push(setTimeout(() => setRevealStage(3), 3500));

    return () => timers.forEach(clearTimeout);
  }, [protocol, isRevealing]);

  if (!protocol) return null;

  // Get pattern config
  const patternKey = protocol.pattern_name?.toLowerCase().replace(/\s+/g, '_') || 'default';
  const patternConfig = PATTERN_CONFIGS[patternKey] || PATTERN_CONFIGS.default;
  const PatternIcon = patternConfig.icon;

  return (
    <Card
      className={cn(
        'overflow-hidden border-2 transition-all duration-700',
        revealStage > 0 && 'border-purple-200 dark:border-purple-800',
        className
      )}
    >
      {/* Gradient header */}
      <div
        className={cn(
          'h-2 transition-all duration-500',
          revealStage > 0
            ? `bg-gradient-to-r ${patternConfig.gradient}`
            : 'bg-muted'
        )}
      />

      <CardHeader className="pb-3">
        {/* Pattern badge */}
        <div
          className={cn(
            'transition-all duration-700 transform',
            revealStage >= 1
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-4'
          )}
        >
          <Badge
            variant="outline"
            className={cn(
              'mb-3 text-sm px-3 py-1',
              patternConfig.color,
              'border-current bg-current/10'
            )}
          >
            <PatternIcon className="h-4 w-4 mr-1.5" />
            Pattern Identified
          </Badge>
        </div>

        {/* Pattern name - dramatic reveal */}
        <div
          className={cn(
            'transition-all duration-1000 transform',
            revealStage >= 1
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-8 scale-95'
          )}
        >
          <h2 className={cn('text-2xl font-bold', patternConfig.color)}>
            {formatPatternName(protocol.pattern_name)}
          </h2>
          {protocol.pattern_description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {protocol.pattern_description}
            </p>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Protocol reveal */}
        <div
          className={cn(
            'transition-all duration-700 transform',
            revealStage >= 2
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-6'
          )}
        >
          <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border border-purple-100 dark:border-purple-900/50">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-sm">
                <Shield className="h-5 w-5 text-purple-500" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">
                  Your First Coverage Protocol
                </p>
                <h3 className="font-semibold text-lg text-foreground">
                  {protocol.title}
                </h3>
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{protocol.day_count} days</span>
                  <span className="text-purple-500">•</span>
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span>Personalized for you</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MIO intro message */}
        {protocol.mio_intro_message && revealStage >= 2 && (
          <div
            className={cn(
              'transition-all duration-700 transform delay-300',
              revealStage >= 2
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-4'
            )}
          >
            <div className="flex gap-3">
              <div className="flex-shrink-0 p-2 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600">
                <Brain className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 p-3 rounded-lg rounded-tl-sm bg-muted/50">
                <p className="text-sm text-foreground/90 italic">
                  "{protocol.mio_intro_message}"
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Day 1 preview */}
        {protocol.first_day_preview && revealStage >= 3 && (
          <div
            className={cn(
              'transition-all duration-500 transform',
              revealStage >= 3
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-4'
            )}
          >
            <div className="p-3 rounded-lg border border-dashed border-muted-foreground/30">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Day 1 Preview
              </p>
              <p className="text-sm text-foreground/80">
                {protocol.first_day_preview}
              </p>
            </div>
          </div>
        )}

        {/* CTA Button */}
        <div
          className={cn(
            'transition-all duration-500 transform pt-2',
            revealStage >= 3
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-4'
          )}
        >
          <Button
            onClick={onViewProtocol}
            className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
            size="lg"
          >
            View Your Coverage
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatPatternName(pattern: string): string {
  if (!pattern) return 'Your Pattern';
  return pattern
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// ============================================================================
// COMPACT VERSION
// ============================================================================

/**
 * Compact protocol reveal for inline use
 */
export function ProtocolRevealCompact({
  protocol,
  onClick,
  className,
}: {
  protocol: ProtocolData | null;
  onClick?: () => void;
  className?: string;
}) {
  if (!protocol) return null;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-4 rounded-lg border border-border bg-card',
        'text-left transition-all hover:bg-muted/50',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">Your Protocol</p>
          <h4 className="font-medium text-sm line-clamp-1">{protocol.title}</h4>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </button>
  );
}

export default ProtocolRevealCard;
