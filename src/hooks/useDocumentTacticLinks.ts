// useDocumentTacticLinks Hook
// Manage tactic links for documents

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  createTacticLink,
  updateTacticLink,
  deleteTacticLink,
  fetchTacticLinks,
} from '@/services/documentService';
import type { GHDocumentTacticLink, TacticLinkType } from '@/types/documents';
import { toast } from 'sonner';

interface UseDocumentTacticLinksReturn {
  createLink: (
    documentId: number,
    tacticId: string,
    linkType: TacticLinkType,
    displayOrder: number | null
  ) => Promise<GHDocumentTacticLink | null>;
  updateLink: (
    linkId: number,
    updates: Partial<GHDocumentTacticLink>
  ) => Promise<GHDocumentTacticLink | null>;
  deleteLink: (linkId: number) => Promise<boolean>;
  fetchLinks: (documentId: number) => Promise<GHDocumentTacticLink[]>;
  isLoading: boolean;
  error: Error | null;
}

export const useDocumentTacticLinks = (): UseDocumentTacticLinksReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  const handleCreateLink = useCallback(
    async (
      documentId: number,
      tacticId: string,
      linkType: TacticLinkType,
      displayOrder: number | null
    ): Promise<GHDocumentTacticLink | null> => {
      if (!user) {
        toast.error('You must be logged in');
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const link = await createTacticLink(
          documentId,
          tacticId,
          linkType,
          displayOrder,
          user.id
        );
        toast.success('Tactic link created successfully');
        return link;
      } catch (err) {
        const error = err as Error;
        setError(error);
        toast.error(`Failed to create link: ${error.message}`);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  const handleUpdateLink = useCallback(
    async (
      linkId: number,
      updates: Partial<GHDocumentTacticLink>
    ): Promise<GHDocumentTacticLink | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const link = await updateTacticLink(linkId, updates);
        toast.success('Tactic link updated successfully');
        return link;
      } catch (err) {
        const error = err as Error;
        setError(error);
        toast.error(`Failed to update link: ${error.message}`);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const handleDeleteLink = useCallback(async (linkId: number): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      await deleteTacticLink(linkId);
      toast.success('Tactic link deleted successfully');
      return true;
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast.error(`Failed to delete link: ${error.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleFetchLinks = useCallback(
    async (documentId: number): Promise<GHDocumentTacticLink[]> => {
      setIsLoading(true);
      setError(null);

      try {
        const links = await fetchTacticLinks(documentId);
        return links;
      } catch (err) {
        const error = err as Error;
        setError(error);
        console.error('Error fetching tactic links:', error);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    createLink: handleCreateLink,
    updateLink: handleUpdateLink,
    deleteLink: handleDeleteLink,
    fetchLinks: handleFetchLinks,
    isLoading,
    error,
  };
};
