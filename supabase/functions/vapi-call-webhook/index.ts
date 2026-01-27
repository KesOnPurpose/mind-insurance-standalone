// ============================================================================
// VAPI CALL WEBHOOK - Handle Vapi Call Events
// ============================================================================
// Receives webhooks from Vapi for call events:
// - end-of-call-report: Full transcript, summary, and analytics
// - tool-calls: Track tool usage during calls
// - status-update: Call status changes
// - transcript: Real-time transcript updates
//
// Stores data in vapi_call_logs for A/B test analysis.
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

interface VapiMessage {
  type: string;
}

interface VapiEndOfCallReport extends VapiMessage {
  type: 'end-of-call-report';
  call: VapiCall;
  transcript: string;
  summary?: string;
  recordingUrl?: string;
  analysis?: {
    summary?: string;
    successEvaluation?: string;
  };
}

interface VapiStatusUpdate extends VapiMessage {
  type: 'status-update';
  status: 'queued' | 'ringing' | 'in-progress' | 'forwarding' | 'ended';
  call: VapiCall;
}

interface VapiToolCall extends VapiMessage {
  type: 'tool-calls';
  toolCalls: Array<{
    id: string;
    type: string;
    function: {
      name: string;
      arguments: string;
    };
  }>;
  call: VapiCall;
}

interface VapiTranscript extends VapiMessage {
  type: 'transcript';
  role: 'user' | 'assistant';
  transcript: string;
  call: VapiCall;
}

interface VapiCall {
  id: string;
  orgId: string;
  createdAt: string;
  updatedAt: string;
  type: 'inboundPhoneCall' | 'outboundPhoneCall' | 'webCall';
  status: string;
  endedReason?: string;
  assistantId?: string;
  phoneNumber?: {
    number?: string;
    twilioPhoneNumber?: string;
  };
  customer?: {
    number?: string;
  };
  startedAt?: string;
  endedAt?: string;
  cost?: number;
  costBreakdown?: {
    llm?: number;
    stt?: number;
    tts?: number;
    vapi?: number;
    total?: number;
  };
  messages?: Array<{
    role: string;
    message: string;
    time?: number;
    secondsFromStart?: number;
  }>;
  analysis?: {
    summary?: string;
    successEvaluation?: string;
  };
  artifact?: {
    messages?: Array<unknown>;
    transcript?: string;
  };
  // Custom metadata we passed during call creation
  metadata?: {
    user_id?: string;
    variant?: 'claude' | 'gpt4';
    context_snapshot?: Record<string, unknown>;
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function extractVariantFromAssistantId(assistantId: string | undefined): 'claude' | 'gpt4' | 'unknown' {
  const ASSISTANT_IDS = {
    '2e0dcaa8-4e9c-4c72-99f6-a19d87475147': 'claude',
    'cab72f23-7e8d-4c84-a1ed-e0895ccb5bd7': 'gpt4'
  };
  return (assistantId ? ASSISTANT_IDS[assistantId as keyof typeof ASSISTANT_IDS] : 'unknown') || 'unknown';
}

function mapDirection(type: string): 'inbound' | 'outbound' | 'web' {
  switch (type) {
    case 'inboundPhoneCall': return 'inbound';
    case 'outboundPhoneCall': return 'outbound';
    case 'webCall': return 'web';
    default: return 'web';
  }
}

function mapStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'queued': 'queued',
    'ringing': 'ringing',
    'in-progress': 'in-progress',
    'forwarding': 'in-progress',
    'ended': 'completed'
  };
  return statusMap[status] || status;
}

function calculateDuration(startedAt?: string, endedAt?: string): number | null {
  if (!startedAt || !endedAt) return null;
  const start = new Date(startedAt).getTime();
  const end = new Date(endedAt).getTime();
  return Math.round((end - start) / 1000);
}

function extractSentiment(messages?: Array<{ role: string; message: string }>): 'positive' | 'neutral' | 'negative' | 'mixed' {
  if (!messages || messages.length === 0) return 'neutral';

  // Simple sentiment detection based on keywords
  const userMessages = messages
    .filter(m => m.role === 'user')
    .map(m => m.message.toLowerCase())
    .join(' ');

  const positiveWords = ['great', 'thanks', 'thank you', 'awesome', 'helpful', 'amazing', 'love', 'perfect'];
  const negativeWords = ['frustrated', 'confused', 'stuck', 'struggling', 'difficult', 'hard', 'problem', 'issue'];

  const positiveCount = positiveWords.filter(w => userMessages.includes(w)).length;
  const negativeCount = negativeWords.filter(w => userMessages.includes(w)).length;

  if (positiveCount > 0 && negativeCount > 0) return 'mixed';
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

function extractTopics(transcript: string): string[] {
  // Simple topic extraction based on keywords
  const topics: string[] = [];
  const topicKeywords: Record<string, string[]> = {
    'tactics': ['tactic', 'tactics', 'step', 'task'],
    'progress': ['progress', 'completed', 'done', 'finished'],
    'stuck': ['stuck', 'struggling', 'confused', 'lost'],
    'motivation': ['motivation', 'inspired', 'excited', 'energy'],
    'assessment': ['assessment', 'score', 'readiness', 'evaluate'],
    'support': ['help', 'support', 'guidance', 'advice'],
    'journey': ['journey', 'day', 'week', 'phase']
  };

  const lowerTranscript = transcript.toLowerCase();
  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(kw => lowerTranscript.includes(kw))) {
      topics.push(topic);
    }
  }

  return topics.slice(0, 5); // Limit to 5 topics
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
    // Initialize Supabase client with service role (bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[vapi-call-webhook] Missing Supabase credentials');
      return new Response(
        JSON.stringify({ success: false, error: 'Database not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse webhook payload
    const payload = await req.json();
    const messageType = payload.message?.type || payload.type;

    console.log('[vapi-call-webhook] Received webhook:', {
      type: messageType,
      callId: payload.message?.call?.id || payload.call?.id
    });

    // Route based on message type
    switch (messageType) {
      case 'end-of-call-report':
        await handleEndOfCallReport(supabase, payload.message || payload);
        break;

      case 'status-update':
        await handleStatusUpdate(supabase, payload.message || payload);
        break;

      case 'tool-calls':
        await handleToolCalls(supabase, payload.message || payload);
        break;

      case 'transcript':
        // We don't store real-time transcripts individually
        // Full transcript is stored in end-of-call-report
        console.log('[vapi-call-webhook] Transcript update received (not stored)');
        break;

      default:
        console.log('[vapi-call-webhook] Unknown message type:', messageType);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[vapi-call-webhook] Exception:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ============================================================================
// WEBHOOK HANDLERS
// ============================================================================

async function handleEndOfCallReport(
  supabase: ReturnType<typeof createClient>,
  report: VapiEndOfCallReport
) {
  const call = report.call;
  console.log('[vapi-call-webhook] Processing end-of-call report:', call.id);

  const variant = extractVariantFromAssistantId(call.assistantId);
  const duration = calculateDuration(call.startedAt, call.endedAt);
  const topics = extractTopics(report.transcript || '');
  const sentiment = extractSentiment(call.messages);

  // Extract cost in cents
  const costCents = call.costBreakdown?.total
    ? Math.round(call.costBreakdown.total * 100)
    : null;

  const callLog = {
    vapi_call_id: call.id,
    user_id: call.metadata?.user_id || null,
    assistant_id: call.assistantId || '',
    assistant_variant: variant,
    direction: mapDirection(call.type),
    phone_number: call.customer?.number || call.phoneNumber?.number || null,
    started_at: call.startedAt || null,
    ended_at: call.endedAt || null,
    duration_seconds: duration,
    status: 'completed',
    end_reason: call.endedReason || null,
    transcript: report.transcript || call.artifact?.transcript || null,
    summary: report.summary || call.analysis?.summary || null,
    topics: topics,
    sentiment: sentiment,
    context_snapshot: call.metadata?.context_snapshot || {},
    cost_cents: costCents
  };

  // Upsert call log (update if exists, insert if new)
  const { error } = await supabase
    .from('vapi_call_logs')
    .upsert(callLog, {
      onConflict: 'vapi_call_id'
    });

  if (error) {
    console.error('[vapi-call-webhook] Error storing call log:', error);
  } else {
    console.log('[vapi-call-webhook] Call log stored:', {
      call_id: call.id,
      variant: variant,
      duration: duration,
      sentiment: sentiment,
      topics: topics
    });
  }

  // Update assistant config metrics (if exists)
  await updateAssistantMetrics(supabase, variant, duration, sentiment);
}

async function handleStatusUpdate(
  supabase: ReturnType<typeof createClient>,
  update: VapiStatusUpdate
) {
  const call = update.call;
  console.log('[vapi-call-webhook] Status update:', call.id, update.status);

  const variant = extractVariantFromAssistantId(call.assistantId);

  // Only create a record if call is starting (queued/ringing/in-progress)
  // End-of-call-report will update with full data
  if (['queued', 'ringing', 'in-progress'].includes(update.status)) {
    const callLog = {
      vapi_call_id: call.id,
      user_id: call.metadata?.user_id || null,
      assistant_id: call.assistantId || '',
      assistant_variant: variant,
      direction: mapDirection(call.type),
      phone_number: call.customer?.number || call.phoneNumber?.number || null,
      started_at: call.startedAt || null,
      status: mapStatus(update.status),
      context_snapshot: call.metadata?.context_snapshot || {}
    };

    const { error } = await supabase
      .from('vapi_call_logs')
      .upsert(callLog, {
        onConflict: 'vapi_call_id'
      });

    if (error) {
      console.error('[vapi-call-webhook] Error storing status update:', error);
    }
  }
}

async function handleToolCalls(
  supabase: ReturnType<typeof createClient>,
  toolCallMessage: VapiToolCall
) {
  const call = toolCallMessage.call;
  console.log('[vapi-call-webhook] Tool calls:', call.id, toolCallMessage.toolCalls.length);

  // Fetch existing call log and append tool calls
  const { data: existingLog, error: fetchError } = await supabase
    .from('vapi_call_logs')
    .select('tools_called')
    .eq('vapi_call_id', call.id)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('[vapi-call-webhook] Error fetching call log for tools:', fetchError);
    return;
  }

  // Parse existing tools or start fresh
  const existingTools = existingLog?.tools_called || [];

  // Format new tool calls
  const newTools = toolCallMessage.toolCalls.map(tc => ({
    id: tc.id,
    name: tc.function.name,
    arguments: JSON.parse(tc.function.arguments || '{}'),
    timestamp: new Date().toISOString()
  }));

  // Combine tools
  const allTools = [...existingTools, ...newTools];

  // Update call log with tools
  const { error: updateError } = await supabase
    .from('vapi_call_logs')
    .upsert({
      vapi_call_id: call.id,
      assistant_id: call.assistantId || '',
      assistant_variant: extractVariantFromAssistantId(call.assistantId),
      direction: mapDirection(call.type),
      tools_called: allTools
    }, {
      onConflict: 'vapi_call_id'
    });

  if (updateError) {
    console.error('[vapi-call-webhook] Error updating tools:', updateError);
  }
}

async function updateAssistantMetrics(
  supabase: ReturnType<typeof createClient>,
  variant: 'claude' | 'gpt4' | 'unknown',
  duration: number | null,
  sentiment: string
) {
  if (variant === 'unknown') return;

  const assistantName = variant === 'claude' ? 'nette-claude' : 'nette-gpt4';

  // Get current metrics
  const { data: config, error: fetchError } = await supabase
    .from('vapi_assistant_config')
    .select('total_calls, avg_duration_seconds')
    .eq('assistant_name', assistantName)
    .single();

  if (fetchError) {
    // Config might not exist yet
    console.log('[vapi-call-webhook] No config found for', assistantName);
    return;
  }

  // Calculate new metrics
  const totalCalls = (config.total_calls || 0) + 1;
  const currentAvg = config.avg_duration_seconds || 0;
  const newAvg = duration
    ? (currentAvg * (totalCalls - 1) + duration) / totalCalls
    : currentAvg;

  // Update metrics
  const { error: updateError } = await supabase
    .from('vapi_assistant_config')
    .update({
      total_calls: totalCalls,
      avg_duration_seconds: Math.round(newAvg * 100) / 100
    })
    .eq('assistant_name', assistantName);

  if (updateError) {
    console.error('[vapi-call-webhook] Error updating metrics:', updateError);
  }
}
