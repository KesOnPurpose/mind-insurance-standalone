-- Find columns that are NOT NULL but have no default value
-- These MUST be provided in the INSERT statement

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_profiles'
  AND is_nullable = 'NO'  -- NOT NULL columns
  AND column_default IS NULL  -- No default value
ORDER BY ordinal_position;
