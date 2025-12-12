/**
 * Initialize Admin RLS Policies Edge Function
 * Phase 29: Fix RLS policies for admin access to MIO tables
 *
 * This creates:
 * - Admin policies for mio_user_groups
 * - Admin policies for mio_user_group_members
 * - Admin policies for mio_report_automation
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// SQL to fix RLS policies
const INIT_SQL = `
-- =============================================
-- Section 1: Drop Existing Restrictive Policies
-- =============================================

-- Drop the overly restrictive service_role-only policies
DROP POLICY IF EXISTS "Service role has full access to user groups" ON mio_user_groups;
DROP POLICY IF EXISTS "Service role has full access to group members" ON mio_user_group_members;
DROP POLICY IF EXISTS "Service role has full access to report automation" ON mio_report_automation;

-- Drop any existing admin policies to avoid conflicts
DROP POLICY IF EXISTS "Admins and service role can manage user groups" ON mio_user_groups;
DROP POLICY IF EXISTS "Admins and service role can manage group members" ON mio_user_group_members;
DROP POLICY IF EXISTS "Admins and service role can manage report automation" ON mio_report_automation;
DROP POLICY IF EXISTS "Users can view groups they belong to" ON mio_user_groups;
DROP POLICY IF EXISTS "Users can view their own group memberships" ON mio_user_group_members;

-- =============================================
-- Section 2: Create New Admin-Accessible Policies
-- =============================================

-- Policy: mio_user_groups - Allow admins and service role
CREATE POLICY "Admins and service role can manage user groups"
  ON mio_user_groups FOR ALL
  USING (
    -- Allow service role (n8n, backend operations)
    auth.jwt() ->> 'role' = 'service_role'
    OR
    -- Allow active admin users
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
      AND au.is_active = true
    )
  )
  WITH CHECK (
    auth.jwt() ->> 'role' = 'service_role'
    OR
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
      AND au.is_active = true
    )
  );

-- Policy: mio_user_group_members - Allow admins and service role
CREATE POLICY "Admins and service role can manage group members"
  ON mio_user_group_members FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'service_role'
    OR
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
      AND au.is_active = true
    )
  )
  WITH CHECK (
    auth.jwt() ->> 'role' = 'service_role'
    OR
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
      AND au.is_active = true
    )
  );

-- Policy: mio_report_automation - Allow admins and service role
CREATE POLICY "Admins and service role can manage report automation"
  ON mio_report_automation FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'service_role'
    OR
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
      AND au.is_active = true
    )
  )
  WITH CHECK (
    auth.jwt() ->> 'role' = 'service_role'
    OR
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
      AND au.is_active = true
    )
  );

-- =============================================
-- Section 3: Add Read Access for Users to See Their Groups
-- =============================================

-- Users can see groups they are members of (for potential future features)
CREATE POLICY "Users can view groups they belong to"
  ON mio_user_groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM mio_user_group_members ugm
      WHERE ugm.group_id = mio_user_groups.id
      AND ugm.user_id = auth.uid()
    )
  );

-- Users can see their own group memberships
CREATE POLICY "Users can view their own group memberships"
  ON mio_user_group_members FOR SELECT
  USING (user_id = auth.uid());
`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Require service role authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.includes('service_role')) {
      // Check for secret token in body
      const body = await req.json().catch(() => ({}));
      if (body.init_token !== 'mio-init-29-admin-rls') {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Get database URL
    const dbUrl = Deno.env.get('SUPABASE_DB_URL');
    if (!dbUrl) {
      throw new Error('Database URL not configured');
    }

    // Execute SQL using Postgres client
    const { Client } = await import('https://deno.land/x/postgres@v0.17.0/mod.ts');
    const client = new Client(dbUrl);
    await client.connect();

    // Execute the initialization SQL
    await client.queryArray(INIT_SQL);
    await client.end();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Admin RLS policies initialized successfully',
        policies: [
          'Admins and service role can manage user groups',
          'Admins and service role can manage group members',
          'Admins and service role can manage report automation',
          'Users can view groups they belong to',
          'Users can view their own group memberships',
        ],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Init error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
