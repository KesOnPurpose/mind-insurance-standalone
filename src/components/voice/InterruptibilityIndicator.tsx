// ============================================================================
// INTERRUPTIBILITY INDICATOR
// Visual cue showing users they can interrupt Nette during calls
// Addresses common user complaint: "Can't interrupt" voice AI
// ============================================================================

import { motion, AnimatePresence } from 'framer-motion';
import { HandIcon, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InterruptibilityIndicatorProps {
  isVisible: boolean;
  isSpeaking?: boolean;
  className?: string;
}

export const InterruptibilityIndicator = ({
  isVisible,
  isSpeaking = false,
  className = ''
}: InterruptibilityIndicatorProps) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-full",
            "glass text-sm",
            isSpeaking
              ? "border-primary/30 bg-primary/5"
              : "border-border/50",
            className
          )}
        >
          {isSpeaking ? (
            <>
              {/* Animated hand icon when Nette is speaking */}
              <motion.div
                animate={{
                  rotate: [0, 15, 0, -15, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <HandIcon className="h-4 w-4 text-primary" />
              </motion.div>
              <span className="text-primary font-medium">Jump in anytime</span>
            </>
          ) : (
            <>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Natural conversation</span>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Compact version for smaller UI contexts
export const InterruptibilityBadge = ({
  isVisible,
  isSpeaking = false,
  className = ''
}: InterruptibilityIndicatorProps) => {
  return (
    <AnimatePresence>
      {isVisible && isSpeaking && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.15 }}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-full",
            "bg-primary/10 border border-primary/20 text-xs",
            className
          )}
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-primary"
          />
          <span className="text-primary font-medium">Interruptible</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InterruptibilityIndicator;
