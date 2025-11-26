-- Backward-compatible handle_new_user trigger
-- Supports BOTH Mind Insurance app (old columns) AND Grouphome app (OAuth columns)
-- Safe to run - won't break either application

-- Drop the old trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create backward-compatible trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert new user profile with ALL columns (both old and new)
  INSERT INTO public.user_profiles (
    -- Core identity columns (both apps use these)
    id,
    email,
    created_at,
    updated_at,

    -- OAuth columns (Grouphome app)
    full_name,
    avatar_url,
    provider,
    email_verified_at,
    metadata,

    -- Mind Insurance columns (existing app)
    challenge_start_date,
    current_day,
    total_points,
    onboarding_completed
  )
  VALUES (
    NEW.id,
    NEW.email,
    NOW(),
    NOW(),

    -- OAuth data (from Google/email signup)
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
    CASE
      WHEN NEW.email_confirmed_at IS NOT NULL THEN NEW.email_confirmed_at
      ELSE NULL
    END,
    COALESCE(NEW.raw_user_meta_data, '{}'::jsonb),

    -- Mind Insurance defaults (safe defaults for new users)
    NOW(), -- challenge_start_date
    1,     -- current_day starts at 1
    0,     -- total_points starts at 0
    false  -- onboarding_completed starts as false
  )
  ON CONFLICT (id) DO UPDATE SET
    -- Update core identity
    email = EXCLUDED.email,
    updated_at = NOW(),
    -- Update OAuth data if present
    full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, user_profiles.avatar_url),
    provider = COALESCE(EXCLUDED.provider, user_profiles.provider),
    email_verified_at = COALESCE(EXCLUDED.email_verified_at, user_profiles.email_verified_at),
    metadata = COALESCE(EXCLUDED.metadata, user_profiles.metadata);
  -- Note: We DON'T update Mind Insurance columns on conflict
  -- This preserves existing user progress in the Mind Insurance app

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add comprehensive documentation
COMMENT ON FUNCTION public.handle_new_user() IS
'Backward-compatible user profile creation trigger.
Supports BOTH applications sharing this database:
1. Mind Insurance app (uses challenge_start_date, current_day, total_points, onboarding_completed)
2. Grouphome app (uses full_name, avatar_url, provider, email_verified_at, metadata)

NEW users get safe defaults for all columns.
EXISTING users preserve their Mind Insurance progress on updates.';
