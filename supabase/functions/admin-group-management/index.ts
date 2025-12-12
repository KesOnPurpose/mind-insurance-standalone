/**
 * Admin Group Management Edge Function
 * Phase 29: Handles admin operations on MIO user groups
 *
 * This function bypasses RLS by using service role key internally,
 * while still validating that the requesting user is an admin.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  action: 'create_group' | 'update_group' | 'delete_group' | 'add_member' | 'remove_member' | 'list_groups' | 'list_users' | 'get_group_members';
  data?: Record<string, any>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get the user's auth token to verify they're an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Create client with user's token to get their identity
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the authenticated user
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create service role client for admin operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is an admin
    const { data: adminUser, error: adminError } = await adminClient
      .from('admin_users')
      .select('id, role, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (adminError || !adminUser) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: RequestBody = await req.json();
    const { action, data } = body;

    // Handle actions
    let result: any;

    switch (action) {
      case 'list_groups':
        result = await adminClient
          .from('mio_user_groups')
          .select('*')
          .order('group_type', { ascending: true })
          .order('name', { ascending: true });
        break;

      case 'list_users':
        // Query gh_approved_users with service role (bypasses RLS)
        // Only return users with user_id populated (they have signed up)
        result = await adminClient
          .from('gh_approved_users')
          .select('id, full_name, email, user_id, tier')
          .eq('is_active', true)
          .not('user_id', 'is', null)
          .order('full_name', { ascending: true });
        break;

      case 'create_group':
        if (!data?.name) {
          return new Response(
            JSON.stringify({ error: 'Group name is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        result = await adminClient
          .from('mio_user_groups')
          .insert({
            name: data.name,
            description: data.description || null,
            group_type: 'custom',
            created_by: user.id,
          })
          .select()
          .single();
        break;

      case 'update_group':
        if (!data?.id || !data?.name) {
          return new Response(
            JSON.stringify({ error: 'Group ID and name are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        result = await adminClient
          .from('mio_user_groups')
          .update({
            name: data.name,
            description: data.description || null,
          })
          .eq('id', data.id)
          .eq('group_type', 'custom') // Only allow editing custom groups
          .select()
          .single();
        break;

      case 'delete_group':
        if (!data?.id) {
          return new Response(
            JSON.stringify({ error: 'Group ID is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        result = await adminClient
          .from('mio_user_groups')
          .delete()
          .eq('id', data.id)
          .eq('group_type', 'custom'); // Only allow deleting custom groups
        break;

      case 'add_member':
        if (!data?.group_id || !data?.user_id) {
          return new Response(
            JSON.stringify({ error: 'Group ID and user ID are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        result = await adminClient
          .from('mio_user_group_members')
          .insert({
            group_id: data.group_id,
            user_id: data.user_id,
            added_by: user.id,
          })
          .select()
          .single();
        break;

      case 'remove_member':
        if (!data?.member_id) {
          return new Response(
            JSON.stringify({ error: 'Member ID is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        result = await adminClient
          .from('mio_user_group_members')
          .delete()
          .eq('id', data.member_id);
        break;

      case 'get_group_members':
        if (!data?.groupId) {
          return new Response(
            JSON.stringify({ error: 'Group ID is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        console.log('Fetching members for group:', data.groupId);
        result = await adminClient
          .from('mio_user_group_members')
          .select('id, user_id')
          .eq('group_id', data.groupId);
        console.log('Members result:', JSON.stringify(result));
        // Return empty array if no members found (not an error)
        if (!result.error && (!result.data || result.data.length === 0)) {
          console.log('No members found for group, returning empty array');
        }
        break;

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    console.log(`Action ${action} completed. Result:`, JSON.stringify({ error: result?.error, dataLength: result?.data?.length }));

    if (result?.error) {
      console.error(`Error in ${action}:`, result.error);
      return new Response(
        JSON.stringify({ error: result.error.message || 'Database operation failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: result?.data || [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    console.error('Error stack:', error?.stack);
    return new Response(
      JSON.stringify({ error: error?.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
