-- Migration: Tag existing cashflow course tactics
-- Date: 2025-12-02
-- Purpose: Enable filtering of T424-T438 as cashflow_course tactics
-- This is Phase 1 of hybrid migration strategy (quick win)

BEGIN;

-- ============================================
-- SECTION 1: VALIDATION & PREREQUISITES
-- ============================================

-- Verify tactic_source column exists (from migration 20251202000001)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'gh_tactic_instructions'
    AND column_name = 'tactic_source'
  ) THEN
    RAISE EXCEPTION 'tactic_source column does not exist. Run migration 20251202000001 first.';
  END IF;
END $$;

-- Verify T424-T438 tactics exist
DO $$
DECLARE
  existing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO existing_count
  FROM gh_tactic_instructions
  WHERE tactic_id BETWEEN 'T424' AND 'T438';

  IF existing_count = 0 THEN
    RAISE EXCEPTION 'No tactics found in T424-T438 range. Check if tactics were inserted.';
  END IF;

  RAISE NOTICE 'Found % existing tactics in T424-T438 range', existing_count;
END $$;

-- ============================================
-- SECTION 2: TAG EXISTING CASHFLOW TACTICS
-- ============================================

-- Tag existing cashflow course tactics (T424-T438)
UPDATE gh_tactic_instructions
SET tactic_source = 'cashflow_course'
WHERE tactic_id IN (
  'T424', 'T425', 'T426', 'T427', 'T428', 'T429', 'T430',
  'T431', 'T432', 'T433', 'T434', 'T435', 'T436', 'T437', 'T438'
)
AND (tactic_source IS NULL OR tactic_source != 'cashflow_course');

-- ============================================
-- SECTION 3: VERIFICATION
-- ============================================

-- Verify all 15 tactics are tagged
DO $$
DECLARE
  tagged_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO tagged_count
  FROM gh_tactic_instructions
  WHERE tactic_id BETWEEN 'T424' AND 'T438'
  AND tactic_source = 'cashflow_course';

  IF tagged_count != 15 THEN
    RAISE EXCEPTION 'Expected 15 tactics tagged, found %', tagged_count;
  END IF;

  RAISE NOTICE '✓ Successfully tagged 15 cashflow course tactics (T424-T438)';
END $$;

-- Display summary of source distribution
DO $$
DECLARE
  mentorship_count INTEGER;
  cashflow_count INTEGER;
  general_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO mentorship_count
  FROM gh_tactic_instructions WHERE tactic_source = 'mentorship';

  SELECT COUNT(*) INTO cashflow_count
  FROM gh_tactic_instructions WHERE tactic_source = 'cashflow_course';

  SELECT COUNT(*) INTO general_count
  FROM gh_tactic_instructions WHERE tactic_source = 'general';

  RAISE NOTICE '
╔══════════════════════════════════════════════════════════╗
║   TACTIC SOURCE DISTRIBUTION                             ║
║   Mentorship: % tactics                                 ║
║   Cashflow Course: % tactics                            ║
║   General: % tactics                                    ║
╚══════════════════════════════════════════════════════════╝
  ', mentorship_count, cashflow_count, general_count;
END $$;

COMMIT;

-- Rollback script (save for emergency use)
/*
BEGIN;
UPDATE gh_tactic_instructions
SET tactic_source = 'general'
WHERE tactic_id BETWEEN 'T424' AND 'T438';
COMMIT;
*/
