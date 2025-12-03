import { TrendingUp, Target, Clock, CheckCircle2, User, Award, MessageSquare, Map, Building, DollarSign } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUserProgress } from '@/services/progressService';
import { usePersonalizedTactics } from '@/hooks/usePersonalizedTactics';
import { useAuth } from '@/contexts/AuthContext';
import { useJourneyContext } from '@/hooks/useJourneyContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';

/**
 * DashboardPanel - Enhanced sidebar for dashboard context
 *
 * Shows:
 * - Journey progress card
 * - Profile snapshot
 * - Assessment score summary
 * - Quick actions
 */
export function DashboardPanel() {
  const { user } = useAuth();
  const { tactics, assessment, isLoading: tacticsLoading } = usePersonalizedTactics();
  const { data: progressData, isLoading: progressLoading } = useUserProgress(user?.id || '');
  const journey = useJourneyContext();

  const isLoading = tacticsLoading || progressLoading || journey.isLoading;

  if (isLoading) {
    return (
      <div className="px-2 py-2 space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  // Calculate in-progress count
  const inProgressTactics = progressData?.filter(p => p.status === 'in_progress').length || 0;

  // Get last completed tactic
  const lastCompleted = progressData
    ?.filter(p => p.status === 'completed' && p.completed_at)
    .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())[0];

  const lastCompletedTactic = lastCompleted
    ? tactics.find(t => t.tactic_id === lastCompleted.tactic_id)?.tactic_name
    : null;

  // Format ownership model for display
  const formatOwnershipModel = (model: string | undefined) => {
    if (!model) return null;
    return model.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Format readiness level
  const getReadinessColor = (level: string | undefined) => {
    switch (level?.toLowerCase()) {
      case 'ready': return 'text-green-600 bg-green-50 border-green-200';
      case 'developing': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'beginning': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="px-2 py-2 space-y-3">
      {/* Journey Progress Card */}
      <div className="rounded-lg border bg-gradient-to-br from-primary/10 to-primary/5 p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Progress</span>
          </div>
          <span className="text-sm font-bold text-primary">{journey.completionRate}%</span>
        </div>
        <Progress value={journey.completionRate} className="h-2 mb-2" />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{journey.completedTactics} of {journey.totalTactics} tactics</span>
          <Badge variant="outline" className="text-xs h-5">
            Week {journey.currentWeek}
          </Badge>
        </div>
      </div>

      {/* Profile Snapshot */}
      {assessment && (
        <div className="rounded-lg border bg-card p-3">
          <div className="flex items-center gap-2 mb-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Your Profile</span>
          </div>

          <div className="space-y-2">
            {assessment.ownership_model && (
              <div className="flex items-center gap-2">
                <Building className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs">{formatOwnershipModel(assessment.ownership_model)}</span>
              </div>
            )}
            {assessment.capital_available && (
              <div className="flex items-center gap-2">
                <DollarSign className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs">{assessment.capital_available}</span>
              </div>
            )}
            {assessment.target_state && (
              <div className="flex items-center gap-2">
                <Target className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs">{assessment.target_state}</span>
              </div>
            )}
          </div>

          <Link to="/dashboard?section=profile" className="block mt-2">
            <Button variant="ghost" size="sm" className="w-full h-7 text-xs">
              Edit Profile
            </Button>
          </Link>
        </div>
      )}

      {/* Assessment Score Summary */}
      {assessment && (
        <div className="rounded-lg border bg-card p-3">
          <div className="flex items-center gap-2 mb-2">
            <Award className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium">Readiness</span>
          </div>

          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline" className={`text-xs ${getReadinessColor(assessment.readiness_level)}`}>
              {assessment.readiness_level || 'Unknown'}
            </Badge>
            {assessment.overall_score && (
              <span className="text-lg font-bold text-primary">
                {Math.round(assessment.overall_score)}%
              </span>
            )}
          </div>

          {assessment.immediate_priority && (
            <p className="text-xs text-muted-foreground">
              Focus: {assessment.immediate_priority.replace(/_/g, ' ')}
            </p>
          )}
        </div>
      )}

      {/* Active Tactics */}
      <div className="rounded-lg border bg-card p-3">
        <div className="flex items-center gap-2 mb-1">
          <Clock className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium">In Progress</span>
        </div>
        <p className="text-lg font-semibold">{inProgressTactics}</p>
        <p className="text-xs text-muted-foreground">active tactics</p>
      </div>

      {/* Recent Achievement */}
      {lastCompletedTactic && (
        <div className="rounded-lg border border-success/30 bg-success/5 p-3">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <span className="text-sm font-medium text-success">Last Completed</span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {lastCompletedTactic}
          </p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="rounded-lg border bg-card p-3">
        <span className="text-xs font-medium text-muted-foreground mb-2 block">Quick Actions</span>
        <div className="space-y-1">
          <Link to="/chat" className="block">
            <Button variant="ghost" size="sm" className="w-full justify-start h-8 text-xs">
              <MessageSquare className="h-3 w-3 mr-2" />
              Ask Nette
            </Button>
          </Link>
          <Link to="/roadmap" className="block">
            <Button variant="ghost" size="sm" className="w-full justify-start h-8 text-xs">
              <Map className="h-3 w-3 mr-2" />
              View Roadmap
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default DashboardPanel;
