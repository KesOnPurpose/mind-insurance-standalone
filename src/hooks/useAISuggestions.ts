// useAISuggestions Hook
// Fetch AI-powered tactic suggestions for documents

import { useState, useEffect } from 'react';
import { fetchAvailableAISuggestions } from '@/services/documentService';
import type { AITacticSuggestionDisplay } from '@/types/documents';

interface UseAISuggestionsReturn {
  suggestions: AITacticSuggestionDisplay[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useAISuggestions = (
  documentId: number | null,
  existingTacticIds: string[],
  enabled: boolean = true
): UseAISuggestionsReturn => {
  const [suggestions, setSuggestions] = useState<AITacticSuggestionDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchSuggestions = async () => {
    if (!documentId || !enabled) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchAvailableAISuggestions(documentId, existingTacticIds, 10);
      setSuggestions(data);
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error('Error fetching AI suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, [documentId, enabled, existingTacticIds.join(',')]); // Re-fetch when existing links change

  return {
    suggestions,
    isLoading,
    error,
    refetch: fetchSuggestions,
  };
};
