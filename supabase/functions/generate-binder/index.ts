/**
 * Generate Binder Edge Function
 * Proxies Claude API calls server-side to avoid CORS issues
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Claude API configuration
const CLAUDE_API_ENDPOINT = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 8192;

// ============================================================================
// TYPES
// ============================================================================

interface CountyComplianceCache {
  id: string;
  county_name: string;
  state_code: string;
  occupancy_max_persons: number | null;
  occupancy_unrelated_persons_limit: number | null;
  occupancy_limit_type: string | null;
  occupancy_code_language: string | null;
  occupancy_code_section: string | null;
  household_definition_exists: boolean | null;
  household_allows_unrelated: boolean | null;
  household_definition_text: string | null;
  household_code_section: string | null;
  household_uses_or_language: boolean | null;
  residential_use_permitted: boolean | null;
  zoning_classification: string | null;
  requires_special_permit: boolean | null;
  zoning_code_language: string | null;
  zoning_code_section: string | null;
  requires_registration: boolean | null;
  requires_inspection: boolean | null;
  requires_certificate_of_occupancy: boolean | null;
  requires_fire_marshal_review: boolean | null;
  requires_business_license: boolean | null;
  local_requirements_text: string | null;
  local_requirements_section: string | null;
  interpretation_summary: string | null;
  compliance_status: string | null;
  confidence_score: number | null;
  municipal_code_url: string | null;
  municipal_code_platform: string | null;
  scrape_urls: string[] | null;
  scrape_raw_content: string | null;
}

interface BinderPromptData {
  countyName: string;
  stateCode: string;
  stateName: string;
  occupancy: {
    maxPersons: number | null;
    unrelatedPersonsLimit: number | null;
    limitType: string | null;
    codeLanguage: string | null;
    codeSection: string | null;
  };
  household: {
    definitionExists: boolean | null;
    allowsUnrelated: boolean | null;
    definitionText: string | null;
    codeSection: string | null;
    usesOrLanguage: boolean | null;
  };
  zoning: {
    residentialUsePermitted: boolean | null;
    classification: string | null;
    requiresSpecialPermit: boolean | null;
    codeLanguage: string | null;
    codeSection: string | null;
  };
  localRequirements: {
    requiresRegistration: boolean | null;
    requiresInspection: boolean | null;
    requiresCertificateOfOccupancy: boolean | null;
    requiresFireMarshalReview: boolean | null;
    requiresBusinessLicense: boolean | null;
    requirementsText: string | null;
    requirementsSection: string | null;
  };
  summary: {
    interpretationSummary: string | null;
    complianceStatus: string | null;
    confidenceScore: number | null;
  };
  source: {
    municipalCodeUrl: string | null;
    municipalCodePlatform: string | null;
    scrapeUrls: string[] | null;
    rawContent: string | null;
  };
}

// ============================================================================
// STATE NAMES
// ============================================================================

const STATE_NAMES: Record<string, string> = {
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
  DC: 'District of Columbia', PR: 'Puerto Rico', VI: 'Virgin Islands', GU: 'Guam',
};

function getStateName(stateCode: string): string {
  return STATE_NAMES[stateCode] || stateCode;
}

// ============================================================================
// PROMPT BUILDING FUNCTIONS
// ============================================================================

function extractPromptData(cacheRecord: CountyComplianceCache): BinderPromptData {
  return {
    countyName: cacheRecord.county_name,
    stateCode: cacheRecord.state_code,
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

function formatBool(value: boolean | null, trueText = 'Yes', falseText = 'No'): string {
  if (value === null) return 'Unknown';
  return value ? trueText : falseText;
}

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

function countWords(text: string): number {
  return text
    .replace(/[#*`_\[\]()]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 0)
    .length;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get API key from environment
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { cacheRecord } = await req.json() as { cacheRecord: CountyComplianceCache };

    if (!cacheRecord) {
      return new Response(
        JSON.stringify({ error: 'cacheRecord is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build prompts
    const data = extractPromptData(cacheRecord);
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(data);

    console.log(`[generate-binder] Generating binder for ${cacheRecord.county_name}, ${cacheRecord.state_code}`);

    // Call Claude API
    const response = await fetch(CLAUDE_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[generate-binder] Claude API error: ${response.status} - ${errorText}`);
      return new Response(
        JSON.stringify({
          error: `Claude API error: ${response.status}`,
          details: errorText
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();

    // Extract content from Claude response
    const content = result.content?.[0]?.text || '';
    const wordCount = countWords(content);

    console.log(`[generate-binder] Generated ${wordCount} words for ${cacheRecord.county_name}, ${cacheRecord.state_code}`);

    return new Response(
      JSON.stringify({ content, wordCount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[generate-binder] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
