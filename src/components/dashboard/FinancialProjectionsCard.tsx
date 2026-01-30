import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calculator, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  calculateSimpleOutput,
  formatCurrency,
  formatPercent,
} from '@/services/underwritingCalculatorService';
import { CALCULATOR_CONSTANTS, DEFAULT_INPUTS } from '@/types/calculator';

/**
 * FinancialProjectionsCard - Apple-style simplified dashboard card
 *
 * Design Philosophy:
 * - TWO key metrics (profit + break-even) in horizontal layout
 * - Glanceable in <1 second
 * - Generous whitespace
 * - Single focused CTA
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
        occupancyRate: 90,
      };

      const output = calculateSimpleOutput(inputs);

      return {
        output,
        hasProfileData: !!profile?.bed_count,
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card className="relative overflow-hidden" data-tour-target="financial-projections">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-8 w-32" />
            </div>
            <Skeleton className="h-9 w-36" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // If no projection data, show CTA to set up profile
  if (!projection || error) {
    return (
      <Card className="relative overflow-hidden" data-tour-target="financial-projections">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calculator className="w-5 h-5 text-primary" />
              <span className="font-medium text-muted-foreground">Financial Projection</span>
              <span className="text-sm text-muted-foreground">— Complete profile to see projections</span>
            </div>
            <Link to="/profile">
              <Button size="sm" variant="ghost" className="gap-2">
                Complete Profile <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { output } = projection;
  const isProfitable = output.monthlyNetProfit > 0;
  const breakEvenHealthy = output.breakEvenOccupancy <= 75;

  return (
    <Card className="relative overflow-hidden" data-tour-target="financial-projections">
      <CardContent className="py-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Left: Icon + Label + Two Metrics */}
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              <span className="font-medium text-muted-foreground text-sm">Financial Projection</span>
            </div>

            {/* Hero Metrics */}
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-bold ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(output.monthlyNetProfit)}
              </span>
              <span className="text-sm text-muted-foreground">/mo profit</span>
            </div>

            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-bold ${breakEvenHealthy ? 'text-green-600' : 'text-amber-600'}`}>
                {formatPercent(output.breakEvenOccupancy)}
              </span>
              <span className="text-sm text-muted-foreground">break-even</span>
            </div>
          </div>

          {/* Right: CTA */}
          <Link to="/calculator">
            <Button size="sm" variant="ghost" className="gap-2">
              Open Calculator <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default FinancialProjectionsCard;
