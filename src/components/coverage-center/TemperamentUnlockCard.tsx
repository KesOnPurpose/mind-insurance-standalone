/**
 * TemperamentUnlockCard (Internal Wiring Assessment)
 *
 * CTA card displayed in Coverage Center when user hasn't completed
 * the Internal Wiring Assessment. Shows locked state until Identity
 * Collision is complete, then unlocks to start the assessment.
 */

import { useNavigate } from 'react-router-dom';
import { Sparkles, Lock, ArrowRight, Check, Flame, BookOpen, Heart, Wrench, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { TemperamentType } from '@/services/temperamentAssessmentService';

interface TemperamentUnlockCardProps {
  hasCompletedTemperament: boolean;
  temperament?: TemperamentType | null;
  isLoading?: boolean;
  className?: string;
  onCompletedClick?: () => void;
}

// Mind Insurance themed colors for each wiring type
// Uses actual MI palette: mi-cyan (#05c3dd), mi-gold (#fac832), mi-navy (#0A1628)
const TEMPERAMENT_CONFIG: Record<
  TemperamentType,
  {
    name: string;
    icon: typeof Flame;
    description: string;
    gradient: string;
    badge: string;
    iconBg: string;
  }
> = {
  warrior: {
    name: 'Warrior',
    icon: Flame,
    description: 'Action-oriented, physically processes emotions, driven to conquer challenges.',
    gradient: 'from-mi-gold to-amber-500', // MI gold - action energy
    badge: 'bg-mi-gold/20 text-mi-gold border-mi-gold/30',
    iconBg: 'bg-mi-gold/20',
  },
  sage: {
    name: 'Sage',
    icon: BookOpen,
    description: 'Reflective, needs solitude to process, seeks deep understanding.',
    gradient: 'from-mi-cyan to-cyan-400', // MI cyan - wisdom/depth
    badge: 'bg-mi-cyan/20 text-mi-cyan border-mi-cyan/30',
    iconBg: 'bg-mi-cyan/20',
  },
  connector: {
    name: 'Connector',
    icon: Heart,
    description: 'Relationship-focused, processes through dialogue, thrives on collaboration.',
    gradient: 'from-mi-cyan to-teal-400', // MI cyan variant - connection
    badge: 'bg-mi-cyan/20 text-mi-cyan border-mi-cyan/30',
    iconBg: 'bg-mi-cyan/20',
  },
  builder: {
    name: 'Builder',
    icon: Wrench,
    description: 'Systems-oriented, needs structure, creates order from chaos.',
    gradient: 'from-mi-gold to-mi-cyan', // MI signature blend - structure
    badge: 'bg-mi-gold/20 text-mi-gold border-mi-gold/30',
    iconBg: 'bg-mi-gold/20',
  },
};

export function TemperamentUnlockCard({
  hasCompletedTemperament,
  temperament,
  isLoading,
  className,
  onCompletedClick,
}: TemperamentUnlockCardProps) {
  const navigate = useNavigate();

  // Loading state
  if (isLoading) {
    return (
      <Card className={cn('bg-mi-navy-light border-mi-cyan/20 animate-pulse', className)}>
        <CardHeader className="pb-2">
          <div className="h-5 w-48 bg-gray-700 rounded" />
          <div className="h-4 w-64 bg-gray-700 rounded mt-2" />
        </CardHeader>
        <CardContent>
          <div className="h-10 w-full bg-gray-700 rounded mt-2" />
        </CardContent>
      </Card>
    );
  }

  // Completed state - show temperament result
  if (hasCompletedTemperament && temperament) {
    const config = TEMPERAMENT_CONFIG[temperament];
    const Icon = config.icon;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card
          className={cn(
            'bg-mi-navy-light border-mi-cyan/30 overflow-hidden',
            onCompletedClick && 'cursor-pointer hover:border-mi-cyan/50 transition-colors',
            className
          )}
          onClick={onCompletedClick}
        >
          <div className={cn('h-1 w-full bg-gradient-to-r', config.gradient)} />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'p-1.5 rounded-lg bg-gradient-to-br',
                    config.gradient
                  )}
                >
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <CardTitle className="text-lg text-white">Your Internal Wiring</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn('text-xs', config.badge)}>
                  <Check className="h-3 w-3 mr-1" />
                  Discovered
                </Badge>
                {onCompletedClick && (
                  <ChevronRight className="h-5 w-5 text-gray-500" />
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 p-3 bg-mi-navy rounded-lg border border-mi-cyan/10">
              <div
                className={cn(
                  'p-3 rounded-full bg-gradient-to-br',
                  config.gradient
                )}
              >
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white text-lg">The {config.name}</p>
                <p className="text-sm text-gray-400 mt-0.5">{config.description}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">
              Your internal wiring shapes how your protocols are delivered
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Not completed - show unlock CTA
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={cn(
          'bg-mi-navy-light border-mi-cyan/30',
          'hover:border-mi-cyan/50 transition-all cursor-pointer group',
          className
        )}
        onClick={() => navigate('/mind-insurance/temperament-assessment')}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-mi-cyan/20">
                <Sparkles className="h-4 w-4 text-mi-cyan" />
              </div>
              <CardTitle className="text-lg text-white">Unlock Your Internal Wiring</CardTitle>
            </div>
            <Badge
              variant="outline"
              className="bg-mi-cyan/10 text-mi-cyan border-mi-cyan/30 text-xs"
            >
              Week 2
            </Badge>
          </div>
          <CardDescription className="text-gray-400 mt-1">
            Discover how you naturally process stress and make decisions
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="space-y-3">
            {/* Wiring type preview */}
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(TEMPERAMENT_CONFIG) as TemperamentType[]).map((temp) => {
                const config = TEMPERAMENT_CONFIG[temp];
                const Icon = config.icon;
                return (
                  <div
                    key={temp}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-mi-navy border border-mi-cyan/10"
                  >
                    <div className={cn('p-1.5 rounded-full', config.iconBg)}>
                      <Icon className="h-3.5 w-3.5 text-mi-cyan" />
                    </div>
                    <span className="text-xs text-gray-400 capitalize">{temp}</span>
                  </div>
                );
              })}
            </div>

            {/* CTA Button - MI cyan/gold gradient */}
            <Button
              className="w-full bg-mi-cyan hover:bg-mi-cyan-dark text-mi-navy font-semibold group-hover:shadow-lg group-hover:shadow-mi-cyan/20 transition-all"
            >
              Discover Your Internal Wiring
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>

            <p className="text-xs text-gray-500 text-center">
              8 questions • 3 minutes • Shapes your protocol delivery
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default TemperamentUnlockCard;
