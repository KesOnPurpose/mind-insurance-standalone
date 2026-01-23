// ============================================================================
// DOCUMENT UPLOAD SERVICE
// ============================================================================
// File handling for the Document Vault - upload, retrieve, and manage
// compliance documents stored in Supabase Storage.
// ============================================================================

import { supabase } from '@/integrations/supabase/client';
import type {
  BinderDocument,
  DocumentType,
  DOCUMENT_TYPE_LABELS,
} from '@/types/compliance';

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_BUCKET = 'compliance-documents';
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const ALLOWED_EXTENSIONS = [
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.doc',
  '.docx',
];

// ============================================================================
// TYPES
// ============================================================================

export interface UploadDocumentInput {
  binder_id: string;
  file: File;
  document_type: DocumentType;
  description?: string;
  expires_at?: string; // ISO date string
}

export interface UpdateDocumentInput {
  document_type?: DocumentType;
  description?: string;
  expires_at?: string | null;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate file before upload
 */
function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size must be less than ${MAX_FILE_SIZE_MB}MB`,
    };
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `File type "${file.type}" is not allowed. Allowed types: PDF, images, Word documents`,
    };
  }

  // Check extension
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: `File extension "${extension}" is not allowed`,
    };
  }

  return { valid: true };
}

/**
 * Generate a unique file path in storage
 */
function generateFilePath(userId: string, binderId: string, fileName: string): string {
  const timestamp = Date.now();
  const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${userId}/${binderId}/${timestamp}_${safeFileName}`;
}

// ============================================================================
// UPLOAD OPERATIONS
// ============================================================================

/**
 * Upload a document to the compliance binder
 */
export async function uploadDocument(
  input: UploadDocumentInput
): Promise<BinderDocument> {
  // Get current user
  const { data: user } = await supabase.auth.getUser();
  if (!user?.user?.id) {
    throw new Error('User not authenticated');
  }

  // Validate file
  const validation = validateFile(input.file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Verify binder belongs to user
  const { data: binder, error: binderError } = await supabase
    .from('compliance_binders')
    .select('id')
    .eq('id', input.binder_id)
    .eq('user_id', user.user.id)
    .single();

  if (binderError || !binder) {
    throw new Error('Binder not found or access denied');
  }

  // Generate storage path
  const filePath = generateFilePath(user.user.id, input.binder_id, input.file.name);

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, input.file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('Storage upload error:', uploadError);
    throw new Error('Failed to upload file');
  }

  // Get the public URL
  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filePath);

  // Create database record
  const { data, error: dbError } = await supabase
    .from('binder_documents')
    .insert({
      binder_id: input.binder_id,
      document_type: input.document_type,
      file_name: input.file.name,
      file_url: urlData.publicUrl,
      file_size: input.file.size,
      mime_type: input.file.type,
      storage_path: filePath,
      description: input.description,
      expires_at: input.expires_at,
    })
    .select()
    .single();

  if (dbError) {
    // Rollback: delete the uploaded file
    await supabase.storage.from(STORAGE_BUCKET).remove([filePath]);
    console.error('Database insert error:', dbError);
    throw new Error('Failed to save document record');
  }

  // Update binder's updated_at timestamp
  await supabase
    .from('compliance_binders')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', input.binder_id);

  return data;
}

/**
 * Upload multiple documents at once
 */
export async function uploadMultipleDocuments(
  binderId: string,
  files: File[],
  documentType: DocumentType
): Promise<{ successful: BinderDocument[]; failed: { file: File; error: string }[] }> {
  const results: { successful: BinderDocument[]; failed: { file: File; error: string }[] } = {
    successful: [],
    failed: [],
  };

  for (const file of files) {
    try {
      const doc = await uploadDocument({
        binder_id: binderId,
        file,
        document_type: documentType,
      });
      results.successful.push(doc);
    } catch (error) {
      results.failed.push({
        file,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

// ============================================================================
// RETRIEVE OPERATIONS
// ============================================================================

/**
 * Get all documents for a binder
 */
export async function getBinderDocuments(binderId: string): Promise<BinderDocument[]> {
  const { data, error } = await supabase
    .from('binder_documents')
    .select('*')
    .eq('binder_id', binderId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Get documents error:', error);
    throw new Error('Failed to fetch documents');
  }

  return data || [];
}

/**
 * Get documents by type for a binder
 */
export async function getDocumentsByType(
  binderId: string,
  documentType: DocumentType
): Promise<BinderDocument[]> {
  const { data, error } = await supabase
    .from('binder_documents')
    .select('*')
    .eq('binder_id', binderId)
    .eq('document_type', documentType)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Get documents by type error:', error);
    throw new Error('Failed to fetch documents');
  }

  return data || [];
}

/**
 * Get a single document by ID
 */
export async function getDocumentById(documentId: string): Promise<BinderDocument | null> {
  const { data, error } = await supabase
    .from('binder_documents')
    .select('*')
    .eq('id', documentId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Get document error:', error);
    throw new Error('Failed to fetch document');
  }

  return data;
}

/**
 * Get expiring documents (within specified days)
 */
export async function getExpiringDocuments(
  binderId: string,
  daysUntilExpiry: number = 30
): Promise<BinderDocument[]> {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysUntilExpiry);

  const { data, error } = await supabase
    .from('binder_documents')
    .select('*')
    .eq('binder_id', binderId)
    .not('expires_at', 'is', null)
    .lte('expires_at', futureDate.toISOString())
    .gte('expires_at', new Date().toISOString())
    .order('expires_at', { ascending: true });

  if (error) {
    console.error('Get expiring documents error:', error);
    throw new Error('Failed to fetch expiring documents');
  }

  return data || [];
}

/**
 * Get expired documents
 */
export async function getExpiredDocuments(binderId: string): Promise<BinderDocument[]> {
  const { data, error } = await supabase
    .from('binder_documents')
    .select('*')
    .eq('binder_id', binderId)
    .not('expires_at', 'is', null)
    .lt('expires_at', new Date().toISOString())
    .order('expires_at', { ascending: false });

  if (error) {
    console.error('Get expired documents error:', error);
    throw new Error('Failed to fetch expired documents');
  }

  return data || [];
}

// ============================================================================
// UPDATE OPERATIONS
// ============================================================================

/**
 * Update document metadata
 */
export async function updateDocument(
  documentId: string,
  input: UpdateDocumentInput
): Promise<BinderDocument> {
  const { data, error } = await supabase
    .from('binder_documents')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', documentId)
    .select()
    .single();

  if (error) {
    console.error('Update document error:', error);
    throw new Error('Failed to update document');
  }

  // Update binder's updated_at timestamp
  await supabase
    .from('compliance_binders')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', data.binder_id);

  return data;
}

/**
 * Replace a document file (keep metadata, replace file)
 */
export async function replaceDocumentFile(
  documentId: string,
  newFile: File
): Promise<BinderDocument> {
  // Get current user
  const { data: user } = await supabase.auth.getUser();
  if (!user?.user?.id) {
    throw new Error('User not authenticated');
  }

  // Validate new file
  const validation = validateFile(newFile);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Get existing document
  const { data: existingDoc, error: fetchError } = await supabase
    .from('binder_documents')
    .select('*, compliance_binders!inner(user_id)')
    .eq('id', documentId)
    .single();

  if (fetchError || !existingDoc) {
    throw new Error('Document not found');
  }

  // Verify ownership
  if ((existingDoc.compliance_binders as { user_id: string }).user_id !== user.user.id) {
    throw new Error('Access denied');
  }

  // Delete old file from storage
  if (existingDoc.storage_path) {
    await supabase.storage.from(STORAGE_BUCKET).remove([existingDoc.storage_path]);
  }

  // Upload new file
  const newFilePath = generateFilePath(user.user.id, existingDoc.binder_id, newFile.name);
  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(newFilePath, newFile, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('Storage upload error:', uploadError);
    throw new Error('Failed to upload new file');
  }

  // Get the public URL
  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(newFilePath);

  // Update database record
  const { data, error: updateError } = await supabase
    .from('binder_documents')
    .update({
      file_name: newFile.name,
      file_url: urlData.publicUrl,
      file_size: newFile.size,
      mime_type: newFile.type,
      storage_path: newFilePath,
      updated_at: new Date().toISOString(),
    })
    .eq('id', documentId)
    .select()
    .single();

  if (updateError) {
    // Rollback: delete the new file
    await supabase.storage.from(STORAGE_BUCKET).remove([newFilePath]);
    console.error('Database update error:', updateError);
    throw new Error('Failed to update document record');
  }

  return data;
}

// ============================================================================
// DELETE OPERATIONS
// ============================================================================

/**
 * Delete a document
 */
export async function deleteDocument(documentId: string): Promise<void> {
  // Get document to find storage path and binder_id
  const { data: doc, error: fetchError } = await supabase
    .from('binder_documents')
    .select('storage_path, binder_id')
    .eq('id', documentId)
    .single();

  if (fetchError) {
    console.error('Fetch document error:', fetchError);
    throw new Error('Document not found');
  }

  // Delete from storage
  if (doc.storage_path) {
    const { error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([doc.storage_path]);

    if (storageError) {
      console.error('Storage delete error:', storageError);
      // Continue with database deletion even if storage fails
    }
  }

  // Delete database record
  const { error: deleteError } = await supabase
    .from('binder_documents')
    .delete()
    .eq('id', documentId);

  if (deleteError) {
    console.error('Delete document error:', deleteError);
    throw new Error('Failed to delete document');
  }

  // Update binder's updated_at timestamp
  await supabase
    .from('compliance_binders')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', doc.binder_id);
}

/**
 * Delete multiple documents
 */
export async function deleteMultipleDocuments(documentIds: string[]): Promise<{
  successful: string[];
  failed: { id: string; error: string }[];
}> {
  const results: { successful: string[]; failed: { id: string; error: string }[] } = {
    successful: [],
    failed: [],
  };

  for (const id of documentIds) {
    try {
      await deleteDocument(id);
      results.successful.push(id);
    } catch (error) {
      results.failed.push({
        id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

// ============================================================================
// DOWNLOAD OPERATIONS
// ============================================================================

/**
 * Get a signed download URL (for private files)
 */
export async function getSignedDownloadUrl(
  documentId: string,
  expiresInSeconds: number = 3600
): Promise<string> {
  // Get document
  const { data: doc, error: fetchError } = await supabase
    .from('binder_documents')
    .select('storage_path')
    .eq('id', documentId)
    .single();

  if (fetchError || !doc?.storage_path) {
    throw new Error('Document not found');
  }

  // Create signed URL
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(doc.storage_path, expiresInSeconds);

  if (error) {
    console.error('Create signed URL error:', error);
    throw new Error('Failed to generate download link');
  }

  return data.signedUrl;
}

/**
 * Download document as blob
 */
export async function downloadDocument(documentId: string): Promise<Blob> {
  // Get document
  const { data: doc, error: fetchError } = await supabase
    .from('binder_documents')
    .select('storage_path')
    .eq('id', documentId)
    .single();

  if (fetchError || !doc?.storage_path) {
    throw new Error('Document not found');
  }

  // Download file
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .download(doc.storage_path);

  if (error) {
    console.error('Download error:', error);
    throw new Error('Failed to download document');
  }

  return data;
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get document statistics for a binder
 */
export async function getDocumentStats(binderId: string): Promise<{
  total_documents: number;
  total_size_bytes: number;
  by_type: Record<DocumentType, number>;
  expiring_soon: number;
  expired: number;
}> {
  const { data, error } = await supabase
    .from('binder_documents')
    .select('document_type, file_size, expires_at')
    .eq('binder_id', binderId);

  if (error) {
    console.error('Get document stats error:', error);
    throw new Error('Failed to get document statistics');
  }

  const docs = data || [];
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const byType: Record<string, number> = {};
  let totalSize = 0;
  let expiringSoon = 0;
  let expired = 0;

  docs.forEach((doc) => {
    byType[doc.document_type] = (byType[doc.document_type] || 0) + 1;
    totalSize += doc.file_size || 0;

    if (doc.expires_at) {
      const expiryDate = new Date(doc.expires_at);
      if (expiryDate < now) {
        expired++;
      } else if (expiryDate <= thirtyDaysFromNow) {
        expiringSoon++;
      }
    }
  });

  return {
    total_documents: docs.length,
    total_size_bytes: totalSize,
    by_type: byType as Record<DocumentType, number>,
    expiring_soon: expiringSoon,
    expired,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Check if a document type requires expiry date
 */
export function requiresExpiryDate(documentType: DocumentType): boolean {
  const typesRequiringExpiry: DocumentType[] = [
    'license',
    'permit',
    'insurance',
    'inspection',
    'certification',
  ];
  return typesRequiringExpiry.includes(documentType);
}

/**
 * Get icon name for document type (for UI)
 */
export function getDocumentTypeIcon(documentType: DocumentType): string {
  const icons: Record<DocumentType, string> = {
    license: 'FileCheck',
    permit: 'FileText',
    insurance: 'Shield',
    lease: 'Home',
    inspection: 'ClipboardCheck',
    certification: 'Award',
    contract: 'FileSignature',
    training: 'GraduationCap',
    other: 'File',
  };
  return icons[documentType] || 'File';
}

// ============================================================================
// EXPORT
// ============================================================================

export default {
  // Upload
  uploadDocument,
  uploadMultipleDocuments,
  // Retrieve
  getBinderDocuments,
  getDocumentsByType,
  getDocumentById,
  getExpiringDocuments,
  getExpiredDocuments,
  // Update
  updateDocument,
  replaceDocumentFile,
  // Delete
  deleteDocument,
  deleteMultipleDocuments,
  // Download
  getSignedDownloadUrl,
  downloadDocument,
  // Statistics
  getDocumentStats,
  // Utilities
  formatFileSize,
  requiresExpiryDate,
  getDocumentTypeIcon,
  // Constants
  MAX_FILE_SIZE_MB,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
};
