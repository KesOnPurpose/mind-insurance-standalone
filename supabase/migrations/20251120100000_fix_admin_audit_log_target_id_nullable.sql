-- ============================================================================
-- FIX ADMIN AUDIT LOG TARGET_ID COLUMN - MAKE NULLABLE
-- ============================================================================
-- Purpose: Allow target_id to be NULL for system-wide actions
-- Issue: auditLogger.ts functions don't always send target_id (analytics_view, export_csv, etc.)
-- Root Cause: Schema defined target_id without DEFAULT, but code doesn't always provide it
-- Solution: Make target_id nullable to match actual usage patterns
-- ============================================================================

-- Make target_id nullable
ALTER TABLE public.admin_audit_log
ALTER COLUMN target_id DROP NOT NULL;

-- Add comment explaining when target_id can be null
COMMENT ON COLUMN admin_audit_log.target_id IS
  'Optional identifier for the target entity. NULL for system-wide actions like analytics_view, export_csv, export_json. Populated for entity-specific actions like user_view, content_edit.';

-- Verify the change
-- Run this after migration to confirm:
-- SELECT column_name, is_nullable, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'admin_audit_log' AND column_name = 'target_id';
-- Expected: is_nullable = 'YES'

-- ============================================================================
-- VERIFICATION TEST
-- ============================================================================
-- Test that inserts now work without target_id:
/*
DO $$
DECLARE
  test_admin_user_id UUID;
BEGIN
  -- Get a valid admin user ID
  SELECT id INTO test_admin_user_id FROM admin_users WHERE is_active = true LIMIT 1;

  IF test_admin_user_id IS NULL THEN
    RAISE EXCEPTION 'No active admin user found for testing';
  END IF;

  -- Test insert without target_id (should work now)
  INSERT INTO admin_audit_log (
    admin_user_id,
    action_type,
    target_type,
    details
  ) VALUES (
    test_admin_user_id,
    'export_csv',
    'analytics_export',
    '{"test": true}'::jsonb
  );

  RAISE NOTICE 'Test insert successful! target_id can now be NULL.';

  -- Clean up test record
  DELETE FROM admin_audit_log
  WHERE admin_user_id = test_admin_user_id
    AND action_type = 'export_csv'
    AND details->>'test' = 'true';

END $$;
*/

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- After running this migration:
-- 1. Refresh the analytics dashboard in your browser
-- 2. The 400 errors should be gone
-- 3. Audit log entries should be created successfully
-- 4. Verify with: SELECT * FROM admin_audit_log ORDER BY created_at DESC LIMIT 5;
-- ============================================================================
