// ============================================================================
// FEAT-GH-014: Program Overview Tab
// ============================================================================
// Summary metrics and overview for a program dashboard
// ============================================================================

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  BookOpen,
  Layers,
  Clock,
  TrendingUp,
  Award,
  BarChart3,
} from 'lucide-react';
import type { AdminProgram, AdminProgramLearner } from '@/types/programs';

// ============================================================================
// Types
// ============================================================================

interface ProgramOverviewTabProps {
  program: AdminProgram | null;
  learners: AdminProgramLearner[];
  isLoading: boolean;
}

// ============================================================================
// Stat Card Component
// ============================================================================

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
}

const StatCard = ({ title, value, subtitle, icon, trend }: StatCardProps) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 text-xs">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+{trend.value}%</span>
              <span className="text-muted-foreground">{trend.label}</span>
            </div>
          )}
        </div>
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

// ============================================================================
// Skeleton Loading
// ============================================================================

const OverviewSkeleton = () => (
  <div className="space-y-6">
    {/* Stats Grid Skeleton */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-12 w-12 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>

    {/* Progress Breakdown Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  </div>
);

// ============================================================================
// Main Component
// ============================================================================

export const ProgramOverviewTab = ({
  program,
  learners,
  isLoading,
}: ProgramOverviewTabProps) => {
  if (isLoading || !program) {
    return <OverviewSkeleton />;
  }

  // Calculate stats
  const completedLearners = learners.filter((l) => l.status === 'completed');
  const activeLearners = learners.filter((l) => l.status === 'active');
  const completionRate =
    learners.length > 0
      ? Math.round((completedLearners.length / learners.length) * 100)
      : 0;

  // Progress distribution
  const progressBuckets = {
    notStarted: learners.filter((l) => l.completion_percent === 0).length,
    inProgress: learners.filter(
      (l) => l.completion_percent > 0 && l.completion_percent < 50
    ).length,
    halfWay: learners.filter(
      (l) => l.completion_percent >= 50 && l.completion_percent < 100
    ).length,
    completed: learners.filter((l) => l.completion_percent === 100).length,
  };

  // Recent activity (learners with activity in last 7 days)
  const recentActivityLearners = learners
    .filter((l) => {
      if (!l.last_activity_at) return false;
      const activityDate = new Date(l.last_activity_at);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return activityDate >= sevenDaysAgo;
    })
    .sort((a, b) => {
      const dateA = new Date(a.last_activity_at || 0);
      const dateB = new Date(b.last_activity_at || 0);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Enrolled"
          value={program.enrolled_count}
          subtitle={`${activeLearners.length} active`}
          icon={<Users className="h-6 w-6 text-primary" />}
        />
        <StatCard
          title="Avg. Completion"
          value={`${program.avg_completion_percent}%`}
          subtitle="across all learners"
          icon={<BarChart3 className="h-6 w-6 text-primary" />}
        />
        <StatCard
          title="Completion Rate"
          value={`${completionRate}%`}
          subtitle={`${completedLearners.length} completed`}
          icon={<Award className="h-6 w-6 text-primary" />}
        />
        <StatCard
          title="Content"
          value={program.lesson_count}
          subtitle={`${program.phase_count} phases`}
          icon={<BookOpen className="h-6 w-6 text-primary" />}
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Progress Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Not Started</span>
                <span className="font-medium">{progressBuckets.notStarted}</span>
              </div>
              <Progress
                value={
                  learners.length > 0
                    ? (progressBuckets.notStarted / learners.length) * 100
                    : 0
                }
                className="h-2"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">1-49% Complete</span>
                <span className="font-medium">{progressBuckets.inProgress}</span>
              </div>
              <Progress
                value={
                  learners.length > 0
                    ? (progressBuckets.inProgress / learners.length) * 100
                    : 0
                }
                className="h-2"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">50-99% Complete</span>
                <span className="font-medium">{progressBuckets.halfWay}</span>
              </div>
              <Progress
                value={
                  learners.length > 0
                    ? (progressBuckets.halfWay / learners.length) * 100
                    : 0
                }
                className="h-2"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">100% Complete</span>
                <span className="font-medium">{progressBuckets.completed}</span>
              </div>
              <Progress
                value={
                  learners.length > 0
                    ? (progressBuckets.completed / learners.length) * 100
                    : 0
                }
                className="h-2"
              />
            </div>

            {learners.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No learners enrolled yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivityLearners.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent activity in the last 7 days
              </p>
            ) : (
              <div className="space-y-4">
                {recentActivityLearners.map((learner) => (
                  <div
                    key={learner.user_id}
                    className="flex items-center gap-3"
                  >
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                      {(learner.full_name || learner.email)
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {learner.full_name || learner.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {learner.completion_percent}% complete
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {learner.last_activity_at
                        ? formatRelativeTime(new Date(learner.last_activity_at))
                        : 'No activity'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Program Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Program Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd className="font-medium capitalize">{program.status}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Visibility</dt>
              <dd className="font-medium">
                {program.is_public ? 'Public' : 'Private'}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Instructor</dt>
              <dd className="font-medium">
                {program.instructor_name || 'Not set'}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Created</dt>
              <dd className="font-medium">
                {new Date(program.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
};

// ============================================================================
// Helper Functions
// ============================================================================

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default ProgramOverviewTab;
