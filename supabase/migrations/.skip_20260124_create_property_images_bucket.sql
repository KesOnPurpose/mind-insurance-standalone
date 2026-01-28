-- ============================================================================
-- CREATE PROPERTY IMAGES STORAGE BUCKET
-- ============================================================================
-- This migration creates the storage bucket required for property photo uploads.
-- Run this in the Supabase Dashboard SQL Editor.
-- ============================================================================

-- 1. Create the storage bucket (PUBLIC for image display)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-images',
  'property-images',
  true,  -- Public bucket (images need to be displayed)
  10485760,  -- 10MB file size limit
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif'
  ]::text[]
)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS Policy: Allow authenticated users to upload property images
-- Files are organized by property ID: {property_id}/{timestamp}-{random}.{ext}
CREATE POLICY "Users can upload property images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'property-images'
);

-- 3. RLS Policy: Allow anyone to view property images (public bucket)
CREATE POLICY "Anyone can view property images"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'property-images'
);

-- 4. RLS Policy: Allow authenticated users to update property images
CREATE POLICY "Users can update property images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'property-images'
);

-- 5. RLS Policy: Allow authenticated users to delete property images
CREATE POLICY "Users can delete property images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'property-images'
);
