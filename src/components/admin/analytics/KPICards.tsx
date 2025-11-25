import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardKPIs } from '@/services/adminAnalyticsService';
import type { TimeRange } from '@/types/adminAnalytics';
import {
  Activity,
  TrendingUp,
  Zap,
  Users,
  AlertCircle,
  DollarSign,
  CheckCircle,
} from 'lucide-react';

// ============================================================================
// KPI CARDS COMPONENT
// ============================================================================
// Displays 7 key performance indicators for the admin dashboard
// Uses useDashboardKPIs hook from adminAnalyticsService
// Mobile-first responsive design with loading skeletons
// ============================================================================

interface KPICardsProps {
  timeRange: TimeRange;
}

export const KPICards: React.FC<KPICardsProps> = ({ timeRange }) => {
  const { data: kpis, isLoading, error } = useDashboardKPIs(timeRange);

  if (error) {
    return (
      <div className="col-span-full">
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-2 p-6">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-sm text-destructive">
              Failed to load KPIs: {error.message}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || !kpis) {
    return (
      <>
        {Array.from({ length: 7 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </>
    );
  }

  // Calculate cost savings estimate (cached requests save ~$0.002 per request)
  const costSavings = Math.round(
    (kpis.total_conversations_today * (kpis.cache_efficiency / 100) * 0.002)
  );

  // Calculate uptime percentage (simplified - would need actual error tracking)
  const uptime = 100 - kpis.error_rate;

  return (
    <>
      {/* Total Requests */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {kpis.total_conversations_today.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Today's conversation volume
          </p>
        </CardContent>
      </Card>

      {/* Cache Hit Rate */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {kpis.cache_efficiency.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">
            {kpis.cache_efficiency >= 80 ? (
              <span className="text-green-600">Excellent performance</span>
            ) : kpis.cache_efficiency >= 60 ? (
              <span className="text-yellow-600">Good performance</span>
            ) : (
              <span className="text-red-600">Needs optimization</span>
            )}
          </p>
        </CardContent>
      </Card>

      {/* Average Response Time */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {kpis.avg_response_time_ms.toFixed(0)}ms
          </div>
          <p className="text-xs text-muted-foreground">
            {kpis.avg_response_time_ms < 1000 ? (
              <span className="text-green-600">Fast responses</span>
            ) : kpis.avg_response_time_ms < 2000 ? (
              <span className="text-yellow-600">Acceptable speed</span>
            ) : (
              <span className="text-red-600">Slow responses</span>
            )}
          </p>
        </CardContent>
      </Card>

      {/* Active Users */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {kpis.daily_active_users.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Daily active participants
          </p>
        </CardContent>
      </Card>

      {/* Error Rate */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {kpis.error_rate.toFixed(2)}%
          </div>
          <p className="text-xs text-muted-foreground">
            {kpis.error_rate < 1 ? (
              <span className="text-green-600">Excellent reliability</span>
            ) : kpis.error_rate < 5 ? (
              <span className="text-yellow-600">Monitor closely</span>
            ) : (
              <span className="text-red-600">Action required</span>
            )}
          </p>
        </CardContent>
      </Card>

      {/* Cost Savings */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cost Savings</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${costSavings.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            Saved via caching today
          </p>
        </CardContent>
      </Card>

      {/* System Uptime */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {uptime.toFixed(2)}%
          </div>
          <p className="text-xs text-muted-foreground">
            {uptime >= 99.9 ? (
              <span className="text-green-600">Outstanding</span>
            ) : uptime >= 99 ? (
              <span className="text-green-600">Excellent</span>
            ) : (
              <span className="text-yellow-600">Needs improvement</span>
            )}
          </p>
        </CardContent>
      </Card>
    </>
  );
};
