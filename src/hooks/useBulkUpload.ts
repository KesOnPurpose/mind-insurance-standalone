// useBulkUpload Hook
// Manages bulk document upload state and workflow

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { analyzeBatchDocuments } from '@/services/metadataExtractor';
import {
  processBulkUpload,
  checkForDuplicates,
  cleanDocumentFilename,
  validateMetadata,
} from '@/services/bulkDocumentService';
import type {
  BulkUploadState,
  FileAnalysisState,
  AIMetadataSuggestion,
  BatchAction,
} from '@/types/bulkUpload';
import type { DocumentCategory, DifficultyLevel } from '@/types/documents';
import { toast } from 'sonner';

/**
 * Initial state
 */
const initialState: BulkUploadState = {
  files: [],
  currentStep: 'upload',
  progress: {
    analyzed: 0,
    total: 0,
    uploaded: 0,
  },
  errors: [],
  selectedFileIndex: null,
};

/**
 * Main bulk upload hook
 */
export const useBulkUpload = () => {
  const [state, setState] = useState<BulkUploadState>(initialState);
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();

  /**
   * Initialize upload with selected files
   */
  const initializeUpload = useCallback(async (files: File[]) => {
    // Clean filenames and check for duplicates
    const fileStates: FileAnalysisState[] = await Promise.all(
      files.map(async (file) => {
        const cleaning = cleanDocumentFilename(file.name);
        const duplicateCheck = await checkForDuplicates(file.name);

        return {
          file,
          status: 'pending' as const,
          suggestion: null,
          error: duplicateCheck.isDuplicate ? duplicateCheck.reason : null,
          cleanedFilename: cleaning.cleaned,
        };
      })
    );

    setState({
      ...initialState,
      files: fileStates,
      currentStep: 'upload',
      progress: {
        analyzed: 0,
        total: files.length,
        uploaded: 0,
      },
    });
  }, []);

  /**
   * Analyze all files with AI
   */
  const analyzeFiles = useCallback(async () => {
    if (state.files.length === 0) return;

    setIsProcessing(true);
    setState((prev) => ({ ...prev, currentStep: 'analyzing' }));

    try {
      const filesArray = state.files.map((f) => f.file);

      // Analyze with progress tracking
      const suggestions = await analyzeBatchDocuments(
        filesArray,
        5, // Batch size
        (analyzed, total) => {
          setState((prev) => ({
            ...prev,
            progress: { ...prev.progress, analyzed, total },
          }));
        }
      );

      // Update state with suggestions
      setState((prev) => ({
        ...prev,
        files: prev.files.map((fileState, index) => ({
          ...fileState,
          status: 'analyzed',
          suggestion: suggestions[index],
        })),
        currentStep: 'reviewing',
      }));

      toast.success(`Analyzed ${suggestions.length} documents successfully`);
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze documents');
      setState((prev) => ({
        ...prev,
        errors: [
          ...prev.errors,
          {
            filename: 'Batch Analysis',
            errorType: 'analysis',
            message:
              error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
            recoverable: true,
          },
        ],
      }));
    } finally {
      setIsProcessing(false);
    }
  }, [state.files]);

  /**
   * Update metadata for a specific file
   */
  const updateSuggestion = useCallback(
    (
      fileIndex: number,
      updates: Partial<AIMetadataSuggestion['suggestedMetadata']>
    ) => {
      setState((prev) => ({
        ...prev,
        files: prev.files.map((fileState, index) => {
          if (index === fileIndex && fileState.suggestion) {
            return {
              ...fileState,
              suggestion: {
                ...fileState.suggestion,
                suggestedMetadata: {
                  ...fileState.suggestion.suggestedMetadata,
                  ...updates,
                },
                needsReview: false, // User manually reviewed
              },
            };
          }
          return fileState;
        }),
      }));
    },
    []
  );

  /**
   * Approve a single file's suggestion
   */
  const approveSuggestion = useCallback((fileIndex: number) => {
    setState((prev) => ({
      ...prev,
      files: prev.files.map((fileState, index) => {
        if (index === fileIndex) {
          return {
            ...fileState,
            status: 'approved' as const,
            suggestion: fileState.suggestion
              ? { ...fileState.suggestion, needsReview: false }
              : null,
          };
        }
        return fileState;
      }),
    }));
  }, []);

  /**
   * Apply batch action to multiple files
   */
  const applyBatchAction = useCallback((action: BatchAction) => {
    setState((prev) => {
      let updatedFiles = [...prev.files];

      switch (action.type) {
        case 'approve_all':
          updatedFiles = updatedFiles.map((f) =>
            f.suggestion
              ? {
                  ...f,
                  status: 'approved' as const,
                  suggestion: { ...f.suggestion, needsReview: false },
                }
              : f
          );
          break;

        case 'approve_high_confidence':
          updatedFiles = updatedFiles.map((f) => {
            if (!f.suggestion) return f;
            const scores = Object.values(f.suggestion.confidenceScores);
            const avgConfidence =
              scores.reduce((a, b) => a + b, 0) / scores.length;
            if (avgConfidence > 90) {
              return {
                ...f,
                status: 'approved' as const,
                suggestion: { ...f.suggestion, needsReview: false },
              };
            }
            return f;
          });
          break;

        case 'apply_category':
          updatedFiles = updatedFiles.map((f) =>
            f.suggestion
              ? {
                  ...f,
                  suggestion: {
                    ...f.suggestion,
                    suggestedMetadata: {
                      ...f.suggestion.suggestedMetadata,
                      category: action.category,
                    },
                  },
                }
              : f
          );
          break;

        case 'apply_state':
          updatedFiles = updatedFiles.map((f) =>
            f.suggestion
              ? {
                  ...f,
                  suggestion: {
                    ...f.suggestion,
                    suggestedMetadata: {
                      ...f.suggestion.suggestedMetadata,
                      applicable_states: action.states,
                    },
                  },
                }
              : f
          );
          break;

        case 'apply_difficulty':
          updatedFiles = updatedFiles.map((f) =>
            f.suggestion
              ? {
                  ...f,
                  suggestion: {
                    ...f.suggestion,
                    suggestedMetadata: {
                      ...f.suggestion.suggestedMetadata,
                      difficulty: action.difficulty,
                    },
                  },
                }
              : f
          );
          break;

        case 'reject_all_duplicates':
          updatedFiles = updatedFiles.filter((f) => !f.error);
          break;
      }

      return { ...prev, files: updatedFiles };
    });
  }, []);

  /**
   * Upload all approved documents
   */
  const uploadAll = useCallback(async () => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    const approvedFiles = state.files.filter(
      (f) => f.status === 'approved' && f.suggestion
    );

    if (approvedFiles.length === 0) {
      toast.error('No approved files to upload');
      return;
    }

    setIsProcessing(true);
    setState((prev) => ({ ...prev, currentStep: 'uploading' }));

    try {
      const files = approvedFiles.map((f) => f.file);
      const suggestions = approvedFiles
        .map((f) => f.suggestion)
        .filter((s): s is AIMetadataSuggestion => s !== null);

      // Process uploads with progress tracking
      const result = await processBulkUpload(
        files,
        suggestions,
        user.id,
        (uploaded, total) => {
          setState((prev) => ({
            ...prev,
            progress: { ...prev.progress, uploaded, total },
          }));
        }
      );

      // Update state with results
      setState((prev) => ({
        ...prev,
        currentStep: 'complete',
        errors: [...prev.errors, ...result.errors],
      }));

      if (result.successCount > 0) {
        toast.success(
          `Successfully uploaded ${result.successCount} document(s)`
        );
      }

      if (result.errorCount > 0) {
        toast.error(`${result.errorCount} upload(s) failed`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Bulk upload failed');
    } finally {
      setIsProcessing(false);
    }
  }, [state.files, user]);

  /**
   * Reset the entire workflow
   */
  const reset = useCallback(() => {
    setState(initialState);
    setIsProcessing(false);
  }, []);

  /**
   * Select a file for detailed review
   */
  const selectFile = useCallback((index: number | null) => {
    setState((prev) => ({ ...prev, selectedFileIndex: index }));
  }, []);

  /**
   * Remove a file from the upload queue
   */
  const removeFile = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
      progress: {
        ...prev.progress,
        total: prev.progress.total - 1,
      },
    }));
  }, []);

  return {
    state,
    isProcessing,
    initializeUpload,
    analyzeFiles,
    updateSuggestion,
    approveSuggestion,
    applyBatchAction,
    uploadAll,
    reset,
    selectFile,
    removeFile,
  };
};
