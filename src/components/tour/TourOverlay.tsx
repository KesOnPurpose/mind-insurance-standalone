/**
 * FEAT-GH-TOUR: Tour Overlay Component
 *
 * Creates the spotlight effect that highlights tour targets
 * while dimming the rest of the page. Uses CSS clip-path
 * for smooth performance.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';

interface TourOverlayProps {
  targetSelector: string;
  isVisible: boolean;
  padding?: number;
  borderRadius?: number;
  onClick?: () => void;
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * TourOverlay - Spotlight overlay for tour highlights
 *
 * Features:
 * - Smooth spotlight cutout around target element
 * - Responsive to window resize
 * - Click-through on highlighted area
 * - Animated transitions
 */
export function TourOverlay({
  targetSelector,
  isVisible,
  padding = 8,
  borderRadius = 12,
  onClick,
}: TourOverlayProps) {
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);

  // Track the current selector to scroll only on step change
  const prevSelectorRef = useRef<string | null>(null);

  // Find and measure the target element, scrolling into view if needed
  const updateTargetRect = useCallback(() => {
    // 'none' means no spotlight - show full overlay
    if (targetSelector === 'none' || !targetSelector) {
      setTargetRect(null);
      prevSelectorRef.current = targetSelector;
      return;
    }

    const element = document.querySelector(`[data-tour-target="${targetSelector}"]`);

    if (element) {
      // Scroll into view on step change (not on every resize/scroll)
      if (prevSelectorRef.current !== targetSelector) {
        prevSelectorRef.current = targetSelector;
        // Only scroll if element is outside the viewport
        const rect = element.getBoundingClientRect();
        const isOffScreen =
          rect.bottom < 0 ||
          rect.top > window.innerHeight ||
          rect.right < 0 ||
          rect.left > window.innerWidth;
        if (isOffScreen) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Re-measure after scroll animation completes
          setTimeout(() => {
            const newRect = element.getBoundingClientRect();
            setTargetRect({
              top: newRect.top - padding,
              left: newRect.left - padding,
              width: newRect.width + padding * 2,
              height: newRect.height + padding * 2,
            });
          }, 400);
          return;
        }
      }

      const rect = element.getBoundingClientRect();
      setTargetRect({
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      });
    } else {
      // No target found - show full overlay
      setTargetRect(null);
    }
  }, [targetSelector, padding]);

  // Update on mount and when selector changes
  useEffect(() => {
    if (isVisible) {
      updateTargetRect();

      // Reposition on scroll and resize
      const handleUpdate = () => updateTargetRect();
      window.addEventListener('scroll', handleUpdate, true);
      window.addEventListener('resize', handleUpdate);

      return () => {
        window.removeEventListener('scroll', handleUpdate, true);
        window.removeEventListener('resize', handleUpdate);
      };
    }
  }, [isVisible, updateTargetRect]);

  if (!isVisible) return null;

  // If no target rect, show full overlay (for centered dialogs)
  if (!targetRect) {
    return (
      <div
        className={cn(
          'fixed inset-0 z-[9998]',
          'bg-black/50',
          'transition-opacity duration-300',
          'animate-in fade-in-0'
        )}
        onClick={onClick}
        aria-hidden="true"
      />
    );
  }

  // Generate clip-path for spotlight effect
  const clipPath = `polygon(
    0% 0%,
    0% 100%,
    ${targetRect.left}px 100%,
    ${targetRect.left}px ${targetRect.top}px,
    ${targetRect.left + targetRect.width}px ${targetRect.top}px,
    ${targetRect.left + targetRect.width}px ${targetRect.top + targetRect.height}px,
    ${targetRect.left}px ${targetRect.top + targetRect.height}px,
    ${targetRect.left}px 100%,
    100% 100%,
    100% 0%
  )`;

  // Border offset to position glow OUTSIDE the cutout
  const borderOffset = 4;

  return (
    <>
      {/* Main overlay with spotlight cutout */}
      <div
        className={cn(
          'fixed inset-0 z-[9998]',
          'bg-black/50',
          'transition-all duration-300',
          'animate-in fade-in-0'
        )}
        style={{ clipPath }}
        onClick={onClick}
        aria-hidden="true"
      />

      {/* Spotlight border glow - positioned OUTSIDE the cutout */}
      <div
        className={cn(
          'fixed z-[9999] pointer-events-none',
          'border-2 border-primary/50',
          'shadow-[0_0_0_4px_rgba(var(--primary)/0.2),0_0_20px_rgba(var(--primary)/0.3)]',
          'transition-all duration-300',
          'animate-in fade-in-0 zoom-in-95'
        )}
        style={{
          top: targetRect.top - borderOffset,
          left: targetRect.left - borderOffset,
          width: targetRect.width + (borderOffset * 2),
          height: targetRect.height + (borderOffset * 2),
          borderRadius: borderRadius,
        }}
        aria-hidden="true"
      />
    </>
  );
}

export default TourOverlay;
