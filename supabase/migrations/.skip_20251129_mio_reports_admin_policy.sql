-- MIO Reports Admin Policy
-- Allows admin users to create, view, update, and delete MIO reports for any user
-- This enables the admin panel report generation functionality
-- Admin status is determined by the admin_users table (not user_profiles.role)

-- Add policy for admins to have full access to MIO reports
CREATE POLICY "Admins can manage all MIO reports"
  ON mio_user_reports FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
      AND au.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
      AND au.is_active = true
    )
  );
