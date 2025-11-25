/**
 * Process Review Queue Script
 *
 * Purpose: Auto-approve document-tactic links from review queue CSV
 * Confidence threshold: 50%+ (auto-approve as "supplemental" links)
 * Expected: ~4,000 new document-tactic links
 *
 * Usage: npm run tsx scripts/process-review-queue.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';

// ESM module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration - use service key to bypass RLS
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://hpyodaugrkctagkrfofj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseKey) {
  console.error('ERROR: SUPABASE_SERVICE_KEY or VITE_SUPABASE_ANON_KEY not found in environment');
  console.error('       This script requires service key to bypass RLS policies');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface ReviewQueueRow {
  'Document ID': string;
  'Document Name': string;
  'Tactic ID': string;
  'Tactic Name': string;
  'Confidence': string;
  'Suggested Link Type': string;
  'Match Reasons': string;
}

interface LinkToInsert {
  document_id: number;
  tactic_id: string;
  link_type: 'required' | 'recommended' | 'supplemental';
  display_order: number;
}

async function processReviewQueue() {
  console.log('🚀 Starting Review Queue Processor...\n');

  // Read CSV file
  const csvPath = path.join(__dirname, 'review-queue.csv');
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ ERROR: review-queue.csv not found at ${csvPath}`);
    process.exit(1);
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const rows = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
    escape: '\\',
    quote: '"',
  }) as ReviewQueueRow[];

  console.log(`📄 Loaded ${rows.length} rows from review queue CSV\n`);

  // Filter by confidence threshold (40%+ for supplemental links)
  const CONFIDENCE_THRESHOLD = 40;
  const approvedRows = rows.filter(row => {
    const confidence = parseInt(row.Confidence);
    return !isNaN(confidence) && confidence >= CONFIDENCE_THRESHOLD;
  });

  console.log(`✅ ${approvedRows.length} rows meet ${CONFIDENCE_THRESHOLD}% confidence threshold`);
  console.log(`❌ ${rows.length - approvedRows.length} rows below threshold (will be skipped)\n`);

  // Check for existing links to avoid duplicates
  console.log('🔍 Checking for existing links in database...');
  const { data: existingLinks, error: fetchError } = await supabase
    .from('gh_document_tactic_links')
    .select('document_id, tactic_id');

  if (fetchError) {
    console.error('❌ Error fetching existing links:', fetchError);
    process.exit(1);
  }

  const existingLinkSet = new Set(
    (existingLinks || []).map(link => `${link.document_id}-${link.tactic_id}`)
  );

  console.log(`📊 Found ${existingLinks?.length || 0} existing document-tactic links\n`);

  // Prepare links to insert (deduplicate and exclude existing)
  const linksMap = new Map<string, LinkToInsert>();
  let duplicateCount = 0;
  let alreadyLinkedCount = 0;

  for (const row of approvedRows) {
    const documentId = parseInt(row['Document ID']);
    const tacticId = row['Tactic ID'];
    const confidence = parseInt(row.Confidence);
    const linkKey = `${documentId}-${tacticId}`;

    // Skip if already exists in database
    if (existingLinkSet.has(linkKey)) {
      alreadyLinkedCount++;
      continue;
    }

    // Skip if we've already queued this link (CSV duplicates)
    if (linksMap.has(linkKey)) {
      duplicateCount++;
      continue;
    }

    // Determine link type based on confidence
    let linkType: 'required' | 'recommended' | 'supplemental' = 'supplemental';
    if (confidence >= 80) {
      linkType = 'required';
    } else if (confidence >= 65) {
      linkType = 'recommended';
    }

    linksMap.set(linkKey, {
      document_id: documentId,
      tactic_id: tacticId,
      link_type: linkType,
      display_order: 0, // Will be set based on link_type
    });
  }

  const linksToInsert = Array.from(linksMap.values());

  console.log(`📝 Summary:`);
  console.log(`   - New links to insert: ${linksToInsert.length}`);
  console.log(`   - Already linked (skipped): ${alreadyLinkedCount}`);
  console.log(`   - CSV duplicates (skipped): ${duplicateCount}`);
  console.log(`   - Total processed: ${approvedRows.length}\n`);

  if (linksToInsert.length === 0) {
    console.log('✅ No new links to insert. All approved matches already exist in database.');
    return;
  }

  // Group by link type for display_order assignment
  const requiredLinks = linksToInsert.filter(l => l.link_type === 'required');
  const recommendedLinks = linksToInsert.filter(l => l.link_type === 'recommended');
  const supplementalLinks = linksToInsert.filter(l => l.link_type === 'supplemental');

  // Assign display_order within each link type
  requiredLinks.forEach((link, index) => link.display_order = index);
  recommendedLinks.forEach((link, index) => link.display_order = index);
  supplementalLinks.forEach((link, index) => link.display_order = index);

  console.log(`📊 Link Type Breakdown:`);
  console.log(`   - Required (80%+): ${requiredLinks.length}`);
  console.log(`   - Recommended (65-79%): ${recommendedLinks.length}`);
  console.log(`   - Supplemental (50-64%): ${supplementalLinks.length}\n`);

  // Insert in batches to avoid overwhelming database
  const BATCH_SIZE = 100;
  let insertedCount = 0;
  let errorCount = 0;

  console.log(`🔄 Inserting links in batches of ${BATCH_SIZE}...\n`);

  for (let i = 0; i < linksToInsert.length; i += BATCH_SIZE) {
    const batch = linksToInsert.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(linksToInsert.length / BATCH_SIZE);

    process.stdout.write(`   Batch ${batchNum}/${totalBatches} (${batch.length} links)... `);

    const { data, error } = await supabase
      .from('gh_document_tactic_links')
      .insert(batch)
      .select();

    if (error) {
      console.log(`❌ ERROR`);
      console.error(`   Error details:`, error);
      errorCount += batch.length;
    } else {
      console.log(`✅ SUCCESS (${data?.length || 0} inserted)`);
      insertedCount += data?.length || 0;
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n📊 Final Results:`);
  console.log(`   ✅ Successfully inserted: ${insertedCount} links`);
  console.log(`   ❌ Failed: ${errorCount} links`);
  console.log(`   📈 Success rate: ${((insertedCount / linksToInsert.length) * 100).toFixed(1)}%\n`);

  if (insertedCount > 0) {
    console.log('🎉 Review queue processing complete!');
    console.log('   Users should now see documents in the Training Materials section.\n');
  }

  // Show sample of inserted links
  if (insertedCount > 0) {
    console.log('📋 Sample of inserted links:');
    const sampleLinks = linksToInsert.slice(0, 5);
    for (const link of sampleLinks) {
      console.log(`   - Doc ${link.document_id} → Tactic ${link.tactic_id} (${link.link_type})`);
    }
    if (linksToInsert.length > 5) {
      console.log(`   ... and ${linksToInsert.length - 5} more`);
    }
  }
}

// Run the script
processReviewQueue()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
