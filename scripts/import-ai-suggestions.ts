/**
 * Import AI Suggestions from review-queue.csv
 *
 * This script reads the review-queue.csv file and imports the data
 * into the gh_document_tactic_suggestions table for use in the
 * DocumentTacticLinker modal.
 *
 * Run with: npx tsx scripts/import-ai-suggestions.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase configuration
const SUPABASE_URL = 'https://hpyodaugrkctagkrfofj.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhweW9kYXVncmtjdGFna3Jmb2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODc4NjYyMiwiZXhwIjoyMDc0MzYyNjIyfQ.wRAsxPF9-mnl_O6nfK_9yog5IopYN42-bUd1ymLtVBQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface CSVRow {
  documentId: number;
  documentName: string;
  tacticId: string;
  tacticName: string;
  confidence: number;
  suggestedLinkType: string;
  matchReasons: string;
}

/**
 * Parse CSV file
 */
function parseCSV(filePath: string): CSVRow[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const rows: CSVRow[] = [];

  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse CSV (handle quoted fields)
    const parts: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        parts.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    parts.push(current.trim());

    if (parts.length >= 7) {
      rows.push({
        documentId: parseInt(parts[0]),
        documentName: parts[1].replace(/^"|"$/g, ''), // Remove quotes
        tacticId: parts[2].replace(/^"|"$/g, ''),
        tacticName: parts[3].replace(/^"|"$/g, ''),
        confidence: parseInt(parts[4]),
        suggestedLinkType: parts[5].replace(/^"|"$/g, '') as 'required' | 'recommended' | 'supplemental',
        matchReasons: parts[6].replace(/^"|"$/g, ''),
      });
    }
  }

  return rows;
}

/**
 * Import suggestions to Supabase
 */
async function importSuggestions() {
  console.log('Starting AI suggestions import...\n');

  const csvPath = path.join(__dirname, 'review-queue.csv');

  if (!fs.existsSync(csvPath)) {
    console.error(`Error: CSV file not found at ${csvPath}`);
    process.exit(1);
  }

  console.log(`Reading CSV from: ${csvPath}`);
  const rows = parseCSV(csvPath);
  console.log(`Found ${rows.length} suggestions to import\n`);

  // Clear existing suggestions
  console.log('Clearing existing suggestions...');
  const { error: deleteError } = await supabase
    .from('gh_document_tactic_suggestions')
    .delete()
    .neq('id', 0); // Delete all rows

  if (deleteError) {
    console.warn('Warning: Could not clear existing suggestions:', deleteError.message);
  } else {
    console.log('Existing suggestions cleared\n');
  }

  // Insert in batches of 100
  const batchSize = 100;
  let totalInserted = 0;
  let totalErrors = 0;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);

    const insertData = batch.map((row) => ({
      document_id: row.documentId,
      tactic_id: row.tacticId,
      tactic_name: row.tacticName,
      confidence: row.confidence,
      suggested_link_type: row.suggestedLinkType,
      match_reasons: row.matchReasons,
    }));

    const { data, error } = await supabase
      .from('gh_document_tactic_suggestions')
      .insert(insertData)
      .select();

    if (error) {
      console.error(`Batch ${Math.floor(i / batchSize) + 1} failed:`, error.message);
      totalErrors += batch.length;
    } else {
      totalInserted += data?.length || 0;
      console.log(`Batch ${Math.floor(i / batchSize) + 1}: Inserted ${data?.length || 0} suggestions`);
    }
  }

  console.log('\n--- Import Summary ---');
  console.log(`Total suggestions in CSV: ${rows.length}`);
  console.log(`Successfully inserted: ${totalInserted}`);
  console.log(`Failed: ${totalErrors}`);
  console.log('Import complete!');
}

// Run the import
importSuggestions().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
