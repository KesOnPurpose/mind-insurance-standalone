// ============================================================================
// NETTE-INSPIRED SCENARIO TEMPLATES
// ============================================================================
// Pre-configured calculator scenarios based on Lynette Wheaton's curriculum
// Source: Unlicensed Group Home Business Model training
// ============================================================================

import type { CalculatorInputs } from '@/types/calculator';

// ============================================================================
// TEMPLATE CATEGORIES (Based on Nette's Demographics)
// ============================================================================

export type ScenarioTemplateCategory =
  | 'income_based'     // SSI, Market Rate, Mixed Income strategies
  | 'demographic'      // Seniors, Veterans, Reentry, Mental Health
  | 'room_type'        // Private vs Shared room strategies
  | 'scaling'          // 2nd/3rd home projections
  | 'analysis';        // Break-even, Conservative estimates

// ============================================================================
// TEMPLATE INTERFACE
// ============================================================================

export interface ScenarioTemplate {
  id: string;
  name: string;
  description: string;
  category: ScenarioTemplateCategory;
  icon: string; // Emoji for visual identification
  inputs: Partial<CalculatorInputs>;
  // Educational context from Nette's teachings
  netteContext: {
    lesson?: string;
    keyInsight: string;
    targetDemographic?: string;
    incomeSource?: string;
  };
  // Suggested modifications
  suggestedModifications?: string[];
}

// ============================================================================
// NETTE'S KEY CONSTANTS (From Curriculum)
// ============================================================================

export const NETTE_CONSTANTS = {
  // SSI Income (Session 1)
  SSI_FEDERAL: 967,
  SSI_NY_NJ: 1100,       // Higher SSI states
  PNA_DEDUCTION: 60,     // Personal Needs Allowance
  SSI_MAX_RENT: 907,     // Federal SSI - PNA

  // Market Rates (Lesson 19)
  MARKET_RATE_PRIVATE_MIN: 1500,
  MARKET_RATE_PRIVATE_MAX: 2500,
  MARKET_RATE_SHARED: 1500,

  // Subsidized Rates (Lesson 19)
  SUBSIDIZED_RATE_MIN: 750,
  SUBSIDIZED_RATE_MAX: 1200,

  // Private vs Shared Rule (Lesson 19)
  PRIVATE_ROOM_MULTIPLIER: 2, // Private = 2x shared

  // Occupancy Targets
  TARGET_OCCUPANCY: 90,
  CONSERVATIVE_OCCUPANCY: 85,
  OPTIMISTIC_OCCUPANCY: 95,

  // Break-even Safety Buffer
  SAFE_BREAK_EVEN_MAX: 65, // Should be below 65% for safety
} as const;

// ============================================================================
// INCOME-BASED TEMPLATES
// ============================================================================

const incomeBasedTemplates: ScenarioTemplate[] = [
  {
    id: 'standard-ssi',
    name: 'Standard SSI Housing',
    description: 'Base model using federal SSI rate ($907/bed after PNA deduction)',
    category: 'income_based',
    icon: '💰',
    inputs: {
      bedCount: 6,
      ratePerBed: NETTE_CONSTANTS.SSI_MAX_RENT, // $907
      occupancyRate: NETTE_CONSTANTS.TARGET_OCCUPANCY,
      monthlyRent: 1800,
      monthlyUtilities: 350,
      maintenanceReservePercent: 15,
      staffingCosts: 0,
      insuranceCost: 150,
      foodCost: 500,
      miscExpenses: 150,
    },
    netteContext: {
      lesson: 'Session 1 - Mastering the Unlicensed Group Home Business Model',
      keyInsight: 'SSI Maximum is $967, minus $60 PNA = $907 max rent per bed',
      targetDemographic: 'Cognitively aware, ambulatory, guaranteed income',
      incomeSource: 'SSI (Supplemental Security Income)',
    },
    suggestedModifications: [
      'Adjust for your state SSI rate (NY/NJ ~$1100)',
      'Add food costs if providing meals',
      'Consider house manager costs if scaling',
    ],
  },
  {
    id: 'market-rate',
    name: 'Market Rate Housing',
    description: 'Premium pricing for higher-income residents ($1500-2500/bed)',
    category: 'income_based',
    icon: '🏆',
    inputs: {
      bedCount: 6,
      ratePerBed: 1800, // Market rate average
      occupancyRate: 85, // Conservative - market rate may have slower fill
      monthlyRent: 2500,
      monthlyUtilities: 450,
      maintenanceReservePercent: 15,
      staffingCosts: 0,
      insuranceCost: 200,
      foodCost: 700,
      miscExpenses: 250,
    },
    netteContext: {
      lesson: 'Lesson 19 - Maximizing Profit and Revenue',
      keyInsight: 'Market rate: $1500-2500 for private, $1500 for shared',
      targetDemographic: 'Social Security, SSDI, Pension, Railroad benefits recipients',
      incomeSource: 'Social Security, SSDI, Pensions, VA Benefits',
    },
    suggestedModifications: [
      'Research local market rates in your area',
      'Consider offering premium amenities',
      'May require more marketing effort',
    ],
  },
  {
    id: 'mixed-income',
    name: 'Mixed Income Strategy',
    description: 'Combine market rate + subsidized beds for stable cash flow',
    category: 'income_based',
    icon: '⚖️',
    inputs: {
      // Example: 2 market @ $1500 + 4 subsidized @ $800 = $6200/6 = ~$1033 avg
      bedCount: 6,
      ratePerBed: 1033, // Weighted average
      occupancyRate: 90,
      monthlyRent: 2000,
      monthlyUtilities: 400,
      maintenanceReservePercent: 15,
      staffingCosts: 0,
      insuranceCost: 175,
      foodCost: 600,
      miscExpenses: 200,
    },
    netteContext: {
      lesson: 'Lesson 19 - Maximizing Profit and Revenue',
      keyInsight: 'Sliding scale pricing is FHA compliant - combine income levels',
      targetDemographic: 'Mix of income levels for stability',
      incomeSource: 'Multiple: SSI, Social Security, Pensions',
    },
    suggestedModifications: [
      'Calculate exact weighted average for your mix',
      'Example: 2 @ $1500 + 4 @ $800 = $6200 total',
      'Helps fill beds faster while maintaining profit',
    ],
  },
  {
    id: 'subsidized-only',
    name: 'Subsidized Rate Housing',
    description: 'Lower rates for low-income residents ($750-1200/bed)',
    category: 'income_based',
    icon: '🤝',
    inputs: {
      bedCount: 6,
      ratePerBed: 800, // Subsidized rate
      occupancyRate: 95, // Higher fill rate at lower price
      monthlyRent: 1500,
      monthlyUtilities: 300,
      maintenanceReservePercent: 15,
      staffingCosts: 0,
      insuranceCost: 125,
      foodCost: 400,
      miscExpenses: 150,
    },
    netteContext: {
      lesson: 'Lesson 19 - Maximizing Profit and Revenue',
      keyInsight: 'Subsidized rate $750-1200 fills faster but lower margin',
      targetDemographic: 'Low-income individuals needing affordable housing',
      incomeSource: 'SSI, Limited income',
    },
    suggestedModifications: [
      'Keep expenses tight to maintain profit',
      'Higher occupancy compensates for lower rate',
      'Easier referral flow from social services',
    ],
  },
];

// ============================================================================
// DEMOGRAPHIC-FOCUSED TEMPLATES
// ============================================================================

const demographicTemplates: ScenarioTemplate[] = [
  {
    id: 'seniors-65-plus',
    name: 'Seniors 65+ Housing',
    description: 'Long-term residents with stable income and low turnover',
    category: 'demographic',
    icon: '👴',
    inputs: {
      bedCount: 6,
      ratePerBed: 950, // Social Security + SSI often higher
      occupancyRate: 95, // Low turnover = high occupancy
      monthlyRent: 1800,
      monthlyUtilities: 400,
      maintenanceReservePercent: 12, // Less damage typically
      staffingCosts: 0,
      insuranceCost: 175,
      foodCost: 650,
      miscExpenses: 175,
    },
    netteContext: {
      lesson: 'Lesson 7 - Reentry & Justice Involved Housing Strategies',
      keyInsight: 'Seniors 65+ have 5% recidivism - they stay long term',
      targetDemographic: 'Seniors 65+ seeking stable housing',
      incomeSource: 'Social Security, SSI, Pensions',
    },
    suggestedModifications: [
      'Consider accessibility features',
      'May need grab bars, wheelchair access',
      'Lower turnover = lower marketing costs',
    ],
  },
  {
    id: 'veterans-housing',
    name: 'Veterans Housing',
    description: 'Housing for veterans with VA benefits',
    category: 'demographic',
    icon: '🎖️',
    inputs: {
      bedCount: 6,
      ratePerBed: 1100, // VA benefits often higher
      occupancyRate: 90,
      monthlyRent: 2000,
      monthlyUtilities: 400,
      maintenanceReservePercent: 15,
      staffingCosts: 0,
      insuranceCost: 175,
      foodCost: 600,
      miscExpenses: 200,
    },
    netteContext: {
      lesson: 'Session 1 - Mastering the Unlicensed Group Home Business Model',
      keyInsight: 'Veterans often have multiple income sources: VA + SSI + SSDI',
      targetDemographic: 'Veterans needing housing',
      incomeSource: 'VA Benefits, SSDI, Social Security',
    },
    suggestedModifications: [
      'Connect with VA referral sources',
      'Research VA per diem programs in your state',
      'Veterans have strong support networks',
    ],
  },
  {
    id: 'reentry-housing',
    name: 'Reentry Housing',
    description: 'Housing for returning citizens (justice-involved)',
    category: 'demographic',
    icon: '🔓',
    inputs: {
      bedCount: 6,
      ratePerBed: 850, // Often SSI or reentry grants
      occupancyRate: 90,
      monthlyRent: 1800,
      monthlyUtilities: 350,
      maintenanceReservePercent: 18, // Slightly higher reserve
      staffingCosts: 0,
      insuranceCost: 200, // Higher insurance may be needed
      foodCost: 550,
      miscExpenses: 200,
    },
    netteContext: {
      lesson: 'Lesson 7 - Reentry & Justice Involved Housing Strategies',
      keyInsight: 'High demand demographic nationwide, seniors 65+ rarely return',
      targetDemographic: 'Returning citizens from incarceration',
      incomeSource: 'SSI, Reentry grants, Social Security',
    },
    suggestedModifications: [
      'Connect with parole/probation officers',
      'Build relationships with reentry case managers',
      'Focus on seniors 65+ for lowest recidivism (5%)',
    ],
  },
  {
    id: 'mental-health-housing',
    name: 'Mental Health Housing',
    description: 'Stable housing for individuals with mental health needs',
    category: 'demographic',
    icon: '🧠',
    inputs: {
      bedCount: 6,
      ratePerBed: 907, // SSI rate
      occupancyRate: 90,
      monthlyRent: 1800,
      monthlyUtilities: 350,
      maintenanceReservePercent: 15,
      staffingCosts: 0,
      insuranceCost: 175,
      foodCost: 550,
      miscExpenses: 175,
    },
    netteContext: {
      lesson: 'Session 1 - Mastering the Unlicensed Group Home Business Model',
      keyInsight: 'Housing ONLY, no services - cognitively aware, ambulatory',
      targetDemographic: 'Individuals with mental health challenges (stable)',
      incomeSource: 'SSI, SSDI',
    },
    suggestedModifications: [
      'Remember: Housing ONLY, not treatment',
      'Must be cognitively aware and ambulatory',
      'Build relationships with mental health case managers',
    ],
  },
  {
    id: 'physical-disability',
    name: 'Physical Disability Housing',
    description: 'Accessible housing for individuals with physical disabilities',
    category: 'demographic',
    icon: '♿',
    inputs: {
      bedCount: 6,
      ratePerBed: 950, // SSDI often higher than SSI
      occupancyRate: 90,
      monthlyRent: 2000,
      monthlyUtilities: 400,
      maintenanceReservePercent: 15,
      staffingCosts: 0,
      insuranceCost: 175,
      foodCost: 600,
      miscExpenses: 200,
    },
    netteContext: {
      lesson: 'Session 1 - Mastering the Unlicensed Group Home Business Model',
      keyInsight: 'Ambulatory requirement - they can care for themselves',
      targetDemographic: 'Individuals with physical disabilities (ambulatory)',
      incomeSource: 'SSDI, SSI, Social Security',
    },
    suggestedModifications: [
      'Consider ground floor rooms',
      'May need wheelchair accessibility features',
      'Budget for potential modifications',
    ],
  },
];

// ============================================================================
// ROOM TYPE TEMPLATES (Lesson 19 - Private vs Shared)
// ============================================================================

const roomTypeTemplates: ScenarioTemplate[] = [
  {
    id: 'private-rooms-only',
    name: 'All Private Rooms',
    description: 'Premium private room configuration at 2x shared rate',
    category: 'room_type',
    icon: '🚪',
    inputs: {
      bedCount: 4, // Fewer beds = fewer rooms, but higher rate
      ratePerBed: 1600, // Private room rate
      occupancyRate: 85, // May be slower to fill
      monthlyRent: 2200,
      monthlyUtilities: 400,
      maintenanceReservePercent: 15,
      staffingCosts: 0,
      insuranceCost: 175,
      foodCost: 500,
      miscExpenses: 200,
    },
    netteContext: {
      lesson: 'Lesson 19 - Maximizing Profit and Revenue',
      keyInsight: 'Private room = 2x shared room price ($1600 vs $800)',
      targetDemographic: 'Residents willing to pay premium for privacy',
      incomeSource: 'Higher income: Social Security, SSDI, Pensions',
    },
    suggestedModifications: [
      'Great for smaller properties (3-4 bed)',
      'Higher profit per bed but fewer beds',
      'Target working professionals or seniors with pensions',
    ],
  },
  {
    id: 'shared-rooms-only',
    name: 'All Shared Rooms',
    description: 'Maximum beds with shared room configuration',
    category: 'room_type',
    icon: '👥',
    inputs: {
      bedCount: 8, // More beds in shared configuration
      ratePerBed: 800, // Shared room rate
      occupancyRate: 95, // Fills faster at lower price
      monthlyRent: 1800,
      monthlyUtilities: 450,
      maintenanceReservePercent: 18, // More wear with more people
      staffingCosts: 0,
      insuranceCost: 200,
      foodCost: 700,
      miscExpenses: 250,
    },
    netteContext: {
      lesson: 'Lesson 19 - Maximizing Profit and Revenue',
      keyInsight: 'Shared rooms = more beds, lower rate, faster fill',
      targetDemographic: 'Budget-conscious residents',
      incomeSource: 'SSI, Limited income',
    },
    suggestedModifications: [
      'Best for larger properties',
      'Volume compensates for lower rate',
      'Easier to maintain high occupancy',
    ],
  },
  {
    id: 'private-shared-mix',
    name: 'Private/Shared Mix',
    description: 'Hybrid model: 2 private + 4 shared beds',
    category: 'room_type',
    icon: '🔀',
    inputs: {
      // 2 private @ $1600 + 4 shared @ $800 = $6400/6 = ~$1067 avg
      bedCount: 6,
      ratePerBed: 1067, // Weighted average
      occupancyRate: 90,
      monthlyRent: 2000,
      monthlyUtilities: 400,
      maintenanceReservePercent: 15,
      staffingCosts: 0,
      insuranceCost: 175,
      foodCost: 600,
      miscExpenses: 200,
    },
    netteContext: {
      lesson: 'Lesson 19 - Maximizing Profit and Revenue',
      keyInsight: 'Mix maximizes both revenue and fill rate',
      targetDemographic: 'Mix of income levels',
      incomeSource: 'Multiple income levels',
    },
    suggestedModifications: [
      'Calculate exact mix for your property layout',
      'Private rooms can be master bedrooms',
      'Shared rooms work for standard bedrooms',
    ],
  },
];

// ============================================================================
// SCALING TEMPLATES (Lesson 22)
// ============================================================================

const scalingTemplates: ScenarioTemplate[] = [
  {
    id: 'second-home-projection',
    name: '2nd Home Projection',
    description: 'Financial projection for opening second property',
    category: 'scaling',
    icon: '🏠🏠',
    inputs: {
      bedCount: 6,
      ratePerBed: 907,
      occupancyRate: 85, // Conservative for new property
      monthlyRent: 1800,
      monthlyUtilities: 350,
      maintenanceReservePercent: 15,
      staffingCosts: 500, // House manager stipend
      insuranceCost: 175,
      foodCost: 550,
      miscExpenses: 200,
    },
    netteContext: {
      lesson: 'Lesson 22 - Scaling Your Business',
      keyInsight: 'Systems must work before duplication, growth without structure = burnout',
      targetDemographic: 'Same as first home',
      incomeSource: 'Same as first home',
    },
    suggestedModifications: [
      'Have house manager in place BEFORE opening',
      'Second home should be near first home',
      'Train new house manager with existing one',
    ],
  },
  {
    id: 'third-home-projection',
    name: '3rd Home Projection',
    description: 'Financial projection for third property with regional manager',
    category: 'scaling',
    icon: '🏘️',
    inputs: {
      bedCount: 6,
      ratePerBed: 907,
      occupancyRate: 85,
      monthlyRent: 1800,
      monthlyUtilities: 350,
      maintenanceReservePercent: 15,
      staffingCosts: 750, // House manager + portion of regional oversight
      insuranceCost: 175,
      foodCost: 550,
      miscExpenses: 200,
    },
    netteContext: {
      lesson: 'Lesson 22 - Scaling Your Business',
      keyInsight: 'Senior house manager trains new ones - clear chain of command',
      targetDemographic: 'Same standards across all homes',
      incomeSource: 'Same as portfolio',
    },
    suggestedModifications: [
      'Establish clear escalation chain',
      'New house manager reports to senior',
      'Maintain same rules across all homes',
    ],
  },
];

// ============================================================================
// ANALYSIS TEMPLATES
// ============================================================================

const analysisTemplates: ScenarioTemplate[] = [
  {
    id: 'conservative-estimate',
    name: 'Conservative Estimate',
    description: 'Worst-case scenario with 75% occupancy',
    category: 'analysis',
    icon: '🛡️',
    inputs: {
      bedCount: 6,
      ratePerBed: 907,
      occupancyRate: 75, // Very conservative
      monthlyRent: 2000,
      monthlyUtilities: 450, // Higher estimate
      maintenanceReservePercent: 20, // Higher reserve
      staffingCosts: 0,
      insuranceCost: 200,
      foodCost: 650,
      miscExpenses: 250,
    },
    netteContext: {
      lesson: 'Multiple lessons on risk management',
      keyInsight: 'Plan for worst case - if profitable at 75%, you have safety buffer',
      targetDemographic: 'N/A - Analysis scenario',
      incomeSource: 'N/A - Analysis scenario',
    },
    suggestedModifications: [
      'If profitable here, you have strong safety margin',
      'Good for stress-testing your business plan',
      'Banks may use conservative numbers for loans',
    ],
  },
  {
    id: 'break-even-analysis',
    name: 'Break-Even Analysis',
    description: 'Find minimum occupancy needed to cover expenses',
    category: 'analysis',
    icon: '📊',
    inputs: {
      bedCount: 6,
      ratePerBed: 907,
      occupancyRate: 100, // Start at 100% to see max revenue
      monthlyRent: 2000,
      monthlyUtilities: 400,
      maintenanceReservePercent: 15,
      staffingCosts: 0,
      insuranceCost: 175,
      foodCost: 600,
      miscExpenses: 200,
    },
    netteContext: {
      lesson: 'Session 1 - Nette\'s Formula',
      keyInsight: 'Goal Profit + Expenses = Required Income ÷ Beds = Price Per Bed',
      targetDemographic: 'N/A - Analysis scenario',
      incomeSource: 'N/A - Analysis scenario',
    },
    suggestedModifications: [
      'Break-even should be below 65% for safety',
      'Lower break-even = more profit margin',
      'Reduce expenses to lower break-even point',
    ],
  },
  {
    id: 'nettes-formula-check',
    name: "Nette's Formula Check",
    description: 'Validate pricing using Nette\'s formula: (Profit + Expenses) ÷ Beds',
    category: 'analysis',
    icon: '🧮',
    inputs: {
      bedCount: 6,
      ratePerBed: 907,
      occupancyRate: 90,
      monthlyRent: 1800,
      monthlyUtilities: 350,
      maintenanceReservePercent: 15,
      staffingCosts: 0,
      insuranceCost: 150,
      foodCost: 500,
      miscExpenses: 150,
    },
    netteContext: {
      lesson: 'Session 1 - Mastering the Unlicensed Group Home Business Model',
      keyInsight: 'Goal Profit + Total Expenses = Required Income, then divide by beds for rate',
      targetDemographic: 'All demographics',
      incomeSource: 'All income types',
    },
    suggestedModifications: [
      'Work backwards: Set goal profit first',
      'Add all expenses',
      'Divide by beds to find required rate',
    ],
  },
];

// ============================================================================
// ALL TEMPLATES COMBINED
// ============================================================================

export const SCENARIO_TEMPLATES: ScenarioTemplate[] = [
  ...incomeBasedTemplates,
  ...demographicTemplates,
  ...roomTypeTemplates,
  ...scalingTemplates,
  ...analysisTemplates,
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getTemplatesByCategory(category: ScenarioTemplateCategory): ScenarioTemplate[] {
  return SCENARIO_TEMPLATES.filter(t => t.category === category);
}

export function getTemplateById(id: string): ScenarioTemplate | undefined {
  return SCENARIO_TEMPLATES.find(t => t.id === id);
}

export const CATEGORY_LABELS: Record<ScenarioTemplateCategory, string> = {
  income_based: 'Income-Based Strategies',
  demographic: 'Demographic Focus',
  room_type: 'Room Configuration',
  scaling: 'Scaling Scenarios',
  analysis: 'Analysis Tools',
};

export const CATEGORY_DESCRIPTIONS: Record<ScenarioTemplateCategory, string> = {
  income_based: 'Strategies based on resident income levels (SSI, Market Rate, Mixed)',
  demographic: 'Scenarios targeting specific populations (Seniors, Veterans, Reentry)',
  room_type: 'Private vs shared room configurations and pricing',
  scaling: 'Projections for expanding to multiple properties',
  analysis: 'Break-even analysis and stress testing scenarios',
};

export const CATEGORY_ORDER: ScenarioTemplateCategory[] = [
  'income_based',
  'demographic',
  'room_type',
  'scaling',
  'analysis',
];
