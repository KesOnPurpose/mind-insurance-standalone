-- ============================================================================
-- Migration: Add user_source Column to user_profiles
-- Purpose: Track which product/domain users signed up from
-- Author: Claude Code
-- Date: 2025-12-17
-- ============================================================================

-- Step 1: Add user_source column to user_profiles
-- This column tracks where the user originally signed up from:
--   - 'mi_standalone' = Mind Insurance standalone app (mymindinsurance.com)
--   - 'gh_user' = Grouphome app (grouphome4newbies.com)
--   - 'unknown' = Legacy users or unknown signup source

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS user_source TEXT DEFAULT 'unknown';

-- Add comment for documentation
COMMENT ON COLUMN public.user_profiles.user_source IS
  'Source domain where user signed up: mi_standalone, gh_user, unknown';

-- Step 2: Create index for filtering users by source
-- This enables fast queries when filtering by user_source in admin panels
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_source
ON public.user_profiles(user_source);

-- Step 3: Backfill existing MI legacy users
-- All users created before December 2025 are legacy MI standalone users
-- (The MI standalone app was launched in October 2025)
UPDATE public.user_profiles
SET user_source = 'mi_standalone'
WHERE user_source = 'unknown'
  AND created_at < '2025-12-01'::timestamp
  AND email NOT LIKE '%test%'
  AND email NOT LIKE '%example%';

-- Step 4: Update handle_new_user() trigger to extract user_source from metadata
-- This ensures new signups automatically get tagged with the correct user_source

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id,
    email,
    full_name,
    avatar_url,
    provider,
    user_source,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
    -- Extract user_source from metadata (set during signup via domainDetectionService)
    COALESCE(NEW.raw_user_meta_data->>'user_source', 'unknown'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, user_profiles.avatar_url),
    -- Only update user_source if the new value is not 'unknown'
    -- This preserves existing user_source values while allowing updates
    user_source = COALESCE(
      NULLIF(EXCLUDED.user_source, 'unknown'),
      user_profiles.user_source,
      'unknown'
    ),
    updated_at = NOW();

  RETURN NEW;
END;
$$;

-- Step 5: Verify the trigger exists (create if not)
-- This ensures the trigger is connected to the auth.users table

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- Verification queries (run manually to confirm migration success):
--
-- Check column exists:
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'user_profiles' AND column_name = 'user_source';
--
-- Count users by source:
-- SELECT user_source, COUNT(*)
-- FROM user_profiles
-- GROUP BY user_source;
--
-- Check trigger exists:
-- SELECT trigger_name, event_manipulation
-- FROM information_schema.triggers
-- WHERE trigger_name = 'on_auth_user_created';
-- ============================================================================
