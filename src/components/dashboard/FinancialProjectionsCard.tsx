import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, TrendingUp, Target, Calculator, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  calculateSimpleOutput,
  formatCurrency,
  formatPercent,
  getViabilityStatus,
} from '@/services/underwritingCalculatorService';
import { CALCULATOR_CONSTANTS, DEFAULT_INPUTS } from '@/types/calculator';

interface MetricTileProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  color?: string;
}

function MetricTile({ label, value, icon, color = 'text-foreground' }: MetricTileProps) {
  return (
    <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50">
      {icon && <div className="mb-1">{icon}</div>}
      <span className={`text-lg font-bold ${color}`}>{value}</span>
      <span className="text-xs text-muted-foreground text-center">{label}</span>
    </div>
  );
}

/**
 * FinancialProjectionsCard - Quick financial snapshot for Dashboard
 *
 * Auto-calculates projections from user's onboarding data:
 * - Fetches bed_count, capital_available, target_state
 * - Uses state-specific rates if available
 * - Shows monthly revenue, profit, break-even, margin
 * - Links to full calculator
 */
export function FinancialProjectionsCard() {
  const { user } = useAuth();

  const { data: projection, isLoading, error } = useQuery({
    queryKey: ['financial-projection-card', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_onboarding')
        .select('bed_count, target_state, capital_available, ownership_model')
        .eq('user_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Profile fetch error:', profileError);
      }

      // Fetch state rates if target state exists
      let stateRate = CALCULATOR_CONSTANTS.SSI_MAX_RENT;
      if (profile?.target_state) {
        const { data: stateInfo } = await supabase
          .from('gh_state_licensing_info')
          .select('average_rate_per_resident_max, average_rate_per_resident_min')
          .eq('state_abbr', profile.target_state)
          .maybeSingle();

        if (stateInfo?.average_rate_per_resident_max) {
          // Use the average of min and max rates if both exist, otherwise just max
          const minRate = stateInfo.average_rate_per_resident_min || stateInfo.average_rate_per_resident_max;
          stateRate = Math.round((stateInfo.average_rate_per_resident_max + minRate) / 2);
        }
      }

      // Calculate with user's bed count or default
      const bedCount = profile?.bed_count || 6;
      const inputs = {
        ...DEFAULT_INPUTS,
        bedCount,
        ratePerBed: stateRate,
        occupancyRate: 90, // Conservative default
      };

      const output = calculateSimpleOutput(inputs);

      return {
        output,
        hasProfileData: !!profile?.bed_count,
        bedCount,
        state: profile?.target_state || null,
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // If no projection data, show CTA to set up profile
  if (!projection || error) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">Financial Projections</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Complete your profile to see personalized financial projections for your group home.
          </p>
          <Link to="/profile">
            <Button variant="outline" size="sm" className="w-full gap-2">
              Complete Profile
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const { output, hasProfileData, bedCount, state } = projection;
  const viability = getViabilityStatus(output);
  const isProfitable = output.monthlyNetProfit > 0;

  // Determine colors based on viability
  const profitColor = isProfitable ? 'text-green-600' : 'text-red-600';
  const marginColor = output.profitMargin >= 20 ? 'text-green-600' : output.profitMargin >= 15 ? 'text-amber-600' : 'text-red-600';
  const breakEvenColor = output.breakEvenOccupancy <= 75 ? 'text-green-600' : output.breakEvenOccupancy <= 85 ? 'text-amber-600' : 'text-red-600';

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">Financial Snapshot</CardTitle>
          </div>
          <Badge variant={isProfitable ? 'default' : 'destructive'} className="text-xs">
            {viability.status}
          </Badge>
        </div>
        {!hasProfileData && (
          <p className="text-xs text-muted-foreground mt-1">
            Based on {bedCount} beds at default rates
          </p>
        )}
        {hasProfileData && state && (
          <p className="text-xs text-muted-foreground mt-1">
            {bedCount} beds in {state} at 90% occupancy
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <MetricTile
            label="Monthly Revenue"
            value={formatCurrency(output.monthlyGrossRevenue)}
            icon={<DollarSign className="w-4 h-4 text-green-600" />}
            color="text-green-600"
          />
          <MetricTile
            label="Monthly Profit"
            value={formatCurrency(output.monthlyNetProfit)}
            icon={<TrendingUp className={`w-4 h-4 ${profitColor}`} />}
            color={profitColor}
          />
          <MetricTile
            label="Break-Even"
            value={formatPercent(output.breakEvenOccupancy)}
            icon={<Target className={`w-4 h-4 ${breakEvenColor}`} />}
            color={breakEvenColor}
          />
          <MetricTile
            label="Profit Margin"
            value={formatPercent(output.profitMargin)}
            color={marginColor}
          />
        </div>

        <Link to="/calculator">
          <Button variant="ghost" size="sm" className="w-full gap-2 text-primary">
            Open Full Calculator
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export default FinancialProjectionsCard;
