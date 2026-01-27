-- ============================================================================
-- MIGRATION: Add 'state' to location_type enum
-- ============================================================================
-- Purpose: Extend the location_type enum to include state-level compliance
--          binders (California, Florida, Georgia, North Carolina, South
--          Carolina, Texas) in addition to existing cities and counties.
--
-- Changes:
--   1. Add 'state' value to the location_type enum
--
-- Note: PostgreSQL enums support adding new values via ALTER TYPE ADD VALUE.
--       This is a safe, additive change that doesn't affect existing data.
-- ============================================================================

-- Add 'state' to the location_type enum
-- Using IF NOT EXISTS pattern for idempotency (PostgreSQL 10+)
DO $$
BEGIN
  -- Check if 'state' value already exists in the enum
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'location_type'::regtype
    AND enumlabel = 'state'
  ) THEN
    ALTER TYPE location_type ADD VALUE 'state';
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION QUERY (run after migration)
-- ============================================================================
-- Check enum values include 'state':
-- SELECT enumlabel FROM pg_enum
-- WHERE enumtypid = 'location_type'::regtype
-- ORDER BY enumsortorder;
--
-- Expected output:
--   city
--   county
--   state
-- ============================================================================
