-- ============================================================================
-- CLEANUP: Remove leftover constraints and tables before STEP 3
-- ============================================================================
-- Run this FIRST, then run 014c_enrollment_tables_STEP3_FIXED.sql
-- ============================================================================

-- Drop constraints that might be lingering
ALTER TABLE IF EXISTS public.gh_user_tactic_completions
  DROP CONSTRAINT IF EXISTS unique_user_tactic;

ALTER TABLE IF EXISTS public.gh_user_lesson_progress
  DROP CONSTRAINT IF EXISTS unique_user_lesson;

ALTER TABLE IF EXISTS public.gh_user_phase_progress
  DROP CONSTRAINT IF EXISTS unique_user_phase;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS public.gh_user_tactic_completions CASCADE;
DROP TABLE IF EXISTS public.gh_user_lesson_progress CASCADE;
DROP TABLE IF EXISTS public.gh_user_phase_progress CASCADE;

-- Drop any orphaned indexes
DROP INDEX IF EXISTS idx_gh_tactic_completions_user_id;
DROP INDEX IF EXISTS idx_gh_tactic_completions_tactic_id;
DROP INDEX IF EXISTS idx_gh_tactic_completions_completed_at;
DROP INDEX IF EXISTS idx_gh_lesson_progress_user_id;
DROP INDEX IF EXISTS idx_gh_lesson_progress_lesson_id;
DROP INDEX IF EXISTS idx_gh_lesson_progress_status;
DROP INDEX IF EXISTS idx_gh_lesson_progress_user_status;
DROP INDEX IF EXISTS idx_gh_lesson_progress_stuck;
DROP INDEX IF EXISTS idx_gh_lesson_progress_last_activity;
DROP INDEX IF EXISTS idx_gh_phase_progress_user_id;
DROP INDEX IF EXISTS idx_gh_phase_progress_phase_id;
DROP INDEX IF EXISTS idx_gh_phase_progress_status;
DROP INDEX IF EXISTS idx_gh_phase_progress_user_status;

DO $$
BEGIN
  RAISE NOTICE '✓ CLEANUP COMPLETE: All leftover objects removed';
  RAISE NOTICE '  → Now run 014c_enrollment_tables_STEP3_FIXED.sql';
END $$;
