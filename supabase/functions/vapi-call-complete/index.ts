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

  const systemPrompt = `You are analyzing a voice conversation transcript between a user and an AI assistant named Nette.

CRITICAL RULES:
- The AI assistant is ALWAYS named "Nette" (never Nick, Nat, or any other name)
- Refer to the AI assistant as "Nette" in the summary
- Do NOT invent or guess the user's name - refer to them as "the user" unless their name is clearly stated
- If a name appears in the transcript, spell it EXACTLY as shown

Your task is to create a structured summary in JSON format.

Extract:
1. "summary": A 2-3 sentence summary of what was discussed. Use "Nette" for the assistant and "the user" for the human.
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

    // Check existing record to avoid overwriting client-captured data
    // We'll do a full check below after fetching, but for timestamps we can update now
    if (vapiCall.startedAt) {
      updatePayload.started_at = vapiCall.startedAt;
    }
    if (vapiCall.endedAt) {
      updatePayload.ended_at = vapiCall.endedAt;
    }

    // Note: Duration will be handled below after checking existing record
    // to avoid overwriting client-captured duration with potentially incorrect Vapi data

    // Store end reason if available
    if (vapiCall.endedReason) {
      updatePayload.end_reason = vapiCall.endedReason;
    }

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

    // CRITICAL: Check if client already captured transcript before overwriting
    // The client's logCallEnd() captures transcript in real-time, which is more reliable
    // than Vapi's post-call messages. Only use Vapi transcript as a fallback.
    const { data: existingCall } = await supabase
      .from('vapi_call_logs')
      .select('transcript, duration_seconds, user_id')
      .eq('vapi_call_id', vapi_call_id)
      .single();

    const hasExistingTranscript = existingCall?.transcript &&
      (Array.isArray(existingCall.transcript) ? existingCall.transcript.length > 0 : true);

    console.log('[vapi-call-complete] Existing transcript check:', {
      hasExisting: hasExistingTranscript,
      existingType: existingCall?.transcript ? typeof existingCall.transcript : 'none',
      vapiHasMessages: vapiCall.messages?.length || 0
    });

    // Store Vapi messages as transcript ONLY if client didn't capture it
    if (!hasExistingTranscript && vapiCall.messages && vapiCall.messages.length > 0) {
      // Convert Vapi messages to our transcript format
      const vapiTranscript = vapiCall.messages
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .map(msg => ({
          role: msg.role,
          text: msg.content,
          timestamp: msg.secondsFromStart
            ? new Date(Date.now() - (msg.secondsFromStart * 1000)).toISOString()
            : new Date().toISOString()
        }));

      if (vapiTranscript.length > 0) {
        updatePayload.transcript = vapiTranscript;
        console.log('[vapi-call-complete] Stored Vapi messages as transcript (client had none), count:', vapiTranscript.length);
      }
    } else if (hasExistingTranscript) {
      console.log('[vapi-call-complete] Preserving client-captured transcript');
    }

    // Calculate duration only if client didn't capture it
    const hasExistingDuration = existingCall?.duration_seconds && existingCall.duration_seconds > 0;

    if (!hasExistingDuration && vapiCall.startedAt && vapiCall.endedAt) {
      const startTime = new Date(vapiCall.startedAt).getTime();
      const endTime = new Date(vapiCall.endedAt).getTime();
      const durationSeconds = Math.round((endTime - startTime) / 1000);

      if (durationSeconds > 0 && durationSeconds < 86400) { // Reasonable bounds
        updatePayload.duration_seconds = durationSeconds;
        console.log('[vapi-call-complete] Duration calculated from Vapi timestamps (client had none):', durationSeconds, 'seconds');
      }
    } else if (hasExistingDuration) {
      console.log('[vapi-call-complete] Preserving client-captured duration:', existingCall?.duration_seconds, 'seconds');
    }

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

      // NEW: Trigger cross-channel context sync (voice → chat)
      // This updates unified_conversation_context so chat knows about this voice call
      if (existingCall?.user_id) {
        try {
          const syncResponse = await fetch(`${supabaseUrl}/functions/v1/sync-conversation-context`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify({
              user_id: existingCall.user_id,
              source_type: 'voice_call',
              source_id: vapi_call_id
            })
          });

          if (syncResponse.ok) {
            console.log('[vapi-call-complete] Context sync triggered successfully');
          } else {
            console.error('[vapi-call-complete] Context sync failed:', syncResponse.status);
          }
        } catch (syncError) {
          console.error('[vapi-call-complete] Context sync error:', syncError);
          // Don't fail the main operation if sync fails
        }
      } else {
        console.log('[vapi-call-complete] No user_id found, skipping context sync');
      }
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
