import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Loader2, Search, Star, Settings, AlertCircle, Lock as LockIcon, Users, GraduationCap, BookOpen
} from 'lucide-react';

/**
 * Population filter options for group home tactics
 * Value matches target_populations field in tactics table
 */
const POPULATION_OPTIONS = [
  { value: 'elderly', label: 'Seniors', icon: '👴' },
  { value: 'disabled', label: 'Adults with Disabilities', icon: '♿' },
  { value: 'mental_health', label: 'Mental Health', icon: '🧠' },
  { value: 'veterans', label: 'Veterans', icon: '🎖️' },
  { value: 'ssi', label: 'SSI/Low-Income', icon: '💰' },
  { value: 'returning_citizens', label: 'Returning Citizens', icon: '🔓' },
] as const;
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { usePersonalizedTactics } from '@/hooks/usePersonalizedTactics';
import { useStartTactic, useCompleteTactic, useSaveNotes, calculateWeekProgress, useUserProgress } from '@/services/progressService';
import { TacticCard } from '@/components/roadmap/TacticCard';
import { Week1Checklist } from '@/components/roadmap/Week1Checklist';
import { Week2Checklist } from '@/components/roadmap/Week2Checklist';
import { Week3Checklist } from '@/components/roadmap/Week3Checklist';
import { Week4Checklist } from '@/components/roadmap/Week4Checklist';
import { Week5Checklist } from '@/components/roadmap/Week5Checklist';
import { Week6Checklist } from '@/components/roadmap/Week6Checklist';
import { QuickScheduleModal, ScheduleTacticData } from '@/components/roadmap/QuickScheduleModal';
import { TacticWithProgress, WeekSummary } from '@/types/tactic';
import { JOURNEY_PHASES } from '@/config/categories';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { updateBusinessProfile } from '@/services/businessProfileService';
import { toast } from 'sonner';
import { UpdateStrategyModal } from '@/components/modals/UpdateStrategyModal';
import { SkipAssessmentModal } from '@/components/modals/SkipAssessmentModal';
import { CATEGORY_HIERARCHY, isParentCategory } from '@/config/categoryHierarchy';
import { expandSearchTerms } from '@/config/searchSynonyms';

export default function RoadmapPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [populationFilter, setPopulationFilter] = useState<string[]>([]);
  const [sourceFilter, setSourceFilter] = useState<'all' | 'mentorship' | 'cashflow_course' | 'general'>('all');
  const [highlightedTacticId, setHighlightedTacticId] = useState<string | null>(null);
  const [openAccordionItems, setOpenAccordionItems] = useState<string[]>([]);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showSkipAssessmentModal, setShowSkipAssessmentModal] = useState(false);
  const [scheduleModalTactic, setScheduleModalTactic] = useState<ScheduleTacticData | null>(null);
  const tacticRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const {
    tactics,
    assessment,
    recommendedWeeks,
    startingWeek,
    isLoading,
    hasAssessment,
  } = usePersonalizedTactics();

  // URL-based week state - REACTIVE: derives from URL so sidebar changes update immediately
  // This ensures header and sidebar stay in sync when week is changed from either location
  const urlWeek = searchParams.get('week');
  const selectedWeek = urlWeek ? parseInt(urlWeek) : (startingWeek || 1);

  // Update URL when week changes (used by internal components)
  const setSelectedWeek = (week: number) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('week', String(week));
      return newParams;
    });
  };

  const { data: progressData } = useUserProgress(user?.id || '');
  const startTactic = useStartTactic();
  const completeTactic = useCompleteTactic();
  const saveNotes = useSaveNotes();

  // Handle successful strategy update
  const handleStrategyUpdateSuccess = () => {
    window.location.reload();
  };

  // Handle schedule tactic button click
  const handleScheduleTactic = (tacticId: string, tacticName: string, durationMinutes: number | null, category: string) => {
    setScheduleModalTactic({
      tacticId,
      tacticName,
      durationMinutes,
      category,
    });
  };

  // Check if strategy profile is incomplete
  const isStrategyIncomplete = !assessment?.ownership_model || !assessment?.target_state || !assessment?.immediate_priority;
  
  // Real-time subscription for progress updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('tactic-progress-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gh_user_tactic_progress',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Real-time progress update:', payload);
          // Invalidate queries to refetch with new data
          queryClient.invalidateQueries({ queryKey: ['userProgress'] });
          queryClient.invalidateQueries({ queryKey: ['personalizedTactics'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, user?.id]);
  
  // Show skip assessment modal if not completed (instead of hard redirect)
  useEffect(() => {
    if (!isLoading && !hasAssessment) {
      setShowSkipAssessmentModal(true);
    }
  }, [isLoading, hasAssessment]);
  
  // Set initial week to recommended starting week (only if not set via URL)
  // Note: Now handled reactively via the selectedWeek derivation above
  useEffect(() => {
    if (startingWeek && !urlWeek) {
      // Set URL to starting week so the state is persisted and shareable
      setSelectedWeek(startingWeek);
    }
  }, [startingWeek, urlWeek]);

  // Handle URL params for direct tactic navigation
  useEffect(() => {
    const tacticId = searchParams.get('tactic');
    if (tacticId && tactics.length > 0) {
      // Find the tactic and its week
      const targetTactic = tactics.find(t => t.tactic_id === tacticId);
      if (targetTactic && targetTactic.week_assignment) {
        // Set the week to display this tactic
        setSelectedWeek(targetTactic.week_assignment);
        // Highlight the tactic
        setHighlightedTacticId(tacticId);

        // AUTO-OPEN the accordion for this category
        const category = targetTactic.category;
        if (category && !openAccordionItems.includes(category)) {
          setOpenAccordionItems(prev => [...prev, category]);
        }
      }
    }
  }, [searchParams, tactics]);

  // Scroll to tactic when ref becomes available (after accordion opens)
  useEffect(() => {
    if (highlightedTacticId) {
      // Check if ref is available now
      const tacticElement = tacticRefs.current[highlightedTacticId];
      if (tacticElement) {
        // Small delay to ensure accordion animation completes
        setTimeout(() => {
          tacticElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);

        // Clear highlight after 5 seconds
        const timer = setTimeout(() => {
          setHighlightedTacticId(null);
        }, 5000);

        return () => clearTimeout(timer);
      }
    }
  }, [highlightedTacticId, openAccordionItems]);

  // Merge tactics with progress data
  const tacticsWithProgress: TacticWithProgress[] = tactics.map(tactic => {
    const progress = progressData?.find(p => p.tactic_id === tactic.tactic_id);
    return {
      ...tactic,
      progress,
      status: progress?.status || 'not_started',
      completedAt: progress?.completed_at || undefined,
      notes: progress?.notes || undefined,
    };
  });

  // Create a map of tactic IDs to names for prerequisite display
  const tacticNameMap: Record<string, string> = {};
  tacticsWithProgress.forEach(tactic => {
    tacticNameMap[tactic.tactic_id] = tactic.tactic_name;
  });
  
  if (isLoading) {
    return (
      <SidebarLayout mode="roadmap">
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </SidebarLayout>
    );
  }
  
  // Calculate week summaries
  const weekSummaries: WeekSummary[] = Array.from({ length: recommendedWeeks }, (_, i) => {
    const weekNum = i + 1;
    const summary = calculateWeekProgress(tacticsWithProgress, weekNum);
    if (weekNum === startingWeek) {
      summary.isRecommendedStart = true;
    }
    return summary;
  });
  
  /**
   * Multi-field search for tactics - "Google for Grouphomes"
   * Searches name, categories, descriptions, tips, and instructions
   * Includes synonym expansion for industry-specific terminology
   * @param tactic The tactic to check
   * @param query The search query (case-insensitive)
   * @returns true if the tactic matches the search query or any synonyms
   */
  const tacticMatchesSearch = (tactic: TacticWithProgress, query: string): boolean => {
    if (!query) return true;

    // Expand query to include synonyms (e.g., "reentry" -> ["reentry", "returning_citizens", ...])
    const searchTerms = expandSearchTerms(query);

    // Check if ANY expanded term matches ANY field
    return searchTerms.some(term => {
      const q = term.toLowerCase();

      // Primary fields (title/category matches)
      const primaryMatch =
        tactic.tactic_name.toLowerCase().includes(q) ||
        tactic.category.toLowerCase().includes(q) ||
        (tactic.parent_category?.toLowerCase().includes(q) ?? false);

      if (primaryMatch) return true;

      // Content fields (rich text - where "Marketing" appears in descriptions/instructions)
      const contentMatch =
        (tactic.why_it_matters?.toLowerCase().includes(q) ?? false) ||
        ((tactic as any).instructions?.toLowerCase().includes(q) ?? false) ||
        (tactic.lynettes_tip?.toLowerCase().includes(q) ?? false) ||
        (tactic.official_lynette_quote?.toLowerCase().includes(q) ?? false);

      // Also check target_populations field for population-specific searches
      const populationMatch =
        ((tactic as any).target_populations?.some((p: string) => p.toLowerCase().includes(q)) ?? false);

      return contentMatch || populationMatch;
    });
  };

  // Filter tactics - Hybrid approach with hierarchical category support
  const filteredTactics = tacticsWithProgress.filter(tactic => {
    // When search, category filter, or population filter is active, show tactics from ALL weeks (grouped later)
    // When all filters are 'all'/empty, maintain week-specific view
    const hasActiveFilter = searchQuery !== '' || categoryFilter !== 'all' || populationFilter.length > 0 || sourceFilter !== 'all';
    const matchesWeek = hasActiveFilter
      ? true // Show all weeks when filtering by search, category, or population
      : tactic.week_assignment === selectedWeek;

    const matchesSearch = tacticMatchesSearch(tactic, searchQuery);

    // Source filter: Check tactic_source field (fallback to legacy is_mentorship_tactic and tactic_id prefix)
    const matchesSource = (() => {
      if (sourceFilter === 'all') return true;

      // Prefer tactic_source field if available
      if (tactic.tactic_source) {
        return tactic.tactic_source === sourceFilter;
      }

      // Fallback to legacy logic for backwards compatibility (when tactic_source not set)
      const isMentorshipTactic = tactic.is_mentorship_tactic || tactic.tactic_id.startsWith('M');
      if (sourceFilter === 'mentorship') return isMentorshipTactic;
      if (sourceFilter === 'general') return !isMentorshipTactic && tactic.tactic_id.startsWith('T');
      // Note: cashflow_course tactics should all have tactic_source='cashflow_course' after migrations
      if (sourceFilter === 'cashflow_course') return false; // Fallback: no legacy cashflow identification

      return false;
    })();

    // Enhanced category matching: support both parent categories and subcategories
    const matchesCategory = (() => {
      if (categoryFilter === 'all') return true;

      // Check if filter is a parent category
      if (isParentCategory(categoryFilter)) {
        // Find the hierarchy group and check if tactic's category is in subcategories
        const hierarchyGroup = CATEGORY_HIERARCHY.find(h => h.parent === categoryFilter);
        return hierarchyGroup?.subcategories.includes(tactic.category) || false;
      }

      // Otherwise, exact subcategory match
      return tactic.category === categoryFilter;
    })();

    const matchesStatus = statusFilter === 'all' || tactic.status === statusFilter;

    // Population filter: OR logic - show tactics that serve ANY selected population
    const matchesPopulation = (() => {
      if (populationFilter.length === 0) return true; // No filter = show all

      // Get tactic's target populations (may be array or undefined)
      const tacticPopulations = (tactic as any).target_populations as string[] | undefined;

      // If tactic has no populations specified or includes 'all', show it
      if (!tacticPopulations || tacticPopulations.length === 0) return true;
      if (tacticPopulations.includes('all')) return true;

      // Check if ANY selected population matches ANY tactic population (OR logic)
      return populationFilter.some(selectedPop =>
        tacticPopulations.includes(selectedPop)
      );
    })();

    return matchesWeek && matchesSearch && matchesSource && matchesCategory && matchesStatus && matchesPopulation;
  });
  
  // Group by category (for default week-specific view)
  const tacticsByCategory = filteredTactics.reduce((acc, tactic) => {
    if (!acc[tactic.category]) {
      acc[tactic.category] = [];
    }
    acc[tactic.category].push(tactic);
    return acc;
  }, {} as Record<string, TacticWithProgress[]>);

  // Group by week (for cross-week filtered view when search, category, or population filter is active)
  const hasActiveFilter = searchQuery !== '' || categoryFilter !== 'all' || populationFilter.length > 0 || sourceFilter !== 'all';
  const tacticsByWeek = hasActiveFilter
    ? filteredTactics.reduce((acc, tactic) => {
        const week = tactic.week_assignment;
        if (!acc[week]) {
          acc[week] = [];
        }
        acc[week].push(tactic);
        return acc;
      }, {} as Record<number, TacticWithProgress[]>)
    : null;

  const currentWeekSummary = weekSummaries.find(w => w.weekNumber === selectedWeek);
  const currentPhase = JOURNEY_PHASES.find(p => p.weeks.includes(selectedWeek));
  
  return (
    <SidebarLayout
      mode="roadmap"
      showHeader
      headerTitle={`Week ${selectedWeek}: ${currentPhase?.name || 'Foundation Building'}`}
      headerSubtitle={`${currentPhase?.icon || '🎯'} ${currentPhase?.description || 'Your personalized roadmap'}`}
    >
      <div className="min-h-screen bg-muted/30">
      
      <div className="container mx-auto px-4 py-8">

        {/* Incomplete Strategy Profile Banner */}
        {isStrategyIncomplete && (
          <Card className="p-4 mb-6 bg-amber-50 border-amber-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-amber-600" />
                <div>
                  <h3 className="font-semibold text-amber-900">Complete Your Strategy Profile</h3>
                  <p className="text-sm text-amber-700">
                    Set your ownership strategy and immediate priorities for better personalization.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setShowUpdateModal(true)}
                className="bg-amber-600 hover:bg-amber-700"
              >
                <Settings className="w-4 h-4 mr-2" />
                Update Profile
              </Button>
            </div>
          </Card>
        )}




        {/* Main Content - Full Width (sidebar now in left navigation) */}
        <div className="space-y-6">
            {/* Filters */}
            <Card className="p-4 mb-6">
              {/* Source Filter - Mobile-optimized grid layout */}
              <div className="space-y-3 mb-4 pb-4 border-b">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-muted-foreground">Tactic Source:</span>
                </div>
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                  <Button
                    variant={sourceFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSourceFilter('all')}
                    className="gap-1 text-xs sm:text-sm justify-start sm:justify-center"
                  >
                    <BookOpen className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">All</span>
                  </Button>
                  <Button
                    variant={sourceFilter === 'mentorship' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSourceFilter('mentorship')}
                    className="gap-1 text-xs sm:text-sm justify-start sm:justify-center bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600"
                    style={sourceFilter === 'mentorship' ? {} : { background: 'transparent', color: 'inherit' }}
                  >
                    <GraduationCap className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">Mentorship</span>
                  </Button>
                  <Button
                    variant={sourceFilter === 'cashflow_course' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSourceFilter('cashflow_course')}
                    className="gap-1 text-xs sm:text-sm justify-start sm:justify-center bg-gradient-to-r from-green-500 to-teal-500 text-white hover:from-green-600 hover:to-teal-600"
                    style={sourceFilter === 'cashflow_course' ? {} : { background: 'transparent', color: 'inherit' }}
                  >
                    <BookOpen className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">Cashflow</span>
                  </Button>
                  <Button
                    variant={sourceFilter === 'general' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSourceFilter('general')}
                    className="gap-1 text-xs sm:text-sm justify-start sm:justify-center"
                  >
                    <BookOpen className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">General</span>
                  </Button>
                </div>
              </div>

              {/* Existing Filters Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tactics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[400px]">
                    <SelectItem value="all">
                      All Categories ({tacticsWithProgress.length} tactics)
                    </SelectItem>

                    {/* Hierarchical Category Groups */}
                    {CATEGORY_HIERARCHY
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map(group => {
                        const parentTactics = tacticsWithProgress.filter(t =>
                          group.subcategories.includes(t.category)
                        );

                        return (
                          <SelectGroup key={group.parent}>
                            {/* Parent Category (bold header) */}
                            <SelectLabel className="flex items-center gap-2 py-2 font-semibold">
                              <span className="text-lg">{group.icon}</span>
                              <span className="flex-1">{group.parent}</span>
                              <Badge variant="outline" className="ml-auto text-xs">
                                {parentTactics.length}
                              </Badge>
                            </SelectLabel>

                            {/* Parent Category as Selectable Option */}
                            <SelectItem
                              value={group.parent}
                              className="font-medium pl-2"
                            >
                              <span className="flex items-center gap-2">
                                <span>{group.icon}</span>
                                All {group.parent}
                                <span className="text-muted-foreground ml-auto">
                                  ({parentTactics.length} tactics)
                                </span>
                              </span>
                            </SelectItem>

                            {/* Subcategories (indented) */}
                            {group.subcategories.map(subcat => {
                              const subcatTactics = tacticsWithProgress.filter(t => t.category === subcat);
                              if (subcatTactics.length === 0) return null;

                              return (
                                <SelectItem
                                  key={subcat}
                                  value={subcat}
                                  className="pl-10 text-sm"
                                >
                                  <span className="flex items-center justify-between w-full">
                                    <span>{subcat}</span>
                                    <span className="text-muted-foreground ml-2">
                                      ({subcatTactics.length})
                                    </span>
                                  </span>
                                </SelectItem>
                              );
                            })}
                          </SelectGroup>
                        );
                      })}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>

                {/* Population Filter - Multi-select with checkboxes */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start font-normal"
                    >
                      <Users className="mr-2 h-4 w-4" />
                      {populationFilter.length === 0 ? (
                        'All Populations'
                      ) : populationFilter.length === 1 ? (
                        POPULATION_OPTIONS.find(p => p.value === populationFilter[0])?.label
                      ) : (
                        `${populationFilter.length} populations`
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3" align="start">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Filter by Population</span>
                        {populationFilter.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => setPopulationFilter([])}
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                      <div className="space-y-2">
                        {POPULATION_OPTIONS.map((option) => (
                          <label
                            key={option.value}
                            className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 rounded-md p-1.5 -mx-1.5"
                          >
                            <Checkbox
                              checked={populationFilter.includes(option.value)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setPopulationFilter([...populationFilter, option.value]);
                                } else {
                                  setPopulationFilter(populationFilter.filter(v => v !== option.value));
                                }
                              }}
                            />
                            <span className="text-base">{option.icon}</span>
                            <span className="text-sm">{option.label}</span>
                          </label>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground pt-2 border-t">
                        Shows tactics for ANY selected population
                      </p>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </Card>

            {/* Week 1 Mentorship Checklist - Show when Week 1 is selected and mentorship filter is active or all */}
            {selectedWeek === 1 && (sourceFilter === 'all' || sourceFilter === 'mentorship') && (
              <Week1Checklist
                tactics={tacticsWithProgress}
                progressData={progressData || []}
                onStartTactic={(id) => {
                  if (!user?.id) return;
                  startTactic.mutate({
                    userId: user.id,
                    tacticId: id
                  });
                }}
                onCompleteTactic={async (id) => {
                  if (!user?.id) return;
                  completeTactic.mutate({
                    userId: user.id,
                    tacticId: id,
                    notes: '',
                    profileUpdates: {}
                  });
                }}
                onSchedule={handleScheduleTactic}
              />
            )}

            {/* Lesson 2 Mentorship Checklist - Show when Week 2 is selected and mentorship filter is active or all */}
            {selectedWeek === 2 && (sourceFilter === 'all' || sourceFilter === 'mentorship') && (
              <Week2Checklist
                tactics={tacticsWithProgress}
                progressData={progressData || []}
                onStartTactic={(id) => {
                  if (!user?.id) return;
                  startTactic.mutate({
                    userId: user.id,
                    tacticId: id
                  });
                }}
                onCompleteTactic={async (id) => {
                  if (!user?.id) return;
                  completeTactic.mutate({
                    userId: user.id,
                    tacticId: id,
                    notes: '',
                    profileUpdates: {}
                  });
                }}
                onSchedule={handleScheduleTactic}
              />
            )}

            {/* Lesson 3 Mentorship Checklist - Show when Week 3 is selected and mentorship filter is active or all */}
            {selectedWeek === 3 && (sourceFilter === 'all' || sourceFilter === 'mentorship') && (
              <Week3Checklist
                tactics={tacticsWithProgress}
                progressData={progressData || []}
                onStartTactic={(id) => {
                  if (!user?.id) return;
                  startTactic.mutate({
                    userId: user.id,
                    tacticId: id
                  });
                }}
                onCompleteTactic={async (id) => {
                  if (!user?.id) return;
                  completeTactic.mutate({
                    userId: user.id,
                    tacticId: id,
                    notes: '',
                    profileUpdates: {}
                  });
                }}
                onSchedule={handleScheduleTactic}
              />
            )}

            {/* Lesson 4 Mentorship Checklist - Show when Week 4 is selected and mentorship filter is active or all */}
            {selectedWeek === 4 && (sourceFilter === 'all' || sourceFilter === 'mentorship') && (
              <Week4Checklist
                tactics={tacticsWithProgress}
                progressData={progressData || []}
                onStartTactic={(id) => {
                  if (!user?.id) return;
                  startTactic.mutate({
                    userId: user.id,
                    tacticId: id
                  });
                }}
                onCompleteTactic={async (id) => {
                  if (!user?.id) return;
                  completeTactic.mutate({
                    userId: user.id,
                    tacticId: id,
                    notes: '',
                    profileUpdates: {}
                  });
                }}
                onSchedule={handleScheduleTactic}
              />
            )}

            {/* Lesson 5 Mentorship Checklist - Show when Week 5 is selected and mentorship filter is active or all */}
            {selectedWeek === 5 && (sourceFilter === 'all' || sourceFilter === 'mentorship') && (
              <Week5Checklist
                tactics={tacticsWithProgress}
                progressData={progressData || []}
                onStartTactic={(id) => {
                  if (!user?.id) return;
                  startTactic.mutate({
                    userId: user.id,
                    tacticId: id
                  });
                }}
                onCompleteTactic={async (id) => {
                  if (!user?.id) return;
                  completeTactic.mutate({
                    userId: user.id,
                    tacticId: id,
                    notes: '',
                    profileUpdates: {}
                  });
                }}
                onSchedule={handleScheduleTactic}
              />
            )}

            {/* Lesson 6 Mentorship Checklist - Show when Week 6 is selected and mentorship filter is active or all */}
            {selectedWeek === 6 && (sourceFilter === 'all' || sourceFilter === 'mentorship') && (
              <Week6Checklist
                tactics={tacticsWithProgress}
                progressData={progressData || []}
                onStartTactic={(id) => {
                  if (!user?.id) return;
                  startTactic.mutate({
                    userId: user.id,
                    tacticId: id
                  });
                }}
                onCompleteTactic={async (id) => {
                  if (!user?.id) return;
                  completeTactic.mutate({
                    userId: user.id,
                    tacticId: id,
                    notes: '',
                    profileUpdates: {}
                  });
                }}
                onSchedule={handleScheduleTactic}
              />
            )}

            {/* Tactics Display - Conditional based on filter mode */}
            {hasActiveFilter && tacticsByWeek ? (
              /* Week-grouped view when category or population filter is active */
              filteredTactics.length > 0 ? (
                <div className="space-y-6">
                  {/* Header showing cross-week results */}
                  <Card className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border-purple-200 dark:border-purple-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">
                          {searchQuery
                            ? `Search: "${searchQuery}"`
                            : populationFilter.length > 0 && categoryFilter === 'all'
                            ? `${populationFilter.map(p => POPULATION_OPTIONS.find(o => o.value === p)?.label).join(' + ')} Tactics`
                            : populationFilter.length > 0
                            ? `${categoryFilter} + ${populationFilter.length} Population${populationFilter.length > 1 ? 's' : ''}`
                            : `${categoryFilter} Tactics`} - All Weeks
                        </h3>
                        <p className="text-sm text-purple-700 dark:text-purple-300">
                          Showing {filteredTactics.length} tactics across {Object.keys(tacticsByWeek).length} weeks
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSearchQuery('');
                          setCategoryFilter('all');
                          setPopulationFilter([]);
                          setSourceFilter('all');
                        }}
                        className="text-purple-600 hover:text-purple-700"
                      >
                        Clear Filters
                      </Button>
                    </div>
                  </Card>

                  {/* Tactics grouped by week */}
                  {Object.entries(tacticsByWeek)
                    .sort(([weekA], [weekB]) => Number(weekA) - Number(weekB))
                    .map(([week, weekTactics]) => (
                      <div key={week} className="space-y-3">
                        {/* Week Header */}
                        <div className="flex items-center gap-3 sticky top-0 bg-muted/30 backdrop-blur-sm py-2 z-10">
                          <Badge variant="outline" className="px-3 py-1">
                            Week {week}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {weekTactics.filter(t => t.status === 'completed').length}/{weekTactics.length} completed
                          </span>
                        </div>

                        {/* Week Tactics */}
                        <div className="space-y-3 pl-4 border-l-2 border-purple-200 dark:border-purple-800">
                          {weekTactics.map(tactic => (
                            <div
                              key={tactic.tactic_id}
                              ref={(el) => { tacticRefs.current[tactic.tactic_id] = el; }}
                              className={`transition-all duration-500 ${
                                highlightedTacticId === tactic.tactic_id
                                  ? 'ring-4 ring-primary ring-offset-2 rounded-lg'
                                  : ''
                              }`}
                            >
                              <TacticCard
                                tactic={tactic}
                                tacticNameMap={tacticNameMap}
                                onStart={(id) => {
                                  if (!user?.id) return;
                                  startTactic.mutate({
                                    userId: user.id,
                                    tacticId: id
                                  });
                                }}
                                onSaveNotes={(id, notes) => {
                                  if (!user?.id) return;
                                  saveNotes.mutate({
                                    userId: user.id,
                                    tacticId: id,
                                    notes
                                  });
                                }}
                                onSchedule={handleScheduleTactic}
                                onComplete={async (id, notes, profileUpdates) => {
                                  if (!user?.id) return;

                                  if (profileUpdates && Object.keys(profileUpdates).length > 0) {
                                    try {
                                      await updateBusinessProfile(user.id, profileUpdates, id);
                                      toast.success('Business profile updated!', { duration: 2000 });
                                    } catch (error) {
                                      console.error('Failed to update business profile:', error);
                                      toast.error('Failed to update profile, but tactic will be marked complete');
                                    }
                                  }

                                  completeTactic.mutate({
                                    userId: user.id,
                                    tacticId: id,
                                    notes
                                  });
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <Card className="p-12 text-center">
                  <p className="text-muted-foreground mb-4">
                    No tactics found matching your filters in any week.
                  </p>
                  <Button onClick={() => {
                    setCategoryFilter('all');
                    setStatusFilter('all');
                    setPopulationFilter([]);
                    setSearchQuery('');
                  }}>
                    Clear All Filters
                  </Button>
                </Card>
              )
            ) : (
              /* Category-grouped view (default week-specific) */
              Object.keys(tacticsByCategory).length > 0 ? (
              <Accordion
                type="multiple"
                value={openAccordionItems}
                onValueChange={setOpenAccordionItems}
                className="space-y-4"
              >
                {Object.entries(tacticsByCategory)
                  .sort(([catA], [catB]) => {
                    // Always show "Implementation" category first
                    if (catA === 'Implementation') return -1;
                    if (catB === 'Implementation') return 1;
                    // Otherwise maintain original order
                    return 0;
                  })
                  .map(([category, categoryTactics]) => (
                  <AccordionItem key={category} value={category}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{category}</span>
                          {categoryTactics.some(t => t.is_critical_path) && (
                            <Star className="w-4 h-4 text-amber-500 fill-amber-200" />
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {categoryTactics.some(t => 'can_start' in t && !(t as TacticWithPrerequisites).can_start) && (
                            <span className="flex items-center gap-1 text-xs text-amber-600">
                              <LockIcon className="w-3 h-3" />
                              {categoryTactics.filter(t => 'can_start' in t && !(t as TacticWithPrerequisites).can_start).length} locked
                            </span>
                          )}
                          <span className="text-sm text-muted-foreground">
                            {categoryTactics.filter(t => t.status === 'completed').length}/
                            {categoryTactics.length} completed
                          </span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pt-3">
                        {categoryTactics.map(tactic => (
                          <div
                            key={tactic.tactic_id}
                            ref={(el) => { tacticRefs.current[tactic.tactic_id] = el; }}
                            className={`transition-all duration-500 ${
                              highlightedTacticId === tactic.tactic_id
                                ? 'ring-4 ring-primary ring-offset-2 rounded-lg'
                                : ''
                            }`}
                          >
                            <TacticCard
                              tactic={tactic}
                              tacticNameMap={tacticNameMap}
                              onStart={(id) => {
                                if (!user?.id) return;
                                startTactic.mutate({
                                  userId: user.id,
                                  tacticId: id
                                });
                              }}
                              onSaveNotes={(id, notes) => {
                                if (!user?.id) return;
                                saveNotes.mutate({
                                  userId: user.id,
                                  tacticId: id,
                                  notes
                                });
                              }}
                              onSchedule={handleScheduleTactic}
                              onComplete={async (id, notes, profileUpdates) => {
                                if (!user?.id) return;

                                // Update business profile first if there are updates
                                if (profileUpdates && Object.keys(profileUpdates).length > 0) {
                                  try {
                                    await updateBusinessProfile(user.id, profileUpdates, id);
                                    toast.success('Business profile updated!', { duration: 2000 });
                                  } catch (error) {
                                    console.error('Failed to update business profile:', error);
                                    toast.error('Failed to update profile, but tactic will be marked complete');
                                  }
                                }

                                // Then mark tactic as complete
                                completeTactic.mutate({
                                  userId: user.id,
                                  tacticId: id,
                                  notes
                                });
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground mb-4">
                  No tactics found matching your filters in Week {selectedWeek}.
                </p>
                <Button
                  variant="link"
                  onClick={() => {
                    setSearchQuery('');
                    setCategoryFilter('all');
                    setStatusFilter('all');
                    setPopulationFilter([]);
                  }}
                >
                  Clear filters
                </Button>
              </Card>
            )
          )}
        </div>
      </div>

      {/* Update Strategy Modal */}
      <UpdateStrategyModal
        open={showUpdateModal}
        onOpenChange={setShowUpdateModal}
        currentData={{
          ownershipModel: assessment?.ownership_model,
          targetState: assessment?.target_state,
          propertyStatus: undefined,
          immediatePriority: assessment?.immediate_priority,
        }}
        onSuccess={handleStrategyUpdateSuccess}
      />

      {/* Skip Assessment Modal */}
      {user?.id && (
        <SkipAssessmentModal
          isOpen={showSkipAssessmentModal}
          onClose={() => {
            setShowSkipAssessmentModal(false);
            navigate('/assessment');
          }}
          onSkip={() => {
            setShowSkipAssessmentModal(false);
            queryClient.invalidateQueries({ queryKey: ['assessment'] });
            queryClient.invalidateQueries({ queryKey: ['personalizedTactics'] });
          }}
          userId={user.id}
        />
      )}

      {/* Quick Schedule Modal for adding tactics to Model Week */}
      <QuickScheduleModal
        open={!!scheduleModalTactic}
        onClose={() => setScheduleModalTactic(null)}
        tactic={scheduleModalTactic}
      />
      </div>
    </SidebarLayout>
  );
}

