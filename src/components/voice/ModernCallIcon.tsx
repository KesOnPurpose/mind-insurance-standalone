// ============================================================================
// MODERN CALL ICON
// Premium 2026 aesthetic with gradient fills and smooth animations
// Designed for glassmorphic button integration
// ============================================================================

import { motion, AnimatePresence } from 'framer-motion';

interface ModernCallIconProps {
  isActive: boolean;
  isConnecting?: boolean;
  size?: number;
  className?: string;
}

export const ModernCallIcon = ({
  isActive,
  isConnecting = false,
  size = 24,
  className = ''
}: ModernCallIconProps) => {
  // Gradient IDs need to be unique per instance
  const gradientId = `call-gradient-${Math.random().toString(36).slice(2, 9)}`;
  const activeGradientId = `call-active-gradient-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <AnimatePresence mode="wait">
        {isConnecting ? (
          // Connecting state - pulsing dots
          <motion.div
            key="connecting"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex items-center justify-center gap-1"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-white"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </motion.div>
        ) : isActive ? (
          // Active state - waveform animation
          <motion.svg
            key="active"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full"
          >
            <defs>
              <linearGradient id={activeGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#f0f0f0" />
              </linearGradient>
            </defs>
            {/* Animated waveform bars */}
            <motion.rect
              x="4"
              y="10"
              width="2.5"
              height="4"
              rx="1"
              fill={`url(#${activeGradientId})`}
              animate={{ height: [4, 10, 4], y: [10, 7, 10] }}
              transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.rect
              x="8"
              y="8"
              width="2.5"
              height="8"
              rx="1"
              fill={`url(#${activeGradientId})`}
              animate={{ height: [8, 14, 8], y: [8, 5, 8] }}
              transition={{ duration: 0.5, repeat: Infinity, ease: 'easeInOut', delay: 0.1 }}
            />
            <motion.rect
              x="12"
              y="6"
              width="2.5"
              height="12"
              rx="1"
              fill={`url(#${activeGradientId})`}
              animate={{ height: [12, 6, 12], y: [6, 9, 6] }}
              transition={{ duration: 0.7, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
            />
            <motion.rect
              x="16"
              y="8"
              width="2.5"
              height="8"
              rx="1"
              fill={`url(#${activeGradientId})`}
              animate={{ height: [8, 14, 8], y: [8, 5, 8] }}
              transition={{ duration: 0.55, repeat: Infinity, ease: 'easeInOut', delay: 0.15 }}
            />
          </motion.svg>
        ) : (
          // Idle state - phone icon with gentle pulse
          <motion.svg
            key="idle"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full"
          >
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#05c3dd" />
                <stop offset="50%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#0891b2" />
              </linearGradient>
            </defs>
            {/* Modern phone icon with gradient */}
            <motion.path
              d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
              fill={`url(#${gradientId})`}
              stroke={`url(#${gradientId})`}
              strokeWidth="0.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              animate={{
                scale: [1, 1.02, 1],
                filter: [
                  'drop-shadow(0 0 0px rgba(5, 195, 221, 0))',
                  'drop-shadow(0 0 4px rgba(5, 195, 221, 0.3))',
                  'drop-shadow(0 0 0px rgba(5, 195, 221, 0))'
                ]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
          </motion.svg>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ModernCallIcon;
