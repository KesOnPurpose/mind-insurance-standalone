/**
 * Coach Protocol Assign Edge Function (V2)
 * Bulk assigns coach protocols to users
 *
 * This function:
 * - Assigns protocols to multiple users at once
 * - Handles slot conflicts (primary/secondary)
 * - Pauses MIO protocols when coach protocol is assigned
 * - Sends notifications for new assignments
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AssignRequest {
  protocol_id: string;
  user_ids: string[];
  slot: 'primary' | 'secondary';
  start_date?: string; // ISO date string
  override_existing?: boolean;
  assigned_by?: string;
}

interface AssignResult {
  user_id: string;
  success: boolean;
  assignment_id?: string;
  error?: string;
  mio_paused?: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Create service role client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const body: AssignRequest = await req.json();

    if (!body.protocol_id || !body.user_ids || body.user_ids.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: protocol_id and user_ids',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const slot = body.slot || 'primary';
    const startDate = body.start_date ? new Date(body.start_date) : new Date();
    const overrideExisting = body.override_existing || false;

    // Verify protocol exists
    const { data: protocol, error: protocolError } = await supabase
      .from('coach_protocols_v2')
      .select('id, title, total_weeks, status')
      .eq('id', body.protocol_id)
      .single();

    if (protocolError || !protocol) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Protocol not found',
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (protocol.status !== 'published') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Protocol must be published before assigning',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results: AssignResult[] = [];

    for (const userId of body.user_ids) {
      try {
        // Check for existing assignment in slot
        const { data: existing } = await supabase
          .from('user_coach_protocol_assignments')
          .select('id, protocol_id')
          .eq('user_id', userId)
          .eq('assignment_slot', slot)
          .eq('status', 'active')
          .maybeSingle();

        if (existing && !overrideExisting) {
          results.push({
            user_id: userId,
            success: false,
            error: `User already has active protocol in ${slot} slot`,
          });
          continue;
        }

        // If overriding, mark existing as abandoned
        if (existing && overrideExisting) {
          await supabase
            .from('user_coach_protocol_assignments')
            .update({
              status: 'abandoned',
              completed_at: new Date().toISOString(),
            })
            .eq('id', existing.id);
        }

        // Check for active MIO protocol to pause
        let pausedMioProtocolId: string | null = null;
        const { data: activeMio } = await supabase
          .from('mio_weekly_protocols')
          .select('id')
          .eq('user_id', userId)
          .eq('status', 'active')
          .maybeSingle();

        if (activeMio) {
          // Pause the MIO protocol
          await supabase
            .from('mio_weekly_protocols')
            .update({
              status: 'paused',
            })
            .eq('id', activeMio.id);

          pausedMioProtocolId = activeMio.id;
        }

        // Create new assignment
        const { data: assignment, error: assignError } = await supabase
          .from('user_coach_protocol_assignments')
          .insert({
            user_id: userId,
            protocol_id: body.protocol_id,
            assignment_slot: slot,
            current_week: 1,
            current_day: 1,
            status: 'active',
            assigned_at: new Date().toISOString(),
            started_at: startDate.toISOString(),
            assigned_by: body.assigned_by || null,
            paused_mio_protocol_id: pausedMioProtocolId,
            days_completed: 0,
            days_skipped: 0,
            total_tasks_completed: 0,
          })
          .select('id')
          .single();

        if (assignError) {
          results.push({
            user_id: userId,
            success: false,
            error: assignError.message,
          });
          continue;
        }

        // Update the paused MIO with reference to this coach assignment
        if (pausedMioProtocolId) {
          await supabase
            .from('mio_weekly_protocols')
            .update({
              paused_by_coach_protocol_id: assignment.id,
            })
            .eq('id', pausedMioProtocolId);
        }

        // Log assignment event
        await supabase.from('coach_protocol_completion_events').insert({
          user_id: userId,
          assignment_id: assignment.id,
          protocol_id: body.protocol_id,
          event_type: 'assigned',
          event_data: {
            slot,
            start_date: startDate.toISOString(),
            assigned_by: body.assigned_by,
            mio_paused: !!pausedMioProtocolId,
          },
        });

        results.push({
          user_id: userId,
          success: true,
          assignment_id: assignment.id,
          mio_paused: !!pausedMioProtocolId,
        });
      } catch (userError) {
        results.push({
          user_id: userId,
          success: false,
          error: userError instanceof Error ? userError.message : 'Unknown error',
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    console.log(`Coach protocol assignment completed: ${successCount} success, ${failCount} failed`);

    return new Response(
      JSON.stringify({
        success: failCount === 0,
        summary: {
          total: body.user_ids.length,
          successful: successCount,
          failed: failCount,
          mio_paused: results.filter((r) => r.mio_paused).length,
        },
        results,
        protocol: {
          id: protocol.id,
          title: protocol.title,
          total_weeks: protocol.total_weeks,
        },
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error assigning coach protocols:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
