// ============================================================================
// USE COMPLIANCE SEARCH HOOK
// ============================================================================
// React hook for compliance search functionality with state management,
// caching, and optimistic updates for the search UI.
// ============================================================================

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  searchCompliance,
  getSearchSuggestions,
  getPopularSearches,
  incrementSearchCount,
  type ComplianceSearchParams,
  type ComplianceSearchResult,
} from '@/services/complianceSearchService';

// ============================================================================
// TYPES
// ============================================================================

export interface UseComplianceSearchOptions {
  initialState?: string;
  initialQuery?: string;
  debounceMs?: number;
  cacheTime?: number;
  enableSuggestions?: boolean;
  enableHistory?: boolean;
}

export interface UseComplianceSearchReturn {
  // Search state
  query: string;
  setQuery: (query: string) => void;
  setQueryForEdit: (query: string) => void; // Populate without auto-search
  debouncedQuery: string;
  stateFilter: string | undefined;
  setStateFilter: (state: string | undefined) => void;
  sectionFilter: string | undefined;
  setSectionFilter: (section: string | undefined) => void;
  matchCount: number;
  setMatchCount: (count: number) => void;

  // Search results
  results: ComplianceSearchResult[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;

  // Search actions
  search: (params?: Partial<ComplianceSearchParams>) => Promise<void>;
  clearSearch: () => void;
  refetch: () => void;

  // Suggestions
  suggestions: string[];
  suggestionsLoading: boolean;
  showSuggestions: boolean;
  setShowSuggestions: (show: boolean) => void;
  selectSuggestion: (suggestion: string) => void;

  // History
  searchHistory: string[];
  clearHistory: () => void;

  // Popular searches
  popularSearches: string[];
  popularLoading: boolean;

  // Metadata
  searchCount: number;
  lastSearchTime: number | null;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SEARCH_HISTORY_KEY = 'compliance_search_history';
const MAX_HISTORY_ITEMS = 10;
const DEFAULT_DEBOUNCE_MS = 300;
const DEFAULT_CACHE_TIME = 5 * 60 * 1000; // 5 minutes
const DEFAULT_MATCH_COUNT = 10;

// ============================================================================
// HOOK
// ============================================================================

export function useComplianceSearch(
  options: UseComplianceSearchOptions = {}
): UseComplianceSearchReturn {
  const {
    initialState,
    initialQuery = '',
    debounceMs = DEFAULT_DEBOUNCE_MS,
    cacheTime = DEFAULT_CACHE_TIME,
    enableSuggestions = true,
    enableHistory = true,
  } = options;

  const queryClient = useQueryClient();

  // ========== State ==========
  const [query, setQueryState] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [stateFilter, setStateFilter] = useState<string | undefined>(initialState);
  const [sectionFilter, setSectionFilter] = useState<string | undefined>();
  const [matchCount, setMatchCount] = useState(DEFAULT_MATCH_COUNT);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [searchCount, setSearchCount] = useState(0);
  const [lastSearchTime, setLastSearchTime] = useState<number | null>(null);
  const [pendingEdit, setPendingEdit] = useState(false); // True when query is populated but not yet submitted

  // Refs for debouncing
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ========== Load search history on mount ==========
  useEffect(() => {
    if (enableHistory) {
      try {
        const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
        if (stored) {
          setSearchHistory(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Failed to load search history:', error);
      }
    }
  }, [enableHistory]);

  // ========== Debounced query update ==========
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, debounceMs]);

  // ========== Set query with debounce handling ==========
  const setQuery = useCallback((newQuery: string) => {
    setQueryState(newQuery);
    setPendingEdit(false); // Regular typing clears pending edit mode
    if (newQuery.length > 0) {
      setShowSuggestions(true);
    }
  }, []);

  // ========== Set query for editing (no auto-search) ==========
  const setQueryForEdit = useCallback((newQuery: string) => {
    setQueryState(newQuery);
    setPendingEdit(true); // Mark as pending edit - won't auto-search
    setShowSuggestions(false); // Hide suggestions
  }, []);

  // ========== Add to search history ==========
  const addToHistory = useCallback(
    (searchQuery: string) => {
      if (!enableHistory || !searchQuery.trim()) return;

      setSearchHistory((prev) => {
        // Remove duplicate if exists
        const filtered = prev.filter(
          (q) => q.toLowerCase() !== searchQuery.toLowerCase()
        );
        // Add to front and limit
        const updated = [searchQuery, ...filtered].slice(0, MAX_HISTORY_ITEMS);

        // Persist to localStorage
        try {
          localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
        } catch (error) {
          console.error('Failed to save search history:', error);
        }

        return updated;
      });
    },
    [enableHistory]
  );

  // ========== Clear history ==========
  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    try {
      localStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch (error) {
      console.error('Failed to clear search history:', error);
    }
  }, []);

  // ========== Main search query ==========
  const searchQueryKey = useMemo(
    () => ['compliance-search', debouncedQuery, stateFilter, sectionFilter, matchCount],
    [debouncedQuery, stateFilter, sectionFilter, matchCount]
  );

  const {
    data: results = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: searchQueryKey,
    queryFn: async () => {
      if (!debouncedQuery.trim()) return [];

      const startTime = Date.now();
      // Call searchCompliance with positional arguments: (query, filters, matchCount)
      const response = await searchCompliance(
        debouncedQuery,
        {
          state_code: stateFilter,
          section_types: sectionFilter ? [sectionFilter] : undefined,
        },
        matchCount
      );

      setLastSearchTime(Date.now() - startTime);
      setSearchCount((prev) => prev + 1);

      // Track search
      try {
        await incrementSearchCount(debouncedQuery, stateFilter);
      } catch {
        // Non-critical, don't throw
      }

      // Add to history
      addToHistory(debouncedQuery);

      // Extract results array from response
      return response.results;
    },
    enabled: debouncedQuery.trim().length > 0 && !pendingEdit,
    staleTime: cacheTime,
    gcTime: cacheTime * 2,
  });

  // ========== Suggestions query ==========
  const {
    data: suggestions = [],
    isLoading: suggestionsLoading,
  } = useQuery({
    queryKey: ['compliance-suggestions', query],
    queryFn: () => getSearchSuggestions(query, stateFilter, 5),
    enabled: enableSuggestions && query.trim().length > 1,
    staleTime: 60000, // 1 minute
  });

  // ========== Popular searches query ==========
  const {
    data: popularSearches = [],
    isLoading: popularLoading,
  } = useQuery({
    queryKey: ['compliance-popular', stateFilter],
    queryFn: async () => {
      // getPopularSearches returns {query, count}[] objects, extract just the query strings
      const results = await getPopularSearches(stateFilter, 5);
      return results.map(item => item.query);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // ========== Manual search function ==========
  const search = useCallback(
    async (params?: Partial<ComplianceSearchParams>) => {
      const searchQuery = params?.query ?? query;
      const searchState = params?.state ?? stateFilter;
      const searchSection = params?.sectionType ?? sectionFilter;
      const searchMatchCount = params?.matchCount ?? matchCount;

      if (!searchQuery.trim()) return;

      // Clear pending edit mode - user explicitly triggered search
      setPendingEdit(false);

      // Update state if different
      if (params?.query && params.query !== query) {
        setQueryState(params.query);
      }
      // Always sync debouncedQuery with the search query
      setDebouncedQuery(searchQuery);

      if (params?.state !== undefined) setStateFilter(params.state);
      if (params?.sectionType !== undefined) setSectionFilter(params.sectionType);
      if (params?.matchCount !== undefined) setMatchCount(params.matchCount);

      // Invalidate and refetch
      await queryClient.invalidateQueries({
        queryKey: ['compliance-search', searchQuery, searchState, searchSection, searchMatchCount],
      });
    },
    [query, stateFilter, sectionFilter, matchCount, queryClient]
  );

  // ========== Clear search ==========
  const clearSearch = useCallback(() => {
    setQueryState('');
    setDebouncedQuery('');
    setShowSuggestions(false);
  }, []);

  // ========== Select suggestion ==========
  const selectSuggestion = useCallback(
    (suggestion: string) => {
      setQueryState(suggestion);
      setDebouncedQuery(suggestion);
      setShowSuggestions(false);
    },
    []
  );

  // ========== Return ==========
  return {
    // Search state
    query,
    setQuery,
    setQueryForEdit,
    debouncedQuery,
    stateFilter,
    setStateFilter,
    sectionFilter,
    setSectionFilter,
    matchCount,
    setMatchCount,

    // Results
    results,
    isLoading,
    isError,
    error: error as Error | null,

    // Actions
    search,
    clearSearch,
    refetch,

    // Suggestions
    suggestions,
    suggestionsLoading,
    showSuggestions,
    setShowSuggestions,
    selectSuggestion,

    // History
    searchHistory,
    clearHistory,

    // Popular
    popularSearches,
    popularLoading,

    // Metadata
    searchCount,
    lastSearchTime,
  };
}

// ============================================================================
// ADDITIONAL HOOKS
// ============================================================================

/**
 * Hook for just fetching suggestions (lighter weight)
 */
export function useSearchSuggestions(
  query: string,
  state?: string,
  limit: number = 5
) {
  return useQuery({
    queryKey: ['compliance-suggestions', query, state, limit],
    queryFn: () => getSearchSuggestions(query, state, limit),
    enabled: query.trim().length > 1,
    staleTime: 60000,
  });
}

/**
 * Hook for popular searches
 */
export function usePopularSearches(state?: string, limit: number = 10) {
  return useQuery({
    queryKey: ['compliance-popular', state, limit],
    queryFn: () => getPopularSearches(state, limit),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for a single search (one-time)
 */
export function useComplianceSearchOnce(params: ComplianceSearchParams) {
  return useQuery({
    queryKey: ['compliance-search-once', params],
    queryFn: async () => {
      const response = await searchCompliance(
        params.query,
        {
          state_code: params.state,
          section_types: params.sectionType ? [params.sectionType] : undefined,
        },
        params.matchCount ?? 10
      );
      return response.results;
    },
    enabled: !!params.query?.trim(),
    staleTime: 5 * 60 * 1000,
  });
}

export default useComplianceSearch;
