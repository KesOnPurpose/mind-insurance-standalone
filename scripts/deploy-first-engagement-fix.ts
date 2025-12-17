/**
 * Deploy MIO First Engagement RLS Fix
 *
 * This creates the inject_mio_first_engagement_message function that allows
 * the client to insert MIO's first engagement message after Identity Collision Assessment.
 *
 * Usage: SUPABASE_SERVICE_KEY=xxx npx tsx scripts/deploy-first-engagement-fix.ts
 */

import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = 'https://hpyodaugrkctagkrfofj.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_KEY environment variable is required');
  console.log('Get your service role key from: https://supabase.com/dashboard/project/hpyodaugrkctagkrfofj/settings/api');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function deployFix() {
  console.log('\n🔧 Deploying MIO First Engagement RLS Fix...\n');

  // Step 1: Drop existing function if exists
  console.log('1. Dropping existing function (if any)...');
  await supabase.rpc('exec_sql', {
    sql_query: `DROP FUNCTION IF EXISTS public.inject_mio_first_engagement_message(UUID, UUID, TEXT, TEXT);`
  }).catch(() => {
    // Function might not exist, that's fine
  });

  // Step 2: Create the function
  console.log('2. Creating inject_mio_first_engagement_message function...');

  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION public.inject_mio_first_engagement_message(
      p_thread_id UUID,
      p_user_id UUID,
      p_content TEXT,
      p_pattern_name TEXT DEFAULT NULL
    )
    RETURNS UUID
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    DECLARE
      v_message_id UUID;
      v_existing_id UUID;
    BEGIN
      -- Security check: Only allow for the authenticated user
      IF p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'User can only create first engagement message for themselves';
      END IF;

      -- Check if MIO first engagement message already exists (prevent duplicates)
      SELECT id INTO v_existing_id
      FROM public.mio_insights_messages
      WHERE user_id = p_user_id
        AND section_type = 'first_engagement'
        AND role = 'mio'
      LIMIT 1;

      IF v_existing_id IS NOT NULL THEN
        -- Already exists, return existing ID (idempotent)
        RETURN v_existing_id;
      END IF;

      -- Validate thread belongs to user
      IF NOT EXISTS (
        SELECT 1 FROM public.mio_insights_thread
        WHERE id = p_thread_id AND user_id = p_user_id
      ) THEN
        RAISE EXCEPTION 'Invalid thread ID for user';
      END IF;

      -- Insert the MIO first engagement message
      INSERT INTO public.mio_insights_messages (
        thread_id,
        user_id,
        role,
        content,
        section_type,
        section_energy,
        reward_tier,
        patterns_detected
      )
      VALUES (
        p_thread_id,
        p_user_id,
        'mio',
        p_content,
        'first_engagement',
        'commander',
        'standard',
        CASE
          WHEN p_pattern_name IS NOT NULL
          THEN jsonb_build_array(jsonb_build_object('pattern_name', p_pattern_name, 'confidence', 1.0))
          ELSE '[]'::jsonb
        END
      )
      RETURNING id INTO v_message_id;

      RETURN v_message_id;
    END;
    $$;
  `;

  const { error: createError } = await supabase.rpc('exec_sql', {
    sql_query: createFunctionSQL
  });

  if (createError) {
    console.error('  ❌ Error creating function:', createError.message);
    console.log('\n📋 Manual deployment required:');
    console.log('1. Go to: https://supabase.com/dashboard/project/hpyodaugrkctagkrfofj/sql/new');
    console.log('2. Paste the contents of: supabase/migrations/20251217_fix_mio_first_engagement_rls.sql');
    console.log('3. Click "Run"\n');
    return;
  }
  console.log('  ✅ Function created');

  // Step 3: Grant execute permission
  console.log('3. Granting execute permission...');
  const { error: grantError } = await supabase.rpc('exec_sql', {
    sql_query: `GRANT EXECUTE ON FUNCTION public.inject_mio_first_engagement_message TO authenticated;`
  });

  if (grantError) {
    console.error('  ❌ Error granting permission:', grantError.message);
  } else {
    console.log('  ✅ Permission granted');
  }

  // Step 4: Update section_type CHECK constraint
  console.log('4. Updating section_type CHECK constraint...');
  const updateConstraintSQL = `
    DO $$
    BEGIN
      ALTER TABLE public.mio_insights_messages
        DROP CONSTRAINT IF EXISTS mio_insights_messages_section_type_check;

      ALTER TABLE public.mio_insights_messages
        ADD CONSTRAINT mio_insights_messages_section_type_check
        CHECK (section_type IN ('PRO', 'TE', 'CT', 'reengagement', 'protocol', 'breakthrough', 'first_engagement', NULL));
    EXCEPTION
      WHEN others THEN
        RAISE NOTICE 'Could not update CHECK constraint: %', SQLERRM;
    END;
    $$;
  `;

  const { error: constraintError } = await supabase.rpc('exec_sql', {
    sql_query: updateConstraintSQL
  });

  if (constraintError) {
    console.error('  ⚠️  Warning updating constraint:', constraintError.message);
  } else {
    console.log('  ✅ Constraint updated');
  }

  console.log('\n✅ MIO First Engagement RLS Fix deployed successfully!');
  console.log('\nThe client can now insert MIO first engagement messages after Identity Collision Assessment.\n');
}

deployFix().catch(console.error);
