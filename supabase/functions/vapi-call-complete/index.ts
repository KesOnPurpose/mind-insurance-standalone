// ============================================================================
// VAPI CALL COMPLETE - Post-Call Processing
// ============================================================================
// Called from the client after a Vapi call ends to:
// 1. Fetch call details from Vapi REST API (recording URL, final transcript)
// 2. Generate AI summary with next steps using Claude
// 3. Update vapi_call_logs with complete data
//
// This function runs AFTER the call ends to enrich the call log with:
// - Recording URL (from Vapi API)
// - AI-generated summary (Zoom-style)
// - Extracted next steps/action items
// - Grouphome-specific topic detection
// - Sentiment analysis
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// TYPES
// ============================================================================

interface VapiCallResponse {
  id: string;
  status: string;
  transcript?: string;
  recordingUrl?: string;
  stereoRecordingUrl?: string;
  messages?: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    time?: number;
    secondsFromStart?: number;
  }>;
  analysis?: {
    summary?: string;
    successEvaluation?: string;
  };
  startedAt?: string;
  endedAt?: string;
  endedReason?: string;
  cost?: number;
}

interface AISummaryResult {
  summary: string;
  next_steps: string[];
  topics: string[];
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
}

// Grouphome-specific topics to detect
const GROUPHOME_TOPICS = [
  'licensing', 'permits', 'zoning', 'regulations', 'compliance',
  'property', 'location', 'revenue', 'expenses', 'staffing',
  'residents', 'insurance', 'financing', 'timeline', 'strategy',
  'assessment', 'journey', 'tactics', 'progress', 'motivation'
];

// ============================================================================
// VAPI API HELPER
// ============================================================================

async function fetchVapiCallDetails(callId: string, apiKey: string): Promise<VapiCallResponse | null> {
  console.log('[vapi-call-complete] Fetching call details from Vapi API:', callId);

  try {
    const response = await fetch(`https://api.vapi.ai/call/${callId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[vapi-call-complete] Vapi API error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    console.log('[vapi-call-complete] Vapi call data retrieved:', {
      id: data.id,
      status: data.status,
      hasRecording: !!data.recordingUrl,
      hasTranscript: !!data.transcript
    });

    return data as VapiCallResponse;
  } catch (error) {
    console.error('[vapi-call-complete] Error fetching from Vapi:', error);
    return null;
  }
}

// ============================================================================
// AI SUMMARY GENERATION
// ============================================================================

async function generateAISummary(
  transcript: string,
  anthropicKey: string
): Promise<AISummaryResult | null> {
  console.log('[vapi-call-complete] Generating AI summary, transcript length:', transcript.length);

  if (!transcript || transcript.length < 50) {
    console.log('[vapi-call-complete] Transcript too short for summary');
    return null;
  }

  const systemPrompt = `You are analyzing a voice conversation transcript between a user and Nette, an AI assistant for the Grouphome business startup journey.

Your task is to create a structured summary in JSON format.

Extract:
1. "summary": A 2-3 sentence summary of what was discussed
2. "next_steps": Array of specific action items or next steps (as strings)
3. "topics": Array of main topics from this list: ${GROUPHOME_TOPICS.join(', ')}
4. "sentiment": Overall call sentiment (positive/neutral/negative/mixed)

Respond ONLY with valid JSON, no markdown or explanation.`;

  const userPrompt = `Analyze this voice conversation transcript:

${transcript}

Return JSON with: summary, next_steps, topics, sentiment`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[vapi-call-complete] Anthropic API error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;

    if (!content) {
      console.error('[vapi-call-complete] No content in Anthropic response');
      return null;
    }

    // Parse the JSON response
    const parsed = JSON.parse(content);

    // Validate and normalize the response
    const result: AISummaryResult = {
      summary: parsed.summary || '',
      next_steps: Array.isArray(parsed.next_steps) ? parsed.next_steps : [],
      topics: Array.isArray(parsed.topics)
        ? parsed.topics.filter((t: string) => GROUPHOME_TOPICS.includes(t.toLowerCase()))
        : [],
      sentiment: ['positive', 'neutral', 'negative', 'mixed'].includes(parsed.sentiment)
        ? parsed.sentiment
        : 'neutral'
    };

    // Limit topics to 8 max
    result.topics = result.topics.slice(0, 8);

    console.log('[vapi-call-complete] AI summary generated:', {
      summaryLength: result.summary.length,
      nextStepsCount: result.next_steps.length,
      topicsCount: result.topics.length,
      sentiment: result.sentiment
    });

    return result;
  } catch (error) {
    console.error('[vapi-call-complete] Error generating summary:', error);
    return null;
  }
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const vapiPrivateKey = Deno.env.get('VAPI_PRIVATE_KEY');
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[vapi-call-complete] Missing Supabase credentials');
      return new Response(
        JSON.stringify({ success: false, error: 'Database not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!vapiPrivateKey) {
      console.error('[vapi-call-complete] Missing VAPI_PRIVATE_KEY');
      return new Response(
        JSON.stringify({ success: false, error: 'Vapi API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { vapi_call_id } = await req.json();

    if (!vapi_call_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing vapi_call_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[vapi-call-complete] Processing call:', vapi_call_id);

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch call details from Vapi API
    const vapiCall = await fetchVapiCallDetails(vapi_call_id, vapiPrivateKey);

    if (!vapiCall) {
      console.log('[vapi-call-complete] Could not fetch Vapi call details');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to fetch call details from Vapi',
          partial: true
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build update payload
    const updatePayload: Record<string, unknown> = {};

    // Add recording URL if available
    if (vapiCall.recordingUrl) {
      updatePayload.recording_url = vapiCall.recordingUrl;
      console.log('[vapi-call-complete] Recording URL found');
    } else if (vapiCall.stereoRecordingUrl) {
      updatePayload.recording_url = vapiCall.stereoRecordingUrl;
      console.log('[vapi-call-complete] Stereo recording URL found');
    }

    // Get transcript for AI summary
    const transcript = vapiCall.transcript || '';

    // Generate AI summary if we have transcript and Anthropic key
    if (transcript && anthropicKey) {
      const aiSummary = await generateAISummary(transcript, anthropicKey);

      if (aiSummary) {
        // Format summary with next steps as bullet points
        let formattedSummary = aiSummary.summary;
        if (aiSummary.next_steps.length > 0) {
          formattedSummary += '\n\n**Next Steps:**\n' +
            aiSummary.next_steps.map(step => `• ${step}`).join('\n');
        }

        updatePayload.summary = formattedSummary;
        updatePayload.topics = aiSummary.topics;
        updatePayload.sentiment = aiSummary.sentiment;
      }
    } else if (!anthropicKey) {
      console.log('[vapi-call-complete] No ANTHROPIC_API_KEY, skipping AI summary');
    }

    // Only update if we have something to update
    if (Object.keys(updatePayload).length > 0) {
      console.log('[vapi-call-complete] Updating vapi_call_logs:', {
        call_id: vapi_call_id,
        fields: Object.keys(updatePayload)
      });

      const { error: updateError } = await supabase
        .from('vapi_call_logs')
        .update(updatePayload)
        .eq('vapi_call_id', vapi_call_id);

      if (updateError) {
        console.error('[vapi-call-complete] Error updating call log:', updateError);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Failed to update call log',
            details: updateError.message
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('[vapi-call-complete] Call log updated successfully');
    } else {
      console.log('[vapi-call-complete] No updates to apply');
    }

    return new Response(
      JSON.stringify({
        success: true,
        recording_url: updatePayload.recording_url || null,
        has_summary: !!updatePayload.summary,
        topics: updatePayload.topics || []
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[vapi-call-complete] Exception:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
