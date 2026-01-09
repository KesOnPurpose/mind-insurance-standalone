/**
 * ProtocolReadyBadge Component
 * Coverage Center - $100M Mind Insurance Feature
 *
 * Persistent reminder badge for unstarted protocols.
 * Two variants:
 * - floating: Bottom-right corner badge with glass-morphism
 * - dot: Notification dot on Coverage Center card
 *
 * Shown after Protocol Unlock Modal is dismissed.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Gift, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface ProtocolReadyBadgeProps {
  variant: 'floating' | 'dot';
  onView?: () => void;
  className?: string;
}

// ============================================================================
// FLOATING BADGE COMPONENT
// ============================================================================

function FloatingBadge({ onView, className }: { onView?: () => void; className?: string }) {
  return (
    <motion.button
      onClick={onView}
      className={cn(
        'fixed bottom-4 right-4 z-40',
        'flex items-center gap-2.5',
        'px-4 py-3 rounded-full',
        // Glass-morphism effect
        'backdrop-blur-xl bg-mi-navy/80',
        'border border-mi-cyan/20',
        'shadow-[0_8px_32px_rgba(5,195,221,0.15)]',
        // Hover effects
        'cursor-pointer hover:border-mi-cyan/40',
        'hover:shadow-[0_8px_32px_rgba(5,195,221,0.25)]',
        'transition-all duration-300',
        className
      )}
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Pulsing Icon */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [1, 0.8, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatType: 'loop',
          ease: 'easeInOut',
        }}
      >
        <Gift className="w-5 h-5 text-mi-cyan" />
      </motion.div>

      {/* Text */}
      <span className="text-white text-sm font-medium">Protocol Ready</span>

      {/* Arrow */}
      <ChevronRight className="w-4 h-4 text-gray-400" />

      {/* Glow effect on hover */}
      <motion.div
        className="absolute inset-0 rounded-full bg-mi-cyan/5"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      />
    </motion.button>
  );
}

// ============================================================================
// DOT BADGE COMPONENT
// ============================================================================

function DotBadge({ className }: { className?: string }) {
  return (
    <motion.div
      className={cn(
        'absolute -top-1 -right-1 z-10',
        'w-3 h-3 rounded-full',
        'bg-mi-cyan',
        className
      )}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    >
      {/* Pulsing ring effect */}
      <motion.div
        className="absolute inset-0 rounded-full bg-mi-cyan"
        animate={{
          scale: [1, 1.8, 1.8],
          opacity: [0.6, 0, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatType: 'loop',
          ease: 'easeOut',
        }}
      />

      {/* Subtle glow */}
      <div className="absolute inset-0 rounded-full bg-mi-cyan blur-sm opacity-50" />
    </motion.div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ProtocolReadyBadge({
  variant,
  onView,
  className,
}: ProtocolReadyBadgeProps) {
  if (variant === 'floating') {
    return <FloatingBadge onView={onView} className={className} />;
  }

  return <DotBadge className={className} />;
}

export default ProtocolReadyBadge;
