-- ============================================================================
-- CREATE COMPLIANCE DOCUMENTS STORAGE BUCKET
-- ============================================================================
-- This migration creates the storage bucket required for compliance binder
-- document uploads. Run this in the Supabase Dashboard SQL Editor.
-- ============================================================================

-- 1. Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'compliance-documents',
  'compliance-documents',
  false,  -- Private bucket (requires authentication)
  52428800,  -- 50MB file size limit
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]::text[]
)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS Policy: Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload their own compliance documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'compliance-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. RLS Policy: Allow authenticated users to view their own files
CREATE POLICY "Users can view their own compliance documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'compliance-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. RLS Policy: Allow authenticated users to update their own files
CREATE POLICY "Users can update their own compliance documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'compliance-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. RLS Policy: Allow authenticated users to delete their own files
CREATE POLICY "Users can delete their own compliance documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'compliance-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
