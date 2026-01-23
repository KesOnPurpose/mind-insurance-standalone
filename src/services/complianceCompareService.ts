// ============================================================================
// COMPLIANCE COMPARE SERVICE
// ============================================================================
// Service for comparing state compliance binders with real data from Supabase.
// Replaces the hardcoded mock data with actual database queries.
// ============================================================================

import { supabase } from '@/integrations/supabase/client';
import type {
  StateCode,
  StateComparisonEntry,
  ComparisonSection,
  CompareResult,
  PairwiseSimilarity,
  ParsedStateBinder,
  STATE_NAMES,
} from '@/types/compliance';
import {
  parseStateBinder,
  calculateMultiBinderSimilarity,
  generateKeyDifferences,
  toComparisonSection,
} from '@/utils/comparisonParser';

// Import STATE_NAMES for state name lookup
import { STATE_NAMES as StateNames } from '@/types/compliance';

// ============================================================================
// TYPES
// ============================================================================

interface StatBinderRow {
  id: string;
  state_code: string;
  state_name: string;
  content: string;
  section_headers: unknown;
  metadata: unknown;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// MAIN COMPARISON FUNCTION
// ============================================================================

/**
 * Compare multiple states by fetching their compliance binders from the database
 * and computing similarity scores and key differences.
 *
 * @param stateCodes - Array of state codes to compare (2-5 states)
 * @returns CompareResult with real state-specific data
 */
export async function compareStates(stateCodes: StateCode[]): Promise<CompareResult> {
  if (stateCodes.length < 2) {
    throw new Error('At least 2 states are required for comparison');
  }

  if (stateCodes.length > 5) {
    throw new Error('Maximum 5 states can be compared at once');
  }

  // Fetch binders from database
  const { data: binderRows, error } = await supabase
    .from('state_compliance_binders')
    .select('*')
    .in('state_code', stateCodes);

  if (error) {
    console.error('Error fetching state binders:', error);
    throw new Error('Failed to fetch state compliance binders');
  }

  // Parse the fetched binders
  const parsedBinders: ParsedStateBinder[] = [];
  const foundStateCodes = new Set<StateCode>();

  for (const row of (binderRows || []) as StatBinderRow[]) {
    const stateCode = row.state_code as StateCode;
    foundStateCodes.add(stateCode);

    const parsed = parseStateBinder(
      stateCode,
      row.state_name || StateNames[stateCode] || stateCode,
      row.content || ''
    );
    parsedBinders.push(parsed);
  }

  // For states not in the database, create placeholder entries
  for (const stateCode of stateCodes) {
    if (!foundStateCodes.has(stateCode)) {
      parsedBinders.push({
        stateCode,
        stateName: StateNames[stateCode] || stateCode,
        sections: [],
        rawContent: '',
      });
    }
  }

  // Calculate similarity scores
  const { average: similarityScore, pairwise } = calculateMultiBinderSimilarity(parsedBinders);

  // Generate key differences
  const keyDifferences = generateKeyDifferences(parsedBinders);

  // Determine if there are major differences
  const hasMajorDifferences = similarityScore < 85 || keyDifferences.length >= 3;

  // Convert to StateComparisonEntry format for UI
  const states = parsedBinders.map((binder) =>
    toStateComparisonEntry(binder, parsedBinders)
  );

  // Build pairwise similarity data
  const pairwiseSimilarity: PairwiseSimilarity[] = pairwise.map((p) => ({
    stateA: p.stateA,
    stateB: p.stateB,
    score: p.score,
    differences: findPairwiseDifferences(
      parsedBinders.find((b) => b.stateCode === p.stateA)!,
      parsedBinders.find((b) => b.stateCode === p.stateB)!
    ),
  }));

  return {
    states,
    similarityScore,
    keyDifferences,
    hasMajorDifferences,
    comparisonDate: new Date().toISOString(),
    pairwiseSimilarity,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert a ParsedStateBinder to StateComparisonEntry for UI rendering
 */
function toStateComparisonEntry(
  binder: ParsedStateBinder,
  allBinders: ParsedStateBinder[]
): StateComparisonEntry {
  const otherBinders = allBinders.filter((b) => b.stateCode !== binder.stateCode);

  // Convert sections to ComparisonSection format
  const sections: ComparisonSection[] = binder.sections.map((section) =>
    toComparisonSection(section, otherBinders, binder.stateCode)
  );

  // If no sections were parsed, create default sections with placeholder content
  if (sections.length === 0) {
    sections.push(
      createPlaceholderSection('licensure', binder.stateCode),
      createPlaceholderSection('housing_categories', binder.stateCode),
      createPlaceholderSection('local', binder.stateCode),
      createPlaceholderSection('fha', binder.stateCode),
      createPlaceholderSection('operational', binder.stateCode)
    );
  }

  // Calculate complexity score (0-100 based on number of requirements)
  const totalRequirements = sections.reduce(
    (sum, s) => sum + s.key_requirements.length,
    0
  );
  const complexityScore = Math.min(100, totalRequirements * 5);

  // Generate summary
  const summary = generateStateSummary(binder, sections);

  return {
    state_code: binder.stateCode,
    state_name: binder.stateName,
    sections,
    complexity_score: complexityScore,
    summary,
  };
}

/**
 * Create a placeholder section when no data is available
 */
function createPlaceholderSection(
  sectionType: ComparisonSection['section_type'],
  stateCode: StateCode
): ComparisonSection {
  const sectionLabels: Record<string, string> = {
    licensure: 'State Licensure',
    housing_categories: 'Housing Categories',
    local: 'Local Rules',
    fha: 'FHA & Fair Housing',
    operational: 'Operational Classification',
  };

  return {
    section_type: sectionType,
    content_summary: `${sectionLabels[sectionType] || sectionType} information for ${StateNames[stateCode] || stateCode} is not yet available in the database. Please check back later or contribute to the compliance library.`,
    key_requirements: ['Data pending review'],
    risk_level: 'medium',
    differences: [],
  };
}

/**
 * Generate a summary for a state based on its sections
 */
function generateStateSummary(
  binder: ParsedStateBinder,
  sections: ComparisonSection[]
): string {
  if (binder.sections.length === 0) {
    return `Compliance data for ${binder.stateName} is pending. Check state licensing board for current requirements.`;
  }

  const highRiskCount = sections.filter((s) => s.risk_level === 'high').length;
  const totalRequirements = sections.reduce(
    (sum, s) => sum + s.key_requirements.length,
    0
  );

  if (highRiskCount === 0) {
    return `${binder.stateName} has a relatively straightforward regulatory environment with ${totalRequirements} key requirements across ${sections.length} areas.`;
  }

  return `${binder.stateName} requires attention to ${highRiskCount} high-priority area${highRiskCount > 1 ? 's' : ''} with ${totalRequirements} total requirements.`;
}

/**
 * Find specific differences between two states
 */
function findPairwiseDifferences(
  binderA: ParsedStateBinder,
  binderB: ParsedStateBinder
): string[] {
  const differences: string[] = [];

  // Compare section counts
  if (Math.abs(binderA.sections.length - binderB.sections.length) > 2) {
    differences.push(
      `${binderA.stateCode} covers ${binderA.sections.length} sections vs ${binderB.stateCode}'s ${binderB.sections.length}`
    );
  }

  // Compare specific thresholds
  for (const sectionA of binderA.sections) {
    const sectionB = binderB.sections.find(
      (s) => s.sectionType === sectionA.sectionType
    );

    if (sectionB && sectionA.thresholds && sectionB.thresholds) {
      for (const [key, valueA] of Object.entries(sectionA.thresholds)) {
        const valueB = sectionB.thresholds[key];
        if (valueB !== undefined && valueA !== valueB) {
          const label = key.replace(/_/g, ' ');
          differences.push(`${label}: ${binderA.stateCode} (${valueA}) vs ${binderB.stateCode} (${valueB})`);
        }
      }
    }
  }

  return differences.slice(0, 3);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if comparison data is available for given states
 */
export async function checkComparisonAvailability(
  stateCodes: StateCode[]
): Promise<{ available: StateCode[]; unavailable: StateCode[] }> {
  const { data, error } = await supabase
    .from('state_compliance_binders')
    .select('state_code')
    .in('state_code', stateCodes);

  if (error) {
    console.error('Error checking availability:', error);
    return { available: [], unavailable: stateCodes };
  }

  const availableSet = new Set((data || []).map((row) => row.state_code as StateCode));

  return {
    available: stateCodes.filter((code) => availableSet.has(code)),
    unavailable: stateCodes.filter((code) => !availableSet.has(code)),
  };
}

/**
 * Get a list of all states that have comparison data available
 */
export async function getStatesWithData(): Promise<StateCode[]> {
  const { data, error } = await supabase
    .from('state_compliance_binders')
    .select('state_code')
    .order('state_code');

  if (error) {
    console.error('Error fetching states with data:', error);
    return [];
  }

  return (data || []).map((row) => row.state_code as StateCode);
}

// ============================================================================
// EXPORT
// ============================================================================

export default {
  compareStates,
  checkComparisonAvailability,
  getStatesWithData,
};
