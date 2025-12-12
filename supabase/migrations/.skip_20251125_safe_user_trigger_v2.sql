-- SAFE backward-compatible trigger that handles BOTH apps
-- Based on actual user_profiles schema observed in production

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert with ALL columns that exist in the table
  -- This handles both Mind Insurance (old) and Grouphome (new) apps
  INSERT INTO public.user_profiles (
    id,
    email,
    full_name,
    avatar_url,
    provider,
    phone_number,
    preferred_auth_method,
    email_verified_at,
    created_at,
    updated_at,
    last_login_at,
    login_count,
    metadata,
    challenge_start_date,
    current_day,
    total_points,
    championship_level,
    onboarding_completed,
    timezone
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
    NEW.raw_user_meta_data->>'phone',
    'password',
    CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN NEW.email_confirmed_at ELSE NULL END,
    NOW(),
    NOW(),
    NOW(),
    1,
    COALESCE(NEW.raw_user_meta_data, '{}'::jsonb),
    NOW(),
    1,
    0,
    'bronze',
    false,
    'America/New_York'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, user_profiles.avatar_url),
    provider = COALESCE(EXCLUDED.provider, user_profiles.provider),
    email_verified_at = COALESCE(EXCLUDED.email_verified_at, user_profiles.email_verified_at),
    metadata = COALESCE(EXCLUDED.metadata, user_profiles.metadata),
    last_login_at = NOW(),
    login_count = user_profiles.login_count + 1,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS
'Backward-compatible trigger for both Mind Insurance and Grouphome apps.
NEW users: Get safe defaults for all columns.
EXISTING users: Update OAuth data, increment login count, preserve Mind Insurance progress.';
