/**
 * TourHighlight Component
 * Hub Tour System
 *
 * Premium spotlight overlay that highlights the tour target element.
 * Creates a dark backdrop with a transparent cutout around the target.
 *
 * Features:
 * - Smooth position animations
 * - Responsive to window resize/scroll
 * - Cyan + Gold dual glow effect around highlighted element
 * - Animated pulsing border
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// TYPES
// ============================================================================

interface TourHighlightProps {
  targetSelector: string;
  isActive: boolean;
}

interface HighlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}


// ============================================================================
// CONSTANTS
// ============================================================================

const PADDING = 8; // Padding around the highlighted element
const BORDER_RADIUS = 12; // Border radius for the cutout

// ============================================================================
// COMPONENT
// ============================================================================

export function TourHighlight({ targetSelector, isActive }: TourHighlightProps) {
  const [rect, setRect] = useState<HighlightRect | null>(null);

  // Find and track target element position with RETRY mechanism
  // Critical fix for timing race condition: sidebar elements don't exist
  // until ~800ms after setOpenMobile(true) is called
  useEffect(() => {
    if (!isActive) {
      setRect(null);
      return;
    }

    let attempts = 0;
    const maxAttempts = 20; // 20 * 100ms = 2 seconds max wait
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let isFound = false;
    let cleanupFn: (() => void) | null = null;

    const findElement = (): boolean => {
      const targetElement = document.querySelector(targetSelector);

      if (targetElement) {
        isFound = true;
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
        console.log('[TourHighlight] Element found after', attempts, 'attempts:', targetSelector);

        const updateRect = () => {
          const domRect = targetElement.getBoundingClientRect();
          setRect({
            top: domRect.top - PADDING,
            left: domRect.left - PADDING,
            width: domRect.width + PADDING * 2,
            height: domRect.height + PADDING * 2,
          });
        };

        // Initial position
        updateRect();

        // Update on resize/scroll
        window.addEventListener('resize', updateRect);
        window.addEventListener('scroll', updateRect, true);

        // Also observe for DOM changes
        const observer = new MutationObserver(updateRect);
        observer.observe(document.body, { childList: true, subtree: true });

        cleanupFn = () => {
          window.removeEventListener('resize', updateRect);
          window.removeEventListener('scroll', updateRect, true);
          observer.disconnect();
        };

        return true;
      } else {
        attempts++;
        if (attempts <= 5 || attempts % 5 === 0) {
          console.log(`[TourHighlight] Attempt ${attempts}/${maxAttempts} - Target not found:`, targetSelector);
        }

        if (attempts >= maxAttempts) {
          console.warn('[TourHighlight] Max attempts reached, target never found:', targetSelector);
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
        }
        return false;
      }
    };

    // Try immediately first
    const foundImmediately = findElement();

    // If not found, start polling every 100ms
    if (!foundImmediately) {
      intervalId = setInterval(() => {
        if (!isFound) {
          findElement();
        }
      }, 100);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      if (cleanupFn) {
        cleanupFn();
      }
    };
  }, [targetSelector, isActive]);

  if (!isActive || !rect) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] pointer-events-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* SVG Overlay with cutout */}
        <svg
          className="absolute inset-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Mask for the cutout */}
            <mask id="tour-highlight-mask">
              {/* Full white background (visible area) */}
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {/* Black rectangle for the cutout (transparent area) */}
              <motion.rect
                x={rect.left}
                y={rect.top}
                width={rect.width}
                height={rect.height}
                rx={BORDER_RADIUS}
                ry={BORDER_RADIUS}
                fill="black"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
            </mask>

            {/* Cyan glow filter - MAX intensity */}
            <filter id="tour-glow-cyan" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="12" result="blur" />
              <feFlood floodColor="#05C3DD" floodOpacity="1.0" result="color" />
              <feComposite in="color" in2="blur" operator="in" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Gold glow filter - MAX intensity */}
            <filter id="tour-glow-gold" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="14" result="blur" />
              <feFlood floodColor="#F5A623" floodOpacity="0.8" result="color" />
              <feComposite in="color" in2="blur" operator="in" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Combined dual glow - MAX intensity */}
            <filter id="tour-glow-dual" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur1" />
              <feFlood floodColor="#05C3DD" floodOpacity="1.0" result="cyan" />
              <feComposite in="cyan" in2="blur1" operator="in" result="cyanGlow" />

              <feGaussianBlur in="SourceGraphic" stdDeviation="16" result="blur2" />
              <feFlood floodColor="#F5A623" floodOpacity="0.7" result="gold" />
              <feComposite in="gold" in2="blur2" operator="in" result="goldGlow" />

              <feMerge>
                <feMergeNode in="goldGlow" />
                <feMergeNode in="cyanGlow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Dark overlay with mask applied - 40% opacity for better visibility of highlighted content */}
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.40)"
            mask="url(#tour-highlight-mask)"
          />

          {/* Outer gold glow ring */}
          <motion.rect
            x={rect.left - 4}
            y={rect.top - 4}
            width={rect.width + 8}
            height={rect.height + 8}
            rx={BORDER_RADIUS + 4}
            ry={BORDER_RADIUS + 4}
            fill="none"
            stroke="#F5A623"
            strokeWidth="1"
            strokeOpacity="0.3"
            filter="url(#tour-glow-gold)"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{
              scale: [1, 1.02, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{
              duration: 2,
              ease: 'easeInOut',
              repeat: Infinity,
              repeatType: 'loop'
            }}
          />

          {/* Primary highlighted area border with cyan glow */}
          <motion.rect
            x={rect.left}
            y={rect.top}
            width={rect.width}
            height={rect.height}
            rx={BORDER_RADIUS}
            ry={BORDER_RADIUS}
            fill="none"
            stroke="#05C3DD"
            strokeWidth="2"
            strokeOpacity="0.7"
            filter="url(#tour-glow-cyan)"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut', delay: 0.1 }}
          />

          {/* Inner subtle border */}
          <motion.rect
            x={rect.left + 1}
            y={rect.top + 1}
            width={rect.width - 2}
            height={rect.height - 2}
            rx={BORDER_RADIUS - 1}
            ry={BORDER_RADIUS - 1}
            fill="none"
            stroke="white"
            strokeWidth="1"
            strokeOpacity="0.1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          />
        </svg>

        {/* Animated corner sparkles */}
        <CornerSparkles rect={rect} />

        {/* Click-through for highlighted area */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            borderRadius: BORDER_RADIUS,
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================================================
// CORNER SPARKLES COMPONENT
// ============================================================================

function CornerSparkles({ rect }: { rect: HighlightRect }) {
  const corners = [
    { x: rect.left - 4, y: rect.top - 4 },
    { x: rect.left + rect.width + 4, y: rect.top - 4 },
    { x: rect.left - 4, y: rect.top + rect.height + 4 },
    { x: rect.left + rect.width + 4, y: rect.top + rect.height + 4 },
  ];

  return (
    <>
      {corners.map((corner, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            left: corner.x - 4,
            top: corner.y - 4,
            background: i % 2 === 0
              ? 'linear-gradient(135deg, #05C3DD, #F5A623)'
              : 'linear-gradient(135deg, #F5A623, #05C3DD)',
            boxShadow: '0 0 8px rgba(5, 195, 221, 0.5), 0 0 12px rgba(245, 166, 35, 0.3)',
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [0, 1.2, 1],
            opacity: [0, 1, 0.8],
          }}
          transition={{
            duration: 0.5,
            delay: 0.2 + i * 0.05,
          }}
        />
      ))}
    </>
  );
}

export default TourHighlight;
