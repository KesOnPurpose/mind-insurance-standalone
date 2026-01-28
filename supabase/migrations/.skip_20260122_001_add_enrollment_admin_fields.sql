-- ============================================================================
-- Migration: Add enrolled_by and notes columns to gh_user_program_enrollments
-- ============================================================================
-- Purpose: Track which admin enrolled the user and allow enrollment notes
-- Date: 2026-01-22
-- ============================================================================

-- 1. ADD enrolled_by COLUMN
-- This tracks which admin/coach enrolled the user (null for webhook/system enrollments)
ALTER TABLE public.gh_user_program_enrollments
ADD COLUMN IF NOT EXISTS enrolled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. ADD notes COLUMN
-- This allows admins to add notes when enrolling users
ALTER TABLE public.gh_user_program_enrollments
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 3. CREATE INDEX on enrolled_by for efficient lookups
CREATE INDEX IF NOT EXISTS idx_gh_enrollments_enrolled_by
  ON public.gh_user_program_enrollments(enrolled_by)
  WHERE enrolled_by IS NOT NULL;

-- 4. ADD COMMENTS
COMMENT ON COLUMN public.gh_user_program_enrollments.enrolled_by IS
  'UUID of admin/coach who enrolled the user. NULL for webhook, purchase, or system enrollments.';

COMMENT ON COLUMN public.gh_user_program_enrollments.notes IS
  'Optional notes added by admin during enrollment.';

-- 5. VERIFICATION
DO $$
DECLARE
  v_enrolled_by_exists BOOLEAN;
  v_notes_exists BOOLEAN;
BEGIN
  -- Check if columns exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'gh_user_program_enrollments'
    AND column_name = 'enrolled_by'
  ) INTO v_enrolled_by_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'gh_user_program_enrollments'
    AND column_name = 'notes'
  ) INTO v_notes_exists;

  IF v_enrolled_by_exists AND v_notes_exists THEN
    RAISE NOTICE '✓ Migration SUCCESS: enrolled_by and notes columns added to gh_user_program_enrollments';
  ELSE
    RAISE EXCEPTION '✗ Migration FAILED: enrolled_by=%, notes=%', v_enrolled_by_exists, v_notes_exists;
  END IF;
END $$;
