/**
 * WiringDetailsSheet
 *
 * Bottom sheet modal displaying Internal Wiring (Temperament) assessment results.
 * Opened when users click on completed temperament card in Coverage Center.
 * Part of P6.5 Identity Avatar User Journey Redesign.
 *
 * MI Theme Colors:
 * - mi-cyan: #05c3dd (wisdom, connection)
 * - mi-gold: #fac832 (action, structure)
 * - mi-navy: #0A1628 (background)
 * - mi-navy-light: #132337 (card background)
 */

import { useNavigate } from 'react-router-dom';
import { Flame, BookOpen, Heart, Wrench, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

type WiringType = 'warrior' | 'sage' | 'connector' | 'builder';

interface WiringDetailsSheetProps {
  /** Controls sheet visibility */
  open: boolean;
  /** Callback when sheet open state changes */
  onOpenChange: (open: boolean) => void;
  /** User's wiring/temperament data */
  wiring: {
    primary: string;
    displayName: string;
    secondary?: string;
  } | null;
  /** Whether all 3 avatar assessments are complete (enables View Full Avatar CTA) */
  avatarComplete: boolean;
}

// ============================================================================
// WIRING TYPE CONFIGURATION
// ============================================================================

/**
 * Mind Insurance themed configuration for each wiring type.
 * Uses MI palette: mi-cyan (#05c3dd), mi-gold (#fac832), mi-navy (#0A1628)
 */
const WIRING_INFO: Record<
  WiringType,
  {
    icon: typeof Flame;
    color: string;
    bgColor: string;
    gradientFrom: string;
    gradientTo: string;
    name: string;
    description: string;
    protocolStyle: string;
  }
> = {
  warrior: {
    icon: Flame,
    color: 'text-mi-gold',
    bgColor: 'bg-mi-gold/20',
    gradientFrom: 'from-mi-gold',
    gradientTo: 'to-amber-500',
    name: 'The Warrior',
    description:
      "You process emotions and stress through action. Physical movement helps you think clearly. You're driven to conquer challenges head-on and prefer direct approaches to problems. When others are still planning, you're already three steps down the road learning from real experience.",
    protocolStyle:
      'Your protocols emphasize action-first approaches, physical grounding techniques, and quick decision frameworks. Movement-based rituals, short intense bursts of practice, and immediate application of insights work best for your wiring.',
  },
  sage: {
    icon: BookOpen,
    color: 'text-mi-cyan',
    bgColor: 'bg-mi-cyan/20',
    gradientFrom: 'from-mi-cyan',
    gradientTo: 'to-cyan-400',
    name: 'The Sage',
    description:
      "You need solitude and reflection to process experiences. Deep understanding comes before action. You see what others miss through your capacity for contemplation. You don't just consume information - you metabolize it into wisdom.",
    protocolStyle:
      'Your protocols include reflective journaling, deep-dive analysis, and meaning-making frameworks. Extended quiet time, contemplative practices, and reading-based approaches honor your natural processing style.',
  },
  connector: {
    icon: Heart,
    color: 'text-mi-cyan',
    bgColor: 'bg-mi-cyan/20',
    gradientFrom: 'from-mi-cyan',
    gradientTo: 'to-teal-400',
    name: 'The Connector',
    description:
      "You process through dialogue and relationships. Collaboration energizes you. You create the glue that holds communities together through your relational intelligence. Your vulnerability in sharing gives others permission to be real.",
    protocolStyle:
      'Your protocols leverage accountability partnerships, collaborative practices, and relationship-based check-ins. Verbal processing, community support, and shared experiences are woven throughout your journey.',
  },
  builder: {
    icon: Wrench,
    color: 'text-mi-gold',
    bgColor: 'bg-mi-gold/20',
    gradientFrom: 'from-mi-gold',
    gradientTo: 'to-mi-cyan',
    name: 'The Builder',
    description:
      "You need structure and systems to feel grounded. Creating order from chaos is your superpower. Where others see mess, you see patterns. You don't just do things - you build frameworks that multiply impact.",
    protocolStyle:
      'Your protocols feature structured routines, systematic approaches, and progress-tracking frameworks. Clear milestones, measurable outcomes, and organized workflows help you thrive.',
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function WiringDetailsSheet({
  open,
  onOpenChange,
  wiring,
  avatarComplete,
}: WiringDetailsSheetProps) {
  const navigate = useNavigate();

  // Early return if no wiring data
  if (!wiring) return null;

  // Get primary wiring configuration
  const primaryType = wiring.primary.toLowerCase() as WiringType;
  const primaryInfo = WIRING_INFO[primaryType];
  const PrimaryIcon = primaryInfo?.icon || Sparkles;

  // Get secondary wiring configuration (if available)
  const secondaryType = wiring.secondary?.toLowerCase() as WiringType | undefined;
  const secondaryInfo = secondaryType ? WIRING_INFO[secondaryType] : null;
  const SecondaryIcon = secondaryInfo?.icon;

  // Handle navigation to full avatar view
  const handleViewAvatar = () => {
    onOpenChange(false);
    navigate('/mind-insurance/avatar');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={cn(
          'bg-mi-navy border-t border-mi-cyan/30',
          'rounded-t-2xl max-h-[85vh] overflow-y-auto',
          'px-6 pb-8 pt-0'
        )}
      >
        {/* Gradient accent bar at top */}
        <div
          className={cn(
            'absolute top-0 left-0 right-0 h-1 rounded-t-2xl',
            'bg-gradient-to-r',
            primaryInfo?.gradientFrom || 'from-mi-cyan',
            primaryInfo?.gradientTo || 'to-mi-gold'
          )}
        />

        {/* Drag handle indicator */}
        <div className="flex justify-center pt-4 pb-4">
          <div className="w-10 h-1 rounded-full bg-gray-600" />
        </div>

        <SheetHeader className="text-left pb-4">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className={cn(
                'p-3 rounded-xl bg-gradient-to-br',
                primaryInfo?.gradientFrom || 'from-mi-cyan',
                primaryInfo?.gradientTo || 'to-mi-gold'
              )}
            >
              <PrimaryIcon className="h-7 w-7 text-white" />
            </motion.div>
            <div>
              <SheetTitle className="text-2xl font-bold text-white">
                {primaryInfo?.name || wiring.displayName}
              </SheetTitle>
              <SheetDescription className="text-gray-400 text-sm">
                Your Internal Wiring Type
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-5">
          {/* Primary wiring description section */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="p-4 rounded-xl bg-mi-navy-light border border-mi-cyan/20"
          >
            <h3
              className={cn(
                'font-semibold mb-2 flex items-center gap-2',
                primaryInfo?.color || 'text-mi-cyan'
              )}
            >
              <Sparkles className="h-4 w-4" />
              About Your Wiring
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              {primaryInfo?.description ||
                'Your unique internal wiring pattern determines how you process information and respond to challenges.'}
            </p>
          </motion.div>

          {/* Protocol delivery section */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="p-4 rounded-xl bg-mi-navy-light border border-mi-gold/20"
          >
            <h3 className="font-semibold mb-2 text-mi-gold flex items-center gap-2">
              <ArrowRight className="h-4 w-4" />
              How This Shapes Your Protocols
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              {primaryInfo?.protocolStyle ||
                'Your protocols are customized to match your natural processing style.'}
            </p>
          </motion.div>

          {/* Secondary wiring section (if available) */}
          {secondaryInfo && SecondaryIcon && secondaryType && (
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              className="p-4 rounded-xl bg-mi-navy-light border border-mi-cyan/10"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={cn('p-1.5 rounded-lg', secondaryInfo.bgColor)}>
                  <SecondaryIcon className={cn('h-4 w-4', secondaryInfo.color)} />
                </div>
                <h3 className="font-semibold text-gray-300">
                  Secondary Influence: {secondaryInfo.name}
                </h3>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                You also draw from {secondaryInfo.name.toLowerCase()} tendencies, which adds depth
                and flexibility to your processing style. This secondary influence means your
                protocols can adapt to situations that call for{' '}
                {secondaryType === 'warrior'
                  ? 'action and movement'
                  : secondaryType === 'sage'
                    ? 'reflection and analysis'
                    : secondaryType === 'connector'
                      ? 'collaboration and dialogue'
                      : 'structure and systems'}
                .
              </p>
            </motion.div>
          )}

          {/* View Full Avatar CTA - only show when all 3 assessments complete */}
          {avatarComplete && (
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.3 }}
              className="pt-2"
            >
              <Button
                onClick={handleViewAvatar}
                className={cn(
                  'w-full py-6 text-lg font-semibold',
                  'bg-gradient-to-r from-mi-cyan to-mi-gold',
                  'hover:opacity-90 transition-opacity',
                  'text-mi-navy'
                )}
              >
                View Full Identity Avatar
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <p className="text-xs text-gray-500 text-center mt-2">
                See your complete Avatar profile with all assessment insights
              </p>
            </motion.div>
          )}

          {/* Info text when avatar not complete */}
          {!avatarComplete && (
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.3 }}
              className="text-xs text-gray-500 text-center pt-2"
            >
              Complete all avatar assessments to unlock your full Identity Avatar view
            </motion.p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Default export for compatibility (named export already via `export function`)
export default WiringDetailsSheet;
