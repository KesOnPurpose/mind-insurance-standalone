/**
 * SubPatternUnlockCard
 *
 * CTA card displayed in Coverage Center when user hasn't completed
 * the Sub-Pattern Assessment. Shows locked state until Internal Wiring
 * Assessment is complete, then unlocks to start the deep dive.
 */

import { useNavigate } from 'react-router-dom';
import {
  Target,
  Lock,
  ArrowRight,
  Check,
  AlertTriangle,
  Shield,
  Zap,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SUB_PATTERN_INFO, type SubPatternType, type PrimaryPattern } from '@/services/subPatternAssessmentService';

interface SubPatternUnlockCardProps {
  hasCompletedSubPattern: boolean;
  hasCompletedTemperament: boolean;
  primaryPattern?: PrimaryPattern | null;
  primarySubPattern?: SubPatternType | null;
  secondarySubPattern?: SubPatternType | null;
  isLoading?: boolean;
  className?: string;
}

const PATTERN_DISPLAY: Record<
  PrimaryPattern,
  { name: string; icon: typeof Target; gradient: string }
> = {
  past_prison: {
    name: 'Past Prison',
    icon: Shield,
    gradient: 'from-red-500 to-orange-500',
  },
  success_sabotage: {
    name: 'Success Sabotage',
    icon: Zap,
    gradient: 'from-yellow-500 to-amber-500',
  },
  compass_crisis: {
    name: 'Compass Crisis',
    icon: Target,
    gradient: 'from-blue-500 to-cyan-500',
  },
};

export function SubPatternUnlockCard({
  hasCompletedSubPattern,
  hasCompletedTemperament,
  primaryPattern,
  primarySubPattern,
  secondarySubPattern,
  isLoading,
  className,
}: SubPatternUnlockCardProps) {
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

  // Completed state - show sub-pattern results
  if (hasCompletedSubPattern && primarySubPattern) {
    const primaryInfo = SUB_PATTERN_INFO[primarySubPattern];
    const secondaryInfo = secondarySubPattern ? SUB_PATTERN_INFO[secondarySubPattern] : null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className={cn('bg-mi-navy-light border-mi-cyan/30 overflow-hidden', className)}>
          <div className="h-1 w-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500" />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-red-500 to-orange-500">
                  <AlertTriangle className="h-4 w-4 text-white" />
                </div>
                <CardTitle className="text-lg text-white">Your Sub-Patterns</CardTitle>
              </div>
              <Badge
                variant="outline"
                className="bg-green-500/10 text-green-400 border-green-500/30 text-xs"
              >
                <Check className="h-3 w-3 mr-1" />
                Identified
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Primary Risk */}
            <div className="p-3 bg-red-900/20 rounded-lg border border-red-500/30">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <span className="text-xs font-medium text-red-400">PRIMARY RISK</span>
              </div>
              <p className="font-semibold text-white">{primaryInfo.name}</p>
              <p className="text-sm text-gray-400 mt-0.5">{primaryInfo.shortDescription}</p>
            </div>

            {/* Secondary Risk */}
            {secondaryInfo && (
              <div className="p-3 bg-yellow-900/10 rounded-lg border border-yellow-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="h-4 w-4 text-yellow-400" />
                  <span className="text-xs font-medium text-yellow-400">VULNERABILITY ZONE</span>
                </div>
                <p className="font-medium text-white">{secondaryInfo.name}</p>
                <p className="text-sm text-gray-400 mt-0.5">{secondaryInfo.shortDescription}</p>
              </div>
            )}

            <p className="text-xs text-gray-500 text-center pt-1">
              MIO protocols now target your specific sub-patterns
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Locked state - need to complete temperament first
  if (!hasCompletedTemperament) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className={cn('bg-mi-navy-light/50 border-gray-700 opacity-75', className)}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gray-700">
                  <Lock className="h-4 w-4 text-gray-500" />
                </div>
                <CardTitle className="text-lg text-gray-500">Sub-Pattern Deep Dive</CardTitle>
              </div>
              <Badge variant="outline" className="bg-gray-700/50 text-gray-500 border-gray-600 text-xs">
                Week 3
              </Badge>
            </div>
            <CardDescription className="text-gray-600">
              Complete your Internal Wiring Assessment to unlock
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button disabled className="w-full bg-gray-700 text-gray-500 cursor-not-allowed">
              <Lock className="h-4 w-4 mr-2" />
              Locked
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Unlocked state - ready to start
  const patternDisplay = primaryPattern ? PATTERN_DISPLAY[primaryPattern] : null;
  const PatternIcon = patternDisplay?.icon || Target;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={cn(
          'bg-gradient-to-br from-mi-navy-light to-red-900/20 border-red-500/30',
          'hover:border-red-500/50 transition-all cursor-pointer group',
          className
        )}
        onClick={() => navigate('/mind-insurance/sub-pattern-assessment')}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-red-500 to-orange-500">
                <Target className="h-4 w-4 text-white" />
              </div>
              <CardTitle className="text-lg text-white">Deep Dive: Your Pattern's Root</CardTitle>
            </div>
            <Badge
              variant="outline"
              className="bg-red-500/10 text-red-400 border-red-500/30 text-xs"
            >
              Week 3
            </Badge>
          </div>
          <CardDescription className="text-gray-400 mt-1">
            Identify the specific sub-patterns attacking your {patternDisplay?.name || 'foundation'}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="space-y-3">
            {/* Pattern indicator */}
            {patternDisplay && (
              <div className="flex items-center gap-2 p-2 bg-mi-navy/50 rounded-lg border border-gray-700/50">
                <div className={cn('p-1.5 rounded-full bg-gradient-to-br', patternDisplay.gradient)}>
                  <PatternIcon className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white">{patternDisplay.name}</p>
                  <p className="text-xs text-gray-500">Your primary collision pattern</p>
                </div>
              </div>
            )}

            {/* Risk types preview */}
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-red-900/20 border border-red-500/20">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <span className="text-[10px] text-red-400">Active Risks</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-yellow-900/20 border border-yellow-500/20">
                <Shield className="h-4 w-4 text-yellow-400" />
                <span className="text-[10px] text-yellow-400">Vulnerabilities</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-green-900/20 border border-green-500/20">
                <Check className="h-4 w-4 text-green-400" />
                <span className="text-[10px] text-green-400">Strengths</span>
              </div>
            </div>

            {/* CTA Button */}
            <Button
              className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white group-hover:shadow-lg group-hover:shadow-red-500/20 transition-all"
            >
              Start Deep Dive
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>

            <p className="text-xs text-gray-500 text-center">
              9-11 questions • 5-7 minutes • Precision protocol targeting
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default SubPatternUnlockCard;
