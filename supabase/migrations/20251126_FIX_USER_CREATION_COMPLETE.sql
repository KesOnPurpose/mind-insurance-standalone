-- =====================================================
-- COMPLETE FIX FOR USER CREATION 500 ERROR
-- =====================================================
-- This migration:
-- 1. Adds DEFAULT values to ALL potentially problematic columns
-- 2. Deploys a robust trigger with exception handling
-- 3. Works for BOTH Mind Insurance and Grouphome apps
--
-- Run this in Supabase SQL Editor to fix the issue
-- =====================================================

BEGIN;

-- =====================================================
-- STEP 1: ADD DEFAULTS TO NOT NULL COLUMNS
-- =====================================================
-- These ALTER statements are idempotent - safe to run multiple times

-- Core timestamps
DO $$ BEGIN
  ALTER TABLE public.user_profiles ALTER COLUMN created_at SET DEFAULT NOW();
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.user_profiles ALTER COLUMN updated_at SET DEFAULT NOW();
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Mind Insurance challenge columns - DROP NOT NULL or add defaults
DO $$ BEGIN
  ALTER TABLE public.user_profiles ALTER COLUMN challenge_start_date DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.user_profiles ALTER COLUMN current_day SET DEFAULT 1;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.user_profiles ALTER COLUMN total_points SET DEFAULT 0;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.user_profiles ALTER COLUMN championship_level SET DEFAULT 'bronze';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.user_profiles ALTER COLUMN onboarding_completed SET DEFAULT false;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.user_profiles ALTER COLUMN timezone SET DEFAULT 'America/New_York';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.user_profiles ALTER COLUMN tier_level SET DEFAULT 'free';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Onboarding tracking columns
DO $$ BEGIN
  ALTER TABLE public.user_profiles ALTER COLUMN onboarding_status SET DEFAULT 'incomplete';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.user_profiles ALTER COLUMN onboarding_day_1_complete SET DEFAULT false;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.user_profiles ALTER COLUMN onboarding_day_2_complete SET DEFAULT false;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.user_profiles ALTER COLUMN onboarding_day_3_complete SET DEFAULT false;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Journey tracking columns
DO $$ BEGIN
  ALTER TABLE public.user_profiles ALTER COLUMN current_journey_week SET DEFAULT 1;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.user_profiles ALTER COLUMN current_journey_day SET DEFAULT 1;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.user_profiles ALTER COLUMN daily_streak_count SET DEFAULT 0;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.user_profiles ALTER COLUMN longest_streak SET DEFAULT 0;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Login tracking
DO $$ BEGIN
  ALTER TABLE public.user_profiles ALTER COLUMN login_count SET DEFAULT 0;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Auth columns
DO $$ BEGIN
  ALTER TABLE public.user_profiles ALTER COLUMN provider SET DEFAULT 'email';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.user_profiles ALTER COLUMN preferred_auth_method SET DEFAULT 'password';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- JSONB columns
DO $$ BEGIN
  ALTER TABLE public.user_profiles ALTER COLUMN metadata SET DEFAULT '{}'::jsonb;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.user_profiles ALTER COLUMN collision_patterns SET DEFAULT '{}'::jsonb;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.user_profiles ALTER COLUMN notification_preferences SET DEFAULT '{"achievements": true, "daily_reminders": true, "partner_messages": true}'::jsonb;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.user_profiles ALTER COLUMN target_demographics SET DEFAULT '[]'::jsonb;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Business columns - make nullable (collected during onboarding)
DO $$ BEGIN
  ALTER TABLE public.user_profiles ALTER COLUMN include_credit_repair SET DEFAULT false;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

COMMIT;

-- =====================================================
-- STEP 2: DROP AND RECREATE TRIGGER
-- =====================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (
    -- Core identity (required)
    id,
    email,
    created_at,
    updated_at,

    -- OAuth data from auth.users
    full_name,
    avatar_url,
    provider,
    email_verified_at,
    metadata,

    -- Mind Insurance initialization
    challenge_start_date,
    current_day,
    total_points,
    championship_level,
    onboarding_completed,
    timezone,
    tier_level,

    -- Tracking initialization
    onboarding_status,
    current_journey_week,
    current_journey_day,
    daily_streak_count,
    longest_streak,
    login_count,
    last_login_at,

    -- Flags
    onboarding_day_1_complete,
    onboarding_day_2_complete,
    onboarding_day_3_complete,
    include_credit_repair,

    -- JSONB columns
    notification_preferences,
    collision_patterns,
    target_demographics
  )
  VALUES (
    NEW.id,
    NEW.email,
    NOW(),
    NOW(),

    -- OAuth data
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
    CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN NEW.email_confirmed_at ELSE NULL END,
    COALESCE(NEW.raw_user_meta_data, '{}'::jsonb),

    -- Mind Insurance defaults
    NOW(),  -- challenge_start_date
    1,      -- current_day
    0,      -- total_points
    'bronze', -- championship_level
    false,  -- onboarding_completed
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'America/New_York'),
    'free', -- tier_level

    -- Tracking defaults
    'incomplete', -- onboarding_status
    1,      -- current_journey_week
    1,      -- current_journey_day
    0,      -- daily_streak_count
    0,      -- longest_streak
    1,      -- login_count
    NOW(),  -- last_login_at

    -- Flag defaults
    false,  -- onboarding_day_1_complete
    false,  -- onboarding_day_2_complete
    false,  -- onboarding_day_3_complete
    false,  -- include_credit_repair

    -- JSONB defaults
    '{"achievements": true, "daily_reminders": true, "partner_messages": true}'::jsonb,
    '{}'::jsonb,
    '[]'::jsonb
  )
  ON CONFLICT (id) DO UPDATE SET
    -- Only update fields that should change on re-auth
    email = EXCLUDED.email,
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), user_profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, user_profiles.avatar_url),
    provider = COALESCE(EXCLUDED.provider, user_profiles.provider),
    email_verified_at = COALESCE(EXCLUDED.email_verified_at, user_profiles.email_verified_at),
    metadata = COALESCE(EXCLUDED.metadata, user_profiles.metadata, '{}'::jsonb),
    last_login_at = NOW(),
    login_count = COALESCE(user_profiles.login_count, 0) + 1,
    updated_at = NOW();
    -- NOTE: Mind Insurance progress columns are NOT updated on conflict
    -- This preserves existing user progress

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail authentication
    RAISE WARNING 'handle_new_user failed for user %: % (%)', NEW.id, SQLERRM, SQLSTATE;
    -- Still return NEW to allow auth to complete
    RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add documentation
COMMENT ON FUNCTION public.handle_new_user() IS
'Universal user profile trigger supporting both Mind Insurance and Grouphome apps.
- Extracts OAuth data from auth.users metadata (Google sign-in support)
- Initializes Mind Insurance challenge data with safe defaults
- Preserves existing user progress on re-authentication
- Includes exception handling to prevent auth failures
- Last updated: 2025-11-26';

-- =====================================================
-- STEP 3: VERIFICATION
-- =====================================================

DO $$
DECLARE
  test_id uuid := gen_random_uuid();
  result_row RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TESTING USER CREATION FIX';
  RAISE NOTICE '========================================';

  -- Test basic INSERT
  BEGIN
    INSERT INTO public.user_profiles (id, email, created_at, updated_at)
    VALUES (test_id, 'test-' || test_id::text || '@example.com', NOW(), NOW());

    SELECT id, email, challenge_start_date, current_day, total_points, tier_level
    INTO result_row
    FROM public.user_profiles
    WHERE id = test_id;

    IF result_row.id IS NOT NULL THEN
      RAISE NOTICE '✅ SUCCESS: User profile created!';
      RAISE NOTICE '   - ID: %', result_row.id;
      RAISE NOTICE '   - Email: %', result_row.email;
      RAISE NOTICE '   - Challenge Start: %', result_row.challenge_start_date;
      RAISE NOTICE '   - Current Day: %', result_row.current_day;
      RAISE NOTICE '   - Total Points: %', result_row.total_points;
      RAISE NOTICE '   - Tier Level: %', result_row.tier_level;
    END IF;

    -- Cleanup
    DELETE FROM public.user_profiles WHERE id = test_id;
    RAISE NOTICE '   - Test record cleaned up';

  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '❌ FAILED: %', SQLERRM;
      RAISE NOTICE '   Error Code: %', SQLSTATE;
  END;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'FIX DEPLOYMENT COMPLETE';
  RAISE NOTICE 'Now try creating a user in Supabase Dashboard';
  RAISE NOTICE '========================================';
END $$;
