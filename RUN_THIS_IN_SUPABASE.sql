-- ============================================
-- GOOGLE OAUTH FIX - RUN THIS IN SUPABASE DASHBOARD
-- ============================================
-- Go to: https://supabase.com/dashboard/project/hpyodaugrkctagkrfofj/sql/new
-- Copy this entire file and click RUN
-- ============================================

-- Step 1: Make challenge_start_date nullable (so OAuth users can sign up)
ALTER TABLE public.user_profiles
ALTER COLUMN challenge_start_date DROP NOT NULL;

-- Step 2: Set a default value for challenge_start_date
ALTER TABLE public.user_profiles
ALTER COLUMN challenge_start_date SET DEFAULT NOW();

-- Step 3: Update any existing NULL values
UPDATE public.user_profiles
SET challenge_start_date = NOW()
WHERE challenge_start_date IS NULL;

-- Step 4: Update the handle_new_user trigger to properly set all required fields
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
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'full_name'
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
    CASE
      WHEN NEW.email_confirmed_at IS NOT NULL THEN NEW.email_confirmed_at
      ELSE NULL
    END,
    NOW(), -- Set challenge start date to signup time
    COALESCE(NEW.raw_user_meta_data, '{}'::jsonb)
  )
  ON CONFLICT (id)
  DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, user_profiles.avatar_url),
    provider = COALESCE(EXCLUDED.provider, user_profiles.provider),
    email_verified_at = COALESCE(EXCLUDED.email_verified_at, user_profiles.email_verified_at),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Verify the trigger is active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- VERIFICATION QUERIES (Optional - run after)
-- ============================================

-- Check if challenge_start_date is now nullable
SELECT
    column_name,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'user_profiles'
AND column_name = 'challenge_start_date';

-- Should show: is_nullable = 'YES', column_default = 'now()'