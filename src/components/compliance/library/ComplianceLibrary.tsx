// ============================================================================
// COMPLIANCE LIBRARY COMPONENT
// ============================================================================
// Main container for the State Compliance Library feature.
// Provides browsing, searching, and bookmarking of compliance regulations.
// This is a "$100M feature" - a curated reference library for operators.
//
// NEW (v2): Full Binder View - Read complete state binders like PDFs
// ============================================================================

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  BookOpen,
  MapPin,
  Bookmark,
  X,
  RefreshCw,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Loader2,
  FileText,
  AlertCircle,
  BookMarked,
  Eye,
  Printer,
  Trash2,
} from 'lucide-react';
import { StateSelector } from './StateSelector';
import { CategoryBrowser } from './CategoryBrowser';
import { LibraryItemCard } from './LibraryItemCard';
import { LibraryItemDetail } from './LibraryItemDetail';
import { FullBinderReader } from './FullBinderReader';
import { StateBinderSelector } from './StateBinderSelector';
import { useComplianceLibrary } from '@/hooks/useComplianceLibrary';
import { useStateBinder } from '@/hooks/useStateBinder';
import type { LibraryItem, StateCode, LibraryCategoryType, ComplianceBinder, BinderItem } from '@/types/compliance';
import { getUserBinders, getBinderItems, deleteBinderItem } from '@/services/complianceBinderService';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

// ============================================================================
// TYPES
// ============================================================================

export interface ComplianceLibraryProps {
  onSaveToBinder?: (itemId: string, binderId: string, notes?: string) => Promise<void>;
  availableBinders?: ComplianceBinder[];
  initialState?: StateCode;
  className?: string;
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function LibrarySkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

function ItemsGrid({
  items,
  isLoading,
  hasMore,
  onLoadMore,
  isBookmarked,
  onViewItem,
  onBookmark,
  onSaveToBinder,
}: {
  items: LibraryItem[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  isBookmarked: (itemId: string) => boolean;
  onViewItem: (item: LibraryItem) => void;
  onBookmark: (item: LibraryItem) => void;
  onSaveToBinder?: (item: LibraryItem) => void;
}) {
  if (isLoading && items.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="font-medium mb-1">No items found</h3>
          <p className="text-sm text-muted-foreground">
            Try adjusting your filters or search query.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <LibraryItemCard
            key={item.id}
            item={item}
            isBookmarked={isBookmarked(item.id)}
            onView={onViewItem}
            onBookmark={onBookmark}
            onSaveToBinder={onSaveToBinder}
          />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={onLoadMore} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ComplianceLibrary({
  onSaveToBinder,
  availableBinders = [],
  initialState,
  className = '',
}: ComplianceLibraryProps) {
  const [activeTab, setActiveTab] = useState<'fullbinder' | 'browse' | 'bookmarks'>('fullbinder');
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);

  // Use the state binder hook (for Full Binder view)
  const {
    states: binderStates,
    statesLoading: binderStatesLoading,
    selectedState: binderSelectedState,
    setSelectedState: setBinderSelectedState,
    binder,
    binderLoading,
    binderError,
    binderCount,
    scrollToSection,
  } = useStateBinder();

  // Use the compliance library hook
  const {
    states,
    statesLoading,
    statesError,
    selectedState,
    selectedCategory,
    setSelectedState,
    setSelectedCategory,
    items,
    itemsLoading,
    hasMore,
    loadMore,
    totalCount,
    featuredItems,
    featuredLoading,
    searchQuery,
    setSearchQuery,
    searchLoading,
    isSearching,
    clearSearch,
    bookmarks,
    bookmarksLoading,
    addToBookmarks,
    removeFromBookmarks,
    isBookmarked,
    saveToBinder,
    isSaving,
    stats,
    refreshStates,
    refreshItems,
  } = useComplianceLibrary({ initialState });

  // State for My Binder (user's saved items)
  const [myBinders, setMyBinders] = useState<ComplianceBinder[]>([]);
  const [myBinderItems, setMyBinderItems] = useState<BinderItem[]>([]);
  const [myBinderLoading, setMyBinderLoading] = useState(false);
  const [myBinderError, setMyBinderError] = useState<Error | null>(null);
  const [expandedBinderItem, setExpandedBinderItem] = useState<string | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  // Fetch user's saved binders when My Binder tab is active
  const fetchMyBinder = useCallback(async () => {
    setMyBinderLoading(true);
    setMyBinderError(null);
    try {
      const binders = await getUserBinders();
      setMyBinders(binders);

      // Fetch all items from all user's binders
      const allItems: BinderItem[] = [];
      for (const binder of binders) {
        const items = await getBinderItems(binder.id);
        allItems.push(...items);
      }
      setMyBinderItems(allItems);
    } catch (err) {
      setMyBinderError(err as Error);
    } finally {
      setMyBinderLoading(false);
    }
  }, []);

  // Handle delete item from binder
  const handleDeleteBinderItem = useCallback(async (itemId: string) => {
    setDeletingItemId(itemId);
    try {
      await deleteBinderItem(itemId);
      // Remove the item from local state immediately for responsive UI
      setMyBinderItems((prev) => prev.filter((item) => item.id !== itemId));
      // Clear expanded state if we deleted the expanded item
      if (expandedBinderItem === itemId) {
        setExpandedBinderItem(null);
      }
    } catch (err) {
      console.error('Failed to delete binder item:', err);
      // Refresh the list to ensure consistency
      fetchMyBinder();
    } finally {
      setDeletingItemId(null);
    }
  }, [expandedBinderItem, fetchMyBinder]);

  // Fetch My Binder data when tab changes to bookmarks
  useEffect(() => {
    if (activeTab === 'bookmarks') {
      fetchMyBinder();
    }
  }, [activeTab, fetchMyBinder]);

  // Get category counts for the selected state
  const categoryCounts = useMemo(() => {
    if (!selectedState) return {} as Record<LibraryCategoryType, number>;

    const state = states.find((s) => s.state_code === selectedState);
    if (!state) return {} as Record<LibraryCategoryType, number>;

    const counts: Record<LibraryCategoryType, number> = {} as Record<LibraryCategoryType, number>;
    state.categories.forEach((cat) => {
      counts[cat.category_type] = cat.count;
    });
    return counts;
  }, [states, selectedState]);

  // Filter binder states based on search query (for Full Binder tab)
  const filteredBinderStates = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2 || activeTab !== 'fullbinder') {
      return binderStates;
    }

    const query = searchQuery.toLowerCase();
    return binderStates.filter((state) =>
      state.state_code.toLowerCase().includes(query) ||
      state.state_name.toLowerCase().includes(query)
    );
  }, [binderStates, searchQuery, activeTab]);

  // Auto-select state if search matches exactly one binder with content
  const searchMatchedState = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2 || activeTab !== 'fullbinder') {
      return null;
    }

    const query = searchQuery.toLowerCase();
    const matches = binderStates.filter((state) =>
      state.has_binder && (
        state.state_code.toLowerCase() === query ||
        state.state_name.toLowerCase().includes(query)
      )
    );

    // If exactly one match with a binder, return it
    if (matches.length === 1) {
      return matches[0].state_code;
    }

    // If search is an exact state code match
    const exactCodeMatch = binderStates.find(
      (state) => state.state_code.toLowerCase() === query && state.has_binder
    );
    if (exactCodeMatch) {
      return exactCodeMatch.state_code;
    }

    return null;
  }, [binderStates, searchQuery, activeTab]);

  // Auto-select matched state when search finds one
  useEffect(() => {
    if (searchMatchedState && activeTab === 'fullbinder' && searchMatchedState !== binderSelectedState) {
      setBinderSelectedState(searchMatchedState as StateCode);
    }
  }, [searchMatchedState, activeTab, binderSelectedState, setBinderSelectedState]);

  // Handle bookmark toggle
  const handleBookmarkToggle = async (item: LibraryItem) => {
    if (isBookmarked(item.id)) {
      const bookmark = bookmarks.find((b) => b.library_item_id === item.id);
      if (bookmark) {
        await removeFromBookmarks(bookmark.id);
      }
    } else {
      await addToBookmarks(item.id);
    }
  };

  // Handle save to binder
  const handleSaveToBinder = async (item: LibraryItem) => {
    if (onSaveToBinder && availableBinders.length > 0) {
      setSelectedItem(item);
    }
  };

  // Handle detailed save to binder from modal
  const handleDetailSaveToBinder = async (
    itemId: string,
    binderId: string,
    notes?: string
  ) => {
    if (onSaveToBinder) {
      await onSaveToBinder(itemId, binderId, notes);
    } else {
      await saveToBinder(itemId, binderId, notes);
    }
  };

  // Error state
  if (statesError) {
    return (
      <Card className="border-destructive">
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="font-medium text-lg mb-2">Failed to Load Library</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {statesError.message || 'An error occurred while loading the library.'}
          </p>
          <Button onClick={() => refreshStates()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                State Compliance Library
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Browse curated compliance regulations by state and category
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {binderCount || 51} states
              </span>
              <span className="flex items-center gap-1">
                <BookMarked className="h-4 w-4" />
                {binderCount || 51} binders
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search regulations, codes, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={clearSearch}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Search Loading Indicator */}
          {searchLoading && (
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching...
            </div>
          )}

          {/* Search Results Count */}
          {isSearching && !searchLoading && (
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-muted-foreground">
                Found {totalCount} results for "{searchQuery}"
              </span>
              <Button variant="ghost" size="sm" onClick={clearSearch}>
                Clear Search
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'fullbinder' | 'browse' | 'bookmarks')}>
        <TabsList>
          <TabsTrigger value="fullbinder">
            <BookMarked className="h-4 w-4 mr-2" />
            State Binders
            {binderCount > 0 && (
              <Badge variant="outline" className="ml-2">
                {binderCount}
              </Badge>
            )}
          </TabsTrigger>
          {/* Browse tab hidden - Phase 1 deprecation. Code preserved for rollback if needed.
          <TabsTrigger value="browse">
            <BookOpen className="h-4 w-4 mr-2" />
            Browse
          </TabsTrigger>
          */}
          <TabsTrigger value="bookmarks">
            <Bookmark className="h-4 w-4 mr-2" />
            My Binder
            {myBinderItems.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {myBinderItems.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Full Binder Tab (NEW - v2) */}
        <TabsContent value="fullbinder" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Read Full State Binder</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isSearching
                      ? `Showing states matching "${searchQuery}"`
                      : 'Select a state to read its complete compliance binder'
                    }
                  </p>
                </div>
                {isSearching && filteredBinderStates.length > 0 && (
                  <Badge variant="secondary">
                    {filteredBinderStates.filter(s => s.has_binder).length} matching states
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <StateBinderSelector
                states={filteredBinderStates}
                selectedState={binderSelectedState}
                onSelectState={setBinderSelectedState}
                isLoading={binderStatesLoading}
                showUnavailable={!isSearching}
              />

              {/* Search no results message */}
              {isSearching && filteredBinderStates.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  <p>No states match "{searchQuery}"</p>
                  <Button variant="link" size="sm" onClick={clearSearch}>
                    Clear search
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Binder Reader */}
          {binderSelectedState && (
            <FullBinderReader
              binder={binder}
              isLoading={binderLoading}
              error={binderError}
              onSectionClick={scrollToSection}
            />
          )}

          {/* Empty state when no state selected */}
          {!binderSelectedState && !binderStatesLoading && (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <BookMarked className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-medium mb-2">
                  Select a State to Get Started
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Choose a state from the dropdown above to read its complete compliance binder.
                  Each binder contains all regulations organized in one easy-to-read document.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Browse Tab - Hidden (Phase 1 deprecation). Code preserved for rollback. */}
        <TabsContent value="browse" className="space-y-4 mt-4 hidden">
          {/* State Selection (when no search) */}
          {!isSearching && !selectedState && (
            <StateSelector
              states={states}
              selectedState={selectedState}
              onSelectState={setSelectedState}
              isLoading={statesLoading}
            />
          )}

          {/* Selected State View */}
          {!isSearching && selectedState && (
            <div className="space-y-4">
              {/* Back Button & State Header */}
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedState(null);
                    setSelectedCategory(null);
                  }}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  All States
                </Button>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-lg px-3 py-1">
                    {selectedState}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {totalCount} items
                  </span>
                </div>
              </div>

              {/* Category Filter */}
              <CategoryBrowser
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                categoryCounts={categoryCounts}
              />

              {/* Featured Items */}
              {featuredItems.length > 0 && !selectedCategory && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Featured Resources</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {featuredItems.slice(0, 3).map((item) => (
                        <LibraryItemCard
                          key={item.id}
                          item={item}
                          isBookmarked={isBookmarked(item.id)}
                          onView={setSelectedItem}
                          onBookmark={handleBookmarkToggle}
                          onSaveToBinder={onSaveToBinder ? handleSaveToBinder : undefined}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Items Grid */}
              <ItemsGrid
                items={items}
                isLoading={itemsLoading}
                hasMore={hasMore}
                onLoadMore={loadMore}
                isBookmarked={isBookmarked}
                onViewItem={setSelectedItem}
                onBookmark={handleBookmarkToggle}
                onSaveToBinder={onSaveToBinder ? handleSaveToBinder : undefined}
              />
            </div>
          )}

          {/* Search Results */}
          {isSearching && (
            <ItemsGrid
              items={items}
              isLoading={searchLoading}
              hasMore={false}
              onLoadMore={() => {}}
              isBookmarked={isBookmarked}
              onViewItem={setSelectedItem}
              onBookmark={handleBookmarkToggle}
              onSaveToBinder={onSaveToBinder ? handleSaveToBinder : undefined}
            />
          )}
        </TabsContent>

        {/* My Binder Tab - User's saved binder items */}
        <TabsContent value="bookmarks" className="mt-4">
          {myBinderLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-lg" />
                ))}
              </div>
            </div>
          ) : myBinderError ? (
            <Card className="border-destructive">
              <CardContent className="py-8 text-center">
                <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-3" />
                <h3 className="font-medium mb-1">Failed to load My Binder</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {myBinderError.message || 'An error occurred.'}
                </p>
                <Button onClick={fetchMyBinder} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : myBinderItems.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Bookmark className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-medium mb-2">Your Binder is Empty</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-4">
                  Save sections from State Binders to build your own personalized compliance reference.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setActiveTab('fullbinder')}
                >
                  <BookMarked className="h-4 w-4 mr-2" />
                  Browse State Binders
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Group items by binder (state) */}
              {myBinders.map((binder) => {
                const binderItems = myBinderItems.filter(
                  (item) => item.binder_id === binder.id
                );
                if (binderItems.length === 0) return null;

                return (
                  <Card key={binder.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono">
                            {binder.state_code}
                          </Badge>
                          <CardTitle className="text-base">{binder.title}</CardTitle>
                        </div>
                        <Badge variant="secondary">
                          {binderItems.length} {binderItems.length === 1 ? 'item' : 'items'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {binderItems.map((item) => {
                          const isExpanded = expandedBinderItem === item.id;
                          return (
                            <div
                              key={item.id}
                              className={`border rounded-lg transition-all ${
                                isExpanded ? 'ring-2 ring-primary/20' : 'hover:bg-muted/50'
                              }`}
                            >
                              {/* Clickable Header */}
                              <button
                                onClick={() => setExpandedBinderItem(isExpanded ? null : item.id)}
                                className="w-full p-4 text-left flex items-start justify-between gap-3"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    <h4 className="font-medium truncate">
                                      {item.title || 'Saved Section'}
                                    </h4>
                                    {item.section_type && (
                                      <Badge variant="outline" className="text-xs">
                                        {item.section_type === 'general'
                                          ? 'Full Binder'
                                          : item.section_type}
                                      </Badge>
                                    )}
                                  </div>
                                  {!isExpanded && item.chunk_content && (
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                      {item.chunk_content.substring(0, 200)}
                                      {item.chunk_content.length > 200 ? '...' : ''}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                  {isExpanded ? (
                                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </div>
                              </button>

                              {/* Expanded Content */}
                              {isExpanded && item.chunk_content && (
                                <div className="px-4 pb-4 border-t bg-muted/30">
                                  <div className="pt-4 space-y-4">
                                    {/* Action buttons */}
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          // Print this item
                                          const printWindow = window.open('', '_blank');
                                          if (printWindow) {
                                            printWindow.document.write(`
                                              <!DOCTYPE html>
                                              <html>
                                              <head>
                                                <title>${item.title || 'Saved Section'}</title>
                                                <style>
                                                  body { font-family: -apple-system, system-ui, sans-serif; line-height: 1.6; max-width: 8.5in; margin: 0 auto; padding: 0.5in; }
                                                  h1 { font-size: 1.5rem; border-bottom: 2px solid #333; padding-bottom: 0.5rem; }
                                                  h2 { font-size: 1.25rem; margin-top: 1.5rem; color: #333; }
                                                  h3 { font-size: 1.1rem; margin-top: 1rem; color: #444; }
                                                  p { margin-bottom: 0.75rem; }
                                                  @media print { @page { margin: 0.75in; } }
                                                </style>
                                              </head>
                                              <body>
                                                <h1>${item.title || 'Saved Section'}</h1>
                                                <div>${item.chunk_content
                                                  .replace(/^## (.*$)/gm, '<h2>$1</h2>')
                                                  .replace(/^### (.*$)/gm, '<h3>$1</h3>')
                                                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                                  .replace(/\n\n/g, '</p><p>')
                                                  .replace(/^([^<])/gm, '<p>$1')
                                                }</div>
                                              </body>
                                              </html>
                                            `);
                                            printWindow.document.close();
                                            printWindow.onload = () => printWindow.print();
                                          }
                                        }}
                                      >
                                        <Printer className="h-4 w-4 mr-2" />
                                        Print
                                      </Button>

                                      {/* Delete button with confirmation */}
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={(e) => e.stopPropagation()}
                                            disabled={deletingItemId === item.id}
                                          >
                                            {deletingItemId === item.id ? (
                                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            ) : (
                                              <Trash2 className="h-4 w-4 mr-2" />
                                            )}
                                            Remove
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Remove from Binder?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              This will remove "{item.title || 'this section'}" from your binder.
                                              You can always save it again from the library.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                              onClick={() => handleDeleteBinderItem(item.id)}
                                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            >
                                              Remove
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </div>

                                    {/* Full content with markdown rendering */}
                                    <div className="prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-muted-foreground">
                                      {item.chunk_content.split('\n').map((line, idx) => {
                                        if (line.startsWith('## ')) {
                                          return <h2 key={idx} className="text-lg font-semibold mt-4 mb-2 text-foreground">{line.replace('## ', '')}</h2>;
                                        }
                                        if (line.startsWith('### ')) {
                                          return <h3 key={idx} className="text-base font-medium mt-3 mb-1 text-foreground">{line.replace('### ', '')}</h3>;
                                        }
                                        if (line.startsWith('- ')) {
                                          return <li key={idx} className="text-sm text-muted-foreground ml-4">{line.replace('- ', '')}</li>;
                                        }
                                        if (line.trim() === '') {
                                          return <br key={idx} />;
                                        }
                                        return <p key={idx} className="text-sm text-muted-foreground">{line}</p>;
                                      })}
                                    </div>

                                    {/* User notes / Key Points if present */}
                                    {item.user_notes && (
                                      <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                                        <p className="text-sm font-medium text-primary mb-2">Key Points & Notes:</p>
                                        <div className="text-sm text-muted-foreground space-y-1">
                                          {item.user_notes.split('\n').map((line, idx) => {
                                            if (line.startsWith('**') && line.endsWith('**')) {
                                              // Bold headers
                                              return <p key={idx} className="font-semibold text-foreground mt-2">{line.replace(/\*\*/g, '')}</p>;
                                            }
                                            if (line.startsWith('•')) {
                                              // Bullet points
                                              return <p key={idx} className="pl-2">{line}</p>;
                                            }
                                            if (line.trim()) {
                                              return <p key={idx}>{line}</p>;
                                            }
                                            return null;
                                          })}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Item Detail Modal */}
      <LibraryItemDetail
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        isBookmarked={selectedItem ? isBookmarked(selectedItem.id) : false}
        onBookmark={addToBookmarks}
        onRemoveBookmark={async (itemId) => {
          const bookmark = bookmarks.find((b) => b.library_item_id === itemId);
          if (bookmark) {
            await removeFromBookmarks(bookmark.id);
          }
        }}
        onSaveToBinder={
          onSaveToBinder || availableBinders.length > 0
            ? handleDetailSaveToBinder
            : undefined
        }
        availableBinders={availableBinders}
      />
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default ComplianceLibrary;
