// ============================================================================
// USE COMPLIANCE BINDER HOOK
// ============================================================================
// React hook for compliance binder state management with React Query
// for caching, optimistic updates, and real-time sync.
// ============================================================================

import { useCallback, useMemo } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
} from '@tanstack/react-query';
import {
  createBinder,
  getUserBinders,
  getBinderById,
  getBinderWithItems,
  updateBinder,
  deleteBinder,
  addItemToBinder,
  updateBinderItem,
  removeItemFromBinder,
  reorderBinderItems,
  toggleItemStar,
  getItemsBySection,
  searchBinderItems,
  duplicateBinder,
  type CreateBinderInput,
  type UpdateBinderInput,
  type AddItemInput,
  type UpdateItemInput,
} from '@/services/complianceBinderService';
import {
  getBinderShareLinks,
  getActiveShareLinks,
  createShareLink,
  deactivateShareLink,
  deleteShareLink,
  getShareLinkStats,
  type CreateShareLinkInput,
} from '@/services/shareLinksService';
import {
  uploadDocument,
  getBinderDocuments,
  deleteDocument,
  type UploadDocumentInput,
} from '@/services/documentUploadService';
import {
  exportBinderToPDF,
  printBinder,
  type PDFExportOptions,
} from '@/services/pdfExportService';
import type {
  ComplianceBinder,
  BinderItem,
  BinderDocument,
  BinderShareLink,
} from '@/types/compliance';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const binderKeys = {
  all: ['binders'] as const,
  lists: () => [...binderKeys.all, 'list'] as const,
  list: (filters: string) => [...binderKeys.lists(), filters] as const,
  details: () => [...binderKeys.all, 'detail'] as const,
  detail: (id: string) => [...binderKeys.details(), id] as const,
  items: (binderId: string) => [...binderKeys.detail(binderId), 'items'] as const,
  documents: (binderId: string) => [...binderKeys.detail(binderId), 'documents'] as const,
  shareLinks: (binderId: string) => [...binderKeys.detail(binderId), 'shareLinks'] as const,
  shareLinkStats: (binderId: string) => [...binderKeys.detail(binderId), 'shareLinkStats'] as const,
};

// ============================================================================
// TYPES
// ============================================================================

export interface UseBinderListOptions {
  enabled?: boolean;
}

export interface UseBinderOptions {
  binderId?: string;  // Optional - if not provided, hook returns empty state
  includeItems?: boolean;
  enabled?: boolean;
}

export interface UseBinderReturn {
  // Binder data
  binder: ComplianceBinder | null;
  items: BinderItem[];
  documents: BinderDocument[];
  shareLinks: BinderShareLink[];
  shareLinkStats: {
    total_links: number;
    active_links: number;
    expired_links: number;
    total_accesses: number;
    recent_accesses: number;
  } | null;

  // Loading states
  isLoading: boolean;
  isLoadingItems: boolean;
  isLoadingDocuments: boolean;
  isLoadingShareLinks: boolean;

  // Error states
  error: Error | null;

  // Binder mutations
  updateBinder: (input: UpdateBinderInput) => Promise<ComplianceBinder>;
  deleteBinder: () => Promise<void>;
  duplicateBinder: (newName?: string) => Promise<ComplianceBinder>;

  // Item mutations
  addItem: (input: Omit<AddItemInput, 'binder_id'>) => Promise<BinderItem>;
  updateItem: (itemId: string, input: UpdateItemInput) => Promise<BinderItem>;
  removeItem: (itemId: string) => Promise<void>;
  reorderItems: (itemIds: string[]) => Promise<void>;
  toggleStar: (itemId: string) => Promise<BinderItem>;

  // Document mutations
  uploadDocument: (input: Omit<UploadDocumentInput, 'binder_id'>) => Promise<BinderDocument>;
  deleteDocument: (documentId: string) => Promise<void>;

  // Share link mutations
  createShareLink: (input: Omit<CreateShareLinkInput, 'binder_id'>) => Promise<BinderShareLink>;
  deactivateShareLink: (linkId: string) => Promise<BinderShareLink>;
  deleteShareLink: (linkId: string) => Promise<void>;

  // PDF export
  exportPDF: (options?: PDFExportOptions) => Promise<{ blob: Blob; filename: string }>;
  printBinder: (options?: PDFExportOptions) => Promise<void>;

  // Refetch
  refetch: () => void;
  refetchItems: () => void;
  refetchDocuments: () => void;
  refetchShareLinks: () => void;
}

// ============================================================================
// HOOK: Use Binder List
// ============================================================================

export function useBinderList(options: UseBinderListOptions = {}) {
  const { enabled = true } = options;
  const queryClient = useQueryClient();

  // Fetch all binders
  const {
    data: binders = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: binderKeys.lists(),
    queryFn: getUserBinders,
    enabled,
    staleTime: 60000, // 1 minute
  });

  // Create binder mutation
  const createMutation = useMutation({
    mutationFn: createBinder,
    onSuccess: (newBinder) => {
      queryClient.invalidateQueries({ queryKey: binderKeys.lists() });
    },
  });

  // Delete binder mutation
  const deleteMutation = useMutation({
    mutationFn: deleteBinder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: binderKeys.lists() });
    },
  });

  return {
    binders,
    isLoading,
    error: error as Error | null,
    refetch,
    createBinder: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    deleteBinder: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}

// ============================================================================
// HOOK: Use Single Binder
// ============================================================================

export function useBinder(options: UseBinderOptions = {}): UseBinderReturn {
  const { binderId, includeItems = true, enabled = true } = options;
  const hasBinderId = Boolean(binderId);
  const queryClient = useQueryClient();

  // ========== Queries ==========

  // Binder with items
  const {
    data: binderData,
    isLoading,
    error,
    refetch: refetchBinder,
  } = useQuery({
    queryKey: binderKeys.detail(binderId || 'none'),
    queryFn: () => binderId ? (includeItems ? getBinderWithItems(binderId) : getBinderById(binderId)) : Promise.resolve(null),
    enabled: enabled && hasBinderId,
    staleTime: 30000,
  });

  // Documents
  const {
    data: documents = [],
    isLoading: isLoadingDocuments,
    refetch: refetchDocuments,
  } = useQuery({
    queryKey: binderKeys.documents(binderId || 'none'),
    queryFn: () => binderId ? getBinderDocuments(binderId) : Promise.resolve([]),
    enabled: enabled && hasBinderId,
    staleTime: 60000,
  });

  // Share links
  const {
    data: shareLinks = [],
    isLoading: isLoadingShareLinks,
    refetch: refetchShareLinks,
  } = useQuery({
    queryKey: binderKeys.shareLinks(binderId || 'none'),
    queryFn: () => binderId ? getBinderShareLinks(binderId) : Promise.resolve([]),
    enabled: enabled && hasBinderId,
    staleTime: 60000,
  });

  // Share link stats
  const { data: shareLinkStats = null } = useQuery({
    queryKey: binderKeys.shareLinkStats(binderId || 'none'),
    queryFn: () => binderId ? getShareLinkStats(binderId) : Promise.resolve(null),
    enabled: enabled && hasBinderId,
    staleTime: 60000,
  });

  // ========== Derived data ==========
  const binder = useMemo(() => {
    if (!binderData) return null;
    return 'binder' in binderData ? binderData.binder : binderData;
  }, [binderData]);

  const items = useMemo(() => {
    if (!binderData || !('items' in binderData)) return [];
    return binderData.items;
  }, [binderData]);

  // ========== Binder Mutations ==========

  const updateBinderMutation = useMutation({
    mutationFn: (input: UpdateBinderInput) => updateBinder(binderId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: binderKeys.detail(binderId) });
      queryClient.invalidateQueries({ queryKey: binderKeys.lists() });
    },
  });

  const deleteBinderMutation = useMutation({
    mutationFn: () => deleteBinder(binderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: binderKeys.lists() });
    },
  });

  const duplicateBinderMutation = useMutation({
    mutationFn: (newName?: string) => duplicateBinder(binderId, newName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: binderKeys.lists() });
    },
  });

  // ========== Item Mutations ==========

  const addItemMutation = useMutation({
    mutationFn: (input: Omit<AddItemInput, 'binder_id'>) =>
      addItemToBinder({ ...input, binder_id: binderId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: binderKeys.detail(binderId) });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ itemId, input }: { itemId: string; input: UpdateItemInput }) =>
      updateBinderItem(itemId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: binderKeys.detail(binderId) });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: removeItemFromBinder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: binderKeys.detail(binderId) });
    },
  });

  const reorderItemsMutation = useMutation({
    mutationFn: (itemIds: string[]) => reorderBinderItems(binderId, itemIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: binderKeys.detail(binderId) });
    },
  });

  const toggleStarMutation = useMutation({
    mutationFn: toggleItemStar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: binderKeys.detail(binderId) });
    },
  });

  // ========== Document Mutations ==========

  const uploadDocumentMutation = useMutation({
    mutationFn: (input: Omit<UploadDocumentInput, 'binder_id'>) =>
      uploadDocument({ ...input, binder_id: binderId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: binderKeys.documents(binderId) });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: binderKeys.documents(binderId) });
    },
  });

  // ========== Share Link Mutations ==========

  const createShareLinkMutation = useMutation({
    mutationFn: (input: Omit<CreateShareLinkInput, 'binder_id'>) =>
      createShareLink({ ...input, binder_id: binderId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: binderKeys.shareLinks(binderId) });
      queryClient.invalidateQueries({ queryKey: binderKeys.shareLinkStats(binderId) });
    },
  });

  const deactivateShareLinkMutation = useMutation({
    mutationFn: deactivateShareLink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: binderKeys.shareLinks(binderId) });
      queryClient.invalidateQueries({ queryKey: binderKeys.shareLinkStats(binderId) });
    },
  });

  const deleteShareLinkMutation = useMutation({
    mutationFn: deleteShareLink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: binderKeys.shareLinks(binderId) });
      queryClient.invalidateQueries({ queryKey: binderKeys.shareLinkStats(binderId) });
    },
  });

  // ========== PDF Export ==========

  const exportPDF = useCallback(
    async (pdfOptions?: PDFExportOptions) => {
      const result = await exportBinderToPDF(binderId, pdfOptions);
      return { blob: result.blob, filename: result.filename };
    },
    [binderId]
  );

  const printBinderFn = useCallback(
    async (pdfOptions?: PDFExportOptions) => {
      await printBinder(binderId, pdfOptions);
    },
    [binderId]
  );

  // ========== Refetch helpers ==========

  const refetch = useCallback(() => {
    refetchBinder();
  }, [refetchBinder]);

  const refetchItems = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: binderKeys.detail(binderId) });
  }, [queryClient, binderId]);

  // ========== Return ==========

  return {
    // Data
    binder,
    items,
    documents,
    shareLinks,
    shareLinkStats,

    // Loading
    isLoading,
    isLoadingItems: isLoading,
    isLoadingDocuments,
    isLoadingShareLinks,

    // Errors
    error: error as Error | null,

    // Binder mutations
    updateBinder: updateBinderMutation.mutateAsync,
    deleteBinder: deleteBinderMutation.mutateAsync,
    duplicateBinder: duplicateBinderMutation.mutateAsync,

    // Item mutations
    addItem: addItemMutation.mutateAsync,
    updateItem: (itemId: string, input: UpdateItemInput) =>
      updateItemMutation.mutateAsync({ itemId, input }),
    removeItem: removeItemMutation.mutateAsync,
    reorderItems: reorderItemsMutation.mutateAsync,
    toggleStar: toggleStarMutation.mutateAsync,

    // Document mutations
    uploadDocument: uploadDocumentMutation.mutateAsync,
    deleteDocument: deleteDocumentMutation.mutateAsync,

    // Share link mutations
    createShareLink: createShareLinkMutation.mutateAsync,
    deactivateShareLink: deactivateShareLinkMutation.mutateAsync,
    deleteShareLink: deleteShareLinkMutation.mutateAsync,

    // PDF
    exportPDF,
    printBinder: printBinderFn,

    // Refetch
    refetch,
    refetchItems,
    refetchDocuments,
    refetchShareLinks,
  };
}

// ============================================================================
// HOOK: Use Binder Items (Filtered)
// ============================================================================

export function useBinderItems(binderId: string, sectionType?: string) {
  const queryClient = useQueryClient();

  const { data: items = [], isLoading, error } = useQuery({
    queryKey: [...binderKeys.items(binderId), sectionType],
    queryFn: () =>
      sectionType
        ? getItemsBySection(binderId, sectionType)
        : getBinderWithItems(binderId).then((data) => data?.items || []),
    enabled: !!binderId,
    staleTime: 30000,
  });

  const addItemMutation = useMutation({
    mutationFn: (input: Omit<AddItemInput, 'binder_id'>) =>
      addItemToBinder({ ...input, binder_id: binderId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: binderKeys.detail(binderId) });
      queryClient.invalidateQueries({ queryKey: binderKeys.items(binderId) });
    },
  });

  return {
    items,
    isLoading,
    error: error as Error | null,
    addItem: addItemMutation.mutateAsync,
    isAdding: addItemMutation.isPending,
  };
}

// ============================================================================
// HOOK: Use Binder Search
// ============================================================================

export function useBinderSearch(binderId: string, searchQuery: string) {
  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ['binder-search', binderId, searchQuery],
    queryFn: () => searchBinderItems(binderId, searchQuery),
    enabled: !!binderId && searchQuery.trim().length > 0,
    staleTime: 30000,
  });

  return {
    items,
    isLoading,
    error: error as Error | null,
    hasResults: items.length > 0,
    resultCount: items.length,
  };
}

// ============================================================================
// HOOK: Use Save to Binder (From Search Results)
// ============================================================================

export function useSaveToBinder() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: addItemToBinder,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: binderKeys.detail(variables.binder_id),
      });
      queryClient.invalidateQueries({ queryKey: binderKeys.lists() });
    },
  });

  return {
    saveToBinder: mutation.mutateAsync,
    isSaving: mutation.isPending,
    error: mutation.error as Error | null,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

// Alias for backward compatibility (some files import as useComplianceBinder)
export const useComplianceBinder = useBinder;

export default useBinder;
