export interface AssessmentAnswers {
  // Financial Readiness
  capital: string;
  creditScore: string;
  incomeStability: string;
  creativeFinancing: string;

  // Market Knowledge
  licensingFamiliarity: string;
  targetPopulations: string[];
  marketResearch: string;
  reimbursementRate: string;

  // Operational Readiness
  caregivingExperience: string;
  timeCommitment: string;
  supportTeam: string[];
  propertyManagement: number;

  // Mindset & Commitment
  primaryMotivation: string;
  commitmentLevel: number;
  timeline: string;
}

export interface AssessmentResults {
  financialScore: number;
  marketScore: number;
  operationalScore: number;
  mindsetScore: number;
  overallScore: number;
  readinessLevel: 'beginner' | 'intermediate' | 'advanced' | 'ready';
  recommendations: string[];
}

// Business Profile - built progressively as user completes tactics
export interface BusinessProfile {
  // Core Business Identity
  businessName?: string;
  entityType?: 'llc' | 's-corp' | 'c-corp' | 'sole-proprietorship' | 'partnership' | 'not-formed';
  targetState?: string;
  targetStateReason?: string;

  // Property & Operations
  bedCount?: number;
  propertyStatus?: 'not-started' | 'researching' | 'searching' | 'offer-pending' | 'under-contract' | 'owned' | 'leasing';
  propertyAddress?: string;
  propertyType?: 'single-family' | 'duplex' | 'multi-family' | 'commercial' | 'not-selected';

  // Licensing & Compliance
  licenseStatus?: 'not-started' | 'researching' | 'documents-gathering' | 'application-submitted' | 'inspection-scheduled' | 'approved' | 'operational';
  licenseType?: string;
  estimatedLicenseDate?: string;

  // Financial Planning
  fundingSource?: 'personal-savings' | 'bank-loan' | 'sba-loan' | 'fha-loan' | 'investor' | 'partner' | 'seller-financing' | 'combination' | 'not-decided';
  startupCapitalActual?: number;
  monthlyRevenueTarget?: number;
  monthlyExpenseEstimate?: number;
  breakEvenTimeline?: '3-months' | '6-months' | '9-months' | '12-months' | 'over-12-months' | 'not-calculated';

  // Business Model
  serviceModel?: 'owner-operator' | 'absentee-owner' | 'manager-operated' | 'hybrid' | 'not-decided';
  marketingStrategy?: string;
  referralSources?: string[];

  // Milestones
  firstResidentDate?: string;
  fullOccupancyDate?: string;
  businessLaunchDate?: string;

  // Profile Metadata
  profileCompleteness?: number;
  lastTacticCompleted?: string;
  lastProfileUpdate?: string;
}

// Combined user profile for agent context
export interface UserProfileSnapshot {
  // Assessment Data
  assessment: AssessmentResults;
  assessmentAnswers: AssessmentAnswers;

  // Business Profile (evolving)
  businessProfile: BusinessProfile;

  // Progress Data
  currentWeek: number;
  tacticsCompleted: number;
  totalTactics: number;
  progressPercentage: number;
}

// Tactic-specific questions that build the profile
export interface TacticQuestion {
  id: string;
  question: string;
  fieldName: keyof BusinessProfile;
  inputType: 'text' | 'select' | 'number' | 'date' | 'multiselect' | 'textarea';
  options?: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

export interface TacticQuestionSet {
  tacticId: string;
  questions: TacticQuestion[];
}
