// ============================================================================
// SEED TRIAGE KEYWORDS INTO SUPABASE
// ============================================================================
// Reads relational-safety-keywords.ts and inserts all keywords into
// mio_triage_keywords table via Supabase REST API.
//
// Usage: npx tsx scripts/seed-triage-keywords.ts
// ============================================================================

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://hpyodaugrkctagkrfofj.supabase.co',
  '$SUPABASE_SERVICE_ROLE_KEY'
);

// Import the keywords from the source of truth
import { ALL_TRIAGE_KEYWORDS } from '../src/services/relational-safety-keywords.js';

async function main() {
  console.log('='.repeat(60));
  console.log('TRIAGE KEYWORDS SEEDER');
  console.log('='.repeat(60));

  // Check if already populated
  const { count } = await supabase
    .from('mio_triage_keywords')
    .select('id', { count: 'exact', head: true });

  if (count && count > 0) {
    console.log(`Already populated: ${count} keywords exist. Skipping.`);
    return;
  }

  console.log(`Inserting ${ALL_TRIAGE_KEYWORDS.length} triage keywords...`);

  // Map to DB schema
  const records = ALL_TRIAGE_KEYWORDS.map(kw => ({
    keyword: kw.keyword,
    triage_color: kw.triage_color,
    category: kw.category,
    match_type: kw.match_type,
    priority: kw.priority,
    response_guidance: kw.response_guidance,
    referral_type: kw.referral_type || null,
    is_active: true,
  }));

  // Insert in batches of 50
  const BATCH = 50;
  let inserted = 0;

  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH);
    const { error } = await supabase.from('mio_triage_keywords').insert(batch);

    if (error) {
      console.error(`Batch ${Math.floor(i / BATCH) + 1} FAILED: ${error.message}`);
    } else {
      inserted += batch.length;
    }
  }

  console.log(`\nInserted: ${inserted}/${ALL_TRIAGE_KEYWORDS.length}`);

  // Verify
  const { count: finalCount } = await supabase
    .from('mio_triage_keywords')
    .select('id', { count: 'exact', head: true });

  console.log(`Verification: ${finalCount} keywords in mio_triage_keywords`);

  // Breakdown by color
  for (const color of ['red', 'orange', 'yellow', 'green']) {
    const { count: c } = await supabase
      .from('mio_triage_keywords')
      .select('id', { count: 'exact', head: true })
      .eq('triage_color', color);
    console.log(`  ${color.toUpperCase()}: ${c}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('TRIAGE KEYWORDS SEED COMPLETE');
  console.log('='.repeat(60));
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
