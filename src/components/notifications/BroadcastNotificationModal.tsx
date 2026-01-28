// =============================================================================
// BROADCAST NOTIFICATION MODAL
// Premium glassmorphic notification modal for displaying admin broadcasts to users
// =============================================================================

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, ExternalLink, Play, CheckCircle, AlertTriangle, AlertCircle, Bell, Info } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PendingBroadcast, BroadcastPriority, PRIORITY_CONFIG } from '@/types/broadcast';
import { markBroadcastInteraction } from '@/services/broadcastService';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface BroadcastNotificationModalProps {
  notification: PendingBroadcast | null;
  onDismiss: () => void;
  onAcknowledge?: () => void;
}

// Priority icon mapping
const PriorityIcon: Record<BroadcastPriority, React.ElementType> = {
  urgent: AlertTriangle,
  high: AlertCircle,
  normal: Bell,
  low: Info,
};

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function BroadcastNotificationModal({
  notification,
  onDismiss,
  onAcknowledge,
}: BroadcastNotificationModalProps) {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!notification) return null;

  const priorityConfig = PRIORITY_CONFIG[notification.priority];
  const PriorityIconComponent = PriorityIcon[notification.priority];

  // Priority-based border styles
  const priorityStyles: Record<BroadcastPriority, string> = {
    urgent: 'border-red-500/30 shadow-[0_8px_32px_rgba(239,68,68,0.2)]',
    high: 'border-mi-gold/30 shadow-[0_8px_32px_rgba(255,184,0,0.2)]',
    normal: 'border-mi-cyan/20 shadow-[0_8px_32px_rgba(5,195,221,0.15)]',
    low: 'border-white/10 shadow-[0_8px_32px_rgba(255,255,255,0.05)]',
  };

  const handleDismiss = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      await markBroadcastInteraction(notification.id, 'dismissed');
      onDismiss();
    } catch (error) {
      console.error('Error dismissing broadcast:', error);
      onDismiss();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAcknowledge = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      await markBroadcastInteraction(notification.id, 'acknowledged');
      onAcknowledge?.();
      onDismiss();
    } catch (error) {
      console.error('Error acknowledging broadcast:', error);
      onDismiss();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleActionClick = async () => {
    try {
      await markBroadcastInteraction(notification.id, 'read');
      if (notification.action_url) {
        window.open(notification.action_url, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Error marking broadcast as read:', error);
      if (notification.action_url) {
        window.open(notification.action_url, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const getVideoThumbnail = (): string | undefined => {
    if (!notification.media_metadata) return undefined;
    const metadata = notification.media_metadata as { thumbnail_url?: string };
    return metadata.thumbnail_url;
  };

  return (
    <Dialog
      open={!!notification}
      onOpenChange={() => notification.dismissible && handleDismiss()}
    >
      <DialogContent
        className={cn(
          'sm:max-w-lg p-0 overflow-hidden border-0',
          // Premium glassmorphism
          'bg-mi-navy/90 backdrop-blur-xl',
          'border',
          priorityStyles[notification.priority]
        )}
      >
        {/* Animated gradient border glow */}
        <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
          <div className="absolute inset-[-2px] bg-gradient-to-br from-mi-cyan/30 via-transparent to-mi-gold/30 opacity-50" />
        </div>

        {/* Background gradient mesh */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 w-60 h-60 rounded-full bg-gradient-to-br from-mi-cyan/20 to-transparent opacity-30 blur-3xl" />
          <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-mi-gold/10 blur-2xl" />
        </div>

        {/* Close button */}
        {notification.dismissible && (
          <button
            onClick={handleDismiss}
            disabled={isProcessing}
            className={cn(
              'absolute top-4 right-4 p-2 rounded-full z-10',
              'bg-white/5 backdrop-blur-sm border border-white/10',
              'text-gray-400 hover:text-white hover:bg-white/10',
              'transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Content */}
        <div className="relative pt-8 pb-6 px-6">
          {/* Priority indicator */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={cn(
              'inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4',
              priorityConfig.bgColor,
              'border',
              priorityConfig.borderColor
            )}
          >
            <PriorityIconComponent className={cn('h-3.5 w-3.5', priorityConfig.color)} />
            <span className={cn('text-xs font-medium', priorityConfig.color)}>
              {priorityConfig.label}
            </span>
          </motion.div>

          {/* Title */}
          <motion.h2
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-2xl font-bold text-white mb-4 pr-8"
          >
            {notification.title}
          </motion.h2>

          {/* Media - Image */}
          {notification.media_type === 'image' && notification.media_url && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-4 rounded-xl overflow-hidden border border-white/10"
            >
              <img
                src={notification.media_url}
                alt=""
                className="w-full h-auto max-h-64 object-cover"
                loading="lazy"
              />
            </motion.div>
          )}

          {/* Media - Video */}
          {notification.media_type === 'video' && notification.media_url && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-4 rounded-xl overflow-hidden border border-white/10 relative"
            >
              {!isVideoPlaying ? (
                <div
                  className="relative cursor-pointer group"
                  onClick={() => setIsVideoPlaying(true)}
                >
                  {getVideoThumbnail() ? (
                    <img
                      src={getVideoThumbnail()}
                      alt=""
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-black/50" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                    <div
                      className={cn(
                        'w-16 h-16 rounded-full flex items-center justify-center',
                        'bg-mi-cyan/20 backdrop-blur-sm border border-mi-cyan/40',
                        'group-hover:bg-mi-cyan/30 transition-all duration-200'
                      )}
                    >
                      <Play className="w-8 h-8 text-white ml-1" />
                    </div>
                  </div>
                  <p className="absolute bottom-2 left-0 right-0 text-xs text-gray-300 text-center">
                    Click to play video
                  </p>
                </div>
              ) : (
                <video
                  src={notification.media_url}
                  controls
                  autoPlay
                  className="w-full h-auto max-h-64"
                >
                  Your browser does not support the video tag.
                </video>
              )}
            </motion.div>
          )}

          {/* Media - Link preview */}
          {notification.media_type === 'link' && notification.media_url && (
            <motion.a
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              href={notification.media_url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'block mb-4 rounded-xl overflow-hidden border border-white/10',
                'bg-white/5 hover:bg-white/10 transition-colors'
              )}
            >
              {(() => {
                const metadata = notification.media_metadata as {
                  title?: string;
                  description?: string;
                  image_url?: string;
                  domain?: string;
                } | null;
                return (
                  <div className="p-4">
                    {metadata?.image_url && (
                      <img
                        src={metadata.image_url}
                        alt=""
                        className="w-full h-32 object-cover rounded-lg mb-3"
                      />
                    )}
                    <p className="text-white font-medium text-sm">
                      {metadata?.title || 'View Link'}
                    </p>
                    {metadata?.description && (
                      <p className="text-gray-400 text-xs mt-1 line-clamp-2">
                        {metadata.description}
                      </p>
                    )}
                    {metadata?.domain && (
                      <p className="text-mi-cyan text-xs mt-2 flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" />
                        {metadata.domain}
                      </p>
                    )}
                  </div>
                );
              })()}
            </motion.a>
          )}

          {/* Message */}
          <motion.p
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-gray-300 leading-relaxed whitespace-pre-wrap"
          >
            {notification.message}
          </motion.p>
        </div>

        {/* Actions */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="px-6 pb-6 space-y-3"
        >
          {notification.action_url && (
            <Button
              onClick={handleActionClick}
              disabled={isProcessing}
              className={cn(
                'w-full h-12 text-base font-semibold',
                'bg-gradient-to-r from-mi-cyan via-mi-cyan to-cyan-400',
                'hover:from-mi-cyan-dark hover:via-mi-cyan hover:to-cyan-500',
                'text-white shadow-lg shadow-mi-cyan/30',
                'border border-mi-cyan/50',
                'transition-all duration-300 hover:scale-[1.02]',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
              )}
            >
              <span className="flex items-center gap-2">
                {notification.action_label || 'Learn More'}
                <ExternalLink className="h-4 w-4" />
              </span>
            </Button>
          )}

          {notification.require_acknowledgment ? (
            <Button
              onClick={handleAcknowledge}
              disabled={isProcessing}
              className={cn(
                'w-full h-12 text-base font-semibold',
                'bg-gradient-to-r from-mi-gold via-amber-500 to-orange-500',
                'hover:from-amber-600 hover:via-amber-500 hover:to-orange-400',
                'text-white shadow-lg shadow-mi-gold/30',
                'transition-all duration-300',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              <span className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                {isProcessing ? 'Processing...' : 'I Acknowledge'}
              </span>
            </Button>
          ) : (
            notification.dismissible && (
              <Button
                variant="ghost"
                onClick={handleDismiss}
                disabled={isProcessing}
                className={cn(
                  'w-full h-10',
                  'text-gray-400 hover:text-white hover:bg-white/5',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {isProcessing ? 'Dismissing...' : 'Dismiss'}
              </Button>
            )
          )}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

export default BroadcastNotificationModal;
