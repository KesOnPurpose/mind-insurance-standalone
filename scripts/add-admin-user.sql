-- ============================================================================
-- ADD ADMIN USER TO admin_users TABLE
-- ============================================================================
-- This grants admin permissions to upload documents
-- Replace 'your-email@example.com' with your actual email
-- ============================================================================

-- Step 1: Find your user ID
SELECT
  id,
  email,
  created_at
FROM auth.users
WHERE email = 'your-email@example.com';  -- REPLACE WITH YOUR EMAIL

-- Step 2: Copy the 'id' from the result above and paste it below
-- Then uncomment and run this INSERT statement:

/*
INSERT INTO admin_users (id, role, permissions)
VALUES (
  'PASTE-YOUR-USER-ID-HERE',  -- UUID from Step 1
  'super_admin',
  '{
    "users": ["read", "write", "delete"],
    "analytics": ["read", "export"],
    "content": ["read", "write", "delete"],
    "system": ["read", "write"]
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions;
*/

-- Step 3: Verify admin user was added
SELECT
  au.id,
  u.email,
  au.role,
  au.permissions,
  au.created_at
FROM admin_users au
JOIN auth.users u ON au.id = u.id
WHERE u.email = 'your-email@example.com';  -- REPLACE WITH YOUR EMAIL

-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================

-- If admin_users table doesn't exist, create it first:
/*
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin',
  permissions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can view other admins"
  ON admin_users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );
*/

-- ============================================================================
-- QUICK METHOD (if you know your user ID already)
-- ============================================================================
-- Just replace YOUR-USER-ID and run:
/*
INSERT INTO admin_users (id, role, permissions)
VALUES (
  'YOUR-USER-ID',
  'super_admin',
  '{"users": ["read", "write", "delete"], "analytics": ["read", "export"], "content": ["read", "write", "delete"], "system": ["read", "write"]}'::jsonb
)
ON CONFLICT (id) DO NOTHING;
*/
