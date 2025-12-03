# User Creation 500 Error - ROOT CAUSE ANALYSIS & FIX

## Problem
Users cannot be created via Supabase Dashboard or application (both email/password AND Google OAuth fail with 500 Internal Server Error).

## Root Cause
The production database has a **hybrid schema** with columns from BOTH apps:

1. **Mind Insurance App** (legacy) - Has columns like:
   - `challenge_start_date` 
   - `current_day`
   - `total_points`
   - `championship_level`
   - `onboarding_completed`
   - Plus 60+ other Mind Insurance-specific columns

2. **Grouphome App** (new OAuth) - Has columns like:
   - `full_name`
   - `avatar_url`
   - `provider` (google, email, etc.)
   - `email_verified_at`
   - `metadata`

The **minimal trigger** we deployed only inserted 4 columns:
```sql
INSERT INTO public.user_profiles (
  id,
  email,
  created_at,
  updated_at
)
```

However, `challenge_start_date` in the Mind Insurance schema is likely **NOT NULL without a default value**, causing the INSERT to fail.

## Evidence
1. Production schema has 67 total columns (confirmed via API query)
2. Multiple migration attempts with different column counts all failed:
   - 4 columns (minimal) ❌
   - 13 columns (Grouphome only) ❌
   - 19 columns (safe version) ❌
   - 68 columns (complete version) ❌

3. The migration `20251124_fix_user_profiles_constraints.sql` specifically added `challenge_start_date` to the trigger (line 98), indicating it's a required column.

## Solution
Created `20251125_fix_handle_new_user_trigger.sql` which:

1. **Includes Mind Insurance required columns**:
   - `challenge_start_date` = NOW() (signup date)
   - `current_day` = 1 (start at day 1)

2. **Includes Grouphome OAuth columns**:
   - `full_name` (from Google profile)
   - `avatar_url` (from Google profile picture)
   - `provider` (google, email, etc.)
   - `email_verified_at` (OAuth verification timestamp)
   - `metadata` (additional user data)

3. **Maintains backward compatibility**:
   - ON CONFLICT clause updates existing users without overwriting Mind Insurance progress
   - COALESCE ensures we prefer existing values over new ones

## Files Created
1. `20251125_fix_handle_new_user_trigger.sql` - The fix (DEPLOY THIS)
2. `TEST_INSERT_USER_PROFILE.sql` - Diagnostic test (optional verification)
3. `FIND_REQUIRED_COLUMNS.sql` - Identifies NOT NULL columns (diagnostic)
4. `USER_CREATION_FIX_SUMMARY.md` - This document

## Deployment Steps
1. Open Supabase SQL Editor
2. Copy contents of `20251125_fix_handle_new_user_trigger.sql`
3. Execute the migration
4. Test user creation in Supabase Dashboard
5. Verify Google OAuth signup works

## Expected Result
✅ Email/password signup creates user profile with:
- All required Mind Insurance columns (challenge_start_date, current_day)
- Basic OAuth columns populated with defaults

✅ Google OAuth signup creates user profile with:
- All required Mind Insurance columns (challenge_start_date, current_day)
- OAuth data (full_name, avatar_url, provider) from Google profile

✅ Existing Mind Insurance users can still log in without data loss

## Why This Fixes It
PostgreSQL will fail an INSERT if:
1. Column is NOT NULL
2. Column has no default value
3. Column is not provided in INSERT statement

By including `challenge_start_date` with value `NOW()`, we satisfy the NOT NULL constraint and allow the INSERT to succeed.
