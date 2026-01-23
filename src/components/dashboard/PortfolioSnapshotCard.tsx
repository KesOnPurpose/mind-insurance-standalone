import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, Bed, Users, DollarSign, ArrowRight, MessageSquare, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePropertyPortfolio } from '@/hooks/usePropertyPortfolio';

/**
 * PortfolioSnapshotCard - Dashboard card showing portfolio overview
 *
 * Displays:
 * - Total properties and beds
 * - Occupancy percentage
 * - Monthly revenue
 * - View Portfolio CTA
 * - Inline Ask Nette link with portfolio context
 */
export function PortfolioSnapshotCard() {
  const { summary, isLoading, error } = usePropertyPortfolio();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
          <Skeleton className="h-9 w-full" />
        </CardContent>
      </Card>
    );
  }

  // No properties - show CTA to add first property
  if (!summary || summary.total_properties === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">My Portfolio</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Start tracking your group home properties. Add your first property to see insights and projections.
          </p>
          <Link to="/portfolio">
            <Button variant="outline" size="sm" className="w-full gap-2">
              Add First Property
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format percentage
  const formatPercent = (value: number): string => {
    return `${Math.round(value)}%`;
  };

  // Calculate occupancy color
  const getOccupancyColor = (percent: number): string => {
    if (percent >= 85) return 'text-green-600';
    if (percent >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">Portfolio Snapshot</CardTitle>
          </div>
          {summary.average_profit_margin > 40 && (
            <div className="flex items-center gap-1 text-xs text-green-600">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Healthy</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Properties */}
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Building2 className="w-3.5 h-3.5" />
              <span className="text-xs">Properties</span>
            </div>
            <p className="text-lg font-semibold">{summary.active_properties}</p>
          </div>

          {/* Beds */}
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Bed className="w-3.5 h-3.5" />
              <span className="text-xs">Total Beds</span>
            </div>
            <p className="text-lg font-semibold">{summary.total_beds}</p>
          </div>

          {/* Occupancy */}
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="w-3.5 h-3.5" />
              <span className="text-xs">Occupancy</span>
            </div>
            <p className={`text-lg font-semibold ${getOccupancyColor(summary.average_occupancy_percent)}`}>
              {formatPercent(summary.average_occupancy_percent)}
            </p>
            <p className="text-xs text-muted-foreground">
              {summary.occupied_beds} of {summary.total_beds} beds
            </p>
          </div>

          {/* Monthly Revenue */}
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="w-3.5 h-3.5" />
              <span className="text-xs">Revenue</span>
            </div>
            <p className="text-lg font-semibold">{formatCurrency(summary.total_monthly_revenue)}</p>
            <p className="text-xs text-muted-foreground">/month</p>
          </div>
        </div>

        {/* Profit summary */}
        {summary.total_monthly_profit > 0 && (
          <div className="bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-700 dark:text-green-400">Monthly Profit</span>
              <span className="font-semibold text-green-700 dark:text-green-400">
                {formatCurrency(summary.total_monthly_profit)}
              </span>
            </div>
            <p className="text-xs text-green-600 dark:text-green-500 mt-1">
              {formatPercent(summary.average_profit_margin)} margin
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <Link to="/portfolio">
            <Button size="sm" className="w-full gap-2">
              View Portfolio
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>

          {/* Inline Ask Nette link with context */}
          <Link
            to={`/chat?context=portfolio&properties=${summary.total_properties}&revenue=${summary.total_monthly_revenue}`}
            className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors py-1"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Ask Nette about my portfolio</span>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default PortfolioSnapshotCard;
