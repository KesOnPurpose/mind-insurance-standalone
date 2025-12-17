-- ============================================================================
-- FIX: get_or_create_coverage_streak RPC Function
-- ============================================================================
-- Issue: "column reference 'user_id' is ambiguous" error
-- Cause: RETURNS TABLE with column names matching table columns creates
--        ambiguity in PostgreSQL plpgsql functions
-- Fix: Use RETURNS SETOF coverage_streaks to return actual table rows
--        This avoids defining output columns that conflict with table columns
-- ============================================================================

-- Drop existing function first (required because return type changes)
DROP FUNCTION IF EXISTS get_or_create_coverage_streak(UUID);

-- Create function returning SETOF coverage_streaks (the actual table type)
-- This avoids column naming ambiguity entirely
CREATE OR REPLACE FUNCTION get_or_create_coverage_streak(p_user_id UUID)
RETURNS SETOF coverage_streaks AS $$
BEGIN
  -- Insert if not exists
  INSERT INTO coverage_streaks (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Return all columns from the actual table row
  -- Using table_name.column_name syntax for clarity
  RETURN QUERY
  SELECT *
  FROM coverage_streaks
  WHERE coverage_streaks.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the function is executable by authenticated users
GRANT EXECUTE ON FUNCTION get_or_create_coverage_streak TO authenticated;

COMMENT ON FUNCTION get_or_create_coverage_streak IS 'Returns or creates coverage streak record for a user. Uses SETOF return type to avoid column name ambiguity.';
