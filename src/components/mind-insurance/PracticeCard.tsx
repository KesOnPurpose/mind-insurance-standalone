import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Clock, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PracticeType } from '@/types/practices';
import { PRACTICE_CONFIG } from '@/types/practices';

interface PracticeCardProps {
  practiceType: PracticeType;
  isCompleted: boolean;
  isAvailable: boolean;
  pointsEarned?: number;
  onClick: () => void;
}

// Icon mapping for each practice type
const PRACTICE_ICONS: Record<PracticeType, React.ReactNode> = {
  P: '🔍', // Pattern Check - magnifying glass for catching patterns
  R: '💪', // Reinforce Identity - muscle for strength
  O: '🎯', // Outcome Visualization - target for goals
  T: '⚡', // Trigger Reset - lightning for quick response
  E: '🔋', // Energy Audit - battery for energy management
  C: '🏆', // Celebrate Wins - trophy for victories
  T2: '🚀' // Tomorrow Setup - rocket for launch
};

export const PracticeCard = ({
  practiceType,
  isCompleted,
  isAvailable,
  pointsEarned,
  onClick
}: PracticeCardProps) => {
  const practice = PRACTICE_CONFIG[practiceType];

  // Calculate points display
  const basePoints = practice.points.onTime;
  const latePoints = practice.points.late;
  const displayPoints = pointsEarned !== undefined ? pointsEarned : basePoints;
  const isLateCompletion = isCompleted && pointsEarned !== undefined && pointsEarned < basePoints;

  // Determine card state styling
  const cardClassName = cn(
    "relative transition-all duration-200 cursor-pointer min-h-[120px]",
    "hover:shadow-md active:scale-[0.98]",
    {
      "opacity-50 cursor-not-allowed": !isAvailable,
      "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800": isCompleted,
      "hover:border-primary/50": isAvailable && !isCompleted
    }
  );

  // Ensure minimum tap target size (44px) for mobile
  const buttonClassName = cn(
    "w-full h-full min-h-[44px] p-4 flex flex-col justify-between",
    "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
    {
      "pointer-events-none": !isAvailable
    }
  );

  return (
    <Card
      className={cardClassName}
      onClick={isAvailable ? onClick : undefined}
      role="button"
      aria-label={`${practice.name} practice - ${isCompleted ? 'Completed' : isAvailable ? 'Available' : 'Locked'}`}
      aria-disabled={!isAvailable}
      tabIndex={isAvailable ? 0 : -1}
      onKeyDown={(e) => {
        if (isAvailable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <CardContent className={buttonClassName}>
        {/* Header Row - Icon, Name, Status */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Practice Icon */}
            <div className="text-2xl" role="img" aria-label={practice.name}>
              {PRACTICE_ICONS[practiceType]}
            </div>

            {/* Practice Name */}
            <div>
              <h3 className="font-semibold text-base">
                {practice.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {practice.description}
              </p>
            </div>
          </div>

          {/* Status Icon */}
          <div className="flex-shrink-0">
            {isCompleted ? (
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" aria-label="Completed" />
            ) : isAvailable ? (
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-label="Available now" />
            ) : (
              <Lock className="w-5 h-5 text-gray-400" aria-label="Locked" />
            )}
          </div>
        </div>

        {/* Footer Row - Points and Duration */}
        <div className="flex items-end justify-between mt-3">
          {/* Points Display */}
          <div className="flex items-baseline gap-1">
            <span className={cn(
              "text-lg font-bold",
              {
                "text-green-600 dark:text-green-400": isCompleted,
                "text-orange-600 dark:text-orange-400": isLateCompletion,
                "text-foreground": !isCompleted && isAvailable,
                "text-muted-foreground": !isAvailable
              }
            )}>
              {isCompleted ? `+${displayPoints}` : displayPoints}
            </span>
            <span className="text-xs text-muted-foreground">
              pts
            </span>
            {isLateCompletion && (
              <span className="text-xs text-orange-600 dark:text-orange-400 ml-1">
                (late: -{basePoints - latePoints})
              </span>
            )}
          </div>

          {/* Duration Estimate */}
          {!isCompleted && isAvailable && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{practice.estimatedDuration} min</span>
            </div>
          )}
        </div>

        {/* Late Penalty Warning (if not completed and available) */}
        {!isCompleted && isAvailable && latePoints < basePoints && (
          <div className="absolute -bottom-1 left-4 right-4">
            <div className="text-[10px] text-center text-muted-foreground bg-background px-2">
              Late: {latePoints} pts
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};