// ============================================================================
// COMPLIANCE HUB TYPE DEFINITIONS
// ============================================================================
// Types for the Digital Compliance Binder, Search, and Assessment features
// ============================================================================

// ============================================================================
// STATE AND SECTION TYPES
// ============================================================================

export type StateCode =
  | 'AL' | 'AK' | 'AZ' | 'AR' | 'CA' | 'CO' | 'CT' | 'DE' | 'FL' | 'GA'
  | 'HI' | 'ID' | 'IL' | 'IN' | 'IA' | 'KS' | 'KY' | 'LA' | 'ME' | 'MD'
  | 'MA' | 'MI' | 'MN' | 'MS' | 'MO' | 'MT' | 'NE' | 'NV' | 'NH' | 'NJ'
  | 'NM' | 'NY' | 'NC' | 'ND' | 'OH' | 'OK' | 'OR' | 'PA' | 'RI' | 'SC'
  | 'SD' | 'TN' | 'TX' | 'UT' | 'VT' | 'VA' | 'WA' | 'WV' | 'WI' | 'WY'
  | 'DC';

export type BinderSectionType =
  | 'model_definition'  // Section 0: Housing model definition
  | 'licensure'         // Section 1.1: State licensure requirements
  | 'housing_categories' // Section 1.2: State housing categories
  | 'local'             // Section 1.3: Local rules (zoning, occupancy, permits)
  | 'fha'               // Fair Housing Act protections
  | 'operational'       // Section 1.4: Operational classification
  | 'notes'             // User notes and interpretations
  | 'general';          // Other/general items

export type DocumentType =
  | 'license'
  | 'permit'
  | 'insurance'
  | 'lease'
  | 'inspection'
  | 'certificate'
  | 'zoning'
  | 'fire_safety'
  | 'background_check'
  | 'other';

export type AssessmentConclusion =
  | 'not_subject'      // Model is NOT subject to this requirement
  | 'may_be_subject'   // Model MAY be subject (needs review)
  | 'subject'          // Model IS subject to this requirement
  | 'needs_review'     // Needs professional review
  | 'n_a';             // Not applicable

export type AssessmentDetermination =
  | 'not_started'
  | 'pending'
  | 'proceed'          // Can proceed with confidence
  | 'address_gaps';    // Must address gaps before proceeding

export type AssessmentSectionStatus =
  | 'not_started'
  | 'in_progress'
  | 'complete'
  | 'skipped';

// ============================================================================
// COMPLIANCE BINDER TYPES
// ============================================================================

export interface ComplianceBinder {
  id: string;
  user_id: string;
  property_id?: string | null;
  name: string;
  state_code: StateCode;
  city?: string | null;
  county?: string | null;
  model_definition?: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
  // Computed fields (joined from other tables)
  item_count?: number;
  document_count?: number;
  assessment_status?: AssessmentDetermination;
}

export interface BinderItem {
  id: string;
  binder_id: string;
  chunk_id?: string | null;
  chunk_content: string;
  section_type: BinderSectionType;
  title?: string | null;
  user_notes?: string | null;
  source_url?: string | null;
  regulation_code?: string | null;
  sort_order: number;
  is_starred: boolean;
  created_at: string;
  updated_at: string;
}

export interface BinderDocument {
  id: string;
  binder_id: string;
  document_type: DocumentType;
  file_name: string;
  file_url: string;
  storage_path: string;
  file_size?: number | null;
  mime_type?: string | null;
  description?: string | null;
  expires_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface BinderShareLink {
  id: string;
  binder_id: string;
  share_token: string;
  permissions: ShareLinkPermissions;
  expires_at?: string | null;
  is_active: boolean;
  access_count: number;
  created_at: string;
  last_accessed_at?: string | null;
}

export interface ShareLinkPermissions {
  view_sections: boolean;
  view_documents: boolean;
}

// ============================================================================
// COMPLIANCE SEARCH TYPES
// ============================================================================

export interface ComplianceSearchFilters {
  state_code?: StateCode;
  section_types?: BinderSectionType[];
  priority?: 'high' | 'medium' | 'low';
  populations?: string[];
  keywords?: string[];
}

export interface ComplianceSearchResult {
  id: string;
  content: string;
  title?: string;
  state_code?: string;
  section_type?: string;
  similarity_score: number;
  metadata?: Record<string, unknown>;
  // Additional fields from gh_training_chunks
  source_url?: string;
  regulation_code?: string;
}

export interface ComplianceSearchResponse {
  results: ComplianceSearchResult[];
  total_count: number;
  query: string;
  filters_applied: ComplianceSearchFilters;
}

// Quick answer for common questions
export interface QuickAnswer {
  question_pattern: string;
  answer_summary: string;
  source_chunk_ids: string[];
  confidence: number;
}

// ============================================================================
// COMPLIANCE ASSESSMENT TYPES (Workbook Digitization)
// ============================================================================

export interface ComplianceAssessment {
  id: string;
  user_id: string;
  binder_id?: string | null;
  state_code: StateCode;
  model_definition?: string | null;
  section_progress: SectionProgress;
  final_determination: AssessmentDetermination;
  determination_notes?: string | null;
  started_at: string;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
  // Computed fields
  completion_percentage?: number;
  findings_count?: number;
}

export interface SectionProgress {
  [sectionId: string]: AssessmentSectionStatus;
}

export interface ComplianceFinding {
  id: string;
  assessment_id: string;
  section_id: string;
  research_url?: string | null;
  pasted_language?: string | null;
  user_interpretation?: string | null;
  conclusion?: AssessmentConclusion | null;
  is_flagged: boolean;
  auto_saved_to_binder: boolean;
  created_at: string;
  updated_at: string;
}

// Assessment section configuration
export interface AssessmentSectionConfig {
  id: string;
  title: string;
  description: string;
  instructions: string;
  research_prompt?: string;
  state_agency_url_template?: string;
  required: boolean;
  order: number;
  subsections?: AssessmentSubsectionConfig[];
}

export interface AssessmentSubsectionConfig {
  id: string;
  title: string;
  description: string;
  help_text?: string;
}

// ============================================================================
// STATE COMPARISON TYPES
// ============================================================================

export interface SavedComparison {
  id: string;
  user_id: string;
  name: string;
  state_codes: StateCode[];
  sections_compared?: BinderSectionType[];
  comparison_data?: ComparisonData | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ComparisonData {
  states: StateComparisonEntry[];
  generated_at: string;
}

export interface StateComparisonEntry {
  state_code: StateCode;
  state_name: string;
  sections: ComparisonSection[];
  complexity_score?: number;
  summary?: string;
}

export interface ComparisonSection {
  section_type: BinderSectionType;
  content_summary: string;
  key_requirements: string[];
  risk_level: 'low' | 'medium' | 'high';
  differences?: string[];
}

// ============================================================================
// INPUT/OUTPUT TYPES FOR SERVICES
// ============================================================================

export interface CreateBinderInput {
  name?: string;
  state_code: StateCode;
  city?: string;
  county?: string;
  model_definition?: string;
  property_id?: string;
  is_primary?: boolean;
}

export interface UpdateBinderInput {
  name?: string;
  city?: string;
  county?: string;
  model_definition?: string;
  property_id?: string;
  is_primary?: boolean;
}

export interface AddBinderItemInput {
  binder_id: string;
  chunk_id?: string;
  chunk_content: string;
  section_type: BinderSectionType;
  title?: string;
  user_notes?: string;
  source_url?: string;
  regulation_code?: string;
}

export interface UpdateBinderItemInput {
  title?: string;
  user_notes?: string;
  section_type?: BinderSectionType;
  sort_order?: number;
  is_starred?: boolean;
}

export interface UploadDocumentInput {
  binder_id: string;
  file: File;
  document_type: DocumentType;
  description?: string;
  expires_at?: string;
}

export interface CreateShareLinkInput {
  binder_id: string;
  permissions?: ShareLinkPermissions;
  expires_at?: string;
}

export interface CreateAssessmentInput {
  state_code: StateCode;
  binder_id?: string;
  model_definition?: string;
}

export interface SaveFindingInput {
  assessment_id: string;
  section_id: string;
  research_url?: string;
  pasted_language?: string;
  user_interpretation?: string;
  conclusion?: AssessmentConclusion;
}

// ============================================================================
// PDF EXPORT TYPES
// ============================================================================

export interface BinderExportOptions {
  include_sections: BinderSectionType[];
  include_documents: boolean;
  include_notes: boolean;
  include_timestamps: boolean;
  header_text?: string;
  footer_text?: string;
}

export interface BinderExportData {
  binder: ComplianceBinder;
  items: BinderItem[];
  documents?: BinderDocument[];
  generated_at: string;
  options: BinderExportOptions;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const STATE_NAMES: Record<StateCode, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  DC: 'District of Columbia'
};

// Array format for dropdown selects
export const US_STATES: Array<{ code: StateCode; name: string }> = (
  Object.entries(STATE_NAMES) as Array<[StateCode, string]>
).map(([code, name]) => ({ code, name })).sort((a, b) => a.name.localeCompare(b.name));

export const SECTION_TYPE_LABELS: Record<BinderSectionType, string> = {
  model_definition: 'Model Definition',
  licensure: 'State Licensure',
  housing_categories: 'Housing Categories',
  local: 'Local Rules',
  fha: 'FHA & Fair Housing',
  operational: 'Operational Classification',
  notes: 'My Notes',
  general: 'General'
};

export const SECTION_TYPE_DESCRIPTIONS: Record<BinderSectionType, string> = {
  model_definition: 'One-sentence description of your housing model',
  licensure: 'State licensing requirements and thresholds',
  housing_categories: 'Rooming/boarding house classifications',
  local: 'Zoning, occupancy limits, permits, and local ordinances',
  fha: 'Fair Housing Act protections for your populations',
  operational: 'How your features match regulatory categories',
  notes: 'Your interpretations and research notes',
  general: 'Other compliance information'
};

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  license: 'Business License',
  permit: 'Permit',
  insurance: 'Insurance Certificate',
  lease: 'Lease Agreement',
  inspection: 'Inspection Report',
  certificate: 'Certificate',
  zoning: 'Zoning Approval',
  fire_safety: 'Fire Safety Certificate',
  background_check: 'Background Check',
  other: 'Other Document'
};

// Assessment section order based on Phase 1 Workbook
export const ASSESSMENT_SECTIONS: AssessmentSectionConfig[] = [
  {
    id: '0',
    title: 'Model Definition',
    description: 'Define your housing model in one clear sentence',
    instructions: 'Write one sentence that clearly describes what housing service you provide and what you do NOT provide.',
    required: true,
    order: 0
  },
  {
    id: '1.1',
    title: 'State Licensure Review',
    description: 'Research what triggers licensure in your state',
    instructions: 'Find your state\'s licensing authority and identify what activities trigger licensure requirements.',
    state_agency_url_template: 'https://www.google.com/search?q={state}+adult+care+facility+licensing',
    required: true,
    order: 1
  },
  {
    id: '1.2',
    title: 'State Housing Categories',
    description: 'Check if rooming/boarding house rules apply',
    instructions: 'Research your state\'s definitions for rooming houses, boarding houses, and similar categories.',
    required: true,
    order: 2
  },
  {
    id: '1.3',
    title: 'Local Rules',
    description: 'Identify local zoning, occupancy, and permit requirements',
    instructions: 'Research your city/county requirements for occupancy limits, household definitions, zoning, and permits.',
    required: true,
    order: 3,
    subsections: [
      { id: '1.3.1', title: 'Occupancy Limits', description: 'Maximum occupants allowed' },
      { id: '1.3.2', title: 'Household Definition', description: 'Who counts as a household' },
      { id: '1.3.3', title: 'Zoning Requirements', description: 'Use-by-right vs special permit' },
      { id: '1.3.4', title: 'Business Licenses', description: 'Local business license requirements' },
      { id: '1.3.5', title: 'Fire/Safety Codes', description: 'Fire and safety requirements' },
      { id: '1.3.6', title: 'Parking Requirements', description: 'Parking space requirements' }
    ]
  },
  {
    id: '1.4',
    title: 'Operational Classification',
    description: 'Match your model features to regulatory categories',
    instructions: 'Compare your specific operational features against the regulatory thresholds you\'ve identified.',
    required: true,
    order: 4
  },
  {
    id: '1.5',
    title: 'Phase 1 Gate',
    description: 'Determine if you can proceed or need to address gaps',
    instructions: 'Review all findings and determine your final compliance determination.',
    required: true,
    order: 5
  }
];

// Compliance search synonyms for better matching
export const COMPLIANCE_SYNONYMS: Record<string, string[]> = {
  'license': ['licensure', 'permit', 'certification', 'licensed'],
  'trigger': ['requirement', 'threshold', 'activate', 'qualify'],
  'meals': ['food', 'nutrition', 'dietary', 'feeding', 'meal service'],
  'staff': ['staffing', 'personnel', 'caregiver', 'employee', 'attendant'],
  'elderly': ['senior', 'aged', 'geriatric', 'older adult'],
  'disabled': ['disability', 'handicapped', 'impairment'],
  'mental': ['psychiatric', 'psychological', 'behavioral health'],
  'adl': ['activities of daily living', 'personal care', 'bathing', 'dressing', 'toileting'],
  'supervision': ['oversight', 'monitoring', 'assistance'],
  'resident': ['occupant', 'tenant', 'client', 'patient'],
  'facility': ['home', 'house', 'residence', 'establishment'],
  'zoning': ['land use', 'permitted use', 'zone'],
  'occupancy': ['capacity', 'maximum residents', 'bed count'],
  'fha': ['fair housing', 'discrimination', 'reasonable accommodation']
};

// ============================================================================
// STATE COMPLIANCE LIBRARY TYPES
// ============================================================================

export type LibraryCategoryType =
  | 'licensure'           // State licensing requirements
  | 'housing_categories'  // Rooming/boarding house definitions
  | 'zoning'              // Zoning and land use
  | 'occupancy'           // Occupancy limits and household definitions
  | 'fha'                 // Fair Housing Act protections
  | 'fire_safety'         // Fire and safety codes
  | 'business_license'    // Business licensing requirements
  | 'population'          // Population-specific regulations
  | 'ada'                 // ADA accessibility requirements
  | 'general';            // General compliance information

export interface LibraryCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: LibraryCategoryType;
  item_count?: number;
  sort_order: number;
}

export interface LibraryItem {
  id: string;
  category_id: string;
  state_code: StateCode;
  title: string;
  summary: string;
  content: string;
  section_type: BinderSectionType;
  source_url?: string | null;
  regulation_code?: string | null;
  effective_date?: string | null;
  last_updated?: string | null;
  is_featured: boolean;
  is_critical: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
  // Computed/joined
  category?: LibraryCategory;
  is_bookmarked?: boolean;
}

export interface LibraryBookmark {
  id: string;
  user_id: string;
  library_item_id: string;
  notes?: string | null;
  created_at: string;
  // Joined data
  item?: LibraryItem;
}

export interface LibraryFilters {
  state_code?: StateCode;
  category_id?: string;
  category_type?: LibraryCategoryType;
  search_query?: string;
  is_featured?: boolean;
  is_critical?: boolean;
  tags?: string[];
}

export interface LibraryStateOverview {
  state_code: StateCode;
  state_name: string;
  total_items: number;
  categories: {
    category_type: LibraryCategoryType;
    count: number;
  }[];
  critical_items: number;
  last_updated: string;
}

// ============================================================================
// STATE COMPLIANCE BINDER TYPES (Full Document Model)
// ============================================================================
// These types support the new "Full Binder" experience where each state
// has ONE complete, readable document instead of fragmented chunks.
// ============================================================================

export interface StateBinder {
  id: string;
  state_code: StateCode;
  state_name: string;
  title: string;
  content: string;  // Full markdown content (~1,000 words)
  effective_date: string | null;
  last_updated: string;
  word_count: number | null;
  section_headers: BinderSectionHeader[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface BinderSectionHeader {
  id: string;
  title: string;
  level: number;  // Heading level (1, 2, 3, etc.)
}

export interface StateBinderOption {
  state_code: StateCode;
  state_name: string;
  has_binder: boolean;
  last_updated?: string;
  word_count?: number;
}

export interface StateBinderFilters {
  search_query?: string;
}

// ============================================================================
// STATE COMPLIANCE LIBRARY CONSTANTS
// ============================================================================

// Library category definitions with icons
export const LIBRARY_CATEGORIES: Omit<LibraryCategory, 'id' | 'item_count'>[] = [
  {
    name: 'State Licensure',
    description: 'State licensing requirements, thresholds, and exemptions',
    icon: '📋',
    type: 'licensure',
    sort_order: 1,
  },
  {
    name: 'Housing Categories',
    description: 'Rooming house, boarding house, and similar definitions',
    icon: '🏘️',
    type: 'housing_categories',
    sort_order: 2,
  },
  {
    name: 'Zoning & Land Use',
    description: 'Zoning classifications and permitted uses',
    icon: '🗺️',
    type: 'zoning',
    sort_order: 3,
  },
  {
    name: 'Occupancy Limits',
    description: 'Maximum occupancy and household definitions',
    icon: '👥',
    type: 'occupancy',
    sort_order: 4,
  },
  {
    name: 'Fair Housing Act',
    description: 'FHA protections and reasonable accommodation requirements',
    icon: '⚖️',
    type: 'fha',
    sort_order: 5,
  },
  {
    name: 'Fire & Safety',
    description: 'Fire codes, safety requirements, and inspections',
    icon: '🔥',
    type: 'fire_safety',
    sort_order: 6,
  },
  {
    name: 'Business Licensing',
    description: 'Business license and permit requirements',
    icon: '📄',
    type: 'business_license',
    sort_order: 7,
  },
  {
    name: 'Population-Specific',
    description: 'Regulations for specific populations (elderly, disabled, etc.)',
    icon: '🎯',
    type: 'population',
    sort_order: 8,
  },
  {
    name: 'ADA Accessibility',
    description: 'ADA compliance and accessibility requirements',
    icon: '♿',
    type: 'ada',
    sort_order: 9,
  },
];

// ============================================================================
// STATE COMPARISON RESULT TYPES (Apple-Level Redesign)
// ============================================================================

/**
 * Result of comparing multiple state compliance binders
 * Includes similarity scoring and key differences for premium UX
 */
export interface CompareResult {
  /** Array of state comparison entries with real data */
  states: StateComparisonEntry[];
  /** Overall similarity score between states (0-100) */
  similarityScore: number;
  /** Human-readable key differences between states */
  keyDifferences: string[];
  /** Whether there are significant differences worth highlighting */
  hasMajorDifferences: boolean;
  /** Timestamp when comparison was generated */
  comparisonDate: string;
  /** Pairwise similarity scores when comparing 3+ states */
  pairwiseSimilarity?: PairwiseSimilarity[];
}

/**
 * Pairwise similarity between two specific states
 */
export interface PairwiseSimilarity {
  stateA: StateCode;
  stateB: StateCode;
  score: number;
  differences: string[];
}

/**
 * Parsed section from a state binder for comparison
 */
export interface ParsedBinderSection {
  sectionType: BinderSectionType;
  title: string;
  content: string;
  keyPoints: string[];
  thresholds?: Record<string, string | number>;
}

/**
 * Parsed state binder with extracted sections
 */
export interface ParsedStateBinder {
  stateCode: StateCode;
  stateName: string;
  sections: ParsedBinderSection[];
  rawContent: string;
}

/**
 * Section difference detail for highlighting
 */
export interface SectionDiff {
  sectionType: BinderSectionType;
  isIdentical: boolean;
  diffPercentage: number;
  uniqueToStates: StateCode[];
  differences: string[];
}
