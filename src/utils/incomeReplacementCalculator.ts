/**
 * FEAT-GH-TOUR: Income Replacement Calculator
 * Calculates properties needed to replace user's income based on
 * state regulations, ownership model, and readiness level.
 */

import type {
  IncomeReplacementRoadmap,
  IncomeReplacementMilestone,
  StateRevenueData,
} from '@/types/assessment';

// ============================================
// State Revenue Matrix
// Average monthly revenue/expenses per bed by state
// ============================================

const STATE_REVENUE_MATRIX: Record<string, StateRevenueData> = {
  // Tier 1: High Revenue States
  CA: {
    stateCode: 'CA',
    stateName: 'California',
    avgMonthlyRevenuePerBed: 4500,
    avgMonthlyExpensesPerBed: 2800,
    licensingTimelineMonths: 6,
    difficultyLevel: 'difficult',
  },
  NY: {
    stateCode: 'NY',
    stateName: 'New York',
    avgMonthlyRevenuePerBed: 4200,
    avgMonthlyExpensesPerBed: 2600,
    licensingTimelineMonths: 8,
    difficultyLevel: 'difficult',
  },
  MA: {
    stateCode: 'MA',
    stateName: 'Massachusetts',
    avgMonthlyRevenuePerBed: 4000,
    avgMonthlyExpensesPerBed: 2500,
    licensingTimelineMonths: 5,
    difficultyLevel: 'moderate',
  },
  NJ: {
    stateCode: 'NJ',
    stateName: 'New Jersey',
    avgMonthlyRevenuePerBed: 3800,
    avgMonthlyExpensesPerBed: 2400,
    licensingTimelineMonths: 6,
    difficultyLevel: 'moderate',
  },

  // Tier 2: Medium Revenue States
  TX: {
    stateCode: 'TX',
    stateName: 'Texas',
    avgMonthlyRevenuePerBed: 3200,
    avgMonthlyExpensesPerBed: 1800,
    licensingTimelineMonths: 4,
    difficultyLevel: 'easy',
  },
  FL: {
    stateCode: 'FL',
    stateName: 'Florida',
    avgMonthlyRevenuePerBed: 3000,
    avgMonthlyExpensesPerBed: 1700,
    licensingTimelineMonths: 4,
    difficultyLevel: 'easy',
  },
  AZ: {
    stateCode: 'AZ',
    stateName: 'Arizona',
    avgMonthlyRevenuePerBed: 3100,
    avgMonthlyExpensesPerBed: 1750,
    licensingTimelineMonths: 3,
    difficultyLevel: 'easy',
  },
  GA: {
    stateCode: 'GA',
    stateName: 'Georgia',
    avgMonthlyRevenuePerBed: 2900,
    avgMonthlyExpensesPerBed: 1650,
    licensingTimelineMonths: 4,
    difficultyLevel: 'easy',
  },
  NC: {
    stateCode: 'NC',
    stateName: 'North Carolina',
    avgMonthlyRevenuePerBed: 2800,
    avgMonthlyExpensesPerBed: 1600,
    licensingTimelineMonths: 5,
    difficultyLevel: 'moderate',
  },
  PA: {
    stateCode: 'PA',
    stateName: 'Pennsylvania',
    avgMonthlyRevenuePerBed: 3000,
    avgMonthlyExpensesPerBed: 1800,
    licensingTimelineMonths: 6,
    difficultyLevel: 'moderate',
  },
  OH: {
    stateCode: 'OH',
    stateName: 'Ohio',
    avgMonthlyRevenuePerBed: 2700,
    avgMonthlyExpensesPerBed: 1550,
    licensingTimelineMonths: 4,
    difficultyLevel: 'easy',
  },
  IL: {
    stateCode: 'IL',
    stateName: 'Illinois',
    avgMonthlyRevenuePerBed: 3100,
    avgMonthlyExpensesPerBed: 1900,
    licensingTimelineMonths: 5,
    difficultyLevel: 'moderate',
  },

  // Tier 3: Lower Revenue States (but easier entry)
  TN: {
    stateCode: 'TN',
    stateName: 'Tennessee',
    avgMonthlyRevenuePerBed: 2500,
    avgMonthlyExpensesPerBed: 1400,
    licensingTimelineMonths: 3,
    difficultyLevel: 'easy',
  },
  AL: {
    stateCode: 'AL',
    stateName: 'Alabama',
    avgMonthlyRevenuePerBed: 2300,
    avgMonthlyExpensesPerBed: 1300,
    licensingTimelineMonths: 3,
    difficultyLevel: 'easy',
  },
  SC: {
    stateCode: 'SC',
    stateName: 'South Carolina',
    avgMonthlyRevenuePerBed: 2400,
    avgMonthlyExpensesPerBed: 1350,
    licensingTimelineMonths: 3,
    difficultyLevel: 'easy',
  },
  MS: {
    stateCode: 'MS',
    stateName: 'Mississippi',
    avgMonthlyRevenuePerBed: 2200,
    avgMonthlyExpensesPerBed: 1250,
    licensingTimelineMonths: 3,
    difficultyLevel: 'easy',
  },
  AR: {
    stateCode: 'AR',
    stateName: 'Arkansas',
    avgMonthlyRevenuePerBed: 2300,
    avgMonthlyExpensesPerBed: 1300,
    licensingTimelineMonths: 3,
    difficultyLevel: 'easy',
  },
};

// Default state data for unknown states
const DEFAULT_STATE_DATA: StateRevenueData = {
  stateCode: 'DEFAULT',
  stateName: 'Default',
  avgMonthlyRevenuePerBed: 2800,
  avgMonthlyExpensesPerBed: 1600,
  licensingTimelineMonths: 4,
  difficultyLevel: 'moderate',
};

// ============================================
// Ownership Model Multipliers
// Adjusts revenue/expenses based on business model
// ============================================

interface OwnershipModelMultipliers {
  revenueMultiplier: number;
  expenseMultiplier: number;
  timelineMultiplier: number;
  bedsPerProperty: number;
}

const OWNERSHIP_MODEL_MATRIX: Record<string, OwnershipModelMultipliers> = {
  ownership: {
    revenueMultiplier: 1.0, // Full revenue
    expenseMultiplier: 1.0, // Standard expenses
    timelineMultiplier: 1.0, // Standard timeline
    bedsPerProperty: 6, // Typical 6-bed home
  },
  rental_arbitrage: {
    revenueMultiplier: 0.85, // Slightly lower due to rent
    expenseMultiplier: 1.15, // Higher expenses (rent + ops)
    timelineMultiplier: 0.6, // Faster to launch
    bedsPerProperty: 6,
  },
  creative_financing: {
    revenueMultiplier: 0.95, // Slightly lower (seller financing costs)
    expenseMultiplier: 1.1, // Higher carrying costs initially
    timelineMultiplier: 0.8, // Faster than traditional
    bedsPerProperty: 6,
  },
  house_hack: {
    revenueMultiplier: 0.7, // Reduced capacity (owner lives there)
    expenseMultiplier: 0.8, // Lower personal expenses offset
    timelineMultiplier: 0.7, // Fast to implement
    bedsPerProperty: 4, // Fewer beds available
  },
  hybrid: {
    revenueMultiplier: 0.9, // Mixed model
    expenseMultiplier: 1.05, // Moderate complexity
    timelineMultiplier: 0.85, // Moderately fast
    bedsPerProperty: 6,
  },
};

// Default model for unknown types
const DEFAULT_MODEL: OwnershipModelMultipliers = {
  revenueMultiplier: 0.9,
  expenseMultiplier: 1.0,
  timelineMultiplier: 1.0,
  bedsPerProperty: 6,
};

// ============================================
// Readiness Level Timeline Adjustments
// Adjusts expected timeline based on user readiness
// ============================================

const READINESS_TIMELINE_MONTHS: Record<string, number> = {
  beginner: 12, // 12 months to first property
  intermediate: 8, // 8 months
  advanced: 5, // 5 months
  ready: 3, // 3 months - ready to execute
};

// ============================================
// Main Calculator Functions
// ============================================

/**
 * Get state revenue data, falling back to default if unknown
 */
export function getStateRevenueData(stateCode: string): StateRevenueData {
  const upperCode = stateCode.toUpperCase();
  return STATE_REVENUE_MATRIX[upperCode] || DEFAULT_STATE_DATA;
}

/**
 * Get ownership model multipliers
 */
export function getOwnershipModelMultipliers(model: string): OwnershipModelMultipliers {
  const normalizedModel = model.toLowerCase().replace(/[^a-z_]/g, '_');
  return OWNERSHIP_MODEL_MATRIX[normalizedModel] || DEFAULT_MODEL;
}

/**
 * Calculate net profit per property based on state and model
 */
export function calculateNetProfitPerProperty(
  stateCode: string,
  ownershipModel: string
): { revenue: number; expenses: number; netProfit: number; beds: number } {
  const stateData = getStateRevenueData(stateCode);
  const modelData = getOwnershipModelMultipliers(ownershipModel);

  const beds = modelData.bedsPerProperty;
  const revenue = stateData.avgMonthlyRevenuePerBed * beds * modelData.revenueMultiplier;
  const expenses = stateData.avgMonthlyExpensesPerBed * beds * modelData.expenseMultiplier;
  const netProfit = revenue - expenses;

  return {
    revenue: Math.round(revenue),
    expenses: Math.round(expenses),
    netProfit: Math.round(netProfit),
    beds,
  };
}

/**
 * Calculate properties needed to replace target income
 */
export function calculatePropertiesNeeded(
  targetMonthlyIncome: number,
  stateCode: string,
  ownershipModel: string
): number {
  const { netProfit } = calculateNetProfitPerProperty(stateCode, ownershipModel);

  if (netProfit <= 0) {
    console.warn('Net profit per property is zero or negative');
    return 10; // Default fallback
  }

  const propertiesNeeded = Math.ceil(targetMonthlyIncome / netProfit);
  return Math.max(1, Math.min(propertiesNeeded, 20)); // Clamp between 1-20
}

/**
 * Generate celebration message based on milestone
 */
function generateCelebrationMessage(
  propertyNumber: number,
  percentageOfGoal: number
): string {
  if (propertyNumber === 1) {
    return "Your first property! You've officially joined the group home industry. This is where it all begins.";
  }
  if (percentageOfGoal >= 100) {
    return "GOAL ACHIEVED! You've built a portfolio that completely replaces your income. Financial freedom is yours!";
  }
  if (percentageOfGoal >= 75) {
    return "Three-quarters of the way there! You can taste the freedom. One or two more properties and you're set.";
  }
  if (percentageOfGoal >= 50) {
    return "Halfway to your income goal! At this point, you've proven the model works. The rest is execution.";
  }
  if (percentageOfGoal >= 25) {
    return "Quarter of your income replaced! Your foundation is solid. Keep the momentum going.";
  }
  return `Property ${propertyNumber} is operational! Each one brings you closer to freedom.`;
}

/**
 * Calculate full income replacement roadmap
 */
export function calculateIncomeReplacementRoadmap(
  targetMonthlyIncome: number,
  stateCode: string,
  ownershipModel: string,
  readinessLevel: string
): IncomeReplacementRoadmap {
  const stateData = getStateRevenueData(stateCode);
  const modelData = getOwnershipModelMultipliers(ownershipModel);
  const baseTimelineMonths = READINESS_TIMELINE_MONTHS[readinessLevel] || 8;

  const propertyFinancials = calculateNetProfitPerProperty(stateCode, ownershipModel);
  const propertiesNeeded = calculatePropertiesNeeded(
    targetMonthlyIncome,
    stateCode,
    ownershipModel
  );

  // Calculate timeline for each property
  // First property takes base timeline + licensing
  // Subsequent properties take less time (scaling factor)
  const firstPropertyMonths = baseTimelineMonths +
    (stateData.licensingTimelineMonths * modelData.timelineMultiplier);

  // Build milestones
  const milestones: IncomeReplacementMilestone[] = [];
  let cumulativeMonths = 0;

  for (let i = 1; i <= propertiesNeeded; i++) {
    // Each additional property takes about 60% of the time (learning curve)
    const additionalMonths = i === 1
      ? firstPropertyMonths
      : Math.max(3, firstPropertyMonths * 0.6);

    cumulativeMonths += additionalMonths;
    const cumulativeIncome = propertyFinancials.netProfit * i;
    const percentageOfGoal = Math.min(100, (cumulativeIncome / targetMonthlyIncome) * 100);

    milestones.push({
      propertyNumber: i,
      cumulativeMonthlyIncome: cumulativeIncome,
      percentageOfGoal: Math.round(percentageOfGoal),
      estimatedMonthsToReach: Math.round(cumulativeMonths),
      celebrationMessage: generateCelebrationMessage(i, percentageOfGoal),
    });
  }

  return {
    targetMonthlyIncome,
    currentIncomeGap: targetMonthlyIncome, // Assuming starting from 0
    propertiesNeeded,
    revenuePerProperty: propertyFinancials.revenue,
    netProfitPerProperty: propertyFinancials.netProfit,
    timelineMonths: Math.round(cumulativeMonths),
    stateCode: stateCode.toUpperCase(),
    ownershipModel,
    readinessLevel,
    milestones,
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Get all available states
 */
export function getAvailableStates(): StateRevenueData[] {
  return Object.values(STATE_REVENUE_MATRIX).sort((a, b) =>
    a.stateName.localeCompare(b.stateName)
  );
}

/**
 * Get ownership model display name
 */
export function getOwnershipModelDisplayName(model: string): string {
  const displayNames: Record<string, string> = {
    ownership: 'Full Ownership',
    rental_arbitrage: 'Rental Arbitrage',
    creative_financing: 'Creative Financing',
    house_hack: 'House Hacking',
    hybrid: 'Hybrid Model',
  };
  return displayNames[model] || 'Custom Model';
}
