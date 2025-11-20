-- ============================================================================
-- ADMIN ACCESS TROUBLESHOOTING
-- ============================================================================
-- Run these queries in Supabase SQL Editor to diagnose the issue
-- ============================================================================

-- STEP 1: Check who is currently logged in
-- ----------------------------------------------------------------------------
SELECT id, email, created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;
-- Copy the user ID of kes@purposewaze.com from the results
-- ============================================================================

-- STEP 2: Check if admin_users record exists for that user
-- ----------------------------------------------------------------------------
-- Replace 'YOUR-USER-ID-HERE' with the actual user_id from Step 1
SELECT *
FROM admin_users
WHERE user_id = 'ad846530-e02b-4493-b208-28a7528e02cc';
-- Expected: Should return 1 row with role = 'super_admin'
-- ============================================================================

-- STEP 3: Verify RLS policies are working
-- ----------------------------------------------------------------------------
-- This query tests if the RLS SELECT policy allows the user to see themselves
SELECT *
FROM admin_users
WHERE user_id = auth.uid()
AND is_active = true;
-- Expected: Should return 1 row when run AS the admin user
-- If this returns 0 rows, the RLS policy is blocking access
-- ============================================================================

-- STEP 4: Test the is_admin() function directly
-- ----------------------------------------------------------------------------
SELECT is_admin() as am_i_admin;
-- Expected: Should return TRUE when run AS kes@purposewaze.com
-- If returns FALSE, the function can't see the admin_users table
-- ============================================================================

-- STEP 5: Check if RLS is enabled (should be TRUE)
-- ----------------------------------------------------------------------------
SELECT
  tablename,
  CASE WHEN rowsecurity THEN 'ENABLED ✓' ELSE 'DISABLED ✗' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'admin_users';
-- Expected: RLS should be ENABLED
-- ============================================================================

-- STEP 6: List all RLS policies on admin_users
-- ----------------------------------------------------------------------------
SELECT
  policyname,
  cmd as operation,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'admin_users'
ORDER BY policyname;
-- Expected: Should show 4 policies (SELECT, INSERT, UPDATE, DELETE)
-- ============================================================================

-- ============================================================================
-- COMMON FIXES
-- ============================================================================

-- FIX 1: If admin_users record doesn't exist, create it
-- ----------------------------------------------------------------------------
-- Replace with YOUR actual user_id from Step 1
INSERT INTO public.admin_users (
  user_id,
  role,
  permissions,
  is_active,
  created_at
) VALUES (
  'ad846530-e02b-4493-b208-28a7528e02cc',  -- ← YOUR user_id here
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
-- ============================================================================

-- FIX 2: If is_admin() function doesn't exist or has wrong signature
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
    AND is_active = true
  );
END;
$$;
-- ============================================================================

-- FIX 3: If RLS policy is missing, recreate it
-- ----------------------------------------------------------------------------
-- First, drop existing policy if it exists
DROP POLICY IF EXISTS "Admins can view all admin users" ON public.admin_users;

-- Then recreate it
CREATE POLICY "Admins can view all admin users"
  ON public.admin_users FOR SELECT
  USING ((SELECT is_admin()));
-- ============================================================================

-- FIX 4: Verify the user_id in admin_users matches auth.users
-- ----------------------------------------------------------------------------
SELECT
  u.id as auth_user_id,
  u.email,
  au.user_id as admin_user_id,
  au.role,
  au.is_active,
  CASE
    WHEN u.id = au.user_id THEN '✓ MATCH'
    ELSE '✗ MISMATCH'
  END as id_status
FROM auth.users u
LEFT JOIN admin_users au ON u.id = au.user_id
WHERE u.email = 'kes@purposewaze.com';
-- Expected: id_status should be '✓ MATCH'
-- If MISMATCH, the admin_users.user_id is wrong
-- ============================================================================

-- ============================================================================
-- DEBUGGING: Enable detailed error logging
-- ============================================================================
-- If you still see "Admin Access Error", check the browser console:
-- 1. Open browser DevTools (F12)
-- 2. Go to Console tab
-- 3. Look for errors from [AdminContext]
-- 4. The error message will tell you exactly what's failing
-- ============================================================================
