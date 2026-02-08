/**
 * One-Time Embedding Backfill Script for Nette Knowledge Chunks
 *
 * Generates OpenAI embeddings for all chunks in nette_knowledge_chunks
 * that currently have NULL embeddings.
 *
 * Usage:
 *   npx tsx scripts/backfill-nette-embeddings.ts
 *
 * Or with environment variables:
 *   OPENAI_API_KEY=xxx SUPABASE_SERVICE_KEY=xxx npx tsx scripts/backfill-nette-embeddings.ts
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '$OPENAI_API_KEY';
const SUPABASE_URL = 'https://hpyodaugrkctagkrfofj.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '$SUPABASE_SERVICE_ROLE_KEY';

const EMBEDDING_MODEL = 'text-embedding-3-small';
const BATCH_SIZE = 20; // Process 20 chunks at a time to avoid rate limits

interface Chunk {
  id: string;
  chunk_text: string;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getChunksWithoutEmbeddings(): Promise<Chunk[]> {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/nette_knowledge_chunks?select=id,chunk_text&embedding=is.null`,
    {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch chunks: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: text
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errText}`);
  }

  const data = await response.json();

  if (!data.data?.[0]?.embedding) {
    throw new Error('No embedding in OpenAI response');
  }

  return data.data[0].embedding;
}

async function updateChunkEmbedding(id: string, embedding: number[]): Promise<void> {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/nette_knowledge_chunks?id=eq.${id}`,
    {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ embedding: JSON.stringify(embedding) })
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to update chunk ${id}: ${response.status} ${await response.text()}`);
  }
}

async function main(): Promise<void> {
  console.log('='.repeat(60));
  console.log('NETTE KNOWLEDGE CHUNKS - EMBEDDING BACKFILL');
  console.log('='.repeat(60));
  console.log(`Model: ${EMBEDDING_MODEL}`);
  console.log(`Batch Size: ${BATCH_SIZE}`);
  console.log('');

  // Get all chunks without embeddings
  console.log('Fetching chunks without embeddings...');
  const chunks = await getChunksWithoutEmbeddings();

  if (chunks.length === 0) {
    console.log('All chunks already have embeddings!');
    return;
  }

  console.log(`Found ${chunks.length} chunks to process\n`);

  let processed = 0;
  let errors = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const progress = `[${i + 1}/${chunks.length}]`;

    try {
      // Generate embedding
      const embedding = await generateEmbedding(chunk.chunk_text);

      // Update in database
      await updateChunkEmbedding(chunk.id, embedding);

      processed++;
      console.log(`${progress} ✓ Chunk ${chunk.id.slice(0, 8)}... (${embedding.length} dims)`);

      // Rate limiting: pause every BATCH_SIZE chunks
      if ((i + 1) % BATCH_SIZE === 0 && i + 1 < chunks.length) {
        console.log(`\n--- Pausing for rate limit (processed ${i + 1}/${chunks.length}) ---\n`);
        await sleep(1000); // 1 second pause between batches
      }
    } catch (error) {
      errors++;
      console.error(`${progress} ✗ Chunk ${chunk.id.slice(0, 8)}... Error: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total chunks: ${chunks.length}`);
  console.log(`Processed:    ${processed}`);
  console.log(`Errors:       ${errors}`);
  console.log(`Success rate: ${((processed / chunks.length) * 100).toFixed(1)}%`);
  console.log('='.repeat(60));
}

// Run the script
main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
