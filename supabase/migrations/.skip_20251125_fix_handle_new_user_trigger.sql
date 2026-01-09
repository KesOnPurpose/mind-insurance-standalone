-- FIX: User creation 500 error
-- ROOT CAUSE: Production database has Mind Insurance columns including challenge_start_date
-- which is NOT NULL without default, causing INSERT to fail
--
-- SOLUTION: Include challenge_start_date in the trigger to satisfy Mind Insurance schema
-- while also supporting Grouphome OAuth columns

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert with columns that satisfy BOTH Mind Insurance and Grouphome requirements
  INSERT INTO public.user_profiles (
    -- Required by both apps
    id,
    email,
    created_at,
    updated_at,

    -- Mind Insurance required columns (likely NOT NULL in production)
    challenge_start_date,
    current_day,

    -- Grouphome OAuth columns
    full_name,
    avatar_url,
    provider,
    email_verified_at,
    metadata
  )
  VALUES (
    NEW.id,
    NEW.email,
    NOW(),
    NOW(),

    -- Mind Insurance defaults
    NOW(), -- challenge_start_date: when user signed up
    1,     -- current_day: start at day 1

    -- Grouphome OAuth data from Google/etc
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
    CASE
      WHEN NEW.email_confirmed_at IS NOT NULL THEN NEW.email_confirmed_at
      ELSE NULL
    END,
    COALESCE(NEW.raw_user_meta_data, '{}'::jsonb)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, user_profiles.avatar_url),
    provider = COALESCE(EXCLUDED.provider, user_profiles.provider),
    email_verified_at = COALESCE(EXCLUDED.email_verified_at, user_profiles.email_verified_at),
    metadata = COALESCE(EXCLUDED.metadata, user_profiles.metadata),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS
'Creates user_profiles record when auth.users record is created.
Supports both Mind Insurance app (challenge_start_date, current_day)
and Grouphome app (OAuth, full_name, avatar_url).
Compatible with shared database schema.';
