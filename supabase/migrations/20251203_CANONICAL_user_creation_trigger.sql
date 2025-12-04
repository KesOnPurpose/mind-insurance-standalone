-- =====================================================
-- CANONICAL USER CREATION TRIGGER
-- =====================================================
-- This is the WORKING configuration for user creation.
-- DO NOT modify without reading DATABASE-CONFIG.md first!
--
-- Last verified: 2025-12-03
-- Works for: Grouphomes4newbies + Mind Insurance (shared database)
--
-- CRITICAL: This database is shared between TWO apps!
-- Any changes must work for BOTH applications.
-- =====================================================

-- Drop existing trigger to ensure clean state
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the minimal, robust trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- =====================================================
  -- MINIMAL INSERT - Only 7 core fields
  -- =====================================================
  -- Why minimal? The user_profiles table has 60+ columns.
  -- Many have NOT NULL constraints without DEFAULTs.
  -- Inserting all columns causes constraint failures.
  --
  -- This minimal approach:
  -- 1. Inserts only universally required fields
  -- 2. Lets DEFAULT values handle app-specific columns
  -- 3. Uses exception handling to never break auth
  -- =====================================================

  INSERT INTO public.user_profiles (
    id,
    email,
    full_name,
    avatar_url,
    provider,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      ''
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    -- Only update fields that should change on re-auth
    email = COALESCE(EXCLUDED.email, user_profiles.email),
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), user_profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, user_profiles.avatar_url),
    provider = COALESCE(EXCLUDED.provider, user_profiles.provider),
    last_login_at = NOW(),
    login_count = COALESCE(user_profiles.login_count, 0) + 1,
    updated_at = NOW();

  -- =====================================================
  -- GROUPHOMES4NEWBIES: Sync gh_approved_users
  -- =====================================================
  -- Links the auth.users.id to gh_approved_users.user_id
  -- This enables the allowlist system for Grouphomes app
  -- =====================================================

  UPDATE public.gh_approved_users
  SET user_id = NEW.id,
      last_access_at = NOW(),
      updated_at = NOW()
  WHERE LOWER(email) = LOWER(NEW.email)
    AND user_id IS NULL;

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    -- =====================================================
    -- CRITICAL: Never fail authentication
    -- =====================================================
    -- If profile creation fails for any reason, log it
    -- but still return NEW to complete the auth flow.
    -- User can sign in, and profile can be fixed later.
    -- =====================================================
    RAISE WARNING 'handle_new_user failed for user %: % (SQLSTATE: %)',
                  NEW.id, SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;

-- Create trigger - AFTER INSERT only (not UPDATE to prevent loops)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add documentation comment
COMMENT ON FUNCTION public.handle_new_user() IS
'Minimal user profile trigger for auth.users.
Creates basic profile with 7 core fields only.
Syncs gh_approved_users for Grouphomes4newbies app.
Has exception handling to never break authentication.

SHARED DATABASE: Works for both Grouphomes4newbies and Mind Insurance.
DO NOT modify without reading DATABASE-CONFIG.md!

Last updated: 2025-12-03';

-- =====================================================
-- VERIFICATION
-- =====================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    RAISE NOTICE '✅ Trigger on_auth_user_created exists';
  ELSE
    RAISE WARNING '❌ Trigger on_auth_user_created NOT FOUND!';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'handle_new_user'
  ) THEN
    RAISE NOTICE '✅ Function handle_new_user exists';
  ELSE
    RAISE WARNING '❌ Function handle_new_user NOT FOUND!';
  END IF;
END $$;
