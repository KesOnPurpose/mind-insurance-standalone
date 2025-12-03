-- ============================================================================
-- GROUPHOME (GH) - APPROVED USERS ALLOWLIST SYSTEM
-- ============================================================================
-- Purpose: Manage paid user access with tier-based permissions
-- Namespace: gh_ prefix to avoid conflicts with other apps sharing this DB
-- Tier Levels: user, coach, admin, super_admin, owner
-- ============================================================================

-- 1. CREATE USER ACCESS TIER ENUM (namespaced)
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gh_access_tier') THEN
    CREATE TYPE gh_access_tier AS ENUM ('user', 'coach', 'admin', 'super_admin', 'owner');
  END IF;
END$$;

-- 2. CREATE APPROVED USERS TABLE (namespaced: gh_approved_users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.gh_approved_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User identification (email is primary, user_id linked after signup)
  email TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Tier and access
  tier gh_access_tier NOT NULL DEFAULT 'user',
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- User info (for display before they sign up)
  full_name TEXT,
  phone TEXT,
  notes TEXT,

  -- Payment/source tracking
  payment_source TEXT, -- 'gohighlevel', 'stripe', 'manual', etc.
  payment_reference TEXT, -- transaction ID or reference

  -- Timestamps
  approved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ, -- NULL = never expires
  last_access_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. CREATE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_gh_approved_users_email ON public.gh_approved_users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_gh_approved_users_user_id ON public.gh_approved_users(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_gh_approved_users_tier ON public.gh_approved_users(tier) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_gh_approved_users_active ON public.gh_approved_users(is_active, approved_at DESC);

-- 4. ENABLE RLS
-- ============================================================================
ALTER TABLE public.gh_approved_users ENABLE ROW LEVEL SECURITY;

-- 5. CREATE HELPER FUNCTIONS (namespaced: gh_)
-- ============================================================================

-- Check if email is approved for Grouphome (case-insensitive)
CREATE OR REPLACE FUNCTION public.gh_is_email_approved(check_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.gh_approved_users
    WHERE LOWER(email) = LOWER(check_email)
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$;

-- Check if current user is approved for Grouphome
CREATE OR REPLACE FUNCTION public.gh_is_current_user_approved()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Get current user's email
  SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();

  IF user_email IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN public.gh_is_email_approved(user_email);
END;
$$;

-- Get current user's Grouphome tier
CREATE OR REPLACE FUNCTION public.gh_get_user_tier()
RETURNS gh_access_tier
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
  user_tier gh_access_tier;
BEGIN
  SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();

  IF user_email IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT tier INTO user_tier
  FROM public.gh_approved_users
  WHERE LOWER(email) = LOWER(user_email)
  AND is_active = true
  AND (expires_at IS NULL OR expires_at > NOW());

  RETURN user_tier;
END;
$$;

-- Check if current user has minimum tier level for Grouphome
CREATE OR REPLACE FUNCTION public.gh_has_tier_access(required_tier gh_access_tier)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  current_tier gh_access_tier;
  tier_order INTEGER;
  required_order INTEGER;
BEGIN
  current_tier := public.gh_get_user_tier();

  IF current_tier IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Define tier hierarchy (higher number = more access)
  SELECT CASE current_tier
    WHEN 'user' THEN 1
    WHEN 'coach' THEN 2
    WHEN 'admin' THEN 3
    WHEN 'super_admin' THEN 4
    WHEN 'owner' THEN 5
  END INTO tier_order;

  SELECT CASE required_tier
    WHEN 'user' THEN 1
    WHEN 'coach' THEN 2
    WHEN 'admin' THEN 3
    WHEN 'super_admin' THEN 4
    WHEN 'owner' THEN 5
  END INTO required_order;

  RETURN tier_order >= required_order;
END;
$$;

-- 6. CREATE RLS POLICIES
-- ============================================================================

-- Users can check if they're approved (read own record)
CREATE POLICY "GH: Users can view own approval status"
  ON public.gh_approved_users FOR SELECT
  TO authenticated
  USING (
    LOWER(email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
  );

-- GH Admins and above can view all approved users
CREATE POLICY "GH: Admins can view all approved users"
  ON public.gh_approved_users FOR SELECT
  TO authenticated
  USING (public.gh_has_tier_access('admin'::gh_access_tier));

-- GH Admins and above can insert approved users
CREATE POLICY "GH: Admins can add approved users"
  ON public.gh_approved_users FOR INSERT
  TO authenticated
  WITH CHECK (public.gh_has_tier_access('admin'::gh_access_tier));

-- GH Admins and above can update approved users (but not owners unless you're owner)
CREATE POLICY "GH: Admins can update approved users"
  ON public.gh_approved_users FOR UPDATE
  TO authenticated
  USING (
    public.gh_has_tier_access('admin'::gh_access_tier)
    AND (
      tier != 'owner'::gh_access_tier
      OR public.gh_has_tier_access('owner'::gh_access_tier)
    )
  );

-- Only super_admin and owner can delete
CREATE POLICY "GH: Super admins can delete approved users"
  ON public.gh_approved_users FOR DELETE
  TO authenticated
  USING (
    public.gh_has_tier_access('super_admin'::gh_access_tier)
    AND tier != 'owner'::gh_access_tier
  );

-- 7. AUTO-LINK USER_ID ON SIGNUP
-- ============================================================================
CREATE OR REPLACE FUNCTION public.gh_link_approved_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When a user signs up, link their user_id to gh_approved_users if email matches
  UPDATE public.gh_approved_users
  SET
    user_id = NEW.id,
    last_access_at = NOW(),
    updated_at = NOW()
  WHERE LOWER(email) = LOWER(NEW.email)
  AND user_id IS NULL;

  RETURN NEW;
END;
$$;

-- Create trigger for auto-linking (namespaced trigger name)
DROP TRIGGER IF EXISTS on_auth_user_gh_link_approved ON auth.users;
CREATE TRIGGER on_auth_user_gh_link_approved
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.gh_link_approved_user();

-- 8. UPDATE TIMESTAMP TRIGGER
-- ============================================================================
CREATE OR REPLACE FUNCTION public.gh_update_approved_users_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_gh_approved_users_updated ON public.gh_approved_users;
CREATE TRIGGER trigger_gh_approved_users_updated
  BEFORE UPDATE ON public.gh_approved_users
  FOR EACH ROW EXECUTE FUNCTION public.gh_update_approved_users_timestamp();

-- 9. INSERT OWNER ACCOUNT
-- ============================================================================
INSERT INTO public.gh_approved_users (
  email,
  tier,
  full_name,
  is_active,
  payment_source,
  notes
) VALUES (
  'kes@purposewaze.com',
  'owner',
  'Keston Glasgow',
  true,
  'manual',
  'Platform owner - permanent access'
) ON CONFLICT (email) DO UPDATE SET
  tier = 'owner',
  full_name = 'Keston Glasgow',
  is_active = true,
  updated_at = NOW();

-- 10. ADD COMMENTS
-- ============================================================================
COMMENT ON TABLE public.gh_approved_users IS 'Grouphome App - Allowlist of users who have paid for access. Email-based approval with automatic user_id linking on signup.';
COMMENT ON COLUMN public.gh_approved_users.tier IS 'Access tier: user (basic), coach (extended), admin (manage users), super_admin (full admin), owner (unrestricted)';
COMMENT ON COLUMN public.gh_approved_users.payment_source IS 'Where the payment came from: gohighlevel, stripe, manual, etc.';
COMMENT ON FUNCTION public.gh_is_email_approved(TEXT) IS 'Grouphome: Check if an email address is in the approved users list';
COMMENT ON FUNCTION public.gh_is_current_user_approved() IS 'Grouphome: Check if the currently authenticated user is approved';
COMMENT ON FUNCTION public.gh_get_user_tier() IS 'Grouphome: Get the access tier for the currently authenticated user';
COMMENT ON FUNCTION public.gh_has_tier_access(gh_access_tier) IS 'Grouphome: Check if current user has at least the specified tier level';
