import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, Lock as LockIcon } from 'lucide-react';
import { JOURNEY_PHASES } from '@/config/categories';
import { JourneyPhase } from '@/types/tactic';
import { cn } from '@/lib/utils';

interface JourneyMapProps {
  currentPhase: JourneyPhase;
  phaseProgress: Record<JourneyPhase, number>;
  completedMilestones?: string[];
}

export function JourneyMap({ currentPhase, phaseProgress, completedMilestones = [] }: JourneyMapProps) {
  const currentPhaseIndex = JOURNEY_PHASES.findIndex(p => p.phase === currentPhase);

  const getPhaseStatus = (index: number): 'completed' | 'current' | 'locked' => {
    if (index < currentPhaseIndex) return 'completed';
    if (index === currentPhaseIndex) return 'current';
    return 'locked';
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-background to-muted/20">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Your Journey Map</h2>
        <p className="text-muted-foreground">Track your progress through the 5 phases of building your RCFE</p>
      </div>

      {/* Desktop Timeline - Horizontal */}
      <div className="hidden md:block">
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute top-12 left-0 right-0 h-1 bg-border">
            <div 
              className="h-full bg-primary transition-all duration-500"
              style={{ 
                width: `${(currentPhaseIndex / (JOURNEY_PHASES.length - 1)) * 100}%` 
              }}
            />
          </div>

          {/* Phase Nodes */}
          <div className="relative flex justify-between">
            {JOURNEY_PHASES.map((phase, index) => {
              const status = getPhaseStatus(index);
              const progress = phaseProgress[phase.phase] || 0;

              return (
                <div key={phase.phase} className="flex flex-col items-center w-1/5">
                  {/* Node Circle */}
                  <div className={cn(
                    "relative z-10 w-24 h-24 rounded-full flex items-center justify-center text-4xl mb-4 transition-all duration-300",
                    status === 'completed' && "bg-primary text-primary-foreground shadow-lg shadow-primary/20",
                    status === 'current' && "bg-primary text-primary-foreground shadow-xl shadow-primary/30 scale-110 ring-4 ring-primary/20",
                    status === 'locked' && "bg-muted text-muted-foreground"
                  )}>
                    {status === 'completed' && (
                      <CheckCircle className="absolute -top-2 -right-2 w-8 h-8 text-success bg-background rounded-full" />
                    )}
                    {status === 'locked' && (
                      <LockIcon className="absolute -top-2 -right-2 w-6 h-6 text-muted-foreground bg-background rounded-full p-1" />
                    )}
                    <span>{phase.icon}</span>
                  </div>

                  {/* Phase Info */}
                  <div className="text-center">
                    <h3 className={cn(
                      "font-semibold mb-1 transition-colors",
                      status === 'current' && "text-primary",
                      status === 'locked' && "text-muted-foreground"
                    )}>
                      {phase.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-2 px-2">
                      {phase.description}
                    </p>
                    <Badge variant={status === 'current' ? 'default' : 'secondary'} className="text-xs">
                      Weeks {phase.weeks.join('-')}
                    </Badge>

                    {/* Progress Bar for Current/Completed Phases */}
                    {status !== 'locked' && (
                      <div className="mt-3 px-2">
                        <Progress value={progress} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          {progress.toFixed(0)}% Complete
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile Timeline - Vertical */}
      <div className="md:hidden space-y-4">
        {JOURNEY_PHASES.map((phase, index) => {
          const status = getPhaseStatus(index);
          const progress = phaseProgress[phase.phase] || 0;

          return (
            <div key={phase.phase} className="relative">
              {/* Connector Line */}
              {index < JOURNEY_PHASES.length - 1 && (
                <div className="absolute left-8 top-16 bottom-0 w-1 bg-border -mb-4">
                  {status === 'completed' && (
                    <div className="w-full h-full bg-primary" />
                  )}
                </div>
              )}

              <div className="flex gap-4">
                {/* Node Circle */}
                <div className={cn(
                  "relative z-10 w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all flex-shrink-0",
                  status === 'completed' && "bg-primary text-primary-foreground shadow-lg shadow-primary/20",
                  status === 'current' && "bg-primary text-primary-foreground shadow-xl shadow-primary/30 ring-4 ring-primary/20",
                  status === 'locked' && "bg-muted text-muted-foreground"
                )}>
                  {status === 'completed' && (
                    <CheckCircle className="absolute -top-1 -right-1 w-6 h-6 text-success bg-background rounded-full" />
                  )}
                  {status === 'locked' && (
                    <LockIcon className="absolute -top-1 -right-1 w-5 h-5 text-muted-foreground bg-background rounded-full p-0.5" />
                  )}
                  <span>{phase.icon}</span>
                </div>

                {/* Phase Info */}
                <div className="flex-1 pb-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className={cn(
                      "font-semibold",
                      status === 'current' && "text-primary",
                      status === 'locked' && "text-muted-foreground"
                    )}>
                      {phase.name}
                    </h3>
                    <Badge variant={status === 'current' ? 'default' : 'secondary'} className="text-xs">
                      Weeks {phase.weeks.join('-')}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {phase.description}
                  </p>

                  {/* Progress Bar for Current/Completed Phases */}
                  {status !== 'locked' && (
                    <div>
                      <Progress value={progress} className="h-2 mb-1" />
                      <p className="text-xs text-muted-foreground">
                        {progress.toFixed(0)}% Complete
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Milestones Section */}
      {completedMilestones.length > 0 && (
        <div className="mt-8 pt-6 border-t">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <span>🏆</span> Recent Achievements
          </h3>
          <div className="flex flex-wrap gap-2">
            {completedMilestones.map((milestone, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                <CheckCircle className="w-3 h-3 mr-1" />
                {milestone}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
