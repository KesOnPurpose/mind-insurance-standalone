import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Clock, Lock as LockIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PracticeType } from '@/types/practices';
import { PRACTICE_CONFIG } from '@/types/practices';
import { PROTECTInfoTooltip, type PROTECTLetter } from './PROTECTInfoTooltip';

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

  // Calculate points display (simplified - no late penalties)
  const basePoints = typeof practice.points === 'number' ? practice.points : 4;
  const displayPoints = pointsEarned !== undefined ? pointsEarned : basePoints;
  const isLateCompletion = false; // No late penalties in current system

  // Determine card state styling - Dark Navy Theme
  const cardClassName = cn(
    "relative transition-all duration-200 cursor-pointer min-h-[120px]",
    "bg-mi-navy-light border border-mi-cyan/20",
    "hover:border-mi-cyan/50 hover:shadow-lg active:scale-[0.98]",
    {
      "opacity-50 cursor-not-allowed border-mi-navy": !isAvailable,
      "border-mi-gold/50 bg-mi-gold/5": isCompleted,
    }
  );

  // Ensure minimum tap target size (44px) for mobile
  const buttonClassName = cn(
    "w-full h-full min-h-[44px] p-4 flex flex-col justify-between",
    "focus:outline-none focus:ring-2 focus:ring-mi-cyan focus:ring-offset-2 focus:ring-offset-mi-navy",
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

            {/* Practice Name with Info Tooltip */}
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-semibold text-base text-white">
                  {practice.name}
                </h3>
                <PROTECTInfoTooltip letter={practiceType as PROTECTLetter} />
              </div>
              <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                {practice.description}
              </p>
            </div>
          </div>

          {/* Status Icon */}
          <div className="flex-shrink-0">
            {isCompleted ? (
              <CheckCircle className="w-5 h-5 text-mi-gold" aria-label="Completed" />
            ) : isAvailable ? (
              <Clock className="w-5 h-5 text-mi-cyan" aria-label="Available now" />
            ) : (
              <LockIcon className="w-5 h-5 text-gray-500" aria-label="Locked" />
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
                "text-mi-gold": isCompleted,
                "text-orange-400": isLateCompletion,
                "text-mi-cyan": !isCompleted && isAvailable,
                "text-gray-500": !isAvailable
              }
            )}>
            {isCompleted ? `+${displayPoints}` : displayPoints}
          </span>
          <span className="text-xs text-gray-400">
            pts
          </span>
        </div>

        {/* Duration Estimate */}
        {!isCompleted && isAvailable && (
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            <span>{practice.estimatedDuration} min</span>
          </div>
        )}
      </div>
      </CardContent>
    </Card>
  );
};