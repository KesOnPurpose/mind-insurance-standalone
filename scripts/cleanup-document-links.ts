/**
 * Cleanup Document Links Script
 *
 * Purpose: Delete all auto-linked document-tactic relationships
 * Reason: 40% confidence auto-links created poor quality matches
 * Result: Clean slate for manual curation
 *
 * Usage: npm run tsx scripts/cleanup-document-links.ts
 */

import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import * as path from 'path';

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

async function cleanupDocumentLinks() {
  console.log('🧹 Starting Document Links Cleanup...\n');

  // Get current count
  const { count: beforeCount, error: countError } = await supabase
    .from('gh_document_tactic_links')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('❌ Error counting existing links:', countError);
    process.exit(1);
  }

  console.log(`📊 Current state:`);
  console.log(`   - Total document-tactic links: ${beforeCount}\n`);

  if (beforeCount === 0) {
    console.log('✅ No links to clean up. Database is already empty.\n');
    return;
  }

  // Confirm deletion
  console.log('⚠️  WARNING: This will delete ALL document-tactic links!\n');
  console.log('   Reason: Auto-linked documents have poor quality matches (40% confidence)');
  console.log('   Action: Starting fresh for manual curation\n');

  // Delete all links
  console.log('🗑️  Deleting all links...');
  const { error: deleteError } = await supabase
    .from('gh_document_tactic_links')
    .delete()
    .neq('id', 0); // Delete all rows (neq 0 matches everything)

  if (deleteError) {
    console.error('❌ Error deleting links:', deleteError);
    process.exit(1);
  }

  // Verify deletion
  const { count: afterCount, error: verifyError } = await supabase
    .from('gh_document_tactic_links')
    .select('*', { count: 'exact', head: true });

  if (verifyError) {
    console.error('❌ Error verifying deletion:', verifyError);
    process.exit(1);
  }

  console.log(`\n📊 Cleanup Results:`);
  console.log(`   ✅ Deleted: ${beforeCount} links`);
  console.log(`   ✅ Remaining: ${afterCount} links`);
  console.log(`   📈 Success rate: ${afterCount === 0 ? '100%' : 'FAILED - links still exist!'}\n`);

  if (afterCount === 0) {
    console.log('🎉 Cleanup complete!');
    console.log('   Database is now clean and ready for manual document linking.\n');
    console.log('💡 Next steps:');
    console.log('   1. Go to /resources page to browse documents');
    console.log('   2. Click documents to open linking modal');
    console.log('   3. Manually link documents to relevant tactics');
    console.log('   4. Training Materials will appear only for linked documents\n');
  } else {
    console.log('❌ Cleanup failed! Some links were not deleted.');
    console.log(`   Remaining links: ${afterCount}`);
    process.exit(1);
  }
}

// Run the script
cleanupDocumentLinks()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
