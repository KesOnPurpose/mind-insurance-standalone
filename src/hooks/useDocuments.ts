// useDocuments Hook
// Fetch and manage documents with filters

import { useState, useEffect, useCallback } from 'react';
import { fetchDocuments } from '@/services/documentService';
import type { GHDocument, DocumentFilters } from '@/types/documents';

interface UseDocumentsReturn {
  documents: GHDocument[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useDocuments = (filters?: DocumentFilters): UseDocumentsReturn => {
  const [documents, setDocuments] = useState<GHDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchDocuments(filters);
      setDocuments(data);
    } catch (err) {
      setError(err as Error);
      console.error('Error in useDocuments:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    documents,
    isLoading,
    error,
    refetch: fetchData,
  };
};
