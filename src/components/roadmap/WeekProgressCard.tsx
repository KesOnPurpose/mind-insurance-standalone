import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Lock as LockIcon, CheckCircle, Clock } from 'lucide-react';
import { WeekSummary } from '@/types/tactic';
import { JOURNEY_PHASES } from '@/config/categories';

interface WeekProgressCardProps {
  week: WeekSummary;
  isActive: boolean;
  onClick: () => void;
}

export function WeekProgressCard({ week, isActive, onClick }: WeekProgressCardProps) {
  const phase = JOURNEY_PHASES.find(p => p.phase === week.phase);
  const isCompleted = week.progressPercentage === 100;
  
  return (
    <Card 
      className={`p-4 cursor-pointer transition-all hover:shadow-md ${
        isActive ? 'ring-2 ring-primary shadow-lg' : ''
      } ${!week.isUnlocked ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={week.isUnlocked ? onClick : undefined}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{phase?.icon}</span>
          <div>
            <h3 className="font-semibold text-sm">Week {week.weekNumber}</h3>
            <p className="text-xs text-muted-foreground">{week.weekTitle}</p>
          </div>
        </div>
        
        {!week.isUnlocked && <LockIcon className="w-4 h-4 text-muted-foreground" />}
        {isCompleted && <CheckCircle className="w-5 h-5 text-success" />}
        {week.isRecommendedStart && (
          <Badge variant="secondary" className="text-xs">Start Here</Badge>
        )}
      </div>
      
      <Progress value={week.progressPercentage} className="h-2 mb-2" />
      
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{week.completedTactics}/{week.totalTactics} tactics</span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {week.estimatedHours.toFixed(1)}h
        </span>
      </div>
    </Card>
  );
}
