import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Award,
  Loader2,
  RefreshCw,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFunnelAnalytics, FunnelPhase } from '@/hooks/useCoachDashboard';
import { cn } from '@/lib/utils';

const PHASE_COLORS: Record<number, string> = {
  1: 'bg-blue-500',
  2: 'bg-purple-500',
  3: 'bg-orange-500',
  4: 'bg-green-500',
};

const PHASE_BG_COLORS: Record<number, string> = {
  1: 'bg-blue-50 border-blue-200',
  2: 'bg-purple-50 border-purple-200',
  3: 'bg-orange-50 border-orange-200',
  4: 'bg-green-50 border-green-200',
};

interface PhaseCardProps {
  phase: FunnelPhase;
}

const PhaseCard = ({ phase }: PhaseCardProps) => {
  // Safely get values with defaults
  const dropoffRate = phase.dropoff_rate ?? 0;
  const completionRate = phase.completion_rate ?? 0;
  const avgDays = phase.avg_days_in_phase ?? 0;

  const dropoffColor = dropoffRate > 30
    ? 'text-red-600'
    : dropoffRate > 15
      ? 'text-orange-600'
      : 'text-green-600';

  return (
    <div className={cn(
      "p-3 rounded-lg border transition-colors hover:shadow-sm",
      PHASE_BG_COLORS[phase.phase] || 'bg-muted'
    )}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0",
            PHASE_COLORS[phase.phase] || 'bg-gray-500'
          )}>
            {phase.phase}
          </div>
          <span className="font-medium text-sm">{phase.phase_name}</span>
        </div>
        <Badge variant="secondary" className="text-xs flex-shrink-0">
          {phase.user_count ?? 0}
        </Badge>
      </div>

      <div className="space-y-2">
        <Progress value={completionRate} className="h-2" />

        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground">
            {completionRate.toFixed(0)}% complete
          </span>
          <div className={cn("flex items-center gap-1", dropoffColor)}>
            {dropoffRate > 15 ? (
              <TrendingDown className="w-3 h-3" />
            ) : (
              <TrendingUp className="w-3 h-3" />
            )}
            {dropoffRate.toFixed(0)}%
          </div>
        </div>

        {avgDays > 0 && (
          <div className="text-xs text-muted-foreground text-center pt-1 border-t border-dashed">
            ~{avgDays.toFixed(0)} days avg
          </div>
        )}
      </div>
    </div>
  );
};

export const FunnelAnalytics = () => {
  const { data: funnelData, isLoading, refetch, isRefetching } = useFunnelAnalytics();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Course Funnel Analytics</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={cn("w-4 h-4", isRefetching && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !funnelData ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Target className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">No funnel data available</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Users className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">{funnelData.total_users}</p>
                <p className="text-xs text-muted-foreground">Total Users</p>
              </div>

              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Award className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">{funnelData.total_completions}</p>
                <p className="text-xs text-muted-foreground">Completions</p>
              </div>

              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {funnelData.overall_completion_rate.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">Completion Rate</p>
              </div>
            </div>

            {/* Phase Funnel */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Phase Breakdown</h4>
              <div className="grid grid-cols-2 gap-2">
                {funnelData.phases.map((phase) => (
                  <PhaseCard
                    key={phase.phase}
                    phase={phase}
                  />
                ))}
              </div>
            </div>

            {/* Danger Zones */}
            {funnelData.phases.some(p => (p.dropoff_rate ?? 0) > 30) && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="text-sm font-medium text-red-800 mb-2">
                  High Dropoff Phases
                </h4>
                <ul className="text-xs text-red-700 space-y-1">
                  {funnelData.phases
                    .filter(p => (p.dropoff_rate ?? 0) > 30)
                    .map(p => (
                      <li key={p.phase}>
                        Phase {p.phase} ({p.phase_name}): {(p.dropoff_rate ?? 0).toFixed(1)}% dropoff
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FunnelAnalytics;
