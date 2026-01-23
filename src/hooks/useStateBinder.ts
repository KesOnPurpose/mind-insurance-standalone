// ============================================================================
// USE STATE BINDER HOOK
// ============================================================================
// React hook for the Full Binder experience.
// Manages state selection, binder fetching, and search for complete compliance
// binders (one document per state).
// ============================================================================

import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  getStateBinder,
  getAvailableStates,
  getBinderCount,
  searchBinders,
  getBinderStats,
} from '@/services/stateBinderService';
import type {
  StateCode,
  StateBinder,
  StateBinderOption,
  BinderSectionHeader,
} from '@/types/compliance';

// ============================================================================
// TYPES
// ============================================================================

interface UseStateBinderOptions {
  initialState?: StateCode;
  autoLoadStates?: boolean;
}

interface UseStateBinderReturn {
  // Available states
  states: StateBinderOption[];
  statesLoading: boolean;
  statesError: Error | null;
  statesWithBinders: StateBinderOption[];
  statesWithoutBinders: StateBinderOption[];

  // Selected state
  selectedState: StateCode | null;
  setSelectedState: (state: StateCode | null) => void;

  // Current binder
  binder: StateBinder | null;
  binderLoading: boolean;
  binderError: Error | null;
  hasBinder: boolean;

  // Section navigation
  sectionHeaders: BinderSectionHeader[];
  activeSection: string | null;
  setActiveSection: (sectionId: string | null) => void;
  scrollToSection: (sectionId: string) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: StateBinder[];
  searchLoading: boolean;
  isSearching: boolean;
  clearSearch: () => void;

  // Statistics
  binderCount: number;
  stats: {
    total_binders: number;
    total_word_count: number;
    avg_word_count: number;
    states_with_binders: string[];
    states_without_binders: string[];
  } | null;

  // Actions
  refreshStates: () => void;
  refreshBinder: () => void;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useStateBinder(
  options: UseStateBinderOptions = {}
): UseStateBinderReturn {
  const { initialState, autoLoadStates = true } = options;

  const { toast } = useToast();

  // Local state
  const [selectedState, setSelectedState] = useState<StateCode | null>(
    initialState || null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // ============================================================================
  // QUERIES
  // ============================================================================

  // Fetch all available states with binder status
  const {
    data: states = [],
    isLoading: statesLoading,
    error: statesError,
    refetch: refreshStates,
  } = useQuery({
    queryKey: ['binder-states'],
    queryFn: getAvailableStates,
    enabled: autoLoadStates,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch selected state's binder
  const {
    data: binder = null,
    isLoading: binderLoading,
    error: binderError,
    refetch: refreshBinder,
  } = useQuery({
    queryKey: ['state-binder', selectedState],
    queryFn: () => (selectedState ? getStateBinder(selectedState) : Promise.resolve(null)),
    enabled: !!selectedState,
    staleTime: 10 * 60 * 1000, // 10 minutes (binders don't change often)
  });

  // Fetch binder count
  const { data: binderCount = 0 } = useQuery({
    queryKey: ['binder-count'],
    queryFn: getBinderCount,
    staleTime: 10 * 60 * 1000,
  });

  // Search binders
  const {
    data: searchResults = [],
    isLoading: searchLoading,
  } = useQuery({
    queryKey: ['binder-search', searchQuery],
    queryFn: () => searchBinders(searchQuery),
    enabled: searchQuery.length >= 2,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Statistics
  const { data: stats = null } = useQuery({
    queryKey: ['binder-stats'],
    queryFn: getBinderStats,
    staleTime: 10 * 60 * 1000,
  });

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  // Filter states with and without binders
  const statesWithBinders = useMemo(
    () => states.filter((s) => s.has_binder),
    [states]
  );

  const statesWithoutBinders = useMemo(
    () => states.filter((s) => !s.has_binder),
    [states]
  );

  // Check if current state has a binder
  const hasBinder = !!binder;

  // Get section headers from current binder
  const sectionHeaders = useMemo(
    () => binder?.section_headers || [],
    [binder]
  );

  // Search state
  const isSearching = searchQuery.length >= 2;

  // ============================================================================
  // CALLBACKS
  // ============================================================================

  // Handle state selection
  const handleSetSelectedState = useCallback((state: StateCode | null) => {
    setSelectedState(state);
    setActiveSection(null); // Reset active section when changing states
    setSearchQuery(''); // Clear search when selecting a state
  }, []);

  // Scroll to section in the binder
  const scrollToSection = useCallback((sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(sectionId);
    } else {
      toast({
        title: 'Section not found',
        description: 'The requested section could not be found.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // Available states
    states,
    statesLoading,
    statesError: statesError as Error | null,
    statesWithBinders,
    statesWithoutBinders,

    // Selected state
    selectedState,
    setSelectedState: handleSetSelectedState,

    // Current binder
    binder,
    binderLoading,
    binderError: binderError as Error | null,
    hasBinder,

    // Section navigation
    sectionHeaders,
    activeSection,
    setActiveSection,
    scrollToSection,

    // Search
    searchQuery,
    setSearchQuery,
    searchResults,
    searchLoading,
    isSearching,
    clearSearch,

    // Statistics
    binderCount,
    stats,

    // Actions
    refreshStates,
    refreshBinder,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default useStateBinder;
