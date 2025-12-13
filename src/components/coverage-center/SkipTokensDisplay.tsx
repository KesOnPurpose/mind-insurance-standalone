/**
 * SkipTokensDisplay Component
 * Coverage Center - $100M Mind Insurance Feature
 *
 * Displays the user's skip tokens (Coverage Protection).
 * Shows 3 token indicators (filled/empty) with tooltip explanations.
 */

import React from 'react';
import { Shield, ShieldCheck, ShieldOff, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { COVERAGE_LANGUAGE, MAX_SKIP_TOKENS } from '@/types/coverage';

// ============================================================================
// TYPES
// ============================================================================

interface SkipTokensDisplayProps {
  tokens: number;
  maxTokens?: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SkipTokensDisplay({
  tokens,
  maxTokens = MAX_SKIP_TOKENS,
  showLabel = false,
  size = 'md',
  className,
}: SkipTokensDisplayProps) {
  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'h-4 w-4';
      case 'lg':
        return 'h-7 w-7';
      default:
        return 'h-5 w-5';
    }
  };

  const iconSize = getIconSize();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'flex items-center gap-1',
              className
            )}
          >
            {/* Token indicators */}
            <div className="flex items-center gap-0.5">
              {Array.from({ length: maxTokens }).map((_, index) => {
                const isFilled = index < tokens;
                return (
                  <Shield
                    key={index}
                    className={cn(
                      iconSize,
                      'transition-all duration-300',
                      isFilled
                        ? 'text-emerald-500 dark:text-emerald-400'
                        : 'text-muted-foreground/30'
                    )}
                    fill={isFilled ? 'currentColor' : 'none'}
                    strokeWidth={isFilled ? 1.5 : 1}
                  />
                );
              })}
            </div>

            {/* Optional label */}
            {showLabel && (
              <span className="text-xs text-muted-foreground ml-1">
                {tokens}/{maxTokens}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <p className="font-semibold">{COVERAGE_LANGUAGE.skipToken}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              {tokens === 0
                ? "You don't have any coverage protection tokens. Complete a 7-day protocol to earn one!"
                : `You have ${tokens} protection token${tokens > 1 ? 's' : ''}. Use one if you miss a day to protect your streak.`}
            </p>
            <div className="text-xs space-y-1 pt-1 border-t border-border/50">
              <p className="text-muted-foreground">
                <span className="font-medium">How to earn:</span> Complete a 7-day protocol
              </p>
              <p className="text-muted-foreground">
                <span className="font-medium">Maximum:</span> {maxTokens} tokens
              </p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============================================================================
// VARIANTS
// ============================================================================

/**
 * Detailed skip tokens card for Coverage Center
 */
export function SkipTokensCard({
  tokens,
  maxTokens = MAX_SKIP_TOKENS,
  onUseToken,
  canUseToken = false,
  isAtRisk = false,
  className,
}: {
  tokens: number;
  maxTokens?: number;
  onUseToken?: () => void;
  canUseToken?: boolean;
  isAtRisk?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'p-4 rounded-lg border',
        isAtRisk
          ? 'border-amber-500/50 bg-amber-50/50 dark:bg-amber-900/10'
          : 'border-border bg-card',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
            <h3 className="font-semibold">{COVERAGE_LANGUAGE.skipToken}</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Protect your streak when you miss a day
          </p>
        </div>

        {/* Token indicators */}
        <div className="flex items-center gap-1">
          {Array.from({ length: maxTokens }).map((_, index) => (
            <Shield
              key={index}
              className={cn(
                'h-6 w-6 transition-all',
                index < tokens
                  ? 'text-emerald-500'
                  : 'text-muted-foreground/20'
              )}
              fill={index < tokens ? 'currentColor' : 'none'}
            />
          ))}
        </div>
      </div>

      {/* At-risk warning */}
      {isAtRisk && tokens > 0 && (
        <div className="mt-3 p-3 rounded-md bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-2">
            <ShieldOff className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Your coverage streak is at risk!
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                You missed a protocol day. Use a token to protect your streak.
              </p>
              {onUseToken && (
                <button
                  onClick={onUseToken}
                  disabled={!canUseToken}
                  className={cn(
                    'text-sm font-medium px-3 py-1.5 rounded-md',
                    'bg-amber-600 text-white hover:bg-amber-700',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'transition-colors'
                  )}
                >
                  Use Token to Protect Streak
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* How to earn section */}
      <div className="mt-3 pt-3 border-t border-border/50">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Info className="h-3 w-3" />
          <span>Complete a 7-day protocol to earn a token</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact badge version
 */
export function SkipTokensBadge({
  tokens,
  className,
}: {
  tokens: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full',
        'bg-emerald-100 dark:bg-emerald-900/30',
        'text-emerald-700 dark:text-emerald-300',
        className
      )}
    >
      <Shield className="h-3 w-3" fill="currentColor" />
      <span className="text-xs font-semibold">{tokens}</span>
    </div>
  );
}

export default SkipTokensDisplay;
