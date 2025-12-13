/**
 * StreakResetModal Component
 * Coverage Center - $100M Mind Insurance Feature
 *
 * Modal dialog shown when user's streak is at risk.
 * Offers option to use a Skip Token to protect the streak.
 */

import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, Flame, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { COVERAGE_LANGUAGE } from '@/types/coverage';

// ============================================================================
// TYPES
// ============================================================================

interface StreakResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStreak: number;
  skipTokens: number;
  onUseToken: () => Promise<void>;
  onLetStreakReset: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function StreakResetModal({
  isOpen,
  onClose,
  currentStreak,
  skipTokens,
  onUseToken,
  onLetStreakReset,
}: StreakResetModalProps) {
  const [isUsingToken, setIsUsingToken] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canUseToken = skipTokens > 0;

  const handleUseToken = async () => {
    if (!canUseToken) return;

    setIsUsingToken(true);
    setError(null);

    try {
      await onUseToken();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to use token');
    } finally {
      setIsUsingToken(false);
    }
  };

  const handleLetReset = () => {
    onLetStreakReset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30">
              <ShieldAlert className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <DialogTitle className="text-xl">Coverage at Risk</DialogTitle>
          </div>
          <DialogDescription className="text-left">
            You missed yesterday's protocol completion. Your {currentStreak}-day coverage streak is about to reset.
          </DialogDescription>
        </DialogHeader>

        {/* Streak visualization */}
        <div className="py-4">
          <div className="flex items-center justify-center gap-4 p-4 rounded-lg bg-muted">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5">
                <Flame className="h-8 w-8 text-orange-500" fill="currentColor" />
                <span className="text-3xl font-bold tabular-nums">{currentStreak}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Day Streak</p>
            </div>

            <div className="h-12 w-px bg-border" />

            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <ShieldCheck
                    key={i}
                    className={cn(
                      'h-6 w-6',
                      i < skipTokens
                        ? 'text-emerald-500'
                        : 'text-muted-foreground/20'
                    )}
                    fill={i < skipTokens ? 'currentColor' : 'none'}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {skipTokens} Token{skipTokens !== 1 ? 's' : ''} Available
              </p>
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {/* Use Token Option */}
          <button
            onClick={handleUseToken}
            disabled={!canUseToken || isUsingToken}
            className={cn(
              'w-full p-4 rounded-lg border-2 text-left transition-all',
              canUseToken
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
                : 'border-muted bg-muted cursor-not-allowed opacity-60'
            )}
          >
            <div className="flex items-start gap-3">
              <ShieldCheck
                className={cn(
                  'h-6 w-6 flex-shrink-0 mt-0.5',
                  canUseToken ? 'text-emerald-500' : 'text-muted-foreground'
                )}
              />
              <div className="flex-1">
                <p className="font-semibold">Use {COVERAGE_LANGUAGE.skipToken}</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {canUseToken
                    ? `Protect your ${currentStreak}-day streak (${skipTokens - 1} tokens will remain)`
                    : "You don't have any protection tokens"}
                </p>
              </div>
              {canUseToken && (
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-1 rounded">
                  Recommended
                </span>
              )}
            </div>
          </button>

          {/* Let Reset Option */}
          <button
            onClick={handleLetReset}
            className="w-full p-4 rounded-lg border-2 border-border bg-card text-left transition-all hover:bg-muted"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Let Coverage Lapse</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Your streak will reset to 0. Complete today's protocol to start fresh.
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-md bg-destructive/10 border border-destructive/30">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Neural principle */}
        <div className="pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground italic">
            "Every streak counts. Research shows that breaking a habit chain makes it 3x harder to restart.
            Your amygdala will thank you for protecting this progress."
          </p>
        </div>

        <DialogFooter className="sm:justify-center">
          <Button variant="ghost" onClick={onClose} disabled={isUsingToken}>
            Decide Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// CONFIRMATION DIALOGS
// ============================================================================

/**
 * Success confirmation after using a skip token
 */
export function StreakProtectedDialog({
  isOpen,
  onClose,
  streakCount,
  tokensRemaining,
}: {
  isOpen: boolean;
  onClose: () => void;
  streakCount: number;
  tokensRemaining: number;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm text-center">
        <div className="py-4">
          <div className="inline-flex p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-4">
            <ShieldCheck className="h-8 w-8 text-emerald-500" />
          </div>
          <DialogTitle className="text-xl mb-2">Streak Protected!</DialogTitle>
          <DialogDescription>
            Your {streakCount}-day coverage streak has been protected.
            You have {tokensRemaining} token{tokensRemaining !== 1 ? 's' : ''} remaining.
          </DialogDescription>
        </div>

        <div className="flex items-center justify-center gap-2 py-3">
          <Flame className="h-6 w-6 text-orange-500" fill="currentColor" />
          <span className="text-2xl font-bold">{streakCount}</span>
          <span className="text-muted-foreground">days</span>
        </div>

        <DialogFooter className="sm:justify-center">
          <Button onClick={onClose}>Continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Confirmation when streak resets
 */
export function StreakResetConfirmDialog({
  isOpen,
  onClose,
  previousStreak,
}: {
  isOpen: boolean;
  onClose: () => void;
  previousStreak: number;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm text-center">
        <div className="py-4">
          <div className="inline-flex p-3 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-4">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
          </div>
          <DialogTitle className="text-xl mb-2">Coverage Lapsed</DialogTitle>
          <DialogDescription>
            Your {previousStreak}-day streak has been reset.
            Complete today's protocol to start building again.
          </DialogDescription>
        </div>

        <div className="p-4 rounded-lg bg-muted">
          <p className="text-sm text-muted-foreground">
            "Every setback is a setup for a comeback. Your neural pathways remember the progress -
            rebuilding will be faster this time."
          </p>
        </div>

        <DialogFooter className="sm:justify-center">
          <Button onClick={onClose}>Start Fresh</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default StreakResetModal;
