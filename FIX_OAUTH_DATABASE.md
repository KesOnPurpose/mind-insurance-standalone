# Fix Google OAuth Database Error

## Problem
Google OAuth authentication is failing with this error:
```
null value in column "challenge_start_date" of relation "user_profiles" violates not-null constraint
```

## Solution
The `user_profiles` table has a `challenge_start_date` column with a NOT NULL constraint, but this column isn't set during OAuth signup. We need to make this column nullable.

## Steps to Fix

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to: https://supabase.com/dashboard/project/hpyodaugrkctagkrfofj/sql/new

2. Copy and paste this SQL:

```sql
-- Make challenge_start_date nullable
ALTER TABLE public.user_profiles
ALTER COLUMN challenge_start_date DROP NOT NULL;

-- Set default value for any existing NULL values
UPDATE public.user_profiles
SET challenge_start_date = NOW()
WHERE challenge_start_date IS NULL;

-- Update the trigger function to include challenge_start_date
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
```

3. Click **Run** to execute the SQL

4. You should see: "Success. No rows returned"

### Option 2: Manual Column Update

If the above doesn't work, try this simpler version:

```sql
-- Just make the column nullable
ALTER TABLE public.user_profiles ALTER COLUMN challenge_start_date DROP NOT NULL;
```

## Test the Fix

After running the SQL:

1. Clear your browser data:
   - Open DevTools (F12)
   - Go to Console
   - Run: `localStorage.clear(); sessionStorage.clear();`

2. Go to http://localhost:8081/auth

3. Click "Continue with Google"

4. Authorize with Google

5. You should now be redirected to the dashboard successfully!

## What Changed

- **challenge_start_date** is now nullable (can be NULL)
- When users sign up via OAuth, the field is automatically set to NOW()
- Existing users with NULL values are updated to use the current timestamp
- The `handle_new_user()` trigger function now properly handles OAuth signups

## Production Deployment

The same SQL needs to be run on your production Supabase instance before deploying the OAuth feature to production.