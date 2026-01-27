import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePropertyPortfolio } from '@/hooks/usePropertyPortfolio';

/**
 * PortfolioSnapshotCard - Apple-style simplified dashboard card
 *
 * Design Philosophy:
 * - ONE dominant metric (monthly profit)
 * - Glanceable in <1 second
 * - Generous whitespace
 * - Single focused CTA
 */
export function PortfolioSnapshotCard() {
  const { summary, isLoading } = usePropertyPortfolio();

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <Card className="relative overflow-hidden">
        <CardContent className="pt-6 pb-6 text-center">
          <Skeleton className="h-5 w-32 mx-auto mb-4" />
          <Skeleton className="h-12 w-28 mx-auto mb-2" />
          <Skeleton className="h-4 w-36 mx-auto mb-6" />
          <Skeleton className="h-9 w-32 mx-auto" />
        </CardContent>
      </Card>
    );
  }

  // No properties - show CTA to add first property
  if (!summary || summary.total_properties === 0) {
    return (
      <Card className="relative overflow-hidden">
        <CardContent className="pt-6 pb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-primary" />
            <span className="font-medium text-muted-foreground text-sm">My Portfolio</span>
          </div>

          <p className="text-4xl font-bold text-foreground mb-1">—</p>
          <p className="text-sm text-muted-foreground mb-6">No properties yet</p>

          <Link to="/portfolio">
            <Button size="sm" variant="ghost" className="gap-2">
              Add Property <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const monthlyProfit = summary.total_monthly_profit || 0;
  const isProfitable = monthlyProfit > 0;
  const occupancyPercent = Math.round(summary.average_occupancy_percent || 0);

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="pt-6 pb-6 text-center">
        {/* Icon + Title row */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <Building2 className="w-5 h-5 text-primary" />
          <span className="font-medium text-muted-foreground text-sm">My Portfolio</span>
        </div>

        {/* Hero Metric - Monthly Profit */}
        <p className={`text-4xl font-bold mb-1 ${isProfitable ? 'text-green-600' : 'text-foreground'}`}>
          {formatCurrency(monthlyProfit)}/mo
        </p>

        {/* Context */}
        <p className="text-sm text-muted-foreground mb-6">
          {summary.active_properties} {summary.active_properties === 1 ? 'property' : 'properties'} • {occupancyPercent}% occupied
        </p>

        {/* Single CTA */}
        <Link to="/portfolio">
          <Button size="sm" variant="ghost" className="gap-2">
            View Portfolio <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export default PortfolioSnapshotCard;
