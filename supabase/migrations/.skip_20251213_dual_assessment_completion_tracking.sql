-- Migration: Dual Assessment Completion Tracking
-- Purpose: Add separate completion fields for Grouphome and Mind Insurance assessments
-- Created: 2025-12-13

-- ============================================================================
-- PHASE 1: Add new columns to user_profiles
-- ============================================================================

-- Add separate completion tracking for each assessment type
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS grouphome_assessment_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS mind_insurance_assessment_completed_at TIMESTAMPTZ;

-- Add comments for clarity
COMMENT ON COLUMN user_profiles.grouphome_assessment_completed_at IS 'Timestamp when user completed the Grouphome Readiness Assessment (gates E4Newbies/Nette AI access)';
COMMENT ON COLUMN user_profiles.mind_insurance_assessment_completed_at IS 'Timestamp when user completed the Identity Collision Assessment (gates Mind Insurance/MIO access)';

-- ============================================================================
-- PHASE 2: Backfill existing data from source tables
-- ============================================================================

-- Backfill grouphome_assessment_completed_at from user_onboarding (211 users)
UPDATE user_profiles up
SET
  grouphome_assessment_completed_at = uo.assessment_completed_at,
  onboarding_completed = COALESCE(up.onboarding_completed, true),
  onboarding_status = COALESCE(NULLIF(up.onboarding_status, 'incomplete'), 'complete')
FROM user_onboarding uo
WHERE up.id = uo.user_id
  AND uo.assessment_completed_at IS NOT NULL
  AND up.grouphome_assessment_completed_at IS NULL;

-- Backfill mind_insurance_assessment_completed_at from identity_collision_assessments (40 users)
UPDATE user_profiles up
SET mind_insurance_assessment_completed_at = ica.completed_at
FROM identity_collision_assessments ica
WHERE up.id = ica.user_id
  AND ica.completed_at IS NOT NULL
  AND up.mind_insurance_assessment_completed_at IS NULL;

-- ============================================================================
-- PHASE 3: Create auto-sync triggers for future assessments
-- ============================================================================

-- Trigger function for Grouphome Assessment completion
CREATE OR REPLACE FUNCTION sync_grouphome_assessment_to_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Only sync when assessment_completed_at is set (not null)
  IF NEW.assessment_completed_at IS NOT NULL AND
     (TG_OP = 'INSERT' OR OLD.assessment_completed_at IS NULL OR OLD.assessment_completed_at IS DISTINCT FROM NEW.assessment_completed_at) THEN

    UPDATE user_profiles
    SET
      grouphome_assessment_completed_at = NEW.assessment_completed_at,
      onboarding_completed = true,
      onboarding_status = 'complete',
      updated_at = NOW()
    WHERE id = NEW.user_id;

  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS on_grouphome_assessment_complete ON user_onboarding;

-- Create trigger on user_onboarding
CREATE TRIGGER on_grouphome_assessment_complete
AFTER INSERT OR UPDATE OF assessment_completed_at ON user_onboarding
FOR EACH ROW
EXECUTE FUNCTION sync_grouphome_assessment_to_profile();

-- Trigger function for Mind Insurance Assessment completion
CREATE OR REPLACE FUNCTION sync_mind_insurance_assessment_to_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Only sync when completed_at is set (not null)
  IF NEW.completed_at IS NOT NULL THEN

    UPDATE user_profiles
    SET
      mind_insurance_assessment_completed_at = NEW.completed_at,
      updated_at = NOW()
    WHERE id = NEW.user_id;

  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS on_mind_insurance_assessment_complete ON identity_collision_assessments;

-- Create trigger on identity_collision_assessments
CREATE TRIGGER on_mind_insurance_assessment_complete
AFTER INSERT OR UPDATE OF completed_at ON identity_collision_assessments
FOR EACH ROW
EXECUTE FUNCTION sync_mind_insurance_assessment_to_profile();

-- ============================================================================
-- PHASE 4: Create indexes for performance
-- ============================================================================

-- Index for quick lookups on assessment completion status
CREATE INDEX IF NOT EXISTS idx_user_profiles_grouphome_assessment
ON user_profiles(grouphome_assessment_completed_at)
WHERE grouphome_assessment_completed_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_profiles_mind_insurance_assessment
ON user_profiles(mind_insurance_assessment_completed_at)
WHERE mind_insurance_assessment_completed_at IS NOT NULL;

-- ============================================================================
-- Verification queries (run manually to verify)
-- ============================================================================
-- SELECT COUNT(*) FROM user_profiles WHERE grouphome_assessment_completed_at IS NOT NULL;
-- SELECT COUNT(*) FROM user_profiles WHERE mind_insurance_assessment_completed_at IS NOT NULL;
