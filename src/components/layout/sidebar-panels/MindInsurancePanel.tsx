import { Flame, Brain, Shield, Trophy } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

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
  // TODO: Connect to actual practice data via useMindInsuranceProgress hook
  const practiceData = {
    currentStreak: 5,
    longestStreak: 12,
    weeklyPractices: 4,
    weeklyGoal: 7,
    patternAwareness: 72,
    recentWin: "Caught my 'not enough time' excuse pattern",
  };

  const weeklyProgress = Math.round((practiceData.weeklyPractices / practiceData.weeklyGoal) * 100);

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
            <p className="text-2xl font-bold text-secondary">{practiceData.currentStreak}</p>
            <p className="text-xs text-muted-foreground">days</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Best: {practiceData.longestStreak} days
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
            {practiceData.weeklyPractices}/{practiceData.weeklyGoal}
          </span>
        </div>
        <Progress value={weeklyProgress} className="h-2" />
        <p className="text-xs text-muted-foreground mt-1">
          {practiceData.weeklyGoal - practiceData.weeklyPractices} more to reach your goal
        </p>
      </div>

      {/* Pattern Awareness */}
      <div className="rounded-lg border bg-card p-3 text-card-foreground">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="h-4 w-4 text-purple-500" />
          <span className="text-sm font-medium">Pattern Awareness</span>
        </div>
        <div className="flex items-center gap-2">
          <Progress value={practiceData.patternAwareness} className="h-2 flex-1" />
          <span className="text-sm font-bold text-purple-500">
            {practiceData.patternAwareness}%
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Your ability to spot patterns is improving
        </p>
      </div>

      {/* Recent Win */}
      {practiceData.recentWin && (
        <div className="rounded-lg border border-success/30 bg-success/5 p-3">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="h-4 w-4 text-success" />
            <span className="text-sm font-medium text-success">Recent Win</span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {practiceData.recentWin}
          </p>
        </div>
      )}
    </div>
  );
}

export default MindInsurancePanel;
