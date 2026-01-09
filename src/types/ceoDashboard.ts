// CEO Dashboard TypeScript Interfaces
// For MIO-EA deep context management

// ============================================================================
// CEO PREFERENCES TYPES (ceo_preferences key-value table)
// ============================================================================

export interface CEOChild {
  id: string;
  name: string;
  age?: number | null;
  birthday: string; // ISO date string (YYYY-MM-DD)
  preferences: string[];
  school?: string;
}

export interface CEOWife {
  name: string;
  birthday: string; // ISO date string (YYYY-MM-DD)
  preferences: string[];
  gift_ideas: string[];
}

export interface CEOFamily {
  wife: CEOWife;
  children: CEOChild[];
}

export interface CEOProject {
  id: string;
  name: string;
  status: 'active' | 'planning' | 'on-hold' | 'completed';
  deadline?: string;
  company_id?: string; // Link project to a company
}

export interface CEOCompany {
  id: string;
  name: string;
  role: 'CEO' | 'Founder' | 'Co-Founder' | 'Advisor' | 'Board Member' | 'Investor' | 'Other';
  industry?: string;
  status: 'active' | 'exited' | 'advisory' | 'paused';
  website?: string;
  notes?: string;
}

export interface CEOBusinessPriority {
  id: string;
  title: string;
  description?: string;
  order: number;
}

export interface CEOBusiness {
  companies: CEOCompany[];
  priorities: CEOBusinessPriority[];
  projects: CEOProject[];
}

export interface CEOFasting {
  type: string; // 'intermittent', 'extended', 'water', 'none', etc.
  window_start: string; // HH:MM format (for intermittent)
  window_end: string; // HH:MM format (for intermittent)
  current_day?: number | null;
  start_date?: string; // ISO date YYYY-MM-DD (for extended)
  end_date?: string; // ISO date YYYY-MM-DD (for extended)
}

export interface CEOHealth {
  fasting: CEOFasting;
  sleep_goal_hours: number | null;
  wake_time: string; // HH:MM format
  bedtime: string; // HH:MM format
  workout_types: string[];
  workout_schedule: string[]; // Legacy field
  workout_days: string[]; // Days of the week for workouts
  workout_notes: string;
}

export interface CEOCommunication {
  name: string;
  timezone: string;
  style_preference: string; // 'Direct & Brief', 'Detailed', etc.
  response_format: string; // 'Bullet Points', 'Paragraphs', etc.
}

export interface CEOLocations {
  home_address: string;
  home_city: string;
  home_state: string;
  home_zip: string;
  office_address: string;
  office_city: string;
  office_state: string;
  office_zip: string;
}

export interface CEOPreferences {
  id?: string;
  family: CEOFamily;
  business: CEOBusiness;
  health: CEOHealth;
  communication: CEOCommunication;
  locations: CEOLocations;
  created_at?: string;
  updated_at?: string;
}

// Default empty preferences structure
export const DEFAULT_CEO_PREFERENCES: CEOPreferences = {
  family: {
    wife: { name: '', birthday: '', preferences: [], gift_ideas: [] },
    children: [],
  },
  business: {
    companies: [],
    priorities: [],
    projects: [],
  },
  health: {
    fasting: {
      type: '',
      window_start: '',
      window_end: '',
      current_day: null,
    },
    sleep_goal_hours: null,
    wake_time: '',
    bedtime: '',
    workout_types: [],
    workout_schedule: [],
    workout_days: [],
    workout_notes: '',
  },
  communication: {
    name: '',
    timezone: 'America/New_York',
    style_preference: 'Direct & Brief',
    response_format: 'Bullet Points',
  },
  locations: {
    home_address: '',
    home_city: '',
    home_state: '',
    home_zip: '',
    office_address: '',
    office_city: '',
    office_state: '',
    office_zip: '',
  },
};

// ============================================================================
// CEO DOCUMENTS TYPES (ceo_documents table)
// ============================================================================

export type CEODocumentCategory =
  | 'assessment'
  | 'financial'
  | 'strategic'
  | 'personal'
  | 'other';

export interface CEODocument {
  id: string;
  document_name: string;
  document_description?: string;
  category: CEODocumentCategory;
  file_type: string;
  file_size_kb?: number;
  storage_path: string;
  document_url: string;
  processing_status: 'pending' | 'processing' | 'processed' | 'failed';
  processed_at?: string;
  extracted_summary?: string;
  extracted_key_points?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CEODocumentUpload {
  file: File;
  category: CEODocumentCategory;
  document_name?: string;
  document_description?: string;
}

// ============================================================================
// CEO EXTRACTED FACTS TYPES (ceo_extracted_facts table)
// ============================================================================

export type CEOFactCategory =
  | 'personal'
  | 'business'
  | 'preferences'
  | 'relationships'
  | 'goals'
  | 'habits'
  | 'insights';

export type CEOFactSourceType = 'conversation' | 'manual' | 'document';

export interface CEOExtractedFact {
  id: string;
  slack_user_id?: string;
  fact_category: CEOFactCategory;
  fact_key: string;
  fact_value: string;
  confidence_score: number; // 0.00-1.00
  source_type: CEOFactSourceType;
  source_reference?: string;
  is_verified: boolean;
  is_incorrect: boolean;
  correction_note?: string;
  extracted_at?: string;
  last_referenced_at?: string;
  updated_at: string;
}

// ============================================================================
// CONTEXT COMPLETENESS TYPES
// ============================================================================

export interface CEOContextSection {
  name: string;
  key: keyof CEOPreferences | 'documents' | 'facts';
  completed: number;
  total: number;
  percentage: number;
}

export interface CEOContextCompleteness {
  sections: CEOContextSection[];
  overallPercentage: number;
  totalCompleted: number;
  totalFields: number;
}

// ============================================================================
// NUTRITION TYPES
// ============================================================================

export interface CEOMacroGoals {
  daily_calories: number | null;
  protein_grams: number | null;
  carbs_grams: number | null;
  fat_grams: number | null;
  fiber_grams: number | null;
  auto_calculate: boolean;
  goal_type: 'maintain' | 'cut' | 'bulk' | 'recomp';
}

export interface CEOBeverage {
  id: string;
  type: 'water' | 'coffee' | 'tea' | 'other';
  oz: number;
  time: string; // HH:MM format
  date: string; // YYYY-MM-DD format
}

export interface CEOHydration {
  daily_goal_oz: number | null;
  reminder_enabled: boolean;
  reminder_interval_hours: number;
}

export interface CEOSupplement {
  id: string;
  name: string;
  dosage: string;
  timing: 'morning' | 'afternoon' | 'evening' | 'with_meals' | 'before_bed';
  days: ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[];
  notes?: string;
  is_active: boolean;
}

export interface CEOFavoriteMeal {
  id: string;
  name: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  ingredients: string[];
  prep_time_mins: number | null;
  notes?: string;
}

export interface CEODietaryPreferences {
  diet_type: 'balanced' | 'keto' | 'paleo' | 'vegan' | 'vegetarian' | 'carnivore' | 'mediterranean';
  allergies: string[];
  foods_to_avoid: string[];
  foods_to_prioritize: string[];
  eating_window_start: string; // HH:MM format (links with fasting)
  eating_window_end: string; // HH:MM format
  meal_frequency: number;
}

// MIO Recommendations - saved nutrition advice from MIO conversations
export interface CEOMIORecommendation {
  id: string;
  key: string;           // e.g., "healthy_snacks", "meal_plan", "nutrition_tips"
  title: string;         // Display title derived from key
  content: Record<string, unknown>;  // Flexible JSON content from MIO
  source: 'mio';         // Always 'mio' for these entries
  created_at: string;
  updated_at: string;
}

export interface CEONutrition {
  macros: CEOMacroGoals;
  hydration: CEOHydration;
  supplements: CEOSupplement[];
  favorite_meals: CEOFavoriteMeal[];
  dietary_preferences: CEODietaryPreferences;
  mio_recommendations?: CEOMIORecommendation[];  // MIO-saved nutrition recommendations
}

export const DEFAULT_CEO_NUTRITION: CEONutrition = {
  macros: {
    daily_calories: null,
    protein_grams: null,
    carbs_grams: null,
    fat_grams: null,
    fiber_grams: null,
    auto_calculate: false,
    goal_type: 'maintain',
  },
  hydration: {
    daily_goal_oz: 100,
    reminder_enabled: false,
    reminder_interval_hours: 2,
  },
  supplements: [],
  favorite_meals: [],
  dietary_preferences: {
    diet_type: 'balanced',
    allergies: [],
    foods_to_avoid: [],
    foods_to_prioritize: [],
    eating_window_start: '',
    eating_window_end: '',
    meal_frequency: 3,
  },
  mio_recommendations: [],
};

// ============================================================================
// DASHBOARD STATE TYPES
// ============================================================================

export type CEODashboardTab =
  | 'profile'
  | 'business'
  | 'health'
  | 'nutrition'
  | 'documents'
  | 'facts';

export interface CEODashboardState {
  activeTab: CEODashboardTab;
  isEditing: boolean;
  isSaving: boolean;
  hasChanges: boolean;
  lastSaved?: Date;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface CEOPreferencesResponse {
  data: CEOPreferences | null;
  error: Error | null;
}

export interface CEODocumentsResponse {
  data: CEODocument[];
  error: Error | null;
}

export interface CEOFactsResponse {
  data: CEOExtractedFact[];
  error: Error | null;
}

// ============================================================================
// INLINE EDIT TYPES
// ============================================================================

export interface InlineEditProps<T> {
  value: T;
  onSave: (value: T) => Promise<void>;
  placeholder?: string;
  type?: 'text' | 'date' | 'number' | 'time' | 'select';
  options?: { value: string; label: string }[];
  className?: string;
}

// ============================================================================
// 12 WEEK DOMINATION TYPES (Policy-Based Framework)
// Based on 12 Week Year methodology + Mind Insurance branding
// ============================================================================

export type QuarterPeriod = 'Q1' | 'Q2' | 'Q3' | 'Q4';

/**
 * Premium Payment (Tactic) - Daily/weekly actions that "pay" for coverage
 * "Every GOAL has a TOLL - are you WILLING to PAY it?"
 */
export interface CEOPremiumPayment {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'specific_days';
  specific_days?: ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[];
  target_count: number; // How many times per frequency
  current_week_count: number; // Completed this week
  notes?: string;
}

/**
 * Coverage Target (Goal) - What you're "insured" to achieve
 * Max 3 targets per Policy Term (12-week cycle)
 */
export interface CEOCoverageTarget {
  id: string;
  title: string;
  description?: string;
  order: number; // 1, 2, or 3

  // Claim Payout (Lag Indicator) - The result/outcome you receive
  claim_payout: {
    name: string;
    target_value: number;
    current_value: number;
    unit: string; // "users", "$", "lbs", etc.
  };

  // Coverage Activity (Lead Indicator) - Work you do to maintain coverage
  coverage_activity: {
    name: string;
    target_per_week: number;
    current_week_value: number;
    unit: string;
  };

  // Premium Payments (Tactics) - 4-5 per target
  premium_payments: CEOPremiumPayment[];

  // Status
  status: 'on-track' | 'at-risk' | 'behind';
}

/**
 * Policy Health Score - Weekly execution tracking
 * 85%+ = Policy in good standing
 */
export interface CEOPolicyHealthScore {
  week_number: number;
  score_percentage: number;
  premiums_paid: number; // Tactics completed
  premiums_due: number; // Tactics planned
  date: string; // ISO date of week start
}

/**
 * Active Policy (12 Week Cycle) - Your quarterly coverage period
 * "Success isn't OWNED, it's RENTED—and rent is due EVERY DAY."
 */
export interface CEOActivePolicy {
  id?: string;
  quarter: QuarterPeriod;
  year: number;
  start_date: string; // ISO date
  end_date: string; // ISO date
  current_week: number; // 1-12

  // Coverage Targets (Goals) - Max 3
  coverage_targets: CEOCoverageTarget[];

  // Policy Health History (Weekly scores)
  policy_health_history: CEOPolicyHealthScore[];

  // Policy Review Settings (Weekly Accountability Meeting)
  policy_review_day: 'monday' | 'tuesday' | 'wednesday';
  policy_review_time: string; // HH:MM

  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// PREMIUM SCHEDULE TYPES (Model Week / Time Blocking)
// ============================================================================

/**
 * Premium Block Types - Extended from Purpose Waze Model Week
 * Core types: strategic, buffer, breakout (original 3)
 * Extended types: work, morning_routine, evening_routine, fitness, connection,
 *   church, date_night, eat, business, sleep, fun, relax
 */
export type PremiumBlockType =
  | 'strategic'    // 💭 Deep work for coverage targets (gold)
  | 'buffer'       // 📧 Admin, email, reactive work (blue)
  | 'breakout'     // ☕ Rest, recovery, breaks (green)
  | 'work'         // 💼 General work tasks (gold)
  | 'morning_routine' // 🌅 Morning routine/ritual (orange)
  | 'evening_routine' // 🌙 Evening routine/wind-down (purple)
  | 'fitness'      // 💪 Exercise, gym, sports (green)
  | 'connection'   // 👥 Family, friends, relationships (pink)
  | 'church'       // ⛪ Spiritual, faith activities (blue)
  | 'date_night'   // ❤️ Partner time, romance (red)
  | 'eat'          // 🍽️ Meals, eating windows (orange)
  | 'business'     // 💰 Business development, networking (gold)
  | 'sleep'        // 😴 Sleep time (indigo)
  | 'fun'          // 🎉 Recreation, hobbies (yellow)
  | 'relax'        // 🧘 Relaxation, meditation (teal)
  | 'other';       // ✨ Custom/other activities (gray)

/**
 * Premium Block - Time block for executing premium payments
 */
export interface CEOPremiumBlock {
  id: string;
  start_time: string; // HH:MM
  end_time: string; // HH:MM (if spans_overnight is true, this is the end time on the NEXT day)
  block_type: PremiumBlockType;
  title: string;
  linked_target_id?: string; // Optional link to Coverage Target
  linked_payment_ids?: string[]; // Which premium payments this block supports
  notes?: string;
  is_recurring: boolean;
  spans_overnight?: boolean; // True if block spans from one day to the next (e.g., sleep 10 PM - 6 AM)
}

/**
 * Premium Schedule (Model Week) - When you pay your behavioral premiums
 */
export interface CEOPremiumSchedule {
  id?: string;
  monday: CEOPremiumBlock[];
  tuesday: CEOPremiumBlock[];
  wednesday: CEOPremiumBlock[];
  thursday: CEOPremiumBlock[];
  friday: CEOPremiumBlock[];
  saturday: CEOPremiumBlock[];
  sunday: CEOPremiumBlock[];

  preferences: {
    strategic_blocks_per_day: number; // Target count
    buffer_blocks_per_day: number;
    buffer_time_minutes: number; // Between blocks
    work_start_time: string; // HH:MM
    work_end_time: string; // HH:MM
  };

  created_at?: string;
  updated_at?: string;
}

// Constants
export const DAYS_OF_WEEK = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

// Default empty structures
export const DEFAULT_ACTIVE_POLICY: CEOActivePolicy = {
  quarter: 'Q1',
  year: new Date().getFullYear(),
  start_date: '',
  end_date: '',
  current_week: 1,
  coverage_targets: [],
  policy_health_history: [],
  policy_review_day: 'monday',
  policy_review_time: '08:00',
};

export const DEFAULT_PREMIUM_SCHEDULE: CEOPremiumSchedule = {
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
  saturday: [],
  sunday: [],
  preferences: {
    strategic_blocks_per_day: 2,
    buffer_blocks_per_day: 2,
    buffer_time_minutes: 15,
    work_start_time: '08:00',
    work_end_time: '18:00',
  },
};

// Helper to create empty Coverage Target
export const createEmptyCoverageTarget = (order: number): CEOCoverageTarget => ({
  id: crypto.randomUUID(),
  title: '',
  description: '',
  order,
  claim_payout: {
    name: '',
    target_value: 0,
    current_value: 0,
    unit: '',
  },
  coverage_activity: {
    name: '',
    target_per_week: 0,
    current_week_value: 0,
    unit: '',
  },
  premium_payments: [],
  status: 'on-track',
});

// Helper to create empty Premium Payment
export const createEmptyPremiumPayment = (): CEOPremiumPayment => ({
  id: crypto.randomUUID(),
  name: '',
  frequency: 'weekly',
  target_count: 1,
  current_week_count: 0,
});

// Helper to create empty Premium Block
export const createEmptyPremiumBlock = (
  block_type: PremiumBlockType = 'strategic'
): CEOPremiumBlock => ({
  id: crypto.randomUUID(),
  start_time: '09:00',
  end_time: '12:00',
  block_type,
  title: '',
  is_recurring: true,
});

// ============================================================================
// POLICY CALCULATION HELPERS
// ============================================================================

/**
 * Calculate current week of the policy term
 */
export const calculateCurrentWeek = (startDate: string): number => {
  if (!startDate) return 1;
  const start = new Date(startDate);
  const now = new Date();
  const diffTime = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const week = Math.floor(diffDays / 7) + 1;
  return Math.min(Math.max(week, 1), 12);
};

/**
 * Calculate days remaining in policy term
 */
export const calculateDaysRemaining = (endDate: string): number => {
  if (!endDate) return 84; // 12 weeks
  const end = new Date(endDate);
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
};

/**
 * Calculate policy health score for current week
 */
export const calculatePolicyHealthScore = (
  targets: CEOCoverageTarget[]
): { score: number; paid: number; due: number } => {
  let totalPaid = 0;
  let totalDue = 0;

  targets.forEach((target) => {
    target.premium_payments.forEach((payment) => {
      totalDue += payment.target_count;
      totalPaid += Math.min(payment.current_week_count, payment.target_count);
    });
  });

  const score = totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 0;
  return { score, paid: totalPaid, due: totalDue };
};

/**
 * Determine target status based on progress
 */
export const determineTargetStatus = (
  target: CEOCoverageTarget
): 'on-track' | 'at-risk' | 'behind' => {
  const { claim_payout, coverage_activity, premium_payments } = target;

  // Check claim payout progress (lag indicator)
  const claimProgress =
    claim_payout.target_value > 0
      ? claim_payout.current_value / claim_payout.target_value
      : 0;

  // Check coverage activity progress (lead indicator)
  const activityProgress =
    coverage_activity.target_per_week > 0
      ? coverage_activity.current_week_value / coverage_activity.target_per_week
      : 0;

  // Check premium payments progress
  let paymentScore = 0;
  if (premium_payments.length > 0) {
    const totalPaid = premium_payments.reduce((sum, p) => sum + p.current_week_count, 0);
    const totalDue = premium_payments.reduce((sum, p) => sum + p.target_count, 0);
    paymentScore = totalDue > 0 ? totalPaid / totalDue : 0;
  }

  // Weighted average (payments matter most for weekly status)
  const overallScore = paymentScore * 0.5 + activityProgress * 0.3 + claimProgress * 0.2;

  if (overallScore >= 0.85) return 'on-track';
  if (overallScore >= 0.7) return 'at-risk';
  return 'behind';
};

// ============================================================================
// V.I.S.I.O.N. BLUEPRINT TYPES
// Based on Vivid Vision methodology (Cameron Herold) + Mind Insurance framework
// 3-year strategic vision in present tense, shareable with team/stakeholders
// ============================================================================

/**
 * V.I.S.I.O.N. Section Types
 * V - Vivid Visualization: Sensory-rich description of ideal future
 * I - Itemized Inventory: Specific, quantifiable elements
 * S - Specific Scenarios: Key events/milestones with dates
 * I2 - Interconnected Impacts: How vision affects family/community/world
 * O - Obstacles Overcome: Challenges conquered
 * N - Next Steps Narrative: Journey from current to envisioned future
 */
export type VisionSectionType = 'V' | 'I' | 'S' | 'I2' | 'O' | 'N';

/**
 * Individual vision section input
 */
export interface VisionSectionInput {
  id: string;
  letter: VisionSectionType;
  title: string;
  subtitle: string;
  content: string;
  guidingQuestions: string[];
  lastUpdated?: string;
}

/**
 * AI-synthesized output document
 */
export interface VisionSynthesizedOutput {
  id: string;
  outputType: 'executive' | 'narrative';
  title: string;
  content: string; // Markdown format
  generatedAt: string;
  version: number;
}

/**
 * Complete V.I.S.I.O.N. Blueprint
 */
export interface CEOVisionBlueprint {
  id?: string;
  visionHorizon: '1-year' | '3-year' | '5-year' | '10-year';
  targetDate: string; // ISO date for vision target
  sections: {
    V: VisionSectionInput;
    I: VisionSectionInput;
    S: VisionSectionInput;
    I2: VisionSectionInput;
    O: VisionSectionInput;
    N: VisionSectionInput;
  };
  synthesizedOutputs: VisionSynthesizedOutput[];
  synthesisStatus: 'idle' | 'pending' | 'processing' | 'completed' | 'failed';
  synthesisError?: string;
  version: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Configuration for each V.I.S.I.O.N. section with guiding questions
 */
export const VISION_SECTIONS_CONFIG: Record<
  VisionSectionType,
  {
    letter: VisionSectionType;
    title: string;
    subtitle: string;
    guidingQuestions: string[];
    placeholder: string;
  }
> = {
  V: {
    letter: 'V',
    title: 'Vivid Visualization',
    subtitle: 'Sensory-rich description of your ideal future',
    guidingQuestions: [
      'What does a typical day look like in your ideal future?',
      'Where are you waking up? What do you see, hear, and feel?',
      'Who is with you? What are the sounds and smells around you?',
      'How do you feel physically, mentally, and emotionally?',
      'What accomplishments make you most proud when you look back?',
    ],
    placeholder:
      'Describe your ideal future in vivid detail, using all five senses. Write in present tense as if you are already living it...',
  },
  I: {
    letter: 'I',
    title: 'Itemized Inventory',
    subtitle: 'Specific, quantifiable elements of your vision',
    guidingQuestions: [
      'What is your net worth? Annual income? Passive income?',
      'How many employees does your company have?',
      'What specific achievements have you unlocked?',
      'What properties, assets, or investments do you own?',
      'What certifications, awards, or recognitions have you received?',
    ],
    placeholder:
      'List the specific, measurable elements of your vision. Include numbers, dates, and concrete details...',
  },
  S: {
    letter: 'S',
    title: 'Specific Scenarios',
    subtitle: 'Key events and milestones with dates',
    guidingQuestions: [
      'What major milestones have you celebrated along the way?',
      'What specific events or achievements mark your journey?',
      'When did you reach each major financial goal?',
      'What product launches, acquisitions, or expansions occurred?',
      'What personal achievements (health, relationships) have specific dates?',
    ],
    placeholder:
      'Describe specific scenarios and milestones with approximate dates. Example: "In Q2 2026, we closed our Series A..."',
  },
  I2: {
    letter: 'I2',
    title: 'Interconnected Impacts',
    subtitle: 'How your vision affects family, community, and world',
    guidingQuestions: [
      'How has your success transformed your family life?',
      'What impact have you made on your community?',
      'How many lives have you touched through your work?',
      'What charitable or philanthropic endeavors are you involved in?',
      'How does your vision ripple out to affect others beyond yourself?',
    ],
    placeholder:
      'Describe how achieving your vision creates positive impact for your family, community, and the broader world...',
  },
  O: {
    letter: 'O',
    title: 'Obstacles Overcome',
    subtitle: 'Challenges you conquered on the journey',
    guidingQuestions: [
      'What limiting beliefs have you shed?',
      'What external challenges did you overcome?',
      'What fears did you face and conquer?',
      'What sacrifices were worth making?',
      'What moments of doubt did you push through?',
    ],
    placeholder:
      'Describe the obstacles, fears, and challenges you overcame to achieve this vision. What growth was required?',
  },
  N: {
    letter: 'N',
    title: 'Next Steps Narrative',
    subtitle: 'The journey from current state to envisioned future',
    guidingQuestions: [
      'What were the first critical steps that started your transformation?',
      'What daily habits became non-negotiable?',
      'Who were the key people that supported your journey?',
      'What decisions were the turning points?',
      'What advice would you give your past self?',
    ],
    placeholder:
      'Narrate the journey from where you are today to your vivid vision. What steps, habits, and decisions got you there?',
  },
};

/**
 * Creates an empty VisionSectionInput for a given section type
 */
export const createEmptyVisionSection = (
  type: VisionSectionType
): VisionSectionInput => {
  const config = VISION_SECTIONS_CONFIG[type];
  return {
    id: crypto.randomUUID(),
    letter: type,
    title: config.title,
    subtitle: config.subtitle,
    content: '',
    guidingQuestions: config.guidingQuestions,
  };
};

/**
 * Creates an empty V.I.S.I.O.N. Blueprint
 */
export const createEmptyVisionBlueprint = (): CEOVisionBlueprint => {
  // Calculate 3 years from now as default target date
  const targetDate = new Date();
  targetDate.setFullYear(targetDate.getFullYear() + 3);

  return {
    visionHorizon: '3-year',
    targetDate: targetDate.toISOString().split('T')[0],
    sections: {
      V: createEmptyVisionSection('V'),
      I: createEmptyVisionSection('I'),
      S: createEmptyVisionSection('S'),
      I2: createEmptyVisionSection('I2'),
      O: createEmptyVisionSection('O'),
      N: createEmptyVisionSection('N'),
    },
    synthesizedOutputs: [],
    synthesisStatus: 'idle',
    version: 1,
  };
};

/**
 * Calculate completion percentage for a V.I.S.I.O.N. Blueprint
 */
export const calculateVisionCompleteness = (
  blueprint: CEOVisionBlueprint
): { completed: number; total: number; percentage: number } => {
  const sections = Object.values(blueprint.sections);
  const total = sections.length;
  const completed = sections.filter(
    (s) => s.content && s.content.trim().length >= 100
  ).length;
  const percentage = Math.round((completed / total) * 100);
  return { completed, total, percentage };
};

/**
 * Default empty V.I.S.I.O.N. Blueprint
 */
export const DEFAULT_VISION_BLUEPRINT = createEmptyVisionBlueprint();
