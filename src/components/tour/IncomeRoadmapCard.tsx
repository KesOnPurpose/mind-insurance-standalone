/**
 * FEAT-GH-TOUR: Income Roadmap Card Component
 *
 * Displays the personalized Income Replacement Roadmap
 * showing milestones, timeline, and progress toward
 * income freedom.
 */

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Home,
  DollarSign,
  Calendar,
  TrendingUp,
  CheckCircle2,
  Circle,
  Target,
  Sparkles,
} from 'lucide-react';
import type { IncomeReplacementRoadmap, IncomeReplacementMilestone } from '@/types/assessment';
import { formatCurrency } from '@/utils/incomeReplacementCalculator';

interface IncomeRoadmapCardProps {
  roadmap: IncomeReplacementRoadmap;
  className?: string;
  showConfetti?: boolean;
}

/**
 * Milestone item component
 */
function MilestoneItem({
  milestone,
  isLast,
}: {
  milestone: IncomeReplacementMilestone;
  isLast: boolean;
}) {
  const isComplete = milestone.achieved;

  return (
    <div className="relative flex gap-4">
      {/* Timeline line */}
      {!isLast && (
        <div
          className={cn(
            'absolute left-4 top-8 w-0.5 h-[calc(100%-8px)]',
            isComplete ? 'bg-primary' : 'bg-border'
          )}
        />
      )}

      {/* Icon */}
      <div
        className={cn(
          'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isComplete
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground border border-border'
        )}
      >
        {isComplete ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <Circle className="h-4 w-4" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p
              className={cn(
                'font-medium',
                isComplete ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {milestone.title}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {milestone.description}
            </p>
          </div>

          {milestone.targetDate && (
            <Badge
              variant={isComplete ? 'default' : 'secondary'}
              className="shrink-0"
            >
              <Calendar className="h-3 w-3 mr-1" />
              {milestone.targetDate}
            </Badge>
          )}
        </div>

        {/* Milestone metrics */}
        <div className="flex flex-wrap gap-3 mt-3">
          <div className="flex items-center gap-1.5 text-sm">
            <Home className="h-3.5 w-3.5 text-primary" />
            <span className="text-muted-foreground">
              {milestone.propertiesAtMilestone} {milestone.propertiesAtMilestone === 1 ? 'property' : 'properties'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <DollarSign className="h-3.5 w-3.5 text-green-500" />
            <span className="text-muted-foreground">
              {formatCurrency(milestone.incomeAtMilestone)}/mo
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * IncomeRoadmapCard - Personalized income replacement visualization
 *
 * Features:
 * - Target income and properties needed
 * - Timeline with milestones
 * - Progress visualization
 * - Celebratory styling for completed milestones
 */
export function IncomeRoadmapCard({
  roadmap,
  className,
  showConfetti = false,
}: IncomeRoadmapCardProps) {
  // Calculate progress percentage
  const progressPercent = useMemo(() => {
    if (roadmap.milestones.length === 0) return 0;
    const completed = roadmap.milestones.filter((m) => m.achieved).length;
    return Math.round((completed / roadmap.milestones.length) * 100);
  }, [roadmap.milestones]);

  return (
    <Card
      className={cn(
        'relative overflow-hidden',
        'bg-background/95 backdrop-blur-xl',
        'border border-primary/20',
        'shadow-xl',
        className
      )}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />

      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-5 w-5 text-primary" />
              <CardTitle className="text-xl">
                Your Income Replacement Roadmap
              </CardTitle>
              {showConfetti && <Sparkles className="h-4 w-4 text-yellow-500 animate-pulse" />}
            </div>
            <p className="text-sm text-muted-foreground">
              Personalized path to financial freedom based on your assessment
            </p>
          </div>

          <Badge
            variant="outline"
            className="bg-primary/10 text-primary border-primary/20"
          >
            {roadmap.ownershipModel.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Key metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              Target Income
            </div>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(roadmap.targetMonthlyIncome)}
            </p>
            <p className="text-xs text-muted-foreground">per month</p>
          </div>

          <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/10">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Home className="h-4 w-4" />
              Properties Needed
            </div>
            <p className="text-2xl font-bold text-foreground">
              {roadmap.propertiesNeeded}
            </p>
            <p className="text-xs text-muted-foreground">group homes</p>
          </div>

          <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/10">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              Net Per Property
            </div>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(roadmap.netProfitPerProperty)}
            </p>
            <p className="text-xs text-muted-foreground">per month</p>
          </div>

          <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/10">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Calendar className="h-4 w-4" />
              Timeline
            </div>
            <p className="text-2xl font-bold text-foreground">
              {roadmap.estimatedTimeline}
            </p>
            <p className="text-xs text-muted-foreground">estimated</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Roadmap Progress</span>
            <span className="font-medium">{progressPercent}% complete</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Milestones timeline */}
        <div className="space-y-0">
          <h4 className="font-medium text-foreground mb-4">Your Milestones</h4>
          {roadmap.milestones.map((milestone, index) => (
            <MilestoneItem
              key={milestone.id}
              milestone={milestone}
              isLast={index === roadmap.milestones.length - 1}
            />
          ))}
        </div>

        {/* Personalized insight */}
        {roadmap.personalizedInsight && (
          <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/10">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground mb-1">
                  Nette's Insight for You
                </p>
                <p className="text-sm text-muted-foreground">
                  {roadmap.personalizedInsight}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default IncomeRoadmapCard;
