// =============================================================================
// BACKFILL EMBEDDINGS - Edge Function
// =============================================================================
// Generates OpenAI embeddings for chunks that don't have them yet
// Run multiple times until all chunks are processed
// =============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured')
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!)

    // Parse request body for optional parameters
    let tableName = 'nette_knowledge_chunks'
    let batchSize = 20
    
    try {
      const body = await req.json()
      if (body.table) tableName = body.table
      if (body.batch_size) batchSize = Math.min(body.batch_size, 50)
    } catch {
      // Use defaults if no body
    }

    // Get chunks without embeddings
    const { data: chunks, error: fetchError } = await supabase
      .from(tableName)
      .select('id, chunk_text')
      .is('embedding', null)
      .limit(batchSize)

    if (fetchError) {
      throw new Error(`Failed to fetch chunks: ${fetchError.message}`)
    }

    if (!chunks || chunks.length === 0) {
      // Get total count to confirm all done
      const { count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })
        .is('embedding', null)

      return new Response(JSON.stringify({
        success: true,
        processed: 0,
        remaining: count || 0,
        message: count === 0 ? 'All chunks have embeddings!' : 'No chunks in this batch'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    let processed = 0
    const errors: string[] = []

    for (const chunk of chunks) {
      try {
        // Generate embedding via OpenAI
        const embResponse = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'text-embedding-3-small',
            input: chunk.chunk_text
          })
        })

        if (!embResponse.ok) {
          const errText = await embResponse.text()
          throw new Error(`OpenAI API error: ${embResponse.status} - ${errText}`)
        }

        const embData = await embResponse.json()
        
        if (!embData.data?.[0]?.embedding) {
          throw new Error('No embedding in OpenAI response')
        }

        // Store as JSON string (matching existing schema)
        const embedding = JSON.stringify(embData.data[0].embedding)

        // Update chunk with embedding
        const { error: updateError } = await supabase
          .from(tableName)
          .update({ embedding })
          .eq('id', chunk.id)

        if (updateError) {
          throw new Error(`Update failed: ${updateError.message}`)
        }

        processed++
      } catch (chunkError) {
        errors.push(`Chunk ${chunk.id}: ${chunkError.message}`)
      }
    }

    // Get remaining count
    const { count: remaining } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true })
      .is('embedding', null)

    return new Response(JSON.stringify({
      success: true,
      processed,
      remaining: remaining || 0,
      errors: errors.length > 0 ? errors : undefined,
      message: `Processed ${processed} chunks, ${remaining} remaining`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
