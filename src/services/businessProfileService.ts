import { supabase } from "@/integrations/supabase/client";
import type { BusinessProfile } from '@/types/assessment';
import { calculateProfileCompleteness } from '@/config/tacticQuestions';

// Map camelCase TypeScript fields to snake_case database columns
const fieldToColumnMap: Record<keyof BusinessProfile, string> = {
  businessName: 'business_name',
  entityType: 'entity_type',
  targetState: 'target_state',
  targetStateReason: 'target_state_reason',
  bedCount: 'bed_count',
  propertyStatus: 'property_status',
  propertyAddress: 'property_address',
  propertyType: 'property_type',
  licenseStatus: 'license_status',
  licenseType: 'license_type',
  estimatedLicenseDate: 'estimated_license_date',
  fundingSource: 'funding_source',
  startupCapitalActual: 'startup_capital_actual',
  monthlyRevenueTarget: 'monthly_revenue_target',
  monthlyExpenseEstimate: 'monthly_expense_estimate',
  breakEvenTimeline: 'break_even_timeline',
  serviceModel: 'service_model',
  marketingStrategy: 'marketing_strategy',
  referralSources: 'referral_sources',
  firstResidentDate: 'first_resident_date',
  fullOccupancyDate: 'full_occupancy_date',
  businessLaunchDate: 'business_launch_date',
  profileCompleteness: 'profile_completeness',
  lastTacticCompleted: 'last_tactic_completed',
  lastProfileUpdate: 'last_profile_update',
};

// Reverse map for database to TypeScript
const columnToFieldMap: Record<string, keyof BusinessProfile> = {};
for (const [field, column] of Object.entries(fieldToColumnMap)) {
  columnToFieldMap[column] = field as keyof BusinessProfile;
}

/**
 * Update user's business profile with new data from tactic completion
 */
export async function updateBusinessProfile(
  userId: string,
  profileUpdates: Partial<BusinessProfile>,
  tacticId: string
): Promise<void> {
  if (Object.keys(profileUpdates).length === 0) {
    // No profile updates, just mark tactic as completed
    return;
  }

  // Convert camelCase to snake_case for database
  const dbUpdates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(profileUpdates)) {
    const columnName = fieldToColumnMap[key as keyof BusinessProfile];
    if (columnName && value !== undefined && value !== null && value !== '') {
      dbUpdates[columnName] = value;
    }
  }

  // Add metadata
  dbUpdates.last_tactic_completed = tacticId;
  dbUpdates.last_profile_update = new Date().toISOString();

  // Get current profile to calculate completeness
  const { data: currentProfile } = await supabase
    .from('user_onboarding')
    .select('*')
    .eq('user_id', userId)
    .single();

  // Merge current profile with updates to calculate completeness
  const mergedProfile = { ...currentProfile, ...dbUpdates };

  // Convert back to camelCase for completeness calculation
  const camelCaseProfile: Record<string, unknown> = {};
  for (const [column, value] of Object.entries(mergedProfile)) {
    const fieldName = columnToFieldMap[column];
    if (fieldName) {
      camelCaseProfile[fieldName] = value;
    }
  }

  const completeness = calculateProfileCompleteness(camelCaseProfile);
  dbUpdates.profile_completeness = completeness;

  // Update the database
  const { error } = await supabase
    .from('user_onboarding')
    .update(dbUpdates)
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating business profile:', error);
    throw error;
  }
}

/**
 * Get user's business profile
 */
export async function getBusinessProfile(userId: string): Promise<BusinessProfile | null> {
  const { data, error } = await supabase
    .from('user_onboarding')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching business profile:', error);
    return null;
  }

  if (!data) return null;

  // Convert snake_case to camelCase
  const profile: BusinessProfile = {};
  for (const [column, fieldName] of Object.entries(columnToFieldMap)) {
    const value = data[column];
    if (value !== undefined && value !== null) {
      (profile as Record<string, unknown>)[fieldName] = value;
    }
  }

  return profile;
}

/**
 * Get user's complete profile snapshot for agents
 */
export async function getUserProfileSnapshot(userId: string): Promise<{
  businessProfile: BusinessProfile;
  assessmentAnswers: Record<string, unknown>;
  assessmentScores: Record<string, number>;
  progressStats: {
    currentWeek: number;
    tacticsCompleted: number;
    totalTactics: number;
    progressPercentage: number;
  };
} | null> {
  // Get user onboarding data
  const { data: onboarding } = await supabase
    .from('user_onboarding')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!onboarding) return null;

  // Get progress stats
  const { data: progress } = await supabase
    .from('gh_user_tactic_progress')
    .select('status')
    .eq('user_id', userId);

  const { count: totalTactics } = await supabase
    .from('gh_tactic_instructions')
    .select('*', { count: 'exact', head: true });

  const completedCount = progress?.filter(p => p.status === 'completed').length || 0;
  const total = totalTactics || 0;

  // Calculate current week based on completed tactics
  // Assuming ~3-4 tactics per week
  const currentWeek = Math.max(1, Math.ceil(completedCount / 3));

  // Convert to camelCase business profile
  const businessProfile: BusinessProfile = {};
  for (const [column, fieldName] of Object.entries(columnToFieldMap)) {
    const value = onboarding[column];
    if (value !== undefined && value !== null) {
      (businessProfile as Record<string, unknown>)[fieldName] = value;
    }
  }

  // Extract assessment answers
  const assessmentAnswers = {
    capitalAvailable: onboarding.capital_available,
    creditScoreRange: onboarding.credit_score_range,
    incomeStability: onboarding.income_stability,
    creativeFinancingKnowledge: onboarding.creative_financing_knowledge,
    licensingFamiliarity: onboarding.licensing_familiarity,
    targetPopulations: onboarding.target_populations,
    marketDemandResearch: onboarding.market_demand_research,
    revenueUnderstanding: onboarding.revenue_understanding,
    caregivingExperience: onboarding.caregiving_experience,
    timeCommitment: onboarding.time_commitment,
    supportTeam: onboarding.support_team,
    propertyManagementComfort: onboarding.property_management_comfort,
    primaryMotivation: onboarding.primary_motivation,
    commitmentLevel: onboarding.commitment_level,
    timeline: onboarding.timeline,
  };

  // Extract assessment scores
  const assessmentScores = {
    financialScore: onboarding.financial_score || 0,
    marketScore: onboarding.market_score || 0,
    operationalScore: onboarding.operational_score || 0,
    mindsetScore: onboarding.mindset_score || 0,
    overallScore: onboarding.overall_score || 0,
  };

  return {
    businessProfile,
    assessmentAnswers,
    assessmentScores,
    progressStats: {
      currentWeek,
      tacticsCompleted: completedCount,
      totalTactics: total,
      progressPercentage: total > 0 ? Math.round((completedCount / total) * 100) : 0,
    },
  };
}
