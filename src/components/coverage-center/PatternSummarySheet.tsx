import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LockOpen, Target, Compass, RotateCcw, User } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

type PatternKey = 'past_prison' | 'success_sabotage' | 'compass_crisis';

interface PatternInfo {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
  progressColor: string;
  description: string;
}

interface PatternSummarySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pattern: {
    name: string;
    displayName: string;
    confidence?: number;
  } | null;
  patternScores?: {
    past_prison: number;
    success_sabotage: number;
    compass_crisis: number;
  };
  avatarComplete: boolean;
}

// =============================================================================
// CONSTANTS - MI Theme Colors + Pattern Configuration
// =============================================================================

// MI Theme Colors
const MI_COLORS = {
  cyan: '#05c3dd',
  navy: '#0A1628',
  gold: '#fac832',
} as const;

// Pattern-specific styling and content
const PATTERN_INFO: Record<PatternKey, PatternInfo> = {
  past_prison: {
    icon: LockOpen,
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/20',
    borderColor: 'border-rose-500/30',
    progressColor: 'bg-rose-500',
    description:
      'Your identity is anchored in past experiences, creating invisible barriers that limit your ability to see new possibilities and embrace change.',
  },
  success_sabotage: {
    icon: Target,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500/30',
    progressColor: 'bg-amber-500',
    description:
      'You unconsciously undermine your success when you get close to breakthrough moments, pulling back just as achievement comes within reach.',
  },
  compass_crisis: {
    icon: Compass,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
    borderColor: 'border-cyan-500/30',
    progressColor: 'bg-cyan-500',
    description:
      'You struggle with direction and purpose, feeling pulled in multiple directions without a clear sense of your authentic path forward.',
  },
};

// Pattern display names for progress bars
const PATTERN_LABELS: Record<PatternKey, string> = {
  past_prison: 'Past Prison',
  success_sabotage: 'Success Sabotage',
  compass_crisis: 'Compass Crisis',
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Formats a snake_case pattern name to Title Case
 */
const formatPatternName = (name: string): string => {
  return name
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Validates if a string is a valid PatternKey
 */
const isValidPatternKey = (key: string): key is PatternKey => {
  return key in PATTERN_INFO;
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const PatternSummarySheet: React.FC<PatternSummarySheetProps> = ({
  open,
  onOpenChange,
  pattern,
  patternScores,
  avatarComplete,
}) => {
  const navigate = useNavigate();

  // Early return if no pattern data
  if (!pattern) return null;

  // Validate and get pattern info
  const patternKey = pattern.name as PatternKey;
  if (!isValidPatternKey(patternKey)) {
    console.warn(`Invalid pattern key: ${pattern.name}`);
    return null;
  }

  const info = PATTERN_INFO[patternKey];
  const IconComponent = info.icon;

  // ==========================================================================
  // EVENT HANDLERS
  // ==========================================================================

  const handleRetakeAssessment = () => {
    onOpenChange(false);
    navigate('/mind-insurance/assessment');
  };

  const handleViewAvatar = () => {
    onOpenChange(false);
    navigate('/mind-insurance/avatar');
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={cn(
          'rounded-t-3xl border-t-2',
          'bg-gradient-to-b from-slate-900 to-slate-950',
          'border-slate-700/50',
          'max-h-[85vh] overflow-y-auto'
        )}
        style={{ borderTopColor: MI_COLORS.cyan }}
      >
        <div className="mx-auto max-w-lg pb-8">
          {/* ================================================================ */}
          {/* HEADER SECTION */}
          {/* ================================================================ */}
          <SheetHeader className="text-center pb-6">
            {/* Pattern Icon */}
            <div className="flex justify-center mb-4">
              <div
                className={cn(
                  'w-20 h-20 rounded-full flex items-center justify-center',
                  'border-2',
                  info.bgColor,
                  info.borderColor
                )}
              >
                <IconComponent className={cn('w-10 h-10', info.color)} />
              </div>
            </div>

            {/* Pattern Title */}
            <SheetTitle className="text-2xl font-bold text-white">
              {pattern.displayName || formatPatternName(pattern.name)}
            </SheetTitle>

            {/* Confidence Badge */}
            {pattern.confidence !== undefined && (
              <div className="flex justify-center mt-2">
                <span
                  className="px-3 py-1 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: `${MI_COLORS.gold}20`,
                    color: MI_COLORS.gold,
                  }}
                >
                  {pattern.confidence}% Confidence
                </span>
              </div>
            )}

            {/* Description */}
            <SheetDescription className="text-slate-300 mt-4 text-base leading-relaxed">
              {info.description}
            </SheetDescription>
          </SheetHeader>

          {/* ================================================================ */}
          {/* PATTERN SCORES BREAKDOWN */}
          {/* ================================================================ */}
          {patternScores && (
            <div className="space-y-4 mt-6 px-2">
              <h3
                className="text-sm font-semibold uppercase tracking-wider mb-4"
                style={{ color: MI_COLORS.cyan }}
              >
                Pattern Breakdown
              </h3>

              {(Object.keys(PATTERN_INFO) as PatternKey[]).map((key) => {
                const score = patternScores[key] || 0;
                const patternInfo = PATTERN_INFO[key];
                const isCurrentPattern = key === patternKey;

                return (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span
                        className={cn(
                          'text-sm font-medium',
                          isCurrentPattern ? 'text-white' : 'text-slate-400'
                        )}
                      >
                        {PATTERN_LABELS[key]}
                        {isCurrentPattern && (
                          <span
                            className="ml-2 text-xs"
                            style={{ color: MI_COLORS.gold }}
                          >
                            (Primary)
                          </span>
                        )}
                      </span>
                      <span
                        className={cn(
                          'text-sm font-bold',
                          isCurrentPattern ? patternInfo.color : 'text-slate-500'
                        )}
                      >
                        {score}%
                      </span>
                    </div>
                    <div className="relative">
                      <Progress
                        value={score}
                        className={cn(
                          'h-2 bg-slate-800',
                          isCurrentPattern ? '' : 'opacity-60'
                        )}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ================================================================ */}
          {/* CTA BUTTONS */}
          {/* ================================================================ */}
          <div className="mt-8 space-y-3 px-2">
            {/* Retake Assessment - Always Visible */}
            <Button
              onClick={handleRetakeAssessment}
              variant="outline"
              className={cn(
                'w-full h-12 text-base font-semibold',
                'border-slate-600 bg-slate-800/50',
                'hover:bg-slate-700 hover:border-slate-500',
                'text-white'
              )}
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Retake Assessment
            </Button>

            {/* View Full Avatar - Conditional */}
            {avatarComplete && (
              <Button
                onClick={handleViewAvatar}
                className="w-full h-12 text-base font-semibold"
                style={{
                  backgroundColor: MI_COLORS.cyan,
                  color: MI_COLORS.navy,
                }}
              >
                <User className="w-5 h-5 mr-2" />
                View Full Avatar
              </Button>
            )}
          </div>

          {/* ================================================================ */}
          {/* FOOTER NOTE */}
          {/* ================================================================ */}
          <p className="text-center text-xs text-slate-500 mt-6 px-4">
            Your pattern analysis helps personalize your Mind Insurance coverage
            and daily practices.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// Named export for flexibility
export { PatternSummarySheet };

// Default export for compatibility
export default PatternSummarySheet;
