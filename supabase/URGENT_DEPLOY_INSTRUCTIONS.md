# 🚨 URGENT: User Signup Is Broken - Deploy This Fix NOW

## Impact
**PRODUCTION USERS CANNOT CREATE ACCOUNTS**
- Email/password signup: ❌ BROKEN (500 error)
- Google OAuth signup: ❌ BROKEN (500 error)
- Supabase Dashboard user creation: ❌ BROKEN (500 error)

Users see: "Database error creating new user"

## Root Cause
The database trigger `handle_new_user()` is missing the `challenge_start_date` column which is NOT NULL in the Mind Insurance schema. PostgreSQL rejects the INSERT because a required column isn't provided.

## Fix (2 Minutes)
1. **Open Supabase SQL Editor**: https://supabase.com/dashboard/project/hpyodaugrkctagkrfofj/sql/new

2. **Copy this entire SQL block and paste into the editor**:

```sql
-- FIX: User creation 500 error
-- ROOT CAUSE: Production database has Mind Insurance columns including challenge_start_date
-- which is NOT NULL without default, causing INSERT to fail

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
```

3. **Click "Run" or press Cmd+Enter**

4. **Verify success**: You should see "Success. No rows returned"

## Test Immediately
1. Open your app: http://localhost:5173 (or production URL)
2. Click "Sign Up" tab
3. Enter test email: `test-$(date +%s)@example.com`
4. Enter password: `Test1234!`
5. Click "Create Account"
6. **Expected**: User created successfully, redirected to dashboard
7. **If still broken**: Check console for errors and share screenshot

## Verification Query
After deployment, verify the trigger was updated:

```sql
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'handle_new_user';
```

You should see `challenge_start_date` and `current_day` in the INSERT statement.

## What This Fixes
✅ Email/password signup works
✅ Google OAuth signup works
✅ Supabase Dashboard user creation works
✅ Mind Insurance app users unaffected
✅ Grouphome OAuth data (name, avatar) saved correctly

## Rollback (If Needed)
If something goes wrong, run the minimal trigger:

```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id, email, created_at, updated_at
  )
  VALUES (
    NEW.id, NEW.email, NOW(), NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

(Note: This won't fix the issue, but it's safe)

## Need Help?
Share:
1. Screenshot of SQL Editor after running the migration
2. Screenshot of browser console when attempting signup
3. Any error messages from Supabase logs
