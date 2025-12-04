# Database Configuration - Grouphomes4newbies App

## CRITICAL: Shared Database Warning

**This database is shared between TWO applications:**

| App | Purpose | Domain |
|-----|---------|--------|
| **Grouphomes4newbies** | Group home business platform | grouphome4newbies.com |
| **Mind Insurance** | Mental wellness/challenge app | (separate deployment) |

**ANY database changes must be compatible with BOTH apps.**

---

## Database Details

- **Project ID**: `hpyodaugrkctagkrfofj`
- **Project URL**: `https://hpyodaugrkctagkrfofj.supabase.co`
- **Region**: `aws-us-west-1`
- **Dashboard**: https://supabase.com/dashboard/project/hpyodaugrkctagkrfofj

---

## Working Configuration (VERIFIED 2025-12-03)

### User Creation Trigger

This is the **CANONICAL working trigger** for user creation. Do NOT modify without understanding BOTH apps.

```sql
-- =====================================================
-- WORKING USER CREATION TRIGGER
-- Last verified: 2025-12-03
-- Works for: Grouphomes4newbies + Mind Insurance
-- =====================================================

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

  -- Sync user_id to gh_approved_users if email matches (Grouphomes4newbies)
  UPDATE public.gh_approved_users
  SET user_id = NEW.id,
      last_access_at = NOW(),
      updated_at = NOW()
  WHERE LOWER(email) = LOWER(NEW.email)
    AND user_id IS NULL;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail authentication
    RAISE WARNING 'handle_new_user failed for user %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
    -- Return NEW to allow auth to complete even if profile creation fails
    RETURN NEW;
END;
$$;

-- Trigger: INSERT only (not UPDATE to avoid loops)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### Why This Configuration Works

1. **Minimal columns**: Only inserts 7 core fields that exist in both apps
2. **Exception handling**: Authentication NEVER fails, even if profile insert fails
3. **UPSERT pattern**: ON CONFLICT handles existing users gracefully
4. **INSERT-only trigger**: Prevents infinite loops from UPDATE triggers
5. **Syncs gh_approved_users**: Links user_id for Grouphomes4newbies allowlist

### What NOT To Do

- **DO NOT** add 60+ columns to the trigger (causes constraint failures)
- **DO NOT** add columns specific to one app without DEFAULTs
- **DO NOT** use `AFTER INSERT OR UPDATE` (causes infinite loops)
- **DO NOT** remove the EXCEPTION handler (breaks auth on any error)

---

## Key Tables

### user_profiles
Shared between both apps. Contains:
- Core identity: `id`, `email`, `full_name`, `avatar_url`, `provider`
- Mind Insurance specific: `challenge_start_date`, `current_day`, `total_points`, etc.
- Grouphomes specific: Depends on DEFAULT values

**All Mind Insurance columns MUST have DEFAULTs** so the minimal trigger works.

### gh_approved_users (Grouphomes4newbies only)
Allowlist for who can access Grouphomes4newbies:
- `email` - User's email (added before signup)
- `user_id` - Linked after user signs up (synced by trigger)
- `tier` - Access level (see tier hierarchy below)
- `is_active` - Whether user can access
- `expires_at` - Optional expiration date (NULL = never expires)
- `payment_source` - Where payment came from (gohighlevel, stripe, manual)

---

## Access Tier System (gh_access_tier)

### Tier Hierarchy (lowest to highest)

| Tier | Level | Description | Permissions |
|------|-------|-------------|-------------|
| `user` | 1 | Basic paid user | Access to platform, AI coach, tactics |
| `coach` | 2 | Extended user | User permissions + coaching features |
| `admin` | 3 | Administrator | Coach permissions + manage users, view all approved users |
| `super_admin` | 4 | Full admin | Admin permissions + delete users, system config |
| `owner` | 5 | Platform owner | Unrestricted access, cannot be deleted |

### Tier Check Function

Use `gh_has_tier_access(required_tier)` to check if user has minimum access:

```sql
-- Check if current user is at least an admin
SELECT public.gh_has_tier_access('admin'::gh_access_tier);

-- Get current user's tier
SELECT public.gh_get_user_tier();

-- Check if email is approved
SELECT public.gh_is_email_approved('user@example.com');
```

### Permission Matrix

| Action | user | coach | admin | super_admin | owner |
|--------|------|-------|-------|-------------|-------|
| Access platform | ✅ | ✅ | ✅ | ✅ | ✅ |
| View own profile | ✅ | ✅ | ✅ | ✅ | ✅ |
| Coaching features | ❌ | ✅ | ✅ | ✅ | ✅ |
| View all users | ❌ | ❌ | ✅ | ✅ | ✅ |
| Add users | ❌ | ❌ | ✅ | ✅ | ✅ |
| Update users | ❌ | ❌ | ✅ | ✅ | ✅ |
| Delete users | ❌ | ❌ | ❌ | ✅ | ✅ |
| Update owner | ❌ | ❌ | ❌ | ❌ | ✅ |
| System config | ❌ | ❌ | ❌ | ✅ | ✅ |

### RLS Policies

Row Level Security is enabled on `gh_approved_users`:

1. **Users can view own status** - Check their own approval record
2. **Admins can view all** - Admin+ can see all approved users
3. **Admins can add users** - Admin+ can insert new approved users
4. **Admins can update users** - Admin+ can update (except owner records)
5. **Super admins can delete** - Super admin+ can delete (except owner)

### admin_users Table (Synced)

Admin role management, **automatically synced** from gh_approved_users via trigger.

| gh_approved_users.tier | → | admin_users.role |
|------------------------|---|------------------|
| `admin` | → | `super_admin` |
| `super_admin` | → | `super_admin` |
| `owner` | → | `super_admin` |

**Note**: The `admin_users.role` has a different enum (`super_admin`, `analyst`, `content_manager`, `support`), so the sync trigger maps all admin tiers to `super_admin`.

---

## Edge Functions

### send-user-invite
**Purpose**: Send invite emails to users on the gh_approved_users allowlist

**Method**: Uses Supabase's `inviteUserByEmail()` API (NOT direct SMTP)

**Why**: Direct SMTP (`denomailer`) is broken with Deno 2.1.4 runtime

**Location**: `supabase/functions/send-user-invite/index.ts`

---

## Email Templates

Configured in Supabase Dashboard → Authentication → Email Templates

| Template | Subject | Branding |
|----------|---------|----------|
| Invite user | You're Invited to Grouphomes4newbies | Grouphomes4newbies |
| Confirm signup | Confirm Your Email - Grouphomes4newbies | Grouphomes4newbies |
| Magic link | Your Sign-In Link for Grouphomes4newbies | Grouphomes4newbies |
| Reset password | Reset Your Password - Grouphomes4newbies | Grouphomes4newbies |

**Dashboard URL**: https://supabase.com/dashboard/project/hpyodaugrkctagkrfofj/auth/templates

---

## URL Configuration

**Site URL**: `https://grouphome4newbies.com`

**Redirect URLs** (allowlist):
```
https://grouphome4newbies.com/**
https://mindhouse-prodigy.pages.dev/**
http://localhost:5173/**
```

**Dashboard URL**: https://supabase.com/dashboard/project/hpyodaugrkctagkrfofj/auth/url-configuration

---

## Troubleshooting

### "Database error saving new user"
**Cause**: Trigger trying to insert columns that don't exist or have constraints
**Fix**: Use the minimal trigger above (only 7 columns)

### Invite emails not sending
**Cause**: Edge function using broken SMTP library
**Fix**: Use Supabase's `inviteUserByEmail()` API instead

### User created but not in gh_approved_users
**Cause**: Email not pre-added to allowlist, or user_id sync failed
**Fix**: Add email to gh_approved_users BEFORE sending invite

### Authentication loop / infinite trigger
**Cause**: Trigger set to `AFTER INSERT OR UPDATE`
**Fix**: Use `AFTER INSERT` only

---

## Making Database Changes

### Before ANY Migration

1. **Check both apps**: Will this change break Mind Insurance OR Grouphomes?
2. **Add DEFAULTs**: Any new NOT NULL column MUST have a DEFAULT
3. **Test trigger**: Run a test INSERT into auth.users locally
4. **Update this document**: If changing trigger or core tables

### Safe Migration Template

```sql
-- =====================================================
-- MIGRATION: [Description]
-- Date: YYYY-MM-DD
-- Apps Affected: [Grouphomes / Mind Insurance / Both]
-- =====================================================

-- Step 1: Add column with DEFAULT (safe for existing trigger)
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS new_column TEXT DEFAULT 'default_value';

-- Step 2: If adding to trigger, use COALESCE
-- (Only if absolutely necessary - prefer DEFAULTs)

-- Step 3: Verify trigger still works
DO $$
BEGIN
  RAISE NOTICE 'Testing trigger...';
  -- Add test logic here
END $$;
```

---

## Contacts

**Database Issues**: Check Supabase Dashboard logs first
**App Issues**: Check browser console and network tab
**Auth Issues**: Check Auth → Logs in Supabase Dashboard

---

## Version History

| Date | Change | Result |
|------|--------|--------|
| 2025-12-03 | Fixed trigger to minimal 7 columns | User creation working |
| 2025-12-03 | Removed broken SMTP from edge function | Invites working via Supabase Auth |
| 2025-12-03 | Updated email templates | Grouphomes4newbies branding |

---

**Last Updated**: 2025-12-03
**Verified Working**: Yes
