import { TrendingUp, Target, Clock, CheckCircle2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useUserProgress } from '@/services/progressService';
import { usePersonalizedTactics } from '@/hooks/usePersonalizedTactics';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * DashboardPanel - Quick stats and achievements for dashboard context
 */
export function DashboardPanel() {
  const { user } = useAuth();
  const { tactics, startingWeek, isLoading: tacticsLoading } = usePersonalizedTactics();
  const { data: progressData, isLoading: progressLoading } = useUserProgress(user?.id || '');

  const isLoading = tacticsLoading || progressLoading;

  if (isLoading) {
    return (
      <div className="px-2 py-2 space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  // Calculate stats from actual data
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
  const weekNumbers = [...new Set(tactics.map(t => t.week_assignment).filter(Boolean))].sort((a, b) => (a || 0) - (b || 0));
  const currentWeek = weekNumbers.find(week => {
    const weekTactics = tacticsWithProgress.filter(t => t.week_assignment === week);
    return weekTactics.some(t => t.status !== 'completed');
  }) || startingWeek || 1;

  // Calculate weekly completion
  const weekTactics = tacticsWithProgress.filter(t => t.week_assignment === currentWeek);
  const weekCompleted = weekTactics.filter(t => t.status === 'completed').length;

  // Get last completed tactic
  const lastCompleted = progressData
    ?.filter(p => p.status === 'completed' && p.completed_at)
    .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())[0];

  const lastCompletedTactic = lastCompleted
    ? tactics.find(t => t.tactic_id === lastCompleted.tactic_id)?.tactic_name
    : null;

  return (
    <div className="px-2 py-2 space-y-3">
      {/* Overall Progress */}
      <div className="rounded-lg border bg-card p-3 text-card-foreground">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Progress</span>
          </div>
          <span className="text-sm font-bold text-primary">{completionRate}%</span>
        </div>
        <Progress value={completionRate} className="h-2" />
        <p className="text-xs text-muted-foreground mt-2">
          {completedTactics} of {totalTactics} tactics completed
        </p>
      </div>

      {/* Current Week */}
      <div className="rounded-lg border bg-card p-3 text-card-foreground">
        <div className="flex items-center gap-2 mb-1">
          <Target className="h-4 w-4 text-secondary" />
          <span className="text-sm font-medium">Current Week</span>
        </div>
        <p className="text-2xl font-bold">Week {currentWeek}</p>
        <p className="text-xs text-muted-foreground">
          {weekCompleted} of {weekTactics.length} tactics this week
        </p>
      </div>

      {/* Active Tactics */}
      <div className="rounded-lg border bg-card p-3 text-card-foreground">
        <div className="flex items-center gap-2 mb-1">
          <Clock className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium">In Progress</span>
        </div>
        <p className="text-lg font-semibold">{inProgressTactics}</p>
        <p className="text-xs text-muted-foreground">active tactics</p>
      </div>

      {/* Recent Achievement */}
      {lastCompletedTactic && (
        <div className="rounded-lg border border-success/30 bg-success/5 p-3">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <span className="text-sm font-medium text-success">Last Completed</span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {lastCompletedTactic}
          </p>
        </div>
      )}
    </div>
  );
}

export default DashboardPanel;
