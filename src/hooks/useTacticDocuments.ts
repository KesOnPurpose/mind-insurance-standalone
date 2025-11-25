// useTacticDocuments Hook
// Fetch documents linked to a specific tactic

import { useState, useEffect, useCallback } from 'react';
import { getTacticDocuments } from '@/services/tacticResourceService';
import type { TacticDocument } from '@/types/documents';

interface UseTacticDocumentsReturn {
  documents: TacticDocument[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useTacticDocuments = (tacticId: string | null): UseTacticDocumentsReturn => {
  const [documents, setDocuments] = useState<TacticDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!tacticId) {
      setDocuments([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await getTacticDocuments(tacticId);
      setDocuments(data);
    } catch (err) {
      setError(err as Error);
      console.error('Error in useTacticDocuments:', err);
    } finally {
      setIsLoading(false);
    }
  }, [tacticId]);

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
