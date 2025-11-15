import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Chunk {
  text: string;
  category: string;
  subcategory?: string;
  file_number: number;
  chunk_number: number;
  source_file: string;
  week_number?: number;
  tactic_id?: string;
}

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

function processMarkdown(content: string, sourceFile: string, fileNumber: number): Chunk[] {
  const chunks: Chunk[] = [];
  const lines = content.split('\n');
  
  let currentChunk: string[] = [];
  let currentCategory = 'General';
  let currentSubcategory: string | undefined;
  let chunkNumber = 0;
  let tacticId: string | undefined;
  let weekNumber: number | undefined;

  for (const line of lines) {
    // Detect categories
    if (line.startsWith('## CATEGORY') || line.startsWith('## ')) {
      if (currentChunk.length > 0) {
        chunks.push({
          text: currentChunk.join('\n'),
          category: currentCategory,
          subcategory: currentSubcategory,
          file_number: fileNumber,
          chunk_number: chunkNumber++,
          source_file: sourceFile,
          week_number: weekNumber,
          tactic_id: tacticId,
        });
        currentChunk = [];
        tacticId = undefined;
      }
      currentCategory = line.replace(/^##\s*/, '').replace(/^CATEGORY \d+:\s*/, '');
    }

    // Detect subsections
    if (line.startsWith('### ')) {
      if (currentChunk.length > 0) {
        chunks.push({
          text: currentChunk.join('\n'),
          category: currentCategory,
          subcategory: currentSubcategory,
          file_number: fileNumber,
          chunk_number: chunkNumber++,
          source_file: sourceFile,
          week_number: weekNumber,
          tactic_id: tacticId,
        });
        currentChunk = [];
        tacticId = undefined;
      }
      currentSubcategory = line.replace(/^###\s*/, '');
    }

    // Detect tactic IDs
    const tacticMatch = line.match(/\*\*T(\d+)\*\*/);
    if (tacticMatch) {
      tacticId = `T${tacticMatch[1]}`;
    }

    // Detect week numbers
    const weekMatch = line.match(/Week[s]?\s+(\d+)/i);
    if (weekMatch) {
      weekNumber = parseInt(weekMatch[1]);
    }

    currentChunk.push(line);

    // Create chunk every ~500 words or at major breaks
    if (currentChunk.length > 40 || (line.startsWith('---') && currentChunk.length > 10)) {
      chunks.push({
        text: currentChunk.join('\n'),
        category: currentCategory,
        subcategory: currentSubcategory,
        file_number: fileNumber,
        chunk_number: chunkNumber++,
        source_file: sourceFile,
        week_number: weekNumber,
        tactic_id: tacticId,
      });
      currentChunk = [];
      tacticId = undefined;
    }
  }

  // Add final chunk
  if (currentChunk.length > 0) {
    chunks.push({
      text: currentChunk.join('\n'),
      category: currentCategory,
      subcategory: currentSubcategory,
      file_number: fileNumber,
      chunk_number: chunkNumber++,
      source_file: sourceFile,
      week_number: weekNumber,
      tactic_id: tacticId,
    });
  }

  return chunks.filter(chunk => chunk.text.trim().length > 100);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[Populate] Starting knowledge base population...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Define files to process
    const fileConfigs = [
      { name: "GROUP-HOME-TACTICS-LIBRARY.md", agent: "nette" },
      { name: "Goup_home_Newbies_training_7_22_25.md", agent: "nette" },
      { name: "Group_Home_Webinar_recording_8_13_25.md", agent: "nette" },
      { name: "Group_Home_for_newbies_Q_A_5_20_25.md", agent: "nette" },
      { name: "Group_home_for_Newbies_Q_A_7_4_25.md", agent: "nette" },
      { name: "Group_home_webinar_recording_9_11_25.md", agent: "me" },
    ];

    let totalChunks = 0;
    let netteChunks = 0;
    let meChunks = 0;

    for (let i = 0; i < fileConfigs.length; i++) {
      const config = fileConfigs[i];
      console.log(`[Populate] Processing ${config.name} for ${config.agent}...`);

      // Read file from data directory
      let content: string;
      try {
        content = await Deno.readTextFile(`./data/${config.name}`);
        console.log(`[Populate] Loaded ${config.name} (${content.length} chars)`);
      } catch (error) {
        console.error(`[Populate] Error reading file ${config.name}:`, error);
        throw new Error(`Failed to read ${config.name}: ${error}`);
      }

      const fileNumber = i + 1;
      const chunks = processMarkdown(content, config.name, fileNumber);
      console.log(`[Populate] Generated ${chunks.length} chunks from ${config.name}`);

      // Process chunks in batches of 10 to avoid rate limits
      for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex += 10) {
        const batch = chunks.slice(chunkIndex, chunkIndex + 10);
        
        for (const chunk of batch) {
          try {
            const embedding = await generateEmbedding(chunk.text);
            const embeddingString = `[${embedding.join(',')}]`;

            const isFinancingContent = chunk.text.toLowerCase().includes('financ') || 
                                     chunk.text.toLowerCase().includes('roi') ||
                                     chunk.text.toLowerCase().includes('capital');

            const targetTable = (config.agent === 'me' || isFinancingContent) 
              ? 'me_knowledge_chunks' 
              : 'nette_knowledge_chunks';

            const insertData: any = {
              chunk_text: chunk.text,
              chunk_summary: chunk.text.substring(0, 200) + '...',
              source_file: chunk.source_file,
              file_number: chunk.file_number,
              chunk_number: chunk.chunk_number,
              category: chunk.category,
              subcategory: chunk.subcategory,
              embedding: embeddingString,
              tokens_approx: Math.ceil(chunk.text.split(/\s+/).length * 1.3),
              priority_level: chunk.week_number && chunk.week_number <= 4 ? 8 : 5,
              is_active: true,
            };

            if (targetTable === 'nette_knowledge_chunks') {
              insertData.week_number = chunk.week_number;
              insertData.tactic_id = chunk.tactic_id;
              netteChunks++;
            } else {
              insertData.financing_type = 'general';
              meChunks++;
            }

            const { error } = await supabase
              .from(targetTable)
              .insert(insertData);

            if (error) {
              console.error(`[Populate] Error inserting into ${targetTable}:`, error);
              throw error;
            }

            totalChunks++;
          } catch (error) {
            console.error(`[Populate] Error processing chunk:`, error);
            throw error;
          }
        }

        // Brief pause between batches to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log(`[Populate] Completed ${config.name}`);
    }

    console.log(`[Populate] Successfully populated ${totalChunks} chunks (Nette: ${netteChunks}, ME: ${meChunks})`);

    return new Response(
      JSON.stringify({
        success: true,
        total_chunks: totalChunks,
        nette_chunks: netteChunks,
        me_chunks: meChunks,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[Populate] Fatal error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
