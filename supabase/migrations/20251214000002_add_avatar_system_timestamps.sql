-- ============================================================================
-- Migration: Avatar System Timestamps
-- Date: 2024-12-14
-- Purpose: Add timestamp columns for temperament and avatar assignment tracking
-- ============================================================================
--
-- CONTEXT:
-- - user_profiles.temperament already exists
-- - user_profiles.avatar_type already exists
-- - avatar_assessments table already has temperament + sub_pattern_scores
-- - We only need to add TIMESTAMP columns to track when assessments were completed
--
-- SAFETY:
-- - All columns have DEFAULT NULL (won't break user creation trigger)
-- - Database is shared between Mind Insurance and Grouphomes4newbies
-- ============================================================================

-- Add temperament assessment timestamp
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS temperament_assessed_at TIMESTAMPTZ DEFAULT NULL;

-- Add avatar assignment timestamp
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS avatar_assigned_at TIMESTAMPTZ DEFAULT NULL;

-- Optional: Add foreign key to link to specific avatar_assessments record
-- This allows us to track which avatar_assessment record was used for assignment
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS assigned_avatar_assessment_id UUID DEFAULT NULL;

-- Add foreign key constraint (optional, allows orphaned references if assessment deleted)
-- Note: Not adding REFERENCES constraint to avoid issues with existing data
-- The application layer will maintain referential integrity

-- Add comment documentation
COMMENT ON COLUMN user_profiles.temperament_assessed_at IS 'Timestamp when user completed the standalone Temperament Assessment (Week 2 feature)';
COMMENT ON COLUMN user_profiles.avatar_assigned_at IS 'Timestamp when user was assigned their 1-of-15 avatar based on Pattern + Sub-Pattern + Temperament';
COMMENT ON COLUMN user_profiles.assigned_avatar_assessment_id IS 'Foreign key to avatar_assessments.id - the assessment record used to assign avatar';

-- Create index for fast lookup of users who have completed temperament assessment
CREATE INDEX IF NOT EXISTS idx_user_profiles_temperament_assessed
ON user_profiles(temperament_assessed_at)
WHERE temperament_assessed_at IS NOT NULL;

-- Create index for fast lookup of users who have been assigned an avatar
CREATE INDEX IF NOT EXISTS idx_user_profiles_avatar_assigned
ON user_profiles(avatar_assigned_at)
WHERE avatar_assigned_at IS NOT NULL;

-- ============================================================================
-- Verification query (run manually to confirm)
-- ============================================================================
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'user_profiles'
-- AND column_name IN ('temperament_assessed_at', 'avatar_assigned_at', 'assigned_avatar_assessment_id');
