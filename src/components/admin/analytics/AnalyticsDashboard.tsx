import React, { useState } from 'react';
import { KPICards } from './KPICards';
import { CacheHitRateChart } from './CacheHitRateChart';
import { ResponseTimeChart } from './ResponseTimeChart';
import { AgentComparisonTable } from './AgentComparisonTable';
import { ExportButtons } from './ExportButtons';
import { UserEngagementMetrics } from './UserEngagementMetrics';
import { ConversionFunnel } from './ConversionFunnel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { TimeRange } from '@/types/adminAnalytics';
import { RefreshCcw, Calendar, Database, Loader2, ChevronDown } from 'lucide-react';
import { useCanExportAnalytics } from '@/contexts/AdminContext';
import { useDashboardKPIs, useSyncAnalytics } from '@/services/adminAnalyticsService';
import { useToast } from '@/hooks/use-toast';

// ============================================================================
// ANALYTICS DASHBOARD COMPONENT
// ============================================================================
// Main analytics dashboard container with:
// - Time range selector (24h, 7d, 30d, 90d)
// - KPI cards showing key metrics
// - Cache hit rate chart
// - Response time chart
// - Agent comparison table
// - Export functionality (placeholder)
// Mobile-first responsive grid layout
// ============================================================================

export const AnalyticsDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [refreshKey, setRefreshKey] = useState(0);
  const canExport = useCanExportAnalytics();
  const { toast } = useToast();

  // Fetch KPI data for export functionality
  const { data: kpiData } = useDashboardKPIs(timeRange);

  // Sync analytics mutation
  const syncMutation = useSyncAnalytics();

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleSync = async (fullSync: boolean = false) => {
    const result = await syncMutation.mutateAsync({
      fullSync,
      sinceHours: fullSync ? undefined : 168, // 7 days for incremental
    });

    if (result.success) {
      toast({
        title: 'Analytics Synced',
        description: `Synced ${result.nette_synced} Nette, ${result.mio_synced} MIO, ${result.me_synced} ME conversations (${result.total} total)`,
      });
      // Trigger a refresh after successful sync
      handleRefresh();
    } else {
      toast({
        title: 'Sync Failed',
        description: result.error || 'Failed to sync analytics data',
        variant: 'destructive',
      });
    }
  };

  const getTimeRangeLabel = (range: TimeRange) => {
    switch (range) {
      case '24h':
        return 'Last 24 Hours';
      case '7d':
        return 'Last 7 Days';
      case '30d':
        return 'Last 30 Days';
      default:
        return 'Last 7 Days';
    }
  };

  return (
    <div className="space-y-6" key={refreshKey}>
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Real-time performance metrics for AI agents
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          {/* Time Range Selector */}
          <Select
            value={timeRange}
            onValueChange={(value) => setTimeRange(value as TimeRange)}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>

          {/* Sync Data Button with Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="default"
                size="default"
                disabled={syncMutation.isPending}
                className="w-full sm:w-auto bg-primary"
              >
                {syncMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Database className="mr-2 h-4 w-4" />
                )}
                {syncMutation.isPending ? 'Syncing...' : 'Sync Data'}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleSync(false)}>
                Quick Sync (Last 7 Days)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSync(true)}>
                Full Sync (All Data)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="default"
            onClick={handleRefresh}
            className="w-full sm:w-auto"
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Export Buttons (if user has permission) */}
      {canExport && (
        <ExportButtons timeRange={timeRange} kpiData={kpiData} />
      )}

      {/* Time Range Indicator */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            Showing data for:{' '}
            <span className="font-semibold text-foreground">
              {getTimeRangeLabel(timeRange)}
            </span>
          </p>
        </CardContent>
      </Card>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <KPICards timeRange={timeRange} />
      </div>

      {/* User Engagement Metrics Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold tracking-tight">User Engagement Metrics</h3>
          <p className="text-sm text-muted-foreground">
            Track user behavior, retention, and engagement health
          </p>
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <UserEngagementMetrics timeRange={timeRange} />
        </div>
      </div>

      {/* Conversion Funnel Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold tracking-tight">User Journey Funnel</h3>
          <p className="text-sm text-muted-foreground">
            Track conversion rates from signup to Week 1 completion
          </p>
        </div>
        <ConversionFunnel timeRange={timeRange} />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Cache Hit Rate Chart */}
        <CacheHitRateChart timeRange={timeRange} />

        {/* Response Time Chart */}
        <ResponseTimeChart timeRange={timeRange} />
      </div>

      {/* Agent Comparison Table */}
      <AgentComparisonTable timeRange={timeRange} />

      {/* System Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 text-sm">
            <div>
              <div className="font-medium text-muted-foreground mb-1">
                Database
              </div>
              <div className="font-mono text-xs">
                hpyodaugrkctagkrfofj.supabase.co
              </div>
            </div>
            <div>
              <div className="font-medium text-muted-foreground mb-1">
                Analytics Version
              </div>
              <div>v1.0.0</div>
            </div>
            <div>
              <div className="font-medium text-muted-foreground mb-1">
                Last Updated
              </div>
              <div>{new Date().toLocaleString()}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Information Card (if no export permission) */}
      {!canExport && (
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              Need to export analytics data? Contact your super admin for export permissions.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
