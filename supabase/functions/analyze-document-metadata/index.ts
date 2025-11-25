// Supabase Edge Function: AI-Powered Document Metadata Analysis
// Proxies Claude API calls server-side to avoid CORS issues

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisRequest {
  filename: string;
  fileContent: string;
  fileType: string;
  imageData?: string;
}

interface ClaudeAnalysisResponse {
  category: string;
  description: string;
  applicable_states: string[];
  ownership_model: string[];
  applicable_populations: string[];
  difficulty: string | null;
  confidence: {
    category: number;
    description: number;
    applicable_states: number;
    ownership_model: number;
    applicable_populations: number;
    difficulty: number;
  };
  notes: string;
}

const buildAnalysisPrompt = (filename: string, content: string): string => {
  return `Analyze this group home training document and extract structured metadata.

Document filename: ${filename}
Content preview: ${content}

You must respond with ONLY valid JSON (no markdown, no code blocks) in this exact format:
{
  "category": "operations|marketing|financial|legal|revenue|compliance",
  "description": "1-2 sentence description",
  "applicable_states": ["STATE_CODE" or "ALL"],
  "ownership_model": ["individual"|"llc"|"corporation"|"partnership"|"nonprofit"],
  "applicable_populations": ["adult"|"youth"|"seniors"|"veterans"|"special_needs"],
  "difficulty": "beginner"|"intermediate"|"advanced"|null,
  "confidence": {
    "category": 0-100,
    "description": 0-100,
    "applicable_states": 0-100,
    "ownership_model": 0-100,
    "applicable_populations": 0-100,
    "difficulty": 0-100
  },
  "notes": "brief analysis rationale"
}

IMPORTANT RULES:
- Use lowercase for all enum values
- applicable_states must be 2-letter state codes (e.g., ["CA", "TX"]) or ["ALL"]
- ownership_model must be an array (can be empty if not applicable)
- applicable_populations must be an array (can be empty if universal)
- difficulty can be null if not determinable
- Confidence scores: 90-100 = very certain, 70-89 = confident, 50-69 = uncertain, <50 = needs review
- Set confidence based on how clearly the document indicates each field
- Return ONLY the JSON object, no other text`;
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { filename, fileContent, fileType, imageData }: AnalysisRequest = await req.json();

    // Validate required fields
    if (!filename || !fileContent) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: filename, fileContent' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get Anthropic API key from environment
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicApiKey) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured in Edge Function secrets' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Build content blocks for Claude
    const contentBlocks: any[] = [
      {
        type: 'text',
        text: buildAnalysisPrompt(filename, fileContent),
      },
    ];

    // Add image if provided (for PNG/JPG analysis)
    if (imageData) {
      contentBlocks.unshift({
        type: 'image',
        source: {
          type: 'base64',
          media_type: fileType.includes('png') ? 'image/png' : 'image/jpeg',
          data: imageData,
        },
      });
    }

    // Call Anthropic API server-side
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307', // Cost-efficient model
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: contentBlocks,
          },
        ],
      }),
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      console.error('Anthropic API error:', errorText);
      return new Response(
        JSON.stringify({ error: `Claude API error: ${anthropicResponse.status}` }),
        {
          status: anthropicResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse Claude response
    const result = await anthropicResponse.json();
    const textContent = result.content[0].text;

    // Parse JSON response from Claude
    let metadata: ClaudeAnalysisResponse;
    try {
      metadata = JSON.parse(textContent);
    } catch (parseError) {
      console.error('Failed to parse Claude response:', textContent);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON response from Claude API', rawResponse: textContent }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Return successful analysis
    return new Response(JSON.stringify(metadata), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Edge Function error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
