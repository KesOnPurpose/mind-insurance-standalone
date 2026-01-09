import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserEngagement } from '@/services/adminAnalyticsService';
import type { TimeRange } from '@/types/adminAnalytics';
import {
  Users,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Calendar,
  MessageSquare,
  CheckCircle,
  Zap,
  AlertCircle,
  RefreshCcw,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ============================================================================
// USER ENGAGEMENT METRICS COMPONENT
// ============================================================================
// Displays comprehensive user engagement metrics for the admin dashboard
// Shows DAU, MAU, engagement ratios, and user behavior metrics
// Follows existing KPICards.tsx pattern with mobile-first responsive design
// ============================================================================

interface UserEngagementMetricsProps {
  timeRange: TimeRange;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
  target?: string;
  isGood?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  target,
  isGood = true,
}) => {
  const getTrendIcon = () => {
    if (!trend) return null;

    switch (trend) {
      case 'up':
        return <TrendingUp className={`h-4 w-4 ${isGood ? 'text-green-600' : 'text-red-600'}`} />;
      case 'down':
        return <TrendingDown className={`h-4 w-4 ${isGood ? 'text-red-600' : 'text-green-600'}`} />;
      case 'stable':
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground">{subtitle}</p>
          {trend && trendValue !== undefined && (
            <div className="flex items-center gap-1">
              {getTrendIcon()}
              <span className="text-xs font-medium">
                {trendValue.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
        {target && (
          <p className="text-xs mt-1">
            <span className="text-muted-foreground">Target: </span>
            <span className="font-medium">{target}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
};

const LoadingCard: React.FC = () => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-4 rounded-full" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-8 w-20 mb-1" />
      <Skeleton className="h-3 w-32" />
    </CardContent>
  </Card>
);

export const UserEngagementMetrics: React.FC<UserEngagementMetricsProps> = ({
  timeRange,
}) => {
  const { data: metrics, isLoading, error, refetch } = useUserEngagement(timeRange);

  if (error) {
    return (
      <div className="col-span-full">
        <Card className="border-destructive">
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-sm text-destructive">
                Failed to load engagement metrics: {error.message}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || !metrics) {
    return (
      <>
        {Array.from({ length: 12 }).map((_, index) => (
          <LoadingCard key={index} />
        ))}
      </>
    );
  }

  // Calculate engagement health status
  const getEngagementHealth = (ratio: number) => {
    if (ratio >= 0.4) return { status: 'Excellent', color: 'text-green-600' };
    if (ratio >= 0.3) return { status: 'Good', color: 'text-yellow-600' };
    if (ratio >= 0.2) return { status: 'Fair', color: 'text-amber-600' };
    return { status: 'Needs Improvement', color: 'text-red-600' };
  };

  const engagementHealth = getEngagementHealth(metrics.dau_mau_ratio);

  // Format percentage values
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  return (
    <>
      {/* DAU (Daily Active Users) */}
      <MetricCard
        title="Daily Active Users"
        value={metrics.daily_active_users.toLocaleString()}
        subtitle="Users active in last 24h"
        icon={<Users className="h-4 w-4 text-muted-foreground" />}
        trend={metrics.engagement_trend}
        trendValue={metrics.trend_percentage}
      />

      {/* MAU (Monthly Active Users) */}
      <MetricCard
        title="Monthly Active Users"
        value={metrics.monthly_active_users.toLocaleString()}
        subtitle="Users active in last 30d"
        icon={<Users className="h-4 w-4 text-muted-foreground" />}
      />

      {/* DAU/MAU Ratio */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">DAU/MAU Ratio</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatPercentage(metrics.dau_mau_ratio * 100)}
          </div>
          <p className={`text-xs ${engagementHealth.color}`}>
            {engagementHealth.status}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Target: 40% (healthy engagement)
          </p>
        </CardContent>
      </Card>

      {/* Messages per User */}
      <MetricCard
        title="Messages per User"
        value={metrics.messages_per_user_monthly.toFixed(1)}
        subtitle="Monthly average"
        icon={<MessageSquare className="h-4 w-4 text-muted-foreground" />}
        target="50+ messages"
        isGood={metrics.messages_per_user_monthly >= 50}
      />

      {/* Tactics Completed */}
      <MetricCard
        title="Tactics Completed"
        value={metrics.tactics_completed_weekly.toFixed(0)}
        subtitle="Weekly average"
        icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />}
        target="3-5 tactics"
        isGood={metrics.tactics_completed_weekly >= 3}
      />

      {/* Practice Streak */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Practice Streak</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics.avg_practice_streak_days.toFixed(0)} days
          </div>
          <p className="text-xs text-muted-foreground">
            Average streak length
          </p>
          <p className="text-xs mt-1">
            <span className="text-muted-foreground">Target: </span>
            <span className={`font-medium ${
              metrics.avg_practice_streak_days >= 7 ? 'text-green-600' : 'text-amber-600'
            }`}>
              7+ days
            </span>
          </p>
        </CardContent>
      </Card>

      {/* User Retention Rate */}
      <MetricCard
        title="User Retention"
        value={formatPercentage(metrics.user_retention_rate)}
        subtitle="Monthly retention rate"
        icon={<Target className="h-4 w-4 text-muted-foreground" />}
        target="85%+"
        isGood={metrics.user_retention_rate >= 85}
      />

      {/* Session Frequency */}
      <MetricCard
        title="Session Frequency"
        value={`${metrics.session_frequency.toFixed(1)}/week`}
        subtitle="Average sessions per user"
        icon={<Activity className="h-4 w-4 text-muted-foreground" />}
        target="4+ sessions"
        isGood={metrics.session_frequency >= 4}
      />

      {/* Feature Adoption Rate */}
      <MetricCard
        title="Feature Adoption"
        value={formatPercentage(metrics.feature_adoption_rate)}
        subtitle="Users using key features"
        icon={<Zap className="h-4 w-4 text-muted-foreground" />}
        target="75%+"
        isGood={metrics.feature_adoption_rate >= 75}
      />

      {/* Time to First Action */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Time to First Action</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics.time_to_first_action_minutes.toFixed(1)} min
          </div>
          <p className="text-xs text-muted-foreground">
            From login to meaningful action
          </p>
          <p className="text-xs mt-1">
            {metrics.time_to_first_action_minutes < 3 ? (
              <span className="text-green-600">Excellent onboarding</span>
            ) : metrics.time_to_first_action_minutes < 5 ? (
              <span className="text-yellow-600">Good onboarding</span>
            ) : (
              <span className="text-red-600">Needs optimization</span>
            )}
          </p>
        </CardContent>
      </Card>

      {/* Overall Engagement Status */}
      <Card className="hover:shadow-md transition-shadow col-span-full sm:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overall Engagement Status</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Trend</p>
              <div className="flex items-center gap-2">
                {metrics.engagement_trend === 'up' && (
                  <>
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span className="text-lg font-semibold text-green-600">
                      +{metrics.trend_percentage.toFixed(1)}%
                    </span>
                  </>
                )}
                {metrics.engagement_trend === 'down' && (
                  <>
                    <TrendingDown className="h-5 w-5 text-red-600" />
                    {metrics.trend_percentage === 100 ? (
                      <span className="text-lg font-semibold text-amber-600">
                        No recent activity
                      </span>
                    ) : (
                      <span className="text-lg font-semibold text-red-600">
                        -{metrics.trend_percentage.toFixed(1)}%
                      </span>
                    )}
                  </>
                )}
                {metrics.engagement_trend === 'stable' && (
                  <>
                    <Minus className="h-5 w-5 text-muted-foreground" />
                    <span className="text-lg font-semibold text-muted-foreground">
                      Stable
                    </span>
                  </>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Health Score</p>
              <div className="flex items-center gap-2">
                <div className={`text-lg font-semibold ${engagementHealth.color}`}>
                  {engagementHealth.status}
                </div>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Based on DAU/MAU ratio, user activity, and retention metrics
          </p>
        </CardContent>
      </Card>
    </>
  );
};