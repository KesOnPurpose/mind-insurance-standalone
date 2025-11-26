-- COMPREHENSIVE FIX: Include ALL potentially required Mind Insurance columns
-- Based on production schema analysis

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (
    -- Core columns
    id,
    email,
    created_at,
    updated_at,
    
    -- Mind Insurance required columns
    challenge_start_date,
    current_day,
    total_points,
    championship_level,
    onboarding_completed,
    timezone,
    
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
    NOW(),
    1,
    0,
    'bronze',
    false,
    'America/New_York',
    
    -- Grouphome OAuth data
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
    CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN NEW.email_confirmed_at ELSE NULL END,
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
