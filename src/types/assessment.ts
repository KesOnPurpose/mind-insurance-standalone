export interface AssessmentAnswers {
  // Financial Readiness
  capital: string;
  creditScore: string;
  incomeStability: string;
  creativeFinancing: string;

  // Strategy Selection (NEW - for enriched personalization)
  ownershipModel: string; // 'rental_arbitrage' | 'ownership' | 'creative_financing' | 'house_hack' | 'hybrid'
  targetState: string;    // State code (CA, TX, FL, etc.)
  propertyStatus: string; // 'not-started' | 'researching' | 'searching' | 'offer-pending' | 'under-contract' | 'owned' | 'leasing'
  immediatePriority: string; // 'property_acquisition' | 'operations' | 'comprehensive' | 'scaling'

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
  // Enhanced validation system
  requirementLevel?: 'required' | 'recommended' | 'optional'; // Default: 'optional'
  allowOther?: boolean; // If true, adds "Other" option to selects
  skipOption?: {
    label: string; // e.g., "I'll decide later"
    value: string; // e.g., "skipped"
  };
  prefillFromAssessment?: keyof AssessmentAnswers; // Auto-fill from assessment data
  helperText?: string; // Additional context for the question
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

// ============================================
// FEAT-GH-006: Lesson Assessment Types
// Quiz-style assessments for tactic completion gates
// ============================================

/**
 * A single question in a lesson assessment quiz
 */
export interface LessonAssessmentQuestion {
  id: string;
  question: string;
  options: LessonAssessmentOption[];
  correctOptionId: string;
  explanation?: string; // Shown after answering
  points?: number; // Default: 1
}

/**
 * An answer option for a lesson assessment question
 */
export interface LessonAssessmentOption {
  id: string;
  text: string;
}

/**
 * Full lesson assessment configuration stored in database
 */
export interface LessonAssessment {
  id: string;
  tactic_id: string;
  title: string;
  description?: string;
  questions: LessonAssessmentQuestion[];
  passing_score: number; // Percentage (0-100) required to pass
  max_attempts: number; // -1 for unlimited
  time_limit_minutes?: number | null; // null for no limit
  created_at: string;
  updated_at: string;
}

/**
 * User's answer to a single question
 */
export interface LessonAssessmentAnswer {
  question_id: string;
  selected_option_id: string;
  is_correct?: boolean; // Populated after grading
}

/**
 * A user's attempt at a lesson assessment
 */
export interface LessonAssessmentAttempt {
  id: string;
  user_id: string;
  tactic_id: string;
  assessment_id: string;
  attempt_number: number;
  answers: LessonAssessmentAnswer[];
  score: number; // Percentage (0-100)
  passed: boolean;
  started_at: string;
  completed_at: string | null;
  time_spent_seconds?: number;
}

/**
 * Result returned after submitting an assessment
 */
export interface LessonAssessmentResult {
  attempt_id: string;
  score: number;
  passed: boolean;
  correct_count: number;
  total_questions: number;
  passing_score: number;
  answers_with_feedback: LessonAssessmentAnswerFeedback[];
  can_retry: boolean;
  attempts_remaining: number | null; // null if unlimited
}

/**
 * Detailed feedback for each answer after submission
 */
export interface LessonAssessmentAnswerFeedback {
  question_id: string;
  question_text: string;
  selected_option_id: string;
  selected_option_text: string;
  correct_option_id: string;
  correct_option_text: string;
  is_correct: boolean;
  explanation?: string;
}

// ============================================
// FEAT-GH-006: Completion Gate Types
// ============================================

/**
 * Gate types for tactic completion
 */
export type CompletionGateType = 'video' | 'assessment' | 'prerequisites';

/**
 * Status of a single completion gate
 */
export interface CompletionGateStatus {
  type: CompletionGateType;
  label: string;
  required: boolean;
  passed: boolean;
  details?: string; // e.g., "90% required, 75% watched"
  action?: {
    label: string;
    type: 'watch_video' | 'take_assessment' | 'complete_tactic';
    targetId?: string;
  };
}

/**
 * Full completion gate check result
 */
export interface CompletionGateResult {
  canComplete: boolean;
  gates: CompletionGateStatus[];
  blockedBy: CompletionGateType[];
  message?: string; // User-friendly explanation
}
