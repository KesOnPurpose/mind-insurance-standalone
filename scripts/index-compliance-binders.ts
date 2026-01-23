// ============================================================================
// INDEX COMPLIANCE BINDERS SCRIPT
// ============================================================================
// Script to index state compliance PDFs/markdown files as complete binders.
// Creates ONE complete document per state in the compliance_binders table.
//
// Usage:
//   npx ts-node scripts/index-compliance-binders.ts
//
// Environment Variables Required:
//   SUPABASE_SERVICE_KEY - Supabase service role key
//
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ESM compatibility - get __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUPABASE_URL = 'https://hpyodaugrkctagkrfofj.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

// Directory containing compliance markdown/text files
// Adjust this path based on your actual PDF conversion output
const COMPLIANCE_DIR = path.join(__dirname, '../data/compliance-binders');

// State codes and names mapping
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
  DC: 'District of Columbia',
};

// ============================================================================
// INITIALIZE SUPABASE CLIENT
// ============================================================================

if (!SUPABASE_SERVICE_KEY) {
  console.error('ERROR: SUPABASE_SERVICE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract section headers from markdown content
 * Parses ## and ### headers for TOC navigation
 */
function extractSectionHeaders(content: string): Array<{ id: string; title: string; level: number }> {
  const headers: Array<{ id: string; title: string; level: number }> = [];
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // Match ## and ### headers
    const match = line.match(/^(#{2,3})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const title = match[2].trim();
      const id = `section-${index}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

      headers.push({ id, title, level });
    }
  });

  return headers;
}

/**
 * Count words in markdown content
 */
function countWords(content: string): number {
  // Remove markdown syntax and count words
  const plainText = content
    .replace(/#{1,6}\s+/g, '')  // Remove headers
    .replace(/\*\*|__|~~|`/g, '')  // Remove formatting
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // Replace links with text
    .replace(/\n+/g, ' ')  // Replace newlines with spaces
    .trim();

  return plainText.split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Detect state code from filename
 */
function detectStateFromFilename(filename: string): string | null {
  // Try to extract state code from filename patterns:
  // - "CA_compliance_binder.md"
  // - "california_binder.md"
  // - "CA.md"

  const upperFilename = filename.toUpperCase();

  // Check for 2-letter state code at start
  for (const code of Object.keys(STATE_NAMES)) {
    if (upperFilename.startsWith(code + '_') || upperFilename.startsWith(code + '.')) {
      return code;
    }
  }

  // Check for full state name
  const lowerFilename = filename.toLowerCase();
  for (const [code, name] of Object.entries(STATE_NAMES)) {
    if (lowerFilename.includes(name.toLowerCase().replace(/\s+/g, '_')) ||
        lowerFilename.includes(name.toLowerCase().replace(/\s+/g, '-'))) {
      return code;
    }
  }

  return null;
}

/**
 * Generate a default binder title
 */
function generateBinderTitle(stateCode: string): string {
  const stateName = STATE_NAMES[stateCode] || stateCode;
  return `${stateName} Unlicensed Housing Compliance Binder`;
}

/**
 * Read and process a compliance binder file
 */
async function processBinderFile(filePath: string): Promise<{
  stateCode: string;
  stateName: string;
  title: string;
  content: string;
  wordCount: number;
  sectionHeaders: Array<{ id: string; title: string; level: number }>;
} | null> {
  const filename = path.basename(filePath);
  const stateCode = detectStateFromFilename(filename);

  if (!stateCode) {
    console.warn(`  SKIP: Could not detect state from filename: ${filename}`);
    return null;
  }

  const stateName = STATE_NAMES[stateCode];
  if (!stateName) {
    console.warn(`  SKIP: Unknown state code: ${stateCode}`);
    return null;
  }

  // Read file content
  const content = fs.readFileSync(filePath, 'utf-8');

  if (!content.trim()) {
    console.warn(`  SKIP: Empty file: ${filename}`);
    return null;
  }

  // Generate title from content or use default
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : generateBinderTitle(stateCode);

  // Extract metadata
  const wordCount = countWords(content);
  const sectionHeaders = extractSectionHeaders(content);

  return {
    stateCode,
    stateName,
    title,
    content,
    wordCount,
    sectionHeaders,
  };
}

/**
 * Upsert a binder to the database
 */
async function upsertBinder(binderData: {
  stateCode: string;
  stateName: string;
  title: string;
  content: string;
  wordCount: number;
  sectionHeaders: Array<{ id: string; title: string; level: number }>;
}): Promise<boolean> {
  const { data, error } = await supabase
    .from('state_compliance_binders')
    .upsert(
      {
        state_code: binderData.stateCode,
        state_name: binderData.stateName,
        title: binderData.title,
        content: binderData.content,
        word_count: binderData.wordCount,
        section_headers: binderData.sectionHeaders,
        metadata: {
          indexed_at: new Date().toISOString(),
          source: 'index-compliance-binders script',
        },
        last_updated: new Date().toISOString(),
      },
      {
        onConflict: 'state_code',
      }
    )
    .select()
    .single();

  if (error) {
    console.error(`  ERROR: Failed to upsert ${binderData.stateCode}:`, error.message);
    return false;
  }

  return true;
}

// ============================================================================
// SAMPLE BINDER GENERATION (for testing without PDFs)
// ============================================================================

/**
 * Generate a sample binder for testing
 */
function generateSampleBinder(stateCode: string): string {
  const stateName = STATE_NAMES[stateCode] || stateCode;

  return `# ${stateName} Unlicensed Housing Compliance Binder

## Purpose of This Binder

This compliance binder provides a comprehensive guide for operators of unlicensed residential care facilities in ${stateName}. It covers regulatory requirements, fair housing compliance, and best practices for providing quality care while maintaining legal compliance.

## Regulatory Authority

### State Licensing Agency
The ${stateName} Department of Health and Human Services oversees the regulation of residential care facilities. For unlicensed facilities (typically serving 3 or fewer residents), operators must still comply with certain regulations.

### Key Contact Information
- State Licensing Board: Contact your local state office
- Fair Housing Office: HUD regional office
- Ombudsman Program: State long-term care ombudsman

## Licensed vs. Unlicensed Care Categories

### Licensed Facilities (for reference)
In ${stateName}, facilities serving more than a specified number of residents typically require state licensure. This includes:
- Adult Foster Care (AFC)
- Assisted Living Facilities (ALF)
- Group Homes

### Unlicensed Facilities (this binder's focus)
Facilities serving 3 or fewer unrelated adults may operate without a state license in many cases, but must still comply with:
- Local zoning ordinances
- Building and fire safety codes
- Fair Housing Act requirements
- Basic health and safety standards

## Fair Housing Act Compliance

### Overview
The Fair Housing Act (FHA) prohibits discrimination in housing based on:
- Race, color, religion, national origin
- Sex, familial status
- Disability (including mental illness and substance use disorders)

### Reasonable Accommodations
Operators must provide reasonable accommodations to residents with disabilities. This may include:
- Modified policies or procedures
- Physical accessibility modifications
- Service animal allowances

### Reasonable Modifications
Residents may request reasonable modifications to the physical premises at their own expense, unless the facility receives federal financial assistance.

## Health and Safety Requirements

### General Standards
Even without state licensure, operators should maintain:
- Clean and sanitary living conditions
- Adequate heating, cooling, and ventilation
- Safe food storage and preparation areas
- Functioning smoke detectors and fire extinguishers
- Emergency evacuation plans

### Medication Management
- Document all medications administered
- Store medications properly
- Maintain medication administration records
- Follow healthcare provider instructions

## Documentation Best Practices

### Resident Records
Maintain organized records including:
- Intake assessment and care plan
- Emergency contact information
- Medical information and medications
- Incident reports
- Service agreements

### Financial Records
Keep accurate records of:
- Rent and service fee payments
- Deposits and refunds
- Any financial assistance received

## Local Ordinances and Zoning

Check with your local municipality regarding:
- Zoning restrictions for residential care uses
- Business license requirements
- Parking and signage regulations
- Occupancy limits

## Emergency Preparedness

### Emergency Plans
Develop written plans for:
- Fire evacuation
- Medical emergencies
- Natural disasters
- Utility failures

### Staff Training
Ensure all caregivers are trained in:
- First aid and CPR
- Medication administration (if applicable)
- Emergency procedures
- Resident rights and dignity

## Resources and References

### State Resources
- ${stateName} Department of Health: www.state.gov/health
- ${stateName} Aging Services: Contact your local Area Agency on Aging

### Federal Resources
- Fair Housing Act: www.hud.gov/program_offices/fair_housing_equal_opp
- ADA Information: www.ada.gov

---

*This binder was last updated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}. Laws and regulations change frequently. Always verify current requirements with state and local authorities.*
`;
}

// ============================================================================
// MAIN SCRIPT
// ============================================================================

async function main() {
  console.log('============================================');
  console.log('INDEX COMPLIANCE BINDERS');
  console.log('============================================');
  console.log('');

  // Check if compliance directory exists
  if (!fs.existsSync(COMPLIANCE_DIR)) {
    console.log(`Compliance directory not found: ${COMPLIANCE_DIR}`);
    console.log('Creating directory and generating binders for all 51 states (50 + DC)...');

    fs.mkdirSync(COMPLIANCE_DIR, { recursive: true });

    // Generate binders for ALL 50 states + DC
    const allStates = Object.keys(STATE_NAMES);

    for (const stateCode of allStates) {
      const sampleContent = generateSampleBinder(stateCode);
      const filename = `${stateCode}_compliance_binder.md`;
      const filePath = path.join(COMPLIANCE_DIR, filename);

      fs.writeFileSync(filePath, sampleContent, 'utf-8');
      console.log(`  Created sample: ${filename}`);
    }

    console.log('');
    console.log(`All ${allStates.length} state binders created. Now indexing to database...`);
    console.log('');
  }

  // Get all markdown/text files in the compliance directory
  const files = fs.readdirSync(COMPLIANCE_DIR)
    .filter(f => f.endsWith('.md') || f.endsWith('.txt'))
    .map(f => path.join(COMPLIANCE_DIR, f));

  console.log(`Found ${files.length} binder file(s) to process.`);
  console.log('');

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const filePath of files) {
    const filename = path.basename(filePath);
    console.log(`Processing: ${filename}`);

    // Process the file
    const binderData = await processBinderFile(filePath);

    if (!binderData) {
      skipCount++;
      continue;
    }

    console.log(`  State: ${binderData.stateCode} (${binderData.stateName})`);
    console.log(`  Words: ${binderData.wordCount.toLocaleString()}`);
    console.log(`  Sections: ${binderData.sectionHeaders.length}`);

    // Upsert to database
    const success = await upsertBinder(binderData);

    if (success) {
      console.log(`  SUCCESS: Indexed ${binderData.stateCode}`);
      successCount++;
    } else {
      errorCount++;
    }

    console.log('');
  }

  // Summary
  console.log('============================================');
  console.log('SUMMARY');
  console.log('============================================');
  console.log(`  Processed: ${files.length} files`);
  console.log(`  Success:   ${successCount}`);
  console.log(`  Skipped:   ${skipCount}`);
  console.log(`  Errors:    ${errorCount}`);
  console.log('');

  // Verify database count
  const { count } = await supabase
    .from('state_compliance_binders')
    .select('*', { count: 'exact', head: true });

  console.log(`Total binders in database: ${count || 0}`);
  console.log('');
  console.log('Done!');
}

// Run the script
main().catch(console.error);
