import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { DollarSign, TrendingUp, Wallet, CreditCard, Receipt } from 'lucide-react';
import { formatCostRange } from '@/services/tacticFilterService';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CostBreakdown {
  total_min: number;
  total_max: number;
  upfront_capital: number;
  recurring_monthly: number;
  one_time_fees: number;
}

interface BudgetTrackerProps {
  costBreakdown: CostBreakdown;
  userBudgetMax?: number;
  criticalPathCount: number;
  blockedTacticsCount: number;
}

export function BudgetTracker({
  costBreakdown,
  userBudgetMax = 50000,
  criticalPathCount,
  blockedTacticsCount
}: BudgetTrackerProps) {
  const budgetUsagePercent = userBudgetMax > 0
    ? Math.min(100, (costBreakdown.total_max / userBudgetMax) * 100)
    : 0;

  const formatUSD = (amount: number): string => {
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}k`;
    }
    return `$${amount.toLocaleString()}`;
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
      <div className="flex items-center gap-2 mb-4">
        <Wallet className="w-5 h-5 text-emerald-600" />
        <h3 className="font-semibold text-emerald-900">Budget Tracker</h3>
      </div>

      {/* Total Cost Range */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-emerald-700">Total Investment Range</span>
          <span className="font-bold text-emerald-900">
            {formatCostRange(costBreakdown.total_min, costBreakdown.total_max)}
          </span>
        </div>
        <Progress value={budgetUsagePercent} className="h-2" />
        <p className="text-xs text-emerald-600 mt-1">
          {budgetUsagePercent.toFixed(0)}% of your {formatUSD(userBudgetMax)} budget
        </p>
      </div>

      {/* Cost Categories */}
      <div className="space-y-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-between p-2 bg-white/60 rounded-md">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-medium">Upfront Capital</span>
                </div>
                <span className="text-sm font-semibold text-blue-700">
                  {formatUSD(costBreakdown.upfront_capital)}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">One-time startup costs (deposits, initial setup)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-between p-2 bg-white/60 rounded-md">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-medium">Recurring/Month</span>
                </div>
                <span className="text-sm font-semibold text-purple-700">
                  {formatUSD(costBreakdown.recurring_monthly)}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Monthly recurring expenses (rent, utilities, insurance)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-between p-2 bg-white/60 rounded-md">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-medium">One-Time Fees</span>
                </div>
                <span className="text-sm font-semibold text-amber-700">
                  {formatUSD(costBreakdown.one_time_fees)}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Professional services (legal, accounting, permits)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Quick Stats */}
      <div className="mt-4 pt-4 border-t border-emerald-200">
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-2 bg-amber-50 rounded-md border border-amber-200">
            <p className="text-xs text-amber-700 mb-1">Critical Path</p>
            <p className="text-lg font-bold text-amber-900">{criticalPathCount}</p>
          </div>
          <div className="text-center p-2 bg-red-50 rounded-md border border-red-200">
            <p className="text-xs text-red-700 mb-1">Blocked</p>
            <p className="text-lg font-bold text-red-900">{blockedTacticsCount}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
