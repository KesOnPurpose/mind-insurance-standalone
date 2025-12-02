// ============================================================================
// WEEK 1 MENTORSHIP EMBEDDINGS GENERATION SCRIPT
// ============================================================================
// Purpose: Generate OpenAI embeddings for Week 1 knowledge chunks
// Updates zero-vector placeholders with real embeddings for RAG search
//
// Usage:
// 1. Set environment variables: SUPABASE_SERVICE_KEY, OPENAI_API_KEY
// 2. Run: npx tsx scripts/generate-week1-embeddings.ts
//
// Expected: 28 chunks updated with embeddings
// ============================================================================

import { createClient } from '@supabase/supabase-js';

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUPABASE_URL = 'https://hpyodaugrkctagkrfofj.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ ERROR: SUPABASE_SERVICE_KEY environment variable not set');
  process.exit(1);
}

if (!OPENAI_API_KEY) {
  console.error('❌ ERROR: OPENAI_API_KEY environment variable not set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ============================================================================
// OPENAI EMBEDDING GENERATION
// ============================================================================

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

// Rate limiting helper
async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// MAIN PROCESSING PIPELINE
// ============================================================================

async function main() {
  console.log('\n🚀 STARTING WEEK 1 EMBEDDINGS GENERATION\n');
  console.log('═'.repeat(70));

  // ============================================================================
  // STEP 1: Fetch all Week 1 chunks with zero-vector embeddings
  // ============================================================================

  console.log('\n📚 STEP 1: FETCHING WEEK 1 KNOWLEDGE CHUNKS\n');

  const { data: chunks, error: fetchError } = await supabase
    .from('gh_training_chunks')
    .select('id, chunk_index, chunk_text, chunk_topic, source_file, mentorship_week')
    .eq('mentorship_week', 1)
    .eq('source_file', 'Week_1_Session_1_Transcript.md')
    .order('chunk_index', { ascending: true });

  if (fetchError) {
    console.error('❌ ERROR fetching chunks:', fetchError);
    process.exit(1);
  }

  if (!chunks || chunks.length === 0) {
    console.error('❌ ERROR: No Week 1 chunks found in database');
    console.error('   Make sure you ran migration 20251201000004_insert_week1_knowledge_chunks.sql first');
    process.exit(1);
  }

  console.log(`✅ Found ${chunks.length} Week 1 chunks to process\n`);

  // ============================================================================
  // STEP 2: Generate embeddings and update database
  // ============================================================================

  console.log('═'.repeat(70));
  console.log('\n🧠 STEP 2: GENERATING EMBEDDINGS & UPDATING DATABASE\n');

  let processed = 0;
  let errors = 0;
  const startTime = Date.now();

  for (const chunk of chunks) {
    try {
      console.log(`Processing chunk ${chunk.chunk_index}/28: ${chunk.chunk_topic}`);

      // Generate embedding
      const embedding = await generateEmbedding(chunk.chunk_text);

      // Update database with real embedding
      const { error: updateError } = await supabase
        .from('gh_training_chunks')
        .update({
          embedding: `[${embedding.join(',')}]`
        })
        .eq('id', chunk.id);

      if (updateError) {
        console.error(`   ❌ Error updating chunk ${chunk.chunk_index}: ${updateError.message}`);
        errors++;
      } else {
        processed++;
        console.log(`   ✅ Chunk ${chunk.chunk_index} updated successfully`);
      }

      // Rate limit: 3 requests per second for OpenAI (tier 1)
      // 350ms = ~2.86 requests/second (safe margin)
      await sleep(350);

    } catch (error) {
      console.error(`   ❌ Error processing chunk ${chunk.chunk_index}:`, error);
      errors++;
    }
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  // ============================================================================
  // STEP 3: Verification
  // ============================================================================

  console.log('\n═'.repeat(70));
  console.log('\n✅ EMBEDDINGS GENERATION COMPLETE!\n');
  console.log('📊 FINAL STATISTICS:');
  console.log(`   • Total chunks: ${chunks.length}`);
  console.log(`   • Successfully processed: ${processed}`);
  console.log(`   • Errors: ${errors}`);
  console.log(`   • Processing time: ${duration}s`);
  console.log(`   • Average time per chunk: ${(parseFloat(duration) / chunks.length).toFixed(2)}s`);

  if (processed === chunks.length) {
    console.log('\n🎉 All Week 1 knowledge chunks now have embeddings!');
    console.log('   They will now appear in RAG search results.');
  } else {
    console.log(`\n⚠️  WARNING: ${errors} chunks failed to process`);
    console.log('   Review errors above and re-run script if needed.');
  }

  console.log('═'.repeat(70) + '\n');
}

// ============================================================================
// EXECUTION
// ============================================================================

main().catch(error => {
  console.error('\n❌ FATAL ERROR:', error);
  process.exit(1);
});
