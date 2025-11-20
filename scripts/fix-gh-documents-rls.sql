-- ============================================================================
-- FIX gh_documents RLS POLICIES
-- ============================================================================
-- The policies are checking admin_users.id but should check admin_users.user_id
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can insert documents" ON gh_documents;
DROP POLICY IF EXISTS "Admins can update documents" ON gh_documents;
DROP POLICY IF EXISTS "Admins can delete documents" ON gh_documents;

-- Recreate with correct column name
CREATE POLICY "Admins can insert documents"
  ON gh_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()  -- FIXED: user_id instead of id
    )
  );

CREATE POLICY "Admins can update documents"
  ON gh_documents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()  -- FIXED: user_id instead of id
    )
  );

CREATE POLICY "Admins can delete documents"
  ON gh_documents FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()  -- FIXED: user_id instead of id
    )
  );

-- Verify policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'gh_documents'
ORDER BY policyname;
