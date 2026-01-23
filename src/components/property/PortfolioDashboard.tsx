// ============================================================================
// PORTFOLIO DASHBOARD COMPONENT
// ============================================================================
// Aggregate metrics across all properties with portfolio-level insights
// ============================================================================

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Building2,
  BedDouble,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  Users,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  FileText,
} from 'lucide-react';
import type { Property, PortfolioSummary, PropertyHealthScore } from '@/types/property';
import { cn } from '@/lib/utils';

// ============================================================================
// INTERFACES
// ============================================================================

export interface PortfolioDashboardProps {
  properties: Property[];
  summary: PortfolioSummary;
  healthScores?: PropertyHealthScore[];
  onPropertyClick?: (propertyId: string) => void;
  onGenerateReport?: () => void;
  isLoading?: boolean;
  className?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function getRiskBadgeVariant(risk: 'low' | 'medium' | 'high'): 'default' | 'secondary' | 'destructive' {
  switch (risk) {
    case 'low':
      return 'default';
    case 'medium':
      return 'secondary';
    case 'high':
      return 'destructive';
  }
}

function getHealthScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
}

function getHealthScoreBackground(score: number): string {
  if (score >= 80) return 'bg-green-100';
  if (score >= 60) return 'bg-yellow-100';
  return 'bg-red-100';
}

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

function StatCard({ title, value, subtitle, icon, trend, className }: StatCardProps) {
  return (
    <Card className={className}>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
            {trend && (
              <div className={cn(
                'flex items-center gap-1 text-xs mt-2',
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              )}>
                {trend.isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>{trend.isPositive ? '+' : ''}{trend.value}% vs last month</span>
              </div>
            )}
          </div>
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// PROPERTY ROW COMPONENT
// ============================================================================

interface PropertyRowProps {
  property: Property;
  healthScore?: PropertyHealthScore;
  onClick?: () => void;
}

function PropertyRow({ property, healthScore, onClick }: PropertyRowProps) {
  const occupancyPercent = property.current_occupancy_percent || 0;
  const monthlyProfit = property.current_monthly_profit || 0;

  return (
    <div
      className={cn(
        'flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors',
        onClick && 'cursor-pointer'
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center',
          healthScore ? getHealthScoreBackground(healthScore.overall_score) : 'bg-gray-100'
        )}>
          <Building2 className={cn(
            'h-5 w-5',
            healthScore ? getHealthScoreColor(healthScore.overall_score) : 'text-gray-600'
          )} />
        </div>
        <div>
          <p className="font-medium">{property.nickname}</p>
          <p className="text-sm text-muted-foreground">
            {property.city}, {property.state_code} • {property.configured_beds} beds
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <div className="text-right">
          <p className="text-muted-foreground">Occupancy</p>
          <p className="font-medium">{formatPercent(occupancyPercent)}</p>
        </div>
        <div className="text-right">
          <p className="text-muted-foreground">Profit</p>
          <p className={cn(
            'font-medium',
            monthlyProfit >= 0 ? 'text-green-600' : 'text-red-600'
          )}>
            {formatCurrency(monthlyProfit)}
          </p>
        </div>
        {healthScore && (
          <Badge variant={getRiskBadgeVariant(healthScore.risk_level)}>
            {healthScore.overall_score}/100
          </Badge>
        )}
        {onClick && (
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PortfolioDashboard({
  properties,
  summary,
  healthScores = [],
  onPropertyClick,
  onGenerateReport,
  isLoading = false,
  className,
}: PortfolioDashboardProps) {
  // Get health score for a property (with defensive check)
  const getHealthScore = (propertyId: string): PropertyHealthScore | undefined => {
    if (!Array.isArray(healthScores)) return undefined;
    return healthScores.find(h => h.property_id === propertyId);
  };

  // Identify properties needing attention
  const propertiesNeedingAttention = properties.filter(p => {
    const health = getHealthScore(p.id);
    return health && health.risk_level === 'high';
  });

  // Identify top performers
  const topPerformers = [...properties]
    .filter(p => p.current_monthly_profit && p.current_monthly_profit > 0)
    .sort((a, b) => (b.current_monthly_profit || 0) - (a.current_monthly_profit || 0))
    .slice(0, 3);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Portfolio Dashboard</h2>
          <p className="text-muted-foreground">
            Overview of your {summary.total_properties} {summary.total_properties === 1 ? 'property' : 'properties'}
          </p>
        </div>
        {onGenerateReport && (
          <Button onClick={onGenerateReport} className="gap-2">
            <FileText className="h-4 w-4" />
            Generate Report
          </Button>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Properties"
          value={summary.total_properties.toString()}
          subtitle={`${summary.active_properties} active`}
          icon={<Building2 className="h-5 w-5 text-primary" />}
        />
        <StatCard
          title="Total Beds"
          value={summary.total_beds.toString()}
          subtitle={`${summary.occupied_beds} occupied, ${summary.vacant_beds} vacant`}
          icon={<BedDouble className="h-5 w-5 text-primary" />}
        />
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(summary.total_monthly_revenue)}
          icon={<DollarSign className="h-5 w-5 text-primary" />}
        />
        <StatCard
          title="Monthly Profit"
          value={formatCurrency(summary.total_monthly_profit)}
          subtitle={`${formatPercent(summary.average_profit_margin)} margin`}
          icon={<TrendingUp className="h-5 w-5 text-primary" />}
        />
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Overall Health */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Portfolio Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Average Occupancy</span>
                  <span className="font-medium">{formatPercent(summary.average_occupancy_percent)}</span>
                </div>
                <Progress
                  value={summary.average_occupancy_percent}
                  className="h-2"
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Average Break-Even</span>
                  <span className="font-medium">{formatPercent(summary.average_break_even_percent)}</span>
                </div>
                <Progress
                  value={summary.average_break_even_percent}
                  className="h-2"
                />
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm text-muted-foreground">Safety Buffer</span>
                <Badge variant={
                  summary.average_occupancy_percent - summary.average_break_even_percent > 20 ? 'default' :
                  summary.average_occupancy_percent - summary.average_break_even_percent > 10 ? 'secondary' : 'destructive'
                }>
                  {formatPercent(summary.average_occupancy_percent - summary.average_break_even_percent)} margin
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Revenue Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {summary.revenue_by_property.slice(0, 5).map((item) => (
                <div key={item.property_id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="truncate max-w-[200px]">{item.property_nickname}</span>
                    <span className="text-muted-foreground">
                      {formatCurrency(item.monthly_revenue)} ({formatPercent(item.revenue_percent)})
                    </span>
                  </div>
                  <Progress value={item.revenue_percent} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts and Attention */}
      {propertiesNeedingAttention.length > 0 && (
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-4 w-4" />
              Needs Attention ({propertiesNeedingAttention.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {propertiesNeedingAttention.map((property) => {
                const health = getHealthScore(property.id);
                return (
                  <div
                    key={property.id}
                    className="flex items-center justify-between p-2 bg-white rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-red-600" />
                      <span className="font-medium">{property.nickname}</span>
                    </div>
                    {health && health.recommendations.length > 0 && (
                      <span className="text-sm text-red-600">
                        {health.recommendations[0]}
                      </span>
                    )}
                    {onPropertyClick && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onPropertyClick(property.id)}
                      >
                        View
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Performers */}
      {topPerformers.length > 0 && (
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-green-700">
              <CheckCircle className="h-4 w-4" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topPerformers.map((property, index) => (
                <div
                  key={property.id}
                  className="flex items-center justify-between p-2 bg-white rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                      index === 0 ? 'bg-yellow-400 text-yellow-900' :
                      index === 1 ? 'bg-gray-300 text-gray-700' :
                      'bg-amber-600 text-white'
                    )}>
                      {index + 1}
                    </span>
                    <span className="font-medium">{property.nickname}</span>
                  </div>
                  <span className="text-green-600 font-medium">
                    {formatCurrency(property.current_monthly_profit || 0)}/mo
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Properties */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            All Properties
          </CardTitle>
        </CardHeader>
        <CardContent>
          {properties.length > 0 ? (
            <div className="space-y-2">
              {properties.map((property) => (
                <PropertyRow
                  key={property.id}
                  property={property}
                  healthScore={getHealthScore(property.id)}
                  onClick={onPropertyClick ? () => onPropertyClick(property.id) : undefined}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No properties in your portfolio yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default PortfolioDashboard;
