/**
 * ComplianceResearch.tsx
 * FEAT-GH-015-D: Combined Research tab component
 *
 * This component combines Search + State Library functionality into a unified Research experience.
 *
 * PRESERVATION REQUIREMENTS:
 * - Uses ComplianceSearch.tsx AS-IS (DO NOT MODIFY that component)
 * - Uses FullBinderReader.tsx AS-IS (DO NOT MODIFY that component)
 * - Uses StateBinderSelector.tsx AS-IS (DO NOT MODIFY that component)
 */

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, BookOpen, Library, ArrowRight, Sparkles } from 'lucide-react';

// Import existing components AS-IS (DO NOT MODIFY THESE)
import ComplianceSearch from '@/components/compliance/search/ComplianceSearch';
import { StateBinderSelector } from '@/components/compliance/library/StateBinderSelector';
import { FullBinderReader } from '@/components/compliance/library/FullBinderReader';

// Import hooks for state management
import { useStateBinder } from '@/hooks/useStateBinder';
import { useComplianceBinder } from '@/hooks/useComplianceBinder';
import type { StateCode } from '@/types/compliance';

type ResearchMode = 'search' | 'browse';

interface ComplianceResearchProps {
  /** Initial state code for state selector */
  initialState?: string;
  /** Initial search query */
  initialQuery?: string;
  /** User's binder ID for saving items */
  binderId?: string;
  /** Callback when navigating to My Binder */
  onNavigateToMyBinder?: () => void;
  /** Additional CSS classes */
  className?: string;
}

export const ComplianceResearch = ({
  initialState,
  initialQuery,
  binderId,
  onNavigateToMyBinder,
  className = '',
}: ComplianceResearchProps) => {
  // Research mode: search or browse state library
  const [mode, setMode] = useState<ResearchMode>(initialQuery ? 'search' : 'browse');

  // Full binder reader state
  const [showFullBinder, setShowFullBinder] = useState(false);

  // Get state library data using useStateBinder hook
  // Use hook's internal selectedState and setSelectedState for proper reactivity
  const {
    states,
    statesLoading,
    selectedState,
    setSelectedState,
    binder: stateBinder,
    binderLoading,
    binderError
  } = useStateBinder({ initialState: initialState as StateCode });

  // Get user's binder for saved item tracking
  const { binder: userBinder, savedItemIds, refetch: refetchBinder } = useComplianceBinder(binderId);

  // Handle state selection - use hook's setSelectedState
  const handleSelectState = useCallback((stateCode: StateCode) => {
    setSelectedState(stateCode);
    setShowFullBinder(true);
  }, [setSelectedState]);

  // Handle saving result to binder (passed to ComplianceSearch)
  const handleResultSaved = useCallback(() => {
    refetchBinder();
  }, [refetchBinder]);

  // Handle browsing full state binder from search results
  const handleBrowseFullBinder = useCallback((stateCode: StateCode) => {
    setSelectedState(stateCode);
    setShowFullBinder(true);
    setMode('browse');
  }, [setSelectedState]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Research Mode Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Compliance Research Center
              </CardTitle>
              <CardDescription className="mt-1">
                Search regulations across all 50 states or browse complete state compliance binders
              </CardDescription>
            </div>
            {userBinder && (
              <Button
                variant="outline"
                size="sm"
                onClick={onNavigateToMyBinder}
                className="self-start"
              >
                My Binder
                <Badge variant="secondary" className="ml-2">
                  {userBinder.item_count || 0}
                </Badge>
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Mode Toggle */}
          <Tabs value={mode} onValueChange={(v) => setMode(v as ResearchMode)} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="search" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">Keyword Search</span>
                <span className="sm:hidden">Search</span>
              </TabsTrigger>
              <TabsTrigger value="browse" className="flex items-center gap-2">
                <Library className="h-4 w-4" />
                <span className="hidden sm:inline">Browse State Library</span>
                <span className="sm:hidden">Browse</span>
              </TabsTrigger>
            </TabsList>

            {/* Search Mode - Uses ComplianceSearch AS-IS */}
            <TabsContent value="search" className="mt-0">
              <div className="space-y-4">
                <ComplianceSearch
                  initialState={initialState}
                  initialQuery={initialQuery}
                  binderId={binderId}
                  savedItemIds={savedItemIds}
                  onResultSaved={handleResultSaved}
                  showFilters={true}
                  showHistory={true}
                  showPopularSearches={true}
                  placeholder="Search compliance regulations across all 50 states..."
                />

                {/* Quick Browse Prompt */}
                <Card className="bg-muted/50 border-dashed">
                  <CardContent className="py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <BookOpen className="h-4 w-4" />
                        <span>Want to browse all regulations for a specific state?</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setMode('browse')}
                      >
                        Browse State Library
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Browse Mode - State Selector + Full Binder Reader */}
            <TabsContent value="browse" className="mt-0">
              <div className="space-y-4">
                {/* State Selector */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Library className="h-4 w-4" />
                      Select a State
                    </CardTitle>
                    <CardDescription>
                      Choose a state to view its complete compliance binder with Table of Contents navigation
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <StateBinderSelector
                      states={states}
                      selectedState={selectedState}
                      onSelectState={handleSelectState}
                      isLoading={statesLoading}
                      showUnavailable={false}
                    />
                  </CardContent>
                </Card>

                {/* Full Binder Reader - Displays when state is selected */}
                {showFullBinder && selectedState && (
                  <FullBinderReader
                    binder={stateBinder}
                    isLoading={binderLoading}
                    error={binderError}
                  />
                )}

                {/* Empty State - When no state selected */}
                {!showFullBinder && !selectedState && (
                  <Card className="bg-muted/30">
                    <CardContent className="py-12 text-center">
                      <Library className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                      <h3 className="text-lg font-medium text-muted-foreground mb-2">
                        Select a State to Begin
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        Choose a state above to view its complete compliance binder.
                        You'll be able to navigate through all sections using the Table of Contents.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Quick Search Prompt */}
                <Card className="bg-muted/50 border-dashed">
                  <CardContent className="py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Search className="h-4 w-4" />
                        <span>Looking for something specific?</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setMode('search')}
                      >
                        Search by Keyword
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComplianceResearch;
