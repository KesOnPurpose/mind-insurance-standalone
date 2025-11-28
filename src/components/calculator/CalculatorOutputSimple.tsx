import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  Target,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { CalculatorTooltip } from './CalculatorTooltip';
import { CALCULATOR_TOOLTIPS } from './calculatorTooltipContent';
import {
  SimpleOutput,
  RiskAssessment,
} from '@/types/calculator';
import {
  formatCurrency,
  formatPercent,
  getViabilityStatus,
  getRiskLevelColor,
  getRiskLevelBgColor,
} from '@/services/underwritingCalculatorService';

interface CalculatorOutputSimpleProps {
  output: SimpleOutput;
  riskAssessment?: RiskAssessment;
}

export function CalculatorOutputSimple({ output, riskAssessment }: CalculatorOutputSimpleProps) {
  const viability = getViabilityStatus(output);
  const isProfitable = output.monthlyNetProfit > 0;

  return (
    <div className="space-y-4">
      {/* Viability Banner */}
      <Card className={`border-2 ${isProfitable ? 'border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/30' : 'border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/30'}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isProfitable ? (
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              ) : (
                <XCircle className="w-8 h-8 text-red-600" />
              )}
              <div>
                <p className={`font-semibold ${viability.color}`}>{viability.status}</p>
                <p className="text-sm text-muted-foreground">{viability.description}</p>
              </div>
            </div>
            <Badge
              variant={isProfitable ? 'default' : 'destructive'}
              className="text-lg px-4 py-1"
            >
              {formatCurrency(output.monthlyNetProfit)}/mo
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Monthly Revenue */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs">Monthly Revenue</span>
              <CalculatorTooltip content={CALCULATOR_TOOLTIPS.monthlyGrossRevenue} />
            </div>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(output.monthlyGrossRevenue)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(output.annualGrossRevenue)}/year
            </p>
          </CardContent>
        </Card>

        {/* Monthly Expenses */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingDown className="w-4 h-4" />
              <span className="text-xs">Monthly Expenses</span>
              <CalculatorTooltip content={CALCULATOR_TOOLTIPS.totalMonthlyExpenses} />
            </div>
            <p className="text-2xl font-bold text-orange-600">
              {formatCurrency(output.totalMonthlyExpenses)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(output.totalMonthlyExpenses * 12)}/year
            </p>
          </CardContent>
        </Card>

        {/* Profit Margin */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Percent className="w-4 h-4" />
              <span className="text-xs">Profit Margin</span>
              <CalculatorTooltip content={CALCULATOR_TOOLTIPS.profitMargin} />
            </div>
            <p className={`text-2xl font-bold ${output.profitMargin >= 20 ? 'text-green-600' : output.profitMargin >= 15 ? 'text-amber-600' : 'text-red-600'}`}>
              {formatPercent(output.profitMargin)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Target: 20-35%
            </p>
          </CardContent>
        </Card>

        {/* Break-Even Occupancy */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Target className="w-4 h-4" />
              <span className="text-xs">Break-Even</span>
              <CalculatorTooltip content={CALCULATOR_TOOLTIPS.breakEvenOccupancy} />
            </div>
            <p className={`text-2xl font-bold ${output.breakEvenOccupancy <= 75 ? 'text-green-600' : output.breakEvenOccupancy <= 85 ? 'text-amber-600' : 'text-red-600'}`}>
              {formatPercent(output.breakEvenOccupancy)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Occupancy needed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Annual Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Annual Projection
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Gross Revenue</span>
              <span className="font-medium">{formatCurrency(output.annualGrossRevenue)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Expenses</span>
              <span className="font-medium text-orange-600">
                -{formatCurrency(output.totalMonthlyExpenses * 12)}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="font-medium">Net Profit</span>
              <span className={`font-bold text-lg ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(output.annualNetProfit)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Assessment */}
      {riskAssessment && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Risk Assessment
              </div>
              <Badge className={`${getRiskLevelBgColor(riskAssessment.level)} ${getRiskLevelColor(riskAssessment.level)} border-0`}>
                {riskAssessment.level.toUpperCase()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Safety Score</span>
                  <span className="font-medium">{riskAssessment.score}/100</span>
                </div>
                <Progress
                  value={riskAssessment.score}
                  className={`h-2 ${riskAssessment.score >= 70 ? '[&>div]:bg-green-500' : riskAssessment.score >= 50 ? '[&>div]:bg-amber-500' : '[&>div]:bg-red-500'}`}
                />
              </div>

              {riskAssessment.factors.length > 0 && (
                <div className="space-y-2 pt-2">
                  {riskAssessment.factors.slice(0, 3).map((factor, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className={`w-3 h-3 mt-0.5 flex-shrink-0 ${getRiskLevelColor(factor.impact)}`} />
                      <div>
                        <p className="font-medium">{factor.name}</p>
                        <p className="text-xs text-muted-foreground">{factor.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default CalculatorOutputSimple;
