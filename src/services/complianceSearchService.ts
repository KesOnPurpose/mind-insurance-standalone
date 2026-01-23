// ============================================================================
// COMPLIANCE SEARCH SERVICE
// ============================================================================
// Searches state compliance binders for compliance-specific documents.
// Queries the state_compliance_binders table which contains curated compliance
// documentation imported from state-specific PDFs.
// ============================================================================

import { supabase } from '@/integrations/supabase/client';
import type {
  ComplianceSearchFilters,
  ComplianceSearchResult,
  ComplianceSearchResponse,
  StateCode,
  COMPLIANCE_SYNONYMS,
  BinderSectionType,
} from '@/types/compliance';

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_MATCH_COUNT = 10;
// Lower threshold to return more results - users expect Google-like fuzzy matching
const SIMILARITY_THRESHOLD = 0.35;

// Compliance-specific synonyms for better matching
const SEARCH_SYNONYMS: Record<string, string[]> = {
  'license': ['licensure', 'permit', 'certification', 'licensed', 'licensing'],
  'trigger': ['requirement', 'threshold', 'activate', 'qualify', 'requires'],
  'meals': ['food', 'nutrition', 'dietary', 'feeding', 'meal service'],
  'staff': ['staffing', 'personnel', 'caregiver', 'employee', 'attendant'],
  'elderly': ['senior', 'aged', 'geriatric', 'older adult', 'aging'],
  'disabled': ['disability', 'handicapped', 'impairment', 'disabilities'],
  'mental': ['psychiatric', 'psychological', 'behavioral health', 'mental health'],
  'adl': ['activities of daily living', 'personal care', 'bathing', 'dressing', 'toileting'],
  'supervision': ['oversight', 'monitoring', 'assistance', 'supervised'],
  'resident': ['occupant', 'tenant', 'client', 'patient', 'residents'],
  'facility': ['home', 'house', 'residence', 'establishment'],
  'zoning': ['land use', 'permitted use', 'zone', 'zoned'],
  'occupancy': ['capacity', 'maximum residents', 'bed count', 'beds'],
  'fha': ['fair housing', 'discrimination', 'reasonable accommodation'],
  'group home': ['grouphome', 'group-home', 'shared living', 'congregate'],
};

// Map section types to metadata categories
const SECTION_TO_CATEGORY: Record<BinderSectionType, string[]> = {
  model_definition: ['model', 'definition', 'overview'],
  licensure: ['licensing', 'licensure', 'permit', 'certification', 'regulated'],
  housing_categories: ['housing', 'rooming', 'boarding', 'categories'],
  local: ['local', 'zoning', 'ordinance', 'municipal', 'county'],
  fha: ['fair housing', 'fha', 'discrimination', 'protected'],
  operational: ['operational', 'classification', 'services', 'adl'],
  notes: [],
  general: [],
};

// ============================================================================
// SEARCH PARAMS TYPE (for hook compatibility)
// ============================================================================

export interface ComplianceSearchParams {
  query: string;
  state?: string;
  sectionType?: string;
  matchCount?: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Expand query with synonyms for better semantic matching
 */
function expandQueryWithSynonyms(query: string): string {
  let expandedQuery = query.toLowerCase();

  for (const [term, synonyms] of Object.entries(SEARCH_SYNONYMS)) {
    if (expandedQuery.includes(term)) {
      // Add first 2 synonyms to query for expansion
      const expansions = synonyms.slice(0, 2).join(' ');
      expandedQuery = `${expandedQuery} ${expansions}`;
    }
  }

  return expandedQuery;
}


/**
 * Extract a title from content (first line or first 50 characters)
 */
function extractTitle(content: string): string {
  const firstLine = content.split('\n')[0].trim();
  if (firstLine.length > 0 && firstLine.length <= 100) {
    return firstLine;
  }
  return content.substring(0, 50) + (content.length > 50 ? '...' : '');
}

// ============================================================================
// MAIN SEARCH FUNCTIONS
// ============================================================================

/**
 * Search compliance documents using keyword search on state_compliance_binders
 * Queries the curated state compliance binders for accurate compliance information
 */
export async function searchCompliance(
  query: string,
  filters: ComplianceSearchFilters = {},
  matchCount: number = DEFAULT_MATCH_COUNT
): Promise<ComplianceSearchResponse> {
  try {
    // Expand query with synonyms for better matching
    const expandedQuery = expandQueryWithSynonyms(query);

    // Search state_compliance_binders using keyword search
    const results = await keywordSearch(query, filters, matchCount);

    // Apply additional client-side filters if needed
    let filteredResults = results;

    if (filters.section_types && filters.section_types.length > 0) {
      filteredResults = filteredResults.filter((result) => {
        // Check if result's section type matches any of the filter types
        const resultSection = result.section_type?.toLowerCase() || '';
        return filters.section_types!.some((filterType) => {
          const categories = SECTION_TO_CATEGORY[filterType] || [];
          return (
            resultSection === filterType ||
            categories.some((cat) => resultSection.includes(cat))
          );
        });
      });
    }

    return {
      results: filteredResults,
      total_count: filteredResults.length,
      query: query,
      filters_applied: filters,
    };
  } catch (error) {
    console.error('Compliance search error:', error);
    throw error;
  }
}

/**
 * Search compliance documents by state only (quick filter)
 * Queries state_compliance_binders table by state_code
 */
export async function searchByState(
  stateCode: StateCode,
  limit: number = 20
): Promise<ComplianceSearchResult[]> {
  try {
    const { data, error } = await supabase
      .from('state_compliance_binders')
      .select('id, state_code, state_name, title, content, effective_date, last_updated, word_count, metadata')
      .eq('state_code', stateCode)
      .limit(limit);

    if (error) {
      console.error('Search by state error:', error);
      return [];
    }

    return (data || []).map((binder) => ({
      id: binder.id,
      content: binder.content?.substring(0, 500) || '',
      title: binder.title || `${binder.state_name} Compliance Binder`,
      state_code: binder.state_code,
      similarity_score: 1.0, // Direct match, max score
      metadata: binder.metadata || {},
    }));
  } catch (error) {
    console.error('Search by state error:', error);
    return [];
  }
}

/**
 * Get all available states in the compliance database
 * Queries state_compliance_binders table for available state codes
 */
export async function getAvailableStates(): Promise<StateCode[]> {
  try {
    const { data, error } = await supabase
      .from('state_compliance_binders')
      .select('state_code')
      .order('state_code');

    if (error) {
      console.error('Get states error:', error);
      return [];
    }

    // Extract unique state codes
    const statesSet = new Set<StateCode>();
    (data || []).forEach((binder: { state_code: string }) => {
      statesSet.add(binder.state_code as StateCode);
    });

    return Array.from(statesSet).sort();
  } catch (error) {
    console.error('Get available states error:', error);
    return [];
  }
}

/**
 * Get binder by ID for saving to user binder
 */
export async function getChunkById(
  binderId: string
): Promise<ComplianceSearchResult | null> {
  try {
    const { data, error } = await supabase
      .from('state_compliance_binders')
      .select('id, state_code, state_name, title, content, effective_date, last_updated, word_count, metadata')
      .eq('id', binderId)
      .single();

    if (error) {
      console.error('Get binder error:', error);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      content: data.content?.substring(0, 500) || '',
      title: data.title || `${data.state_name} Compliance Binder`,
      state_code: data.state_code,
      similarity_score: 1.0,
      metadata: data.metadata || {},
    };
  } catch (error) {
    console.error('Get binder by ID error:', error);
    return null;
  }
}

/**
 * Get quick answers for common compliance questions
 */
export async function getQuickAnswer(
  question: string,
  stateCode?: StateCode
): Promise<{
  answer: string;
  sources: ComplianceSearchResult[];
} | null> {
  try {
    // Search for relevant chunks
    const searchResult = await searchCompliance(question, { state_code: stateCode }, 3);

    if (searchResult.results.length === 0) {
      return null;
    }

    // For now, return the top result as the quick answer
    // In the future, this could use Claude to synthesize an answer
    const topResult = searchResult.results[0];

    return {
      answer: topResult.content.substring(0, 500) + '...',
      sources: searchResult.results,
    };
  } catch (error) {
    console.error('Quick answer error:', error);
    return null;
  }
}

// ============================================================================
// KEYWORD SEARCH FALLBACK
// ============================================================================

/**
 * Keyword search on state_compliance_binders table
 * Searches content column for matching compliance documents
 */
export async function keywordSearch(
  query: string,
  filters: ComplianceSearchFilters = {},
  limit: number = DEFAULT_MATCH_COUNT
): Promise<ComplianceSearchResult[]> {
  try {
    // Clean search terms
    const searchTerms = query
      .toLowerCase()
      .split(/\s+/)
      .filter(term => term.length > 2);

    // If no valid search terms, return empty
    if (searchTerms.length === 0) {
      return [];
    }

    // Build query on state_compliance_binders table
    let queryBuilder = supabase
      .from('state_compliance_binders')
      .select('id, state_code, state_name, title, content, effective_date, last_updated, word_count, metadata')
      .ilike('content', `%${searchTerms[0]}%`);

    // Apply state filter if provided
    if (filters.state_code) {
      queryBuilder = queryBuilder.eq('state_code', filters.state_code);
    }

    queryBuilder = queryBuilder.limit(limit);

    const { data, error } = await queryBuilder;

    if (error) {
      console.error('Keyword search error:', error);
      return [];
    }

    // Map results and extract relevant snippets from content
    return (data || []).map((binder) => {
      // Find the relevant snippet around the search term
      const content = binder.content || '';
      const lowerContent = content.toLowerCase();
      const termIndex = lowerContent.indexOf(searchTerms[0]);

      // Extract a 500 character snippet around the search term
      const snippetStart = Math.max(0, termIndex - 200);
      const snippetEnd = Math.min(content.length, termIndex + 300);
      const snippet = content.substring(snippetStart, snippetEnd);

      return {
        id: binder.id,
        content: snippet.trim(),
        title: binder.title || `${binder.state_name} Compliance Binder`,
        state_code: binder.state_code,
        section_type: undefined,
        similarity_score: 0.8, // Assign high score for keyword matches in compliance binders
        metadata: binder.metadata || {},
        source_url: undefined,
        regulation_code: undefined,
      };
    });
  } catch (error) {
    console.error('Keyword search error:', error);
    return [];
  }
}

/**
 * Simple ilike search as last resort fallback
 * Uses basic pattern matching on content column of state_compliance_binders
 */
async function ilikeSearch(
  query: string,
  filters: ComplianceSearchFilters = {},
  limit: number = DEFAULT_MATCH_COUNT
): Promise<ComplianceSearchResult[]> {
  try {
    // Build ilike pattern for each word
    const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    if (words.length === 0) return [];

    let queryBuilder = supabase
      .from('state_compliance_binders')
      .select('id, state_code, state_name, title, content, metadata')
      .limit(limit);

    // Apply ilike for the first significant word
    queryBuilder = queryBuilder.ilike('content', `%${words[0]}%`);

    // Apply state filter if provided
    if (filters.state_code) {
      queryBuilder = queryBuilder.eq('state_code', filters.state_code);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      console.error('ilike search error:', error);
      return [];
    }

    return (data || []).map((binder) => ({
      id: binder.id,
      content: binder.content?.substring(0, 500) || '',
      title: binder.title || `${binder.state_name} Compliance Binder`,
      state_code: binder.state_code,
      similarity_score: 0.5, // Lower score for ilike matches
      metadata: binder.metadata || {},
    }));
  } catch (error) {
    console.error('ilike search error:', error);
    return [];
  }
}

// ============================================================================
// SEARCH SUGGESTIONS
// ============================================================================

/**
 * Get search suggestions based on partial query
 */
export async function getSearchSuggestions(
  partialQuery: string,
  stateCode?: StateCode
): Promise<string[]> {
  // Common compliance search patterns
  const commonPatterns = [
    'What triggers licensure in {state}?',
    'Can I provide meals in {state}?',
    'Staffing requirements for {state}',
    'Fair Housing Act protections',
    'Zoning requirements for group homes',
    'Activities of daily living definition',
    'Maximum occupancy limits',
    'Business license requirements',
    'Boarding house vs group home',
    'Personal care services definition',
  ];

  const query = partialQuery.toLowerCase();
  const suggestions: string[] = [];

  // Find matching patterns
  for (const pattern of commonPatterns) {
    const filledPattern = stateCode
      ? pattern.replace('{state}', stateCode)
      : pattern.replace(' in {state}', '').replace(' for {state}', '');

    if (filledPattern.toLowerCase().includes(query)) {
      suggestions.push(filledPattern);
    }
  }

  // Add synonym-based suggestions
  for (const [term, synonyms] of Object.entries(SEARCH_SYNONYMS)) {
    if (query.includes(term)) {
      suggestions.push(`${partialQuery} ${synonyms[0]}`);
    }
  }

  return suggestions.slice(0, 5);
}

// ============================================================================
// POPULAR SEARCHES & ANALYTICS
// ============================================================================

interface PopularSearch {
  query: string;
  count: number;
  state?: StateCode;
}

/**
 * Get popular searches, optionally filtered by state
 */
export async function getPopularSearches(
  stateCode?: StateCode,
  limit: number = 5
): Promise<PopularSearch[]> {
  // For now, return static popular searches
  // In production, this would query a search_analytics table
  const popularSearches: PopularSearch[] = [
    { query: 'What triggers licensure?', count: 245 },
    { query: 'Fair Housing Act protections', count: 198 },
    { query: 'Maximum occupancy limits', count: 176 },
    { query: 'Staffing requirements', count: 154 },
    { query: 'Activities of daily living', count: 142 },
    { query: 'Zoning requirements', count: 128 },
    { query: 'Business license requirements', count: 115 },
    { query: 'Personal care definition', count: 98 },
  ];

  // If state is provided, add state-specific popular searches
  if (stateCode) {
    return popularSearches
      .map((s) => ({
        ...s,
        query: s.query.includes('?')
          ? s.query.replace('?', ` in ${stateCode}?`)
          : `${s.query} in ${stateCode}`,
        state: stateCode,
      }))
      .slice(0, limit);
  }

  return popularSearches.slice(0, limit);
}

/**
 * Increment search count for analytics
 * In production, this would update a search_analytics table
 */
export async function incrementSearchCount(
  query: string,
  stateCode?: StateCode
): Promise<void> {
  // TODO: Implement search analytics tracking
  // For now, just log the search
  console.log(`[Search Analytics] Query: "${query}"${stateCode ? ` State: ${stateCode}` : ''}`);
}

// ============================================================================
// EXPORT DEFAULT SEARCH FUNCTION
// ============================================================================

export default {
  searchCompliance,
  searchByState,
  getAvailableStates,
  getChunkById,
  getQuickAnswer,
  keywordSearch,
  getSearchSuggestions,
};
