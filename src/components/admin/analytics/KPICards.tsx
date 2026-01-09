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
  MessageSquare,
  HelpCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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

  // Safely access KPI values with defaults for null/undefined
  const safeKpis = {
    total_conversations_today: kpis.total_conversations_today ?? 0,
    total_conversations_all_time: kpis.total_conversations_all_time ?? 0,
    conversations_by_agent: kpis.conversations_by_agent ?? {},
    cache_efficiency: kpis.cache_efficiency ?? 0,
    avg_response_time_ms: kpis.avg_response_time_ms ?? 0,
    daily_active_users: kpis.daily_active_users ?? 0,
    error_rate: kpis.error_rate ?? 0,
    system_health_score: kpis.system_health_score ?? 0,
    ai_quality_score: kpis.ai_quality_score ?? 0,
    routing_accuracy: kpis.routing_accuracy ?? 0,
  };

  // Get agent breakdown for display
  const agentBreakdown = Object.entries(safeKpis.conversations_by_agent)
    .sort(([, a], [, b]) => b - a); // Sort by count descending

  // Calculate cost savings estimate (cached requests save ~$0.002 per request)
  const costSavings = Math.round(
    (safeKpis.total_conversations_today * (safeKpis.cache_efficiency / 100) * 0.002)
  );

  // Calculate uptime percentage (simplified - would need actual error tracking)
  const uptime = 100 - safeKpis.error_rate;

  return (
    <>
      {/* Total Conversations (All Time) - Featured Card */}
      <Card className="hover:shadow-md transition-shadow border-primary/20 bg-gradient-to-br from-primary/5 to-background">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
          <MessageSquare className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">
            {safeKpis.total_conversations_all_time.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            All synced conversations
          </p>
          {agentBreakdown.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {agentBreakdown.map(([agent, count]) => (
                <Badge key={agent} variant="secondary" className="text-xs">
                  {agent.charAt(0).toUpperCase() + agent.slice(1)}: {count.toLocaleString()}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Requests */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Today's Requests</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {safeKpis.total_conversations_today.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Conversations in selected period
          </p>
        </CardContent>
      </Card>

      {/* Cache Hit Rate */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-1">
            Cache Hit Rate
            {safeKpis.cache_efficiency === 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Cache metrics are not currently collected from the chat system. This requires tracking in the N8N workflow.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {safeKpis.cache_efficiency === 0 ? (
            <>
              <div className="text-2xl font-bold text-muted-foreground">
                N/A
              </div>
              <p className="text-xs text-muted-foreground">
                Not tracked
              </p>
            </>
          ) : (
            <>
              <div className="text-2xl font-bold">
                {safeKpis.cache_efficiency.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {safeKpis.cache_efficiency >= 80 ? (
                  <span className="text-green-600">Excellent performance</span>
                ) : safeKpis.cache_efficiency >= 60 ? (
                  <span className="text-yellow-600">Good performance</span>
                ) : (
                  <span className="text-red-600">Needs optimization</span>
                )}
              </p>
            </>
          )}
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
            {safeKpis.avg_response_time_ms.toFixed(0)}ms
          </div>
          <p className="text-xs text-muted-foreground">
            {safeKpis.avg_response_time_ms < 1000 ? (
              <span className="text-green-600">Fast responses</span>
            ) : safeKpis.avg_response_time_ms < 2000 ? (
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
          <CardTitle className="text-sm font-medium flex items-center gap-1">
            Verified Users
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Users with verified IDs from MIO conversations. Nette/ME chats use session IDs (not linked to users).</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {safeKpis.daily_active_users.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            From MIO conversations
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
            {safeKpis.error_rate.toFixed(2)}%
          </div>
          <p className="text-xs text-muted-foreground">
            {safeKpis.error_rate < 1 ? (
              <span className="text-green-600">Excellent reliability</span>
            ) : safeKpis.error_rate < 5 ? (
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
