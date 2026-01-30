/**
 * FEAT-GH-TOUR: Tour Tooltip Component
 *
 * Glass-morphism tooltip that appears next to highlighted
 * elements during the tour. Features Nette avatar, progress
 * indicator, and navigation controls.
 *
 * SMART POSITIONING: Implements collision detection to prevent
 * tooltips from obscuring highlighted elements.
 */

import { useEffect, useState, useCallback, useRef, useLayoutEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, X, Volume2, VolumeX } from 'lucide-react';
import { NetteAvatar } from './NetteAvatar';
import type { TourStep, TourTooltipPosition } from '@/types/assessment';

interface TourTooltipProps {
  step: TourStep;
  stepIndex: number;
  totalSteps: number;
  isAudioPlaying: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onToggleAudio: () => void;
  showSkip?: boolean;
}

interface Position {
  top: number;
  left: number;
  transformOrigin: string;
}

interface TooltipSize {
  width: number;
  height: number;
}

interface Rect {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

// Minimum gap between tooltip and highlighted element
const GAP = 16;
const TOOLTIP_WIDTH = 360;
const VIEWPORT_MARGIN = 16;
// Default tooltip height estimate for initial render
const DEFAULT_TOOLTIP_HEIGHT = 220;

/**
 * Position fallback priorities - try each position until one works
 */
const POSITION_FALLBACKS: Record<TourTooltipPosition, TourTooltipPosition[]> = {
  top: ['top', 'bottom', 'left', 'right'],
  bottom: ['bottom', 'top', 'left', 'right'],
  left: ['left', 'right', 'top', 'bottom'],
  right: ['right', 'left', 'top', 'bottom'],
  center: ['center'],
};

/**
 * Check if two rectangles overlap
 */
function checkOverlap(rect1: Rect, rect2: Rect): boolean {
  return !(
    rect1.right < rect2.left ||
    rect1.left > rect2.right ||
    rect1.bottom < rect2.top ||
    rect1.top > rect2.bottom
  );
}

/**
 * Check if a rectangle fits within the viewport
 */
function fitsInViewport(rect: Rect): boolean {
  return (
    rect.top >= VIEWPORT_MARGIN &&
    rect.left >= VIEWPORT_MARGIN &&
    rect.right <= window.innerWidth - VIEWPORT_MARGIN &&
    rect.bottom <= window.innerHeight - VIEWPORT_MARGIN
  );
}

/**
 * Calculate position for a specific placement relative to target
 */
function calculatePositionForPlacement(
  placement: TourTooltipPosition,
  targetRect: Rect,
  tooltipSize: TooltipSize,
  padding: number
): Position {
  const targetWithPadding = {
    top: targetRect.top - padding,
    left: targetRect.left - padding,
    right: targetRect.right + padding,
    bottom: targetRect.bottom + padding,
    width: targetRect.width + padding * 2,
    height: targetRect.height + padding * 2,
  };

  switch (placement) {
    case 'top':
      return {
        top: targetWithPadding.top - tooltipSize.height - GAP,
        left: targetWithPadding.left + targetWithPadding.width / 2 - tooltipSize.width / 2,
        transformOrigin: 'bottom center',
      };
    case 'bottom':
      return {
        top: targetWithPadding.bottom + GAP,
        left: targetWithPadding.left + targetWithPadding.width / 2 - tooltipSize.width / 2,
        transformOrigin: 'top center',
      };
    case 'left':
      return {
        top: targetWithPadding.top + targetWithPadding.height / 2 - tooltipSize.height / 2,
        left: targetWithPadding.left - tooltipSize.width - GAP,
        transformOrigin: 'right center',
      };
    case 'right':
      return {
        top: targetWithPadding.top + targetWithPadding.height / 2 - tooltipSize.height / 2,
        left: targetWithPadding.right + GAP,
        transformOrigin: 'left center',
      };
    case 'center':
    default:
      return {
        top: window.innerHeight / 2,
        left: window.innerWidth / 2,
        transformOrigin: 'center center',
      };
  }
}

/**
 * Get the best position that doesn't overlap the target and fits in viewport
 */
function findBestPosition(
  preferredPosition: TourTooltipPosition,
  targetRect: Rect | null,
  tooltipSize: TooltipSize,
  padding: number
): Position {
  // Handle center position (no target needed)
  if (preferredPosition === 'center' || !targetRect) {
    return {
      top: window.innerHeight / 2,
      left: window.innerWidth / 2,
      transformOrigin: 'center center',
    };
  }

  const fallbacks = POSITION_FALLBACKS[preferredPosition] || POSITION_FALLBACKS.bottom;
  const targetWithPadding = {
    top: targetRect.top - padding,
    left: targetRect.left - padding,
    right: targetRect.right + padding,
    bottom: targetRect.bottom + padding,
    width: targetRect.width + padding * 2,
    height: targetRect.height + padding * 2,
  };

  // Try each position in the fallback chain
  for (const placement of fallbacks) {
    const pos = calculatePositionForPlacement(placement, targetRect, tooltipSize, padding);

    const tooltipRect: Rect = {
      top: pos.top,
      left: pos.left,
      right: pos.left + tooltipSize.width,
      bottom: pos.top + tooltipSize.height,
      width: tooltipSize.width,
      height: tooltipSize.height,
    };

    // Check if this position works (fits in viewport and doesn't overlap target)
    if (fitsInViewport(tooltipRect) && !checkOverlap(tooltipRect, targetWithPadding)) {
      return pos;
    }
  }

  // Final fallback: constrain to viewport and accept overlap
  const lastResortPos = calculatePositionForPlacement(preferredPosition, targetRect, tooltipSize, padding);
  return constrainToViewport(lastResortPos, tooltipSize);
}

/**
 * Ensure tooltip stays within viewport bounds
 */
function constrainToViewport(position: Position, tooltipSize: TooltipSize): Position {
  const maxTop = window.innerHeight - tooltipSize.height - VIEWPORT_MARGIN;
  const maxLeft = window.innerWidth - tooltipSize.width - VIEWPORT_MARGIN;

  return {
    ...position,
    top: Math.max(VIEWPORT_MARGIN, Math.min(position.top, maxTop)),
    left: Math.max(VIEWPORT_MARGIN, Math.min(position.left, maxLeft)),
  };
}

/**
 * TourTooltip - Glass-morphism tooltip for tour steps
 *
 * Uses smart positioning to avoid obscuring highlighted elements:
 * 1. Measures actual tooltip dimensions
 * 2. Tries preferred position first
 * 3. Falls back through alternatives if overlap detected
 * 4. Ensures tooltip stays within viewport
 */
export function TourTooltip({
  step,
  stepIndex,
  totalSteps,
  isAudioPlaying,
  onNext,
  onPrevious,
  onSkip,
  onToggleAudio,
  showSkip = true,
}: TourTooltipProps) {
  const [position, setPosition] = useState<Position | null>(null);
  const [tooltipSize, setTooltipSize] = useState<TooltipSize>({
    width: TOOLTIP_WIDTH,
    height: DEFAULT_TOOLTIP_HEIGHT,
  });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === totalSteps - 1;
  const isCentered = step.position === 'center';
  const progressPercent = ((stepIndex + 1) / totalSteps) * 100;

  // Measure actual tooltip dimensions after render
  useLayoutEffect(() => {
    if (tooltipRef.current) {
      const rect = tooltipRef.current.getBoundingClientRect();
      setTooltipSize({
        width: rect.width || TOOLTIP_WIDTH,
        height: rect.height || DEFAULT_TOOLTIP_HEIGHT,
      });
    }
  }, [step, stepIndex]);

  // Get target element rect
  const getTargetRect = useCallback((): Rect | null => {
    if (step.position === 'center') return null;

    const element = document.querySelector(`[data-tour-target="${step.targetSelector}"]`);
    if (!element) return null;

    const rect = element.getBoundingClientRect();
    return {
      top: rect.top,
      left: rect.left,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
    };
  }, [step.targetSelector, step.position]);

  // Check if target is inside the mobile sidebar
  const isTargetInSidebar = useCallback((): boolean => {
    if (step.position === 'center') return false;
    const element = document.querySelector(`[data-tour-target="${step.targetSelector}"]`);
    if (!element) return false;
    return !!element.closest('[data-sidebar="sidebar"]');
  }, [step.targetSelector, step.position]);

  // Calculate and update position using smart positioning
  const updatePosition = useCallback(() => {
    const targetRect = getTargetRect();
    const padding = step.highlightPadding || 8;
    const isMobileViewport = window.innerWidth < 768;

    // On mobile, when target is inside sidebar, force bottom-anchored positioning
    // The sidebar takes up most of the screen width, so right/left positions fail
    // and the Next button becomes inaccessible
    if (isMobileViewport && isTargetInSidebar()) {
      const tooltipWidth = Math.min(TOOLTIP_WIDTH, window.innerWidth - VIEWPORT_MARGIN * 2);
      setPosition({
        top: window.innerHeight - tooltipSize.height - VIEWPORT_MARGIN,
        left: (window.innerWidth - tooltipWidth) / 2,
        transformOrigin: 'bottom center',
      });
      return;
    }

    const newPosition = findBestPosition(
      step.position,
      targetRect,
      tooltipSize,
      padding
    );

    setPosition(newPosition);
  }, [step.position, step.highlightPadding, tooltipSize, getTargetRect, isTargetInSidebar]);

  useEffect(() => {
    updatePosition();

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [updatePosition]);

  if (!position) return null;

  return (
    <div
      ref={tooltipRef}
      className={cn(
        'fixed z-[10000]',
        'w-[360px] max-w-[calc(100vw-32px)]',
        // Glass-morphism effect
        'bg-background/95 backdrop-blur-xl',
        'border border-border/50',
        'rounded-2xl shadow-2xl',
        // Animation
        'animate-in fade-in-0 zoom-in-95 duration-300',
        isCentered && '-translate-x-1/2 -translate-y-1/2'
      )}
      style={{
        top: position.top,
        left: position.left,
        transformOrigin: position.transformOrigin,
      }}
      role="dialog"
      aria-labelledby="tour-tooltip-title"
      aria-describedby="tour-tooltip-content"
    >
      {/* Glow border effect */}
      <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-r from-primary/30 via-transparent to-primary/30 blur-xl opacity-50" />

      {/* Header with avatar and controls */}
      <div className="flex items-start gap-3 p-4 pb-2">
        {step.showAvatar && (
          <NetteAvatar
            size="md"
            isPlaying={isAudioPlaying}
            showSoundIndicator
            onToggleSound={onToggleAudio}
          />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3
              id="tour-tooltip-title"
              className="font-semibold text-foreground truncate"
            >
              {step.title}
            </h3>

            {showSkip && (
              <button
                onClick={onSkip}
                className="p-1 rounded-full hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                aria-label="Skip tour"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Step indicator */}
          <span className="text-xs text-muted-foreground">
            Step {stepIndex + 1} of {totalSteps}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p
          id="tour-tooltip-content"
          className="text-sm text-muted-foreground leading-relaxed"
        >
          {step.content}
        </p>
      </div>

      {/* Progress bar */}
      <div className="px-4 pb-3">
        <Progress value={progressPercent} className="h-1" />
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-2 px-4 pb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onPrevious}
          disabled={isFirstStep}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="flex items-center gap-2">
          {/* Audio toggle button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleAudio}
            className="h-8 w-8"
            aria-label={isAudioPlaying ? 'Pause audio' : 'Play audio'}
          >
            {isAudioPlaying ? (
              <Volume2 className="h-4 w-4 text-primary" />
            ) : (
              <VolumeX className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={onNext}
            className="gap-1"
          >
            {isLastStep ? 'Finish' : 'Next'}
            {!isLastStep && <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default TourTooltip;
