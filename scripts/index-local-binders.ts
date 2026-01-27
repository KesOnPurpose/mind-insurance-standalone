// ============================================================================
// INDEX LOCAL COMPLIANCE BINDERS SCRIPT
// ============================================================================
// Script to import city, county, and state-level compliance binder documents.
// Inserts records into local_compliance_binders table.
//
// Source Documents (9 locations):
//   Cities (2):
//     - Pittsburgh, PA
//     - Linden, NJ
//   Counties (1):
//     - Queens County, NY
//   States (6):
//     - California
//     - Florida
//     - Georgia
//     - North Carolina
//     - South Carolina
//     - Texas
//
// Usage:
//   npx ts-node scripts/index-local-binders.ts
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

// Local binder document mapping
// Format: filename -> { location_name, location_type, state_code }
interface LocalBinderMapping {
  location_name: string;
  location_type: 'city' | 'county' | 'state';
  state_code: string;
}

const LOCAL_BINDER_FILES: Record<string, LocalBinderMapping> = {
  // Cities
  '_Pittsburgh, Pennsylvania_ Compliance Binder.md': {
    location_name: 'Pittsburgh',
    location_type: 'city',
    state_code: 'PA',
  },
  'Linden, New Jersey_ Compliance Binder.md': {
    location_name: 'Linden',
    location_type: 'city',
    state_code: 'NJ',
  },
  // Counties
  'Queens County, NY_ Compliance Binder.md': {
    location_name: 'Queens County',
    location_type: 'county',
    state_code: 'NY',
  },
  // States (6 new state-level binders)
  'California Compliance Binder, Zoning & Occupancy Framework, Shared Housing.md': {
    location_name: 'California',
    location_type: 'state',
    state_code: 'CA',
  },
  'Florida Compliance Binder_ Zoning & Occupancy Framework (Shared Housing).md': {
    location_name: 'Florida',
    location_type: 'state',
    state_code: 'FL',
  },
  'Georgia Compliance Binder – Zoning & Occupancy Framework.md': {
    location_name: 'Georgia',
    location_type: 'state',
    state_code: 'GA',
  },
  'North Carolina Compliance Binder – Zoning & Occupancy Framework.md': {
    location_name: 'North Carolina',
    location_type: 'state',
    state_code: 'NC',
  },
  'South Carolina Compliance Binder, Zoning & Occupancy Framework, Shared Housing.md': {
    location_name: 'South Carolina',
    location_type: 'state',
    state_code: 'SC',
  },
  'Texas Compliance Binder, Zoning & Occupancy Framework, Shared Housing (Expanded Cities).md': {
    location_name: 'Texas',
    location_type: 'state',
    state_code: 'TX',
  },
};

// State code to name mapping for titles
const STATE_CODE_TO_NAME: Record<string, string> = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
  'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
  'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
  'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
  'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
  'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
  'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
  'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
  'DC': 'District of Columbia',
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
 * Check if a file is a local compliance binder
 */
function isLocalBinderDocument(filename: string): boolean {
  return LOCAL_BINDER_FILES.hasOwnProperty(filename);
}

/**
 * Get local binder mapping from filename
 */
function getLocalBinderMapping(filename: string): LocalBinderMapping | null {
  return LOCAL_BINDER_FILES[filename] || null;
}

/**
 * Generate title for local binder
 */
function generateTitle(locationName: string, locationType: 'city' | 'county' | 'state', stateCode: string): string {
  const stateName = STATE_CODE_TO_NAME[stateCode] || stateCode;

  // For state binders, just use "State Compliance Binder"
  if (locationType === 'state') {
    return `${locationName} State Compliance Binder`;
  }

  // For counties, the location_name already includes "County"
  if (locationType === 'county') {
    return `${locationName}, ${stateName} Compliance Binder`;
  }

  // For cities
  return `${locationName}, ${stateName} Compliance Binder`;
}

/**
 * Upsert local binder into database
 */
async function upsertLocalBinder(
  locationName: string,
  locationType: 'city' | 'county' | 'state',
  stateCode: string,
  title: string,
  content: string,
  sectionHeaders: Array<{ id: string; title: string; level: number }>,
  wordCount: number
): Promise<boolean> {
  // Try to update first (if exists)
  const { data: existingData, error: checkError } = await supabase
    .from('local_compliance_binders')
    .select('id')
    .eq('location_name', locationName)
    .eq('state_code', stateCode)
    .single();

  if (existingData) {
    // Update existing record
    const { error: updateError } = await supabase
      .from('local_compliance_binders')
      .update({
        location_type: locationType,
        title,
        content,
        word_count: wordCount,
        section_headers: sectionHeaders,
        metadata: {
          indexed_at: new Date().toISOString(),
          source: 'index-local-binders script',
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingData.id);

    if (updateError) {
      console.error(`  ERROR: Failed to update ${locationName}, ${stateCode}:`, updateError.message);
      return false;
    }
    console.log(`  Updated existing record`);
    return true;
  }

  // Insert new record
  const { error: insertError } = await supabase
    .from('local_compliance_binders')
    .insert({
      location_name: locationName,
      location_type: locationType,
      state_code: stateCode,
      title,
      content,
      word_count: wordCount,
      section_headers: sectionHeaders,
      metadata: {
        indexed_at: new Date().toISOString(),
        source: 'index-local-binders script',
      },
    });

  if (insertError) {
    console.error(`  ERROR: Failed to insert ${locationName}, ${stateCode}:`, insertError.message);
    return false;
  }

  console.log(`  Inserted new record`);
  return true;
}

// ============================================================================
// MAIN SCRIPT
// ============================================================================

async function main() {
  console.log('============================================');
  console.log('INDEX LOCAL COMPLIANCE BINDERS');
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

  // Filter to only local binder documents
  const localBinderFiles = allFiles.filter(f => isLocalBinderDocument(f));

  console.log(`Found ${localBinderFiles.length} local binder document(s) to process.`);
  console.log('');

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const filename of localBinderFiles) {
    console.log(`Processing: ${filename}`);

    const filePath = path.join(SOURCE_DIR, filename);
    const mapping = getLocalBinderMapping(filename);

    if (!mapping) {
      console.log(`  SKIP: Could not find mapping for file`);
      skipCount++;
      continue;
    }

    const { location_name, location_type, state_code } = mapping;
    const typeLabel = location_type === 'city' ? '🏙️ City' : location_type === 'county' ? '🗺️ County' : '🏛️ State';

    console.log(`  Location: ${location_name}, ${state_code} (${typeLabel})`);

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
    const title = generateTitle(location_name, location_type, state_code);

    console.log(`  Title: ${title}`);
    console.log(`  Words: ${wordCount.toLocaleString()}`);
    console.log(`  Sections: ${sectionHeaders.length}`);

    // Upsert to database
    const success = await upsertLocalBinder(
      location_name,
      location_type,
      state_code,
      title,
      content,
      sectionHeaders,
      wordCount
    );

    if (success) {
      console.log(`  SUCCESS: Indexed ${location_name}, ${state_code}`);
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
  console.log(`  Processed: ${localBinderFiles.length} files`);
  console.log(`  Success:   ${successCount}`);
  console.log(`  Skipped:   ${skipCount}`);
  console.log(`  Errors:    ${errorCount}`);
  console.log('');

  // Verify database count
  const { data, error } = await supabase
    .from('local_compliance_binders')
    .select('location_name, state_code, location_type, word_count');

  if (!error && data) {
    console.log(`Local binders in database: ${data.length}`);
    console.log('');
    console.log('Location                 | State | Type   | Words');
    console.log('-------------------------|-------|--------|-------');
    data.forEach(d => {
      const name = d.location_name.padEnd(24);
      const state = d.state_code.padEnd(5);
      const type = d.location_type.padEnd(6);
      const words = (d.word_count || 0).toLocaleString();
      console.log(`${name} | ${state} | ${type} | ${words}`);
    });
  }

  console.log('');
  console.log('Done!');
}

// Run the script
main().catch(console.error);
