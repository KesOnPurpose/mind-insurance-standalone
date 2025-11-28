import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  PiggyBank,
  TrendingUp,
  Clock,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
} from 'lucide-react';
import { CalculatorTooltip } from './CalculatorTooltip';
import { CALCULATOR_TOOLTIPS } from './calculatorTooltipContent';
import { AdvancedOutput } from '@/types/calculator';
import { formatCurrency, formatPercent } from '@/services/underwritingCalculatorService';

interface CalculatorOutputAdvancedProps {
  output: AdvancedOutput;
}

export function CalculatorOutputAdvanced({ output }: CalculatorOutputAdvancedProps) {
  const {
    startupBreakdown,
    breakEvenMonths,
    yearOneROI,
    cashOnCashReturn,
    paybackPeriod,
    sensitivityAnalysis,
    totalInvestmentRequired,
  } = output;

  const isGoodROI = yearOneROI >= 15;
  const isGoodPayback = paybackPeriod <= 24;

  return (
    <div className="space-y-4">
      {/* Investment Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <PiggyBank className="w-4 h-4" />
            Investment Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Total Investment */}
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                Total Investment
                <CalculatorTooltip content={CALCULATOR_TOOLTIPS.totalInvestment} />
              </p>
              <p className="text-xl font-bold">{formatCurrency(totalInvestmentRequired)}</p>
              <p className="text-xs text-muted-foreground">
                Startup + 3 mo. operating
              </p>
            </div>

            {/* Year 1 ROI */}
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                Year 1 ROI
                <CalculatorTooltip content={CALCULATOR_TOOLTIPS.yearOneROI} />
              </p>
              <p className={`text-xl font-bold ${isGoodROI ? 'text-green-600' : 'text-amber-600'}`}>
                {formatPercent(yearOneROI)}
              </p>
              <p className="text-xs text-muted-foreground">
                Target: 15-25%
              </p>
            </div>
          </div>

          {/* Startup Breakdown */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Startup Cost Breakdown</p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Licensing</span>
                <span>{formatCurrency(startupBreakdown.licensingCosts)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Renovation</span>
                <span>{formatCurrency(startupBreakdown.renovationCosts)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Furniture</span>
                <span>{formatCurrency(startupBreakdown.furnitureCosts)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Marketing</span>
                <span>{formatCurrency(startupBreakdown.marketingCosts)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Reserve Fund</span>
                <span>{formatCurrency(startupBreakdown.reserveFund)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-medium">
                <span>Total Startup</span>
                <span>{formatCurrency(startupBreakdown.totalStartupCosts)}</span>
              </div>
            </div>
          </div>

          {/* Reserve Coverage */}
          <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30">
            <div className="flex items-center justify-between">
              <span className="text-sm flex items-center gap-1">
                Reserve Coverage
                <CalculatorTooltip content={CALCULATOR_TOOLTIPS.reserveCoverage} />
              </span>
              <Badge variant={startupBreakdown.monthsOfReserve >= 3 ? 'default' : 'destructive'}>
                {startupBreakdown.monthsOfReserve.toFixed(1)} months
              </Badge>
            </div>
            <Progress
              value={Math.min((startupBreakdown.monthsOfReserve / 6) * 100, 100)}
              className="h-2 mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Recommended: 3-6 months of expenses
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ROI & Payback Metrics */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Return Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-3">
            {/* Cash on Cash Return */}
            <div className="p-3 rounded-lg border">
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                <DollarSign className="w-3 h-3" />
                Cash on Cash Return
                <CalculatorTooltip content={CALCULATOR_TOOLTIPS.cashOnCashReturn} />
              </div>
              <p className={`text-2xl font-bold ${cashOnCashReturn >= 15 ? 'text-green-600' : cashOnCashReturn >= 10 ? 'text-amber-600' : 'text-red-600'}`}>
                {formatPercent(cashOnCashReturn)}
              </p>
              <p className="text-xs text-muted-foreground">
                {cashOnCashReturn >= 15 ? 'Excellent' : cashOnCashReturn >= 10 ? 'Good' : 'Below target'}
              </p>
            </div>

            {/* Payback Period */}
            <div className="p-3 rounded-lg border">
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                <Clock className="w-3 h-3" />
                Payback Period
                <CalculatorTooltip content={CALCULATOR_TOOLTIPS.paybackPeriod} />
              </div>
              <p className={`text-2xl font-bold ${isGoodPayback ? 'text-green-600' : 'text-amber-600'}`}>
                {paybackPeriod < 999 ? `${paybackPeriod} mo` : 'N/A'}
              </p>
              <p className="text-xs text-muted-foreground">
                Target: 12-24 months
              </p>
            </div>

            {/* Break-Even Point */}
            <div className="p-3 rounded-lg border col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                    <BarChart3 className="w-3 h-3" />
                    Break-Even Point
                  </div>
                  <p className="text-lg font-bold">
                    Month {breakEvenMonths < 999 ? breakEvenMonths : 'N/A'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    After accounting for startup costs
                  </p>
                  {breakEvenMonths <= 12 && (
                    <Badge variant="default" className="mt-1">Within Year 1</Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sensitivity Analysis */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Sensitivity Analysis
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            How changes in key variables affect your profit
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {sensitivityAnalysis.map((result, index) => (
              <div key={index} className="p-3 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{result.variable}</span>
                  <Badge
                    variant={result.impactOnProfit >= 0 ? 'default' : 'destructive'}
                    className="gap-1"
                  >
                    {result.impactOnProfit >= 0 ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    {formatCurrency(Math.abs(result.impactOnProfit))}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {formatCurrency(result.baseValue)} → {formatCurrency(result.adjustedValue)}
                    ({result.changePercent > 0 ? '+' : ''}{result.changePercent}%)
                  </span>
                  <span className={result.impactOnProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {result.impactPercent > 0 ? '+' : ''}{formatPercent(result.impactPercent)} profit
                  </span>
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          {/* Key Insight */}
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Key Insight
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
              {sensitivityAnalysis.length > 0 && (
                <>
                  Occupancy rate has the biggest impact on profitability. A 10% drop in occupancy
                  affects monthly profit by {formatCurrency(Math.abs(sensitivityAnalysis[0]?.impactOnProfit || 0))}.
                  Maintain at least 85% occupancy to stay profitable.
                </>
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CalculatorOutputAdvanced;
