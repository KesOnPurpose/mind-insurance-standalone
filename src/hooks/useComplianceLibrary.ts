// ============================================================================
// USE COMPLIANCE LIBRARY HOOK
// ============================================================================
// React hook for managing State Compliance Library state and operations.
// Provides browsing, searching, and bookmarking functionality.
// ============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  getLibraryStates,
  getLibraryItemsByState,
  getLibraryItemsByCategory,
  getLibraryItem,
  searchLibrary,
  getFeaturedItems,
  getUserBookmarks,
  addBookmark,
  removeBookmark,
  saveLibraryItemToBinder,
  getLibraryStats,
} from '@/services/complianceLibraryService';
import type {
  StateCode,
  LibraryItem,
  LibraryBookmark,
  LibraryFilters,
  LibraryStateOverview,
  LibraryCategoryType,
} from '@/types/compliance';

// ============================================================================
// TYPES
// ============================================================================

interface UseComplianceLibraryOptions {
  initialState?: StateCode;
  initialCategory?: LibraryCategoryType;
  autoLoadStates?: boolean;
}

interface UseComplianceLibraryReturn {
  // State overview
  states: LibraryStateOverview[];
  statesLoading: boolean;
  statesError: Error | null;

  // Selected state and category
  selectedState: StateCode | null;
  selectedCategory: LibraryCategoryType | null;
  setSelectedState: (state: StateCode | null) => void;
  setSelectedCategory: (category: LibraryCategoryType | null) => void;

  // Library items
  items: LibraryItem[];
  itemsLoading: boolean;
  itemsError: Error | null;
  hasMore: boolean;
  loadMore: () => void;
  totalCount: number;

  // Featured items
  featuredItems: LibraryItem[];
  featuredLoading: boolean;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: LibraryItem[];
  searchLoading: boolean;
  isSearching: boolean;
  clearSearch: () => void;

  // Single item
  getItem: (id: string) => Promise<LibraryItem | null>;
  currentItem: LibraryItem | null;
  setCurrentItem: (item: LibraryItem | null) => void;

  // Bookmarks
  bookmarks: LibraryBookmark[];
  bookmarksLoading: boolean;
  addToBookmarks: (itemId: string, notes?: string) => Promise<void>;
  removeFromBookmarks: (bookmarkId: string) => Promise<void>;
  isBookmarked: (itemId: string) => boolean;

  // Save to binder
  saveToBinder: (itemId: string, binderId: string, notes?: string) => Promise<void>;
  isSaving: boolean;

  // Statistics
  stats: {
    total_items: number;
    states_covered: number;
    categories_count: Record<LibraryCategoryType, number>;
  } | null;

  // Refresh
  refreshStates: () => void;
  refreshItems: () => void;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useComplianceLibrary(
  options: UseComplianceLibraryOptions = {}
): UseComplianceLibraryReturn {
  const { initialState, initialCategory, autoLoadStates = true } = options;

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Local state
  const [selectedState, setSelectedState] = useState<StateCode | null>(initialState || null);
  const [selectedCategory, setSelectedCategory] = useState<LibraryCategoryType | null>(
    initialCategory || null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [currentItem, setCurrentItem] = useState<LibraryItem | null>(null);
  const [offset, setOffset] = useState(0);
  const [allItems, setAllItems] = useState<LibraryItem[]>([]);

  const ITEMS_PER_PAGE = 20;

  // ============================================================================
  // QUERIES
  // ============================================================================

  // Fetch all states
  const {
    data: states = [],
    isLoading: statesLoading,
    error: statesError,
    refetch: refreshStates,
  } = useQuery({
    queryKey: ['library-states'],
    queryFn: getLibraryStates,
    enabled: autoLoadStates,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch items for selected state/category
  const {
    data: itemsData,
    isLoading: itemsLoading,
    error: itemsError,
    refetch: refreshItems,
  } = useQuery({
    queryKey: ['library-items', selectedState, selectedCategory, offset],
    queryFn: async () => {
      if (!selectedState) return { items: [], total_count: 0, has_more: false };

      if (selectedCategory) {
        return getLibraryItemsByCategory(selectedCategory, selectedState, ITEMS_PER_PAGE, offset);
      }

      return getLibraryItemsByState(selectedState, undefined, ITEMS_PER_PAGE, offset);
    },
    enabled: !!selectedState,
    staleTime: 2 * 60 * 1000,
  });

  // Accumulate items for infinite scroll
  useEffect(() => {
    if (itemsData?.items) {
      if (offset === 0) {
        setAllItems(itemsData.items);
      } else {
        setAllItems(prev => [...prev, ...itemsData.items]);
      }
    }
  }, [itemsData, offset]);

  // Reset when state/category changes
  useEffect(() => {
    setOffset(0);
    setAllItems([]);
  }, [selectedState, selectedCategory]);

  // Fetch featured items for selected state
  const {
    data: featuredItems = [],
    isLoading: featuredLoading,
  } = useQuery({
    queryKey: ['library-featured', selectedState],
    queryFn: () => (selectedState ? getFeaturedItems(selectedState, 6) : Promise.resolve([])),
    enabled: !!selectedState,
    staleTime: 5 * 60 * 1000,
  });

  // Search query
  const {
    data: searchData,
    isLoading: searchLoading,
  } = useQuery({
    queryKey: ['library-search', searchQuery, selectedState, selectedCategory],
    queryFn: () =>
      searchLibrary(searchQuery, {
        state_code: selectedState || undefined,
        category_type: selectedCategory || undefined,
      }),
    enabled: searchQuery.length >= 2,
    staleTime: 30 * 1000,
  });

  // Bookmarks
  const {
    data: bookmarks = [],
    isLoading: bookmarksLoading,
    refetch: refreshBookmarks,
  } = useQuery({
    queryKey: ['library-bookmarks'],
    queryFn: getUserBookmarks,
    staleTime: 60 * 1000,
  });

  // Statistics
  const { data: stats } = useQuery({
    queryKey: ['library-stats'],
    queryFn: getLibraryStats,
    staleTime: 10 * 60 * 1000,
  });

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  // Add bookmark
  const addBookmarkMutation = useMutation({
    mutationFn: ({ itemId, notes }: { itemId: string; notes?: string }) =>
      addBookmark(itemId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-bookmarks'] });
      toast({
        title: 'Bookmarked',
        description: 'Item added to your bookmarks',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add bookmark',
        variant: 'destructive',
      });
    },
  });

  // Remove bookmark
  const removeBookmarkMutation = useMutation({
    mutationFn: (bookmarkId: string) => removeBookmark(bookmarkId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-bookmarks'] });
      toast({
        title: 'Removed',
        description: 'Bookmark removed',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove bookmark',
        variant: 'destructive',
      });
    },
  });

  // Save to binder
  const saveToBinderMutation = useMutation({
    mutationFn: ({
      itemId,
      binderId,
      notes,
    }: {
      itemId: string;
      binderId: string;
      notes?: string;
    }) => saveLibraryItemToBinder(itemId, binderId, notes),
    onSuccess: () => {
      toast({
        title: 'Saved to Binder',
        description: 'Item added to your compliance binder',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save to binder',
        variant: 'destructive',
      });
    },
  });

  // ============================================================================
  // CALLBACKS
  // ============================================================================

  const loadMore = useCallback(() => {
    if (itemsData?.has_more) {
      setOffset(prev => prev + ITEMS_PER_PAGE);
    }
  }, [itemsData?.has_more]);

  const getItem = useCallback(async (id: string): Promise<LibraryItem | null> => {
    return getLibraryItem(id);
  }, []);

  const addToBookmarks = useCallback(
    async (itemId: string, notes?: string) => {
      await addBookmarkMutation.mutateAsync({ itemId, notes });
    },
    [addBookmarkMutation]
  );

  const removeFromBookmarks = useCallback(
    async (bookmarkId: string) => {
      await removeBookmarkMutation.mutateAsync(bookmarkId);
    },
    [removeBookmarkMutation]
  );

  const isBookmarked = useCallback(
    (itemId: string): boolean => {
      return bookmarks.some(b => b.library_item_id === itemId);
    },
    [bookmarks]
  );

  const saveToBinder = useCallback(
    async (itemId: string, binderId: string, notes?: string) => {
      await saveToBinderMutation.mutateAsync({ itemId, binderId, notes });
    },
    [saveToBinderMutation]
  );

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const isSearching = searchQuery.length >= 2;
  const items = isSearching ? (searchData?.items || []) : allItems;
  const hasMore = !isSearching && (itemsData?.has_more || false);
  const totalCount = isSearching
    ? (searchData?.total_count || 0)
    : (itemsData?.total_count || 0);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // State overview
    states,
    statesLoading,
    statesError: statesError as Error | null,

    // Selected state and category
    selectedState,
    selectedCategory,
    setSelectedState,
    setSelectedCategory,

    // Library items
    items,
    itemsLoading,
    itemsError: itemsError as Error | null,
    hasMore,
    loadMore,
    totalCount,

    // Featured items
    featuredItems,
    featuredLoading,

    // Search
    searchQuery,
    setSearchQuery,
    searchResults: searchData?.items || [],
    searchLoading,
    isSearching,
    clearSearch,

    // Single item
    getItem,
    currentItem,
    setCurrentItem,

    // Bookmarks
    bookmarks,
    bookmarksLoading,
    addToBookmarks,
    removeFromBookmarks,
    isBookmarked,

    // Save to binder
    saveToBinder,
    isSaving: saveToBinderMutation.isPending,

    // Statistics
    stats: stats || null,

    // Refresh
    refreshStates,
    refreshItems,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default useComplianceLibrary;
