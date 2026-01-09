/**
 * AssessmentsTab
 * Coverage Center - Your Assessments Tab
 *
 * P6.5 Unified Avatar Container UI
 *
 * Displays assessments in a unified container structure:
 * - Avatar Container (houses 3 avatar assessments):
 *   1. Identity Collision (required first)
 *   2. Internal Wiring (Week 2)
 *   3. Sub-Pattern (Week 3)
 * - Mental Pillar (separate card - baseline measurement)
 *
 * The Avatar Container shows:
 * - Progress indicator (X of 3 complete)
 * - Collapsible assessment list
 * - "Avatar Unlocked!" celebration when all 3 complete
 * - View Avatar CTA
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Brain,
  Lock,
  Check,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

// Unified Avatar Container
import { AvatarContainerCard } from './AvatarContainerCard';

// Sheet components for viewing detailed results
import { PatternSummarySheet } from './PatternSummarySheet';
import { WiringDetailsSheet } from './WiringDetailsSheet';

// Types
import type { IdentityCollisionStatus } from '@/hooks/useIdentityCollisionStatus';
import type { TemperamentStatus } from '@/hooks/useTemperamentStatus';
import type { SubPatternStatus } from '@/hooks/useSubPatternStatus';

// Pattern display info (kept for sheets)
const PATTERN_DISPLAY: Record<string, { name: string; color: string; bgColor: string }> = {
  past_prison: { name: 'Past Prison', color: 'text-red-400', bgColor: 'bg-red-500/20' },
  success_sabotage: { name: 'Success Sabotage', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  compass_crisis: { name: 'Compass Crisis', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
};

// Temperament/Wiring display names (kept for sheets)
const TEMPERAMENT_DISPLAY: Record<string, string> = {
  warrior: 'The Warrior',
  sage: 'The Sage',
  connector: 'The Connector',
  builder: 'The Builder',
};

interface AssessmentsTabProps {
  collisionStatus: IdentityCollisionStatus | null | undefined;
  temperamentStatus: TemperamentStatus | null | undefined;
  subPatternStatus: SubPatternStatus | null | undefined;
  mentalPillarStatus: { hasBaseline: boolean; baselineDate?: string } | null;
  isLoading: boolean;
}

export function AssessmentsTab({
  collisionStatus,
  temperamentStatus,
  subPatternStatus,
  mentalPillarStatus,
  isLoading,
}: AssessmentsTabProps) {
  const navigate = useNavigate();

  // Sheet visibility state
  const [patternSheetOpen, setPatternSheetOpen] = useState(false);
  const [wiringSheetOpen, setWiringSheetOpen] = useState(false);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full rounded-lg bg-mi-navy-light" />
        <Skeleton className="h-24 w-full rounded-lg bg-mi-navy-light" />
      </div>
    );
  }

  // Determine assessment availability
  const hasCompletedCollision = collisionStatus?.hasPattern || false;
  const hasCompletedTemperament = temperamentStatus?.hasCompleted || false;
  const hasCompletedSubPattern = subPatternStatus?.hasCompleted || false;
  const hasCompletedMentalPillar = mentalPillarStatus?.hasBaseline || false;

  // Check if avatar can be viewed (need collision + temperament + sub-pattern for full avatar)
  const avatarAssessmentsComplete = hasCompletedCollision && hasCompletedTemperament && hasCompletedSubPattern;

  return (
    <div className="space-y-4">
      {/* Avatar Container - houses the 3 avatar assessments */}
      <AvatarContainerCard
        collisionStatus={collisionStatus ? {
          hasPattern: collisionStatus.hasPattern,
          primaryPattern: collisionStatus.primaryPattern,
          confidence: collisionStatus.confidence,
        } : null}
        temperamentStatus={temperamentStatus ? {
          hasCompleted: temperamentStatus.hasCompleted,
          result: temperamentStatus.result,
        } : null}
        subPatternStatus={subPatternStatus ? {
          hasCompleted: subPatternStatus.hasCompleted,
          result: subPatternStatus.result,
        } : null}
        isLoading={false}
        onCollisionClick={() => setPatternSheetOpen(true)}
        onWiringClick={() => setWiringSheetOpen(true)}
        onSubPatternClick={() => {
          // Navigate to avatar page with sub-pattern focus when clicked
          if (avatarAssessmentsComplete) {
            navigate('/mind-insurance/avatar?focus=sub_pattern');
          }
        }}
      />

      {/* Mental Pillar - SEPARATE card (not part of Avatar) */}
      <MentalPillarCard
        isLocked={!hasCompletedCollision}
        isCompleted={hasCompletedMentalPillar}
        baselineDate={mentalPillarStatus?.baselineDate}
        onNavigate={() => navigate('/mind-insurance/mental-pillar-assessment')}
      />

      {/* Info Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="p-3 bg-mi-navy/50 rounded-lg border border-mi-cyan/10"
      >
        <p className="text-xs text-gray-500 text-center">
          Complete your Avatar assessments to unlock personalized MIO protocols.
          Mental Pillar provides an independent baseline measurement.
        </p>
      </motion.div>

      {/* Pattern Summary Sheet - Identity Collision Results */}
      <PatternSummarySheet
        open={patternSheetOpen}
        onOpenChange={setPatternSheetOpen}
        pattern={hasCompletedCollision && collisionStatus?.primaryPattern ? {
          name: collisionStatus.primaryPattern,
          displayName: PATTERN_DISPLAY[collisionStatus.primaryPattern]?.name || collisionStatus.primaryPattern,
          confidence: collisionStatus.confidence,
        } : null}
        patternScores={collisionStatus?.scores}
        avatarComplete={avatarAssessmentsComplete}
      />

      {/* Wiring Details Sheet - Internal Wiring Results */}
      <WiringDetailsSheet
        open={wiringSheetOpen}
        onOpenChange={setWiringSheetOpen}
        wiring={hasCompletedTemperament && temperamentStatus?.result ? {
          primary: temperamentStatus.result.primary,
          displayName: TEMPERAMENT_DISPLAY[temperamentStatus.result.primary] || temperamentStatus.result.primary,
          secondary: temperamentStatus.result.secondary,
        } : null}
        avatarComplete={avatarAssessmentsComplete}
      />
    </div>
  );
}

// ============================================================================
// MENTAL PILLAR CARD - Separate from Avatar Container
// ============================================================================

interface MentalPillarCardProps {
  isLocked: boolean;
  isCompleted: boolean;
  baselineDate?: string;
  onNavigate: () => void;
}

function MentalPillarCard({
  isLocked,
  isCompleted,
  baselineDate,
  onNavigate,
}: MentalPillarCardProps) {
  // Locked state
  if (isLocked) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card className="bg-mi-navy-light/50 border-gray-700/50 opacity-60">
          <CardHeader className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-700/50">
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
                <div>
                  <CardTitle className="text-sm text-gray-500">Mental Pillar Baseline</CardTitle>
                  <CardDescription className="text-gray-600 text-xs">
                    Complete Identity Collision to unlock
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="bg-gray-700/50 text-gray-500 border-gray-600 text-xs">
                <Lock className="h-3 w-3 mr-1" />
                Locked
              </Badge>
            </div>
          </CardHeader>
        </Card>
      </motion.div>
    );
  }

  // Completed state
  if (isCompleted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card
          className="bg-mi-navy-light border-purple-500/30 cursor-pointer hover:border-purple-500/50 transition-all overflow-hidden"
          onClick={onNavigate}
        >
          <div className="h-1 bg-gradient-to-r from-purple-500 to-violet-500" />
          <CardHeader className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-violet-500">
                  <Brain className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-sm text-white">Mental Pillar Baseline</CardTitle>
                  <CardDescription className="text-gray-400 text-xs">
                    Baseline established
                    {baselineDate && ` - ${new Date(baselineDate).toLocaleDateString()}`}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-400/30 text-xs">
                  <Check className="h-3 w-3 mr-1" />
                  Complete
                </Badge>
                <ChevronRight className="h-4 w-4 text-gray-500" />
              </div>
            </div>
          </CardHeader>
        </Card>
      </motion.div>
    );
  }

  // Available state
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <Card
        className="bg-mi-navy-light border-purple-500/20 cursor-pointer hover:border-purple-500/40 transition-all group"
        onClick={onNavigate}
      >
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Brain className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-sm text-white">Mental Pillar Baseline</CardTitle>
                <CardDescription className="text-gray-400 text-xs">
                  Measure your mental strength across 4 key competencies
                </CardDescription>
              </div>
            </div>
            <Button
              size="sm"
              className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-xs"
            >
              Start
              <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </div>
        </CardHeader>
      </Card>
    </motion.div>
  );
}

export default AssessmentsTab;
