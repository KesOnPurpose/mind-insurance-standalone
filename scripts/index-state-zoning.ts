// ============================================================================
// INDEX STATE ZONING DOCUMENTS SCRIPT
// ============================================================================
// Script to import state-level zoning/occupancy framework documents.
// Updates existing state_compliance_binders records with zoning_content.
//
// Source Documents (6 states):
//   - California, Florida, Georgia, North Carolina, South Carolina, Texas
//
// Usage:
//   npx ts-node scripts/index-state-zoning.ts
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

// Source directory for compliance documents
const SOURCE_DIR = '/Users/kesonpurpose/Downloads/UIB ASSETS/Cursor App Build/ASSETS/Nette/Curriculum/Mentorship-Program/From Nov/Compliance Part 2';

// State name to code mapping (reverse lookup)
const STATE_NAME_TO_CODE: Record<string, string> = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
  'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
  'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
  'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
  'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS', 'missouri': 'MO',
  'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
  'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH',
  'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT', 'vermont': 'VT',
  'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY',
  'district of columbia': 'DC',
};

// Zoning document file patterns
const ZONING_FILES: Record<string, string> = {
  'California Compliance Binder, Zoning & Occupancy Framework, Shared Housing.md': 'CA',
  'Florida Compliance Binder_ Zoning & Occupancy Framework (Shared Housing).md': 'FL',
  'Georgia Compliance Binder – Zoning & Occupancy Framework.md': 'GA',
  'North Carolina Compliance Binder – Zoning & Occupancy Framework.md': 'NC',
  'South Carolina Compliance Binder, Zoning & Occupancy Framework, Shared Housing.md': 'SC',
  'Texas Compliance Binder, Zoning & Occupancy Framework, Shared Housing (Expanded Cities).md': 'TX',
};

// ============================================================================
// INITIALIZE SUPABASE CLIENT
// ============================================================================

if (!SUPABASE_SERVICE_KEY) {
  console.error('ERROR: SUPABASE_SERVICE_KEY environment variable is required');
  console.error('');
  console.error('Set it in your environment:');
  console.error('  export SUPABASE_SERVICE_KEY="your_service_role_key"');
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
  // Check explicit mapping first
  if (ZONING_FILES[filename]) {
    return ZONING_FILES[filename];
  }

  // Fallback: search for state name in filename
  const lowerFilename = filename.toLowerCase();
  for (const [stateName, code] of Object.entries(STATE_NAME_TO_CODE)) {
    if (lowerFilename.includes(stateName.replace(/\s+/g, ' ')) ||
        lowerFilename.includes(stateName.replace(/\s+/g, '-')) ||
        lowerFilename.includes(stateName.replace(/\s+/g, '_'))) {
      return code;
    }
  }

  return null;
}

/**
 * Check if a file is a state zoning document
 */
function isZoningDocument(filename: string): boolean {
  const lower = filename.toLowerCase();
  return lower.includes('zoning') && lower.includes('occupancy') && !lower.includes('pittsburgh') && !lower.includes('queens') && !lower.includes('linden');
}

/**
 * Update state binder with zoning content
 */
async function updateStateZoning(
  stateCode: string,
  zoningContent: string,
  zoningHeaders: Array<{ id: string; title: string; level: number }>,
  zoningWordCount: number
): Promise<boolean> {
  const { data, error } = await supabase
    .from('state_compliance_binders')
    .update({
      zoning_content: zoningContent,
      zoning_section_headers: zoningHeaders,
      zoning_word_count: zoningWordCount,
      updated_at: new Date().toISOString(),
    })
    .eq('state_code', stateCode)
    .select('id, state_code')
    .single();

  if (error) {
    // Check if it's a "no rows found" error
    if (error.code === 'PGRST116') {
      console.log(`  WARN: No existing binder for ${stateCode} - creating new record...`);

      // Create a new state binder with zoning content
      const { data: insertData, error: insertError } = await supabase
        .from('state_compliance_binders')
        .insert({
          state_code: stateCode,
          state_name: getStateName(stateCode),
          title: `${getStateName(stateCode)} Compliance Binder`,
          content: '', // Empty general content for now
          zoning_content: zoningContent,
          zoning_section_headers: zoningHeaders,
          zoning_word_count: zoningWordCount,
          word_count: 0,
          section_headers: [],
          metadata: {
            zoning_indexed_at: new Date().toISOString(),
            source: 'index-state-zoning script',
          },
          last_updated: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error(`  ERROR: Failed to insert ${stateCode}:`, insertError.message);
        return false;
      }
      return true;
    }

    console.error(`  ERROR: Failed to update ${stateCode}:`, error.message);
    return false;
  }

  return true;
}

/**
 * Get state name from code
 */
function getStateName(code: string): string {
  const reverseMap: Record<string, string> = {};
  for (const [name, c] of Object.entries(STATE_NAME_TO_CODE)) {
    reverseMap[c] = name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
  return reverseMap[code] || code;
}

// ============================================================================
// MAIN SCRIPT
// ============================================================================

async function main() {
  console.log('============================================');
  console.log('INDEX STATE ZONING DOCUMENTS');
  console.log('============================================');
  console.log('');
  console.log(`Source Directory: ${SOURCE_DIR}`);
  console.log('');

  // Check if source directory exists
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`ERROR: Source directory not found: ${SOURCE_DIR}`);
    process.exit(1);
  }

  // Get all markdown files
  const allFiles = fs.readdirSync(SOURCE_DIR).filter(f => f.endsWith('.md'));

  // Filter to only zoning documents (not local binders)
  const zoningFiles = allFiles.filter(f => isZoningDocument(f));

  console.log(`Found ${zoningFiles.length} state zoning document(s) to process.`);
  console.log('');

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const filename of zoningFiles) {
    console.log(`Processing: ${filename}`);

    const filePath = path.join(SOURCE_DIR, filename);
    const stateCode = detectStateFromFilename(filename);

    if (!stateCode) {
      console.log(`  SKIP: Could not detect state from filename`);
      skipCount++;
      continue;
    }

    console.log(`  State: ${stateCode} (${getStateName(stateCode)})`);

    // Read file content
    const content = fs.readFileSync(filePath, 'utf-8');

    if (!content.trim()) {
      console.log(`  SKIP: Empty file`);
      skipCount++;
      continue;
    }

    // Extract metadata
    const wordCount = countWords(content);
    const sectionHeaders = extractSectionHeaders(content);

    console.log(`  Words: ${wordCount.toLocaleString()}`);
    console.log(`  Sections: ${sectionHeaders.length}`);

    // Update database
    const success = await updateStateZoning(stateCode, content, sectionHeaders, wordCount);

    if (success) {
      console.log(`  SUCCESS: Indexed zoning content for ${stateCode}`);
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
  console.log(`  Processed: ${zoningFiles.length} files`);
  console.log(`  Success:   ${successCount}`);
  console.log(`  Skipped:   ${skipCount}`);
  console.log(`  Errors:    ${errorCount}`);
  console.log('');

  // Verify database count
  const { data, error } = await supabase
    .from('state_compliance_binders')
    .select('state_code, zoning_word_count')
    .not('zoning_content', 'is', null);

  if (!error && data) {
    console.log(`States with zoning content: ${data.length}`);
    console.log(`States: ${data.map(d => d.state_code).join(', ')}`);
  }

  console.log('');
  console.log('Done!');
}

// Run the script
main().catch(console.error);
