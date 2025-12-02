import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { getResponseTimeMetrics } from '@/services/adminAnalyticsService';
import type { TimeRange } from '@/types/adminAnalytics';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle } from 'lucide-react';

// ============================================================================
// RESPONSE TIME CHART COMPONENT
// ============================================================================
// Displays average response times for each agent type with cache hit/miss breakdown
// Uses Recharts AreaChart for stacked visualization
// Mobile-first responsive design with loading states
// ============================================================================

interface ResponseTimeChartProps {
  timeRange: TimeRange;
}

export const ResponseTimeChart: React.FC<ResponseTimeChartProps> = ({ timeRange }) => {
  // Calculate date range based on timeRange
  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    const start = new Date();

    switch (timeRange) {
      case '24h':
        start.setHours(start.getHours() - 24);
        break;
      case '7d':
        start.setDate(start.getDate() - 7);
        break;
      case '30d':
        start.setDate(start.getDate() - 30);
        break;
    }

    return { startDate: start, endDate: end };
  }, [timeRange]);

  // Fetch response time data for each agent
  const netteQuery = useQuery({
    queryKey: ['response-time', 'nette', startDate, endDate],
    queryFn: () => getResponseTimeMetrics('nette', startDate, endDate),
  });

  const mioQuery = useQuery({
    queryKey: ['response-time', 'mio', startDate, endDate],
    queryFn: () => getResponseTimeMetrics('mio', startDate, endDate),
  });

  const meQuery = useQuery({
    queryKey: ['response-time', 'me', startDate, endDate],
    queryFn: () => getResponseTimeMetrics('me', startDate, endDate),
  });

  const isLoading = netteQuery.isLoading || mioQuery.isLoading || meQuery.isLoading;
  const error = netteQuery.error || mioQuery.error || meQuery.error;

  // Transform data for chart
  const chartData = useMemo(() => {
    if (!netteQuery.data || !mioQuery.data || !meQuery.data) {
      return [];
    }

    return [
      {
        name: 'Nette',
        'Avg Response Time': netteQuery.data.overall_avg_ms ?? 0,
        'Cache Hit': netteQuery.data.by_agent.nette?.avg_cache_hit_ms ?? 0,
        'Cache Miss': netteQuery.data.by_agent.nette?.avg_cache_miss_ms ?? 0,
      },
      {
        name: 'MIO',
        'Avg Response Time': mioQuery.data.overall_avg_ms ?? 0,
        'Cache Hit': mioQuery.data.by_agent.mio?.avg_cache_hit_ms ?? 0,
        'Cache Miss': mioQuery.data.by_agent.mio?.avg_cache_miss_ms ?? 0,
      },
      {
        name: 'ME',
        'Avg Response Time': meQuery.data.overall_avg_ms ?? 0,
        'Cache Hit': meQuery.data.by_agent.me?.avg_cache_hit_ms ?? 0,
        'Cache Miss': meQuery.data.by_agent.me?.avg_cache_miss_ms ?? 0,
      },
    ];
  }, [netteQuery.data, mioQuery.data, meQuery.data]);

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle>Response Time Trends</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p className="text-sm text-destructive">
            Failed to load response time data: {error.message}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Response Time Trends</CardTitle>
          <CardDescription>Loading response time metrics...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle>Response Time Trends</CardTitle>
        <CardDescription>
          Average response times by agent with cache performance breakdown
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorCacheHit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorCacheMiss" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.8} />
                <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="name"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              label={{ value: 'Response Time (ms)', angle: -90, position: 'insideLeft' }}
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
              formatter={(value: number) => `${value.toFixed(0)}ms`}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="Cache Hit"
              stackId="1"
              stroke="hsl(var(--primary))"
              fill="url(#colorCacheHit)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="Cache Miss"
              stackId="1"
              stroke="hsl(var(--destructive))"
              fill="url(#colorCacheMiss)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Summary Statistics */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {chartData.map((agent) => (
            <div
              key={agent.name}
              className="p-4 bg-muted/50 rounded-lg space-y-1"
            >
              <div className="text-sm font-medium text-muted-foreground">
                {agent.name}
              </div>
              <div className="text-2xl font-bold">
                {agent['Avg Response Time'].toFixed(0)}ms
              </div>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <div className="flex justify-between">
                  <span>Cache Hit:</span>
                  <span className="font-medium">{agent['Cache Hit'].toFixed(0)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Cache Miss:</span>
                  <span className="font-medium">{agent['Cache Miss'].toFixed(0)}ms</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
