-- =====================================================
-- FIX USER CREATION TRIGGER FOR INVITE FLOW
-- =====================================================
-- Issue: inviteUserByEmail() fails with "Database error saving new user"
-- Cause: Trigger tries to insert too many columns, some may have constraints
-- Solution: Minimal trigger that only sets required fields, lets defaults handle rest
-- =====================================================

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create a minimal, robust trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Minimal insert - only required fields, let DEFAULT handle the rest
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
    email = COALESCE(EXCLUDED.email, user_profiles.email),
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), user_profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, user_profiles.avatar_url),
    provider = COALESCE(EXCLUDED.provider, user_profiles.provider),
    last_login_at = NOW(),
    login_count = COALESCE(user_profiles.login_count, 0) + 1,
    updated_at = NOW();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail authentication
    RAISE WARNING 'handle_new_user failed for user %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
    -- Return NEW to allow auth to complete even if profile creation fails
    RETURN NEW;
END;
$$;

-- Recreate the trigger - only on INSERT (not UPDATE to avoid loops)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add comment
COMMENT ON FUNCTION public.handle_new_user() IS
'Minimal user profile trigger for auth.users. Creates basic profile with defaults.
Fixed 2025-12-03 to resolve "Database error saving new user" issue.';

-- Verify trigger exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    RAISE NOTICE '✅ Trigger on_auth_user_created successfully created';
  ELSE
    RAISE WARNING '❌ Trigger on_auth_user_created not found!';
  END IF;
END $$;
