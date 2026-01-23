// ============================================================================
// COMPLIANCE SEARCH COMPONENT
// ============================================================================
// Google-like search interface for compliance information across all 50 states.
// Combines search bar, suggestions, filters, and results into a unified experience.
// ============================================================================

import { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Search,
  X,
  History,
  TrendingUp,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { useComplianceSearch } from '@/hooks/useComplianceSearch';
import { useSaveToBinder } from '@/hooks/useComplianceBinder';
import { SearchFilters, US_STATES } from './SearchFilters';
import { SearchResults } from './SearchResults';
import type { ComplianceSearchResult } from '@/services/complianceSearchService';

// ============================================================================
// TYPES
// ============================================================================

export interface ComplianceSearchProps {
  initialState?: string;
  initialQuery?: string;
  onResultSaved?: (result: ComplianceSearchResult) => void;
  binderId?: string;
  savedItemIds?: Set<string>;
  showFilters?: boolean;
  showHistory?: boolean;
  showPopularSearches?: boolean;
  placeholder?: string;
  className?: string;
}

// ============================================================================
// QUICK SEARCH SUGGESTIONS
// ============================================================================

// Quick searches - these are common queries that should return results
// Using broader terms that match better with the training data
const QUICK_SEARCHES = [
  { query: 'licensure requirements', icon: '📋' },
  { query: 'activities of daily living', icon: '🏥' },
  { query: 'staffing requirements', icon: '👥' },
  { query: 'Fair Housing Act', icon: '🏠' },
  { query: 'zoning regulations', icon: '🏗️' },
  { query: 'background check', icon: '📝' },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function ComplianceSearch({
  initialState,
  initialQuery = '',
  onResultSaved,
  binderId,
  savedItemIds = new Set(),
  showFilters = true,
  showHistory = true,
  showPopularSearches = true,
  placeholder,
  className = '',
}: ComplianceSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [savedItems, setSavedItems] = useState<Set<string>>(savedItemIds);
  const { toast } = useToast();

  // Use the compliance search hook
  const {
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
    results,
    isLoading,
    suggestions,
    suggestionsLoading,
    showSuggestions,
    setShowSuggestions,
    selectSuggestion,
    searchHistory,
    clearHistory,
    popularSearches,
    searchCount,
    lastSearchTime,
    clearSearch,
    search,
  } = useComplianceSearch({
    initialState,
    initialQuery,
    enableSuggestions: true,
    enableHistory: showHistory,
  });

  // Save to binder hook
  const { saveToBinder, isSaving, error: saveError } = useSaveToBinder();

  // Sync saved items
  useEffect(() => {
    setSavedItems(savedItemIds);
  }, [savedItemIds]);

  // Get state name for placeholder
  const stateName = stateFilter
    ? US_STATES.find((s) => s.code === stateFilter)?.name
    : null;

  // Dynamic placeholder
  const searchPlaceholder =
    placeholder ||
    (stateName
      ? `Search ${stateName} compliance...`
      : 'Search compliance across all 50 states...');

  // Handle save to binder
  const handleSaveToBinder = useCallback(
    async (result: ComplianceSearchResult) => {
      if (!binderId) {
        toast({
          title: 'No binder available',
          description: 'Please create a compliance binder first to save search results.',
          variant: 'destructive',
        });
        return;
      }

      try {
        await saveToBinder({
          binder_id: binderId,
          chunk_id: result.chunk_id,
          chunk_content: result.content,
          section_type: result.section_type || 'notes',
          source_url: result.source_url,
          regulation_code: result.regulation_code,
        });

        setSavedItems((prev) => new Set([...prev, result.chunk_id]));
        onResultSaved?.(result);

        toast({
          title: 'Saved to binder',
          description: 'The search result has been added to your compliance binder.',
        });
      } catch (err) {
        console.error('Failed to save to binder:', err);
        toast({
          title: 'Failed to save',
          description: 'There was an error saving to your binder. Please try again.',
          variant: 'destructive',
        });
      }
    },
    [binderId, saveToBinder, onResultSaved, toast]
  );

  // Handle remove from binder
  const handleRemoveFromBinder = useCallback((chunkId: string) => {
    setSavedItems((prev) => {
      const next = new Set(prev);
      next.delete(chunkId);
      return next;
    });
  }, []);

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion: string) => {
    selectSuggestion(suggestion);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsOpen(false);
    inputRef.current?.blur();
    // Trigger manual search
    if (query.trim()) {
      search();
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  // Check if dropdown should be visible
  const showDropdown = isOpen && (
    (query.length > 0 && suggestions.length > 0) ||
    (query.length === 0 && showHistory && searchHistory.length > 0) ||
    (query.length === 0 && showPopularSearches && popularSearches.length > 0)
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search Bar - Simple Input (No Popover wrapper interference) */}
      <div className="relative">
        <form onSubmit={handleSubmit} className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            onBlur={() => {
              // Delay closing to allow clicking on suggestions
              setTimeout(() => setIsOpen(false), 200);
            }}
            onKeyDown={handleKeyDown}
            className="pl-12 pr-20 h-14 text-lg rounded-xl border-2 focus:border-primary"
            autoComplete="off"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {isLoading && (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            )}
            {query && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  clearSearch();
                  inputRef.current?.focus();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button
              type="submit"
              size="sm"
              className="h-8 px-3"
              disabled={!query.trim()}
            >
              Search
            </Button>
          </div>
        </form>

        {/* Suggestions Dropdown - Separate from input, no focus interference */}
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border rounded-lg shadow-lg overflow-hidden">
            <Command>
              <CommandList>
                {/* Search Suggestions */}
                {query.length > 0 && suggestions.length > 0 && (
                  <CommandGroup heading="Suggestions">
                    {suggestions.map((suggestion) => (
                      <CommandItem
                        key={suggestion}
                        value={suggestion}
                        onSelect={() => handleSelectSuggestion(suggestion)}
                        className="cursor-pointer"
                      >
                        <Sparkles className="h-4 w-4 mr-2 text-primary" />
                        {suggestion}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {/* Search History */}
                {showHistory && searchHistory.length > 0 && query.length === 0 && (
                  <>
                    <CommandGroup heading="Recent Searches">
                      {searchHistory.slice(0, 5).map((item) => (
                        <CommandItem
                          key={item}
                          value={item}
                          onSelect={() => handleSelectSuggestion(item)}
                          className="cursor-pointer"
                        >
                          <History className="h-4 w-4 mr-2 text-muted-foreground" />
                          {item}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    <CommandSeparator />
                    <div className="p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs text-muted-foreground"
                        onClick={clearHistory}
                      >
                        Clear search history
                      </Button>
                    </div>
                  </>
                )}

                {/* Popular Searches */}
                {showPopularSearches && popularSearches.length > 0 && query.length === 0 && (
                  <CommandGroup heading="Popular Searches">
                    {popularSearches.slice(0, 5).map((item) => (
                      <CommandItem
                        key={item}
                        value={item}
                        onSelect={() => handleSelectSuggestion(item)}
                        className="cursor-pointer"
                      >
                        <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
                        {item}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </div>
        )}

        {/* Quick search badges */}
        {!query && (
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-sm text-muted-foreground">Quick searches:</span>
            {QUICK_SEARCHES.slice(0, 4).map((item) => (
              <Badge
                key={item.query}
                variant="secondary"
                className="cursor-pointer hover:bg-secondary/80"
                onClick={() => {
                  // Use setQueryForEdit to populate without auto-searching
                  // User can edit the query and press Enter to search
                  setQueryForEdit(item.query);
                  inputRef.current?.focus();
                }}
              >
                <span className="mr-1">{item.icon}</span>
                {item.query}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <SearchFilters
          stateFilter={stateFilter}
          sectionFilter={sectionFilter}
          matchCount={matchCount}
          onStateChange={setStateFilter}
          onSectionChange={setSectionFilter}
          onMatchCountChange={setMatchCount}
          variant="horizontal"
        />
      )}

      {/* Search Stats */}
      {debouncedQuery && lastSearchTime !== null && (
        <div className="text-xs text-muted-foreground">
          Search completed in {lastSearchTime}ms
          {searchCount > 0 && ` • ${searchCount} searches this session`}
        </div>
      )}

      {/* Results */}
      <SearchResults
        results={results}
        isLoading={isLoading}
        query={debouncedQuery}
        savedItemIds={savedItems}
        onSaveToBinder={handleSaveToBinder}
        onRemoveFromBinder={handleRemoveFromBinder}
        isSaving={isSaving}
      />
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default ComplianceSearch;
