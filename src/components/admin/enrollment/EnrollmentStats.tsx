// ============================================================================
// FEAT-GH-019: Enrollment Stats Component
// ============================================================================
// Quick stats card showing enrollment metrics
// ============================================================================

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  UserPlus,
  CreditCard,
  FileSpreadsheet,
  TrendingUp,
  CalendarDays,
} from 'lucide-react';
import { useEnrollmentStats } from '@/hooks/useAdminPrograms';

// ============================================================================
// Types
// ============================================================================

interface EnrollmentStatsProps {
  programId: string;
}

interface StatCardProps {
  title: string;
  value: number | string;
  description?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

// ============================================================================
// Stat Card Component
// ============================================================================

const StatCard = ({ title, value, description, icon, trend }: StatCardProps) => (
  <Card>
    <CardContent className="p-4 md:p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl md:text-3xl font-bold">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp
                className={`h-3 w-3 ${
                  trend.isPositive ? 'text-green-500' : 'text-red-500'
                }`}
              />
              <span
                className={`text-xs font-medium ${
                  trend.isPositive ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              <span className="text-xs text-muted-foreground">vs last month</span>
            </div>
          )}
        </div>
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

// ============================================================================
// Loading Skeleton
// ============================================================================

const StatsSkeleton = () => (
  <>
    {Array.from({ length: 4 }).map((_, i) => (
      <Card key={i}>
        <CardContent className="p-4 md:p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </CardContent>
      </Card>
    ))}
  </>
);

// ============================================================================
// Main Component
// ============================================================================

export const EnrollmentStats = ({ programId }: EnrollmentStatsProps) => {
  const { stats, isLoading } = useEnrollmentStats(programId);

  // Calculate percentages for source breakdown
  const sourcePercentages = useMemo(() => {
    if (!stats || stats.total_enrolled === 0) {
      return { manual: 0, purchase: 0, import: 0 };
    }

    const total = stats.total_enrolled;
    return {
      manual: Math.round((stats.by_source.manual / total) * 100),
      purchase: Math.round((stats.by_source.purchase / total) * 100),
      import: Math.round((stats.by_source.import / total) * 100),
    };
  }, [stats]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsSkeleton />
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Main Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Enrolled */}
        <StatCard
          title="Total Enrolled"
          value={stats.total_enrolled}
          description="All-time enrollments"
          icon={<Users className="h-5 w-5 text-primary" />}
        />

        {/* This Month */}
        <StatCard
          title="This Month"
          value={stats.enrolled_this_month}
          description={`${new Date().toLocaleString('default', { month: 'long' })} enrollments`}
          icon={<CalendarDays className="h-5 w-5 text-primary" />}
        />

        {/* Manual Enrollments */}
        <StatCard
          title="Manual"
          value={stats.by_source.manual}
          description={`${sourcePercentages.manual}% of total`}
          icon={<UserPlus className="h-5 w-5 text-primary" />}
        />

        {/* Purchase Enrollments */}
        <StatCard
          title="Purchases"
          value={stats.by_source.purchase}
          description={`${sourcePercentages.purchase}% of total`}
          icon={<CreditCard className="h-5 w-5 text-primary" />}
        />
      </div>

      {/* Source Breakdown Bar */}
      {stats.total_enrolled > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Enrollment Sources</CardTitle>
            <CardDescription>Breakdown of how learners enrolled</CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            {/* Progress Bar */}
            <div className="h-3 w-full rounded-full overflow-hidden bg-muted flex">
              {stats.by_source.manual > 0 && (
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${sourcePercentages.manual}%` }}
                />
              )}
              {stats.by_source.purchase > 0 && (
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${sourcePercentages.purchase}%` }}
                />
              )}
              {stats.by_source.import > 0 && (
                <div
                  className="h-full bg-orange-500 transition-all"
                  style={{ width: `${sourcePercentages.import}%` }}
                />
              )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
                <span className="text-muted-foreground">
                  Manual ({stats.by_source.manual})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="text-muted-foreground">
                  Purchase ({stats.by_source.purchase})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-orange-500" />
                <span className="text-muted-foreground">
                  Import ({stats.by_source.import})
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnrollmentStats;
