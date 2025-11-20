-- ============================================================================
-- ADMIN USER SEEDING SCRIPT
-- ============================================================================
-- Purpose: Create the first super_admin user for the admin dashboard
-- Usage: Run this manually in Supabase SQL editor after deployment
-- Security: Requires actual user_id from auth.users table
-- ============================================================================

-- STEP 1: Find your user_id from Supabase Auth
-- ----------------------------------------------------------------------------
-- Option A: If you know your email, run this query:
-- SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';
--
-- Option B: List all users:
-- SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC;
-- ----------------------------------------------------------------------------

-- STEP 2: Replace 'YOUR-USER-UUID-HERE' with the actual user_id from Step 1
-- ----------------------------------------------------------------------------
INSERT INTO public.admin_users (
  user_id,
  role,
  permissions,
  is_active,
  created_at
) VALUES (
  'ad846530-e02b-4493-b208-28a7528e02cc',  -- ← REPLACE THIS with your user_id from Step 1
  'super_admin',
  '{
    "users": {"read": true, "write": true, "delete": true},
    "analytics": {"read": true, "export": true},
    "content": {"read": true, "write": true, "publish": true},
    "system": {"read": true, "configure": true}
  }'::jsonb,
  true,
  NOW()
)
ON CONFLICT (user_id) DO UPDATE
SET
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions,
  is_active = EXCLUDED.is_active;

-- STEP 3: Verify the admin user was created
-- ----------------------------------------------------------------------------
-- Run this query to confirm:
SELECT
  au.id,
  au.user_id,
  au.role,
  au.is_active,
  au.created_at,
  u.email
FROM admin_users au
JOIN auth.users u ON au.user_id = u.id
WHERE au.role = 'super_admin';
-- ----------------------------------------------------------------------------

-- ============================================================================
-- OPTIONAL: Add additional admin users with different roles
-- ============================================================================

-- Example: Add an analyst (read-only analytics)
-- ----------------------------------------------------------------------------
-- INSERT INTO public.admin_users (user_id, role, permissions, is_active)
-- VALUES (
--   'ANALYST-USER-UUID-HERE',
--   'analyst',
--   '{
--     "users": {"read": true, "write": false, "delete": false},
--     "analytics": {"read": true, "export": true},
--     "content": {"read": true, "write": false, "publish": false},
--     "system": {"read": true, "configure": false}
--   }'::jsonb,
--   true
-- );
-- ----------------------------------------------------------------------------

-- Example: Add a content manager
-- ----------------------------------------------------------------------------
-- INSERT INTO public.admin_users (user_id, role, permissions, is_active)
-- VALUES (
--   'CONTENT-MANAGER-UUID-HERE',
--   'content_manager',
--   '{
--     "users": {"read": true, "write": false, "delete": false},
--     "analytics": {"read": true, "export": false},
--     "content": {"read": true, "write": true, "publish": true},
--     "system": {"read": false, "configure": false}
--   }'::jsonb,
--   true
-- );
-- ----------------------------------------------------------------------------

-- Example: Add a support user
-- ----------------------------------------------------------------------------
-- INSERT INTO public.admin_users (user_id, role, permissions, is_active)
-- VALUES (
--   'SUPPORT-USER-UUID-HERE',
--   'support',
--   '{
--     "users": {"read": true, "write": true, "delete": false},
--     "analytics": {"read": true, "export": false},
--     "content": {"read": true, "write": false, "publish": false},
--     "system": {"read": false, "configure": false}
--   }'::jsonb,
--   true
-- );
-- ----------------------------------------------------------------------------

-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================

-- If you get "violates foreign key constraint" error:
-- → The user_id doesn't exist in auth.users table
-- → Solution: User must sign up through the app first, then run this script

-- If you get "duplicate key value violates unique constraint":
-- → An admin user with this user_id already exists
-- → Solution: Use the UPDATE query below instead

-- Update existing admin user:
-- ----------------------------------------------------------------------------
-- UPDATE public.admin_users
-- SET
--   role = 'super_admin',
--   permissions = '{
--     "users": {"read": true, "write": true, "delete": true},
--     "analytics": {"read": true, "export": true},
--     "content": {"read": true, "write": true, "publish": true},
--     "system": {"read": true, "configure": true}
--   }'::jsonb,
--   is_active = true
-- WHERE user_id = 'YOUR-USER-UUID-HERE';
-- ----------------------------------------------------------------------------

-- Remove admin access (deactivate):
-- ----------------------------------------------------------------------------
-- UPDATE public.admin_users
-- SET is_active = false
-- WHERE user_id = 'USER-UUID-TO-DEACTIVATE';
-- ----------------------------------------------------------------------------

-- Completely delete admin user:
-- ----------------------------------------------------------------------------
-- DELETE FROM public.admin_users
-- WHERE user_id = 'USER-UUID-TO-DELETE';
-- ----------------------------------------------------------------------------
