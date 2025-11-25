// Bulk Document Upload Service
// Handles batch processing, duplicate detection, and parallel uploads

import { supabase } from '@/integrations/supabase/client';
import { uploadDocument, createDocumentRecord } from './documentService';
import type {
  AIMetadataSuggestion,
  BatchUploadResult,
  BulkUploadError,
  DuplicateCheck,
  FilenameCleaning,
} from '@/types/bulkUpload';
import type { GHDocument } from '@/types/documents';

/**
 * Check if a document with similar name already exists
 */
export const checkForDuplicates = async (
  filename: string
): Promise<DuplicateCheck> => {
  try {
    const cleanedFilename = filename
      .toLowerCase()
      .replace(/\.[^/.]+$/, ''); // Remove extension

    const { data: existingDocs, error } = await supabase
      .from('gh_documents')
      .select('id, document_name')
      .ilike('document_name', `%${cleanedFilename}%`)
      .limit(1);

    if (error) throw error;

    if (existingDocs && existingDocs.length > 0) {
      const existing = existingDocs[0];
      const similarity = calculateSimilarity(
        cleanedFilename,
        existing.document_name.toLowerCase()
      );

      return {
        isDuplicate: similarity > 80,
        existingDocumentId: existing.id,
        existingDocumentName: existing.document_name,
        similarity,
        reason: `Similar document found: "${existing.document_name}" (${similarity}% match)`,
      };
    }

    return {
      isDuplicate: false,
      similarity: 0,
      reason: 'No duplicates found',
    };
  } catch (error) {
    console.error('Duplicate check error:', error);
    return {
      isDuplicate: false,
      similarity: 0,
      reason: 'Duplicate check failed',
    };
  }
};

/**
 * Calculate string similarity percentage (Levenshtein-based)
 */
const calculateSimilarity = (str1: string, str2: string): number => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 100;

  const distance = levenshteinDistance(longer, shorter);
  return Math.round(((longer.length - distance) / longer.length) * 100);
};

/**
 * Levenshtein distance algorithm
 */
const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
};

/**
 * Clean filename and detect issues
 */
export const cleanDocumentFilename = (filename: string): FilenameCleaning => {
  const original = filename;
  const changes: string[] = [];
  const warnings: string[] = [];

  let cleaned = filename;

  // Remove double extensions
  if (cleaned.match(/\.pdf\.pdf$/i)) {
    cleaned = cleaned.replace(/\.pdf\.pdf$/i, '.pdf');
    changes.push('Removed duplicate .pdf extension');
  }

  // Remove extension for display name
  const nameWithoutExt = cleaned.replace(/\.[^/.]+$/, '');

  // Check for trailing spaces
  if (nameWithoutExt !== nameWithoutExt.trim()) {
    cleaned = nameWithoutExt.trim();
    changes.push('Removed trailing spaces');
  }

  // Replace spaces with underscores
  if (cleaned.includes(' ')) {
    cleaned = cleaned.replace(/\s+/g, '_');
    changes.push('Replaced spaces with underscores');
  }

  // Remove special characters except dots and hyphens
  const specialCharsRemoved = cleaned.replace(/[^\w.-]/g, '');
  if (specialCharsRemoved !== cleaned) {
    cleaned = specialCharsRemoved;
    changes.push('Removed special characters');
  }

  // Check for very long filenames
  if (cleaned.length > 100) {
    warnings.push('Filename is very long (>100 chars)');
  }

  // Check for potential typos in common words
  if (
    cleaned.match(/licens[ei]ng|regulat[io]n|complianc[ei]|opertion|marke?ting/i)
  ) {
    warnings.push('Possible typo detected in filename');
  }

  return {
    original,
    cleaned,
    changes,
    warnings,
    isDuplicate: false, // Will be set by duplicate check
  };
};

/**
 * Process a single document upload with retry logic
 */
const uploadSingleDocument = async (
  file: File,
  suggestion: AIMetadataSuggestion,
  adminId: string,
  retryCount: number = 0
): Promise<{ success: boolean; document?: GHDocument; error?: string }> => {
  const maxRetries = 2;

  try {
    // Upload file to storage
    const { documentUrl, storagePath } = await uploadDocument(
      file,
      suggestion.suggestedMetadata.category,
      adminId
    );

    // Create database record
    const document = await createDocumentRecord(
      {
        document_name: suggestion.suggestedMetadata.document_name,
        category: suggestion.suggestedMetadata.category,
        description: suggestion.suggestedMetadata.description,
        document_url: documentUrl,
        applicable_states: suggestion.suggestedMetadata.applicable_states,
        ownership_model: suggestion.suggestedMetadata.ownership_model,
        applicable_populations:
          suggestion.suggestedMetadata.applicable_populations,
        difficulty: suggestion.suggestedMetadata.difficulty,
        file_size_kb: Math.round(file.size / 1024),
        file_type: file.type || file.name.split('.').pop() || 'unknown',
      },
      adminId
    );

    return { success: true, document };
  } catch (error) {
    console.error(`Upload failed for ${file.name}:`, error);

    // Retry logic
    if (retryCount < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 second delay
      return uploadSingleDocument(file, suggestion, adminId, retryCount + 1);
    }

    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Unknown upload error',
    };
  }
};

/**
 * Process bulk document uploads with progress tracking
 */
export const processBulkUpload = async (
  files: File[],
  suggestions: AIMetadataSuggestion[],
  adminId: string,
  onProgress?: (uploaded: number, total: number) => void
): Promise<BatchUploadResult> => {
  const result: BatchUploadResult = {
    successCount: 0,
    errorCount: 0,
    uploadedDocuments: [],
    errors: [],
  };

  // Process files sequentially to avoid overwhelming storage/database
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const suggestion = suggestions[i];

    if (!suggestion) {
      result.errors.push({
        filename: file.name,
        errorType: 'validation',
        message: 'No metadata suggestion found',
        timestamp: new Date().toISOString(),
        recoverable: false,
      });
      result.errorCount++;
      continue;
    }

    // Check for duplicates
    const duplicateCheck = await checkForDuplicates(file.name);
    if (duplicateCheck.isDuplicate) {
      result.errors.push({
        filename: file.name,
        errorType: 'duplicate',
        message: duplicateCheck.reason,
        timestamp: new Date().toISOString(),
        recoverable: false,
      });
      result.errorCount++;
      continue;
    }

    // Upload document
    const uploadResult = await uploadSingleDocument(file, suggestion, adminId);

    if (uploadResult.success && uploadResult.document) {
      result.successCount++;
      result.uploadedDocuments.push({
        filename: file.name,
        documentId: uploadResult.document.id,
        documentUrl: uploadResult.document.document_url,
      });
    } else {
      result.errorCount++;
      result.errors.push({
        filename: file.name,
        errorType: 'upload',
        message: uploadResult.error || 'Upload failed',
        timestamp: new Date().toISOString(),
        recoverable: true,
      });
    }

    // Report progress
    if (onProgress) {
      onProgress(result.successCount + result.errorCount, files.length);
    }
  }

  return result;
};

/**
 * Validate metadata completeness before upload
 */
export const validateMetadata = (
  suggestion: AIMetadataSuggestion
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const metadata = suggestion.suggestedMetadata;

  if (!metadata.document_name || metadata.document_name.trim() === '') {
    errors.push('Document name is required');
  }

  if (!metadata.category) {
    errors.push('Category is required');
  }

  if (!metadata.description || metadata.description.trim() === '') {
    errors.push('Description is required');
  }

  if (metadata.description && metadata.description.length < 10) {
    errors.push('Description must be at least 10 characters');
  }

  if (metadata.applicable_states && metadata.applicable_states.length === 0) {
    errors.push('At least one applicable state is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Get upload statistics for UI display
 */
export const calculateUploadStatistics = (
  suggestions: AIMetadataSuggestion[]
) => {
  const totalFiles = suggestions.length;
  const analyzedFiles = suggestions.filter((s) => s.confidenceScores.category > 0).length;

  const avgConfidence =
    suggestions.reduce((sum, s) => {
      const scores = Object.values(s.confidenceScores);
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      return sum + avg;
    }, 0) / totalFiles;

  const highConfidenceCount = suggestions.filter((s) => {
    const scores = Object.values(s.confidenceScores);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return avg > 90;
  }).length;

  const lowConfidenceCount = suggestions.filter((s) => s.needsReview).length;

  return {
    totalFiles,
    analyzedFiles,
    highConfidenceCount,
    lowConfidenceCount,
    averageConfidenceScore: Math.round(avgConfidence),
    estimatedTimeRemaining: `~${Math.ceil(totalFiles * 3)} seconds`, // 3 sec per file estimate
  };
};
