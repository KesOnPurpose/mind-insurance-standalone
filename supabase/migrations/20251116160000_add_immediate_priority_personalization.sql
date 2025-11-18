-- Migration: Add Immediate Priority for Priority-Based Personalization
-- This enables the additive (not restrictive) personalization approach
-- where tactics are REORDERED based on user priority, not hidden

-- Add immediate_priority column for user focus preference
ALTER TABLE user_onboarding
ADD COLUMN IF NOT EXISTS immediate_priority TEXT
CHECK (immediate_priority IN ('property_acquisition', 'operations', 'comprehensive', 'scaling'));

-- Add comment explaining the column
COMMENT ON COLUMN user_onboarding.immediate_priority IS
'User-selected focus area: property_acquisition (finding property), operations (running existing property), comprehensive (learning all strategies), scaling (expanding operation). Determines tactic priority sorting, NOT restriction.';

-- Ensure ownership_model column exists with proper constraints
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_onboarding' AND column_name = 'ownership_model'
    ) THEN
        ALTER TABLE user_onboarding
        ADD COLUMN ownership_model TEXT
        CHECK (ownership_model IN ('rental_arbitrage', 'ownership', 'creative_financing', 'house_hack', 'hybrid'));
    END IF;
END $$;

-- Ensure target_state column exists
ALTER TABLE user_onboarding
ADD COLUMN IF NOT EXISTS target_state TEXT;

-- Ensure budget range columns exist for exact USD filtering
ALTER TABLE user_onboarding
ADD COLUMN IF NOT EXISTS budget_min_usd INTEGER;

ALTER TABLE user_onboarding
ADD COLUMN IF NOT EXISTS budget_max_usd INTEGER;

-- Create indexes for optimized filtering queries
CREATE INDEX IF NOT EXISTS idx_user_onboarding_immediate_priority
ON user_onboarding(immediate_priority);

CREATE INDEX IF NOT EXISTS idx_user_onboarding_ownership_model
ON user_onboarding(ownership_model);

CREATE INDEX IF NOT EXISTS idx_user_onboarding_target_state
ON user_onboarding(target_state);

CREATE INDEX IF NOT EXISTS idx_user_onboarding_property_status
ON user_onboarding(property_status);

-- Add immediate_priority to user_roadmap_state for persistence
ALTER TABLE user_roadmap_state
ADD COLUMN IF NOT EXISTS immediate_priority TEXT
CHECK (immediate_priority IN ('property_acquisition', 'operations', 'comprehensive', 'scaling'))
DEFAULT 'comprehensive';

COMMENT ON COLUMN user_roadmap_state.immediate_priority IS
'Persisted user priority preference for tactic sorting. Can be updated anytime via Settings.';

-- Create or replace function to calculate profile completeness
-- This ensures users who complete assessment get non-zero profile completeness
CREATE OR REPLACE FUNCTION calculate_enhanced_profile_completeness(user_row user_onboarding)
RETURNS INTEGER AS $$
DECLARE
  total_fields INTEGER := 12;
  filled_fields INTEGER := 0;
BEGIN
  -- Core strategy fields (captured during assessment)
  IF user_row.ownership_model IS NOT NULL AND user_row.ownership_model != '' THEN
    filled_fields := filled_fields + 1;
  END IF;

  IF user_row.target_state IS NOT NULL AND user_row.target_state != '' THEN
    filled_fields := filled_fields + 1;
  END IF;

  IF user_row.immediate_priority IS NOT NULL AND user_row.immediate_priority != '' THEN
    filled_fields := filled_fields + 1;
  END IF;

  -- Business profile fields (filled progressively)
  IF user_row.business_name IS NOT NULL AND user_row.business_name != '' THEN
    filled_fields := filled_fields + 1;
  END IF;

  IF user_row.entity_type IS NOT NULL AND user_row.entity_type != '' THEN
    filled_fields := filled_fields + 1;
  END IF;

  IF user_row.bed_count IS NOT NULL THEN
    filled_fields := filled_fields + 1;
  END IF;

  IF user_row.property_status IS NOT NULL AND user_row.property_status != '' THEN
    filled_fields := filled_fields + 1;
  END IF;

  IF user_row.funding_source IS NOT NULL AND user_row.funding_source != '' THEN
    filled_fields := filled_fields + 1;
  END IF;

  IF user_row.license_status IS NOT NULL AND user_row.license_status != '' THEN
    filled_fields := filled_fields + 1;
  END IF;

  IF user_row.service_model IS NOT NULL AND user_row.service_model != '' THEN
    filled_fields := filled_fields + 1;
  END IF;

  IF user_row.monthly_revenue_target IS NOT NULL THEN
    filled_fields := filled_fields + 1;
  END IF;

  IF user_row.startup_capital_actual IS NOT NULL THEN
    filled_fields := filled_fields + 1;
  END IF;

  RETURN ROUND((filled_fields::NUMERIC / total_fields::NUMERIC) * 100);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION calculate_enhanced_profile_completeness(user_onboarding) TO authenticated;
