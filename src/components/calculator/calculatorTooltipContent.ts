import { TooltipContentData } from './CalculatorTooltip';

/**
 * Tooltip content definitions for calculator metrics
 */
export const CALCULATOR_TOOLTIPS: Record<string, TooltipContentData> = {
  // Simple Output Metrics
  monthlyGrossRevenue: {
    title: 'Monthly Gross Revenue',
    formula: 'Beds × Rate × Occupancy %',
    explanation:
      'Total income before any expenses. This is the maximum revenue your group home can generate at your target occupancy rate.',
    example: '6 beds × $907 × 90% = $4,898/mo',
  },

  totalMonthlyExpenses: {
    title: 'Total Monthly Expenses',
    formula: 'Rent + Utilities + Staff + Insurance + Food + Misc + Maintenance Reserve',
    explanation:
      'All operating costs to run the home. Includes a maintenance reserve (typically 15-20% of revenue) for repairs and unexpected costs.',
    example: '$2,000 rent + $300 utilities + $1,500 staff = $3,800/mo',
  },

  monthlyNetProfit: {
    title: 'Monthly Net Profit',
    formula: 'Gross Revenue − Total Expenses',
    explanation:
      'Your take-home profit after all expenses. A healthy group home typically has $1,000-$3,000+ monthly profit depending on size.',
    example: '$4,898 revenue − $3,800 expenses = $1,098/mo profit',
  },

  breakEvenOccupancy: {
    title: 'Break-Even Occupancy',
    formula: '(Total Expenses ÷ Max Revenue) × 100',
    explanation:
      'The minimum occupancy needed to cover all expenses. Below this, you lose money. Target homes with break-even under 75% for safety margin.',
    example: 'Break-even at 70% means you profit with 5 of 6 beds filled',
  },

  profitMargin: {
    title: 'Profit Margin',
    formula: '(Net Profit ÷ Revenue) × 100',
    explanation:
      'Percentage of revenue that becomes profit. Healthy group homes typically achieve 20-35% margins. Below 15% is risky.',
    example: '$1,098 profit ÷ $4,898 revenue = 22.4% margin',
  },

  // Advanced Output Metrics
  totalStartupCosts: {
    title: 'Total Startup Costs',
    formula: 'Licensing + Renovation + Furniture + Marketing + Reserve Fund',
    explanation:
      'One-time costs to get your group home operational. Varies significantly by state licensing requirements and property condition.',
    example: '$2,500 licensing + $15,000 reno + $5,000 furniture = $22,500',
  },

  totalInvestment: {
    title: 'Total Investment',
    formula: 'Startup Costs + First 3 Months Operating Expenses',
    explanation:
      'Complete capital needed before becoming cash-flow positive. Includes startup costs plus operating reserves for ramp-up period.',
    example: '$22,500 startup + $11,400 (3mo expenses) = $33,900 total',
  },

  yearOneROI: {
    title: 'Year 1 ROI',
    formula: '(Annual Net Profit ÷ Total Investment) × 100',
    explanation:
      'Return on investment in the first year. 15-25% ROI is typical for well-run group homes. Higher bed counts generally improve ROI.',
    example: '$13,176 annual profit ÷ $33,900 investment = 38.9% ROI',
  },

  cashOnCashReturn: {
    title: 'Cash on Cash Return',
    formula: '(Annual Net Cash Flow ÷ Cash Invested) × 100',
    explanation:
      'Actual cash return on your cash investment. Similar to ROI but focuses purely on cash flow, important if using financing.',
    example: 'Investors typically target 15%+ cash-on-cash returns',
  },

  paybackPeriod: {
    title: 'Payback Period',
    formula: 'Total Investment ÷ Annual Net Profit',
    explanation:
      'Months until your initial investment is fully recovered. 12-24 months is typical. Faster payback = lower risk.',
    example: '$33,900 ÷ $1,098/mo = 31 months to break even',
  },

  reserveCoverage: {
    title: 'Reserve Coverage',
    formula: 'Reserve Fund ÷ Monthly Expenses',
    explanation:
      'Months of expenses covered by your reserve fund. Industry standard is 3-6 months. Protects against vacancy or unexpected costs.',
    example: '$10,000 reserve ÷ $3,800 expenses = 2.6 months coverage',
  },

  // Risk Metrics
  riskLevel: {
    title: 'Risk Assessment',
    explanation:
      'Overall risk level based on break-even occupancy, profit margin, and reserve coverage. Green = Low Risk, Yellow = Moderate, Red = High Risk.',
  },

  conservativeProjection: {
    title: 'Conservative Projection',
    formula: 'Revenue at 85% Occupancy',
    explanation:
      'Revenue with 15% vacancy buffer. Always plan for the conservative scenario. If profitable here, you have a solid business.',
  },
};

export default CALCULATOR_TOOLTIPS;
