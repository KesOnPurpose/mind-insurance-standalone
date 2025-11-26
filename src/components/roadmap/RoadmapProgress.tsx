import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Trophy, Award, Star } from 'lucide-react';

interface RoadmapProgressProps {
  completedTactics: number;
  inProgressTactics: number;
  totalTactics: number;
  overallProgressPercent: number;
  milestones: Array<{
    name: string;
    achieved: boolean;
    icon: React.ReactNode;
  }>;
}

export const RoadmapProgress = ({
  completedTactics,
  inProgressTactics,
  totalTactics,
  overallProgressPercent,
  milestones
}: RoadmapProgressProps) => {
  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-4 flex-1">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">Overall Progress</h3>
                <span className="text-2xl font-bold text-primary">
                  {Math.round(overallProgressPercent)}%
                </span>
              </div>
              <Progress value={overallProgressPercent} className="h-3" />
            </div>

            <div className="flex gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Completed:</span>
                <span className="font-semibold ml-1">{completedTactics}</span>
              </div>
              <div>
                <span className="text-muted-foreground">In Progress:</span>
                <span className="font-semibold ml-1">{inProgressTactics}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Total:</span>
                <span className="font-semibold ml-1">{totalTactics}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {milestones.map((milestone, index) => (
              <Badge
                key={index}
                variant={milestone.achieved ? 'default' : 'outline'}
                className="flex items-center gap-1 py-1 px-2"
              >
                {milestone.icon}
                {milestone.name}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};