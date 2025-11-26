import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Lock, Star } from 'lucide-react';
import { WeekSummary } from '@/types/tactic';

interface WeekSelectorProps {
  selectedWeek: number;
  visibleWeekSummaries: WeekSummary[];
  highestUnlockedWeek: number;
  onWeekChange: (week: number) => void;
}

export const WeekSelector = ({
  selectedWeek,
  visibleWeekSummaries,
  highestUnlockedWeek,
  onWeekChange
}: WeekSelectorProps) => {
  const canNavigatePrev = selectedWeek > 1;
  const canNavigateNext = selectedWeek < highestUnlockedWeek;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Select Week</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onWeekChange(selectedWeek - 1)}
            disabled={!canNavigatePrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-3 font-medium">Week {selectedWeek}</span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onWeekChange(selectedWeek + 1)}
            disabled={!canNavigateNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {visibleWeekSummaries.map((week) => {
          const isLocked = week.weekNumber > highestUnlockedWeek;
          const isSelected = week.weekNumber === selectedWeek;
          const progressPercent = week.totalTactics > 0
            ? (week.completedTactics / week.totalTactics) * 100
            : 0;

          return (
            <Card
              key={week.weekNumber}
              className={`
                relative cursor-pointer transition-all hover:shadow-md
                ${isSelected ? 'ring-2 ring-primary' : ''}
                ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}
                ${week.isRecommendedStart ? 'ring-2 ring-amber-500' : ''}
              `}
              onClick={() => !isLocked && onWeekChange(week.weekNumber)}
            >
              <div className="p-3">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold">Week {week.weekNumber}</span>
                  {isLocked && <Lock className="h-3 w-3 text-muted-foreground" />}
                  {week.isRecommendedStart && (
                    <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                  )}
                </div>

                <div className="space-y-2">
                  <Progress value={progressPercent} className="h-1.5" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{week.completedTactics}/{week.totalTactics}</span>
                    {week.inProgressTactics > 0 && (
                      <Badge variant="secondary" className="h-4 px-1 text-xs">
                        {week.inProgressTactics}
                      </Badge>
                    )}
                  </div>
                </div>

                {week.isRecommendedStart && (
                  <Badge
                    variant="outline"
                    className="w-full mt-2 text-xs justify-center border-amber-500 text-amber-700"
                  >
                    Start Here
                  </Badge>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {highestUnlockedWeek < visibleWeekSummaries.length && (
        <p className="text-sm text-muted-foreground mt-4 text-center">
          Complete more tactics to unlock additional weeks
        </p>
      )}
    </div>
  );
};