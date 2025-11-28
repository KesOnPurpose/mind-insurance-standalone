/**
 * Group Home Underwriting Calculator Service
 *
 * Core calculation engine based on Nette's training formulas:
 * - Revenue = beds × rate × occupancy
 * - SSI Max Rent = $907/month ($967 - $60 PNA)
 * - Conservative Projection = gross × 0.85 (15% vacancy buffer)
 * - Break-Even = expenses / (beds × rate)
 */

import {
  CalculatorInputs,
  SimpleOutput,
  ModerateOutput,
  AdvancedOutput,
  MonthlyProjection,
  ScenarioAnalysis,
  StartupBreakdown,
  SensitivityResult,
  RiskAssessment,
  RiskFactor,
  RiskLevel,
  StartupCosts,
  CALCULATOR_CONSTANTS,
  DEFAULT_STARTUP_COSTS,
} from '@/types/calculator';

// ============================================================================
// SIMPLE OUTPUT CALCULATION
// ============================================================================

export function calculateSimpleOutput(inputs: CalculatorInputs): SimpleOutput {
  const { bedCount, ratePerBed, occupancyRate } = inputs;
  const {
    monthlyRent,
    monthlyUtilities,
    maintenanceReservePercent,
    staffingCosts,
    insuranceCost,
    foodCost,
    miscExpenses,
  } = inputs;

  // Revenue Calculation
  const monthlyGrossRevenue = bedCount * ratePerBed * (occupancyRate / 100);

  // Maintenance reserve is a percentage of gross revenue
  const maintenanceReserve = monthlyGrossRevenue * (maintenanceReservePercent / 100);

  // Total Monthly Expenses
  const totalMonthlyExpenses =
    monthlyRent +
    monthlyUtilities +
    maintenanceReserve +
    staffingCosts +
    insuranceCost +
    foodCost +
    miscExpenses;

  // Net Profit
  const monthlyNetProfit = monthlyGrossRevenue - totalMonthlyExpenses;

  // Break-Even Occupancy (what % occupancy needed to cover expenses)
  const maxPossibleRevenue = bedCount * ratePerBed;
  const breakEvenOccupancy = maxPossibleRevenue > 0
    ? (totalMonthlyExpenses / maxPossibleRevenue) * 100
    : 100;

  // Profit Margin
  const profitMargin = monthlyGrossRevenue > 0
    ? (monthlyNetProfit / monthlyGrossRevenue) * 100
    : 0;

  // Annual figures
  const annualGrossRevenue = monthlyGrossRevenue * 12;
  const annualNetProfit = monthlyNetProfit * 12;

  // Viability check
  const isViable = monthlyNetProfit > 0 && breakEvenOccupancy < 100;

  return {
    monthlyGrossRevenue: roundToCents(monthlyGrossRevenue),
    totalMonthlyExpenses: roundToCents(totalMonthlyExpenses),
    monthlyNetProfit: roundToCents(monthlyNetProfit),
    breakEvenOccupancy: roundToPercent(breakEvenOccupancy),
    profitMargin: roundToPercent(profitMargin),
    annualGrossRevenue: roundToCents(annualGrossRevenue),
    annualNetProfit: roundToCents(annualNetProfit),
    isViable,
  };
}

// ============================================================================
// MODERATE OUTPUT CALCULATION
// ============================================================================

export function calculateModerateOutput(inputs: CalculatorInputs): ModerateOutput {
  const simpleOutput = calculateSimpleOutput(inputs);

  // Generate 12-month cash flow projection with ramp-up
  const cashFlowProjection = generateCashFlowProjection(inputs);

  // Calculate scenario analysis (conservative/moderate/optimistic)
  const scenarioAnalysis = calculateScenarioAnalysis(inputs);

  // Calculate ramp-up months (time to reach target occupancy)
  const rampUpMonths = calculateRampUpMonths(inputs.occupancyRate);

  return {
    ...simpleOutput,
    cashFlowProjection,
    scenarioAnalysis,
    rampUpMonths,
  };
}

function generateCashFlowProjection(inputs: CalculatorInputs): MonthlyProjection[] {
  const { bedCount, ratePerBed, occupancyRate } = inputs;
  const projections: MonthlyProjection[] = [];
  let cumulativeProfit = 0;

  // Ramp-up assumptions:
  // Month 1: 50% of target occupancy
  // Month 2: 65% of target occupancy
  // Month 3: 80% of target occupancy
  // Month 4+: Target occupancy
  const rampUpRates = [0.5, 0.65, 0.8, 1, 1, 1, 1, 1, 1, 1, 1, 1];

  for (let month = 1; month <= 12; month++) {
    const rampUpMultiplier = rampUpRates[month - 1];
    const effectiveOccupancy = occupancyRate * rampUpMultiplier;

    // Calculate this month's figures
    const monthInputs: CalculatorInputs = {
      ...inputs,
      occupancyRate: effectiveOccupancy,
    };
    const monthOutput = calculateSimpleOutput(monthInputs);

    cumulativeProfit += monthOutput.monthlyNetProfit;

    projections.push({
      month,
      monthLabel: `Month ${month}`,
      grossRevenue: monthOutput.monthlyGrossRevenue,
      expenses: monthOutput.totalMonthlyExpenses,
      netProfit: monthOutput.monthlyNetProfit,
      cumulativeProfit: roundToCents(cumulativeProfit),
      occupancyRate: roundToPercent(effectiveOccupancy),
    });
  }

  return projections;
}

function calculateScenarioAnalysis(inputs: CalculatorInputs): ScenarioAnalysis {
  // Conservative: 85% occupancy
  const conservativeInputs = { ...inputs, occupancyRate: 85 };
  const conservative = calculateSimpleOutput(conservativeInputs);

  // Moderate: 90% occupancy (or user's target if lower)
  const moderateOccupancy = Math.min(90, inputs.occupancyRate);
  const moderateInputs = { ...inputs, occupancyRate: moderateOccupancy };
  const moderate = calculateSimpleOutput(moderateInputs);

  // Optimistic: 95% occupancy (or user's target if higher)
  const optimisticOccupancy = Math.max(95, inputs.occupancyRate);
  const optimisticInputs = { ...inputs, occupancyRate: optimisticOccupancy };
  const optimistic = calculateSimpleOutput(optimisticInputs);

  return { conservative, moderate, optimistic };
}

function calculateRampUpMonths(targetOccupancy: number): number {
  // Industry standard: 3-6 months to reach target occupancy
  // Higher target = longer ramp-up
  if (targetOccupancy <= 85) return 3;
  if (targetOccupancy <= 90) return 4;
  if (targetOccupancy <= 95) return 5;
  return 6;
}

// ============================================================================
// ADVANCED OUTPUT CALCULATION
// ============================================================================

export function calculateAdvancedOutput(inputs: CalculatorInputs): AdvancedOutput {
  const moderateOutput = calculateModerateOutput(inputs);

  // Helper to ensure valid positive number (handles undefined, null, NaN, and 0)
  const ensureNumber = (value: number | undefined, defaultValue: number): number => {
    if (value === undefined || value === null || isNaN(value)) {
      return defaultValue;
    }
    return value;
  };

  // Merge user startup costs with defaults to prevent NaN from undefined values
  const startupCosts: StartupCosts = {
    licensingCosts: ensureNumber(inputs.startupCosts?.licensingCosts, DEFAULT_STARTUP_COSTS.licensingCosts),
    renovationCosts: ensureNumber(inputs.startupCosts?.renovationCosts, DEFAULT_STARTUP_COSTS.renovationCosts),
    furnitureCosts: ensureNumber(inputs.startupCosts?.furnitureCosts, DEFAULT_STARTUP_COSTS.furnitureCosts),
    marketingCosts: ensureNumber(inputs.startupCosts?.marketingCosts, DEFAULT_STARTUP_COSTS.marketingCosts),
    // Reserve fund must be at least 1 to prevent division issues
    reserveFund: Math.max(1, ensureNumber(inputs.startupCosts?.reserveFund, DEFAULT_STARTUP_COSTS.reserveFund)),
  };

  // Startup breakdown
  const startupBreakdown = calculateStartupBreakdown(startupCosts, moderateOutput.totalMonthlyExpenses);

  // ROI and payback calculations
  const yearOneROI = calculateYearOneROI(moderateOutput.annualNetProfit, startupBreakdown.totalStartupCosts);
  const cashOnCashReturn = calculateCashOnCashReturn(moderateOutput.annualNetProfit, startupBreakdown.totalStartupCosts);
  const breakEvenMonths = calculateBreakEvenMonths(moderateOutput.cashFlowProjection, startupBreakdown.totalStartupCosts);
  const paybackPeriod = calculatePaybackPeriod(moderateOutput.monthlyNetProfit, startupBreakdown.totalStartupCosts);

  // Sensitivity analysis
  const sensitivityAnalysis = calculateSensitivityAnalysis(inputs);

  // Total investment required (startup + 3 months operating)
  const totalInvestmentRequired = startupBreakdown.totalStartupCosts + (moderateOutput.totalMonthlyExpenses * 3);

  return {
    ...moderateOutput,
    startupBreakdown,
    breakEvenMonths,
    yearOneROI: roundToPercent(yearOneROI),
    cashOnCashReturn: roundToPercent(cashOnCashReturn),
    paybackPeriod,
    sensitivityAnalysis,
    totalInvestmentRequired: roundToCents(totalInvestmentRequired),
  };
}

function calculateStartupBreakdown(
  startupCosts: StartupCosts,
  monthlyExpenses: number
): StartupBreakdown {
  const totalStartupCosts =
    startupCosts.licensingCosts +
    startupCosts.renovationCosts +
    startupCosts.furnitureCosts +
    startupCosts.marketingCosts +
    startupCosts.reserveFund;

  const monthsOfReserve = monthlyExpenses > 0
    ? startupCosts.reserveFund / monthlyExpenses
    : 0;

  return {
    totalStartupCosts: roundToCents(totalStartupCosts),
    licensingCosts: startupCosts.licensingCosts,
    renovationCosts: startupCosts.renovationCosts,
    furnitureCosts: startupCosts.furnitureCosts,
    marketingCosts: startupCosts.marketingCosts,
    reserveFund: startupCosts.reserveFund,
    monthsOfReserve: Math.round(monthsOfReserve * 10) / 10,
  };
}

function calculateYearOneROI(annualNetProfit: number, totalStartupCosts: number): number {
  if (totalStartupCosts <= 0) return 0;
  return (annualNetProfit / totalStartupCosts) * 100;
}

function calculateCashOnCashReturn(annualNetProfit: number, totalStartupCosts: number): number {
  // Same as ROI for this simple model (no debt financing)
  return calculateYearOneROI(annualNetProfit, totalStartupCosts);
}

function calculateBreakEvenMonths(
  projections: MonthlyProjection[],
  totalStartupCosts: number
): number {
  // Find month where cumulative profit exceeds startup costs
  let cumulativeProfit = -totalStartupCosts; // Start negative (we've invested)

  for (const projection of projections) {
    cumulativeProfit += projection.netProfit;
    if (cumulativeProfit >= 0) {
      return projection.month;
    }
  }

  // If not reached in 12 months, extrapolate
  const lastProjection = projections[projections.length - 1];
  if (lastProjection && lastProjection.netProfit > 0) {
    const remainingToBreakEven = -cumulativeProfit;
    const additionalMonths = Math.ceil(remainingToBreakEven / lastProjection.netProfit);
    return 12 + additionalMonths;
  }

  return 999; // Never breaks even
}

function calculatePaybackPeriod(monthlyNetProfit: number, totalStartupCosts: number): number {
  if (monthlyNetProfit <= 0) return 999;
  return Math.ceil(totalStartupCosts / monthlyNetProfit);
}

function calculateSensitivityAnalysis(inputs: CalculatorInputs): SensitivityResult[] {
  const baseOutput = calculateSimpleOutput(inputs);
  const results: SensitivityResult[] = [];

  // Test sensitivity to occupancy rate (-10%)
  const lowerOccupancy = inputs.occupancyRate * 0.9;
  const lowerOccupancyOutput = calculateSimpleOutput({ ...inputs, occupancyRate: lowerOccupancy });
  results.push({
    variable: 'Occupancy Rate',
    baseValue: inputs.occupancyRate,
    adjustedValue: roundToPercent(lowerOccupancy),
    changePercent: -10,
    impactOnProfit: roundToCents(lowerOccupancyOutput.monthlyNetProfit - baseOutput.monthlyNetProfit),
    impactPercent: roundToPercent(
      ((lowerOccupancyOutput.monthlyNetProfit - baseOutput.monthlyNetProfit) / baseOutput.monthlyNetProfit) * 100
    ),
  });

  // Test sensitivity to rent (+20%)
  const higherRent = inputs.monthlyRent * 1.2;
  const higherRentOutput = calculateSimpleOutput({ ...inputs, monthlyRent: higherRent });
  results.push({
    variable: 'Monthly Rent',
    baseValue: inputs.monthlyRent,
    adjustedValue: roundToCents(higherRent),
    changePercent: 20,
    impactOnProfit: roundToCents(higherRentOutput.monthlyNetProfit - baseOutput.monthlyNetProfit),
    impactPercent: roundToPercent(
      ((higherRentOutput.monthlyNetProfit - baseOutput.monthlyNetProfit) / baseOutput.monthlyNetProfit) * 100
    ),
  });

  // Test sensitivity to rate per bed (-10%)
  const lowerRate = inputs.ratePerBed * 0.9;
  const lowerRateOutput = calculateSimpleOutput({ ...inputs, ratePerBed: lowerRate });
  results.push({
    variable: 'Rate Per Bed',
    baseValue: inputs.ratePerBed,
    adjustedValue: roundToCents(lowerRate),
    changePercent: -10,
    impactOnProfit: roundToCents(lowerRateOutput.monthlyNetProfit - baseOutput.monthlyNetProfit),
    impactPercent: roundToPercent(
      ((lowerRateOutput.monthlyNetProfit - baseOutput.monthlyNetProfit) / baseOutput.monthlyNetProfit) * 100
    ),
  });

  // Test sensitivity to staffing costs (+$500)
  const higherStaffing = inputs.staffingCosts + 500;
  const higherStaffingOutput = calculateSimpleOutput({ ...inputs, staffingCosts: higherStaffing });
  results.push({
    variable: 'Staffing Costs',
    baseValue: inputs.staffingCosts,
    adjustedValue: higherStaffing,
    changePercent: inputs.staffingCosts > 0 ? roundToPercent((500 / inputs.staffingCosts) * 100) : 100,
    impactOnProfit: roundToCents(higherStaffingOutput.monthlyNetProfit - baseOutput.monthlyNetProfit),
    impactPercent: roundToPercent(
      ((higherStaffingOutput.monthlyNetProfit - baseOutput.monthlyNetProfit) / baseOutput.monthlyNetProfit) * 100
    ),
  });

  return results;
}

// ============================================================================
// RISK ASSESSMENT
// ============================================================================

export function calculateRiskAssessment(
  inputs: CalculatorInputs,
  output: SimpleOutput
): RiskAssessment {
  const factors: RiskFactor[] = [];
  let totalScore = 0;

  // Factor 1: Break-even occupancy
  if (output.breakEvenOccupancy > 85) {
    factors.push({
      name: 'High Break-Even Point',
      impact: 'high',
      description: `Break-even at ${output.breakEvenOccupancy}% occupancy leaves little margin for error`,
      recommendation: 'Consider reducing expenses or increasing revenue per bed',
    });
    totalScore += 30;
  } else if (output.breakEvenOccupancy > 75) {
    factors.push({
      name: 'Moderate Break-Even Point',
      impact: 'moderate',
      description: `Break-even at ${output.breakEvenOccupancy}% occupancy is acceptable but watch closely`,
    });
    totalScore += 15;
  }

  // Factor 2: Profit margin
  if (output.profitMargin < 15) {
    factors.push({
      name: 'Low Profit Margin',
      impact: 'high',
      description: `${output.profitMargin}% profit margin is below the recommended 20-35%`,
      recommendation: 'Aim for 20%+ margin for sustainable operations',
    });
    totalScore += 25;
  } else if (output.profitMargin < 20) {
    factors.push({
      name: 'Below Target Margin',
      impact: 'moderate',
      description: `${output.profitMargin}% profit margin is below the ideal 20%+ target`,
    });
    totalScore += 10;
  }

  // Factor 3: Rate vs SSI maximum
  if (inputs.ratePerBed > CALCULATOR_CONSTANTS.SSI_MAX_RENT) {
    factors.push({
      name: 'Rate Exceeds SSI Maximum',
      impact: 'moderate',
      description: `$${inputs.ratePerBed}/bed exceeds SSI max of $${CALCULATOR_CONSTANTS.SSI_MAX_RENT}`,
      recommendation: 'May limit resident pool to private-pay only',
    });
    totalScore += 15;
  }

  // Factor 4: High occupancy assumption
  if (inputs.occupancyRate > 95) {
    factors.push({
      name: 'Aggressive Occupancy Target',
      impact: 'moderate',
      description: `${inputs.occupancyRate}% occupancy is optimistic; industry average is 85-90%`,
      recommendation: 'Plan for 90% occupancy as conservative baseline',
    });
    totalScore += 15;
  }

  // Factor 5: No staffing costs
  if (inputs.staffingCosts === 0 && inputs.bedCount > 6) {
    factors.push({
      name: 'No Staffing Budget',
      impact: 'high',
      description: `With ${inputs.bedCount} beds, staffing may be required`,
      recommendation: 'Budget for at least part-time caregiver assistance',
    });
    totalScore += 20;
  }

  // Factor 6: Low reserve
  if (inputs.startupCosts && inputs.startupCosts.reserveFund < inputs.monthlyRent * 3) {
    factors.push({
      name: 'Insufficient Reserve Fund',
      impact: 'moderate',
      description: 'Reserve fund should cover at least 3 months of expenses',
      recommendation: 'Increase reserve to 3-6 months operating expenses',
    });
    totalScore += 15;
  }

  // Determine overall risk level
  let level: RiskLevel;
  if (totalScore >= 60) {
    level = 'critical';
  } else if (totalScore >= 40) {
    level = 'high';
  } else if (totalScore >= 20) {
    level = 'moderate';
  } else {
    level = 'low';
  }

  // Invert score for display (100 = safe, 0 = risky)
  const displayScore = Math.max(0, 100 - totalScore);

  return {
    level,
    score: displayScore,
    factors,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundToPercent(value: number): number {
  return Math.round(value * 10) / 10;
}

// ============================================================================
// FORMATTING HELPERS (for display)
// ============================================================================

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrencyDetailed(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function getRiskLevelColor(level: RiskLevel): string {
  switch (level) {
    case 'low':
      return 'text-green-600';
    case 'moderate':
      return 'text-amber-600';
    case 'high':
      return 'text-orange-600';
    case 'critical':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
}

export function getRiskLevelBgColor(level: RiskLevel): string {
  switch (level) {
    case 'low':
      return 'bg-green-100';
    case 'moderate':
      return 'bg-amber-100';
    case 'high':
      return 'bg-orange-100';
    case 'critical':
      return 'bg-red-100';
    default:
      return 'bg-gray-100';
  }
}

export function getViabilityStatus(output: SimpleOutput): {
  status: string;
  color: string;
  description: string;
} {
  if (!output.isViable) {
    return {
      status: 'Not Viable',
      color: 'text-red-600',
      description: 'This scenario does not generate positive cash flow',
    };
  }

  if (output.profitMargin >= 25) {
    return {
      status: 'Excellent',
      color: 'text-green-600',
      description: 'Strong profit margin with healthy cash flow',
    };
  }

  if (output.profitMargin >= 20) {
    return {
      status: 'Good',
      color: 'text-emerald-600',
      description: 'Solid profit margin meeting industry benchmarks',
    };
  }

  if (output.profitMargin >= 15) {
    return {
      status: 'Acceptable',
      color: 'text-amber-600',
      description: 'Modest profit margin; consider optimization',
    };
  }

  return {
    status: 'Marginal',
    color: 'text-orange-600',
    description: 'Thin profit margin; high risk of losses',
  };
}
