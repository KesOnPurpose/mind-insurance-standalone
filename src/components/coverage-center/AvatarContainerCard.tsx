/**
 * AvatarContainerCard
 *
 * Unified container that houses the 3 avatar assessments:
 * 1. Identity Collision
 * 2. Internal Wiring
 * 3. Sub-Pattern
 *
 * Features:
 * - Collapsible assessment list (collapsed when all 3 complete)
 * - Progress indicator showing X of 3 complete
 * - "Avatar Unlocked!" celebration when all complete
 * - View Avatar CTA button
 *
 * Part of P6.5 Identity Avatar User Journey Redesign.
 *
 * MI Theme Colors:
 * - mi-cyan: #05c3dd (wisdom, connection)
 * - mi-gold: #fac832 (action, structure)
 * - mi-navy: #0A1628 (background)
 * - mi-navy-light: #132337 (card background)
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Brain,
  Target,
  Lock,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

type AssessmentStatus = 'locked' | 'available' | 'complete';

interface AssessmentItemData {
  id: string;
  title: string;
  icon: typeof Zap;
  status: AssessmentStatus;
  result?: string;
  confidence?: number;
  week: number;
  lockReason?: string;
}

interface AvatarContainerCardProps {
  /** Identity Collision assessment status */
  collisionStatus: {
    hasPattern: boolean;
    primaryPattern?: string;
    confidence?: number;
  } | null;
  /** Internal Wiring assessment status */
  temperamentStatus: {
    hasCompleted: boolean;
    result?: { primary: string; secondary?: string };
  } | null;
  /** Sub-Pattern assessment status */
  subPatternStatus: {
    hasCompleted: boolean;
    result?: { primarySubPattern?: string };
  } | null;
  /** Loading state */
  isLoading: boolean;
  /** Callback when Identity Collision clicked (completed) */
  onCollisionClick: () => void;
  /** Callback when Internal Wiring clicked (completed) */
  onWiringClick: () => void;
  /** Callback when Sub-Pattern clicked (completed) */
  onSubPatternClick: () => void;
}

// ============================================================================
// DISPLAY MAPPINGS
// ============================================================================

const PATTERN_DISPLAY: Record<string, string> = {
  past_prison: 'Past Prison',
  success_sabotage: 'Success Sabotage',
  compass_crisis: 'Compass Crisis',
};

const TEMPERAMENT_DISPLAY: Record<string, string> = {
  warrior: 'The Warrior',
  sage: 'The Sage',
  connector: 'The Connector',
  builder: 'The Builder',
};

const SUB_PATTERN_DISPLAY: Record<string, string> = {
  identity_ceiling: 'Identity Ceiling',
  impostor_syndrome: 'Impostor Syndrome',
  self_sabotage: 'Self-Sabotage',
  relationship_erosion: 'Relationship Erosion',
  burnout_depletion: 'Burnout Depletion',
  decision_fatigue: 'Decision Fatigue',
  execution_breakdown: 'Execution Breakdown',
  comparison_catastrophe: 'Comparison Catastrophe',
  motivation_collapse: 'Motivation Collapse',
  performance_liability: 'Performance Liability',
};

// ============================================================================
// COMPONENT
// ============================================================================

export function AvatarContainerCard({
  collisionStatus,
  temperamentStatus,
  subPatternStatus,
  isLoading,
  onCollisionClick,
  onWiringClick,
  onSubPatternClick,
}: AvatarContainerCardProps) {
  const navigate = useNavigate();

  // Calculate completion states
  const hasCollision = collisionStatus?.hasPattern || false;
  const hasWiring = temperamentStatus?.hasCompleted || false;
  const hasSubPattern = subPatternStatus?.hasCompleted || false;

  const completedCount = [hasCollision, hasWiring, hasSubPattern].filter(Boolean).length;
  const totalCount = 3;
  const progressPercent = Math.round((completedCount / totalCount) * 100);
  const isAvatarComplete = completedCount === 3;

  // Collapsible state - collapsed by default when avatar is complete
  const [isOpen, setIsOpen] = useState(!isAvatarComplete);

  // Update collapse state when avatar becomes complete
  useEffect(() => {
    if (isAvatarComplete) {
      setIsOpen(false);
    }
  }, [isAvatarComplete]);

  // Build assessment items data
  const assessments: AssessmentItemData[] = [
    {
      id: 'identity_collision',
      title: 'Identity Collision',
      icon: Zap,
      status: hasCollision ? 'complete' : 'available',
      result: hasCollision && collisionStatus?.primaryPattern
        ? PATTERN_DISPLAY[collisionStatus.primaryPattern] || collisionStatus.primaryPattern
        : undefined,
      confidence: collisionStatus?.confidence,
      week: 1,
    },
    {
      id: 'internal_wiring',
      title: 'Internal Wiring',
      icon: Brain,
      status: hasWiring ? 'complete' : hasCollision ? 'available' : 'locked',
      result: hasWiring && temperamentStatus?.result?.primary
        ? TEMPERAMENT_DISPLAY[temperamentStatus.result.primary] || temperamentStatus.result.primary
        : undefined,
      week: 2,
      lockReason: !hasCollision ? 'Complete Identity Collision first' : undefined,
    },
    {
      id: 'sub_pattern',
      title: 'Sub-Pattern',
      icon: Target,
      status: hasSubPattern ? 'complete' : hasWiring ? 'available' : 'locked',
      result: hasSubPattern && subPatternStatus?.result?.primarySubPattern
        ? SUB_PATTERN_DISPLAY[subPatternStatus.result.primarySubPattern] || subPatternStatus.result.primarySubPattern
        : undefined,
      week: 3,
      lockReason: !hasWiring ? 'Complete Internal Wiring first' : undefined,
    },
  ];

  // Handle assessment click
  const handleAssessmentClick = (assessment: AssessmentItemData) => {
    if (assessment.status === 'locked') return;

    if (assessment.status === 'complete') {
      switch (assessment.id) {
        case 'identity_collision':
          onCollisionClick();
          break;
        case 'internal_wiring':
          onWiringClick();
          break;
        case 'sub_pattern':
          onSubPatternClick();
          break;
      }
    } else {
      // Navigate to assessment
      switch (assessment.id) {
        case 'identity_collision':
          navigate('/mind-insurance/assessment');
          break;
        case 'internal_wiring':
          navigate('/mind-insurance/internal-wiring');
          break;
        case 'sub_pattern':
          navigate('/mind-insurance/sub-pattern');
          break;
      }
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-mi-navy-light border-mi-cyan/20 animate-pulse">
        <CardHeader className="pb-4">
          <div className="h-6 bg-gray-700 rounded w-1/3" />
          <div className="h-4 bg-gray-700 rounded w-1/2 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-gray-700/50 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-mi-navy-light border-mi-cyan/30 overflow-hidden">
        {/* Top gradient accent */}
        <div className="h-1 bg-gradient-to-r from-mi-cyan via-mi-gold/50 to-mi-cyan" />

        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          {/* Header */}
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'p-2.5 rounded-xl',
                  isAvatarComplete
                    ? 'bg-gradient-to-br from-mi-cyan/30 to-mi-gold/30 border border-mi-cyan/40'
                    : 'bg-mi-cyan/10 border border-mi-cyan/20'
                )}>
                  <span className="text-2xl">🎭</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">
                      Your Identity Avatar
                    </h3>
                    {isAvatarComplete && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', bounce: 0.5 }}
                      >
                        <Badge className="bg-mi-gold/20 text-mi-gold border-mi-gold/30 text-xs">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Unlocked!
                        </Badge>
                      </motion.div>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {isAvatarComplete
                      ? 'Your complete psychological fingerprint is ready'
                      : `${completedCount} of ${totalCount} assessments complete`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Progress indicator */}
                <div className="flex items-center gap-2">
                  <Progress
                    value={progressPercent}
                    className="h-2 w-16 bg-gray-700"
                    indicatorClassName="bg-gradient-to-r from-mi-cyan to-mi-gold"
                  />
                  <span className="text-sm font-medium text-mi-cyan">
                    {progressPercent}%
                  </span>
                </div>

                {/* Collapse toggle */}
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-mi-cyan/10"
                  >
                    {isOpen ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>

            {/* View Avatar CTA - only when complete */}
            {isAvatarComplete && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3"
              >
                <Button
                  onClick={() => navigate('/mind-insurance/avatar')}
                  className="w-full bg-gradient-to-r from-mi-cyan to-mi-gold hover:opacity-90 text-mi-navy font-semibold py-5"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  View Your Identity Avatar
                </Button>
              </motion.div>
            )}
          </CardHeader>

          {/* Collapsible Assessment List */}
          <CollapsibleContent>
            <CardContent className="pt-0 pb-4">
              <div className="space-y-2">
                <AnimatePresence>
                  {assessments.map((assessment, index) => (
                    <AssessmentItem
                      key={assessment.id}
                      assessment={assessment}
                      onClick={() => handleAssessmentClick(assessment)}
                      index={index}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </motion.div>
  );
}

// ============================================================================
// ASSESSMENT ITEM COMPONENT
// ============================================================================

interface AssessmentItemProps {
  assessment: AssessmentItemData;
  onClick: () => void;
  index: number;
}

function AssessmentItem({ assessment, onClick, index }: AssessmentItemProps) {
  const Icon = assessment.icon;
  const isLocked = assessment.status === 'locked';
  const isComplete = assessment.status === 'complete';
  const isAvailable = assessment.status === 'available';

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className={cn(
        'flex items-center justify-between p-3 rounded-lg transition-all',
        // Complete state
        isComplete && 'border-l-2 border-mi-cyan bg-mi-cyan/5 cursor-pointer hover:bg-mi-cyan/10',
        // Available state
        isAvailable && 'bg-gray-800/30 cursor-pointer hover:bg-gray-800/50 border border-transparent hover:border-mi-cyan/30',
        // Locked state
        isLocked && 'bg-gray-800/20 opacity-50 cursor-not-allowed'
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          'p-1.5 rounded-md',
          isComplete && 'bg-mi-cyan/20',
          isAvailable && 'bg-mi-cyan/10',
          isLocked && 'bg-gray-700'
        )}>
          <Icon className={cn(
            'h-4 w-4',
            isComplete && 'text-mi-cyan',
            isAvailable && 'text-mi-cyan',
            isLocked && 'text-gray-500'
          )} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className={cn(
              'text-sm font-medium',
              isComplete && 'text-white',
              isAvailable && 'text-white',
              isLocked && 'text-gray-400'
            )}>
              {assessment.title}
            </span>
            {isComplete && assessment.result && (
              <span className="text-xs text-mi-gold font-medium">
                {assessment.result}
              </span>
            )}
          </div>
          {isLocked && assessment.lockReason && (
            <span className="text-xs text-gray-500">
              {assessment.lockReason}
            </span>
          )}
          {isComplete && assessment.confidence && (
            <span className="text-xs text-gray-500">
              {assessment.confidence}% confidence
            </span>
          )}
        </div>
      </div>

      {/* Status badge */}
      <div>
        {isComplete && (
          <Badge variant="outline" className="text-green-400 border-green-400/30 bg-green-400/10 text-xs">
            <Check className="h-3 w-3 mr-1" />
            Complete
          </Badge>
        )}
        {isAvailable && (
          <Badge variant="outline" className="text-mi-cyan border-mi-cyan/30 bg-mi-cyan/10 text-xs">
            Week {assessment.week}
          </Badge>
        )}
        {isLocked && (
          <Badge variant="outline" className="text-gray-500 border-gray-600 text-xs">
            <Lock className="h-3 w-3 mr-1" />
            Week {assessment.week}
          </Badge>
        )}
      </div>
    </motion.div>
  );
}

export default AvatarContainerCard;
