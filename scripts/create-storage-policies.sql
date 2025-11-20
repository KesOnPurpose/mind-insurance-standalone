-- ============================================================================
-- SUPABASE STORAGE RLS POLICIES FOR training-materials BUCKET
-- ============================================================================
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Policy 1: Authenticated users can view/download documents
CREATE POLICY "Authenticated users can view documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'training-materials');

-- Policy 2: Admins can upload documents
CREATE POLICY "Admins can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'training-materials'
  AND EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
  )
);

-- Policy 3: Admins can update documents
CREATE POLICY "Admins can update documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'training-materials'
  AND EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
  )
);

-- Policy 4: Admins can delete documents
CREATE POLICY "Admins can delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'training-materials'
  AND EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
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
WHERE tablename = 'objects'
  AND policyname LIKE '%training-materials%'
ORDER BY policyname;
