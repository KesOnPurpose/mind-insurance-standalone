/**
 * Binder Prompt Builder
 * Purpose: Transforms county_compliance_cache data into Claude API prompts
 * for generating local compliance binders
 */

import type { CountyComplianceCache } from '@/types/countyCompliance';
import type {
  BinderPromptData,
  BinderGenerationPrompt,
  CacheRecordAssessment,
  STANDARD_BINDER_SECTIONS,
} from '@/types/binderGeneration';
import { BINDER_QUALITY_THRESHOLDS } from '@/types/binderGeneration';
import { STATE_NAMES, type StateCode } from '@/types/compliance';

// ============================================================================
// STATE NAME LOOKUP
// ============================================================================

/**
 * Get full state name from state code
 */
export function getStateName(stateCode: StateCode | string): string {
  return STATE_NAMES[stateCode as StateCode] || stateCode;
}

// ============================================================================
// DATA EXTRACTION
// ============================================================================

/**
 * Extract structured prompt data from a cache record
 */
export function extractPromptData(cacheRecord: CountyComplianceCache): BinderPromptData {
  return {
    countyName: cacheRecord.county_name,
    stateCode: cacheRecord.state_code as StateCode,
    stateName: getStateName(cacheRecord.state_code),

    occupancy: {
      maxPersons: cacheRecord.occupancy_max_persons,
      unrelatedPersonsLimit: cacheRecord.occupancy_unrelated_persons_limit,
      limitType: cacheRecord.occupancy_limit_type,
      codeLanguage: cacheRecord.occupancy_code_language,
      codeSection: cacheRecord.occupancy_code_section,
    },

    household: {
      definitionExists: cacheRecord.household_definition_exists,
      allowsUnrelated: cacheRecord.household_allows_unrelated,
      definitionText: cacheRecord.household_definition_text,
      codeSection: cacheRecord.household_code_section,
      usesOrLanguage: cacheRecord.household_uses_or_language,
    },

    zoning: {
      residentialUsePermitted: cacheRecord.residential_use_permitted,
      classification: cacheRecord.zoning_classification,
      requiresSpecialPermit: cacheRecord.requires_special_permit,
      codeLanguage: cacheRecord.zoning_code_language,
      codeSection: cacheRecord.zoning_code_section,
    },

    localRequirements: {
      requiresRegistration: cacheRecord.requires_registration,
      requiresInspection: cacheRecord.requires_inspection,
      requiresCertificateOfOccupancy: cacheRecord.requires_certificate_of_occupancy,
      requiresFireMarshalReview: cacheRecord.requires_fire_marshal_review,
      requiresBusinessLicense: cacheRecord.requires_business_license,
      requirementsText: cacheRecord.local_requirements_text,
      requirementsSection: cacheRecord.local_requirements_section,
    },

    summary: {
      interpretationSummary: cacheRecord.interpretation_summary,
      complianceStatus: cacheRecord.compliance_status,
      confidenceScore: cacheRecord.confidence_score,
    },

    source: {
      municipalCodeUrl: cacheRecord.municipal_code_url,
      municipalCodePlatform: cacheRecord.municipal_code_platform,
      scrapeUrls: cacheRecord.scrape_urls,
      rawContent: cacheRecord.scrape_raw_content,
    },
  };
}

// ============================================================================
// CACHE RECORD ASSESSMENT
// ============================================================================

/**
 * Assess a cache record's suitability for binder generation
 */
export function assessCacheRecord(cacheRecord: CountyComplianceCache): CacheRecordAssessment {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check field completeness
  const fieldCompleteness = {
    hasOccupancyData: !!(
      cacheRecord.occupancy_max_persons ||
      cacheRecord.occupancy_code_language ||
      cacheRecord.occupancy_unrelated_persons_limit
    ),
    hasHouseholdData: !!(
      cacheRecord.household_definition_text ||
      cacheRecord.household_allows_unrelated !== null
    ),
    hasZoningData: !!(
      cacheRecord.zoning_classification ||
      cacheRecord.zoning_code_language ||
      cacheRecord.residential_use_permitted !== null
    ),
    hasLocalRequirementsData: !!(
      cacheRecord.requires_registration !== null ||
      cacheRecord.requires_inspection !== null ||
      cacheRecord.local_requirements_text
    ),
    hasInterpretationSummary: !!cacheRecord.interpretation_summary,
    hasRawContent: !!cacheRecord.scrape_raw_content,
    hasMunicipalCodeUrl: !!cacheRecord.municipal_code_url,
  };

  // Count populated fields
  const populatedCount = Object.values(fieldCompleteness).filter(Boolean).length;
  const totalCount = Object.keys(fieldCompleteness).length;
  const qualityScore = Math.round((populatedCount / totalCount) * 100);

  // Check confidence score
  const confidenceScore = cacheRecord.confidence_score;
  if (!confidenceScore || confidenceScore < BINDER_QUALITY_THRESHOLDS.MIN_CONFIDENCE_SCORE) {
    issues.push(`Low confidence score: ${confidenceScore || 'N/A'} (minimum: ${BINDER_QUALITY_THRESHOLDS.MIN_CONFIDENCE_SCORE})`);
  }

  // Check required fields
  if (!fieldCompleteness.hasOccupancyData) {
    issues.push('Missing occupancy data');
    recommendations.push('Add occupancy_max_persons or occupancy_code_language');
  }

  if (!fieldCompleteness.hasHouseholdData) {
    issues.push('Missing household definition data');
    recommendations.push('Add household_definition_text or household_allows_unrelated');
  }

  if (!fieldCompleteness.hasZoningData) {
    issues.push('Missing zoning data');
    recommendations.push('Add zoning_classification or residential_use_permitted');
  }

  if (!fieldCompleteness.hasInterpretationSummary) {
    issues.push('Missing interpretation summary');
    recommendations.push('Add interpretation_summary for better binder context');
  }

  // Determine suitability
  // Require at least 3 of 4 main data sections AND confidence >= 60
  const mainSectionsPresent = [
    fieldCompleteness.hasOccupancyData,
    fieldCompleteness.hasHouseholdData,
    fieldCompleteness.hasZoningData,
    fieldCompleteness.hasLocalRequirementsData,
  ].filter(Boolean).length;

  const isSuitable =
    mainSectionsPresent >= 3 &&
    (confidenceScore === null || confidenceScore >= BINDER_QUALITY_THRESHOLDS.MIN_CONFIDENCE_SCORE);

  return {
    isSuitable,
    confidenceScore,
    qualityScore,
    populatedFieldsCount: populatedCount,
    totalFieldsCount: totalCount,
    fieldCompleteness,
    issues,
    recommendations,
  };
}

// ============================================================================
// PROMPT BUILDING
// ============================================================================

/**
 * Build the system prompt for binder generation
 */
function buildSystemPrompt(): string {
  return `You are a compliance documentation specialist creating professional compliance binders for independent shared housing operators. Your task is to generate a comprehensive, accurate compliance binder based on structured data from county/local regulations.

CRITICAL REQUIREMENTS:
1. Generate FACTUAL, PROFESSIONAL content based on the provided data
2. Use neutral, legal language appropriate for regulatory documentation
3. Include specific code citations and URLs where provided
4. Structure content exactly as specified with proper section numbering
5. Generate AT LEAST 2,000 words of substantive content
6. Include "📍 Purpose:" statements at the end of each subsection explaining why that section matters
7. Where data is incomplete, provide general guidance based on typical local regulations while noting the limitation
8. NEVER invent specific code sections, numbers, or URLs that weren't provided
9. Use phrases like "local ordinances may require" or "operators should verify" when data is uncertain

HOUSING MODEL CONTEXT:
The compliance binder is for "independent shared housing" - a private residential dwelling occupied by unrelated adults who share common living spaces. The housing provides shelter ONLY with:
- NO services, supervision, or case management
- NO on-site staff or monitoring
- Standard residential lease terms
- Residents independently manage their own daily activities

The goal is to document how this housing model complies with local regulations and is DISTINCT from:
- Licensed assisted living or personal care homes
- Rooming or boarding houses
- Group homes with services`;
}

/**
 * Format boolean value for display
 */
function formatBool(value: boolean | null, trueText = 'Yes', falseText = 'No'): string {
  if (value === null) return 'Unknown';
  return value ? trueText : falseText;
}

/**
 * Build the user prompt with structured data
 */
function buildUserPrompt(data: BinderPromptData): string {
  const sections: string[] = [];

  // Header
  sections.push(`Generate a compliance binder for: ${data.countyName} County, ${data.stateName} (${data.stateCode})`);
  sections.push('');
  sections.push('=== STRUCTURED DATA FROM LOCAL REGULATIONS ===');
  sections.push('');

  // Occupancy data
  sections.push('## OCCUPANCY LIMITS');
  sections.push(`- Maximum Persons: ${data.occupancy.maxPersons || 'Not specified'}`);
  sections.push(`- Unrelated Persons Limit: ${data.occupancy.unrelatedPersonsLimit || 'Not specified'}`);
  sections.push(`- Limit Type: ${data.occupancy.limitType || 'Unknown'}`);
  if (data.occupancy.codeLanguage) {
    sections.push(`- Code Language: "${data.occupancy.codeLanguage}"`);
  }
  if (data.occupancy.codeSection) {
    sections.push(`- Code Section: ${data.occupancy.codeSection}`);
  }
  sections.push('');

  // Household definition
  sections.push('## HOUSEHOLD/FAMILY DEFINITION');
  sections.push(`- Definition Exists: ${formatBool(data.household.definitionExists)}`);
  sections.push(`- Allows Unrelated Persons: ${formatBool(data.household.allowsUnrelated)}`);
  sections.push(`- Uses "OR" Language (flexibility): ${formatBool(data.household.usesOrLanguage)}`);
  if (data.household.definitionText) {
    sections.push(`- Definition Text: "${data.household.definitionText}"`);
  }
  if (data.household.codeSection) {
    sections.push(`- Code Section: ${data.household.codeSection}`);
  }
  sections.push('');

  // Zoning data
  sections.push('## ZONING CLASSIFICATION');
  sections.push(`- Residential Use Permitted: ${formatBool(data.zoning.residentialUsePermitted)}`);
  sections.push(`- Classification: ${data.zoning.classification || 'Unknown'}`);
  sections.push(`- Requires Special Permit: ${formatBool(data.zoning.requiresSpecialPermit)}`);
  if (data.zoning.codeLanguage) {
    sections.push(`- Code Language: "${data.zoning.codeLanguage}"`);
  }
  if (data.zoning.codeSection) {
    sections.push(`- Code Section: ${data.zoning.codeSection}`);
  }
  sections.push('');

  // Local requirements
  sections.push('## LOCAL PERMITS & REQUIREMENTS');
  sections.push(`- Registration Required: ${formatBool(data.localRequirements.requiresRegistration)}`);
  sections.push(`- Inspection Required: ${formatBool(data.localRequirements.requiresInspection)}`);
  sections.push(`- Certificate of Occupancy Required: ${formatBool(data.localRequirements.requiresCertificateOfOccupancy)}`);
  sections.push(`- Fire Marshal Review Required: ${formatBool(data.localRequirements.requiresFireMarshalReview)}`);
  sections.push(`- Business License Required: ${formatBool(data.localRequirements.requiresBusinessLicense)}`);
  if (data.localRequirements.requirementsText) {
    sections.push(`- Requirements Text: "${data.localRequirements.requirementsText}"`);
  }
  if (data.localRequirements.requirementsSection) {
    sections.push(`- Code Section: ${data.localRequirements.requirementsSection}`);
  }
  sections.push('');

  // Summary
  sections.push('## INTERPRETATION & SUMMARY');
  sections.push(`- Compliance Status: ${data.summary.complianceStatus || 'Unknown'}`);
  sections.push(`- Confidence Score: ${data.summary.confidenceScore || 'N/A'}/100`);
  if (data.summary.interpretationSummary) {
    sections.push(`- Summary: "${data.summary.interpretationSummary}"`);
  }
  sections.push('');

  // Source URLs
  sections.push('## SOURCE INFORMATION');
  sections.push(`- Municipal Code URL: ${data.source.municipalCodeUrl || 'Not available'}`);
  sections.push(`- Municipal Code Platform: ${data.source.municipalCodePlatform || 'Unknown'}`);
  if (data.source.scrapeUrls && data.source.scrapeUrls.length > 0) {
    sections.push(`- Source URLs: ${data.source.scrapeUrls.join(', ')}`);
  }
  sections.push('');

  // Raw content (truncated if too long)
  if (data.source.rawContent) {
    const maxRawContentLength = 3000;
    const truncatedContent = data.source.rawContent.length > maxRawContentLength
      ? data.source.rawContent.substring(0, maxRawContentLength) + '... [truncated]'
      : data.source.rawContent;
    sections.push('## RAW SCRAPED CONTENT (for additional context)');
    sections.push('```');
    sections.push(truncatedContent);
    sections.push('```');
    sections.push('');
  }

  // Output format instructions
  sections.push('=== OUTPUT FORMAT ===');
  sections.push('');
  sections.push('Generate a compliance binder in Markdown format with the following exact structure:');
  sections.push('');
  sections.push(`# **Compliance Binder: Independent Shared Housing, ${data.countyName} County, ${data.stateName}**`);
  sections.push('');
  sections.push('## **Highlight Instructions**');
  sections.push('[Standard highlight instructions paragraph]');
  sections.push('');
  sections.push('## **Section 1 — Introduction, Usage, Language Guidelines & Housing Model Overview**');
  sections.push('### **1A. Purpose and Use of the Binder**');
  sections.push('[Explain why this binder exists, reference the county/state specifically]');
  sections.push('📍 **Purpose:** [Brief purpose statement]');
  sections.push('');
  sections.push('### **1B. Housing Model Overview**');
  sections.push('[Describe independent shared housing model for this county]');
  sections.push('📍 **Purpose:** [Brief purpose statement]');
  sections.push('');
  sections.push('### **1C. Language and Operations Guardrails**');
  sections.push('[Terminology and operational guidelines]');
  sections.push('📍 **Purpose:** [Brief purpose statement]');
  sections.push('');
  sections.push('## **Section 2 — Definitions of Licensed vs. Unlicensed Facilities & Distinction from Rooming and Boarding Houses**');
  sections.push(`### **2A. Licensed vs. Unlicensed Facility Definitions (${data.stateName})**`);
  sections.push(`[State-specific definitions for ${data.stateName}, reference applicable state codes]`);
  sections.push('**Primary Authority — Documents to Insert**');
  sections.push('[List relevant state statutes/codes with URLs if available]');
  sections.push('📍 **Purpose:** [Brief purpose statement]');
  sections.push('');
  sections.push(`### **2B. Distinction from Rooming and Boarding Houses (${data.countyName} County)**`);
  sections.push('[Local distinctions, how shared housing differs from rooming/boarding]');
  sections.push('**Primary Authority — Documents to Insert**');
  sections.push('[List local codes with URLs if available]');
  sections.push('📍 **Purpose:** [Brief purpose statement]');
  sections.push('');
  sections.push(`## **Section 3 — City & County Zoning and Permitting Guidelines (${data.countyName} County, ${data.stateCode})**`);
  sections.push(`### **3A. State and Local Occupancy Rules (${data.countyName} County)**`);
  sections.push('[Occupancy limits, space requirements based on provided data]');
  if (data.occupancy.maxPersons || data.occupancy.unrelatedPersonsLimit) {
    sections.push('[Include occupancy table if data available]');
  }
  sections.push('**Primary Authority — Documents to Insert**');
  sections.push('[List relevant codes]');
  sections.push('📍 **Purpose:** [Brief purpose statement]');
  sections.push('');
  sections.push(`### **3B. Zoning and Permitting Guidelines (${data.countyName} County)**`);
  sections.push('[Zoning classification, permit requirements based on provided data]');
  sections.push('**Primary Authority**');
  sections.push('[Reference municipal code and zoning information]');
  sections.push('📍 **Purpose:** [Brief purpose statement]');
  sections.push('');
  sections.push('## **Section 4 — Fair Housing Act Summary & ADA Guidance (If Applicable)**');
  sections.push('### **4A. Fair Housing Act Summary**');
  sections.push('[Federal, state, and local fair housing protections]');
  sections.push('**Primary Authority — Documents to Insert**');
  sections.push('* **HUD Fair Housing Act Overview**: https://www.hud.gov/helping-americans/fair-housing-act-overview');
  sections.push('[Add state-specific fair housing law references]');
  sections.push('📍 **Purpose:** [Brief purpose statement]');
  sections.push('');
  sections.push('### **4B. ADA Guidance (If Applicable)**');
  sections.push('[ADA applicability to private housing, reasonable accommodations]');
  sections.push('**Primary Authority — Documents to Insert**');
  sections.push('* **ADA Title III — Public Accommodations**: https://www.ada.gov/topics/title-iii/');
  sections.push('* **HUD Guidance — Reasonable Accommodations**: https://www.hud.gov/program_offices/fair_housing_equal_opp/reasonable_accommodations_and_modifications');
  sections.push('📍 **Purpose:** [Brief purpose statement]');

  return sections.join('\n');
}

/**
 * Estimate token count for a prompt
 * Rough estimate: ~4 characters per token
 */
function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Build a complete prompt for binder generation
 */
export function buildBinderPrompt(cacheRecord: CountyComplianceCache): BinderGenerationPrompt {
  const data = extractPromptData(cacheRecord);
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(data);

  return {
    systemPrompt,
    userPrompt,
    estimatedTokens: estimateTokenCount(systemPrompt) + estimateTokenCount(userPrompt),
  };
}

// ============================================================================
// RESPONSE PARSING
// ============================================================================

/**
 * Count words in a text string
 */
export function countWords(text: string): number {
  return text
    .replace(/[#*`_\[\]()]/g, ' ')  // Remove markdown characters
    .split(/\s+/)
    .filter(word => word.length > 0)
    .length;
}

/**
 * Extract section headers from generated binder content
 */
export function extractSectionHeaders(content: string): { id: string; title: string; level: number }[] {
  const headers: { id: string; title: string; level: number }[] = [];
  const lines = content.split('\n');

  let sectionCount = 0;
  let subsectionCount = 0;

  for (const line of lines) {
    // Match ## headers (level 2)
    const h2Match = line.match(/^##\s+\*?\*?(.+?)\*?\*?\s*$/);
    if (h2Match) {
      sectionCount++;
      headers.push({
        id: `section-${sectionCount}`,
        title: h2Match[1].replace(/\*\*/g, '').trim(),
        level: 2,
      });
      continue;
    }

    // Match ### headers (level 3)
    const h3Match = line.match(/^###\s+\*?\*?(.+?)\*?\*?\s*$/);
    if (h3Match) {
      subsectionCount++;
      const letter = String.fromCharCode(96 + (subsectionCount % 26) || 26); // a, b, c...
      headers.push({
        id: `section-${sectionCount}${letter}`,
        title: h3Match[1].replace(/\*\*/g, '').trim(),
        level: 3,
      });
    }
  }

  return headers;
}

/**
 * Validate generated binder content
 */
export function validateBinderContent(content: string): {
  isValid: boolean;
  wordCount: number;
  issues: string[];
  warnings: string[];
} {
  const issues: string[] = [];
  const warnings: string[] = [];

  // Check word count
  const wordCount = countWords(content);
  if (wordCount < BINDER_QUALITY_THRESHOLDS.MIN_WORD_COUNT) {
    issues.push(`Word count (${wordCount}) below minimum (${BINDER_QUALITY_THRESHOLDS.MIN_WORD_COUNT})`);
  } else if (wordCount < BINDER_QUALITY_THRESHOLDS.TARGET_WORD_COUNT) {
    warnings.push(`Word count (${wordCount}) below target (${BINDER_QUALITY_THRESHOLDS.TARGET_WORD_COUNT})`);
  }

  // Check for required sections
  const requiredSections = [
    'Section 1',
    'Section 2',
    'Section 3',
    'Section 4',
    '1A',
    '1B',
    '1C',
    '2A',
    '2B',
    '3A',
    '3B',
    '4A',
    '4B',
  ];

  for (const section of requiredSections) {
    if (!content.includes(section)) {
      issues.push(`Missing section: ${section}`);
    }
  }

  // Check for placeholder text
  const placeholderPatterns = [
    /\[TODO\]/gi,
    /\[PLACEHOLDER\]/gi,
    /\[INSERT\s+HERE\]/gi,
    /\[ADD\s+CONTENT\]/gi,
    /YOUR_.*_HERE/gi,
  ];

  for (const pattern of placeholderPatterns) {
    if (pattern.test(content)) {
      issues.push(`Contains placeholder text matching: ${pattern.source}`);
    }
  }

  // Check for purpose statements
  const purposeCount = (content.match(/📍\s*\*?\*?Purpose/gi) || []).length;
  if (purposeCount < 8) {
    warnings.push(`Only ${purposeCount} purpose statements found (expected 10+)`);
  }

  return {
    isValid: issues.length === 0,
    wordCount,
    issues,
    warnings,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  buildSystemPrompt,
  buildUserPrompt,
  estimateTokenCount,
};
