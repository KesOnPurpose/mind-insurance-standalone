/**
 * RKPI Dashboard: OverallScoreCard
 * Large score display with color-coded ring, trend arrow, and "This Week" label.
 */

import { Heart, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatScore, getScoreStyle, getTrendDirection, getTrendArrow, getTrendColor } from '@/utils/relationshipKpis';
import type { CheckInWithScores } from '@/types/relationship-kpis';

interface OverallScoreCardProps {
  overallScore: number | null;
  previousScore?: number | null;
  currentStreak: number;
  checkInDueThisWeek: boolean;
}

export function OverallScoreCard({
  overallScore,
  previousScore,
  currentStreak,
  checkInDueThisWeek,
}: OverallScoreCardProps) {
  const style = overallScore !== null ? getScoreStyle(overallScore) : null;
  const trend =
    overallScore !== null && previousScore !== null && previousScore !== undefined
      ? getTrendDirection(overallScore, previousScore)
      : null;

  const TrendIcon =
    trend === 'improving' ? TrendingUp : trend === 'declining' ? TrendingDown : Minus;

  return (
    <Card className="border-rose-500/20 bg-mi-navy-light shadow-lg overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-rose-400" />
            <span className="text-sm font-medium text-white/80">Relationship Health</span>
          </div>
          {checkInDueThisWeek && (
            <span className="text-xs bg-rose-500/20 text-rose-300 px-2 py-1 rounded-full">
              Check-in due
            </span>
          )}
        </div>

        {overallScore !== null ? (
          <div className="flex items-center gap-6">
            {/* Score ring */}
            <div className="relative flex-shrink-0">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-white/10"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${(overallScore / 10) * 263.9} 263.9`}
                  strokeLinecap="round"
                  className={style?.text ?? 'text-gray-400'}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-2xl font-bold ${style?.text ?? 'text-white'}`}>
                  {formatScore(overallScore)}
                </span>
              </div>
            </div>

            {/* Details */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium px-2 py-0.5 rounded ${style?.bg} ${style?.text}`}>
                  {style?.label}
                </span>
              </div>

              {trend && (
                <div className={`flex items-center gap-1 text-sm ${getTrendColor(trend)}`}>
                  <TrendIcon className="h-4 w-4" />
                  <span>
                    {trend === 'improving' ? 'Improving' : trend === 'declining' ? 'Declining' : 'Stable'}
                  </span>
                </div>
              )}

              {currentStreak > 0 && (
                <p className="text-xs text-white/60">
                  {currentStreak} week{currentStreak !== 1 ? 's' : ''} streak
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-white/60 text-sm">No scores yet</p>
            <p className="text-white/40 text-xs mt-1">Complete your first check-in to see your score</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
