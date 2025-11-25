// useDocumentAnalytics Hook
// Fetch document analytics and KPI data

import { useState, useEffect, useCallback } from 'react';
import { fetchDocumentAnalytics } from '@/services/documentService';
import type { DocumentAnalytics } from '@/types/documents';

interface UseDocumentAnalyticsReturn {
  analytics: DocumentAnalytics | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useDocumentAnalytics = (): UseDocumentAnalyticsReturn => {
  const [analytics, setAnalytics] = useState<DocumentAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchDocumentAnalytics();
      setAnalytics(data);
    } catch (err) {
      setError(err as Error);
      console.error('Error in useDocumentAnalytics:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    analytics,
    isLoading,
    error,
    refetch: fetchData,
  };
};
