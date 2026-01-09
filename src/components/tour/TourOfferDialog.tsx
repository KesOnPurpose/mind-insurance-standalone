/**
 * TourOfferDialog Component
 * Hub Tour System
 *
 * Premium glass-morphism dialog shown after user clicks "Begin Day 1".
 * Offers an optional quick tour of the Hub with luxury aesthetic.
 *
 * Features:
 * - Glass-morphism effect matching Protocol Unlock Modal
 * - Gold accents and animated particles
 * - Smooth Framer Motion animations
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Map, ChevronRight, X, Sparkles, Star } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface TourOfferDialogProps {
  isOpen: boolean;
  onStartTour: () => void;
  onSkip: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function TourOfferDialog({
  isOpen,
  onStartTour,
  onSkip,
}: TourOfferDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onSkip}>
      <DialogContent
        className={cn(
          "sm:max-w-md p-0 overflow-hidden",
          // Premium glass-morphism effect
          "bg-mi-navy/80 backdrop-blur-xl",
          "border border-mi-cyan/20",
          "shadow-[0_8px_32px_rgba(5,195,221,0.15),0_0_80px_rgba(5,195,221,0.08)]"
        )}
      >
        {/* Animated gradient border glow */}
        <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
          <div className="absolute inset-[-2px] bg-gradient-to-br from-mi-cyan/30 via-transparent to-mi-gold/30 opacity-50" />
        </div>

        {/* Header with Icon */}
        <div className="relative pt-10 pb-6 px-6 text-center">
          {/* Background gradient mesh */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-20 -left-20 w-60 h-60 rounded-full bg-gradient-to-br from-mi-cyan/20 to-transparent opacity-30 blur-3xl" />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-mi-gold/10 blur-2xl" />
          </div>

          {/* Floating particles animation */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className={cn(
                  "absolute rounded-full",
                  i % 2 === 0 ? "w-1.5 h-1.5 bg-mi-cyan/50" : "w-1 h-1 bg-mi-gold/60"
                )}
                initial={{
                  x: Math.random() * 400,
                  y: Math.random() * 150 + 30,
                  opacity: 0,
                  scale: 0,
                }}
                animate={{
                  y: [null, -30, 0],
                  opacity: [0, 0.8, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 4,
                  delay: i * 0.4,
                  repeat: Infinity,
                  repeatType: 'loop',
                }}
              />
            ))}
          </div>

          {/* Close button - glass style */}
          <button
            onClick={onSkip}
            className={cn(
              "absolute top-4 right-4 p-2 rounded-full z-10",
              "bg-white/5 backdrop-blur-sm border border-white/10",
              "text-gray-400 hover:text-white hover:bg-white/10",
              "transition-all duration-200"
            )}
          >
            <X className="h-4 w-4" />
          </button>

          {/* Map Icon with premium gradient */}
          <motion.div
            className="relative flex justify-center mb-6"
            initial={{ scale: 0.5, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, type: 'spring', bounce: 0.4 }}
          >
            {/* Outer glow ring */}
            <div className="absolute inset-0 m-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-mi-gold/40 to-mi-cyan/40 opacity-40 blur-xl" />
            {/* Icon container */}
            <div className={cn(
              'relative p-4 rounded-2xl',
              'bg-gradient-to-br from-mi-gold via-amber-500 to-orange-500',
              'shadow-2xl shadow-mi-gold/30',
              'border border-white/20'
            )}>
              <Map className="h-10 w-10 text-white drop-shadow-lg" />
            </div>
          </motion.div>

          <DialogHeader className="relative z-10 space-y-3">
            <motion.div
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <DialogTitle className="text-2xl sm:text-3xl font-bold">
                <span className="text-mi-gold">Quick Tour</span>
                <br />
                <span className="text-white">of Your New Home?</span>
              </DialogTitle>
            </motion.div>
            <motion.div
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <DialogDescription className="text-gray-300 text-base leading-relaxed">
                Takes 30 seconds. I'll show you where everything lives so you can navigate like a pro.
              </DialogDescription>
            </motion.div>
          </DialogHeader>
        </div>

        {/* Tour Preview - Glass style */}
        <motion.div
          className="mx-6 mb-6"
          initial={{ y: 25, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className={cn(
            "p-5 rounded-2xl",
            "bg-white/5 backdrop-blur-sm",
            "border border-white/10",
            "shadow-inner shadow-white/5"
          )}>
            {/* Section header */}
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4 text-mi-gold" />
              <p className="text-sm font-medium text-mi-gold">You'll discover:</p>
            </div>

            <ul className="space-y-3">
              {[
                { text: 'Practice Center', desc: 'Your daily PROTECT practices' },
                { text: 'Coverage Center', desc: 'Your MIO protocol' },
                { text: 'My Evidence', desc: 'Save your breakthroughs' },
                { text: 'MIO Chat', desc: 'Your AI coach' },
              ].map((item, i) => (
                <motion.li
                  key={i}
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0",
                    "bg-gradient-to-br from-mi-cyan/20 to-mi-gold/20",
                    "border border-mi-cyan/30"
                  )}>
                    <Star className="w-3 h-3 text-mi-gold fill-mi-gold" />
                  </div>
                  <div>
                    <span className="text-sm text-white font-medium">{item.text}</span>
                    <span className="text-sm text-gray-400"> - {item.desc}</span>
                  </div>
                </motion.li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          className="px-6 pb-6 space-y-3"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          {/* Primary CTA - Premium gradient */}
          <Button
            onClick={onStartTour}
            className={cn(
              'w-full h-14 text-lg font-bold tracking-wide',
              'bg-gradient-to-r from-mi-cyan via-mi-cyan to-cyan-400',
              'hover:from-mi-cyan-dark hover:via-mi-cyan hover:to-cyan-500',
              'text-white',
              'shadow-lg shadow-mi-cyan/30',
              'border border-mi-cyan/50',
              'transition-all duration-300',
              'hover:shadow-xl hover:shadow-mi-cyan/40',
              'hover:scale-[1.02]'
            )}
          >
            <span className="flex items-center gap-2">
              Take the Tour
              <ChevronRight className="h-5 w-5" />
            </span>
          </Button>

          {/* Secondary - Skip */}
          <Button
            variant="ghost"
            onClick={onSkip}
            className={cn(
              "w-full h-11",
              "text-gray-400 hover:text-white",
              "hover:bg-white/5",
              "transition-all duration-200"
            )}
          >
            Skip, I'll Explore Myself
          </Button>
        </motion.div>

        {/* Footer note */}
        <motion.div
          className={cn(
            "px-6 py-4",
            "bg-gradient-to-t from-black/20 to-transparent",
            "border-t border-white/5"
          )}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <p className="text-xs text-gray-500 italic text-center">
            You can always retake this tour from settings.
          </p>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

export default TourOfferDialog;
