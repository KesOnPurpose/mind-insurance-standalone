import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function generateEmbedding(text: string): Promise<number[]> {
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured');

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Embedding] OpenAI API error:', response.status, errorText);
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log('[Session1 Embeddings] Starting embedding generation for Session 1 chunks...');

    // Fetch all Session 1 chunks without embeddings
    const { data: chunks, error: fetchError } = await supabase
      .from('nette_knowledge_chunks')
      .select('id, chunk_text, chunk_summary')
      .ilike('source_file', '%Session 1%')
      .is('embedding', null);

    if (fetchError) {
      throw new Error(`Failed to fetch chunks: ${fetchError.message}`);
    }

    if (!chunks || chunks.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No Session 1 chunks found without embeddings',
          processed: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Session1 Embeddings] Found ${chunks.length} chunks without embeddings`);

    let processed = 0;
    let errors = 0;
    const results: { id: string; status: string }[] = [];

    for (const chunk of chunks) {
      try {
        console.log(`[Session1 Embeddings] Processing chunk ${chunk.id}: ${chunk.chunk_summary?.substring(0, 50)}...`);

        // Generate embedding for the chunk text
        const embedding = await generateEmbedding(chunk.chunk_text);

        // Update the chunk with the embedding
        const { error: updateError } = await supabase
          .from('nette_knowledge_chunks')
          .update({ embedding: `[${embedding.join(',')}]` })
          .eq('id', chunk.id);

        if (updateError) {
          console.error(`[Session1 Embeddings] Failed to update chunk ${chunk.id}:`, updateError);
          errors++;
          results.push({ id: chunk.id, status: 'error' });
        } else {
          processed++;
          results.push({ id: chunk.id, status: 'success' });
          console.log(`[Session1 Embeddings] ✅ Chunk ${chunk.id} embedded successfully`);
        }

        // Rate limiting - wait 200ms between API calls
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        console.error(`[Session1 Embeddings] Error processing chunk ${chunk.id}:`, error);
        errors++;
        results.push({ id: chunk.id, status: 'error' });
      }
    }

    console.log(`[Session1 Embeddings] Complete! Processed: ${processed}, Errors: ${errors}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Generated embeddings for Session 1 chunks`,
        total_chunks: chunks.length,
        processed,
        errors,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Session1 Embeddings] Fatal error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
