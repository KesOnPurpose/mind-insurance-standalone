/**
 * County Compliance Cache Types
 * Purpose: TypeScript interfaces for on-demand county compliance scraping
 * Part of: County-Level Compliance On-Demand Scraping project
 * Database table: county_compliance_cache
 */

// Enum types matching database constraints
export type OccupancyLimitType = 'numerical' | 'per_square_footage' | 'none' | 'unknown';

export type ZoningClassification = 'residential' | 'group_living' | 'lodging' | 'special_use' | 'unknown';

export type ComplianceStatus =
  | 'permitted'
  | 'permitted_with_conditions'
  | 'not_permitted'
  | 'unclear'
  | 'research_needed';

export type DataSource = 'nette_scrape' | 'manual_research' | 'user_contributed';

export type MunicipalCodePlatform = 'Municode' | 'American Legal' | 'eCodes360' | 'Self-hosted' | 'County Website' | 'Unknown';

/**
 * Main County Compliance Cache Interface
 * Matches the database schema exactly
 */
export interface CountyComplianceCache {
  id: string;

  // Location identification
  state_code: string;  // Two-letter state code (e.g., 'GA', 'TX')
  county_name: string; // County name without "County" suffix
  county_fips: string | null;  // 5-digit FIPS code

  // Section 1.3.1: Local Code Source
  municipal_code_url: string | null;
  municipal_code_platform: MunicipalCodePlatform | null;
  code_last_verified: string | null;  // ISO timestamp

  // Section 1.3.2: Occupancy Limits
  occupancy_max_persons: number | null;
  occupancy_unrelated_persons_limit: number | null;
  occupancy_limit_type: OccupancyLimitType | null;
  occupancy_code_language: string | null;
  occupancy_code_section: string | null;

  // Section 1.3.3: Household/Family Definitions
  household_definition_exists: boolean | null;
  household_allows_unrelated: boolean | null;
  household_definition_text: string | null;
  household_code_section: string | null;
  household_uses_or_language: boolean | null;  // TRUE if "or" creates flexibility

  // Section 1.3.4: Zoning Classification
  residential_use_permitted: boolean | null;
  zoning_classification: ZoningClassification | null;
  requires_special_permit: boolean | null;
  zoning_code_language: string | null;
  zoning_code_section: string | null;

  // Section 1.3.5: Local Ordinances/Permits
  requires_registration: boolean | null;
  requires_inspection: boolean | null;
  requires_certificate_of_occupancy: boolean | null;
  requires_fire_marshal_review: boolean | null;
  requires_business_license: boolean | null;
  local_requirements_text: string | null;
  local_requirements_section: string | null;

  // Interpretation Summary
  interpretation_summary: string | null;
  compliance_status: ComplianceStatus | null;

  // Confidence & Quality Scoring
  confidence_score: number | null;  // 0-100

  // Scraping Metadata
  data_source: DataSource;
  scrape_urls: string[] | null;
  scrape_search_terms: string[] | null;
  scrape_raw_content: string | null;

  // Cache Management
  cache_hit_count: number;
  last_accessed_at: string | null;
  cache_expires_at: string | null;
  needs_refresh: boolean;

  // User tracking
  requested_by_user_id: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * County Intent Detection Result
 * Output from the N8n County Intent Classifier node
 */
export interface CountyIntentResult {
  isCountyRequest: boolean;
  stateCode: string | null;
  countyName: string | null;
  topic: CountyComplianceTopic;
  originalMessage: string;
}

export type CountyComplianceTopic =
  | 'occupancy'
  | 'household'
  | 'zoning'
  | 'ordinances'
  | 'general';

/**
 * Cache Check Result
 * Result from checking if county data exists in cache
 */
export interface CacheCheckResult {
  cacheHit: boolean;
  data: CountyComplianceCache | null;
  isFresh: boolean;  // True if not expired
}

/**
 * Data Extraction Result
 * Output from Claude when extracting Section 1.3 data from scraped content
 */
export interface DataExtractionResult {
  // Code source
  municipal_code_url: string | null;
  municipal_code_platform: MunicipalCodePlatform | null;

  // Occupancy
  occupancy_max_persons: number | null;
  occupancy_unrelated_persons_limit: number | null;
  occupancy_limit_type: OccupancyLimitType | null;
  occupancy_code_language: string | null;
  occupancy_code_section: string | null;

  // Household
  household_definition_exists: boolean | null;
  household_allows_unrelated: boolean | null;
  household_definition_text: string | null;
  household_uses_or_language: boolean | null;

  // Zoning
  residential_use_permitted: boolean | null;
  zoning_classification: ZoningClassification | null;
  requires_special_permit: boolean | null;

  // Local requirements
  requires_registration: boolean | null;
  requires_inspection: boolean | null;
  requires_certificate_of_occupancy: boolean | null;

  // Summary
  interpretation_summary: string;
  compliance_status: ComplianceStatus;
  confidence_score: number;
}

/**
 * State Compliance Context
 * Loaded from state_compliance_binders table
 */
export interface StateComplianceContext {
  state_code: string;
  title: string;
  content: string;
  section_headers: string[] | null;
  metadata: Record<string, unknown> | null;
}

/**
 * Scrape Request
 * Parameters for the web scraping node
 */
export interface ScrapeRequest {
  stateCode: string;
  countyName: string;
  topic: CountyComplianceTopic;
  municipalCodeUrl?: string;  // If known
  stateContext?: StateComplianceContext;  // State-level context
}

/**
 * Scrape Result
 * Output from web scraping (Jina Reader or Firecrawl)
 */
export interface ScrapeResult {
  success: boolean;
  content: string | null;
  urls: string[];
  searchTerms: string[];
  error: string | null;
}

/**
 * US State Codes
 * All 50 states plus DC and territories
 */
export const US_STATE_CODES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'DC'  // District of Columbia
] as const;

export type USStateCode = typeof US_STATE_CODES[number];

/**
 * State name to code mapping
 */
export const STATE_NAME_TO_CODE: Record<string, USStateCode> = {
  'alabama': 'AL',
  'alaska': 'AK',
  'arizona': 'AZ',
  'arkansas': 'AR',
  'california': 'CA',
  'colorado': 'CO',
  'connecticut': 'CT',
  'delaware': 'DE',
  'florida': 'FL',
  'georgia': 'GA',
  'hawaii': 'HI',
  'idaho': 'ID',
  'illinois': 'IL',
  'indiana': 'IN',
  'iowa': 'IA',
  'kansas': 'KS',
  'kentucky': 'KY',
  'louisiana': 'LA',
  'maine': 'ME',
  'maryland': 'MD',
  'massachusetts': 'MA',
  'michigan': 'MI',
  'minnesota': 'MN',
  'mississippi': 'MS',
  'missouri': 'MO',
  'montana': 'MT',
  'nebraska': 'NE',
  'nevada': 'NV',
  'new hampshire': 'NH',
  'new jersey': 'NJ',
  'new mexico': 'NM',
  'new york': 'NY',
  'north carolina': 'NC',
  'north dakota': 'ND',
  'ohio': 'OH',
  'oklahoma': 'OK',
  'oregon': 'OR',
  'pennsylvania': 'PA',
  'rhode island': 'RI',
  'south carolina': 'SC',
  'south dakota': 'SD',
  'tennessee': 'TN',
  'texas': 'TX',
  'utah': 'UT',
  'vermont': 'VT',
  'virginia': 'VA',
  'washington': 'WA',
  'west virginia': 'WV',
  'wisconsin': 'WI',
  'wyoming': 'WY',
  'district of columbia': 'DC',
  'washington dc': 'DC',
  'washington d.c.': 'DC',
};

/**
 * Georgia Pilot Counties
 * Used for testing the on-demand scraping system
 */
export const GA_PILOT_COUNTIES = [
  'Fulton',    // Urban (Atlanta) - High complexity
  'Gwinnett',  // Suburban - Medium complexity
  'Chatham',   // Coastal (Savannah) - Medium complexity
  'Lowndes',   // Rural South - Low complexity
  'Floyd',     // Northwest - Low complexity
] as const;

export type GAPilotCounty = typeof GA_PILOT_COUNTIES[number];

/**
 * Known Municipal Code URLs for Georgia
 * Pre-populated to speed up scraping
 */
export const GA_MUNICIPAL_CODE_URLS: Partial<Record<string, string>> = {
  'Fulton': 'https://library.municode.com/ga/fulton_county',
  'Gwinnett': 'https://library.municode.com/ga/gwinnett_county',
  'DeKalb': 'https://library.municode.com/ga/dekalb_county',
  'Cobb': 'https://library.municode.com/ga/cobb_county',
  'Clayton': 'https://library.municode.com/ga/clayton_county',
  'Chatham': 'https://library.municode.com/ga/chatham_county',
  'Lowndes': 'https://library.municode.com/ga/lowndes_county',
  'Floyd': 'https://library.municode.com/ga/floyd_county',
};
