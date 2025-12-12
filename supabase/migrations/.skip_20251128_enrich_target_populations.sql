-- Phase 16: Enrich target_populations Database Field
-- Purpose: Copy applicable_populations data to target_populations
-- to enable population-based synonym search in the UI
--
-- Problem: 94.7% of tactics (356/376) have empty target_populations
-- Solution: applicable_populations already has correct data, just copy it

-- Step 1: Verify current state (before migration)
DO $$
DECLARE
  empty_count INTEGER;
  total_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO empty_count
  FROM gh_tactic_instructions
  WHERE target_populations IS NULL OR target_populations = '{}';

  SELECT COUNT(*) INTO total_count
  FROM gh_tactic_instructions;

  RAISE NOTICE '=== PRE-MIGRATION STATE ===';
  RAISE NOTICE 'Total tactics: %', total_count;
  RAISE NOTICE 'Tactics with empty target_populations: %', empty_count;
  RAISE NOTICE 'Percentage empty: %', ROUND((empty_count::numeric / total_count::numeric) * 100, 1);
END $$;

-- Step 2: Migrate applicable_populations → target_populations
-- Handle different cases:
-- - NULL or empty string → ARRAY['all']
-- - 'mixed' → ARRAY['all']
-- - Comma-separated values → Split into array
UPDATE gh_tactic_instructions
SET target_populations =
  CASE
    WHEN applicable_populations IS NULL OR applicable_populations = '' THEN ARRAY['all']
    WHEN applicable_populations = 'mixed' THEN ARRAY['all']
    ELSE string_to_array(REPLACE(REPLACE(applicable_populations, ' ', ''), ',', ','), ',')
  END
WHERE target_populations IS NULL OR target_populations = '{}';

-- Step 3: Verify migration results
DO $$
DECLARE
  populated_count INTEGER;
  empty_count INTEGER;
  returning_citizens_count INTEGER;
  elderly_count INTEGER;
  veterans_count INTEGER;
  mental_health_count INTEGER;
  disabled_count INTEGER;
  ssi_count INTEGER;
  all_count INTEGER;
BEGIN
  -- Count populated
  SELECT COUNT(*) INTO populated_count
  FROM gh_tactic_instructions
  WHERE target_populations IS NOT NULL AND target_populations != '{}';

  -- Count still empty (should be 0)
  SELECT COUNT(*) INTO empty_count
  FROM gh_tactic_instructions
  WHERE target_populations IS NULL OR target_populations = '{}';

  -- Count by population type
  SELECT COUNT(*) INTO returning_citizens_count
  FROM gh_tactic_instructions
  WHERE 'returning_citizens' = ANY(target_populations);

  SELECT COUNT(*) INTO elderly_count
  FROM gh_tactic_instructions
  WHERE 'elderly' = ANY(target_populations);

  SELECT COUNT(*) INTO veterans_count
  FROM gh_tactic_instructions
  WHERE 'veterans' = ANY(target_populations);

  SELECT COUNT(*) INTO mental_health_count
  FROM gh_tactic_instructions
  WHERE 'mental_health' = ANY(target_populations);

  SELECT COUNT(*) INTO disabled_count
  FROM gh_tactic_instructions
  WHERE 'disabled' = ANY(target_populations);

  SELECT COUNT(*) INTO ssi_count
  FROM gh_tactic_instructions
  WHERE 'ssi' = ANY(target_populations);

  SELECT COUNT(*) INTO all_count
  FROM gh_tactic_instructions
  WHERE 'all' = ANY(target_populations);

  RAISE NOTICE '=== POST-MIGRATION STATE ===';
  RAISE NOTICE 'Tactics with populated target_populations: %', populated_count;
  RAISE NOTICE 'Tactics still empty: %', empty_count;
  RAISE NOTICE '';
  RAISE NOTICE '=== POPULATION BREAKDOWN ===';
  RAISE NOTICE 'returning_citizens: %', returning_citizens_count;
  RAISE NOTICE 'elderly: %', elderly_count;
  RAISE NOTICE 'veterans: %', veterans_count;
  RAISE NOTICE 'mental_health: %', mental_health_count;
  RAISE NOTICE 'disabled: %', disabled_count;
  RAISE NOTICE 'ssi: %', ssi_count;
  RAISE NOTICE 'all (universal): %', all_count;
END $$;

-- Step 4: Show sample records for verification
SELECT
  tactic_id,
  tactic_name,
  applicable_populations AS source_field,
  target_populations AS migrated_field
FROM gh_tactic_instructions
WHERE 'returning_citizens' = ANY(target_populations)
LIMIT 5;

-- Show sample veteran tactics
SELECT
  tactic_id,
  tactic_name,
  applicable_populations AS source_field,
  target_populations AS migrated_field
FROM gh_tactic_instructions
WHERE 'veterans' = ANY(target_populations)
LIMIT 5;
