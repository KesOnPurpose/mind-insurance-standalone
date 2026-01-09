-- ============================================================================
-- MI APPROVED USERS TABLE
-- Purpose: Separate access control table for Mind Insurance users
-- Replaces gh_approved_users for MI Standalone
-- ============================================================================

-- Create MI-specific tier enum (simpler than GH - no coach/owner)
DO $$ BEGIN
  CREATE TYPE mi_user_tier AS ENUM ('user', 'admin', 'super_admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create mi_approved_users table
CREATE TABLE IF NOT EXISTS public.mi_approved_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Core fields
  email TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Tier management
  tier mi_user_tier DEFAULT 'user' NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,

  -- User info
  full_name TEXT,
  phone TEXT,
  notes TEXT,

  -- Admin tracking
  approved_at TIMESTAMPTZ DEFAULT NOW(),
  approved_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ,
  last_access_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment for documentation
COMMENT ON TABLE mi_approved_users IS 'Access control for Mind Insurance standalone users. Separate from gh_approved_users.';

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_mi_approved_users_email ON mi_approved_users(email);
CREATE INDEX IF NOT EXISTS idx_mi_approved_users_user_id ON mi_approved_users(user_id);
CREATE INDEX IF NOT EXISTS idx_mi_approved_users_tier ON mi_approved_users(tier);
CREATE INDEX IF NOT EXISTS idx_mi_approved_users_is_active ON mi_approved_users(is_active);
CREATE INDEX IF NOT EXISTS idx_mi_approved_users_active_users ON mi_approved_users(user_id, is_active) WHERE is_active = true;

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_mi_approved_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_mi_approved_users_updated_at ON mi_approved_users;
CREATE TRIGGER update_mi_approved_users_updated_at
  BEFORE UPDATE ON mi_approved_users
  FOR EACH ROW
  EXECUTE FUNCTION update_mi_approved_users_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE mi_approved_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own MI access" ON mi_approved_users;
DROP POLICY IF EXISTS "MI admins can view all" ON mi_approved_users;
DROP POLICY IF EXISTS "MI super admins can manage" ON mi_approved_users;
DROP POLICY IF EXISTS "Service role full access mi_approved" ON mi_approved_users;

-- Users can view their own record
CREATE POLICY "Users can view own MI access"
  ON mi_approved_users FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all
CREATE POLICY "MI admins can view all"
  ON mi_approved_users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM mi_approved_users mau
      WHERE mau.user_id = auth.uid()
      AND mau.tier IN ('admin', 'super_admin')
      AND mau.is_active = true
    )
  );

-- Super admins can insert/update/delete
CREATE POLICY "MI super admins can manage"
  ON mi_approved_users FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM mi_approved_users mau
      WHERE mau.user_id = auth.uid()
      AND mau.tier = 'super_admin'
      AND mau.is_active = true
    )
  );

-- Service role bypass (for N8n and Edge Functions)
CREATE POLICY "Service role full access mi_approved"
  ON mi_approved_users FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT ALL ON mi_approved_users TO authenticated;
GRANT ALL ON mi_approved_users TO service_role;
