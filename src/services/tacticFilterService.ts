import { supabase } from "@/integrations/supabase/client";
import { Tactic, EnhancedUserAssessment, TacticWithPrerequisites } from "@/types/tactic";

interface UserAssessment {
  capital_available: string;
  target_populations: string[];
  timeline: string;
  caregiving_experience: string;
  licensing_familiarity: string;
  overall_score: number;
  readiness_level: string;
}

// Budget mapping: Convert categorical capital to exact USD ranges
const CAPITAL_TO_USD_MAP: Record<string, { min: number; max: number }> = {
  'less-5k': { min: 0, max: 5000 },
  '5k-15k': { min: 5000, max: 15000 },
  '15k-30k': { min: 15000, max: 30000 },
  '30k-50k': { min: 30000, max: 50000 },
  'more-50k': { min: 50000, max: 100000 }
};

// Population mapping: Normalize assessment populations to database values
const POPULATION_MAPPING: Record<string, string[]> = {
  'developmental-disabilities': ['disabled', 'mental_health'],
  'seniors': ['elderly', 'ssi'],
  'mental-health': ['mental_health', 'disabled'],
  'at-risk-youth': ['ssi', 'mental_health'],
  'substance-abuse': ['mental_health', 'returning_citizens'],
  'not-sure': ['ssi', 'elderly', 'disabled', 'mental_health', 'veterans', 'returning_citizens']
};

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
  
  // MIND INSURANCE CATEGORIES - These belong to MIO product, NOT Group Home roadmap
  const MIND_INSURANCE_CATEGORIES = [
    'Vision & Goal Setting',
    'Mindset & Personal Development',
    'Education & Continuous Learning',
  ];

  // Apply additional filters in-memory for more complex logic
  let filteredTactics = tactics.filter(tactic => {
    // EXCLUDE Mind Insurance categories (these are handled by MIO product)
    if (MIND_INSURANCE_CATEGORIES.includes(tactic.category)) {
      return false;
    }

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

// =============================================================================
// ENHANCED FILTERING WITH ENRICHED RAG FIELDS (Phase 2 - $100M Product)
// =============================================================================

/**
 * Get personalized tactics using NEW enriched database fields:
 * - ownership_model filtering (rental_arbitrage vs ownership)
 * - cost_min_usd/cost_max_usd for exact budget matching
 * - prerequisite_tactics for dependency validation
 * - is_critical_path for prioritization
 * - applicable_populations for precise demographic matching
 */
export async function getEnhancedPersonalizedTactics(
  assessment: EnhancedUserAssessment,
  userId?: string,
  immediatePriority?: 'property_acquisition' | 'operations' | 'comprehensive' | 'scaling'
): Promise<TacticWithPrerequisites[]> {
  // 1. Fetch all tactics with enriched fields
  const { data: allTactics, error } = await supabase
    .from('gh_tactic_instructions')
    .select('*')
    .order('week_assignment', { ascending: true })
    .order('tactic_id', { ascending: true });

  if (error) {
    console.error('Error fetching tactics:', error);
    throw error;
  }

  if (!allTactics) return [];

  // 2. Get user's completed tactics (for prerequisite validation)
  let completedTacticIds = new Set<string>();
  if (userId) {
    const { data: progress } = await supabase
      .from('gh_user_tactic_progress')
      .select('tactic_id')
      .eq('user_id', userId)
      .eq('status', 'completed');

    if (progress) {
      completedTacticIds = new Set(progress.map(p => p.tactic_id));
    }
  }

  // 3. Determine user's budget range
  const userBudget = assessment.budget_max_usd ||
    CAPITAL_TO_USD_MAP[assessment.capital_available]?.max || 50000;

  // 4. Normalize user's target populations
  const normalizedPopulations = new Set<string>();
  assessment.target_populations.forEach(pop => {
    const mapped = POPULATION_MAPPING[pop];
    if (mapped) {
      mapped.forEach(p => normalizedPopulations.add(p));
    } else {
      normalizedPopulations.add(pop);
    }
  });

  // MIND INSURANCE CATEGORIES - These belong to MIO product, NOT Group Home roadmap
  const MIND_INSURANCE_CATEGORIES = [
    'Vision & Goal Setting',
    'Mindset & Personal Development',
    'Education & Continuous Learning',
  ];

  // PROMOTIONAL-ONLY TACTICS - These are community/promotional items, not actionable tactics
  const PROMOTIONAL_ONLY_TACTICS = [
    'T372', // Join Group Homes for Newbies Skool platform
    'T373', // Attend monthly Group Homes for Newbies Zoom calls
  ];

  // 5. Apply multi-criteria filtering (INITIAL PASS)
  let initialFilteredTactics = allTactics.filter(tactic => {
    // 0. EXCLUDE Mind Insurance categories (these are handled by MIO product)
    if (MIND_INSURANCE_CATEGORIES.includes(tactic.category)) {
      return false;
    }

    // 0.5 EXCLUDE promotional-only tactics (community/promotional items)
    if (PROMOTIONAL_ONLY_TACTICS.includes(tactic.tactic_id)) {
      return false;
    }

    // A. OWNERSHIP MODEL FILTER (if user has specified)
    if (assessment.ownership_model && assessment.ownership_model !== 'undecided') {
      if (tactic.ownership_model && Array.isArray(tactic.ownership_model)) {
        const matchesOwnership = tactic.ownership_model.includes(assessment.ownership_model);
        if (!matchesOwnership) return false;
      }
    }

    // B. BUDGET FILTER (exact USD matching)
    if (tactic.cost_max_usd && tactic.cost_max_usd > userBudget) {
      return false; // Tactic exceeds user's budget
    }

    // C. POPULATION FILTER (overlap check)
    if (tactic.applicable_populations && Array.isArray(tactic.applicable_populations)) {
      const hasPopulationMatch = tactic.applicable_populations.some(pop =>
        normalizedPopulations.has(pop) || pop === 'mixed'
      );
      if (!hasPopulationMatch && tactic.applicable_populations.length > 0) {
        return false;
      }
    }

    // D. EXPERIENCE FILTER (keep original logic)
    if (tactic.experience_level === 'advanced') {
      if (assessment.caregiving_experience === 'no-experience') {
        return false;
      }
    }

    // E. TIMELINE FILTER (priority tier based)
    if (assessment.timeline === 'within-3-months') {
      if (tactic.priority_tier && tactic.priority_tier > 2) return false;
    } else if (assessment.timeline === 'within-6-months') {
      if (tactic.priority_tier && tactic.priority_tier > 3) return false;
    }

    return true;
  });

  // 5.5 CRITICAL FIX: Force-include ALL prerequisite tactics that are referenced
  // This prevents orphaned prerequisites where a tactic references a prerequisite
  // that was filtered out due to budget/population/timeline restrictions
  const allTacticsMap = new Map(allTactics.map(t => [t.tactic_id, t]));
  const filteredTacticIds = new Set(initialFilteredTactics.map(t => t.tactic_id));

  // Recursively collect all prerequisites
  function collectAllPrerequisites(tacticIds: Set<string>): Set<string> {
    const allPrereqs = new Set<string>();
    const toProcess = Array.from(tacticIds);
    const processed = new Set<string>();

    while (toProcess.length > 0) {
      const tacticId = toProcess.pop()!;
      if (processed.has(tacticId)) continue;
      processed.add(tacticId);

      const tactic = allTacticsMap.get(tacticId);
      if (!tactic || !tactic.prerequisite_tactics) continue;

      for (const prereqId of tactic.prerequisite_tactics) {
        if (!allPrereqs.has(prereqId)) {
          allPrereqs.add(prereqId);
          // Also process this prerequisite's prerequisites (chain)
          if (!processed.has(prereqId)) {
            toProcess.push(prereqId);
          }
        }
      }
    }

    return allPrereqs;
  }

  const requiredPrereqs = collectAllPrerequisites(filteredTacticIds);

  // Add missing prerequisites to the filtered list
  let addedPrereqCount = 0;
  for (const prereqId of requiredPrereqs) {
    if (!filteredTacticIds.has(prereqId)) {
      const prereqTactic = allTacticsMap.get(prereqId);
      if (prereqTactic) {
        // Skip Mind Insurance categories - these should NEVER be forced into roadmap
        if (MIND_INSURANCE_CATEGORIES.includes(prereqTactic.category)) {
          console.warn(`[PrerequisiteFix] Skipping Mind Insurance prerequisite ${prereqId} - handled by MIO`);
          continue;
        }

        initialFilteredTactics.push(prereqTactic);
        filteredTacticIds.add(prereqId);
        addedPrereqCount++;
        console.log(`[PrerequisiteFix] Force-added prerequisite tactic ${prereqId} (${prereqTactic.tactic_name})`);
      } else {
        console.warn(`[PrerequisiteFix] Missing prerequisite tactic ${prereqId} not found in database!`);
      }
    }
  }

  if (addedPrereqCount > 0) {
    console.log(`[PrerequisiteFix] Total force-added prerequisites: ${addedPrereqCount}`);
  }

  // 6. Now map to TacticWithPrerequisites with updated filtering
  const filteredTactics: TacticWithPrerequisites[] = initialFilteredTactics.map(tactic => {
    // F. PREREQUISITE VALIDATION - now all prerequisites should be in the list
    const blockingPrerequisites = (tactic.prerequisite_tactics || []).filter(
      prereqId => !completedTacticIds.has(prereqId) && filteredTacticIds.has(prereqId)
    );

    const canStart = blockingPrerequisites.length === 0;

    // G. COST STATUS
    let costStatus: 'within_budget' | 'exceeds_budget' | 'unknown' = 'unknown';
    if (tactic.cost_max_usd !== null && tactic.cost_max_usd !== undefined) {
      costStatus = tactic.cost_max_usd <= userBudget ? 'within_budget' : 'exceeds_budget';
    }

    return {
      ...tactic,
      status: 'not_started' as const,
      can_start: canStart,
      blocking_prerequisites: blockingPrerequisites,
      cost_status: costStatus
    };
  });

  // 6. Sort with enhanced prioritization including immediate priority
  return filteredTactics.sort((a, b) => {
    // Critical path tactics ALWAYS first (these are must-do)
    if (a.is_critical_path && !b.is_critical_path) return -1;
    if (!a.is_critical_path && b.is_critical_path) return 1;

    // Priority-based sorting (ADDITIVE, not restrictive)
    // Boost tactics that match user's immediate priority focus
    if (immediatePriority && immediatePriority !== 'comprehensive') {
      const priorityWeekRanges: Record<string, number[]> = {
        'property_acquisition': [7, 8, 9],  // Property acquisition phase
        'operations': [10, 11, 12],          // Operations setup phase
        'scaling': [13, 14, 15]              // Growth/scaling phase
      };

      const priorityWeeks = priorityWeekRanges[immediatePriority] || [];
      const weekA = a.week_assignment || 99;
      const weekB = b.week_assignment || 99;

      const aInPriorityPhase = priorityWeeks.includes(weekA);
      const bInPriorityPhase = priorityWeeks.includes(weekB);

      // Boost priority phase tactics to the top (after critical path)
      if (aInPriorityPhase && !bInPriorityPhase) return -1;
      if (!aInPriorityPhase && bInPriorityPhase) return 1;
    }

    // Then by week assignment (standard progression)
    const weekA = a.week_assignment || 99;
    const weekB = b.week_assignment || 99;
    if (weekA !== weekB) return weekA - weekB;

    // Then by priority tier
    const tierA = a.priority_tier || 99;
    const tierB = b.priority_tier || 99;
    if (tierA !== tierB) return tierA - tierB;

    // Then by can_start (available tactics before blocked)
    if (a.can_start && !b.can_start) return -1;
    if (!a.can_start && b.can_start) return 1;

    return 0;
  });
}

/**
 * Calculate total cost for a set of tactics
 * Returns breakdown by cost category
 */
export function calculateTotalCost(tactics: Tactic[]): {
  total_min: number;
  total_max: number;
  upfront_capital: number;
  recurring_monthly: number;
  one_time_fees: number;
} {
  return tactics.reduce((acc, tactic) => {
    const minCost = tactic.cost_min_usd || 0;
    const maxCost = tactic.cost_max_usd || 0;

    acc.total_min += minCost;
    acc.total_max += maxCost;

    if (tactic.cost_category === 'upfront_capital') {
      acc.upfront_capital += maxCost;
    } else if (tactic.cost_category === 'recurring_monthly') {
      acc.recurring_monthly += maxCost;
    } else if (tactic.cost_category === 'one_time_fee') {
      acc.one_time_fees += maxCost;
    }

    return acc;
  }, {
    total_min: 0,
    total_max: 0,
    upfront_capital: 0,
    recurring_monthly: 0,
    one_time_fees: 0
  });
}

/**
 * Get prerequisite chain for a specific tactic
 * Returns ordered list of prerequisites (deepest first)
 */
export async function getPrerequisiteChain(tacticId: string): Promise<Tactic[]> {
  const { data: allTactics } = await supabase
    .from('gh_tactic_instructions')
    .select('*');

  if (!allTactics) return [];

  const tacticsMap = new Map(allTactics.map(t => [t.tactic_id, t]));
  const chain: Tactic[] = [];
  const visited = new Set<string>();

  function traversePrereqs(id: string) {
    if (visited.has(id)) return; // Prevent infinite loops
    visited.add(id);

    const tactic = tacticsMap.get(id);
    if (!tactic) return;

    const prereqs = tactic.prerequisite_tactics || [];
    prereqs.forEach(prereqId => {
      traversePrereqs(prereqId);
      const prereqTactic = tacticsMap.get(prereqId);
      if (prereqTactic && !chain.find(t => t.tactic_id === prereqId)) {
        chain.push(prereqTactic);
      }
    });
  }

  traversePrereqs(tacticId);
  return chain;
}

/**
 * Get critical path tactics for a user's ownership model
 * These are the must-do tactics that block other progress
 */
export async function getCriticalPathTactics(
  ownershipModel: string
): Promise<Tactic[]> {
  const { data: criticalTactics, error } = await supabase
    .from('gh_tactic_instructions')
    .select('*')
    .eq('is_critical_path', true)
    .order('week_assignment', { ascending: true });

  if (error || !criticalTactics) return [];

  // Filter by ownership model
  return criticalTactics.filter(tactic =>
    tactic.ownership_model?.includes(ownershipModel) ||
    tactic.ownership_model?.length === 0
  );
}

/**
 * Format cost range for display
 * Returns user-friendly string like "$2,000 - $5,000" or "Free"
 */
export function formatCostRange(minUsd: number | null, maxUsd: number | null): string {
  if ((!minUsd || minUsd === 0) && (!maxUsd || maxUsd === 0)) {
    return 'Free';
  }

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  if (minUsd === maxUsd || !minUsd) {
    return formatter.format(maxUsd || 0);
  }

  return `${formatter.format(minUsd)} - ${formatter.format(maxUsd || 0)}`;
}
