import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('[Migration] Starting migration from gh_training_chunks to nette_knowledge_chunks');

    // Read all chunks from gh_training_chunks
    const { data: sourceChunks, error: readError } = await supabase
      .from('gh_training_chunks')
      .select('*');

    if (readError) {
      throw new Error(`Failed to read source chunks: ${readError.message}`);
    }

    if (!sourceChunks || sourceChunks.length === 0) {
      throw new Error('No chunks found in gh_training_chunks');
    }

    console.log(`[Migration] Found ${sourceChunks.length} chunks to migrate`);

    // Helper function to derive week number from tactic_id
    const deriveWeekFromTacticId = (tacticIds: string[] | null): number | null => {
      if (!tacticIds || tacticIds.length === 0) return null;
      // Extract week number from tactic_id (e.g., "W1_T1" -> 1)
      const match = tacticIds[0].match(/W(\d+)/i);
      return match ? parseInt(match[1]) : null;
    };

    // Helper function to derive category from tags
    const deriveCategoryFromTags = (tags: string[] | null): string | null => {
      if (!tags || tags.length === 0) return null;
      const categoryMap: Record<string, string> = {
        'licensing': 'Licensing & Compliance',
        'property_search': 'Property Acquisition',
        'operations': 'Operations & Management',
        'setup': 'Initial Setup',
        'legal': 'Legal Requirements',
        'resident_care': 'Resident Care',
        'marketing': 'Marketing & Outreach',
        'scaling': 'Growth & Scaling',
        'financial': 'Financial Planning',
        'training': 'Training & Education'
      };
      return categoryMap[tags[0]] || 'General';
    };

    // Transform chunks to match nette_knowledge_chunks schema
    const transformedChunks = sourceChunks.map((chunk, index) => ({
      chunk_text: chunk.chunk_text,
      source_file: chunk.source_file,
      file_number: 1, // Default file number
      chunk_number: chunk.chunk_index,
      category: chunk.topic_tags?.[0] || 'general',
      subcategory: chunk.topic_tags?.[1] || null,
      tactic_id: chunk.related_tactics?.[0] || null,
      tactic_category: deriveCategoryFromTags(chunk.topic_tags),
      week_number: deriveWeekFromTacticId(chunk.related_tactics),
      applicable_states: ['all'], // Default to all states
      priority_level: chunk.topic_tags?.includes('licensing') ? 8 : 5,
      embedding: chunk.embedding,
      tokens_approx: Math.ceil(chunk.chunk_text.split(/\s+/).length * 1.3),
      chunk_summary: chunk.chunk_text.length > 200 
        ? chunk.chunk_text.substring(0, 200) + '...' 
        : chunk.chunk_text,
      is_active: true,
      version: '1.0'
    }));

    console.log(`[Migration] Transformed ${transformedChunks.length} chunks`);

    // Batch insert in chunks of 25
    const batchSize = 25;
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < transformedChunks.length; i += batchSize) {
      const batch = transformedChunks.slice(i, i + batchSize);
      console.log(`[Migration] Inserting batch ${Math.floor(i / batchSize) + 1} (${batch.length} chunks)`);

      const { error: insertError } = await supabase
        .from('nette_knowledge_chunks')
        .insert(batch);

      if (insertError) {
        console.error(`[Migration] Batch insert error:`, insertError);
        errorCount += batch.length;
        errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${insertError.message}`);
      } else {
        successCount += batch.length;
      }
    }

    console.log(`[Migration] Complete. Success: ${successCount}, Errors: ${errorCount}`);

    // Verify the migration
    const { count: verifyCount } = await supabase
      .from('nette_knowledge_chunks')
      .select('*', { count: 'exact', head: true });

    return new Response(
      JSON.stringify({
        success: errorCount === 0,
        message: errorCount === 0 
          ? 'Migration completed successfully' 
          : 'Migration completed with some errors',
        stats: {
          source_chunks: sourceChunks.length,
          migrated_chunks: successCount,
          failed_chunks: errorCount,
          total_in_destination: verifyCount,
          errors: errors.length > 0 ? errors : null
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('[Migration] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
