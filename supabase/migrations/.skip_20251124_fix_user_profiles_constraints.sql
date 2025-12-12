-- Fix user_profiles table constraints for OAuth authentication
-- This migration makes challenge_start_date nullable since it's not needed during OAuth signup

-- Make challenge_start_date nullable if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'user_profiles'
    AND column_name = 'challenge_start_date'
  ) THEN
    ALTER TABLE public.user_profiles
    ALTER COLUMN challenge_start_date DROP NOT NULL;

    -- Set default value for existing NULL values
    UPDATE public.user_profiles
    SET challenge_start_date = NOW()
    WHERE challenge_start_date IS NULL;
  END IF;
END $$;

-- Add missing columns if they don't exist (for new installs)
DO $$
BEGIN
  -- Add email column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'user_profiles'
    AND column_name = 'email'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN email TEXT;
  END IF;

  -- Add avatar_url column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'user_profiles'
    AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN avatar_url TEXT;
  END IF;

  -- Add provider column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'user_profiles'
    AND column_name = 'provider'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN provider TEXT DEFAULT 'email';
  END IF;

  -- Add email_verified_at column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'user_profiles'
    AND column_name = 'email_verified_at'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN email_verified_at TIMESTAMPTZ;
  END IF;

  -- Add last_login_at column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'user_profiles'
    AND column_name = 'last_login_at'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN last_login_at TIMESTAMPTZ;
  END IF;

  -- Add login_count column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'user_profiles'
    AND column_name = 'login_count'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN login_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Update the handle_new_user trigger function to handle challenge_start_date
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id,
    email,
    full_name,
    avatar_url,
    provider,
    email_verified_at,
    challenge_start_date,
    metadata
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
    CASE
      WHEN NEW.email_confirmed_at IS NOT NULL THEN NEW.email_confirmed_at
      ELSE NULL
    END,
    NOW(), -- Set challenge_start_date to current time for new users
    COALESCE(NEW.raw_user_meta_data, '{}'::jsonb)
  )
  ON CONFLICT (id)
  DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, user_profiles.avatar_url),
    provider = COALESCE(EXCLUDED.provider, user_profiles.provider),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMENT ON COLUMN public.user_profiles.challenge_start_date IS 'Date when user started the group home challenge. Defaults to signup date.';