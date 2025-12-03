import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useDocuments } from '../useDocuments';
import * as documentService from '@/services/documentService';
import type { GHDocument, DocumentFilters } from '@/types/documents';

// Mock the document service
vi.mock('@/services/documentService', () => ({
  fetchDocuments: vi.fn(),
}));

describe('useDocuments', () => {
  const mockDocuments: GHDocument[] = [
    {
      id: 1,
      document_name: 'Test Document 1',
      category: 'templates',
      difficulty: 'beginner',
      file_size_kb: 1024,
      mime_type: 'application/pdf',
      document_url: 'https://example.com/doc1.pdf',
      description: 'Test description 1',
      applicable_states: ['CA', 'TX'],
      ownership_model: ['single-home', 'portfolio'],
      download_count: 10,
      view_count: 50,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      created_by: 'admin-1',
    },
    {
      id: 2,
      document_name: 'Test Document 2',
      category: 'policies',
      difficulty: 'intermediate',
      file_size_kb: 2048,
      mime_type: 'application/pdf',
      document_url: 'https://example.com/doc2.pdf',
      description: 'Test description 2',
      applicable_states: ['NY', 'FL'],
      ownership_model: ['corporate'],
      download_count: 20,
      view_count: 100,
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
      created_by: 'admin-2',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Initial State', () => {
    it('should return initial state with loading true', () => {
      vi.mocked(documentService.fetchDocuments).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() => useDocuments());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.documents).toEqual([]);
      expect(result.current.error).toBe(null);
      expect(typeof result.current.refetch).toBe('function');
    });
  });

  describe('Fetching Documents', () => {
    it('should fetch documents successfully without filters', async () => {
      vi.mocked(documentService.fetchDocuments).mockResolvedValue(mockDocuments);

      const { result } = renderHook(() => useDocuments());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.documents).toEqual(mockDocuments);
      expect(result.current.error).toBe(null);
      expect(documentService.fetchDocuments).toHaveBeenCalledWith(undefined);
    });

    it('should fetch documents with filters', async () => {
      const filters: DocumentFilters = {
        category: 'templates',
        difficulty: 'beginner',
        states: ['CA'],
        ownershipModel: ['single-home'],
        searchQuery: 'test',
      };

      vi.mocked(documentService.fetchDocuments).mockResolvedValue([mockDocuments[0]]);

      const { result } = renderHook(() => useDocuments(filters));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.documents).toEqual([mockDocuments[0]]);
      expect(result.current.error).toBe(null);
      expect(documentService.fetchDocuments).toHaveBeenCalledWith(filters);
    });

    it('should handle fetch errors gracefully', async () => {
      const mockError = new Error('Network error');
      vi.mocked(documentService.fetchDocuments).mockRejectedValue(mockError);

      const { result } = renderHook(() => useDocuments());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.documents).toEqual([]);
      expect(result.current.error).toEqual(mockError);
    });

    it('should handle empty results', async () => {
      vi.mocked(documentService.fetchDocuments).mockResolvedValue([]);

      const { result } = renderHook(() => useDocuments());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.documents).toEqual([]);
      expect(result.current.error).toBe(null);
    });
  });

  describe('Refetch Functionality', () => {
    it('should refetch documents when refetch is called', async () => {
      vi.mocked(documentService.fetchDocuments).mockResolvedValue(mockDocuments);

      const { result } = renderHook(() => useDocuments());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(documentService.fetchDocuments).toHaveBeenCalledTimes(1);

      // Update mock for refetch
      const updatedDocuments = [...mockDocuments, {
        ...mockDocuments[0],
        id: 3,
        document_name: 'Test Document 3',
      }];
      vi.mocked(documentService.fetchDocuments).mockResolvedValue(updatedDocuments);

      await act(async () => {
        await result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.documents).toEqual(updatedDocuments);
      });

      expect(documentService.fetchDocuments).toHaveBeenCalledTimes(2);
    });

    it('should set loading state during refetch', async () => {
      vi.mocked(documentService.fetchDocuments).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockDocuments), 100))
      );

      const { result } = renderHook(() => useDocuments());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const refetchPromise = act(async () => {
        await result.current.refetch();
      });

      // Check loading state immediately after refetch starts
      expect(result.current.isLoading).toBe(true);

      await refetchPromise;

      expect(result.current.isLoading).toBe(false);
    });

    it('should handle refetch errors', async () => {
      vi.mocked(documentService.fetchDocuments).mockResolvedValue(mockDocuments);

      const { result } = renderHook(() => useDocuments());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const refetchError = new Error('Refetch failed');
      vi.mocked(documentService.fetchDocuments).mockRejectedValue(refetchError);

      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.error).toEqual(refetchError);
      expect(result.current.documents).toEqual([]); // Documents cleared on error
    });
  });

  describe('Filter Changes', () => {
    it('should refetch when filters change', async () => {
      const initialFilters: DocumentFilters = {
        category: 'templates',
      };

      vi.mocked(documentService.fetchDocuments).mockResolvedValue([mockDocuments[0]]);

      const { result, rerender } = renderHook(
        ({ filters }) => useDocuments(filters),
        { initialProps: { filters: initialFilters } }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(documentService.fetchDocuments).toHaveBeenCalledWith(initialFilters);
      expect(result.current.documents).toEqual([mockDocuments[0]]);

      // Change filters
      const newFilters: DocumentFilters = {
        category: 'policies',
      };

      vi.mocked(documentService.fetchDocuments).mockResolvedValue([mockDocuments[1]]);

      rerender({ filters: newFilters });

      await waitFor(() => {
        expect(result.current.documents).toEqual([mockDocuments[1]]);
      });

      expect(documentService.fetchDocuments).toHaveBeenCalledWith(newFilters);
    });

    it('should handle complex filter combinations', async () => {
      const complexFilters: DocumentFilters = {
        category: 'templates',
        difficulty: 'beginner',
        states: ['CA', 'TX', 'NY'],
        ownershipModel: ['single-home', 'portfolio', 'corporate'],
        searchQuery: 'comprehensive test query',
      };

      vi.mocked(documentService.fetchDocuments).mockResolvedValue(mockDocuments);

      const { result } = renderHook(() => useDocuments(complexFilters));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(documentService.fetchDocuments).toHaveBeenCalledWith(complexFilters);
      expect(result.current.documents).toEqual(mockDocuments);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null response from service', async () => {
      vi.mocked(documentService.fetchDocuments).mockResolvedValue(null as any);

      const { result } = renderHook(() => useDocuments());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.documents).toEqual([]);
      expect(result.current.error).toBe(null);
    });

    it('should handle undefined response from service', async () => {
      vi.mocked(documentService.fetchDocuments).mockResolvedValue(undefined as any);

      const { result } = renderHook(() => useDocuments());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.documents).toEqual([]);
      expect(result.current.error).toBe(null);
    });

    it('should handle malformed document data', async () => {
      const malformedData = [
        { id: 1 }, // Missing required fields
        null,
        undefined,
        { ...mockDocuments[0], id: 'invalid' }, // Invalid type
      ] as any;

      vi.mocked(documentService.fetchDocuments).mockResolvedValue(malformedData);

      const { result } = renderHook(() => useDocuments());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.documents).toEqual(malformedData);
      expect(result.current.error).toBe(null);
    });

    it('should handle rapid filter changes', async () => {
      vi.mocked(documentService.fetchDocuments).mockImplementation(
        (filters) => Promise.resolve(
          filters?.category === 'templates' ? [mockDocuments[0]] : [mockDocuments[1]]
        )
      );

      const { result, rerender } = renderHook(
        ({ filters }) => useDocuments(filters),
        { initialProps: { filters: { category: 'templates' } as DocumentFilters } }
      );

      // Rapid filter changes
      rerender({ filters: { category: 'policies' } as DocumentFilters });
      rerender({ filters: { category: 'templates' } as DocumentFilters });
      rerender({ filters: { category: 'policies' } as DocumentFilters });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should handle rapid changes gracefully
      expect(result.current.documents).toBeDefined();
      expect(result.current.error).toBe(null);
    });

    it('should handle very large document arrays', async () => {
      const largeDocumentArray = Array.from({ length: 10000 }, (_, i) => ({
        ...mockDocuments[0],
        id: i + 1,
        document_name: `Document ${i + 1}`,
      }));

      vi.mocked(documentService.fetchDocuments).mockResolvedValue(largeDocumentArray);

      const { result } = renderHook(() => useDocuments());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.documents).toHaveLength(10000);
      expect(result.current.error).toBe(null);
    });
  });
});