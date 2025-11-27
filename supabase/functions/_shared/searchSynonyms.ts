// ============================================================================
// SEARCH SYNONYMS - UNIFIED DICTIONARY FOR RAG QUERY EXPANSION
// ============================================================================
// Single source of truth for synonym mappings used by Nette AI and MIO
// Enables intelligent search: "reentry" finds "returning_citizens" tactics
// ============================================================================

/**
 * Population synonyms for Nette AI (grouphome industry)
 * Bidirectional: searching any term finds all related terms
 */
export const POPULATION_SYNONYMS: Record<string, string[]> = {
  // Returning citizens / reentry
  'reentry': ['returning_citizens', 'returning citizens', 'formerly_incarcerated', 'formerly incarcerated', 'ex-offenders', 'ex-offender', 'justice_involved', 'justice involved', 'incarcerated'],
  'returning_citizens': ['reentry', 're-entry', 'formerly_incarcerated', 'formerly incarcerated', 'ex-offenders', 'justice_involved'],
  'returning citizens': ['reentry', 're-entry', 'formerly_incarcerated', 'formerly incarcerated', 'ex-offenders', 'justice_involved'],

  // Seniors / elderly
  'seniors': ['elderly', 'older_adults', 'older adults', 'aging', 'geriatric', 'aged', 'senior'],
  'elderly': ['seniors', 'senior', 'older_adults', 'older adults', 'aging', 'geriatric', 'aged'],

  // Disabled / disability
  'disabled': ['disability', 'disabilities', 'handicapped', 'special_needs', 'special needs', 'ada', 'developmental'],
  'disability': ['disabled', 'disabilities', 'handicapped', 'special_needs', 'special needs', 'ada', 'developmental'],

  // Mental health
  'mental_health': ['behavioral_health', 'behavioral health', 'psychiatric', 'mental_illness', 'mental illness', 'psychological', 'mental health'],
  'mental health': ['behavioral_health', 'behavioral health', 'psychiatric', 'mental_illness', 'mental illness', 'psychological', 'mental_health'],

  // Veterans
  'veterans': ['veteran', 'military', 'service_members', 'service members', 'va', 'vets', 'armed_forces', 'armed forces'],
  'veteran': ['veterans', 'military', 'service_members', 'service members', 'va', 'vets', 'armed_forces'],

  // SSI / low income
  'ssi': ['social_security', 'social security', 'supplemental_income', 'supplemental income', 'disability_benefits', 'disability benefits', 'low income', 'low-income'],
};

/**
 * Business/category synonyms for Nette AI
 */
export const BUSINESS_SYNONYMS: Record<string, string[]> = {
  // Marketing
  'marketing': ['advertising', 'advertisement', 'promotion', 'outreach', 'branding', 'leads', 'referrals', 'referral'],
  'advertising': ['marketing', 'advertisement', 'promotion', 'outreach', 'branding', 'ads', 'ad'],

  // Licensing
  'licensing': ['permits', 'permit', 'certification', 'certifications', 'compliance', 'regulations', 'licensed', 'license'],
  'license': ['licensing', 'permits', 'permit', 'certification', 'certifications', 'compliance', 'regulations', 'licensed'],

  // Property
  'property': ['real_estate', 'real estate', 'housing', 'building', 'home', 'house', 'residence', 'properties'],
  'real estate': ['property', 'properties', 'housing', 'building', 'home', 'house', 'residence', 'real_estate'],

  // Staffing
  'staffing': ['hiring', 'employees', 'employee', 'personnel', 'workforce', 'staff', 'caregiver', 'caregivers', 'hire'],
  'hiring': ['staffing', 'employees', 'employee', 'personnel', 'workforce', 'staff', 'caregiver', 'caregivers', 'hire', 'recruit'],

  // Finance
  'finance': ['funding', 'budget', 'capital', 'money', 'costs', 'cost', 'financial', 'investment', 'financing'],
  'funding': ['finance', 'financial', 'budget', 'capital', 'money', 'costs', 'investment', 'grant', 'grants'],

  // Legal
  'legal': ['attorney', 'lawyer', 'contracts', 'contract', 'compliance', 'law', 'litigation'],
  'attorney': ['legal', 'lawyer', 'contracts', 'contract', 'law', 'litigation'],

  // Operations
  'operations': ['daily_operations', 'daily operations', 'running', 'management', 'managing', 'operate'],
  'inspection': ['inspections', 'audit', 'audits', 'review', 'reviews', 'compliance', 'survey'],
  'safety': ['fire_safety', 'fire safety', 'emergency', 'evacuation', 'security', 'safe'],
  'training': ['train', 'education', 'certification', 'certifications', 'course', 'courses', 'class'],
};

/**
 * Behavioral synonyms for MIO (Mind Insurance Oracle)
 * Maps user language to internal pattern categories
 */
export const BEHAVIORAL_SYNONYMS: Record<string, string[]> = {
  // Avoidance patterns
  'procrastination': ['avoidance', 'delay', 'delaying', 'putting_off', 'putting off', 'freeze', 'stuck', 'avoiding', 'postpone', 'postponing'],
  'avoidance': ['procrastination', 'procrastinating', 'delay', 'delaying', 'putting_off', 'putting off', 'avoiding', 'escape', 'running away'],

  // Overwhelm patterns
  'overwhelmed': ['too_much', 'too much', 'drowning', 'shutdown', 'overload', 'paralyzed', 'frozen', 'stressed', 'anxious', 'burnout'],
  'overwhelm': ['overwhelmed', 'too_much', 'drowning', 'shutdown', 'overload', 'paralyzed', 'stressed', 'burnout'],
  'stressed': ['overwhelmed', 'anxiety', 'anxious', 'pressure', 'stressed out', 'tension', 'burnout'],

  // Self-sabotage patterns
  'sabotage': ['self_sabotage', 'self sabotage', 'self_destructive', 'self-destructive', 'undermine', 'collision', 'identity_collision', 'success_sabotage'],
  'self_sabotage': ['sabotage', 'self-sabotage', 'self_destructive', 'undermining', 'collision', 'identity collision'],

  // Stuck patterns
  'stuck': ['blocked', 'frozen', 'paralyzed', 'helpless', 'stalled', 'trapped', 'cant move', "can't move", 'immobilized', 'spinning'],
  'blocked': ['stuck', 'frozen', 'paralyzed', 'stalled', 'trapped', 'barrier', 'obstacle'],

  // Progress patterns
  'breakthrough': ['insight', 'progress', 'momentum', 'shift', 'awakening', 'realization', 'epiphany', 'aha moment', 'clarity'],
  'progress': ['breakthrough', 'momentum', 'moving forward', 'growth', 'improvement', 'advancing', 'winning'],
  'momentum': ['progress', 'breakthrough', 'moving', 'flow', 'energy', 'streak', 'winning'],

  // Pattern recognition
  'pattern': ['habit', 'cycle', 'loop', 'behavior', 'tendency', 'routine', 'recurring', 'repeating', 'same thing'],
  'habit': ['pattern', 'cycle', 'routine', 'behavior', 'tendency', 'automatic'],
  'cycle': ['pattern', 'loop', 'recurring', 'repeating', 'same', 'again'],

  // Identity patterns (Mind Insurance specific)
  'past_prison': ['past prison', 'old identity', 'who I was', 'old self', 'former self', 'past self', 'old me'],
  'success_sabotage': ['success sabotage', 'fear of success', 'almost there', 'close to winning', 'self destruct', 'undermine success'],
  'compass_crisis': ['compass crisis', 'lost direction', 'no direction', 'dont know what I want', "don't know what I want", 'confused about goals'],

  // Emotional states
  'fear': ['afraid', 'scared', 'terrified', 'anxious', 'worry', 'worried', 'nervous'],
  'shame': ['guilt', 'embarrassed', 'embarrassment', 'ashamed', 'regret', 'failure'],
  'anger': ['frustrated', 'frustration', 'angry', 'mad', 'irritated', 'annoyed', 'resentment'],

  // Practice-related
  'practice': ['daily practice', 'protect', 'routine', 'exercise', 'session', 'check-in', 'check in'],
  'trigger': ['triggered', 'activated', 'set off', 'reminded', 'reaction', 'response', 'reset'],
};

/**
 * Combined synonyms for all agents
 */
export const ALL_SYNONYMS: Record<string, string[]> = {
  ...POPULATION_SYNONYMS,
  ...BUSINESS_SYNONYMS,
  ...BEHAVIORAL_SYNONYMS,
};

/**
 * Expands a search query to include all synonyms
 * Returns array of unique terms to search for
 *
 * @param query - The original search query
 * @param synonymDict - Optional: specific synonym dictionary to use (defaults to ALL_SYNONYMS)
 * @returns Array of expanded terms including original query
 */
export function expandSearchTerms(
  query: string,
  synonymDict: Record<string, string[]> = ALL_SYNONYMS
): string[] {
  const normalizedQuery = query.toLowerCase().trim();
  const terms = new Set<string>([normalizedQuery]);

  // Check each synonym group
  for (const [key, synonyms] of Object.entries(synonymDict)) {
    // If query matches key exactly
    if (key === normalizedQuery) {
      terms.add(key);
      synonyms.forEach(s => terms.add(s));
      continue;
    }

    // If query is contained in key or key is contained in query (partial match)
    if (key.includes(normalizedQuery) || normalizedQuery.includes(key)) {
      terms.add(key);
      synonyms.forEach(s => terms.add(s));
    }

    // Check if query matches any synonym
    for (const synonym of synonyms) {
      if (synonym === normalizedQuery || synonym.includes(normalizedQuery) || normalizedQuery.includes(synonym)) {
        terms.add(key);
        synonyms.forEach(s => terms.add(s));
        break;
      }
    }
  }

  return Array.from(terms);
}

/**
 * Expands search terms and formats for PostgreSQL websearch
 * Creates an OR-joined query string
 *
 * @param query - The original search query
 * @param synonymDict - Optional: specific synonym dictionary to use
 * @returns Formatted query string for PostgreSQL textSearch
 */
export function expandForFTS(
  query: string,
  synonymDict: Record<string, string[]> = ALL_SYNONYMS
): string {
  const expandedTerms = expandSearchTerms(query, synonymDict);

  // For PostgreSQL websearch, we can use OR to combine terms
  // Filter out terms with underscores (convert to space version) and duplicates
  const cleanedTerms = expandedTerms
    .map(term => term.replace(/_/g, ' ').trim())
    .filter((term, index, self) => self.indexOf(term) === index)
    .filter(term => term.length > 0);

  // If only one term, return as-is
  if (cleanedTerms.length === 1) {
    return cleanedTerms[0];
  }

  // Join with OR for PostgreSQL websearch
  return cleanedTerms.map(term => `"${term}"`).join(' OR ');
}

/**
 * Get Nette-specific synonyms (populations + business)
 */
export function expandNetteTerms(query: string): string[] {
  const netteDict = { ...POPULATION_SYNONYMS, ...BUSINESS_SYNONYMS };
  return expandSearchTerms(query, netteDict);
}

/**
 * Get MIO-specific synonyms (behavioral patterns)
 */
export function expandMIOTerms(query: string): string[] {
  return expandSearchTerms(query, BEHAVIORAL_SYNONYMS);
}

/**
 * Check if a query contains population-related terms
 */
export function containsPopulationTerm(query: string): boolean {
  const normalizedQuery = query.toLowerCase();
  return Object.keys(POPULATION_SYNONYMS).some(key =>
    normalizedQuery.includes(key.replace(/_/g, ' ')) || normalizedQuery.includes(key)
  );
}

/**
 * Check if a query contains behavioral terms (MIO patterns)
 */
export function containsBehavioralTerm(query: string): boolean {
  const normalizedQuery = query.toLowerCase();
  return Object.keys(BEHAVIORAL_SYNONYMS).some(key =>
    normalizedQuery.includes(key.replace(/_/g, ' ')) || normalizedQuery.includes(key)
  );
}
