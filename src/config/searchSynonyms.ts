/**
 * Search synonym mappings for grouphome industry terminology
 * Bidirectional: searching any term finds all related terms
 */
export const SEARCH_SYNONYMS: Record<string, string[]> = {
  // Population synonyms
  'reentry': ['returning_citizens', 'returning citizens', 'formerly_incarcerated', 'formerly incarcerated', 'ex-offenders', 'ex-offender', 'justice_involved', 'justice involved', 'incarcerated'],
  'returning_citizens': ['reentry', 're-entry', 'formerly_incarcerated', 'formerly incarcerated', 'ex-offenders', 'justice_involved'],
  'returning citizens': ['reentry', 're-entry', 'formerly_incarcerated', 'formerly incarcerated', 'ex-offenders', 'justice_involved'],
  'seniors': ['elderly', 'older_adults', 'older adults', 'aging', 'geriatric', 'aged', 'senior'],
  'elderly': ['seniors', 'senior', 'older_adults', 'older adults', 'aging', 'geriatric', 'aged'],
  'disabled': ['disability', 'disabilities', 'handicapped', 'special_needs', 'special needs', 'ada', 'developmental'],
  'disability': ['disabled', 'disabilities', 'handicapped', 'special_needs', 'special needs', 'ada', 'developmental'],
  'mental_health': ['behavioral_health', 'behavioral health', 'psychiatric', 'mental_illness', 'mental illness', 'psychological', 'mental health'],
  'mental health': ['behavioral_health', 'behavioral health', 'psychiatric', 'mental_illness', 'mental illness', 'psychological', 'mental_health'],
  'veterans': ['veteran', 'military', 'service_members', 'service members', 'va', 'vets', 'armed_forces', 'armed forces'],
  'veteran': ['veterans', 'military', 'service_members', 'service members', 'va', 'vets', 'armed_forces'],
  'ssi': ['social_security', 'social security', 'supplemental_income', 'supplemental income', 'disability_benefits', 'disability benefits', 'low income', 'low-income'],

  // Business/category synonyms
  'marketing': ['advertising', 'advertisement', 'promotion', 'outreach', 'branding', 'leads', 'referrals', 'referral'],
  'advertising': ['marketing', 'advertisement', 'promotion', 'outreach', 'branding', 'ads', 'ad'],
  'licensing': ['permits', 'permit', 'certification', 'certifications', 'compliance', 'regulations', 'licensed', 'license'],
  'license': ['licensing', 'permits', 'permit', 'certification', 'certifications', 'compliance', 'regulations', 'licensed'],
  'property': ['real_estate', 'real estate', 'housing', 'building', 'home', 'house', 'residence', 'properties'],
  'real estate': ['property', 'properties', 'housing', 'building', 'home', 'house', 'residence', 'real_estate'],
  'staffing': ['hiring', 'employees', 'employee', 'personnel', 'workforce', 'staff', 'caregiver', 'caregivers', 'hire'],
  'hiring': ['staffing', 'employees', 'employee', 'personnel', 'workforce', 'staff', 'caregiver', 'caregivers', 'hire', 'recruit'],
  'finance': ['funding', 'budget', 'capital', 'money', 'costs', 'cost', 'financial', 'investment', 'financing'],
  'funding': ['finance', 'financial', 'budget', 'capital', 'money', 'costs', 'investment', 'grant', 'grants'],
  'legal': ['attorney', 'lawyer', 'contracts', 'contract', 'compliance', 'law', 'litigation', 'legal'],
  'attorney': ['legal', 'lawyer', 'contracts', 'contract', 'law', 'litigation'],

  // Operations synonyms
  'operations': ['daily_operations', 'daily operations', 'running', 'management', 'managing', 'operate'],
  'inspection': ['inspections', 'audit', 'audits', 'review', 'reviews', 'compliance', 'survey'],
  'safety': ['fire_safety', 'fire safety', 'emergency', 'evacuation', 'security', 'safe'],
  'training': ['train', 'education', 'certification', 'certifications', 'course', 'courses', 'class'],
};

/**
 * Expands a search query to include all synonyms
 * Returns array of terms to search for
 */
export function expandSearchTerms(query: string): string[] {
  const normalizedQuery = query.toLowerCase().trim();
  const terms = new Set<string>([normalizedQuery]);

  // Check each synonym group
  for (const [key, synonyms] of Object.entries(SEARCH_SYNONYMS)) {
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
