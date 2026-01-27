-- ============================================================================
-- MIGRATION: Fix RLS Policies for Public Access to Compliance Binders
-- ============================================================================
-- Purpose: Allow both anonymous and authenticated users to read compliance
--          binders. The previous policies restricted to `authenticated` only,
--          which blocks access for non-logged-in users.
--
-- Tables affected:
--   - state_compliance_binders
--   - local_compliance_binders
--
-- Issue: Users reported "0 binders available" because RLS blocked anonymous access
-- ============================================================================

-- ============================================================================
-- 1. FIX state_compliance_binders RLS POLICY
-- ============================================================================

-- Drop the existing authenticated-only policy
DROP POLICY IF EXISTS "All users can read compliance binders" ON public.state_compliance_binders;

-- Create new policy allowing both anonymous and authenticated users
CREATE POLICY "Allow public read access to state compliance binders"
  ON public.state_compliance_binders
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ============================================================================
-- 2. FIX local_compliance_binders RLS POLICY
-- ============================================================================

-- Drop the existing authenticated-only policy
DROP POLICY IF EXISTS "All authenticated users can read local binders" ON public.local_compliance_binders;

-- Create new policy allowing both anonymous and authenticated users
CREATE POLICY "Allow public read access to local compliance binders"
  ON public.local_compliance_binders
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these after migration to confirm policies are correct:
--
-- Check state_compliance_binders policies:
-- SELECT policyname, roles FROM pg_policies
-- WHERE tablename = 'state_compliance_binders';
--
-- Check local_compliance_binders policies:
-- SELECT policyname, roles FROM pg_policies
-- WHERE tablename = 'local_compliance_binders';
--
-- Both should show: roles = {anon,authenticated}
-- ============================================================================
