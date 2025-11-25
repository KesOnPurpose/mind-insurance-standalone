import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCacheHitRate } from '@/services/adminAnalyticsService';
import type { TimeRange } from '@/types/adminAnalytics';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle } from 'lucide-react';

// ============================================================================
// CACHE HIT RATE CHART COMPONENT
// ============================================================================
// Displays cache performance metrics for each agent type (Nette, MIO, ME)
// Uses Recharts LineChart for time-series visualization
// Mobile-first responsive design with loading states
// ============================================================================

interface CacheHitRateChartProps {
  timeRange: TimeRange;
}

export const CacheHitRateChart: React.FC<CacheHitRateChartProps> = ({ timeRange }) => {
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

  // Fetch cache hit rate data for each agent
  const netteQuery = useCacheHitRate('nette', startDate, endDate);
  const mioQuery = useCacheHitRate('mio', startDate, endDate);
  const meQuery = useCacheHitRate('me', startDate, endDate);

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
        'Cache Hit Rate': netteQuery.data.overall_rate,
        'Total Requests': netteQuery.data.total_requests,
      },
      {
        name: 'MIO',
        'Cache Hit Rate': mioQuery.data.overall_rate,
        'Total Requests': mioQuery.data.total_requests,
      },
      {
        name: 'ME',
        'Cache Hit Rate': meQuery.data.overall_rate,
        'Total Requests': meQuery.data.total_requests,
      },
    ];
  }, [netteQuery.data, mioQuery.data, meQuery.data]);

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle>Cache Hit Rate by Agent</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p className="text-sm text-destructive">
            Failed to load cache hit rate data: {error.message}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cache Hit Rate by Agent</CardTitle>
          <CardDescription>Loading cache performance metrics...</CardDescription>
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
        <CardTitle>Cache Hit Rate by Agent</CardTitle>
        <CardDescription>
          Percentage of requests served from cache for each agent
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="name"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              domain={[0, 100]}
              label={{ value: 'Cache Hit Rate (%)', angle: -90, position: 'insideLeft' }}
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
              formatter={(value: number, name: string) => {
                if (name === 'Cache Hit Rate') {
                  return [`${value.toFixed(2)}%`, name];
                }
                return [value.toLocaleString(), name];
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="Cache Hit Rate"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
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
                {agent['Cache Hit Rate'].toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">
                {agent['Total Requests'].toLocaleString()} requests
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
