-- Fix RLS policies for gh_documents and gh_document_tactic_links
--
-- ISSUE: Policies were checking admin_users.id = auth.uid()
-- FIX: Should check admin_users.user_id = auth.uid()
--
-- admin_users.id = UUID primary key (auto-generated)
-- admin_users.user_id = FK to auth.users(id) (the actual user's auth ID)

-- ============================================================================
-- FIX gh_documents RLS POLICIES
-- ============================================================================

-- Drop old incorrect policies
DROP POLICY IF EXISTS "Admins can insert documents" ON gh_documents;
DROP POLICY IF EXISTS "Admins can update documents" ON gh_documents;
DROP POLICY IF EXISTS "Admins can delete documents" ON gh_documents;

-- Create corrected policies
CREATE POLICY "Admins can insert documents"
  ON gh_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update documents"
  ON gh_documents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete documents"
  ON gh_documents FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- ============================================================================
-- FIX gh_document_tactic_links RLS POLICIES
-- ============================================================================

-- Drop old incorrect policies
DROP POLICY IF EXISTS "Admins can manage links" ON gh_document_tactic_links;

-- Create corrected policies with granular permissions
CREATE POLICY "Admins can insert links"
  ON gh_document_tactic_links FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update links"
  ON gh_document_tactic_links FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete links"
  ON gh_document_tactic_links FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these to verify the fix works:
--
-- 1. Check if you're recognized as an admin:
--    SELECT EXISTS (
--      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
--    ) as am_i_admin;
--
-- 2. Test inserting a link:
--    INSERT INTO gh_document_tactic_links (document_id, tactic_id, link_type, display_order)
--    VALUES (1, 'test-tactic', 'recommended', 0);
--
-- 3. Verify policies are active:
--    SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
--    FROM pg_policies
--    WHERE tablename IN ('gh_documents', 'gh_document_tactic_links')
--    ORDER BY tablename, policyname;
