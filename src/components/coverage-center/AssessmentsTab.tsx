/**
 * AssessmentsTab
 * Coverage Center - Your Assessments Tab
 *
 * Displays all 4 assessment types with their completion status:
 * 1. Identity Collision (required first)
 * 2. Internal Wiring (formerly Temperament)
 * 3. Mental Pillar Baseline
 * 4. Sub-Pattern Assessment
 *
 * Each assessment card shows:
 * - Completion status (locked, available, completed)
 * - Brief description
 * - CTA to start or view results
 * - Results summary if completed
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Zap,
  Brain,
  Lock,
  Check,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Unlock Cards (rich UI for Internal Wiring and Sub-Pattern)
import { TemperamentUnlockCard } from './TemperamentUnlockCard';
import { SubPatternUnlockCard } from './SubPatternUnlockCard';

// Types
import type { IdentityCollisionStatus } from '@/hooks/useIdentityCollisionStatus';
import type { TemperamentStatus } from '@/hooks/useTemperamentStatus';
import type { SubPatternStatus } from '@/hooks/useSubPatternStatus';

// Pattern display info
const PATTERN_DISPLAY = {
  past_prison: { name: 'Past Prison', color: 'text-red-400', bgColor: 'bg-red-500/20' },
  success_sabotage: { name: 'Success Sabotage', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  compass_crisis: { name: 'Compass Crisis', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
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

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-lg bg-mi-navy-light" />
        ))}
      </div>
    );
  }

  // Determine assessment availability
  const hasCompletedCollision = collisionStatus?.hasPattern || false;
  const hasCompletedTemperament = temperamentStatus?.hasCompleted || false;
  const hasCompletedSubPattern = subPatternStatus?.hasCompleted || false;
  const hasCompletedMentalPillar = mentalPillarStatus?.hasBaseline || false;

  // Calculate progress (4 total assessments)
  const totalCount = 4;
  const completedCount = [
    hasCompletedCollision,
    hasCompletedTemperament,
    hasCompletedMentalPillar,
    hasCompletedSubPattern,
  ].filter(Boolean).length;

  // Check if avatar can be viewed (need collision + temperament + sub-pattern for full avatar)
  const avatarAssessmentsComplete = hasCompletedCollision && hasCompletedTemperament && hasCompletedSubPattern;

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h3 className="text-lg font-semibold text-white">Your Assessments</h3>
          <p className="text-sm text-gray-400">
            {completedCount} of {totalCount} completed
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-24 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-mi-cyan to-mi-gold"
              initial={{ width: 0 }}
              animate={{ width: `${(completedCount / totalCount) * 100}%` }}
              transition={{ duration: 0.5, delay: 0.2 }}
            />
          </div>
          <span className="text-sm text-mi-cyan font-medium">
            {Math.round((completedCount / totalCount) * 100)}%
          </span>
        </div>
      </motion.div>

      {/* Avatar CTA (when all 3 core assessments complete) */}
      {avatarAssessmentsComplete && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-2"
        >
          <Card
            className="bg-gradient-to-r from-mi-cyan/20 to-mi-gold/20 border-mi-gold/40 cursor-pointer hover:border-mi-gold/60 transition-all group"
            onClick={() => navigate('/mind-insurance/avatar')}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-mi-cyan to-mi-gold">
                    <span className="text-xl">🎭</span>
                  </div>
                  <div>
                    <CardTitle className="text-base text-white">Your Identity Avatar</CardTitle>
                    <CardDescription className="text-gray-300 text-sm">
                      View your complete psychological fingerprint
                    </CardDescription>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="bg-mi-gold hover:bg-mi-gold/80 text-mi-navy font-semibold group-hover:shadow-lg group-hover:shadow-mi-gold/20"
                >
                  View Avatar
                  <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </CardHeader>
          </Card>
        </motion.div>
      )}

      {/* Assessment Cards */}
      <div className="space-y-4">
        {/* 1. Identity Collision - Simple Card (Required first) */}
        <AssessmentCard
          key="identity_collision"
          id="identity_collision"
          title="Identity Collision"
          description="Discover your primary pattern: the unconscious force shaping your decisions."
          icon={Zap}
          week={1}
          isLocked={false}
          isCompleted={hasCompletedCollision}
          isRequired={true}
          result={hasCompletedCollision && collisionStatus?.primaryPattern
            ? {
                label: PATTERN_DISPLAY[collisionStatus.primaryPattern]?.name || collisionStatus.primaryPattern,
                color: PATTERN_DISPLAY[collisionStatus.primaryPattern]?.color || 'text-gray-400',
                confidence: collisionStatus.confidence,
              }
            : null}
          route="/mind-insurance/assessment"
          gradient="from-orange-500 to-red-500"
          borderColor="border-orange-500/30"
          iconBg="bg-orange-500/20"
          index={0}
          onNavigate={() => navigate('/mind-insurance/assessment')}
        />

        {/* 2. Internal Wiring - Rich Unlock Card (Week 2) */}
        <TemperamentUnlockCard
          hasCompletedTemperament={hasCompletedTemperament}
          temperament={temperamentStatus?.result?.primary}
          isLoading={false}
        />

        {/* 3. Mental Pillar Baseline - Simple Card (Week 2) */}
        <AssessmentCard
          key="mental_pillar"
          id="mental_pillar"
          title="Mental Pillar Baseline"
          description="Measure your current mental strength across 4 key competencies."
          icon={Brain}
          week={2}
          isLocked={!hasCompletedCollision}
          isCompleted={hasCompletedMentalPillar}
          isRequired={false}
          result={hasCompletedMentalPillar
            ? {
                label: 'Baseline Established',
                subtext: mentalPillarStatus?.baselineDate
                  ? `Completed ${new Date(mentalPillarStatus.baselineDate).toLocaleDateString()}`
                  : undefined,
              }
            : null}
          route="/mind-insurance/mental-pillar-assessment"
          gradient="from-purple-500 to-violet-500"
          borderColor="border-purple-500/30"
          iconBg="bg-purple-500/20"
          index={2}
          onNavigate={() => navigate('/mind-insurance/mental-pillar-assessment')}
        />

        {/* 4. Sub-Pattern Deep Dive - Rich Unlock Card (Week 3) */}
        <SubPatternUnlockCard
          hasCompletedSubPattern={hasCompletedSubPattern}
          hasCompletedTemperament={hasCompletedTemperament}
          primaryPattern={collisionStatus?.primaryPattern}
          primarySubPattern={subPatternStatus?.result?.primarySubPattern}
          secondarySubPattern={subPatternStatus?.result?.secondarySubPattern}
          isLoading={false}
        />
      </div>

      {/* Info Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="p-4 bg-mi-navy/50 rounded-lg border border-mi-cyan/10"
      >
        <p className="text-xs text-gray-500 text-center">
          Assessments unlock progressively as you complete earlier stages.
          Your results shape how MIO delivers personalized protocols.
        </p>
      </motion.div>
    </div>
  );
}

// Individual Assessment Card Component
interface AssessmentCardProps {
  id: string;
  title: string;
  description: string;
  icon: typeof Zap;
  week: number;
  isLocked: boolean;
  isCompleted: boolean;
  isRequired: boolean;
  result: {
    label: string;
    icon?: string;
    color?: string;
    confidence?: number;
    subtext?: string;
  } | null;
  route: string;
  gradient: string;
  borderColor: string;
  iconBg: string;
  index: number;
  onNavigate: () => void;
}

function AssessmentCard({
  title,
  description,
  icon: Icon,
  week,
  isLocked,
  isCompleted,
  isRequired,
  result,
  gradient,
  borderColor,
  iconBg,
  index,
  onNavigate,
}: AssessmentCardProps) {
  // Locked state
  if (isLocked) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
      >
        <Card className="bg-mi-navy-light/50 border-gray-700 opacity-60">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-700/50">
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
                <div>
                  <CardTitle className="text-base text-gray-500">{title}</CardTitle>
                  <CardDescription className="text-gray-600 text-sm">
                    Complete previous assessments to unlock
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="bg-gray-700/50 text-gray-500 border-gray-600 text-xs">
                Week {week}
              </Badge>
            </div>
          </CardHeader>
        </Card>
      </motion.div>
    );
  }

  // Completed state
  if (isCompleted && result) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
      >
        <Card
          className={cn(
            'bg-mi-navy-light overflow-hidden cursor-pointer transition-all',
            borderColor,
            'hover:border-mi-cyan/50'
          )}
          onClick={onNavigate}
        >
          <div className={cn('h-1 w-full bg-gradient-to-r', gradient)} />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn('p-2 rounded-lg bg-gradient-to-br', gradient)}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base text-white">{title}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    {result.icon && <span>{result.icon}</span>}
                    <span className={cn('text-sm font-medium', result.color || 'text-mi-cyan')}>
                      {result.label}
                    </span>
                    {result.confidence && (
                      <span className="text-xs text-gray-500">({result.confidence}% confidence)</span>
                    )}
                  </div>
                  {result.subtext && (
                    <p className="text-xs text-gray-500 mt-0.5">{result.subtext}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-green-500/10 text-green-400 border-green-500/30 text-xs"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
                <ChevronRight className="h-5 w-5 text-gray-500" />
              </div>
            </div>
          </CardHeader>
        </Card>
      </motion.div>
    );
  }

  // Available state (not locked, not completed)
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Card
        className={cn(
          'bg-mi-navy-light cursor-pointer transition-all group',
          borderColor,
          'hover:border-mi-cyan/50 hover:shadow-lg hover:shadow-mi-cyan/10'
        )}
        onClick={onNavigate}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn('p-2 rounded-lg', iconBg)}>
                <Icon className="h-5 w-5 text-mi-cyan" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base text-white">{title}</CardTitle>
                  {isRequired && (
                    <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/30 text-[10px]">
                      Required
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-gray-400 text-sm mt-0.5">
                  {description}
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="bg-mi-cyan/10 text-mi-cyan border-mi-cyan/30 text-xs">
              Week {week}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Button
            className="w-full bg-mi-cyan hover:bg-mi-cyan-dark text-mi-navy font-semibold group-hover:shadow-lg group-hover:shadow-mi-cyan/20 transition-all"
          >
            Start Assessment
            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default AssessmentsTab;
