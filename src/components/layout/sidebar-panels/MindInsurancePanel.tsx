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
      {/* Current Streak - Gold accent for achievements */}
      <div className="rounded-lg border border-mi-gold/30 bg-gradient-to-br from-mi-gold/10 to-mi-cyan/5 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-mi-gold" />
            <span className="text-sm font-medium text-white">Current Streak</span>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-mi-gold">{data.currentStreak}</p>
            <p className="text-xs text-gray-400">days</p>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Best: {data.longestStreak} days
        </p>
      </div>

      {/* Weekly Progress - Cyan accent for progress */}
      <div className="rounded-lg border border-mi-cyan/30 bg-mi-navy-light p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-mi-cyan" />
            <span className="text-sm font-medium text-white">This Week</span>
          </div>
          <span className="text-sm font-medium text-mi-cyan">
            {data.weeklyPractices}/{data.weeklyGoal}
          </span>
        </div>
        <div className="h-2 w-full bg-mi-navy rounded-full overflow-hidden">
          <div
            className="h-full bg-mi-cyan rounded-full transition-all duration-300"
            style={{ width: `${weeklyProgress}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">
          {data.weeklyGoal - data.weeklyPractices} more to reach your goal
        </p>
      </div>

      {/* Pattern Awareness - Cyan accent */}
      <div className="rounded-lg border border-mi-cyan/20 bg-mi-navy-light p-3">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="h-4 w-4 text-mi-cyan" />
          <span className="text-sm font-medium text-white">Pattern Awareness</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 flex-1 bg-mi-navy rounded-full overflow-hidden">
            <div
              className="h-full bg-mi-cyan rounded-full transition-all duration-300"
              style={{ width: `${data.patternAwareness}%` }}
            />
          </div>
          <span className="text-sm font-bold text-mi-cyan">
            {data.patternAwareness}%
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Your ability to spot patterns is improving
        </p>
      </div>

      {/* Recent Win - Gold accent for victories */}
      {data.recentWin && (
        <div className="rounded-lg border border-mi-gold/30 bg-mi-gold/5 p-3">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="h-4 w-4 text-mi-gold" />
            <span className="text-sm font-medium text-mi-gold">Recent Win</span>
          </div>
          <p className="text-xs text-gray-400 line-clamp-2">
            {data.recentWin}
          </p>
        </div>
      )}
    </div>
  );
}

export default MindInsurancePanel;
