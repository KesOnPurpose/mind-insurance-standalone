// useTacticKnowledge Hook
// Fetch knowledge chunks linked to a specific tactic

import { useState, useEffect, useCallback } from 'react';
import { getTacticKnowledge } from '@/services/tacticResourceService';
import type { KnowledgeChunk } from '@/types/knowledge';

interface UseTacticKnowledgeReturn {
  knowledge: KnowledgeChunk[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useTacticKnowledge = (tacticId: string | null): UseTacticKnowledgeReturn => {
  const [knowledge, setKnowledge] = useState<KnowledgeChunk[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!tacticId) {
      setKnowledge([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await getTacticKnowledge(tacticId);
      setKnowledge(data);
    } catch (err) {
      setError(err as Error);
      console.error('Error in useTacticKnowledge:', err);
    } finally {
      setIsLoading(false);
    }
  }, [tacticId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    knowledge,
    isLoading,
    error,
    refetch: fetchData,
  };
};
