import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  LineChart,
  TrendingUp,
  Calendar,
  Target,
} from 'lucide-react';
import { ModerateOutput } from '@/types/calculator';
import { formatCurrency, formatPercent } from '@/services/underwritingCalculatorService';

interface CalculatorOutputModerateProps {
  output: ModerateOutput;
}

export function CalculatorOutputModerate({ output }: CalculatorOutputModerateProps) {
  const { cashFlowProjection, scenarioAnalysis, rampUpMonths } = output;

  // Find when cumulative profit turns positive
  const breakEvenMonth = cashFlowProjection.find(p => p.cumulativeProfit >= 0)?.month || 'Never';

  // Calculate max/min for chart scaling
  const maxProfit = Math.max(...cashFlowProjection.map(p => p.cumulativeProfit));
  const minProfit = Math.min(...cashFlowProjection.map(p => p.cumulativeProfit));
  const range = maxProfit - minProfit || 1;

  return (
    <div className="space-y-4">
      {/* 12-Month Cash Flow Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LineChart className="w-4 h-4" />
              12-Month Cash Flow
            </div>
            <Badge variant="outline" className="text-xs">
              Ramp-up: {rampUpMonths} months
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Simple Bar Chart */}
          <div className="space-y-2">
            {/* Y-axis labels */}
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{formatCurrency(maxProfit)}</span>
              <span className="text-center">Cumulative Profit</span>
              <span>{formatCurrency(minProfit)}</span>
            </div>

            {/* Chart Bars */}
            <div className="flex items-end gap-1 h-32 border-b border-l relative">
              {/* Zero line */}
              {minProfit < 0 && maxProfit > 0 && (
                <div
                  className="absolute left-0 right-0 border-t border-dashed border-muted-foreground/50"
                  style={{
                    bottom: `${((0 - minProfit) / range) * 100}%`,
                  }}
                />
              )}

              {cashFlowProjection.map((projection, index) => {
                const height = ((projection.cumulativeProfit - minProfit) / range) * 100;
                const isPositive = projection.cumulativeProfit >= 0;

                return (
                  <div
                    key={projection.month}
                    className="flex-1 flex flex-col items-center group relative"
                  >
                    <div
                      className={`w-full rounded-t transition-all ${
                        isPositive ? 'bg-green-500' : 'bg-red-400'
                      } hover:opacity-80`}
                      style={{ height: `${Math.max(height, 2)}%` }}
                    />
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full mb-1 hidden group-hover:block z-10">
                      <div className="bg-popover border rounded-md shadow-lg p-2 text-xs whitespace-nowrap">
                        <p className="font-medium">Month {projection.month}</p>
                        <p>Profit: {formatCurrency(projection.netProfit)}</p>
                        <p>Cumulative: {formatCurrency(projection.cumulativeProfit)}</p>
                        <p>Occupancy: {projection.occupancyRate}%</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* X-axis labels */}
            <div className="flex gap-1">
              {cashFlowProjection.map((projection) => (
                <div
                  key={projection.month}
                  className="flex-1 text-center text-[10px] text-muted-foreground"
                >
                  {projection.month}
                </div>
              ))}
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Month 1</p>
              <p className={`font-medium ${cashFlowProjection[0]?.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(cashFlowProjection[0]?.netProfit || 0)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Month 6</p>
              <p className={`font-medium ${cashFlowProjection[5]?.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(cashFlowProjection[5]?.netProfit || 0)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Month 12</p>
              <p className={`font-medium ${cashFlowProjection[11]?.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(cashFlowProjection[11]?.netProfit || 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scenario Analysis */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="w-4 h-4" />
            Scenario Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Conservative */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-transparent dark:border-red-900/30">
              <div>
                <p className="font-medium text-sm">Conservative (85% occupancy)</p>
                <p className="text-xs text-muted-foreground">
                  Break-even: {formatPercent(scenarioAnalysis.conservative.breakEvenOccupancy)}
                </p>
              </div>
              <div className="text-right">
                <p className={`font-bold ${scenarioAnalysis.conservative.monthlyNetProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(scenarioAnalysis.conservative.monthlyNetProfit)}/mo
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatPercent(scenarioAnalysis.conservative.profitMargin)} margin
                </p>
              </div>
            </div>

            {/* Moderate */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-transparent dark:border-amber-900/30">
              <div>
                <p className="font-medium text-sm">Moderate (90% occupancy)</p>
                <p className="text-xs text-muted-foreground">
                  Break-even: {formatPercent(scenarioAnalysis.moderate.breakEvenOccupancy)}
                </p>
              </div>
              <div className="text-right">
                <p className={`font-bold ${scenarioAnalysis.moderate.monthlyNetProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(scenarioAnalysis.moderate.monthlyNetProfit)}/mo
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatPercent(scenarioAnalysis.moderate.profitMargin)} margin
                </p>
              </div>
            </div>

            {/* Optimistic */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-transparent dark:border-green-900/30">
              <div>
                <p className="font-medium text-sm">Optimistic (95% occupancy)</p>
                <p className="text-xs text-muted-foreground">
                  Break-even: {formatPercent(scenarioAnalysis.optimistic.breakEvenOccupancy)}
                </p>
              </div>
              <div className="text-right">
                <p className={`font-bold ${scenarioAnalysis.optimistic.monthlyNetProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(scenarioAnalysis.optimistic.monthlyNetProfit)}/mo
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatPercent(scenarioAnalysis.optimistic.profitMargin)} margin
                </p>
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Year 1 Summary */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Year 1 Total (w/ ramp-up)</span>
            </div>
            <span className={`font-bold ${cashFlowProjection[11]?.cumulativeProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(cashFlowProjection[11]?.cumulativeProfit || 0)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CalculatorOutputModerate;
