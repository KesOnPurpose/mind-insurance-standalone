-- ============================================================================
-- ADD GHL_CONTACT_ID TO USER_PROFILES
-- ============================================================================
-- Stores GoHighLevel contact ID for SMS notifications
-- ============================================================================

-- Add ghl_contact_id column to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS ghl_contact_id TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_ghl_contact_id
ON user_profiles(ghl_contact_id)
WHERE ghl_contact_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN user_profiles.ghl_contact_id IS 'GoHighLevel contact ID for SMS notifications';
