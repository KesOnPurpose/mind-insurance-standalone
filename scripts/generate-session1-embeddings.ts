// Generate Embeddings for Session 1 Chunks in nette_knowledge_chunks
// Run: OPENAI_API_KEY=your_key SUPABASE_SERVICE_KEY=your_key npx ts-node scripts/generate-session1-embeddings.ts

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hpyodaugrkctagkrfofj.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_KEY environment variable required');
  process.exit(1);
}

if (!OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY environment variable required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

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
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

async function main() {
  console.log('🚀 Generating embeddings for Session 1 chunks in nette_knowledge_chunks...\n');

  // Fetch all Session 1 chunks without embeddings
  const { data: chunks, error: fetchError } = await supabase
    .from('nette_knowledge_chunks')
    .select('id, chunk_text, chunk_summary, source_file')
    .ilike('source_file', '%Session 1%')
    .is('embedding', null);

  if (fetchError) {
    console.error('❌ Error fetching chunks:', fetchError.message);
    process.exit(1);
  }

  if (!chunks || chunks.length === 0) {
    console.log('✅ No Session 1 chunks found without embeddings. All done!');
    return;
  }

  console.log(`📚 Found ${chunks.length} Session 1 chunks without embeddings\n`);

  let processed = 0;
  let errors = 0;

  for (const chunk of chunks) {
    try {
      console.log(`   Processing ${processed + 1}/${chunks.length}: ${chunk.chunk_summary?.substring(0, 50) || chunk.id}...`);

      // Generate embedding
      const embedding = await generateEmbedding(chunk.chunk_text);

      // Update the chunk with embedding
      const { error: updateError } = await supabase
        .from('nette_knowledge_chunks')
        .update({ embedding: `[${embedding.join(',')}]` })
        .eq('id', chunk.id);

      if (updateError) {
        console.error(`   ❌ Failed to update chunk ${chunk.id}:`, updateError.message);
        errors++;
      } else {
        processed++;
        console.log(`   ✅ Chunk ${chunk.id} embedded successfully`);
      }

      // Rate limiting - wait 200ms between API calls
      await new Promise(resolve => setTimeout(resolve, 200));

    } catch (error) {
      console.error(`   ❌ Error processing chunk ${chunk.id}:`, error);
      errors++;
    }
  }

  console.log(`\n🎉 Complete! Processed: ${processed}, Errors: ${errors}`);
  console.log('   Session 1 chunks are now ready for Nette AI RAG! 🧠');
}

main().catch(console.error);
