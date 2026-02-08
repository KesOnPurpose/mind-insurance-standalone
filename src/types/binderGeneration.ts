/**
 * Binder Generation Types
 * Purpose: TypeScript interfaces for the binder generation pipeline
 * Transforms county_compliance_cache data into local_compliance_binders
 */

import type { StateCode, LocalBinder, BinderSectionHeader } from './compliance';
import type { CountyComplianceCache, ComplianceStatus } from './countyCompliance';

// ============================================================================
// GENERATION PARAMETERS
// ============================================================================

/**
 * Parameters for batch binder generation
 */
export interface GenerateBindersFromCacheParams {
  /** Filter by specific state code */
  stateCode?: StateCode;
  /** Minimum confidence score threshold (default: 60) */
  minConfidence?: number;
  /** Preview without inserting to database */
  dryRun?: boolean;
  /** Maximum number of binders to generate in one batch */
  batchLimit?: number;
  /** Specific county names to process (optional) */
  countyNames?: string[];
}

/**
 * Parameters for generating a single binder
 */
export interface GenerateSingleBinderParams {
  /** The cache record to transform */
  cacheRecord: CountyComplianceCache;
  /** Preview without inserting to database */
  dryRun?: boolean;
  /** Force regeneration even if binder exists */
  forceRegenerate?: boolean;
}

// ============================================================================
// GENERATION RESULTS
// ============================================================================

/**
 * Result of batch binder generation
 */
export interface BatchGenerationResult {
  /** Number of successfully generated binders */
  success: number;
  /** Number of failed generations */
  failed: number;
  /** Number of skipped records (low confidence, existing binder, etc.) */
  skipped: number;
  /** Total records processed */
  total: number;
  /** Detailed results per county */
  details: GenerationResultDetail[];
  /** Timestamp of generation */
  generatedAt: string;
  /** Parameters used for generation */
  params: GenerateBindersFromCacheParams;
}

/**
 * Detailed result for a single binder generation
 */
export interface GenerationResultDetail {
  /** County name */
  countyName: string;
  /** State code */
  stateCode: StateCode;
  /** Generation status */
  status: 'success' | 'failed' | 'skipped';
  /** Reason for failure or skip */
  reason?: string;
  /** Generated binder ID (if successful) */
  binderId?: string;
  /** Word count of generated content */
  wordCount?: number;
  /** Source confidence score */
  confidenceScore?: number;
  /** Processing time in milliseconds */
  processingTimeMs?: number;
}

/**
 * Result of generating a single binder
 */
export interface SingleGenerationResult {
  /** Whether generation was successful */
  success: boolean;
  /** The generated binder (if successful) */
  binder?: LocalBinder;
  /** Error message (if failed) */
  error?: string;
  /** Source cache record ID */
  cacheRecordId: string;
  /** Word count of generated content */
  wordCount?: number;
  /** Processing time in milliseconds */
  processingTimeMs?: number;
}

// ============================================================================
// PROMPT BUILDING
// ============================================================================

/**
 * Structured data extracted from cache for prompt building
 */
export interface BinderPromptData {
  // Location identification
  countyName: string;
  stateCode: StateCode;
  stateName: string;

  // Occupancy information
  occupancy: {
    maxPersons: number | null;
    unrelatedPersonsLimit: number | null;
    limitType: string | null;
    codeLanguage: string | null;
    codeSection: string | null;
  };

  // Household definition
  household: {
    definitionExists: boolean | null;
    allowsUnrelated: boolean | null;
    definitionText: string | null;
    codeSection: string | null;
    usesOrLanguage: boolean | null;
  };

  // Zoning information
  zoning: {
    residentialUsePermitted: boolean | null;
    classification: string | null;
    requiresSpecialPermit: boolean | null;
    codeLanguage: string | null;
    codeSection: string | null;
  };

  // Local requirements
  localRequirements: {
    requiresRegistration: boolean | null;
    requiresInspection: boolean | null;
    requiresCertificateOfOccupancy: boolean | null;
    requiresFireMarshalReview: boolean | null;
    requiresBusinessLicense: boolean | null;
    requirementsText: string | null;
    requirementsSection: string | null;
  };

  // Summary information
  summary: {
    interpretationSummary: string | null;
    complianceStatus: ComplianceStatus | null;
    confidenceScore: number | null;
  };

  // Source information
  source: {
    municipalCodeUrl: string | null;
    municipalCodePlatform: string | null;
    scrapeUrls: string[] | null;
    rawContent: string | null;
  };
}

/**
 * Generated prompt for Claude API
 */
export interface BinderGenerationPrompt {
  /** The system prompt */
  systemPrompt: string;
  /** The user prompt with data */
  userPrompt: string;
  /** Estimated token count */
  estimatedTokens: number;
}

// ============================================================================
// BINDER SECTIONS
// ============================================================================

/**
 * Standard binder section structure
 */
export interface BinderSection {
  id: string;
  title: string;
  level: 2 | 3;
  content?: string;
}

/**
 * Standard binder structure for generation
 */
export const STANDARD_BINDER_SECTIONS: BinderSection[] = [
  { id: 'section-1', title: 'Section 1 — Introduction, Usage, Language Guidelines & Housing Model Overview', level: 2 },
  { id: 'section-1a', title: '1A. Purpose and Use of the Binder', level: 3 },
  { id: 'section-1b', title: '1B. Housing Model Overview', level: 3 },
  { id: 'section-1c', title: '1C. Language and Operations Guardrails', level: 3 },
  { id: 'section-2', title: 'Section 2 — Definitions of Licensed vs. Unlicensed Facilities', level: 2 },
  { id: 'section-2a', title: '2A. Licensed vs. Unlicensed Facility Definitions', level: 3 },
  { id: 'section-2b', title: '2B. Distinction from Rooming and Boarding Houses', level: 3 },
  { id: 'section-3', title: 'Section 3 — City & County Zoning and Permitting Guidelines', level: 2 },
  { id: 'section-3a', title: '3A. State and Local Occupancy Rules', level: 3 },
  { id: 'section-3b', title: '3B. Zoning and Permitting Guidelines', level: 3 },
  { id: 'section-4', title: 'Section 4 — Fair Housing Act Summary & ADA Guidance', level: 2 },
  { id: 'section-4a', title: '4A. Fair Housing Act Summary', level: 3 },
  { id: 'section-4b', title: '4B. ADA Guidance (If Applicable)', level: 3 },
];

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Quality validation result for a generated binder
 */
export interface BinderQualityValidation {
  /** Whether the binder passes quality checks */
  isValid: boolean;
  /** Word count of the binder */
  wordCount: number;
  /** Minimum word count threshold (2000) */
  minWordCountMet: boolean;
  /** Whether all 4 main sections are present */
  allSectionsPresent: boolean;
  /** Whether all subsections are present */
  allSubsectionsPresent: boolean;
  /** Missing sections (if any) */
  missingSections: string[];
  /** Whether placeholder text was detected */
  hasPlaceholderText: boolean;
  /** Placeholder text found (if any) */
  placeholderTextFound: string[];
  /** Whether legal citations are included */
  hasLegalCitations: boolean;
  /** Whether municipal code URL is included */
  hasMunicipalCodeUrl: boolean;
  /** Validation warnings */
  warnings: string[];
  /** Validation errors */
  errors: string[];
}

/**
 * Quality thresholds for binder generation
 */
export const BINDER_QUALITY_THRESHOLDS = {
  /** Minimum word count for a viable binder */
  MIN_WORD_COUNT: 2000,
  /** Target word count for ideal binder */
  TARGET_WORD_COUNT: 4500,
  /** Minimum confidence score for auto-generation */
  MIN_CONFIDENCE_SCORE: 60,
  /** Confidence score for high-quality source data */
  HIGH_CONFIDENCE_SCORE: 80,
  /** Required main sections (Section 1-4) */
  REQUIRED_MAIN_SECTIONS: 4,
  /** Required subsections (1A-1C, 2A-2B, 3A-3B, 4A-4B) */
  REQUIRED_SUBSECTIONS: 10,
} as const;

// ============================================================================
// CACHE RECORD ASSESSMENT
// ============================================================================

/**
 * Assessment of a cache record's suitability for binder generation
 */
export interface CacheRecordAssessment {
  /** Whether the record is suitable for generation */
  isSuitable: boolean;
  /** Confidence score */
  confidenceScore: number | null;
  /** Quality score (0-100) based on field completeness */
  qualityScore: number;
  /** Populated fields count */
  populatedFieldsCount: number;
  /** Total fields count */
  totalFieldsCount: number;
  /** Field completeness breakdown */
  fieldCompleteness: {
    hasOccupancyData: boolean;
    hasHouseholdData: boolean;
    hasZoningData: boolean;
    hasLocalRequirementsData: boolean;
    hasInterpretationSummary: boolean;
    hasRawContent: boolean;
    hasMunicipalCodeUrl: boolean;
  };
  /** Reasons why record may not be suitable */
  issues: string[];
  /** Recommendations for improving the record */
  recommendations: string[];
}

// ============================================================================
// ADMIN UI TYPES
// ============================================================================

/**
 * Cache record summary for admin UI display
 */
export interface CacheRecordSummary {
  id: string;
  countyName: string;
  stateCode: StateCode;
  stateName: string;
  confidenceScore: number | null;
  complianceStatus: ComplianceStatus | null;
  dataSource: string;
  hasBinder: boolean;
  lastUpdated: string;
  qualityScore: number;
  isSuitable: boolean;
}

/**
 * Generation queue item for batch processing UI
 */
export interface GenerationQueueItem {
  id: string;
  cacheRecordId: string;
  countyName: string;
  stateCode: StateCode;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  binderId?: string;
  createdAt: string;
  completedAt?: string;
}

/**
 * Binder preview data for admin review before save
 */
export interface BinderPreviewData {
  /** Location details */
  locationName: string;
  locationType: 'city' | 'county';
  stateCode: StateCode;
  /** Generated content */
  title: string;
  content: string;
  /** Metrics */
  wordCount: number;
  sectionHeaders: BinderSectionHeader[];
  /** Source cache record */
  sourceRecord: CountyComplianceCache;
  /** Quality validation */
  qualityValidation: BinderQualityValidation;
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  GenerateBindersFromCacheParams,
  GenerateSingleBinderParams,
  BatchGenerationResult,
  GenerationResultDetail,
  SingleGenerationResult,
  BinderPromptData,
  BinderGenerationPrompt,
  BinderSection,
  BinderQualityValidation,
  CacheRecordAssessment,
  CacheRecordSummary,
  GenerationQueueItem,
  BinderPreviewData,
};
