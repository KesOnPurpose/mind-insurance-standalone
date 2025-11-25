import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { usePerformanceMetrics } from '@/services/adminAnalyticsService';
import type { TimeRange, AgentType } from '@/types/adminAnalytics';
import { AlertCircle, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ============================================================================
// AGENT COMPARISON TABLE COMPONENT
// ============================================================================
// Displays comprehensive performance statistics for each agent
// Sortable columns for easy comparison
// Mobile-first responsive design with loading states
// ============================================================================

interface AgentComparisonTableProps {
  timeRange: TimeRange;
}

type SortField = 'agent' | 'conversations' | 'cacheHitRate' | 'avgResponseTime';
type SortDirection = 'asc' | 'desc';

export const AgentComparisonTable: React.FC<AgentComparisonTableProps> = ({ timeRange }) => {
  const [sortField, setSortField] = useState<SortField>('conversations');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

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

  // Fetch performance metrics for each agent
  const netteQuery = usePerformanceMetrics('nette', startDate, endDate);
  const mioQuery = usePerformanceMetrics('mio', startDate, endDate);
  const meQuery = usePerformanceMetrics('me', startDate, endDate);

  const isLoading = netteQuery.isLoading || mioQuery.isLoading || meQuery.isLoading;
  const error = netteQuery.error || mioQuery.error || meQuery.error;

  // Transform and sort data
  const tableData = useMemo(() => {
    if (!netteQuery.data || !mioQuery.data || !meQuery.data) {
      return [];
    }

    const data = [
      {
        agent: 'Nette' as const,
        agentType: 'nette' as AgentType,
        conversations: netteQuery.data.total_conversations,
        cacheHitRate: netteQuery.data.cache_hit_rate,
        avgResponseTime: netteQuery.data.avg_response_time_ms,
        description: 'Network & Exposure Therapy Tactical Engine',
      },
      {
        agent: 'MIO' as const,
        agentType: 'mio' as AgentType,
        conversations: mioQuery.data.total_conversations,
        cacheHitRate: mioQuery.data.cache_hit_rate,
        avgResponseTime: mioQuery.data.avg_response_time_ms,
        description: 'Mind Insurance Oracle',
      },
      {
        agent: 'ME' as const,
        agentType: 'me' as AgentType,
        conversations: meQuery.data.total_conversations,
        cacheHitRate: meQuery.data.cache_hit_rate,
        avgResponseTime: meQuery.data.avg_response_time_ms,
        description: 'Motivational Enhancement Engine',
      },
    ];

    // Sort data
    return data.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'agent':
          comparison = a.agent.localeCompare(b.agent);
          break;
        case 'conversations':
          comparison = a.conversations - b.conversations;
          break;
        case 'cacheHitRate':
          comparison = a.cacheHitRate - b.cacheHitRate;
          break;
        case 'avgResponseTime':
          comparison = a.avgResponseTime - b.avgResponseTime;
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [
    netteQuery.data,
    mioQuery.data,
    meQuery.data,
    sortField,
    sortDirection,
  ]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle>Agent Performance Comparison</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p className="text-sm text-destructive">
            Failed to load agent comparison data: {error.message}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Agent Performance Comparison</CardTitle>
          <CardDescription>Loading agent statistics...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle>Agent Performance Comparison</CardTitle>
        <CardDescription>
          Comprehensive performance metrics across all AI agents
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 lg:px-3"
                    onClick={() => handleSort('agent')}
                  >
                    Agent
                    <SortIcon field="agent" />
                  </Button>
                </TableHead>
                <TableHead className="hidden md:table-cell">Description</TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 lg:px-3"
                    onClick={() => handleSort('conversations')}
                  >
                    Conversations
                    <SortIcon field="conversations" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 lg:px-3"
                    onClick={() => handleSort('cacheHitRate')}
                  >
                    Cache Hit Rate
                    <SortIcon field="cacheHitRate" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 lg:px-3"
                    onClick={() => handleSort('avgResponseTime')}
                  >
                    Avg Response
                    <SortIcon field="avgResponseTime" />
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.map((row) => (
                <TableRow key={row.agentType}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          row.agentType === 'nette'
                            ? 'bg-blue-500'
                            : row.agentType === 'mio'
                            ? 'bg-purple-500'
                            : 'bg-green-500'
                        }`}
                      />
                      {row.agent}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {row.description}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {row.conversations.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        row.cacheHitRate >= 80
                          ? 'bg-green-100 text-green-800'
                          : row.cacheHitRate >= 60
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {row.cacheHitRate.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        row.avgResponseTime < 1000
                          ? 'bg-green-100 text-green-800'
                          : row.avgResponseTime < 2000
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {row.avgResponseTime.toFixed(0)}ms
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile View Summary */}
        <div className="md:hidden mt-4 space-y-3">
          {tableData.map((row) => (
            <div
              key={row.agentType}
              className="p-4 bg-muted/50 rounded-lg space-y-2"
            >
              <div className="flex items-center gap-2 font-medium">
                <div
                  className={`w-2 h-2 rounded-full ${
                    row.agentType === 'nette'
                      ? 'bg-blue-500'
                      : row.agentType === 'mio'
                      ? 'bg-purple-500'
                      : 'bg-green-500'
                  }`}
                />
                {row.agent}
              </div>
              <div className="text-xs text-muted-foreground">
                {row.description}
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <div className="text-muted-foreground">Conversations</div>
                  <div className="font-medium">{row.conversations.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Cache Hit</div>
                  <div className="font-medium">{row.cacheHitRate.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Response</div>
                  <div className="font-medium">{row.avgResponseTime.toFixed(0)}ms</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
