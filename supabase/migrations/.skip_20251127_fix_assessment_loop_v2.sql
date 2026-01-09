-- =====================================================
-- FIX ASSESSMENT LOOP - Complete Fix (v2)
-- =====================================================
-- This migration fixes the onboarding assessment loop where users
-- can't get past the assessment page after completing it.
--
-- IMPORTANT: This migration first adds missing columns, then applies fixes
--
-- Run this in Supabase SQL Editor to fix the issue
-- =====================================================

-- =====================================================
-- STEP 1: ADD MISSING COLUMNS TO user_onboarding
-- =====================================================
-- These columns are needed for proper onboarding tracking

ALTER TABLE public.user_onboarding
ADD COLUMN IF NOT EXISTS has_seen_welcome BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_step TEXT DEFAULT 'new_user',
ADD COLUMN IF NOT EXISTS milestones_completed JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS roadmap_first_visit TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS first_tactic_started TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS welcome_shown_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_user_onboarding_step
ON public.user_onboarding(onboarding_step);

CREATE INDEX IF NOT EXISTS idx_user_onboarding_welcome
ON public.user_onboarding(has_seen_welcome)
WHERE has_seen_welcome = FALSE;

-- =====================================================
-- STEP 2: FIX DEFAULT VALUE FOR assessment_completed_at
-- =====================================================
-- Change from DEFAULT NOW() to DEFAULT NULL
-- New users should NOT appear as having completed assessment

ALTER TABLE public.user_onboarding
ALTER COLUMN assessment_completed_at DROP DEFAULT;

ALTER TABLE public.user_onboarding
ALTER COLUMN assessment_completed_at SET DEFAULT NULL;

-- =====================================================
-- STEP 3: ADD UNIQUE CONSTRAINT ON user_id
-- =====================================================
-- Required for UPSERT (ON CONFLICT) to work correctly

DO $$
BEGIN
  -- Check if unique constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_onboarding_user_id_unique'
  ) THEN
    -- Add unique constraint
    ALTER TABLE public.user_onboarding
    ADD CONSTRAINT user_onboarding_user_id_unique UNIQUE(user_id);
    RAISE NOTICE 'Added UNIQUE constraint on user_onboarding.user_id';
  ELSE
    RAISE NOTICE 'UNIQUE constraint already exists';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Could not add unique constraint: % - continuing anyway', SQLERRM;
END $$;

-- =====================================================
-- STEP 4: FIX EXISTING RECORDS WITH WRONG TIMESTAMPS
-- =====================================================
-- Set assessment_completed_at to NULL for users who have a timestamp
-- but no actual assessment scores (they never really completed it)

UPDATE public.user_onboarding
SET assessment_completed_at = NULL
WHERE
  assessment_completed_at IS NOT NULL
  AND overall_score IS NULL
  AND financial_score IS NULL
  AND market_score IS NULL
  AND mindset_score IS NULL
  AND operational_score IS NULL;

-- =====================================================
-- STEP 5: UPDATE TRIGGER TO CREATE user_onboarding RECORD
-- =====================================================
-- The handle_new_user trigger now also creates the onboarding record

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create user_profiles record
  INSERT INTO public.user_profiles (
    id,
    email,
    created_at,
    updated_at,
    full_name,
    avatar_url,
    provider,
    email_verified_at,
    metadata,
    challenge_start_date,
    current_day,
    total_points,
    championship_level,
    onboarding_completed,
    timezone,
    tier_level,
    onboarding_status,
    current_journey_week,
    current_journey_day,
    daily_streak_count,
    longest_streak,
    login_count,
    last_login_at,
    onboarding_day_1_complete,
    onboarding_day_2_complete,
    onboarding_day_3_complete,
    include_credit_repair,
    notification_preferences,
    collision_patterns,
    target_demographics
  )
  VALUES (
    NEW.id,
    NEW.email,
    NOW(),
    NOW(),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
    CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN NEW.email_confirmed_at ELSE NULL END,
    COALESCE(NEW.raw_user_meta_data, '{}'::jsonb),
    NOW(),
    1,
    0,
    'bronze',
    false,
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'America/New_York'),
    'free',
    'incomplete',
    1,
    1,
    0,
    0,
    1,
    NOW(),
    false,
    false,
    false,
    false,
    '{"achievements": true, "daily_reminders": true, "partner_messages": true}'::jsonb,
    '{}'::jsonb,
    '[]'::jsonb
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), user_profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, user_profiles.avatar_url),
    provider = COALESCE(EXCLUDED.provider, user_profiles.provider),
    email_verified_at = COALESCE(EXCLUDED.email_verified_at, user_profiles.email_verified_at),
    metadata = COALESCE(EXCLUDED.metadata, user_profiles.metadata, '{}'::jsonb),
    last_login_at = NOW(),
    login_count = COALESCE(user_profiles.login_count, 0) + 1,
    updated_at = NOW();

  -- =====================================================
  -- Create user_onboarding record for assessment tracking
  -- =====================================================
  INSERT INTO public.user_onboarding (
    user_id,
    onboarding_step,
    has_seen_welcome,
    assessment_completed_at,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    'new_user',
    false,
    NULL,  -- DO NOT set timestamp - they haven't completed assessment yet!
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;  -- Don't overwrite if record exists

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user failed for user %: % (%)', NEW.id, SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS
'Universal user creation trigger for Mind Insurance and Grouphome apps.
- Creates user_profiles record with OAuth data
- Creates user_onboarding record with assessment_completed_at = NULL
- Preserves existing progress on re-authentication
- Last updated: 2025-11-27 - Fixed assessment loop issue';

-- =====================================================
-- STEP 6: BACKFILL user_onboarding for existing users
-- =====================================================
-- Create onboarding records for any users who have profiles but no onboarding record

INSERT INTO public.user_onboarding (
  user_id,
  onboarding_step,
  has_seen_welcome,
  assessment_completed_at,
  created_at,
  updated_at
)
SELECT
  up.id,
  'new_user',
  false,
  NULL,
  NOW(),
  NOW()
FROM public.user_profiles up
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_onboarding uo WHERE uo.user_id = up.id
)
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- STEP 7: VERIFICATION
-- =====================================================

DO $$
DECLARE
  users_without_onboarding INTEGER;
  users_with_wrong_timestamp INTEGER;
  total_onboarding_records INTEGER;
  column_exists BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ASSESSMENT LOOP FIX - VERIFICATION';
  RAISE NOTICE '========================================';

  -- Check if onboarding_step column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_onboarding' AND column_name = 'onboarding_step'
  ) INTO column_exists;

  IF column_exists THEN
    RAISE NOTICE 'onboarding_step column: EXISTS';
  ELSE
    RAISE NOTICE 'onboarding_step column: MISSING (this is a problem!)';
  END IF;

  -- Check for users without onboarding records
  SELECT COUNT(*) INTO users_without_onboarding
  FROM public.user_profiles up
  WHERE NOT EXISTS (
    SELECT 1 FROM public.user_onboarding uo WHERE uo.user_id = up.id
  );

  -- Check for users with timestamp but no scores
  SELECT COUNT(*) INTO users_with_wrong_timestamp
  FROM public.user_onboarding
  WHERE assessment_completed_at IS NOT NULL
    AND overall_score IS NULL;

  -- Total onboarding records
  SELECT COUNT(*) INTO total_onboarding_records
  FROM public.user_onboarding;

  RAISE NOTICE 'Users without onboarding record: % (should be 0)', users_without_onboarding;
  RAISE NOTICE 'Users with wrong timestamp (no scores but has timestamp): % (should be 0)', users_with_wrong_timestamp;
  RAISE NOTICE 'Total onboarding records: %', total_onboarding_records;

  IF users_without_onboarding = 0 AND users_with_wrong_timestamp = 0 AND column_exists THEN
    RAISE NOTICE '';
    RAISE NOTICE 'ALL CHECKS PASSED - Assessment loop should be fixed!';
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE 'Some issues may remain - please review above';
  END IF;

  RAISE NOTICE '========================================';
END $$;
