-- ============================================================================
-- MIGRATION: Add RLS Policies for Compliance Tables
-- ============================================================================
-- Purpose: Allow admin users to access county_compliance_cache and
--          local_compliance_binders tables
-- ============================================================================

-- Enable RLS on county_compliance_cache (if not already enabled)
ALTER TABLE IF EXISTS public.county_compliance_cache ENABLE ROW LEVEL SECURITY;

-- Enable RLS on local_compliance_binders (if not already enabled)
ALTER TABLE IF EXISTS public.local_compliance_binders ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies for county_compliance_cache
-- ============================================================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Admins can view county compliance cache" ON public.county_compliance_cache;
DROP POLICY IF EXISTS "Admins can manage county compliance cache" ON public.county_compliance_cache;

-- Allow admins to read county_compliance_cache
CREATE POLICY "Admins can view county compliance cache"
  ON public.county_compliance_cache FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.user_id = auth.uid()
      AND au.is_active = true
    )
    OR
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND up.tier_level = 'super_admin'
    )
  );

-- Allow admins to insert/update/delete county_compliance_cache
CREATE POLICY "Admins can manage county compliance cache"
  ON public.county_compliance_cache FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.user_id = auth.uid()
      AND au.is_active = true
    )
    OR
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND up.tier_level = 'super_admin'
    )
  );

-- ============================================================================
-- RLS Policies for local_compliance_binders
-- ============================================================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view local compliance binders" ON public.local_compliance_binders;
DROP POLICY IF EXISTS "Admins can manage local compliance binders" ON public.local_compliance_binders;

-- Allow anyone authenticated to read binders (they're public info)
CREATE POLICY "Anyone can view local compliance binders"
  ON public.local_compliance_binders FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow admins to insert/update/delete binders
CREATE POLICY "Admins can manage local compliance binders"
  ON public.local_compliance_binders FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.user_id = auth.uid()
      AND au.is_active = true
    )
    OR
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND up.tier_level = 'super_admin'
    )
  );

-- ============================================================================
-- Grant usage to authenticated users
-- ============================================================================

GRANT SELECT ON public.county_compliance_cache TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.county_compliance_cache TO authenticated;

GRANT SELECT ON public.local_compliance_binders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.local_compliance_binders TO authenticated;
