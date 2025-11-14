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
  
  // Credit score (0-30 points)
  const creditScores: Record<string, number> = {
    'below-580': 5,
    '580-650': 15,
    '650-700': 20,
    '700-750': 25,
    'above-750': 30
  };
  score += creditScores[answers.creditScore] || 0;
  
  // Income stability (0-20 points)
  const incomeScores: Record<string, number> = {
    'unstable': 5,
    'somewhat-stable': 10,
    'stable': 15,
    'very-stable': 20
  };
  score += incomeScores[answers.incomeStability] || 0;
  
  // Creative financing knowledge (0-10 points)
  const financingScores: Record<string, number> = {
    'none': 0,
    'basic': 3,
    'intermediate': 7,
    'advanced': 10
  };
  score += financingScores[answers.creativeFinancing] || 0;
  
  return score; // Max 100
}

function calculateMarketScore(answers: AssessmentAnswers): number {
  let score = 0;
  
  // Licensing familiarity (0-30 points)
  const licensingScores: Record<string, number> = {
    'not-familiar': 5,
    'somewhat-familiar': 15,
    'very-familiar': 30
  };
  score += licensingScores[answers.licensingFamiliarity] || 0;
  
  // Target populations (0-25 points) - more selections = better understanding
  score += Math.min(answers.targetPopulations.length * 8, 25);
  
  // Market research (0-30 points)
  const researchScores: Record<string, number> = {
    'none': 5,
    'some': 15,
    'extensive': 30
  };
  score += researchScores[answers.marketResearch] || 0;
  
  // Revenue understanding (0-15 points)
  const revenueScores: Record<string, number> = {
    'none': 0,
    'basic': 5,
    'good': 10,
    'excellent': 15
  };
  score += revenueScores[answers.reimbursementRate] || 0;
  
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
  
  // Time commitment (0-25 points)
  const timeScores: Record<string, number> = {
    'part-time': 10,
    'full-time': 25,
    'flexible': 20
  };
  score += timeScores[answers.timeCommitment] || 0;
  
  // Support team (0-25 points) - more support = better
  score += Math.min(answers.supportTeam.length * 8, 25);
  
  // Property management comfort (0-15 points) - scale 1-10
  score += (answers.propertyManagement / 10) * 15;
  
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
  
  // Timeline (0-20 points) - faster timeline = higher urgency/commitment
  const timelineScores: Record<string, number> = {
    'within-3-months': 20,
    'within-6-months': 15,
    'within-year': 10,
    'exploring': 5
  };
  score += timelineScores[answers.timeline] || 0;
  
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
  const { data, error } = await supabase
    .from('user_onboarding')
    .upsert({
      user_id: userId,
      
      // Scores
      financial_score: scores.financial_score,
      market_score: scores.market_score,
      operational_score: scores.operational_score,
      mindset_score: scores.mindset_score,
      overall_score: scores.overall_score,
      readiness_level: scores.readiness_level,
      
      // Raw answers
      capital_available: answers.capital,
      credit_score_range: answers.creditScore,
      income_stability: answers.incomeStability,
      creative_financing_knowledge: answers.creativeFinancing,
      
      licensing_familiarity: answers.licensingFamiliarity,
      target_populations: answers.targetPopulations,
      market_demand_research: answers.marketResearch,
      revenue_understanding: answers.reimbursementRate,
      
      caregiving_experience: answers.caregivingExperience,
      time_commitment: answers.timeCommitment,
      support_team: answers.supportTeam.join(','),
      property_management_comfort: answers.propertyManagement.toString(),
      
      primary_motivation: answers.primaryMotivation,
      commitment_level: answers.commitmentLevel,
      timeline: answers.timeline,
      
      assessment_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    });
  
  if (error) {
    console.error('Error saving assessment:', error);
    throw error;
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
