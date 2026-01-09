/**
 * Run Coach Protocol V2 Migration
 * Deploys the coach_protocols_v2 tables and related schema
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MIGRATION_SQL = `
-- =============================================
-- Coach Protocols V2: Multi-Week Protocol System
-- =============================================

-- Table 1: Main protocols table
CREATE TABLE IF NOT EXISTS coach_protocols_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  coach_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  total_weeks INTEGER NOT NULL DEFAULT 1 CHECK (total_weeks BETWEEN 1 AND 52),
  import_source VARCHAR(50) DEFAULT 'manual',
  import_metadata JSONB DEFAULT '{}',
  visibility VARCHAR(20) NOT NULL DEFAULT 'all_users',
  visibility_config JSONB DEFAULT '{}',
  schedule_type VARCHAR(30) DEFAULT 'immediate',
  start_date DATE,
  status VARCHAR(20) DEFAULT 'draft',
  version INTEGER DEFAULT 1,
  published_at TIMESTAMPTZ,
  theme_color VARCHAR(7) DEFAULT '#fac832',
  icon VARCHAR(50) DEFAULT 'book',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 2: Protocol tasks
CREATE TABLE IF NOT EXISTS coach_protocol_tasks_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id UUID NOT NULL REFERENCES coach_protocols_v2(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL CHECK (week_number >= 1),
  day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 7),
  task_order INTEGER NOT NULL DEFAULT 1,
  title VARCHAR(255) NOT NULL,
  instructions TEXT NOT NULL,
  task_type VARCHAR(30) NOT NULL DEFAULT 'action',
  time_of_day VARCHAR(20) DEFAULT 'throughout',
  estimated_minutes INTEGER,
  resource_url TEXT,
  resource_type VARCHAR(30),
  success_criteria TEXT[] DEFAULT '{}',
  week_theme VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(protocol_id, week_number, day_number, task_order)
);

-- Table 3: User assignments
CREATE TABLE IF NOT EXISTS user_coach_protocol_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  protocol_id UUID NOT NULL REFERENCES coach_protocols_v2(id) ON DELETE CASCADE,
  assignment_slot VARCHAR(10) NOT NULL DEFAULT 'primary',
  current_week INTEGER DEFAULT 1,
  current_day INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'active',
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_advanced_at TIMESTAMPTZ,
  days_completed INTEGER DEFAULT 0,
  days_skipped INTEGER DEFAULT 0,
  total_tasks_completed INTEGER DEFAULT 0,
  paused_mio_protocol_id UUID,
  assigned_by UUID REFERENCES user_profiles(id),
  assignment_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, assignment_slot)
);

-- Table 4: Task completions
CREATE TABLE IF NOT EXISTS coach_protocol_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES user_coach_protocol_assignments(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES coach_protocol_tasks_v2(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  response_data JSONB DEFAULT '{}',
  notes TEXT,
  time_spent_minutes INTEGER,
  was_skipped BOOLEAN DEFAULT false,
  auto_skipped BOOLEAN DEFAULT false,
  skip_reason TEXT,
  self_rating INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assignment_id, task_id)
);

-- Table 5: Completion events (for analytics)
CREATE TABLE IF NOT EXISTS coach_protocol_completion_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES user_coach_protocol_assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  protocol_id UUID NOT NULL REFERENCES coach_protocols_v2(id) ON DELETE CASCADE,
  event_type VARCHAR(30) NOT NULL,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cpv2_coach ON coach_protocols_v2(coach_id);
CREATE INDEX IF NOT EXISTS idx_cpv2_status ON coach_protocols_v2(status);
CREATE INDEX IF NOT EXISTS idx_cptv2_protocol ON coach_protocol_tasks_v2(protocol_id);
CREATE INDEX IF NOT EXISTS idx_ucpa_user ON user_coach_protocol_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_ucpa_protocol ON user_coach_protocol_assignments(protocol_id);
CREATE INDEX IF NOT EXISTS idx_cpc_assignment ON coach_protocol_completions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_cpce_user ON coach_protocol_completion_events(user_id);

-- Enable RLS
ALTER TABLE coach_protocols_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_protocol_tasks_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_coach_protocol_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_protocol_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_protocol_completion_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for coach_protocols_v2
DROP POLICY IF EXISTS "Service role full access cpv2" ON coach_protocols_v2;
CREATE POLICY "Service role full access cpv2" ON coach_protocols_v2 FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins manage cpv2" ON coach_protocols_v2;
CREATE POLICY "Admins manage cpv2" ON coach_protocols_v2 FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.is_active = true))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.is_active = true));

DROP POLICY IF EXISTS "Users view published cpv2" ON coach_protocols_v2;
CREATE POLICY "Users view published cpv2" ON coach_protocols_v2 FOR SELECT TO authenticated
  USING (status = 'published');

-- RLS Policies for coach_protocol_tasks_v2
DROP POLICY IF EXISTS "Service role full access cptv2" ON coach_protocol_tasks_v2;
CREATE POLICY "Service role full access cptv2" ON coach_protocol_tasks_v2 FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins manage cptv2" ON coach_protocol_tasks_v2;
CREATE POLICY "Admins manage cptv2" ON coach_protocol_tasks_v2 FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.is_active = true))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.is_active = true));

DROP POLICY IF EXISTS "Users view assigned tasks" ON coach_protocol_tasks_v2;
CREATE POLICY "Users view assigned tasks" ON coach_protocol_tasks_v2 FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_coach_protocol_assignments WHERE protocol_id = coach_protocol_tasks_v2.protocol_id AND user_id = auth.uid()));

-- RLS Policies for user_coach_protocol_assignments
DROP POLICY IF EXISTS "Service role full access ucpa" ON user_coach_protocol_assignments;
CREATE POLICY "Service role full access ucpa" ON user_coach_protocol_assignments FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins manage ucpa" ON user_coach_protocol_assignments;
CREATE POLICY "Admins manage ucpa" ON user_coach_protocol_assignments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.is_active = true))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.is_active = true));

DROP POLICY IF EXISTS "Users view own ucpa" ON user_coach_protocol_assignments;
CREATE POLICY "Users view own ucpa" ON user_coach_protocol_assignments FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users update own ucpa" ON user_coach_protocol_assignments;
CREATE POLICY "Users update own ucpa" ON user_coach_protocol_assignments FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- RLS Policies for coach_protocol_completions
DROP POLICY IF EXISTS "Service role full access cpc" ON coach_protocol_completions;
CREATE POLICY "Service role full access cpc" ON coach_protocol_completions FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins view cpc" ON coach_protocol_completions;
CREATE POLICY "Admins view cpc" ON coach_protocol_completions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.is_active = true));

DROP POLICY IF EXISTS "Users manage own cpc" ON coach_protocol_completions;
CREATE POLICY "Users manage own cpc" ON coach_protocol_completions FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- RLS Policies for coach_protocol_completion_events
DROP POLICY IF EXISTS "Service role full access cpce" ON coach_protocol_completion_events;
CREATE POLICY "Service role full access cpce" ON coach_protocol_completion_events FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins view cpce" ON coach_protocol_completion_events;
CREATE POLICY "Admins view cpce" ON coach_protocol_completion_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.is_active = true));

DROP POLICY IF EXISTS "Users view own cpce" ON coach_protocol_completion_events;
CREATE POLICY "Users view own cpce" ON coach_protocol_completion_events FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Extend MIO table for coach protocol integration
ALTER TABLE mio_weekly_protocols ADD COLUMN IF NOT EXISTS paused_by_coach_protocol_id UUID;
`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const dbUrl = Deno.env.get('SUPABASE_DB_URL');
    if (!dbUrl) {
      throw new Error('SUPABASE_DB_URL not configured');
    }

    const { Client } = await import('https://deno.land/x/postgres@v0.17.0/mod.ts');

    const client = new Client(dbUrl);
    await client.connect();

    // Run the migration
    await client.queryArray(MIGRATION_SQL);

    await client.end();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Coach Protocols V2 migration completed successfully',
        tables_created: [
          'coach_protocols_v2',
          'coach_protocol_tasks_v2',
          'user_coach_protocol_assignments',
          'coach_protocol_completions',
          'coach_protocol_completion_events'
        ]
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Migration error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
