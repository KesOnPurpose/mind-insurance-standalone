import { supabase } from "@/integrations/supabase/client";
import { AssessmentAnswers } from "@/types/assessment";

interface AssessmentScores {
  financial_score: number;
  market_score: number;
  operational_score: number;
  mindset_score: number;
  overall_score: number;
  readiness_level: 'foundation_building' | 'accelerated_learning' | 'fast_track' | 'expert_implementation';
}

/**
 * Map frontend creative financing values to database enums
 */
function mapCreativeFinancingToDB(value: string): string {
  const mapping: Record<string, string> = {
    'never-heard': 'none',
    'heard-not-understand': 'none',
    'basic': 'basic',
    'good': 'intermediate',
    'very-familiar': 'advanced'
  };
  return mapping[value] || 'none';
}

/**
 * Map frontend credit score values to database enums
 */
function mapCreditScoreToDB(value: string): string {
  const mapping: Record<string, string> = {
    'below-580': 'below-580',
    '580-669': '580-650',
    '670-739': '650-700',
    '740-799': '700-750',
    '800+': 'above-750',
    'not-sure': 'below-580'
  };
  return mapping[value] || 'below-580';
}

/**
 * Map property management comfort (1-10 scale) to database enums
 */
function mapPropertyManagementToDB(value: number): string {
  if (value <= 3) return 'uncomfortable';
  if (value <= 5) return 'somewhat-comfortable';
  if (value <= 8) return 'comfortable';
  return 'experienced';
}

/**
 * Map support team array to single best value for database
 */
function mapSupportTeamToDB(values: string[]): string {
  if (values.includes('business-partner') || values.includes('hire-manager')) {
    return 'already-have-team';
  }
  if (values.includes('hire-caregivers')) {
    return 'planning-to-hire';
  }
  if (values.includes('family-help')) {
    return 'family';
  }
  return 'none';
}

/**
 * Map income stability values to database enums
 */
function mapIncomeStabilityToDB(value: string): string {
  const mapping: Record<string, string> = {
    'no-stable': 'unstable',
    'part-time': 'somewhat-stable',
    'full-time-w2': 'stable',
    'self-employed': 'stable',
    'multiple-streams': 'very-stable'
  };
  return mapping[value] || 'unstable';
}

/**
 * Map licensing familiarity values to database enums
 */
function mapLicensingFamiliarityToDB(value: string): string {
  const mapping: Record<string, string> = {
    'not-familiar': 'not-familiar',
    'know-exist': 'not-familiar',
    'some-research': 'somewhat-familiar',
    'very-familiar': 'very-familiar',
    'licensed': 'very-familiar'
  };
  return mapping[value] || 'not-familiar';
}

/**
 * Map market research values to database enums
 */
function mapMarketResearchToDB(value: string): string {
  const mapping: Record<string, string> = {
    'not-researched': 'none',
    'basic-google': 'some',
    'talked-providers': 'some',
    'extensive': 'extensive',
    'connected': 'extensive'
  };
  return mapping[value] || 'none';
}

/**
 * Map revenue understanding values to database enums
 */
function mapRevenueUnderstandingToDB(value: string): string {
  const mapping: Record<string, string> = {
    'no-idea': 'none',
    '1k-2k': 'basic',
    '2k-4k': 'basic',
    '4k-6k': 'good',
    'more-6k': 'excellent'
  };
  return mapping[value] || 'none';
}

/**
 * Map time commitment values to database enums
 */
function mapTimeCommitmentToDB(value: string): string {
  const mapping: Record<string, string> = {
    'less-10': 'part-time',
    '10-20': 'part-time',
    '20-30': 'flexible',
    '30-40': 'flexible',
    '40+': 'full-time'
  };
  return mapping[value] || 'flexible';
}

/**
 * Map timeline values to database enums
 */
function mapTimelineToDB(value: string): string {
  const mapping: Record<string, string> = {
    'no-timeline': 'exploring',
    '12-months': 'within-year',
    '6-months': 'within-6-months',
    '3-months': 'within-3-months',
    'now': 'within-3-months'
  };
  return mapping[value] || 'exploring';
}

/**
 * Calculate assessment scores based on PRD formula:
 * weighted_scores = {
 *   financial * 1.3,
 *   market * 1.2,
 *   operational * 1.0,
 *   mindset * 1.5
 * }
 * overallScore = sum / 4
 */
export function calculateScores(answers: AssessmentAnswers): AssessmentScores {
  // Financial Readiness Score (0-100)
  const financialScore = calculateFinancialScore(answers);
  
  // Market Knowledge Score (0-100)
  const marketScore = calculateMarketScore(answers);
  
  // Operational Readiness Score (0-100)
  const operationalScore = calculateOperationalScore(answers);
  
  // Mindset & Commitment Score (0-100)
  const mindsetScore = calculateMindsetScore(answers);
  
  // Apply weighted formula from PRD
  const weightedSum = (
    financialScore * 1.3 +
    marketScore * 1.2 +
    operationalScore * 1.0 +
    mindsetScore * 1.5
  );
  
  const overallScore = Math.round(weightedSum / 4);
  
  // Determine readiness level based on overall score
  const readinessLevel = getReadinessLevel(overallScore);
  
  return {
    financial_score: Math.round(financialScore),
    market_score: Math.round(marketScore),
    operational_score: Math.round(operationalScore),
    mindset_score: Math.round(mindsetScore),
    overall_score: overallScore,
    readiness_level: readinessLevel
  };
}

function calculateFinancialScore(answers: AssessmentAnswers): number {
  let score = 0;
  
  // Capital available (0-40 points)
  const capitalScores: Record<string, number> = {
    'less-5k': 10,
    '5k-15k': 20,
    '15k-30k': 30,
    '30k-50k': 35,
    'more-50k': 40
  };
  score += capitalScores[answers.capital] || 0;
  
  // Credit score (0-30 points) - use mapped value
  const mappedCredit = mapCreditScoreToDB(answers.creditScore);
  const creditScores: Record<string, number> = {
    'below-580': 5,
    '580-650': 15,
    '650-700': 20,
    '700-750': 25,
    'above-750': 30
  };
  score += creditScores[mappedCredit] || 0;
  
  // Income stability (0-20 points) - use mapped value
  const mappedIncome = mapIncomeStabilityToDB(answers.incomeStability);
  const incomeScores: Record<string, number> = {
    'unstable': 5,
    'somewhat-stable': 10,
    'stable': 15,
    'very-stable': 20
  };
  score += incomeScores[mappedIncome] || 0;
  
  // Creative financing knowledge (0-10 points) - use mapped value
  const mappedFinancing = mapCreativeFinancingToDB(answers.creativeFinancing);
  const financingScores: Record<string, number> = {
    'none': 0,
    'basic': 3,
    'intermediate': 7,
    'advanced': 10
  };
  score += financingScores[mappedFinancing] || 0;
  
  return score; // Max 100
}

function calculateMarketScore(answers: AssessmentAnswers): number {
  let score = 0;
  
  // Licensing familiarity (0-30 points) - use mapped value
  const mappedLicensing = mapLicensingFamiliarityToDB(answers.licensingFamiliarity);
  const licensingScores: Record<string, number> = {
    'not-familiar': 5,
    'somewhat-familiar': 15,
    'very-familiar': 30
  };
  score += licensingScores[mappedLicensing] || 0;
  
  // Target populations (0-25 points) - more selections = better understanding
  score += Math.min(answers.targetPopulations.length * 8, 25);
  
  // Market research (0-30 points) - use mapped value
  const mappedResearch = mapMarketResearchToDB(answers.marketResearch);
  const researchScores: Record<string, number> = {
    'none': 5,
    'some': 15,
    'extensive': 30
  };
  score += researchScores[mappedResearch] || 0;
  
  // Revenue understanding (0-15 points) - use mapped value
  const mappedRevenue = mapRevenueUnderstandingToDB(answers.reimbursementRate);
  const revenueScores: Record<string, number> = {
    'none': 0,
    'basic': 5,
    'good': 10,
    'excellent': 15
  };
  score += revenueScores[mappedRevenue] || 0;
  
  return score; // Max 100
}

function calculateOperationalScore(answers: AssessmentAnswers): number {
  let score = 0;
  
  // Caregiving experience (0-35 points)
  const experienceScores: Record<string, number> = {
    'no-experience': 5,
    'some-experience': 15,
    'extensive-experience': 25,
    'licensed-professional': 35
  };
  score += experienceScores[answers.caregivingExperience] || 0;
  
  // Time commitment (0-25 points) - use mapped value
  const mappedTime = mapTimeCommitmentToDB(answers.timeCommitment);
  const timeScores: Record<string, number> = {
    'part-time': 10,
    'flexible': 20,
    'full-time': 25
  };
  score += timeScores[mappedTime] || 0;
  
  // Support team (0-25 points) - use mapped value
  const mappedSupport = mapSupportTeamToDB(answers.supportTeam);
  const supportScores: Record<string, number> = {
    'none': 3,
    'family': 7,
    'planning-to-hire': 12,
    'already-have-team': 25
  };
  score += supportScores[mappedSupport] || 0;
  
  // Property management comfort (0-15 points) - use mapped value
  const mappedPropertyMgmt = mapPropertyManagementToDB(answers.propertyManagement);
  const propertyScores: Record<string, number> = {
    'uncomfortable': 3,
    'somewhat-comfortable': 7,
    'comfortable': 12,
    'experienced': 15
  };
  score += propertyScores[mappedPropertyMgmt] || 0;
  
  return score; // Max 100
}

function calculateMindsetScore(answers: AssessmentAnswers): number {
  let score = 0;
  
  // Primary motivation quality (0-30 points)
  // Longer, more detailed = higher commitment
  const motivationLength = (answers.primaryMotivation || '').length;
  score += Math.min((motivationLength / 10) * 30, 30);
  
  // Commitment level (0-50 points) - direct mapping from 1-10 scale
  score += (answers.commitmentLevel / 10) * 50;
  
  // Timeline (0-20 points) - use mapped value
  const mappedTimeline = mapTimelineToDB(answers.timeline);
  const timelineScores: Record<string, number> = {
    'within-3-months': 20,
    'within-6-months': 15,
    'within-year': 10,
    'exploring': 5
  };
  score += timelineScores[mappedTimeline] || 0;
  
  return score; // Max 100
}

function getReadinessLevel(overallScore: number): 'foundation_building' | 'accelerated_learning' | 'fast_track' | 'expert_implementation' {
  if (overallScore >= 81) return 'expert_implementation';
  if (overallScore >= 61) return 'fast_track';
  if (overallScore >= 41) return 'accelerated_learning';
  return 'foundation_building';
}

/**
 * Save assessment results to user_onboarding table
 */
export async function saveAssessmentResults(
  userId: string,
  answers: AssessmentAnswers,
  scores: AssessmentScores
) {
  // Prepare the base payload with ONLY columns that exist in the database
  // Note: Enhanced columns (ownership_model, target_state, property_status,
  // immediate_priority, budget_min_usd, budget_max_usd) require migration to be applied first
  const basePayload: Record<string, unknown> = {
    user_id: userId,

    // Scores
    financial_score: scores.financial_score,
    market_score: scores.market_score,
    operational_score: scores.operational_score,
    mindset_score: scores.mindset_score,
    overall_score: scores.overall_score,
    readiness_level: scores.readiness_level,

    // Raw answers - WITH ALL TRANSFORMATIONS
    capital_available: answers.capital,
    credit_score_range: mapCreditScoreToDB(answers.creditScore),
    income_stability: mapIncomeStabilityToDB(answers.incomeStability),
    creative_financing_knowledge: mapCreativeFinancingToDB(answers.creativeFinancing),

    licensing_familiarity: mapLicensingFamiliarityToDB(answers.licensingFamiliarity),
    target_populations: answers.targetPopulations,
    market_demand_research: mapMarketResearchToDB(answers.marketResearch),
    revenue_understanding: mapRevenueUnderstandingToDB(answers.reimbursementRate),

    caregiving_experience: answers.caregivingExperience,
    time_commitment: mapTimeCommitmentToDB(answers.timeCommitment),
    support_team: mapSupportTeamToDB(answers.supportTeam),
    property_management_comfort: mapPropertyManagementToDB(answers.propertyManagement),

    primary_motivation: answers.primaryMotivation,
    commitment_level: answers.commitmentLevel,
    timeline: mapTimelineToDB(answers.timeline),

    // CRITICAL: Set both assessment_completed_at AND onboarding_step atomically
    // This prevents the assessment loop bug where one succeeds and the other fails
    assessment_completed_at: new Date().toISOString(),
    onboarding_step: 'assessment_complete',
    updated_at: new Date().toISOString()
  };

  // First, try to save the base payload (always works with existing schema)
  const { data, error: baseError } = await supabase
    .from('user_onboarding')
    .upsert(basePayload, {
      onConflict: 'user_id'
    });

  if (baseError) {
    console.error('Error saving base assessment:', baseError);
    throw baseError;
  }

  // CRITICAL: Verify the save actually persisted before proceeding
  // Supabase upsert can return success even if RLS policies block the write
  const { data: verification, error: verifyError } = await supabase
    .from('user_onboarding')
    .select('assessment_completed_at')
    .eq('user_id', userId)
    .single();

  if (verifyError || !verification?.assessment_completed_at) {
    console.error('Assessment save verification failed - data did not persist:', verifyError);
    throw new Error('Assessment save verification failed. Your progress was not saved. Please try again.');
  }

  console.log('Assessment save verified successfully for user:', userId);

  // Now try to save enhanced fields separately (may fail if migration not applied)
  // This allows assessment to work even before migration is applied
  const enhancedPayload: Record<string, unknown> = {
    user_id: userId,
    updated_at: new Date().toISOString()
  };

  let hasEnhancedFields = false;

  // Add enhanced personalization fields if provided
  if (answers.ownershipModel) {
    enhancedPayload.ownership_model = answers.ownershipModel;
    hasEnhancedFields = true;
  }
  if (answers.targetState) {
    enhancedPayload.target_state = answers.targetState;
    hasEnhancedFields = true;
  }
  if (answers.propertyStatus) {
    enhancedPayload.property_status = answers.propertyStatus;
    hasEnhancedFields = true;
  }
  if (answers.immediatePriority) {
    enhancedPayload.immediate_priority = answers.immediatePriority;
    hasEnhancedFields = true;
  }

  // Calculate budget range from capital selection for enhanced filtering
  const budgetRanges: Record<string, { min: number; max: number }> = {
    'less-5k': { min: 0, max: 5000 },
    '5k-15k': { min: 5000, max: 15000 },
    '15k-30k': { min: 15000, max: 30000 },
    '30k-50k': { min: 30000, max: 50000 },
    'more-50k': { min: 50000, max: 100000 }
  };
  const budget = budgetRanges[answers.capital];
  if (budget) {
    enhancedPayload.budget_min_usd = budget.min;
    enhancedPayload.budget_max_usd = budget.max;
    hasEnhancedFields = true;
  }

  // Try to save enhanced fields (gracefully handle if columns don't exist yet)
  if (hasEnhancedFields) {
    const { error: enhancedError } = await supabase
      .from('user_onboarding')
      .update(enhancedPayload)
      .eq('user_id', userId);

    if (enhancedError) {
      // Log but don't fail - enhanced fields are optional until migration is applied
      console.warn('Enhanced personalization fields not yet available in database:', enhancedError.message);
      console.info('To enable enhanced personalization, apply the migration: 20251116160000_add_immediate_priority_personalization.sql');
    }
  }

  return data;
}

/**
 * Fetch user's assessment results
 */
export async function getUserAssessment(userId: string) {
  const { data, error } = await supabase
    .from('user_onboarding')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
    console.error('Error fetching assessment:', error);
    throw error;
  }
  
  return data;
}
