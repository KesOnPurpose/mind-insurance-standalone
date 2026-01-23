-- ============================================================================
-- FEAT-GH-009-E STEP 2: Add RLS to gh_user_program_enrollments
-- ============================================================================
-- Purpose: Enable RLS and add policies (run AFTER STEP 1 succeeds)
-- ============================================================================

-- 1. ENABLE RLS
ALTER TABLE public.gh_user_program_enrollments ENABLE ROW LEVEL SECURITY;

-- 2. DROP EXISTING POLICIES (cleanup)
DROP POLICY IF EXISTS "Users can view own enrollments" ON public.gh_user_program_enrollments;
DROP POLICY IF EXISTS "Admins can view all enrollments" ON public.gh_user_program_enrollments;
DROP POLICY IF EXISTS "Admins can insert enrollments" ON public.gh_user_program_enrollments;
DROP POLICY IF EXISTS "Admins can update enrollments" ON public.gh_user_program_enrollments;
DROP POLICY IF EXISTS "Users can update own enrollment activity" ON public.gh_user_program_enrollments;

-- 3. CREATE POLICIES
CREATE POLICY "Users can view own enrollments"
  ON public.gh_user_program_enrollments FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all enrollments"
  ON public.gh_user_program_enrollments FOR SELECT
  USING ((SELECT public.is_admin()) OR (SELECT public.is_coach()));

CREATE POLICY "Admins can insert enrollments"
  ON public.gh_user_program_enrollments FOR INSERT
  WITH CHECK ((SELECT public.is_admin()) OR (SELECT public.is_coach()));

CREATE POLICY "Admins can update enrollments"
  ON public.gh_user_program_enrollments FOR UPDATE
  USING ((SELECT public.is_admin()) OR (SELECT public.is_coach()));

CREATE POLICY "Users can update own enrollment activity"
  ON public.gh_user_program_enrollments FOR UPDATE
  USING (user_id = auth.uid());

-- 4. CREATE UPDATE TRIGGER
CREATE OR REPLACE FUNCTION update_gh_enrollment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_activity_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_gh_enrollment_updated_at
  ON public.gh_user_program_enrollments;

CREATE TRIGGER trigger_update_gh_enrollment_updated_at
  BEFORE UPDATE ON public.gh_user_program_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_gh_enrollment_updated_at();

-- 5. ADD COMMENT
COMMENT ON TABLE public.gh_user_program_enrollments IS
  'Tracks user enrollments in programs. Each enrollment represents one user in one program.';

-- 6. VERIFICATION
DO $$
DECLARE
  v_rls_enabled BOOLEAN;
  v_policy_count INTEGER;
BEGIN
  -- Check RLS is enabled
  SELECT relrowsecurity INTO v_rls_enabled
  FROM pg_class
  WHERE relname = 'gh_user_program_enrollments' AND relnamespace = 'public'::regnamespace;

  -- Count policies
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE tablename = 'gh_user_program_enrollments';

  IF v_rls_enabled AND v_policy_count >= 5 THEN
    RAISE NOTICE '✓ STEP 2 SUCCESS: gh_user_program_enrollments RLS enabled with % policies', v_policy_count;
    RAISE NOTICE '  → Now run STEP 3 to create remaining tables';
  ELSE
    RAISE EXCEPTION '✗ STEP 2 FAILED: RLS=%, Policies=%', v_rls_enabled, v_policy_count;
  END IF;
END $$;
