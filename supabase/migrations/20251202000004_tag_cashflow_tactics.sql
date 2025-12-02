-- Tag existing T-tactics that originated from Group Home Cashflow Course
-- This migration will be completed after analyzing course content in Phase 2

-- Placeholder query to identify candidate tactics
-- Run this query to find potential cashflow_course tactics:
/*
SELECT tactic_id, tactic_name, description
FROM gh_tactic_instructions
WHERE tactic_id LIKE 'T%'
  AND (
    tactic_name ILIKE '%unlicensed%'
    OR tactic_name ILIKE '%licensed%'
    OR tactic_name ILIKE '%LLC%'
    OR tactic_name ILIKE '%fair housing%'
    OR tactic_name ILIKE '%pricing%'
    OR tactic_name ILIKE '%profit%'
    OR tactic_name ILIKE '%SSI%'
    OR tactic_name ILIKE '%resident%'
    OR tactic_name ILIKE '%population%'
    OR tactic_name ILIKE '%business formation%'
    OR tactic_name ILIKE '%compliance%'
    OR description ILIKE '%cashflow course%'
  )
ORDER BY tactic_id;
*/

-- Example UPDATE statements (to be populated after analysis):
-- UPDATE gh_tactic_instructions SET tactic_source = 'cashflow_course' WHERE tactic_id IN ('T001', 'T002', 'T003');

-- Keep remaining T-tactics as 'general' (default value already set in migration 20251202000001)

COMMENT ON EXTENSION plpgsql IS
  'This migration tags T-tactics from the Group Home Cashflow Course - UPDATE statements to be added after content analysis';
