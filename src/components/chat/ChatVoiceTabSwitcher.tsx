// ============================================================================
// ChatVoiceTabSwitcher - Premium Apple-style segmented control for Chat/Voice
// ============================================================================
// A polished tab switcher that toggles between Chat and Voice modes with
// smooth animations and MI-themed styling (cyan glow on Voice active).
// ============================================================================

import { motion } from 'framer-motion';
import { MessageSquare, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface ChatVoiceTabSwitcherProps {
  activeTab: 'chat' | 'voice';
  onTabChange: (tab: 'chat' | 'voice') => void;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ChatVoiceTabSwitcher({
  activeTab,
  onTabChange,
  className,
}: ChatVoiceTabSwitcherProps) {
  const tabs = [
    { id: 'chat' as const, label: 'Chat', icon: MessageSquare },
    { id: 'voice' as const, label: 'Voice', icon: Phone },
  ];

  return (
    <div
      role="tablist"
      aria-label="Communication mode"
      className={cn(
        'inline-flex items-center p-1 rounded-xl',
        'bg-mi-navy-light/50 backdrop-blur-sm',
        'border border-white/10',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`${tab.id}-panel`}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'relative flex items-center gap-2 px-4 py-2 rounded-lg',
              'text-sm font-medium transition-colors duration-200',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-mi-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-mi-navy',
              isActive
                ? 'text-white'
                : 'text-gray-400 hover:text-gray-300'
            )}
          >
            {/* Animated background pill */}
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className={cn(
                  'absolute inset-0 rounded-lg',
                  'bg-mi-navy-light',
                  tab.id === 'voice'
                    ? 'shadow-[0_0_20px_rgba(5,195,221,0.25)]'
                    : 'shadow-md'
                )}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 30,
                }}
              />
            )}

            {/* Tab content */}
            <span className="relative z-10 flex items-center gap-2">
              <Icon
                className={cn(
                  'h-4 w-4 transition-colors duration-200',
                  isActive && tab.id === 'voice' && 'text-mi-cyan'
                )}
              />
              <span>{tab.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default ChatVoiceTabSwitcher;
