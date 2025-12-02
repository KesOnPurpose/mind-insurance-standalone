// MIO Report Webhook - Edge Function for n8n Integration
// Phase 27: Secure webhook endpoint for AI-generated reports
//
// Usage from n8n:
// POST https://hpyodaugrkctagkrfofj.supabase.co/functions/v1/mio-report-webhook
// Headers:
//   Authorization: Bearer <service_role_key>
//   Content-Type: application/json
// Body: { user_id, report_type, title, summary?, content, priority?, ... }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Valid report types
const VALID_REPORT_TYPES = [
  'weekly_insight',
  'pattern_analysis',
  'breakthrough_detection',
  'dropout_risk',
  'celebration',
  'intervention',
  'custom',
];

// Valid priorities
const VALID_PRIORITIES = ['urgent', 'high', 'normal', 'low'];

interface MIOReportPayload {
  user_id: string;
  user_email?: string;
  report_type: string;
  title: string;
  summary?: string;
  content: {
    sections?: Array<{
      title: string;
      content: string;
      type?: string;
    }>;
    metrics?: Record<string, number | string | boolean>;
    recommendations?: string[];
    action_items?: Array<{
      title: string;
      description?: string;
      priority: string;
    }>;
    raw_analysis?: string;
  };
  priority?: string;
  confidence_score?: number;
  workflow_id?: string;
  execution_id?: string;
  context?: Record<string, unknown>;
  valid_until?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const payload: MIOReportPayload = await req.json();

    // Validate required fields
    if (!payload.user_id && !payload.user_email) {
      return new Response(JSON.stringify({ error: 'user_id or user_email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!payload.report_type) {
      return new Response(JSON.stringify({ error: 'report_type is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!VALID_REPORT_TYPES.includes(payload.report_type)) {
      return new Response(
        JSON.stringify({
          error: `Invalid report_type. Must be one of: ${VALID_REPORT_TYPES.join(', ')}`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!payload.title) {
      return new Response(JSON.stringify({ error: 'title is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!payload.content) {
      return new Response(JSON.stringify({ error: 'content is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate priority if provided
    if (payload.priority && !VALID_PRIORITIES.includes(payload.priority)) {
      return new Response(
        JSON.stringify({
          error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate confidence_score if provided
    if (
      payload.confidence_score !== undefined &&
      (payload.confidence_score < 0 || payload.confidence_score > 1)
    ) {
      return new Response(
        JSON.stringify({ error: 'confidence_score must be between 0 and 1' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Resolve user_id from email if not provided
    let userId = payload.user_id;
    if (!userId && payload.user_email) {
      const { data: userProfile, error: userError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', payload.user_email)
        .single();

      if (userError || !userProfile) {
        return new Response(
          JSON.stringify({ error: `User not found with email: ${payload.user_email}` }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      userId = userProfile.id;
    }

    // Verify user exists
    const { data: userExists, error: userCheckError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (userCheckError || !userExists) {
      return new Response(JSON.stringify({ error: `User not found: ${userId}` }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create the report
    const { data: report, error: insertError } = await supabase
      .from('mio_user_reports')
      .insert({
        user_id: userId,
        report_type: payload.report_type,
        title: payload.title,
        summary: payload.summary,
        content: payload.content,
        priority: payload.priority || 'normal',
        confidence_score: payload.confidence_score,
        source: 'n8n',
        source_workflow_id: payload.workflow_id,
        source_execution_id: payload.execution_id,
        source_context: payload.context,
        display_status: 'unread',
        pinned: false,
        valid_until: payload.valid_until,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating report:', insertError);
      return new Response(
        JSON.stringify({ error: `Failed to create report: ${insertError.message}` }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Log success
    console.log(`Created MIO report ${report.id} for user ${userId}`);

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        report_id: report.id,
        user_id: userId,
        report_type: payload.report_type,
        created_at: report.created_at,
      }),
      {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
