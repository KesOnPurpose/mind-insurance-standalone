import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBulkUpload } from '../useBulkUpload';
import * as metadataExtractor from '@/services/metadataExtractor';
import * as bulkDocumentService from '@/services/bulkDocumentService';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('@/services/metadataExtractor', () => ({
  analyzeBatchDocuments: vi.fn(),
}));

vi.mock('@/services/bulkDocumentService', () => ({
  processBulkUpload: vi.fn(),
  checkForDuplicates: vi.fn(),
  cleanDocumentFilename: vi.fn(),
  validateMetadata: vi.fn(),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useBulkUpload', () => {
  const mockFiles = [
    new File(['content1'], 'document1.pdf', { type: 'application/pdf' }),
    new File(['content2'], 'document2.pdf', { type: 'application/pdf' }),
    new File(['content3'], 'document3.pdf', { type: 'application/pdf' }),
  ];

  const mockSuggestions = [
    {
      filename: 'document1.pdf',
      suggestedMetadata: {
        document_name: 'Document 1',
        category: 'templates' as const,
        difficulty: 'beginner' as const,
        description: 'Test document 1',
        applicable_states: ['CA', 'TX'],
        ownership_model: ['single-home'],
      },
      confidenceScores: {
        category: 95,
        difficulty: 90,
        states: 85,
      },
      needsReview: false,
    },
    {
      filename: 'document2.pdf',
      suggestedMetadata: {
        document_name: 'Document 2',
        category: 'policies' as const,
        difficulty: 'intermediate' as const,
        description: 'Test document 2',
        applicable_states: ['NY'],
        ownership_model: ['portfolio'],
      },
      confidenceScores: {
        category: 88,
        difficulty: 92,
        states: 80,
      },
      needsReview: true,
    },
    {
      filename: 'document3.pdf',
      suggestedMetadata: {
        document_name: 'Document 3',
        category: 'forms' as const,
        difficulty: 'advanced' as const,
        description: 'Test document 3',
        applicable_states: ['FL', 'GA'],
        ownership_model: ['corporate'],
      },
      confidenceScores: {
        category: 98,
        difficulty: 95,
        states: 93,
      },
      needsReview: false,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should return initial state correctly', () => {
      const { result } = renderHook(() => useBulkUpload());

      expect(result.current.state).toEqual({
        files: [],
        currentStep: 'upload',
        progress: {
          analyzed: 0,
          total: 0,
          uploaded: 0,
        },
        errors: [],
        selectedFileIndex: null,
      });
      expect(result.current.isProcessing).toBe(false);
    });
  });

  describe('Initialize Upload', () => {
    it('should initialize upload with files', async () => {
      vi.mocked(bulkDocumentService.cleanDocumentFilename).mockImplementation((filename) => ({
        cleaned: filename.replace(/[^a-zA-Z0-9.-]/g, '_'),
        originalChars: 0,
        cleanedChars: 0,
        removedChars: [],
      }));

      vi.mocked(bulkDocumentService.checkForDuplicates).mockResolvedValue({
        isDuplicate: false,
        reason: null,
      });

      const { result } = renderHook(() => useBulkUpload());

      await act(async () => {
        await result.current.initializeUpload(mockFiles);
      });

      expect(result.current.state.files).toHaveLength(3);
      expect(result.current.state.currentStep).toBe('upload');
      expect(result.current.state.progress.total).toBe(3);
      expect(result.current.state.files[0].status).toBe('pending');
      expect(result.current.state.files[0].cleanedFilename).toBe('document1.pdf');
    });

    it('should detect duplicates during initialization', async () => {
      vi.mocked(bulkDocumentService.cleanDocumentFilename).mockImplementation((filename) => ({
        cleaned: filename,
        originalChars: 0,
        cleanedChars: 0,
        removedChars: [],
      }));

      vi.mocked(bulkDocumentService.checkForDuplicates).mockImplementation((filename) => {
        if (filename === 'document2.pdf') {
          return Promise.resolve({
            isDuplicate: true,
            reason: 'Document already exists in database',
          });
        }
        return Promise.resolve({ isDuplicate: false, reason: null });
      });

      const { result } = renderHook(() => useBulkUpload());

      await act(async () => {
        await result.current.initializeUpload(mockFiles);
      });

      expect(result.current.state.files[1].error).toBe('Document already exists in database');
      expect(result.current.state.files[0].error).toBe(null);
      expect(result.current.state.files[2].error).toBe(null);
    });
  });

  describe('Analyze Files', () => {
    it('should analyze files successfully', async () => {
      vi.mocked(bulkDocumentService.cleanDocumentFilename).mockImplementation((filename) => ({
        cleaned: filename,
        originalChars: 0,
        cleanedChars: 0,
        removedChars: [],
      }));

      vi.mocked(bulkDocumentService.checkForDuplicates).mockResolvedValue({
        isDuplicate: false,
        reason: null,
      });

      vi.mocked(metadataExtractor.analyzeBatchDocuments).mockImplementation(
        async (files, batchSize, progressCallback) => {
          progressCallback?.(files.length, files.length);
          return mockSuggestions;
        }
      );

      const { result } = renderHook(() => useBulkUpload());

      await act(async () => {
        await result.current.initializeUpload(mockFiles);
      });

      await act(async () => {
        await result.current.analyzeFiles();
      });

      expect(result.current.state.currentStep).toBe('reviewing');
      expect(result.current.state.files[0].status).toBe('analyzed');
      expect(result.current.state.files[0].suggestion).toEqual(mockSuggestions[0]);
      expect(result.current.state.progress.analyzed).toBe(3);
      expect(toast.success).toHaveBeenCalledWith('Analyzed 3 documents successfully');
    });

    it('should handle analysis errors', async () => {
      vi.mocked(bulkDocumentService.cleanDocumentFilename).mockImplementation((filename) => ({
        cleaned: filename,
        originalChars: 0,
        cleanedChars: 0,
        removedChars: [],
      }));

      vi.mocked(bulkDocumentService.checkForDuplicates).mockResolvedValue({
        isDuplicate: false,
        reason: null,
      });

      const analysisError = new Error('AI analysis failed');
      vi.mocked(metadataExtractor.analyzeBatchDocuments).mockRejectedValue(analysisError);

      const { result } = renderHook(() => useBulkUpload());

      await act(async () => {
        await result.current.initializeUpload(mockFiles);
      });

      await act(async () => {
        await result.current.analyzeFiles();
      });

      expect(result.current.state.errors).toHaveLength(1);
      expect(result.current.state.errors[0].errorType).toBe('analysis');
      expect(result.current.state.errors[0].message).toBe('AI analysis failed');
      expect(toast.error).toHaveBeenCalledWith('Failed to analyze documents');
    });
  });

  describe('Update Suggestion', () => {
    it('should update suggestion for specific file', async () => {
      vi.mocked(bulkDocumentService.cleanDocumentFilename).mockImplementation((filename) => ({
        cleaned: filename,
        originalChars: 0,
        cleanedChars: 0,
        removedChars: [],
      }));

      vi.mocked(bulkDocumentService.checkForDuplicates).mockResolvedValue({
        isDuplicate: false,
        reason: null,
      });

      vi.mocked(metadataExtractor.analyzeBatchDocuments).mockResolvedValue(mockSuggestions);

      const { result } = renderHook(() => useBulkUpload());

      await act(async () => {
        await result.current.initializeUpload(mockFiles);
        await result.current.analyzeFiles();
      });

      act(() => {
        result.current.updateSuggestion(0, {
          category: 'policies',
          difficulty: 'intermediate',
        });
      });

      expect(result.current.state.files[0].suggestion?.suggestedMetadata.category).toBe('policies');
      expect(result.current.state.files[0].suggestion?.suggestedMetadata.difficulty).toBe('intermediate');
      expect(result.current.state.files[0].suggestion?.needsReview).toBe(false);
    });
  });

  describe('Approve Suggestion', () => {
    it('should approve suggestion for specific file', async () => {
      vi.mocked(bulkDocumentService.cleanDocumentFilename).mockImplementation((filename) => ({
        cleaned: filename,
        originalChars: 0,
        cleanedChars: 0,
        removedChars: [],
      }));

      vi.mocked(bulkDocumentService.checkForDuplicates).mockResolvedValue({
        isDuplicate: false,
        reason: null,
      });

      vi.mocked(metadataExtractor.analyzeBatchDocuments).mockResolvedValue(mockSuggestions);

      const { result } = renderHook(() => useBulkUpload());

      await act(async () => {
        await result.current.initializeUpload(mockFiles);
        await result.current.analyzeFiles();
      });

      act(() => {
        result.current.approveSuggestion(1);
      });

      expect(result.current.state.files[1].status).toBe('approved');
      expect(result.current.state.files[1].suggestion?.needsReview).toBe(false);
    });
  });

  describe('Batch Actions', () => {
    beforeEach(async () => {
      vi.mocked(bulkDocumentService.cleanDocumentFilename).mockImplementation((filename) => ({
        cleaned: filename,
        originalChars: 0,
        cleanedChars: 0,
        removedChars: [],
      }));

      vi.mocked(bulkDocumentService.checkForDuplicates).mockResolvedValue({
        isDuplicate: false,
        reason: null,
      });

      vi.mocked(metadataExtractor.analyzeBatchDocuments).mockResolvedValue(mockSuggestions);
    });

    it('should approve all files', async () => {
      const { result } = renderHook(() => useBulkUpload());

      await act(async () => {
        await result.current.initializeUpload(mockFiles);
        await result.current.analyzeFiles();
      });

      act(() => {
        result.current.applyBatchAction({ type: 'approve_all' });
      });

      result.current.state.files.forEach(file => {
        expect(file.status).toBe('approved');
        expect(file.suggestion?.needsReview).toBe(false);
      });
    });

    it('should approve high confidence files only', async () => {
      const { result } = renderHook(() => useBulkUpload());

      await act(async () => {
        await result.current.initializeUpload(mockFiles);
        await result.current.analyzeFiles();
      });

      act(() => {
        result.current.applyBatchAction({ type: 'approve_high_confidence' });
      });

      // Files 0 and 2 have high confidence (>90 average)
      expect(result.current.state.files[0].status).toBe('approved');
      expect(result.current.state.files[1].status).toBe('analyzed'); // Lower confidence
      expect(result.current.state.files[2].status).toBe('approved');
    });

    it('should apply category to all files', async () => {
      const { result } = renderHook(() => useBulkUpload());

      await act(async () => {
        await result.current.initializeUpload(mockFiles);
        await result.current.analyzeFiles();
      });

      act(() => {
        result.current.applyBatchAction({
          type: 'apply_category',
          category: 'training'
        });
      });

      result.current.state.files.forEach(file => {
        expect(file.suggestion?.suggestedMetadata.category).toBe('training');
      });
    });

    it('should apply states to all files', async () => {
      const { result } = renderHook(() => useBulkUpload());

      await act(async () => {
        await result.current.initializeUpload(mockFiles);
        await result.current.analyzeFiles();
      });

      const newStates = ['CA', 'TX', 'NY'];
      act(() => {
        result.current.applyBatchAction({
          type: 'apply_state',
          states: newStates
        });
      });

      result.current.state.files.forEach(file => {
        expect(file.suggestion?.suggestedMetadata.applicable_states).toEqual(newStates);
      });
    });

    it('should reject all duplicates', async () => {
      // Set up one file as duplicate
      vi.mocked(bulkDocumentService.checkForDuplicates).mockImplementation((filename) => {
        if (filename === 'document2.pdf') {
          return Promise.resolve({
            isDuplicate: true,
            reason: 'Duplicate detected',
          });
        }
        return Promise.resolve({ isDuplicate: false, reason: null });
      });

      const { result } = renderHook(() => useBulkUpload());

      await act(async () => {
        await result.current.initializeUpload(mockFiles);
        await result.current.analyzeFiles();
      });

      act(() => {
        result.current.applyBatchAction({ type: 'reject_all_duplicates' });
      });

      expect(result.current.state.files).toHaveLength(2);
      expect(result.current.state.files.find(f => f.file.name === 'document2.pdf')).toBeUndefined();
    });
  });

  describe('Upload All', () => {
    it('should upload all approved documents successfully', async () => {
      vi.mocked(bulkDocumentService.cleanDocumentFilename).mockImplementation((filename) => ({
        cleaned: filename,
        originalChars: 0,
        cleanedChars: 0,
        removedChars: [],
      }));

      vi.mocked(bulkDocumentService.checkForDuplicates).mockResolvedValue({
        isDuplicate: false,
        reason: null,
      });

      vi.mocked(metadataExtractor.analyzeBatchDocuments).mockResolvedValue(mockSuggestions);

      vi.mocked(bulkDocumentService.processBulkUpload).mockImplementation(
        async (files, suggestions, userId, progressCallback) => {
          progressCallback?.(files.length, files.length);
          return {
            successCount: files.length,
            errorCount: 0,
            errors: [],
          };
        }
      );

      const { result } = renderHook(() => useBulkUpload());

      await act(async () => {
        await result.current.initializeUpload(mockFiles);
        await result.current.analyzeFiles();
      });

      act(() => {
        result.current.applyBatchAction({ type: 'approve_all' });
      });

      await act(async () => {
        await result.current.uploadAll();
      });

      expect(result.current.state.currentStep).toBe('complete');
      expect(result.current.state.progress.uploaded).toBe(3);
      expect(toast.success).toHaveBeenCalledWith('Successfully uploaded 3 document(s)');
    });

    it('should handle partial upload failures', async () => {
      vi.mocked(bulkDocumentService.cleanDocumentFilename).mockImplementation((filename) => ({
        cleaned: filename,
        originalChars: 0,
        cleanedChars: 0,
        removedChars: [],
      }));

      vi.mocked(bulkDocumentService.checkForDuplicates).mockResolvedValue({
        isDuplicate: false,
        reason: null,
      });

      vi.mocked(metadataExtractor.analyzeBatchDocuments).mockResolvedValue(mockSuggestions);

      vi.mocked(bulkDocumentService.processBulkUpload).mockResolvedValue({
        successCount: 2,
        errorCount: 1,
        errors: [{
          filename: 'document3.pdf',
          errorType: 'upload',
          message: 'Network error',
          timestamp: new Date().toISOString(),
          recoverable: true,
        }],
      });

      const { result } = renderHook(() => useBulkUpload());

      await act(async () => {
        await result.current.initializeUpload(mockFiles);
        await result.current.analyzeFiles();
      });

      act(() => {
        result.current.applyBatchAction({ type: 'approve_all' });
      });

      await act(async () => {
        await result.current.uploadAll();
      });

      expect(result.current.state.errors).toHaveLength(1);
      expect(toast.success).toHaveBeenCalledWith('Successfully uploaded 2 document(s)');
      expect(toast.error).toHaveBeenCalledWith('1 upload(s) failed');
    });

    it('should handle no approved files', async () => {
      const { result } = renderHook(() => useBulkUpload());

      await act(async () => {
        await result.current.initializeUpload(mockFiles);
      });

      await act(async () => {
        await result.current.uploadAll();
      });

      expect(toast.error).toHaveBeenCalledWith('No approved files to upload');
    });
  });

  describe('File Management', () => {
    it('should select file for review', async () => {
      const { result } = renderHook(() => useBulkUpload());

      await act(async () => {
        await result.current.initializeUpload(mockFiles);
      });

      act(() => {
        result.current.selectFile(1);
      });

      expect(result.current.state.selectedFileIndex).toBe(1);

      act(() => {
        result.current.selectFile(null);
      });

      expect(result.current.state.selectedFileIndex).toBe(null);
    });

    it('should remove file from queue', async () => {
      vi.mocked(bulkDocumentService.cleanDocumentFilename).mockImplementation((filename) => ({
        cleaned: filename,
        originalChars: 0,
        cleanedChars: 0,
        removedChars: [],
      }));

      vi.mocked(bulkDocumentService.checkForDuplicates).mockResolvedValue({
        isDuplicate: false,
        reason: null,
      });

      const { result } = renderHook(() => useBulkUpload());

      await act(async () => {
        await result.current.initializeUpload(mockFiles);
      });

      act(() => {
        result.current.removeFile(1);
      });

      expect(result.current.state.files).toHaveLength(2);
      expect(result.current.state.files[0].file.name).toBe('document1.pdf');
      expect(result.current.state.files[1].file.name).toBe('document3.pdf');
      expect(result.current.state.progress.total).toBe(2);
    });

    it('should reset entire workflow', async () => {
      const { result } = renderHook(() => useBulkUpload());

      await act(async () => {
        await result.current.initializeUpload(mockFiles);
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.state).toEqual({
        files: [],
        currentStep: 'upload',
        progress: {
          analyzed: 0,
          total: 0,
          uploaded: 0,
        },
        errors: [],
        selectedFileIndex: null,
      });
      expect(result.current.isProcessing).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty file list', async () => {
      const { result } = renderHook(() => useBulkUpload());

      await act(async () => {
        await result.current.initializeUpload([]);
      });

      expect(result.current.state.files).toHaveLength(0);
      expect(result.current.state.progress.total).toBe(0);

      await act(async () => {
        await result.current.analyzeFiles();
      });

      // Should not crash with empty files
      expect(result.current.state.currentStep).toBe('upload');
    });

    it('should handle very large file batches', async () => {
      const largeFileList = Array.from({ length: 100 }, (_, i) =>
        new File([`content${i}`], `document${i}.pdf`, { type: 'application/pdf' })
      );

      vi.mocked(bulkDocumentService.cleanDocumentFilename).mockImplementation((filename) => ({
        cleaned: filename,
        originalChars: 0,
        cleanedChars: 0,
        removedChars: [],
      }));

      vi.mocked(bulkDocumentService.checkForDuplicates).mockResolvedValue({
        isDuplicate: false,
        reason: null,
      });

      const { result } = renderHook(() => useBulkUpload());

      await act(async () => {
        await result.current.initializeUpload(largeFileList);
      });

      expect(result.current.state.files).toHaveLength(100);
      expect(result.current.state.progress.total).toBe(100);
    });
  });
});