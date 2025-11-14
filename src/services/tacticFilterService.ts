import { supabase } from "@/integrations/supabase/client";

interface UserAssessment {
  capital_available: string;
  target_populations: string[];
  timeline: string;
  caregiving_experience: string;
  licensing_familiarity: string;
  overall_score: number;
  readiness_level: string;
}

interface Tactic {
  tactic_id: string;
  tactic_name: string;
  category: string;
  week_assignment: number;
  estimated_time: string;
  capital_required: string;
  target_populations: string[];
  experience_level: string;
  priority_tier: number;
  why_it_matters: string;
  step_by_step: any;
  lynettes_tip: string;
  common_mistakes: any;
}

/**
 * Get personalized tactics based on user's assessment results
 * Implements the filtering logic from the PRD
 */
export async function getPersonalizedTactics(assessment: UserAssessment): Promise<Tactic[]> {
  // Start with all tactics
  let query = supabase
    .from('gh_tactic_instructions')
    .select('*')
    .order('week_assignment', { ascending: true })
    .order('tactic_id', { ascending: true });
  
  // Filter by capital requirement (most critical filter)
  const capitalFilter = getCapitalFilter(assessment.capital_available);
  if (capitalFilter.length > 0) {
    query = query.in('capital_required', capitalFilter);
  }
  
  const { data: tactics, error } = await query;
  
  if (error) {
    console.error('Error fetching tactics:', error);
    throw error;
  }
  
  if (!tactics) return [];
  
  // Apply additional filters in-memory for more complex logic
  let filteredTactics = tactics.filter(tactic => {
    // Filter by target populations (if tactic has specific populations)
    if (tactic.target_populations && tactic.target_populations.length > 0) {
      // 'all' means applicable to everyone
      if (tactic.target_populations.includes('all')) {
        return true;
      }
      
      // Check if user's target populations overlap with tactic's populations
      const hasMatch = tactic.target_populations.some(pop => 
        assessment.target_populations.includes(pop)
      );
      
      if (!hasMatch) return false;
    }
    
    // Filter by timeline - if user wants fast timeline, only show priority tactics
    if (assessment.timeline === 'within-3-months') {
      if (tactic.priority_tier > 2) return false;
    } else if (assessment.timeline === 'within-6-months') {
      if (tactic.priority_tier > 3) return false;
    }
    
    // Filter by experience level for advanced tactics
    if (tactic.experience_level === 'advanced') {
      if (assessment.caregiving_experience === 'no-experience') {
        return false;
      }
    }
    
    return true;
  });
  
  // Prioritize tactics based on user's situation
  filteredTactics = prioritizeTactics(filteredTactics, assessment);
  
  return filteredTactics;
}

/**
 * Determine which capital requirements user can handle
 */
function getCapitalFilter(capitalAvailable: string): string[] {
  switch (capitalAvailable) {
    case 'less-5k':
      return ['low']; // Only low-capital tactics (rental arbitrage path)
    case '5k-15k':
      return ['low', 'medium']; // Can handle some moderate expenses
    case '15k-30k':
    case '30k-50k':
    case 'more-50k':
      return ['low', 'medium', 'high']; // Can handle all tactics
    default:
      return ['low', 'medium', 'high'];
  }
}

/**
 * Prioritize tactics based on user's specific situation
 */
function prioritizeTactics(tactics: Tactic[], assessment: UserAssessment): Tactic[] {
  return tactics.sort((a, b) => {
    // First, sort by week assignment
    if (a.week_assignment !== b.week_assignment) {
      return a.week_assignment - b.week_assignment;
    }
    
    // Within same week, prioritize by tier
    if (a.priority_tier !== b.priority_tier) {
      return a.priority_tier - b.priority_tier;
    }
    
    // Boost licensing tactics if user is not familiar
    if (assessment.licensing_familiarity === 'not-familiar') {
      const aIsLicensing = a.category?.toLowerCase().includes('licensing');
      const bIsLicensing = b.category?.toLowerCase().includes('licensing');
      
      if (aIsLicensing && !bIsLicensing) return -1;
      if (!aIsLicensing && bIsLicensing) return 1;
    }
    
    // Boost financial tactics if capital is low
    if (assessment.capital_available === 'less-5k' || assessment.capital_available === '5k-15k') {
      const aIsFinancial = a.category?.toLowerCase().includes('financial') || 
                          a.category?.toLowerCase().includes('creative financing');
      const bIsFinancial = b.category?.toLowerCase().includes('financial') || 
                          b.category?.toLowerCase().includes('creative financing');
      
      if (aIsFinancial && !bIsFinancial) return -1;
      if (!aIsFinancial && bIsFinancial) return 1;
    }
    
    // Boost experience-building tactics for beginners
    if (assessment.caregiving_experience === 'no-experience') {
      const aIsEducation = a.category?.toLowerCase().includes('education');
      const bIsEducation = b.category?.toLowerCase().includes('education');
      
      if (aIsEducation && !bIsEducation) return -1;
      if (!aIsEducation && bIsEducation) return 1;
    }
    
    // Keep original order
    return 0;
  });
}

/**
 * Calculate recommended week count based on timeline and readiness
 */
export function getRecommendedWeekCount(assessment: UserAssessment): number {
  const { timeline, readiness_level } = assessment;
  
  // Fast track users with aggressive timeline
  if (timeline === 'within-3-months' && 
      (readiness_level === 'fast_track' || readiness_level === 'expert_implementation')) {
    return 6; // Compress to 6 weeks
  }
  
  // Accelerated path
  if (timeline === 'within-6-months') {
    return 10; // 10-week program
  }
  
  // Standard path
  if (timeline === 'within-year' || readiness_level === 'foundation_building') {
    return 15; // Full 15-week program
  }
  
  // Default
  return 12;
}

/**
 * Get personalized starting point based on readiness level
 */
export function getStartingWeek(assessment: UserAssessment): number {
  const { readiness_level, overall_score } = assessment;
  
  // Expert users can skip foundation weeks
  if (readiness_level === 'expert_implementation' && overall_score >= 85) {
    return 3; // Start at Week 3
  }
  
  // Fast track can skip some basics
  if (readiness_level === 'fast_track' && overall_score >= 70) {
    return 2; // Start at Week 2
  }
  
  // Everyone else starts at Week 1
  return 1;
}

/**
 * Get next recommended tactic for user
 */
export async function getNextRecommendedTactic(
  userId: string,
  assessment: UserAssessment
): Promise<Tactic | null> {
  // Get user's progress
  const { data: progress } = await supabase
    .from('gh_user_tactic_progress')
    .select('tactic_id, status')
    .eq('user_id', userId)
    .in('status', ['completed', 'in_progress']);
  
  const completedTacticIds = new Set(
    progress?.filter(p => p.status === 'completed').map(p => p.tactic_id) || []
  );
  
  const inProgressTacticIds = new Set(
    progress?.filter(p => p.status === 'in_progress').map(p => p.tactic_id) || []
  );
  
  // Get personalized tactics
  const tactics = await getPersonalizedTactics(assessment);
  
  // Priority 1: Return in-progress tactic
  const inProgressTactic = tactics.find(t => inProgressTacticIds.has(t.tactic_id));
  if (inProgressTactic) return inProgressTactic;
  
  // Priority 2: Return next not-started tactic
  const nextTactic = tactics.find(t => !completedTacticIds.has(t.tactic_id));
  
  return nextTactic || null;
}
