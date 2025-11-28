/**
 * Group Home Underwriting Calculator Types
 *
 * Based on Nette's training formulas:
 * - SSI Maximum: $967/month
 * - PNA Deduction: $60
 * - Max Rent: $907/month (SSI - PNA)
 */

// ============================================================================
// CONSTANTS
// ============================================================================

export const CALCULATOR_CONSTANTS = {
  SSI_MONTHLY: 967,
  PNA_DEDUCTION: 60,
  SSI_MAX_RENT: 907, // $967 - $60
  DEFAULT_VACANCY_BUFFER: 0.15, // 15%
  DEFAULT_MAINTENANCE_RESERVE: 0.15, // 15%
  DEFAULT_OCCUPANCY_RATE: 90,
  MIN_BEDS: 1,
  MAX_BEDS: 20,
} as const;

// ============================================================================
// INPUT TYPES
// ============================================================================

export type CalculatorMode = 'simple' | 'moderate' | 'advanced';

export interface PropertyDetails {
  bedCount: number;
  ratePerBed: number;
  occupancyRate: number;
}

export interface MonthlyExpenses {
  monthlyRent: number;
  monthlyUtilities: number;
  maintenanceReservePercent: number;
  staffingCosts: number;
  insuranceCost: number;
  foodCost: number;
  miscExpenses: number;
}

export interface StartupCosts {
  licensingCosts: number;
  renovationCosts: number;
  furnitureCosts: number;
  marketingCosts: number;
  reserveFund: number;
}

export interface CalculatorInputs extends PropertyDetails, MonthlyExpenses {
  // Startup costs are optional (only used in advanced mode)
  startupCosts?: StartupCosts;
  // Context from user profile
  targetState?: string;
  ownershipModel?: string;
}

// Default values for new calculator
export const DEFAULT_INPUTS: CalculatorInputs = {
  // Property Details
  bedCount: 6,
  ratePerBed: CALCULATOR_CONSTANTS.SSI_MAX_RENT,
  occupancyRate: 90,
  // Monthly Expenses
  monthlyRent: 2000,
  monthlyUtilities: 400,
  maintenanceReservePercent: 15,
  staffingCosts: 0,
  insuranceCost: 200,
  foodCost: 600,
  miscExpenses: 200,
};

export const DEFAULT_STARTUP_COSTS: StartupCosts = {
  licensingCosts: 2500,
  renovationCosts: 15000,
  furnitureCosts: 5000,
  marketingCosts: 1000,
  reserveFund: 1, // Minimum $1 to prevent division by zero in reserve coverage calculations
};

// ============================================================================
// OUTPUT TYPES - SIMPLE
// ============================================================================

export interface SimpleOutput {
  monthlyGrossRevenue: number;
  totalMonthlyExpenses: number;
  monthlyNetProfit: number;
  breakEvenOccupancy: number;
  profitMargin: number;
  annualGrossRevenue: number;
  annualNetProfit: number;
  isViable: boolean; // true if profit > 0 and break-even < 100%
}

// ============================================================================
// OUTPUT TYPES - MODERATE
// ============================================================================

export interface MonthlyProjection {
  month: number;
  monthLabel: string; // "Month 1", "Month 2", etc.
  grossRevenue: number;
  expenses: number;
  netProfit: number;
  cumulativeProfit: number;
  occupancyRate: number;
}

export interface ScenarioAnalysis {
  conservative: SimpleOutput; // 85% occupancy
  moderate: SimpleOutput;     // 90% occupancy
  optimistic: SimpleOutput;   // 95% occupancy
}

export interface ModerateOutput extends SimpleOutput {
  cashFlowProjection: MonthlyProjection[];
  scenarioAnalysis: ScenarioAnalysis;
  rampUpMonths: number; // Months to reach target occupancy
}

// ============================================================================
// OUTPUT TYPES - ADVANCED
// ============================================================================

export interface StartupBreakdown {
  totalStartupCosts: number;
  licensingCosts: number;
  renovationCosts: number;
  furnitureCosts: number;
  marketingCosts: number;
  reserveFund: number;
  monthsOfReserve: number; // How many months reserve covers
}

export interface SensitivityResult {
  variable: string;
  baseValue: number;
  adjustedValue: number;
  changePercent: number;
  impactOnProfit: number;
  impactPercent: number;
}

export interface AdvancedOutput extends ModerateOutput {
  startupBreakdown: StartupBreakdown;
  breakEvenMonths: number;
  yearOneROI: number;
  cashOnCashReturn: number;
  paybackPeriod: number; // Months to recoup startup costs
  sensitivityAnalysis: SensitivityResult[];
  totalInvestmentRequired: number;
}

// ============================================================================
// RISK ASSESSMENT
// ============================================================================

export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export interface RiskAssessment {
  level: RiskLevel;
  score: number; // 0-100
  factors: RiskFactor[];
}

export interface RiskFactor {
  name: string;
  impact: RiskLevel;
  description: string;
  recommendation?: string;
}

// ============================================================================
// STATE LICENSING INFO (from database)
// ============================================================================

export interface StateLicensingInfo {
  state: string;
  averageRatePerBed: number;
  licensingCostMin: number;
  licensingCostMax: number;
  timeToLicense: string;
  requirements?: string[];
}

// ============================================================================
// USER PROFILE DATA (for pre-filling)
// ============================================================================

export interface UserProfileData {
  bedCount?: number;
  targetState?: string;
  capitalAvailable?: number;
  ownershipModel?: string;
  financialScore?: number;
  monthlyRevenueTarget?: number;
}

// ============================================================================
// CALCULATOR STATE
// ============================================================================

export interface CalculatorState {
  mode: CalculatorMode;
  inputs: CalculatorInputs;
  simpleOutput: SimpleOutput | null;
  moderateOutput: ModerateOutput | null;
  advancedOutput: AdvancedOutput | null;
  riskAssessment: RiskAssessment | null;
  isCalculating: boolean;
  error: string | null;
}

// ============================================================================
// PDF EXPORT
// ============================================================================

export interface PDFExportOptions {
  includeScenarios: boolean;
  includeSensitivity: boolean;
  includeCharts: boolean;
  businessName?: string;
  preparedFor?: string;
  preparedDate?: Date;
}

export interface PDFExportData {
  inputs: CalculatorInputs;
  outputs: AdvancedOutput;
  riskAssessment: RiskAssessment;
  options: PDFExportOptions;
}
