// Bulk Document Upload Types
// AI-powered metadata extraction and batch processing

import type {
  DocumentCategory,
  OwnershipModel,
  ApplicablePopulation,
  DifficultyLevel,
} from './documents';

/**
 * AI-generated metadata suggestion with confidence scores
 */
export interface AIMetadataSuggestion {
  filename: string;
  suggestedMetadata: {
    document_name: string;
    category: DocumentCategory;
    description: string;
    applicable_states: string[];
    ownership_model: OwnershipModel[];
    applicable_populations: ApplicablePopulation[];
    difficulty: DifficultyLevel | null;
  };
  confidenceScores: {
    category: number; // 0-100
    description: number;
    applicable_states: number;
    ownership_model: number;
    applicable_populations: number;
    difficulty: number;
  };
  analysisNotes: string;
  needsReview: boolean; // True if any confidence score < 70
}

/**
 * File analysis state
 */
export interface FileAnalysisState {
  file: File;
  status: 'pending' | 'analyzing' | 'analyzed' | 'error' | 'approved';
  suggestion: AIMetadataSuggestion | null;
  error: string | null;
  cleanedFilename?: string; // Preview of cleaned filename
}

/**
 * Bulk upload workflow state machine
 */
export type BulkUploadStep =
  | 'upload' // Initial file selection
  | 'analyzing' // AI analyzing documents
  | 'reviewing' // User reviewing/editing suggestions
  | 'uploading' // Batch upload in progress
  | 'complete'; // All uploads finished

/**
 * Main bulk upload state container
 */
export interface BulkUploadState {
  files: FileAnalysisState[];
  currentStep: BulkUploadStep;
  progress: {
    analyzed: number;
    total: number;
    uploaded: number;
  };
  errors: BulkUploadError[];
  selectedFileIndex: number | null; // Currently selected file for review
}

/**
 * Error tracking for bulk operations
 */
export interface BulkUploadError {
  filename: string;
  errorType: 'analysis' | 'upload' | 'validation' | 'duplicate';
  message: string;
  timestamp: string;
  recoverable: boolean; // Can user retry this file?
}

/**
 * Batch processing result
 */
export interface BatchUploadResult {
  successCount: number;
  errorCount: number;
  uploadedDocuments: Array<{
    filename: string;
    documentId: number;
    documentUrl: string;
  }>;
  errors: BulkUploadError[];
}

/**
 * Filename cleaning result
 */
export interface FilenameCleaning {
  original: string;
  cleaned: string;
  changes: string[]; // List of transformations applied
  warnings: string[]; // Potential issues detected
  isDuplicate: boolean;
}

/**
 * AI analysis request payload
 */
export interface AnalysisRequest {
  filename: string;
  fileType: string;
  fileSize: number;
  textContent?: string; // Extracted text from PDF/DOCX
  imageData?: string; // Base64 for PNG/images
}

/**
 * Claude API response structure
 */
export interface ClaudeAnalysisResponse {
  category: DocumentCategory;
  description: string;
  applicable_states: string[];
  ownership_model: OwnershipModel[];
  applicable_populations: ApplicablePopulation[];
  difficulty: DifficultyLevel | null;
  confidence: {
    category: number;
    description: number;
    applicable_states: number;
    ownership_model: number;
    applicable_populations: number;
    difficulty: number;
  };
  notes: string;
}

/**
 * Batch operation options
 */
export interface BatchOperationOptions {
  batchSize: number; // Number of files to process in parallel (default: 5)
  retryAttempts: number; // Number of retry attempts for failed uploads (default: 2)
  skipDuplicates: boolean; // Auto-skip duplicate filenames (default: false)
  autoApproveHighConfidence: boolean; // Auto-approve suggestions with >90% confidence (default: false)
}

/**
 * Statistics for bulk upload session
 */
export interface BulkUploadStatistics {
  totalFiles: number;
  analyzedFiles: number;
  highConfidenceCount: number; // Suggestions with >90% avg confidence
  lowConfidenceCount: number; // Suggestions requiring review
  duplicatesDetected: number;
  averageConfidenceScore: number;
  estimatedTimeRemaining: string; // Human-readable time estimate
}

/**
 * User action for batch operations
 */
export type BatchAction =
  | { type: 'approve_all' }
  | { type: 'approve_high_confidence' } // Auto-approve >90%
  | { type: 'apply_category'; category: DocumentCategory }
  | { type: 'apply_state'; states: string[] }
  | { type: 'apply_difficulty'; difficulty: DifficultyLevel }
  | { type: 'reject_all_duplicates' };

/**
 * Duplicate detection result
 */
export interface DuplicateCheck {
  isDuplicate: boolean;
  existingDocumentId?: number;
  existingDocumentName?: string;
  similarity: number; // 0-100 percentage
  reason: string;
}
