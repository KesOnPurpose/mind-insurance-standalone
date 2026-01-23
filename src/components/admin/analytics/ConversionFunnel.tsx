import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TimeRange } from '@/types/adminAnalytics';
import { AlertCircle, TrendingDown, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ============================================================================
// CONVERSION FUNNEL COMPONENT
// ============================================================================
// Displays 5-stage user journey funnel from signup to Week 1 completion
// Visual funnel bars with decreasing width showing drop-off rates
// Color-coded borders based on conversion rate vs target
// Mobile-first responsive design
// ============================================================================

interface ConversionFunnelProps {
  timeRange: TimeRange;
}

interface FunnelStage {
  name: string;
  count: number;
  percentage: number;
  target: number;
  width: number; // Visual width percentage
}

interface FunnelData {
  stages: FunnelStage[];
  totalSignups: number;
}

// Helper function to batch large queries to avoid URL length limits
async function batchQuery<T>(
  userIds: string[],
  queryFn: (batchIds: string[]) => Promise<T[]>
): Promise<T[]> {
  const BATCH_SIZE = 50; // Safe batch size to avoid URL limits
  const results: T[] = [];

  for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
    const batchIds = userIds.slice(i, i + BATCH_SIZE);
    const batchResults = await queryFn(batchIds);
    results.push(...batchResults);
  }

  return results;
}

// Helper function to batch count queries
async function batchCountQuery(
  userIds: string[],
  tableName: 'user_onboarding' | 'user_profiles',
  notNullColumn: string
): Promise<number> {
  const BATCH_SIZE = 50;
  let totalCount = 0;

  // user_profiles uses 'id' as primary key, user_onboarding uses 'user_id'
  const userIdColumn = tableName === 'user_profiles' ? 'id' : 'user_id';

  for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
    const batchIds = userIds.slice(i, i + BATCH_SIZE);
    const { count } = await supabase
      .from(tableName)
      .select(userIdColumn, { count: 'exact', head: true })
      .in(userIdColumn, batchIds)
      .not(notNullColumn, 'is', null);
    totalCount += count || 0;
  }

  return totalCount;
}

// Fetch funnel data from Supabase
async function fetchFunnelData(timeRange: TimeRange): Promise<FunnelData> {
  try {
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();

    switch (timeRange) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
    }

    // Query user_profiles for signups in the time range
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('id, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (usersError) throw usersError;

    const totalSignups = users?.length || 0;

    if (totalSignups === 0) {
      return {
        stages: [
          { name: 'User Signups', count: 0, percentage: 100, target: 100, width: 100 },
          { name: 'Assessment Completed', count: 0, percentage: 0, target: 95, width: 90 },
          { name: 'First Agent Interaction', count: 0, percentage: 0, target: 80, width: 80 },
          { name: 'First Tactic Completed', count: 0, percentage: 0, target: 70, width: 70 },
          { name: 'Week 1 Completed', count: 0, percentage: 0, target: 60, width: 60 },
        ],
        totalSignups: 0,
      };
    }

    const userIds = users?.map(u => u.id) || [];

    // Count users who completed assessment (user_onboarding.assessment_completed_at IS NOT NULL)
    // Use batched query to avoid URL length limits
    const assessmentCount = await batchCountQuery(userIds, 'user_onboarding', 'assessment_completed_at');

    // Count users with at least one agent conversation (batched)
    const conversationUsers = await batchQuery(userIds, async (batchIds) => {
      const { data } = await supabase
        .from('agent_conversations')
        .select('user_id')
        .in('user_id', batchIds);
      return data || [];
    });

    const uniqueConversationUsers = new Set(conversationUsers.map(c => c.user_id)).size;

    // Count users who completed at least one tactic (daily_practices.completed = true) (batched)
    const tacticUsers = await batchQuery(userIds, async (batchIds) => {
      const { data } = await supabase
        .from('daily_practices')
        .select('user_id')
        .in('user_id', batchIds)
        .eq('completed', true);
      return data || [];
    });

    const uniqueTacticUsers = new Set(tacticUsers.map(t => t.user_id)).size;

    // Count users who completed Week 1 (user_profiles.week_1_completed_at IS NOT NULL)
    const week1Count = await batchCountQuery(userIds, 'user_profiles', 'week_1_completed_at');

    // Build funnel stages
    const stages: FunnelStage[] = [
      {
        name: 'User Signups',
        count: totalSignups,
        percentage: 100,
        target: 100,
        width: 100,
      },
      {
        name: 'Assessment Completed',
        count: assessmentCount || 0,
        percentage: ((assessmentCount || 0) / totalSignups) * 100,
        target: 95,
        width: 90,
      },
      {
        name: 'First Agent Interaction',
        count: uniqueConversationUsers,
        percentage: (uniqueConversationUsers / totalSignups) * 100,
        target: 80,
        width: 80,
      },
      {
        name: 'First Tactic Completed',
        count: uniqueTacticUsers,
        percentage: (uniqueTacticUsers / totalSignups) * 100,
        target: 70,
        width: 70,
      },
      {
        name: 'Week 1 Completed',
        count: week1Count || 0,
        percentage: ((week1Count || 0) / totalSignups) * 100,
        target: 60,
        width: 60,
      },
    ];

    return {
      stages,
      totalSignups,
    };
  } catch (error) {
    console.error('[ConversionFunnel] Error fetching funnel data:', error);
    throw error;
  }
}

export const ConversionFunnel: React.FC<ConversionFunnelProps> = ({ timeRange }) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['conversion-funnel', timeRange],
    queryFn: () => fetchFunnelData(timeRange),
    staleTime: 60000, // 1 minute
    refetchInterval: 300000, // 5 minutes
  });

  // Calculate drop-off rates between stages
  const dropOffRates = useMemo(() => {
    if (!data) return [];

    const rates: number[] = [];
    for (let i = 1; i < data.stages.length; i++) {
      const prevCount = data.stages[i - 1].count;
      const currentCount = data.stages[i].count;
      const dropOff = prevCount > 0 ? ((prevCount - currentCount) / prevCount) * 100 : 0;
      rates.push(dropOff);
    }
    return rates;
  }, [data]);

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle>User Journey Funnel</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-sm text-destructive">
              Failed to load funnel data: {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="shrink-0"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Journey Funnel</CardTitle>
          <CardDescription>Loading conversion data...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  // Determine border color based on conversion rate vs target
  const getBorderColor = (percentage: number, target: number) => {
    if (percentage >= target) return 'border-green-500';
    if (percentage >= target * 0.9) return 'border-yellow-500';
    return 'border-red-500';
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle>User Journey Funnel</CardTitle>
        <CardDescription>
          Track conversion rates from signup to Week 1 completion ({data.totalSignups.toLocaleString()} total signups)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Funnel Visualization */}
        <div className="space-y-4">
          {data.stages.map((stage, index) => {
            const isGood = stage.percentage >= stage.target;
            const isWarning = stage.percentage >= stage.target * 0.9 && stage.percentage < stage.target;

            return (
              <div key={stage.name} className="space-y-2">
                {/* Stage Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{stage.name}</span>
                    {index === 0 ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Badge
                        variant={isGood ? 'default' : 'destructive'}
                        className={isGood ? 'bg-green-600' : isWarning ? 'bg-yellow-600' : ''}
                      >
                        {stage.percentage.toFixed(1)}%
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {stage.count.toLocaleString()} users
                    </span>
                    {index > 0 && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <TrendingDown className="h-3 w-3" />
                        <span>{dropOffRates[index - 1].toFixed(1)}% drop-off</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Funnel Bar */}
                <div className="w-full flex justify-center">
                  <div
                    className={`border-2 rounded-md ${getBorderColor(stage.percentage, stage.target)}`}
                    style={{
                      width: `${stage.width}%`,
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <Progress
                      value={stage.percentage}
                      className="h-10 rounded-sm"
                      indicatorClassName={
                        isGood
                          ? 'bg-green-500'
                          : isWarning
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }
                    />
                  </div>
                </div>

                {/* Target Line */}
                {index > 0 && (
                  <div className="text-xs text-muted-foreground text-center">
                    Target: {stage.target}% |{' '}
                    {stage.percentage >= stage.target ? (
                      <span className="text-green-600 font-medium">Meeting target</span>
                    ) : (
                      <span className="text-red-600 font-medium">
                        {(stage.target - stage.percentage).toFixed(1)}% below target
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary Statistics */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Signup to Assessment</p>
              <p className="text-lg font-semibold">
                {data.stages[1].percentage.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Assessment to First Interaction</p>
              <p className="text-lg font-semibold">
                {data.stages[1].count > 0
                  ? ((data.stages[2].count / data.stages[1].count) * 100).toFixed(1)
                  : '0.0'}%
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Interaction to Tactic</p>
              <p className="text-lg font-semibold">
                {data.stages[2].count > 0
                  ? ((data.stages[3].count / data.stages[2].count) * 100).toFixed(1)
                  : '0.0'}%
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Overall Conversion</p>
              <p className="text-lg font-semibold">
                {data.stages[4].percentage.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm font-medium mb-2">Optimization Opportunities</p>
          <div className="space-y-1 text-xs text-muted-foreground">
            {data.stages.slice(1).map((stage, index) => {
              if (stage.percentage < stage.target) {
                const gap = stage.target - stage.percentage;
                return (
                  <div key={stage.name} className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">"</span>
                    <span>
                      <span className="font-medium text-foreground">{stage.name}</span> is{' '}
                      {gap.toFixed(1)}% below target. Focus on improving user onboarding at this stage.
                    </span>
                  </div>
                );
              }
              return null;
            })}
            {data.stages.slice(1).every(s => s.percentage >= s.target) && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">All stages meeting or exceeding targets!</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
