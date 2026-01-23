// ============================================================================
// COMPARISON PARSER UTILITY
// ============================================================================
// Extracts and parses sections from state compliance binder markdown content
// for comparison, similarity scoring, and difference highlighting.
// ============================================================================

import type {
  BinderSectionType,
  ParsedBinderSection,
  ParsedStateBinder,
  StateCode,
  STATE_NAMES,
  ComparisonSection,
} from '@/types/compliance';

// ============================================================================
// SECTION EXTRACTION
// ============================================================================

/**
 * Maps markdown heading patterns to BinderSectionType
 */
const SECTION_HEADING_PATTERNS: Record<string, BinderSectionType> = {
  'state licensure': 'licensure',
  'licensure': 'licensure',
  'licensing': 'licensure',
  'licensed': 'licensure',
  'housing categories': 'housing_categories',
  'rooming house': 'housing_categories',
  'boarding house': 'housing_categories',
  'local rules': 'local',
  'local ordinances': 'local',
  'zoning': 'local',
  'occupancy': 'local',
  'fair housing': 'fha',
  'fha': 'fha',
  'discrimination': 'fha',
  'reasonable accommodation': 'fha',
  'operational': 'operational',
  'classification': 'operational',
  'model definition': 'model_definition',
  'emergency preparedness': 'operational',
  'health and safety': 'operational',
  'documentation': 'operational',
  'resources': 'general',
};

/**
 * Extract sections from markdown content
 */
export function extractSections(
  content: string,
  stateCode: StateCode,
  stateName: string
): ParsedBinderSection[] {
  const sections: ParsedBinderSection[] = [];

  // Split by h2 headings (## )
  const sectionRegex = /^##\s+(.+)$/gm;
  const headings: { title: string; index: number }[] = [];

  let match;
  while ((match = sectionRegex.exec(content)) !== null) {
    headings.push({
      title: match[1].trim(),
      index: match.index,
    });
  }

  // Extract content for each section
  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i];
    const nextHeading = headings[i + 1];

    // Get content between this heading and the next (or end of content)
    const startIndex = heading.index + heading.title.length + 3; // +3 for "## "
    const endIndex = nextHeading ? nextHeading.index : content.length;
    const sectionContent = content.slice(startIndex, endIndex).trim();

    // Determine section type from heading
    const sectionType = determineSectionType(heading.title);

    // Extract key points (bullet points)
    const keyPoints = extractKeyPoints(sectionContent);

    // Extract any thresholds/numbers
    const thresholds = extractThresholds(sectionContent);

    sections.push({
      sectionType,
      title: heading.title,
      content: sectionContent,
      keyPoints,
      thresholds,
    });
  }

  return sections;
}

/**
 * Determine the section type from a heading title
 */
function determineSectionType(title: string): BinderSectionType {
  const normalizedTitle = title.toLowerCase();

  for (const [pattern, type] of Object.entries(SECTION_HEADING_PATTERNS)) {
    if (normalizedTitle.includes(pattern)) {
      return type;
    }
  }

  return 'general';
}

/**
 * Extract bullet points as key points
 */
function extractKeyPoints(content: string): string[] {
  const bulletRegex = /^[-*]\s+(.+)$/gm;
  const points: string[] = [];

  let match;
  while ((match = bulletRegex.exec(content)) !== null) {
    const point = match[1].trim();
    if (point.length > 0 && point.length < 200) { // Reasonable length for a key point
      points.push(point);
    }
  }

  return points.slice(0, 10); // Max 10 key points per section
}

/**
 * Extract numeric thresholds and requirements
 */
function extractThresholds(content: string): Record<string, string | number> {
  const thresholds: Record<string, string | number> = {};

  // Common patterns for thresholds
  const patterns = [
    // "X or more residents"
    { regex: /(\d+)\s+or\s+(?:more|fewer)\s+(?:residents?|beds?|persons?|adults?)/gi, key: 'resident_threshold' },
    // "within X days"
    { regex: /within\s+(\d+)\s+days?/gi, key: 'days_requirement' },
    // "X hours of training"
    { regex: /(\d+)\s+hours?\s+(?:of\s+)?training/gi, key: 'training_hours' },
    // "annual/semi-annual/quarterly inspection"
    { regex: /(annual|semi-annual|quarterly|monthly)\s+(?:inspection|review|audit)/gi, key: 'inspection_frequency' },
  ];

  for (const { regex, key } of patterns) {
    const match = regex.exec(content);
    if (match) {
      thresholds[key] = isNaN(Number(match[1])) ? match[1] : Number(match[1]);
    }
  }

  return thresholds;
}

// ============================================================================
// SIMILARITY CALCULATION
// ============================================================================

/**
 * Calculate similarity score between two text strings (0-100)
 * Uses Jaccard similarity on word sets
 */
export function calculateTextSimilarity(textA: string, textB: string): number {
  if (!textA && !textB) return 100;
  if (!textA || !textB) return 0;

  // Normalize and tokenize
  const wordsA = new Set(normalizeText(textA).split(/\s+/).filter(w => w.length > 2));
  const wordsB = new Set(normalizeText(textB).split(/\s+/).filter(w => w.length > 2));

  if (wordsA.size === 0 && wordsB.size === 0) return 100;
  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  // Calculate Jaccard similarity
  const intersection = new Set([...wordsA].filter(w => wordsB.has(w)));
  const union = new Set([...wordsA, ...wordsB]);

  return Math.round((intersection.size / union.size) * 100);
}

/**
 * Calculate weighted similarity score between two parsed binders
 * Weights by section importance
 */
export function calculateBinderSimilarity(
  binderA: ParsedStateBinder,
  binderB: ParsedStateBinder
): number {
  // Section weights (must sum to 100)
  const weights: Partial<Record<BinderSectionType, number>> = {
    licensure: 30,
    housing_categories: 20,
    local: 20,
    fha: 15,
    operational: 10,
    general: 5,
  };

  let totalScore = 0;
  let totalWeight = 0;

  // Compare each section type
  for (const [sectionType, weight] of Object.entries(weights)) {
    const sectionA = binderA.sections.find(s => s.sectionType === sectionType);
    const sectionB = binderB.sections.find(s => s.sectionType === sectionType);

    if (sectionA && sectionB) {
      const similarity = calculateTextSimilarity(sectionA.content, sectionB.content);
      totalScore += similarity * weight;
      totalWeight += weight;
    } else if (sectionA || sectionB) {
      // One has the section, the other doesn't - 0% similarity for this section
      totalWeight += weight;
    }
  }

  return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
}

/**
 * Calculate average similarity across multiple binders
 */
export function calculateMultiBinderSimilarity(
  binders: ParsedStateBinder[]
): { average: number; pairwise: Array<{ stateA: StateCode; stateB: StateCode; score: number }> } {
  if (binders.length < 2) return { average: 100, pairwise: [] };

  const pairwise: Array<{ stateA: StateCode; stateB: StateCode; score: number }> = [];
  let totalScore = 0;
  let pairCount = 0;

  // Compare all pairs
  for (let i = 0; i < binders.length; i++) {
    for (let j = i + 1; j < binders.length; j++) {
      const score = calculateBinderSimilarity(binders[i], binders[j]);
      pairwise.push({
        stateA: binders[i].stateCode,
        stateB: binders[j].stateCode,
        score,
      });
      totalScore += score;
      pairCount++;
    }
  }

  return {
    average: pairCount > 0 ? Math.round(totalScore / pairCount) : 100,
    pairwise,
  };
}

// ============================================================================
// DIFFERENCE DETECTION
// ============================================================================

/**
 * Generate human-readable key differences between binders
 */
export function generateKeyDifferences(
  binders: ParsedStateBinder[]
): string[] {
  if (binders.length < 2) return [];

  const differences: string[] = [];

  // Compare thresholds across all binders
  const thresholdDiffs = compareThresholds(binders);
  differences.push(...thresholdDiffs);

  // Find sections unique to certain states
  const uniqueSections = findUniqueSections(binders);
  differences.push(...uniqueSections);

  // Compare key points
  const keyPointDiffs = compareKeyPoints(binders);
  differences.push(...keyPointDiffs.slice(0, 3)); // Limit to top 3

  return differences.slice(0, 5); // Max 5 key differences
}

/**
 * Compare numeric thresholds across binders
 */
function compareThresholds(binders: ParsedStateBinder[]): string[] {
  const differences: string[] = [];
  const thresholdMap = new Map<string, Map<StateCode, string | number>>();

  // Collect all thresholds
  for (const binder of binders) {
    for (const section of binder.sections) {
      if (section.thresholds) {
        for (const [key, value] of Object.entries(section.thresholds)) {
          if (!thresholdMap.has(key)) {
            thresholdMap.set(key, new Map());
          }
          thresholdMap.get(key)!.set(binder.stateCode, value);
        }
      }
    }
  }

  // Find differences
  for (const [key, stateValues] of thresholdMap) {
    const values = Array.from(stateValues.values());
    const uniqueValues = new Set(values);

    if (uniqueValues.size > 1) {
      // Format the difference
      const parts = Array.from(stateValues.entries()).map(
        ([state, value]) => `${state}: ${value}`
      );

      const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      differences.push(`${label} varies - ${parts.join(', ')}`);
    }
  }

  return differences;
}

/**
 * Find sections that are unique to certain states
 */
function findUniqueSections(binders: ParsedStateBinder[]): string[] {
  const differences: string[] = [];
  const sectionPresence = new Map<BinderSectionType, Set<StateCode>>();

  // Track which states have which sections
  for (const binder of binders) {
    for (const section of binder.sections) {
      if (!sectionPresence.has(section.sectionType)) {
        sectionPresence.set(section.sectionType, new Set());
      }
      sectionPresence.get(section.sectionType)!.add(binder.stateCode);
    }
  }

  // Find sections not present in all states
  const allStates = new Set(binders.map(b => b.stateCode));
  for (const [sectionType, states] of sectionPresence) {
    if (states.size < allStates.size && states.size > 0) {
      const missingStates = Array.from(allStates).filter(s => !states.has(s));
      differences.push(
        `${formatSectionType(sectionType)} details only available for ${Array.from(states).join(', ')}`
      );
    }
  }

  return differences;
}

/**
 * Compare key points between binders
 */
function compareKeyPoints(binders: ParsedStateBinder[]): string[] {
  const differences: string[] = [];

  // Focus on licensure and housing_categories sections
  const importantSections: BinderSectionType[] = ['licensure', 'housing_categories'];

  for (const sectionType of importantSections) {
    const sectionsByState = new Map<StateCode, ParsedBinderSection>();

    for (const binder of binders) {
      const section = binder.sections.find(s => s.sectionType === sectionType);
      if (section) {
        sectionsByState.set(binder.stateCode, section);
      }
    }

    // Compare key point counts
    if (sectionsByState.size > 1) {
      const entries = Array.from(sectionsByState.entries());
      const keyPointCounts = entries.map(([state, section]) => ({
        state,
        count: section.keyPoints.length,
      }));

      const minCount = Math.min(...keyPointCounts.map(k => k.count));
      const maxCount = Math.max(...keyPointCounts.map(k => k.count));

      if (maxCount - minCount > 3) {
        const maxState = keyPointCounts.find(k => k.count === maxCount);
        const minState = keyPointCounts.find(k => k.count === minCount);
        differences.push(
          `${formatSectionType(sectionType)}: ${maxState?.state} has ${maxCount} requirements vs ${minState?.state}'s ${minCount}`
        );
      }
    }
  }

  return differences;
}

// ============================================================================
// CONVERSION TO UI FORMAT
// ============================================================================

/**
 * Convert ParsedBinderSection to ComparisonSection for UI
 */
export function toComparisonSection(
  parsed: ParsedBinderSection,
  otherBinders: ParsedStateBinder[],
  currentStateCode: StateCode
): ComparisonSection {
  // Determine risk level based on content
  const riskLevel = determineRiskLevel(parsed);

  // Find differences compared to other states
  const differences = findSectionDifferences(parsed, otherBinders, currentStateCode);

  return {
    section_type: parsed.sectionType,
    content_summary: parsed.content.slice(0, 500) + (parsed.content.length > 500 ? '...' : ''),
    key_requirements: parsed.keyPoints,
    risk_level: riskLevel,
    differences,
  };
}

/**
 * Determine risk level based on section content
 */
function determineRiskLevel(section: ParsedBinderSection): 'low' | 'medium' | 'high' {
  const content = section.content.toLowerCase();

  // High risk indicators
  const highRiskPatterns = ['must', 'required', 'mandatory', 'violation', 'penalty', 'fine'];
  if (highRiskPatterns.some(p => content.includes(p))) {
    return 'high';
  }

  // Medium risk indicators
  const mediumRiskPatterns = ['should', 'recommended', 'may require', 'consult'];
  if (mediumRiskPatterns.some(p => content.includes(p))) {
    return 'medium';
  }

  return 'low';
}

/**
 * Find specific differences for a section compared to other binders
 */
function findSectionDifferences(
  section: ParsedBinderSection,
  otherBinders: ParsedStateBinder[],
  currentStateCode: StateCode
): string[] {
  const differences: string[] = [];

  for (const binder of otherBinders) {
    if (binder.stateCode === currentStateCode) continue;

    const otherSection = binder.sections.find(s => s.sectionType === section.sectionType);

    if (!otherSection) {
      differences.push(`Not addressed in ${binder.stateCode}`);
    } else {
      // Compare thresholds
      if (section.thresholds && otherSection.thresholds) {
        for (const [key, value] of Object.entries(section.thresholds)) {
          const otherValue = otherSection.thresholds[key];
          if (otherValue !== undefined && otherValue !== value) {
            differences.push(
              `${formatThresholdKey(key)}: ${currentStateCode} uses ${value}, ${binder.stateCode} uses ${otherValue}`
            );
          }
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
 * Normalize text for comparison
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Format section type for display
 */
function formatSectionType(sectionType: BinderSectionType): string {
  const labels: Record<BinderSectionType, string> = {
    model_definition: 'Model Definition',
    licensure: 'State Licensure',
    housing_categories: 'Housing Categories',
    local: 'Local Rules',
    fha: 'FHA & Fair Housing',
    operational: 'Operational Classification',
    notes: 'Notes',
    general: 'General',
  };
  return labels[sectionType] || sectionType;
}

/**
 * Format threshold key for display
 */
function formatThresholdKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Parse a state binder from raw data
 */
export function parseStateBinder(
  stateCode: StateCode,
  stateName: string,
  content: string
): ParsedStateBinder {
  return {
    stateCode,
    stateName,
    sections: extractSections(content, stateCode, stateName),
    rawContent: content,
  };
}

export default {
  extractSections,
  calculateTextSimilarity,
  calculateBinderSimilarity,
  calculateMultiBinderSimilarity,
  generateKeyDifferences,
  toComparisonSection,
  parseStateBinder,
};
