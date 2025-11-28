import { Flame, Brain, Shield, Trophy, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useMindInsuranceProgress } from '@/hooks/useMindInsuranceProgress';

/**
 * MindInsurancePanel - PROTECT practice streak and insights
 *
 * Shows:
 * - Current streak
 * - Weekly practice progress
 * - Pattern awareness score
 * - Recent wins
 */
export function MindInsurancePanel() {
  const { data: practiceData, isLoading, error } = useMindInsuranceProgress();

  // Loading state with skeleton
  if (isLoading) {
    return (
      <div className="px-2 py-2 space-y-3">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="px-2 py-2">
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <p className="text-sm text-destructive">Unable to load practice data</p>
          <p className="text-xs text-muted-foreground mt-1">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  // Default values if data is not yet available
  const data = practiceData || {
    currentStreak: 0,
    longestStreak: 0,
    weeklyPractices: 0,
    weeklyGoal: 49,
    patternAwareness: 0,
    recentWin: null,
  };

  const weeklyProgress = Math.round((data.weeklyPractices / data.weeklyGoal) * 100);

  return (
    <div className="px-2 py-2 space-y-3">
      {/* Current Streak */}
      <div className="rounded-lg border bg-gradient-to-br from-primary/10 to-secondary/10 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-secondary" />
            <span className="text-sm font-medium">Current Streak</span>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-secondary">{data.currentStreak}</p>
            <p className="text-xs text-muted-foreground">days</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Best: {data.longestStreak} days
        </p>
      </div>

      {/* Weekly Progress */}
      <div className="rounded-lg border bg-card p-3 text-card-foreground">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">This Week</span>
          </div>
          <span className="text-sm font-medium">
            {data.weeklyPractices}/{data.weeklyGoal}
          </span>
        </div>
        <Progress value={weeklyProgress} className="h-2" />
        <p className="text-xs text-muted-foreground mt-1">
          {data.weeklyGoal - data.weeklyPractices} more to reach your goal
        </p>
      </div>

      {/* Pattern Awareness */}
      <div className="rounded-lg border bg-card p-3 text-card-foreground">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="h-4 w-4 text-purple-500" />
          <span className="text-sm font-medium">Pattern Awareness</span>
        </div>
        <div className="flex items-center gap-2">
          <Progress value={data.patternAwareness} className="h-2 flex-1" />
          <span className="text-sm font-bold text-purple-500">
            {data.patternAwareness}%
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Your ability to spot patterns is improving
        </p>
      </div>

      {/* Recent Win */}
      {data.recentWin && (
        <div className="rounded-lg border border-success/30 bg-success/5 p-3">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="h-4 w-4 text-success" />
            <span className="text-sm font-medium text-success">Recent Win</span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {data.recentWin}
          </p>
        </div>
      )}
    </div>
  );
}

export default MindInsurancePanel;
