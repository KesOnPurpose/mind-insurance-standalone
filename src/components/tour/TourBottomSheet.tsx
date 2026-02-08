/**
 * TourBottomSheet Component
 * Practice Tour System
 *
 * Mobile-native bottom sheet for guided tour.
 * Keeps spotlight visible while showing minimal tour info.
 *
 * Features:
 * - Collapsed state: ~120px (title + progress + buttons)
 * - Expanded state: ~350px (includes practice info)
 * - Drag-to-expand with spring animation
 * - Safe area support for iPhone notch
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo, useDragControls } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ChevronUp, ChevronDown, Sparkles } from 'lucide-react';
import type { TourStep } from '@/hooks/useHubTour';

// ============================================================================
// TYPES
// ============================================================================

interface TourBottomSheetProps {
  step: TourStep;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onSkip: () => void;
  onComplete: () => void;
  /** Optional content to display when expanded (e.g., practice info) */
  children?: React.ReactNode;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const COLLAPSED_HEIGHT = 140; // px - enough for title, description snippet, buttons
const EXPANDED_HEIGHT = 380; // px - includes practice info panel
const DRAG_THRESHOLD = 50; // px - minimum drag distance to toggle state

// ============================================================================
// COMPONENT
// ============================================================================

export function TourBottomSheet({
  step,
  currentStep,
  totalSteps,
  onNext,
  onSkip,
  onComplete,
  children,
}: TourBottomSheetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const dragControls = useDragControls();

  const isLastStep = currentStep === totalSteps - 1;
  const hasExpandableContent = !!children;

  // Handle drag end to toggle expanded state
  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const { offset, velocity } = info;

      // If dragging up (negative y) with enough distance or velocity, expand
      if (offset.y < -DRAG_THRESHOLD || velocity.y < -500) {
        setIsExpanded(true);
      }
      // If dragging down (positive y) with enough distance or velocity, collapse
      else if (offset.y > DRAG_THRESHOLD || velocity.y > 500) {
        setIsExpanded(false);
      }
    },
    []
  );

  // Toggle expanded state
  const toggleExpanded = useCallback(() => {
    if (hasExpandableContent) {
      setIsExpanded((prev) => !prev);
    }
  }, [hasExpandableContent]);

  // Handle action button click
  const handleAction = useCallback(() => {
    if (isLastStep) {
      onComplete();
    } else {
      onNext();
    }
  }, [isLastStep, onComplete, onNext]);

  const sheetHeight = isExpanded ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT;

  return (
    <motion.div
      className={cn(
        'fixed left-0 right-0 z-[110]',
        // Safe area for iPhone notch
        'pb-[env(safe-area-inset-bottom)]'
      )}
      style={{ bottom: 0 }}
      initial={{ y: COLLAPSED_HEIGHT + 50 }}
      animate={{ y: 0 }}
      exit={{ y: COLLAPSED_HEIGHT + 50 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
    >
      <motion.div
        className={cn(
          'mx-2 rounded-t-2xl overflow-hidden',
          // SOLID background matching Mind Insurance theme
          'bg-gradient-to-br from-mi-navy via-mi-navy-light to-mi-navy',
          // Border for visibility
          'border-2 border-b-0 border-mi-cyan/50',
          // Shadow for depth
          'shadow-[0_-8px_30px_rgba(5,195,221,0.3)]',
          // Flexbox for proper layout - buttons always at bottom
          'flex flex-col'
        )}
        animate={{ height: sheetHeight }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        drag="y"
        dragControls={dragControls}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
      >
        {/* Drag Handle */}
        <div
          className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing flex-shrink-0"
          onPointerDown={(e) => dragControls.start(e)}
          onClick={toggleExpanded}
        >
          <div className="w-10 h-1 rounded-full bg-mi-cyan/40" />
        </div>

        {/* Content Container - Scrollable middle section */}
        <div className="px-4 flex-1 overflow-y-auto min-h-0">
          {/* Header Row: Badge + Step Counter + Expand Toggle */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-mi-cyan text-mi-navy font-bold px-2 py-0.5 text-xs uppercase tracking-wide">
                Tour
              </Badge>
              <span className="text-mi-cyan text-xs font-medium">
                {currentStep + 1}/{totalSteps}
              </span>
            </div>

            {/* Expand/Collapse Toggle */}
            {hasExpandableContent && (
              <button
                onClick={toggleExpanded}
                className="flex items-center gap-1 text-xs text-mi-cyan/70 hover:text-mi-cyan transition-colors"
              >
                {isExpanded ? (
                  <>
                    <span>Less</span>
                    <ChevronDown className="h-3.5 w-3.5" />
                  </>
                ) : (
                  <>
                    <span>Details</span>
                    <ChevronUp className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            )}
          </div>

          {/* Progress Dots */}
          <div className="flex gap-1.5 mb-3">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  i === currentStep
                    ? 'w-8 bg-gradient-to-r from-mi-cyan to-mi-gold'
                    : i < currentStep
                    ? 'w-2 bg-mi-cyan/70'
                    : 'w-2 bg-white/30'
                )}
              />
            ))}
          </div>

          {/* Title */}
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-mi-gold flex-shrink-0" />
            <h3 className="text-lg font-bold text-white truncate">{step.title}</h3>
          </div>

          {/* Description - truncated in collapsed mode */}
          <p
            className={cn(
              'text-gray-300 text-sm leading-relaxed',
              !isExpanded && 'line-clamp-2'
            )}
          >
            {step.description}
          </p>

          {/* Expandable Content (Practice Info) */}
          <AnimatePresence>
            {isExpanded && children && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-3">
                  {children}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Actions Row - FIXED at bottom, always visible */}
        <div className="flex justify-between items-center px-4 py-3 flex-shrink-0 border-t border-mi-cyan/20 bg-mi-navy/80">
          <button
            onClick={onSkip}
            className="text-gray-400 text-sm hover:text-gray-200 transition-colors font-medium"
          >
            Skip tour
          </button>

          <Button
            size="sm"
            onClick={handleAction}
            className={cn(
              'px-6 h-10 font-semibold',
              'bg-gradient-to-r from-mi-cyan to-cyan-400',
              'hover:from-mi-cyan-dark hover:to-cyan-500',
              'text-white shadow-lg shadow-mi-cyan/30',
              'border border-mi-cyan/50',
              'transition-all duration-300'
            )}
          >
            {isLastStep ? (
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" />
                Finish
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                Next
                <ChevronRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default TourBottomSheet;
