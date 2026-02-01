/**
 * TourTooltip Component
 * Hub Tour System
 *
 * Premium glass-morphism tooltip component for the guided tour.
 * Luxury aesthetic with gold accents matching Mind Insurance design language.
 *
 * Features:
 * - Smooth animations with Framer Motion
 * - Step progress indicator with gold gradient
 * - Floating particles animation
 * - Responsive positioning
 * - Skip/Next/Finish controls
 */

import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Sparkles } from 'lucide-react';
import type { TourStep, TourPosition } from '@/hooks/useHubTour';

// ============================================================================
// TYPES
// ============================================================================

interface TourTooltipProps {
  step: TourStep;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onSkip: () => void;
  onComplete: () => void;
  /** Optional content to display below the description (e.g., practice info) */
  children?: React.ReactNode;
}

interface TooltipPosition {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  arrowPosition: 'top' | 'bottom' | 'left' | 'right';
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateTooltipPosition(
  targetRect: DOMRect | null,
  position: TourPosition,
  tooltipWidth: number = 340,
  tooltipHeight: number = 220
): TooltipPosition | null {
  if (!targetRect) return null;

  const OFFSET = 16; // Gap between target and tooltip
  const VIEWPORT_PADDING = 16;

  let result: TooltipPosition;

  // Calculate centered left position (used by most positions)
  const centeredLeft = Math.max(
    VIEWPORT_PADDING,
    Math.min(
      targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
      window.innerWidth - tooltipWidth - VIEWPORT_PADDING
    )
  );

  switch (position) {
    case 'top':
      result = {
        // Ensure tooltip doesn't go above viewport
        top: Math.max(
          VIEWPORT_PADDING,
          targetRect.top - tooltipHeight - OFFSET
        ),
        left: centeredLeft,
        arrowPosition: 'bottom',
      };
      break;

    case 'bottom':
      result = {
        // Ensure tooltip doesn't go below viewport
        top: Math.min(
          targetRect.bottom + OFFSET,
          window.innerHeight - tooltipHeight - VIEWPORT_PADDING
        ),
        left: centeredLeft,
        arrowPosition: 'top',
      };
      break;

    case 'left':
      result = {
        top: Math.max(
          VIEWPORT_PADDING,
          Math.min(
            targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
            window.innerHeight - tooltipHeight - VIEWPORT_PADDING
          )
        ),
        right: window.innerWidth - targetRect.left + OFFSET,
        arrowPosition: 'right',
      };
      break;

    case 'right':
      result = {
        top: Math.max(
          VIEWPORT_PADDING,
          Math.min(
            targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
            window.innerHeight - tooltipHeight - VIEWPORT_PADDING
          )
        ),
        left: targetRect.right + OFFSET,
        arrowPosition: 'left',
      };
      break;

    default:
      result = {
        top: Math.min(
          targetRect.bottom + OFFSET,
          window.innerHeight - tooltipHeight - VIEWPORT_PADDING
        ),
        left: centeredLeft,
        arrowPosition: 'top',
      };
  }

  // Final safety check: if tooltip would still be off-screen, center it
  const isOffScreen = (pos: TooltipPosition): boolean => {
    if (pos.top !== undefined && (pos.top < 0 || pos.top + tooltipHeight > window.innerHeight)) return true;
    if (pos.bottom !== undefined && pos.bottom < 0) return true;
    if (pos.left !== undefined && (pos.left < 0 || pos.left + tooltipWidth > window.innerWidth)) return true;
    return false;
  };

  if (isOffScreen(result)) {
    // Fallback: Center tooltip in viewport
    result = {
      top: Math.max(VIEWPORT_PADDING, (window.innerHeight - tooltipHeight) / 2),
      left: Math.max(VIEWPORT_PADDING, (window.innerWidth - tooltipWidth) / 2),
      arrowPosition: 'top',
    };
  }

  return result;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function TourTooltip({
  step,
  currentStep,
  totalSteps,
  onNext,
  onSkip,
  onComplete,
  children,
}: TourTooltipProps) {
  const [position, setPosition] = useState<TooltipPosition | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const isLastStep = currentStep === totalSteps - 1;

  // Calculate position based on target element
  useEffect(() => {
    const targetElement = document.querySelector(step.targetSelector);
    if (!targetElement) {
      console.warn('[TourTooltip] Target element not found:', step.targetSelector);
      return;
    }

    // First, scroll target into center of viewport for better visibility
    targetElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest',
    });

    const updatePosition = () => {
      const rect = targetElement.getBoundingClientRect();
      const tooltipWidth = tooltipRef.current?.offsetWidth || 340;
      // Account for children content - practice info panel can make tooltip taller
      const tooltipHeight = tooltipRef.current?.offsetHeight || 400;

      // SMART POSITIONING: Choose 'top' or 'bottom' based on where target is in viewport
      // If target is in bottom half of screen, show tooltip above; otherwise below
      const viewportHeight = window.innerHeight;
      const targetCenterY = rect.top + rect.height / 2;
      const smartPosition: TourPosition = targetCenterY > viewportHeight / 2 ? 'top' : 'bottom';

      const newPosition = calculateTooltipPosition(rect, smartPosition, tooltipWidth, tooltipHeight);
      setPosition(newPosition);
    };

    // Delay initial position calculation to allow scroll to settle
    const scrollTimeout = setTimeout(updatePosition, 400);

    // Update on resize/scroll
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      clearTimeout(scrollTimeout);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [step]);

  // Handle action button click
  const handleAction = () => {
    if (isLastStep) {
      onComplete();
    } else {
      onNext();
    }
  };

  if (!position) return null;

  // Build position style
  // z-index 110 to be above sidebar sheet (z-50) and tour highlight (z-100)
  // pointer-events: auto ensures clicks are captured
  const positionStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 110,
    pointerEvents: 'auto',
    ...(position.top !== undefined && { top: position.top }),
    ...(position.bottom !== undefined && { bottom: position.bottom }),
    ...(position.left !== undefined && { left: position.left }),
    ...(position.right !== undefined && { right: position.right }),
  };

  return (
    <motion.div
      ref={tooltipRef}
      style={positionStyle}
      className={cn(
        'w-[340px] sm:w-[380px] p-0 rounded-2xl overflow-hidden',
        // SOLID background for strong contrast (not glass-morphism)
        'bg-gradient-to-br from-mi-navy via-mi-navy-light to-mi-navy',
        // STRONGER border for visibility
        'border-2 border-mi-cyan/60',
        // STRONGER shadow for depth
        'shadow-[0_8px_40px_rgba(5,195,221,0.4),0_0_100px_rgba(5,195,221,0.2)]'
      )}
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* Animated gradient border glow - STRONGER */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
        <div className="absolute inset-[-2px] bg-gradient-to-br from-mi-cyan/50 via-transparent to-mi-gold/50 opacity-70" />
      </div>

      {/* Background gradient mesh - STRONGER */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full bg-gradient-to-br from-mi-cyan/30 to-transparent opacity-60 blur-2xl" />
        <div className="absolute -bottom-10 -right-10 w-24 h-24 rounded-full bg-mi-gold/20 blur-xl" />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className={cn(
              "absolute rounded-full",
              i % 2 === 0 ? "w-1 h-1 bg-mi-cyan/50" : "w-0.5 h-0.5 bg-mi-gold/60"
            )}
            initial={{
              x: Math.random() * 300,
              y: Math.random() * 100 + 20,
              opacity: 0,
              scale: 0,
            }}
            animate={{
              y: [null, -20, 0],
              opacity: [0, 0.8, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 3,
              delay: i * 0.3,
              repeat: Infinity,
              repeatType: 'loop',
            }}
          />
        ))}
      </div>

      {/* Arrow indicator */}
      <TooltipArrow position={position.arrowPosition} />

      {/* Content */}
      <div className="relative p-5">
        {/* Top gradient accent line */}
        <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-mi-cyan/70 to-transparent" />

        {/* TOUR Badge + Step indicator */}
        <div className="flex items-center gap-3 mb-4">
          <Badge className="bg-mi-cyan text-mi-navy font-bold px-2.5 py-0.5 text-xs uppercase tracking-wide shadow-lg shadow-mi-cyan/30">
            Tour
          </Badge>
          <span className="text-mi-cyan text-sm font-medium">
            Step {currentStep + 1} of {totalSteps}
          </span>
        </div>

        {/* Step progress dots */}
        <div className="flex gap-1.5 mb-4">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                i === currentStep
                  ? 'w-10 bg-gradient-to-r from-mi-cyan to-mi-gold shadow-md shadow-mi-cyan/50'
                  : i < currentStep
                  ? 'w-3 bg-mi-cyan/70'
                  : 'w-3 bg-white/30'
              )}
            />
          ))}
        </div>

        {/* Title with sparkles icon */}
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-mi-gold" />
          <h3 className="text-xl font-bold text-white">{step.title}</h3>
        </div>

        {/* Description */}
        <p className="text-gray-300 text-sm leading-relaxed">{step.description}</p>

        {/* Optional children content (e.g., practice info panel) */}
        {children && (
          <div className="max-h-[200px] overflow-y-auto -mx-1 px-1">
            {children}
          </div>
        )}

        {/* Spacer before actions */}
        <div className="mb-5" />

        {/* Actions */}
        <div className="flex justify-between items-center">
          <button
            onClick={onSkip}
            className="text-gray-500 text-sm hover:text-gray-300 transition-colors"
          >
            Skip tour
          </button>
          <Button
            size="sm"
            onClick={handleAction}
            className={cn(
              'px-5 h-10 font-semibold',
              'bg-gradient-to-r from-mi-cyan via-mi-cyan to-cyan-400',
              'hover:from-mi-cyan-dark hover:via-mi-cyan hover:to-cyan-500',
              'text-white shadow-lg shadow-mi-cyan/30',
              'border border-mi-cyan/50',
              'transition-all duration-300',
              'hover:shadow-xl hover:shadow-mi-cyan/40',
              'hover:scale-[1.02]'
            )}
          >
            {isLastStep ? (
              <span className="flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" />
                Finish Tour
              </span>
            ) : (
              <span className="flex items-center gap-1">
                Next
                <ChevronRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </div>

      </div>
    </motion.div>
  );
}

// ============================================================================
// ARROW COMPONENT
// ============================================================================

function TooltipArrow({ position }: { position: 'top' | 'bottom' | 'left' | 'right' }) {
  const arrowClasses = cn(
    'absolute w-3 h-3 transform rotate-45',
    // Glass effect for arrow
    'bg-mi-navy/80 backdrop-blur-xl',
    'border-mi-cyan/20',
    {
      'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 border-l border-t': position === 'top',
      'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 border-r border-b': position === 'bottom',
      'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 border-l border-b': position === 'left',
      'right-0 top-1/2 translate-x-1/2 -translate-y-1/2 border-r border-t': position === 'right',
    }
  );

  return <div className={arrowClasses} />;
}

export default TourTooltip;
