import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ListTodo, CheckCircle2, Circle, ArrowRight, MessageSquare, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePersonalizedTactics } from '@/hooks/usePersonalizedTactics';
import type { TacticWithProgress } from '@/types/tactic';

/**
 * WeeklyFocusCard - Dashboard card showing current week's tasks
 *
 * Displays:
 * - Current week number and title
 * - Tasks completed vs total
 * - Checklist of current week's tasks (max 5)
 * - View All Tasks CTA
 * - Inline Ask Nette link with roadmap context
 */
export function WeeklyFocusCard() {
  const {
    tactics,
    recommendedWeeks,
    startingWeek,
    isLoading,
    totalTacticsCount,
    hasAssessment,
  } = usePersonalizedTactics();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-32 mb-3" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-9 w-full mt-4" />
        </CardContent>
      </Card>
    );
  }

  // No assessment taken - prompt to take it
  if (!hasAssessment) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">Weekly Focus</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Complete your readiness assessment to get personalized weekly tasks tailored to your journey.
          </p>
          <Link to="/assessment">
            <Button variant="outline" size="sm" className="w-full gap-2">
              Take Assessment
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // No tactics available
  if (!tactics || tactics.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">Weekly Focus</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Your personalized roadmap is being prepared. Check back soon for your weekly tasks.
          </p>
          <Link to="/roadmap">
            <Button variant="outline" size="sm" className="w-full gap-2">
              View Roadmap
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Determine current week (starting week from assessment or first recommended)
  const currentWeek = startingWeek || (recommendedWeeks && recommendedWeeks.length > 0 ? recommendedWeeks[0] : 1);
  const totalWeeks = recommendedWeeks?.length || 12;

  // Filter tactics for current week
  const currentWeekTactics = tactics.filter(
    (t: TacticWithProgress) => t.week_assignment === currentWeek
  );

  // Calculate completed count
  const completedCount = currentWeekTactics.filter(
    (t: TacticWithProgress) => t.status === 'completed'
  ).length;

  const totalCount = currentWeekTactics.length;

  // Get progress percentage
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Determine status badge
  const getStatusBadge = () => {
    if (progressPercent === 100) {
      return { label: 'Complete!', color: 'bg-green-600' };
    }
    if (progressPercent >= 60) {
      return { label: 'On Track', color: 'bg-blue-600' };
    }
    if (progressPercent > 0) {
      return { label: 'In Progress', color: 'bg-yellow-600' };
    }
    return { label: 'Not Started', color: 'bg-slate-500' };
  };

  const status = getStatusBadge();

  // Get up to 5 tactics to display (prioritize incomplete)
  const incompleteTactics = currentWeekTactics.filter(
    (t: TacticWithProgress) => t.status !== 'completed'
  );
  const completedTactics = currentWeekTactics.filter(
    (t: TacticWithProgress) => t.status === 'completed'
  );

  // Show incomplete first, then completed, max 5 total
  const displayTactics = [
    ...incompleteTactics.slice(0, 4),
    ...completedTactics.slice(0, Math.max(0, 5 - incompleteTactics.length)),
  ].slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">Weekly Focus</CardTitle>
          </div>
          <Badge variant="secondary" className={`${status.color} text-white text-xs`}>
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Week info */}
        <div className="mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-muted-foreground" />
            <p className="font-medium text-sm">Week {currentWeek} of {totalWeeks}</p>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {completedCount} of {totalCount} tasks complete
          </p>
        </div>

        {/* Task checklist */}
        {displayTactics.length > 0 ? (
          <div className="space-y-2 mb-4">
            {displayTactics.map((tactic: TacticWithProgress) => (
              <div
                key={tactic.tactic_id}
                className="flex items-start gap-2 text-sm"
              >
                {tactic.status === 'completed' ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                )}
                <span
                  className={
                    tactic.status === 'completed'
                      ? 'text-muted-foreground line-through'
                      : 'text-foreground'
                  }
                >
                  {tactic.tactic_name}
                </span>
              </div>
            ))}
            {currentWeekTactics.length > 5 && (
              <p className="text-xs text-muted-foreground pl-6">
                +{currentWeekTactics.length - 5} more tasks
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mb-4">
            No tasks assigned for this week yet.
          </p>
        )}

        {/* All complete celebration */}
        {progressPercent === 100 && totalCount > 0 && (
          <div className="bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm font-medium">Week {currentWeek} complete!</span>
            </div>
            <p className="text-xs text-green-600 dark:text-green-500 mt-1">
              Great progress! Ready to move forward.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <Link to="/roadmap">
            <Button size="sm" className="w-full gap-2">
              View All Tasks
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>

          {/* Inline Ask Nette link with context */}
          <Link
            to={`/chat?context=roadmap&week=${currentWeek}&completed=${completedCount}&total=${totalCount}`}
            className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors py-1"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Ask Nette about my weekly tasks</span>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default WeeklyFocusCard;
