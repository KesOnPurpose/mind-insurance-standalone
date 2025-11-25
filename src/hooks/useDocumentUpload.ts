// useDocumentUpload Hook
// Handle file upload to Supabase Storage and create document record

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { uploadDocument, createDocumentRecord } from '@/services/documentService';
import type { DocumentUploadPayload, GHDocument } from '@/types/documents';
import { toast } from 'sonner';

interface UseDocumentUploadReturn {
  uploadDocument: (payload: DocumentUploadPayload) => Promise<GHDocument | null>;
  isUploading: boolean;
  progress: number;
  error: Error | null;
}

export const useDocumentUpload = (): UseDocumentUploadReturn => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  const handleUpload = async (
    payload: DocumentUploadPayload
  ): Promise<GHDocument | null> => {
    if (!user) {
      toast.error('You must be logged in to upload documents');
      return null;
    }

    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(payload.file.type)) {
        throw new Error('Only PDF and DOCX files are allowed');
      }

      // Validate file size (10MB max)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (payload.file.size > maxSize) {
        throw new Error('File size must be less than 10MB');
      }

      setProgress(20);

      // Upload file to Supabase Storage
      const { documentUrl, storagePath } = await uploadDocument(
        payload.file,
        payload.metadata.category,
        user.id
      );

      setProgress(60);

      // Create document record in database
      const document = await createDocumentRecord(
        {
          document_name: payload.metadata.document_name,
          category: payload.metadata.category,
          description: payload.metadata.description || null,
          document_url: documentUrl,
          applicable_states: payload.metadata.applicable_states || null,
          ownership_model: payload.metadata.ownership_model || null,
          applicable_populations: payload.metadata.applicable_populations || null,
          difficulty: payload.metadata.difficulty || null,
          file_size_kb: Math.round(payload.file.size / 1024),
          file_type: payload.file.type,
        },
        user.id
      );

      setProgress(100);
      toast.success('Document uploaded successfully');
      return document;
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast.error(`Upload failed: ${error.message}`);
      console.error('Upload error:', error);
      return null;
    } finally {
      setIsUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  return {
    uploadDocument: handleUpload,
    isUploading,
    progress,
    error,
  };
};
