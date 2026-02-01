import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { user_id, practice_type, practice_date, data } = await req.json();

    if (!user_id || !practice_type || !practice_date) {
      throw new Error('Missing required fields');
    }

    // Check if practice already completed today
    const { data: existing } = await supabaseClient
      .from('daily_practices')
      .select('id')
      .eq('user_id', user_id)
      .eq('practice_date', practice_date)
      .eq('practice_type', practice_type)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ error: 'Practice already completed today' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate points based on time windows
    const now = new Date();
    const currentHour = now.getHours();
    
    let basePoints = 0;
    let isLate = false;
    
    // Base points for each practice
    const pointsMap: Record<string, number> = {
      'P': 10,
      'R': 15,
      'O': 15,
      'T': 10,
      'E': 10,
      'C': 15,
      'T2': 15
    };
    
    basePoints = pointsMap[practice_type] || 10;
    
    // Check time windows
    if (['P', 'R', 'O'].includes(practice_type) && currentHour >= 10) {
      isLate = true;
    } else if (['T', 'E'].includes(practice_type) && currentHour >= 15) {
      isLate = true;
    } else if (['C', 'T2'].includes(practice_type) && currentHour >= 22) {
      isLate = true;
    }
    
    const pointsEarned = isLate ? Math.floor(basePoints * 0.5) : basePoints;

    // Save practice
    const { error: insertError } = await supabaseClient
      .from('daily_practices')
      .insert({
        user_id,
        practice_type,
        practice_date,
        data,
        points_earned: pointsEarned,
        is_late: isLate,
        completed: true,
        completed_at: new Date().toISOString()
      });

    if (insertError) throw insertError;

    // Update user total points
    const { error: updateError } = await supabaseClient.rpc('increment_user_points', {
      user_id_param: user_id,
      points_param: pointsEarned
    });

    if (updateError) {
      console.error('Error updating user points:', updateError);
    }

    // Check section completion
    let sectionComplete = null;
    let mioFeedback = null;
    
    const sectionMap: Record<string, string[]> = {
      'PRO': ['P', 'R', 'O'],
      'TE': ['T', 'E'],
      'CT': ['C', 'T2']
    };
    
    for (const [section, practices] of Object.entries(sectionMap)) {
      if (practices.includes(practice_type)) {
        const { data: completed } = await supabaseClient
          .from('daily_practices')
          .select('practice_type')
          .eq('user_id', user_id)
          .eq('practice_date', practice_date)
          .in('practice_type', practices);
        
        if (completed && completed.length === practices.length) {
          sectionComplete = section;
          
          // Invalidate MIO cache after practice completion
          try {
            await fetch(
              `${Deno.env.get('SUPABASE_URL')}/functions/v1/invalidate-cache`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': req.headers.get('Authorization')!,
                },
                body: JSON.stringify({
                  user_id,
                  trigger_type: 'practice_completion'
                })
              }
            );
            console.log('[Cache] Invalidation triggered for practice completion');
          } catch (cacheError) {
            console.error('[Cache] Invalidation failed:', cacheError);
            // Don't fail the request if cache invalidation fails
          }
          
          // Call MIO section feedback
          const feedbackResponse = await fetch(
            `${Deno.env.get('SUPABASE_URL')}/functions/v1/mio-section-feedback`,
            {
              method: 'POST',
              headers: {
                'Authorization': req.headers.get('Authorization')!,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                user_id,
                section,
                practice_date
              })
            }
          );
          
          if (feedbackResponse.ok) {
            mioFeedback = await feedbackResponse.json();
          }
        }
        break;
      }
    }

    // Update streak (check if this is first practice today)
    const { data: todayPractices } = await supabaseClient
      .from('daily_practices')
      .select('id')
      .eq('user_id', user_id)
      .eq('practice_date', practice_date);

    if (todayPractices && todayPractices.length === 1) {
      // First practice today - update streak
      await supabaseClient.rpc('update_practice_streak', {
        user_id_param: user_id,
        practice_date_param: practice_date
      });
    }

    // Get current streak
    const { data: userProfile } = await supabaseClient
      .from('user_profiles')
      .select('current_streak, total_points')
      .eq('id', user_id)
      .single();

    // Sync MIO data to GHL after practice completion (for Voice AI context)
    // This runs async and doesn't block the response
    if (sectionComplete) {
      try {
        // Call sync-mio-to-ghl Edge Function directly (more reliable than N8n webhook)
        const syncResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/sync-mio-to-ghl`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
            },
            body: JSON.stringify({ user_id })
          }
        );

        if (syncResponse.ok) {
          console.log('[GHL Sync] Successfully synced MIO data to GHL after section completion');
        } else {
          const syncError = await syncResponse.text();
          console.error('[GHL Sync] Failed to sync:', syncError);
        }
      } catch (syncError) {
        console.error('[GHL Sync] Exception during sync:', syncError);
        // Don't fail the practice save if GHL sync fails
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        points_earned: pointsEarned,
        is_late: isLate,
        section_complete: sectionComplete,
        mio_feedback: mioFeedback,
        current_streak: userProfile?.current_streak || 0,
        total_points: userProfile?.total_points || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in save-practice:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
