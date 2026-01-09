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
  GraduationCap,
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

  // Calculate Nette's formula components from output
  const goalProfit = output.monthlyNetProfit > 0 ? output.monthlyNetProfit : 4000; // Use actual or default goal
  const monthlyExpenses = output.totalMonthlyExpenses;
  const numberOfBeds = output.bedCount || 6; // Use actual bed count from inputs
  const calculatedPricePerBed = (goalProfit + monthlyExpenses) / numberOfBeds;

  return (
    <div className="space-y-4">
      {/* Nette's Week 1 Formula Card */}
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Nette's Week 1 Profit Formula</CardTitle>
              <p className="text-xs text-muted-foreground">Price Per Bed Calculation</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Formula Display */}
            <div className="bg-white rounded-lg p-4 border-2 border-purple-300">
              <div className="text-center space-y-2">
                <p className="text-sm font-medium text-purple-900">Price Per Bed =</p>
                <div className="flex items-center justify-center gap-3">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Goal Profit</p>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(goalProfit)}</p>
                  </div>
                  <span className="text-2xl text-purple-500">+</span>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Monthly Expenses</p>
                    <p className="text-lg font-bold text-orange-600">{formatCurrency(monthlyExpenses)}</p>
                  </div>
                  <span className="text-2xl text-purple-500">÷</span>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Number of Beds</p>
                    <p className="text-lg font-bold text-blue-600">{numberOfBeds}</p>
                  </div>
                </div>
                <Separator />
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground mb-1">Your Calculated Price Per Bed:</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    {formatCurrency(calculatedPricePerBed)}/month
                  </p>
                </div>
              </div>
            </div>

            {/* SSI Validation Check */}
            <div className={`p-3 rounded-lg border-2 ${calculatedPricePerBed <= 967 ? 'bg-green-50 border-green-300' : 'bg-amber-50 border-amber-300'}`}>
              <div className="flex items-start gap-2">
                {calculatedPricePerBed <= 967 ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                )}
                <div className="text-sm">
                  <p className={`font-semibold ${calculatedPricePerBed <= 967 ? 'text-green-900' : 'text-amber-900'}`}>
                    {calculatedPricePerBed <= 967
                      ? '✓ SSI-Compatible Pricing'
                      : '⚠️ Above SSI Rate ($967/month)'
                    }
                  </p>
                  <p className={`text-xs mt-1 ${calculatedPricePerBed <= 967 ? 'text-green-700' : 'text-amber-700'}`}>
                    {calculatedPricePerBed <= 967
                      ? 'You can serve SSI recipients (largest population). This pricing works within 2025 SSI limits.'
                      : `You'll need market-rate residents or dual pricing strategy (see M011). SSI pays $967/month max.`
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Nette's Teaching Quote */}
            <div className="bg-purple-100 border-l-4 border-purple-500 p-3 rounded-r-lg">
              <p className="text-xs italic text-purple-900">
                "Goal profit plus expenses equals required income. Required income divided by beds equals price per bed.
                The starting rate is $750. When you get people paying market rent, your average goes up."
              </p>
              <p className="text-xs font-semibold text-purple-700 mt-1">- Lynette Wheaton, Session 1</p>
            </div>
          </div>
        </CardContent>
      </Card>

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
