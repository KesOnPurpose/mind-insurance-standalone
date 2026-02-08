// ============================================================================
// DIVERSIFICATION VIEW COMPONENT
// ============================================================================
// Geographic spread, revenue concentration, and risk analysis
// ============================================================================

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  MapPin,
  Building2,
  DollarSign,
  AlertTriangle,
  Shield,
  TrendingUp,
  PieChart,
  Target,
} from 'lucide-react';
import type { Property, PortfolioSummary, PropertyHealthScore } from '@/types/property';
import type { StateCode } from '@/types/compliance';
import { OWNERSHIP_MODEL_LABELS, OwnershipModel } from '@/types/property';
import { cn } from '@/lib/utils';

// ============================================================================
// INTERFACES
// ============================================================================

export interface DiversificationViewProps {
  properties: Property[];
  summary: PortfolioSummary;
  healthScores?: PropertyHealthScore[];
  className?: string;
}

interface StateDistribution {
  state: StateCode;
  count: number;
  percentage: number;
  revenue: number;
  revenuePercentage: number;
}

interface OwnershipDistribution {
  model: OwnershipModel;
  label: string;
  count: number;
  percentage: number;
}

interface RiskMetrics {
  overallRiskLevel: 'low' | 'medium' | 'high';
  concentrationRisk: 'low' | 'medium' | 'high';
  geographicRisk: 'low' | 'medium' | 'high';
  profitabilityRisk: 'low' | 'medium' | 'high';
  recommendations: string[];
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

function getRiskLabel(risk: 'low' | 'medium' | 'high'): string {
  switch (risk) {
    case 'low':
      return 'Low Risk';
    case 'medium':
      return 'Medium Risk';
    case 'high':
      return 'High Risk';
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function DiversificationView({
  properties,
  summary,
  healthScores = [],
  className,
}: DiversificationViewProps) {
  // Calculate state distribution
  const stateDistribution = useMemo<StateDistribution[]>(() => {
    const stateMap = new Map<StateCode, { count: number; revenue: number }>();

    properties.forEach(property => {
      const existing = stateMap.get(property.state_code) || { count: 0, revenue: 0 };
      stateMap.set(property.state_code, {
        count: existing.count + 1,
        revenue: existing.revenue + (property.current_monthly_revenue || 0),
      });
    });

    const totalProperties = properties.length || 1;
    const totalRevenue = summary.total_monthly_revenue || 1;

    return Array.from(stateMap.entries())
      .map(([state, data]) => ({
        state,
        count: data.count,
        percentage: (data.count / totalProperties) * 100,
        revenue: data.revenue,
        revenuePercentage: (data.revenue / totalRevenue) * 100,
      }))
      .sort((a, b) => b.count - a.count);
  }, [properties, summary.total_monthly_revenue]);

  // Calculate ownership distribution
  const ownershipDistribution = useMemo<OwnershipDistribution[]>(() => {
    const modelMap = new Map<OwnershipModel, number>();

    properties.forEach(property => {
      const model = property.ownership_model || 'other';
      modelMap.set(model, (modelMap.get(model) || 0) + 1);
    });

    const total = properties.length || 1;

    return Array.from(modelMap.entries())
      .map(([model, count]) => ({
        model,
        label: OWNERSHIP_MODEL_LABELS[model] || model,
        count,
        percentage: (count / total) * 100,
      }))
      .sort((a, b) => b.count - a.count);
  }, [properties]);

  // Calculate risk metrics
  const riskMetrics = useMemo<RiskMetrics>(() => {
    const recommendations: string[] = [];

    // Concentration risk: Is too much revenue from one property?
    const maxRevenueConcentration = Math.max(
      ...summary.revenue_by_property.map(p => p.revenue_percent),
      0
    );
    let concentrationRisk: 'low' | 'medium' | 'high' = 'low';
    if (maxRevenueConcentration > 50) {
      concentrationRisk = 'high';
      recommendations.push('High revenue concentration - consider adding more properties');
    } else if (maxRevenueConcentration > 35) {
      concentrationRisk = 'medium';
      recommendations.push('Moderate revenue concentration - monitor for diversification');
    }

    // Geographic risk: All properties in one state?
    let geographicRisk: 'low' | 'medium' | 'high' = 'low';
    if (stateDistribution.length === 1 && properties.length > 1) {
      geographicRisk = 'high';
      recommendations.push('All properties in one state - consider geographic diversification');
    } else if (stateDistribution.length < 3 && properties.length >= 5) {
      geographicRisk = 'medium';
      recommendations.push('Limited geographic spread - explore properties in other states');
    }

    // Profitability risk: Properties with negative or low profit
    const unprofitableProperties = properties.filter(
      p => (p.current_monthly_profit || 0) <= 0
    ).length;
    let profitabilityRisk: 'low' | 'medium' | 'high' = 'low';
    if (unprofitableProperties > properties.length * 0.3) {
      profitabilityRisk = 'high';
      recommendations.push(`${unprofitableProperties} properties are unprofitable - review operations`);
    } else if (unprofitableProperties > 0) {
      profitabilityRisk = 'medium';
      recommendations.push(`${unprofitableProperties} property needs attention`);
    }

    // High risk properties from health scores (with defensive check)
    const highRiskCount = Array.isArray(healthScores)
      ? healthScores.filter(h => h.risk_level === 'high').length
      : 0;
    if (highRiskCount > 0) {
      recommendations.push(`${highRiskCount} ${highRiskCount === 1 ? 'property has' : 'properties have'} high risk scores`);
    }

    // Calculate overall risk
    const riskScores = {
      low: 0,
      medium: 1,
      high: 2,
    };
    const avgRiskScore = (
      riskScores[concentrationRisk] +
      riskScores[geographicRisk] +
      riskScores[profitabilityRisk]
    ) / 3;

    let overallRiskLevel: 'low' | 'medium' | 'high' = 'low';
    if (avgRiskScore >= 1.5) {
      overallRiskLevel = 'high';
    } else if (avgRiskScore >= 0.5) {
      overallRiskLevel = 'medium';
    }

    return {
      overallRiskLevel,
      concentrationRisk,
      geographicRisk,
      profitabilityRisk,
      recommendations,
    };
  }, [properties, summary, stateDistribution, healthScores]);

  // Identify highest/lowest performers
  const highestPerformer = properties.reduce((max, p) =>
    (p.current_monthly_profit || 0) > (max?.current_monthly_profit || 0) ? p : max,
    properties[0]
  );

  const lowestPerformer = properties.reduce((min, p) =>
    (p.current_monthly_profit || Infinity) < (min?.current_monthly_profit || Infinity) ? p : min,
    properties[0]
  );

  if (properties.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center">
          <PieChart className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">Add properties to view diversification analysis</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Risk Summary */}
      <Card className={cn(
        'border-2',
        riskMetrics.overallRiskLevel === 'high' ? 'border-red-200 bg-red-50/50' :
        riskMetrics.overallRiskLevel === 'medium' ? 'border-yellow-200 bg-yellow-50/50' :
        'border-green-200 bg-green-50/50'
      )}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Portfolio Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <span className="font-medium">Overall Risk Level</span>
            <Badge variant={getRiskBadgeVariant(riskMetrics.overallRiskLevel)} className="text-sm">
              {getRiskLabel(riskMetrics.overallRiskLevel)}
            </Badge>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex items-center justify-between p-2 bg-white rounded-lg">
              <span className="text-sm text-muted-foreground">Concentration</span>
              <Badge variant={getRiskBadgeVariant(riskMetrics.concentrationRisk)} className="text-xs">
                {riskMetrics.concentrationRisk}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-2 bg-white rounded-lg">
              <span className="text-sm text-muted-foreground">Geographic</span>
              <Badge variant={getRiskBadgeVariant(riskMetrics.geographicRisk)} className="text-xs">
                {riskMetrics.geographicRisk}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-2 bg-white rounded-lg">
              <span className="text-sm text-muted-foreground">Profitability</span>
              <Badge variant={getRiskBadgeVariant(riskMetrics.profitabilityRisk)} className="text-xs">
                {riskMetrics.profitabilityRisk}
              </Badge>
            </div>
          </div>

          {riskMetrics.recommendations.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-medium mb-2 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                Recommendations
              </p>
              <ul className="space-y-1">
                {riskMetrics.recommendations.map((rec, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-muted-foreground">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Geographic Spread */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Geographic Spread
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stateDistribution.map((item) => (
                <div key={item.state}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{item.state}</span>
                    <span className="text-muted-foreground">
                      {item.count} {item.count === 1 ? 'property' : 'properties'} ({formatPercent(item.percentage)})
                    </span>
                  </div>
                  <Progress value={item.percentage} className="h-2" />
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t text-sm">
              <p className="text-muted-foreground">
                Properties in <span className="font-medium text-foreground">{stateDistribution.length}</span> state{stateDistribution.length !== 1 && 's'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Concentration */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Revenue Concentration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {summary.revenue_by_property.slice(0, 5).map((item) => (
                <div key={item.property_id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="truncate max-w-[180px]">{item.property_nickname}</span>
                    <span className="text-muted-foreground">
                      {formatPercent(item.revenue_percent)} of total
                    </span>
                  </div>
                  <Progress
                    value={item.revenue_percent}
                    className={cn(
                      'h-2',
                      item.revenue_percent > 50 ? '[&>div]:bg-red-500' :
                      item.revenue_percent > 35 ? '[&>div]:bg-yellow-500' : ''
                    )}
                  />
                </div>
              ))}
            </div>
            {summary.revenue_by_property.length > 5 && (
              <p className="mt-3 text-sm text-muted-foreground">
                +{summary.revenue_by_property.length - 5} more properties
              </p>
            )}
          </CardContent>
        </Card>

        {/* Ownership Model Mix */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Ownership Model Mix
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ownershipDistribution.map((item) => (
                <div key={item.model}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-muted-foreground">
                      {item.count} ({formatPercent(item.percentage)})
                    </span>
                  </div>
                  <Progress value={item.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Comparison */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Performance Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {highestPerformer && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Top Performer</span>
                  </div>
                  <p className="font-medium">{highestPerformer.nickname}</p>
                  <p className="text-sm text-green-600">
                    {formatCurrency(highestPerformer.current_monthly_profit || 0)}/mo profit
                  </p>
                </div>
              )}

              {lowestPerformer && properties.length > 1 && (
                <div className={cn(
                  'p-3 rounded-lg border',
                  (lowestPerformer.current_monthly_profit || 0) < 0
                    ? 'bg-red-50 border-red-200'
                    : 'bg-yellow-50 border-yellow-200'
                )}>
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className={cn(
                      'h-4 w-4',
                      (lowestPerformer.current_monthly_profit || 0) < 0
                        ? 'text-red-600'
                        : 'text-yellow-600'
                    )} />
                    <span className={cn(
                      'text-sm font-medium',
                      (lowestPerformer.current_monthly_profit || 0) < 0
                        ? 'text-red-700'
                        : 'text-yellow-700'
                    )}>
                      {(lowestPerformer.current_monthly_profit || 0) < 0 ? 'Needs Attention' : 'Lowest Performer'}
                    </span>
                  </div>
                  <p className="font-medium">{lowestPerformer.nickname}</p>
                  <p className={cn(
                    'text-sm',
                    (lowestPerformer.current_monthly_profit || 0) < 0
                      ? 'text-red-600'
                      : 'text-yellow-600'
                  )}>
                    {formatCurrency(lowestPerformer.current_monthly_profit || 0)}/mo profit
                  </p>
                </div>
              )}

              <div className="pt-3 border-t grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Avg Break-Even</p>
                  <p className="font-medium">{formatPercent(summary.average_break_even_percent)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Avg Margin</p>
                  <p className="font-medium">{formatPercent(summary.average_profit_margin)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default DiversificationView;
