import { TrendingUp, Target, CheckCircle2, Clock, Award, Lock as LockIcon } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePersonalizedTactics } from '@/hooks/usePersonalizedTactics';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProgress } from '@/services/progressService';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'react-router-dom';
import { JOURNEY_PHASES } from '@/config/categories';

/**
 * Get the phase for a given week number
 */
function getPhaseForWeek(weekNumber: number) {
  return JOURNEY_PHASES.find(p => p.weeks.includes(weekNumber));
}

/**
 * RoadmapPanel - Journey progress, milestones, and quick filters for roadmap context
 */
export function RoadmapPanel() {
  const { user } = useAuth();
  const { tactics, assessment, startingWeek, isLoading, recommendedWeeks } = usePersonalizedTactics();
  const { data: progressData } = useUserProgress(user?.id || '');
  const [searchParams, setSearchParams] = useSearchParams();

  // Get selected week from URL or calculate current week
  const urlWeek = searchParams.get('week');

  if (isLoading) {
    return (
      <div className="px-2 py-2 space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  // Calculate progress stats
  const totalTactics = tactics.length;
  const completedTactics = progressData?.filter(p => p.status === 'completed').length || 0;
  const inProgressTactics = progressData?.filter(p => p.status === 'in_progress').length || 0;
  const completionRate = totalTactics > 0 ? Math.round((completedTactics / totalTactics) * 100) : 0;

  // Calculate current week based on progress
  const tacticsWithProgress = tactics.map(tactic => ({
    ...tactic,
    status: progressData?.find(p => p.tactic_id === tactic.tactic_id)?.status || 'not_started',
  }));

  // Determine current week (first incomplete week)
  const weekNumbers = [...new Set(tactics.map(t => t.week_assignment).filter(Boolean))].sort((a, b) => (a || 0) - (b || 0)) as number[];
  const currentWeek = weekNumbers.find(week => {
    const weekTactics = tacticsWithProgress.filter(t => t.week_assignment === week);
    return weekTactics.some(t => t.status !== 'completed');
  }) || startingWeek || 1;

  // Selected week from URL or default to current week
  const selectedWeek = urlWeek ? parseInt(urlWeek) : currentWeek;

  // Calculate week summaries for the dropdown
  const totalWeeks = recommendedWeeks || Math.max(...weekNumbers, 15);
  const weekSummaries = Array.from({ length: totalWeeks }, (_, i) => {
    const weekNum = i + 1;
    const weekTactics = tacticsWithProgress.filter(t => t.week_assignment === weekNum);
    const completed = weekTactics.filter(t => t.status === 'completed').length;
    const total = weekTactics.length;
    const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      weekNumber: weekNum,
      completed,
      total,
      progressPercent,
      isCurrentWeek: weekNum === currentWeek,
      isRecommendedStart: weekNum === startingWeek,
    };
  });

  // Progressive disclosure: highest unlocked week
  const highestProgressWeek = weekSummaries
    .filter(w => w.completed > 0 || tacticsWithProgress.some(t => t.week_assignment === w.weekNumber && t.status === 'in_progress'))
    .map(w => w.weekNumber)
    .reduce((max, week) => Math.max(max, week), 0);
  const highestUnlockedWeek = Math.max(3, highestProgressWeek + 2, currentWeek + 1);

  // Handler for week selection
  const handleWeekChange = (weekValue: string) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('week', weekValue);
      return newParams;
    });
  };

  // Milestone badges
  const milestones = [
    { id: 'first', label: 'First Tactic', achieved: completedTactics >= 1, icon: Target },
    { id: 'five', label: '5 Completed', achieved: completedTactics >= 5, icon: Award },
    { id: 'quarter', label: '25% Done', achieved: completionRate >= 25, icon: TrendingUp },
    { id: 'half', label: 'Halfway', achieved: completionRate >= 50, icon: CheckCircle2 },
  ];

  return (
    <div className="px-2 py-2 space-y-3">
      {/* Overall Progress */}
      <div className="rounded-lg border bg-gradient-to-br from-primary/10 to-primary/5 p-3 text-card-foreground">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Journey Progress</span>
          </div>
          <span className="text-lg font-bold text-primary">{completionRate}%</span>
        </div>
        <Progress value={completionRate} className="h-2 mb-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{completedTactics} completed</span>
          <span>{inProgressTactics} in progress</span>
        </div>
      </div>

      {/* Interactive Week Selector */}
      <div className="rounded-lg border bg-card p-3 text-card-foreground">
        <div className="flex items-center gap-2 mb-2">
          <Target className="h-4 w-4 text-secondary" />
          <span className="text-sm font-medium">Week Focus</span>
        </div>
        <Select value={String(selectedWeek)} onValueChange={handleWeekChange}>
          <SelectTrigger className="w-full h-auto min-h-10 py-2 border-primary/50 bg-gradient-to-r from-primary/5 to-secondary/5 hover:bg-primary/10 transition-colors">
            <SelectValue>
              <div className="flex flex-col items-start gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold">Week {selectedWeek}</span>
                  {selectedWeek === currentWeek && (
                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5">Current</Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {getPhaseForWeek(selectedWeek)?.name} - {getWeekDescription(selectedWeek)}
                </span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {weekSummaries.map((week) => {
              const isLocked = week.weekNumber > highestUnlockedWeek;
              const weekPhase = getPhaseForWeek(week.weekNumber);
              const weekDesc = getWeekDescription(week.weekNumber);
              return (
                <SelectItem
                  key={week.weekNumber}
                  value={String(week.weekNumber)}
                  disabled={isLocked}
                  className={cn(
                    'flex items-center py-2',
                    week.isCurrentWeek && 'bg-primary/5',
                    isLocked && 'opacity-50'
                  )}
                >
                  <div className="flex flex-col w-full gap-0.5">
                    <div className="flex items-center justify-between w-full gap-2">
                      <div className="flex items-center gap-2">
                        {isLocked ? (
                          <LockIcon className="h-3 w-3 text-muted-foreground" />
                        ) : week.progressPercent === 100 ? (
                          <CheckCircle2 className="h-3 w-3 text-success" />
                        ) : week.progressPercent > 0 ? (
                          <Clock className="h-3 w-3 text-amber-500" />
                        ) : (
                          <div className="h-3 w-3 rounded-full border border-muted-foreground/30" />
                        )}
                        <span className="font-medium">Week {week.weekNumber}</span>
                        {week.isRecommendedStart && (
                          <span className="text-amber-500 text-xs">★</span>
                        )}
                      </div>
                      {week.total > 0 && !isLocked && (
                        <span className="text-xs text-muted-foreground">
                          {week.completed}/{week.total}
                        </span>
                      )}
                    </div>
                    {!isLocked && weekPhase && (
                      <span className="text-xs text-muted-foreground pl-5 truncate">
                        {weekPhase.name} - {weekDesc}
                      </span>
                    )}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-2">Tap to change week</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border bg-card p-2 text-card-foreground">
          <div className="flex items-center gap-1.5 mb-1">
            <CheckCircle2 className="h-3 w-3 text-success" />
            <span className="text-xs text-muted-foreground">Done</span>
          </div>
          <p className="text-lg font-bold">{completedTactics}</p>
        </div>
        <div className="rounded-lg border bg-card p-2 text-card-foreground">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock className="h-3 w-3 text-blue-500" />
            <span className="text-xs text-muted-foreground">Active</span>
          </div>
          <p className="text-lg font-bold">{inProgressTactics}</p>
        </div>
      </div>

      {/* Milestones */}
      <div className="rounded-lg border bg-card p-3 text-card-foreground">
        <p className="text-xs font-medium text-muted-foreground mb-2">Milestones</p>
        <div className="flex flex-wrap gap-1.5">
          {milestones.map((milestone) => {
            const Icon = milestone.icon;
            return (
              <Badge
                key={milestone.id}
                variant={milestone.achieved ? 'default' : 'outline'}
                className={cn(
                  'text-xs gap-1',
                  milestone.achieved
                    ? 'bg-success/10 text-success border-success/30'
                    : 'opacity-50'
                )}
              >
                <Icon className="h-3 w-3" />
                {milestone.label}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Strategy Summary (if assessment exists) */}
      {assessment && (
        <div className="rounded-lg border bg-muted/50 p-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">Your Strategy</p>
          <div className="space-y-1.5">
            {assessment.ownership_model && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Model:</span>
                <span className="font-medium capitalize">
                  {assessment.ownership_model.replace('_', ' ')}
                </span>
              </div>
            )}
            {assessment.readiness_level && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Readiness:</span>
                <Badge variant="secondary" className="text-xs h-5">
                  {assessment.readiness_level.replace('_', ' ')}
                </Badge>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Tactics:</span>
              <span className="font-medium">{totalTactics} matched</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Get a brief description for each week
 */
function getWeekDescription(weekNumber: number): string {
  const descriptions: Record<number, string> = {
    1: 'Foundation & Vision setting',
    2: 'Market Research & Analysis',
    3: 'Financial Planning',
    4: 'Legal & Business Setup',
    5: 'Licensing Process',
    6: 'Business Formation',
    7: 'Property Search',
    8: 'Creative Financing',
    9: 'Property Acquisition',
    10: 'Operations Setup',
    11: 'Marketing Launch',
    12: 'First Residents',
    13: 'Optimization & Refinement',
    14: 'Scaling Preparation',
    15: 'Growth & Expansion',
  };
  return descriptions[weekNumber] || `Week ${weekNumber} tasks`;
}

export default RoadmapPanel;
