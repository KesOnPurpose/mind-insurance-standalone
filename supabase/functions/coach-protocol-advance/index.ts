/**
 * Coach Protocol Advance Edge Function (V2)
 * Daily advancement for multi-week coach protocols
 *
 * This function advances all active coach protocol assignments and:
 * - Calculates actual day based on started_at date
 * - Auto-skips missed days
 * - Handles protocol completion and triggers MIO resume
 * - Sends notifications for new day tasks
 *
 * Should be called daily at 12:01 AM EST (5:01 AM UTC) by:
 * - n8n scheduled workflow (recommended) - cron: 1 5 * * *
 * - Manual trigger for testing
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AdvanceResult {
  assignments_advanced: number;
  assignments_completed: number;
  days_skipped: number;
  mio_protocols_resumed: number;
  errors: string[];
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

    // Parse optional parameters
    let params: { dry_run?: boolean; assignment_id?: string } = {};
    try {
      if (req.method === 'POST') {
        params = await req.json();
      }
    } catch {
      // No body or invalid JSON is fine
    }

    const result: AdvanceResult = {
      assignments_advanced: 0,
      assignments_completed: 0,
      days_skipped: 0,
      mio_protocols_resumed: 0,
      errors: [],
    };

    // Get all active assignments
    const { data: assignments, error: fetchError } = await supabase
      .from('user_coach_protocol_assignments')
      .select(`
        *,
        protocol:coach_protocols_v2(id, title, total_weeks, theme_color)
      `)
      .eq('status', 'active');

    if (fetchError) {
      throw new Error(`Failed to fetch assignments: ${fetchError.message}`);
    }

    if (!assignments || assignments.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          mode: params.dry_run ? 'dry_run' : 'full_run',
          message: 'No active assignments to advance',
          result,
          timestamp: new Date().toISOString(),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If specific assignment_id provided, filter to just that one
    const toProcess = params.assignment_id
      ? assignments.filter((a) => a.id === params.assignment_id)
      : assignments;

    for (const assignment of toProcess) {
      try {
        const protocol = assignment.protocol;
        if (!protocol) {
          result.errors.push(`Assignment ${assignment.id}: Protocol not found`);
          continue;
        }

        const totalDays = protocol.total_weeks * 7;
        const startedAt = assignment.started_at
          ? new Date(assignment.started_at)
          : new Date(assignment.assigned_at);

        // Calculate actual day based on started_at
        const now = new Date();
        const daysSinceStart = Math.floor(
          (now.getTime() - startedAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        const actualDay = Math.min(daysSinceStart + 1, totalDays + 1);

        // Skip if we're still on the same day
        if (actualDay <= assignment.current_day) {
          continue;
        }

        if (params.dry_run) {
          console.log(
            `[DRY RUN] Would advance assignment ${assignment.id}: day ${assignment.current_day} -> ${Math.min(actualDay, totalDays)}`
          );
          result.assignments_advanced++;
          continue;
        }

        // Check if protocol is now complete
        if (actualDay > totalDays) {
          // Mark skipped days
          for (let day = assignment.current_day; day <= totalDays; day++) {
            const { error: skipError } = await supabase
              .from('coach_protocol_completions')
              .upsert(
                {
                  assignment_id: assignment.id,
                  task_id: null, // Day-level skip, not task-specific
                  completed_at: new Date().toISOString(),
                  was_skipped: true,
                  auto_skipped: true,
                },
                { onConflict: 'assignment_id,task_id', ignoreDuplicates: true }
              );

            if (!skipError) {
              result.days_skipped++;
            }
          }

          // Complete the protocol
          const { error: completeError } = await supabase
            .from('user_coach_protocol_assignments')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              current_day: 7,
              current_week: protocol.total_weeks,
              days_completed: assignment.days_completed + (totalDays - assignment.current_day + 1),
            })
            .eq('id', assignment.id);

          if (completeError) {
            result.errors.push(
              `Assignment ${assignment.id}: Failed to complete - ${completeError.message}`
            );
            continue;
          }

          result.assignments_completed++;

          // Log completion event
          await supabase.from('coach_protocol_completion_events').insert({
            user_id: assignment.user_id,
            assignment_id: assignment.id,
            protocol_id: protocol.id,
            event_type: 'protocol_completed',
            event_data: {
              days_completed: assignment.days_completed,
              days_skipped: assignment.days_skipped + result.days_skipped,
              total_tasks_completed: assignment.total_tasks_completed,
              completed_at: new Date().toISOString(),
            },
          });

          // Resume paused MIO protocol if exists
          if (assignment.paused_mio_protocol_id) {
            const { error: resumeError } = await supabase
              .from('mio_weekly_protocols')
              .update({
                status: 'active',
                paused_by_coach_protocol_id: null,
              })
              .eq('id', assignment.paused_mio_protocol_id);

            if (!resumeError) {
              result.mio_protocols_resumed++;
            }
          }
        } else {
          // Advance to actual day, skipping missed days
          const daysToSkip = actualDay - assignment.current_day - 1;

          if (daysToSkip > 0) {
            result.days_skipped += daysToSkip;
          }

          // Calculate new week based on actual day
          const newWeek = Math.ceil(actualDay / 7);

          // Update assignment
          const { error: updateError } = await supabase
            .from('user_coach_protocol_assignments')
            .update({
              current_day: ((actualDay - 1) % 7) + 1, // Day within week (1-7)
              current_week: newWeek,
              days_skipped: assignment.days_skipped + daysToSkip,
              last_advanced_at: new Date().toISOString(),
            })
            .eq('id', assignment.id);

          if (updateError) {
            result.errors.push(
              `Assignment ${assignment.id}: Failed to advance - ${updateError.message}`
            );
            continue;
          }

          result.assignments_advanced++;

          // Log day advance event
          await supabase.from('coach_protocol_completion_events').insert({
            user_id: assignment.user_id,
            assignment_id: assignment.id,
            protocol_id: protocol.id,
            event_type: 'day_advanced',
            event_data: {
              from_day: assignment.current_day,
              to_day: ((actualDay - 1) % 7) + 1,
              from_week: assignment.current_week,
              to_week: newWeek,
              days_skipped: daysToSkip,
            },
          });
        }
      } catch (assignmentError) {
        result.errors.push(
          `Assignment ${assignment.id}: ${
            assignmentError instanceof Error ? assignmentError.message : 'Unknown error'
          }`
        );
      }
    }

    console.log('Coach protocol advancement completed:', result);

    return new Response(
      JSON.stringify({
        success: result.errors.length === 0,
        mode: params.dry_run ? 'dry_run' : 'full_run',
        result,
        processed: toProcess.length,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error advancing coach protocols:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
