import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Loader2, Search, TrendingUp, Star, Lock, ChevronDown, ChevronUp,
  Settings, AlertCircle, MapPin, Building2, FileCheck, Trophy, CheckCircle,
  Award, ArrowLeft
} from 'lucide-react';
import { usePersonalizedTactics } from '@/hooks/usePersonalizedTactics';
import { useStartTactic, useCompleteTactic, useSaveNotes, calculateWeekProgress, useUserProgress } from '@/services/progressService';
import { WeekProgressCard } from '@/components/roadmap/WeekProgressCard';
import { TacticCard } from '@/components/roadmap/TacticCard';
import { TacticWithProgress, WeekSummary, JourneyPhase, TacticWithPrerequisites } from '@/types/tactic';
import { JOURNEY_PHASES } from '@/config/categories';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { JourneyMap } from '@/components/roadmap/JourneyMap';
import { useAuth } from '@/contexts/AuthContext';
import { updateBusinessProfile } from '@/services/businessProfileService';
import { BusinessProfile } from '@/types/assessment';
import { toast } from 'sonner';
import { UpdateStrategyModal } from '@/components/modals/UpdateStrategyModal';
import { SkipAssessmentModal } from '@/components/modals/SkipAssessmentModal';
import { formatCostRange } from '@/services/tacticFilterService';
import { CATEGORY_HIERARCHY, getCategoryIcon, isParentCategory, isSubcategory, getParentCategory } from '@/config/categoryHierarchy';
import { PersonalizationBadge } from '@/components/PersonalizationBadge';

export default function RoadmapPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [highlightedTacticId, setHighlightedTacticId] = useState<string | null>(null);
  const [openAccordionItems, setOpenAccordionItems] = useState<string[]>([]);
  const [showJourneyMap, setShowJourneyMap] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showSkipAssessmentModal, setShowSkipAssessmentModal] = useState(false);
  const [businessProfile, setBusinessProfile] = useState<any>(null);
  const [onboardingData, setOnboardingData] = useState<any>(null);
  const tacticRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const {
    tactics,
    assessment,
    recommendedWeeks,
    startingWeek,
    isLoading,
    hasAssessment,
    costBreakdown,
    blockedTactics,
    criticalPathTactics
  } = usePersonalizedTactics();

  const { data: progressData } = useUserProgress(user?.id || '');
  const startTactic = useStartTactic();
  const completeTactic = useCompleteTactic();
  const saveNotes = useSaveNotes();

  // Fetch business profile and onboarding data
  const fetchProfile = async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('user_onboarding')
      .select('*')
      .eq('user_id', user.id)
      .single();
    setBusinessProfile(data);
    setOnboardingData(data);
  };

  useEffect(() => {
    fetchProfile();
  }, [user?.id, hasAssessment]);

  // Handle successful strategy update
  const handleStrategyUpdateSuccess = () => {
    fetchProfile();
    window.location.reload();
  };

  // Check if strategy profile is incomplete
  const isStrategyIncomplete = !assessment?.ownership_model || !assessment?.target_state || !assessment?.immediate_priority;

  // Calculate milestones
  const completedTactics = progressData?.filter(p => p.status === 'completed').length || 0;
  const inProgressTactics = progressData?.filter(p => p.status === 'in_progress').length || 0;
  const totalTactics = tactics.length;
  const overallProgressPercent = totalTactics > 0 ? (completedTactics / totalTactics) * 100 : 0;

  const milestones = [
    { name: 'First Tactic', achieved: completedTactics >= 1, icon: <CheckCircle className="w-4 h-4" /> },
    { name: '25% Complete', achieved: overallProgressPercent >= 25, icon: <Trophy className="w-4 h-4" /> },
    { name: '10 Tactics', achieved: completedTactics >= 10, icon: <Award className="w-4 h-4" /> },
    { name: '50% Complete', achieved: overallProgressPercent >= 50, icon: <Star className="w-4 h-4" /> },
  ];
  
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
  
  // Set initial week to recommended starting week
  useEffect(() => {
    if (startingWeek && selectedWeek === 1) {
      setSelectedWeek(startingWeek);
    }
  }, [startingWeek]);

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
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
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

  // Calculate journey map data
  const calculatePhaseProgress = (): Record<JourneyPhase, number> => {
    const progress: Record<JourneyPhase, number> = {
      foundation: 0,
      market_entry: 0,
      acquisition: 0,
      operations: 0,
      growth: 0,
    };

    JOURNEY_PHASES.forEach(phase => {
      const phaseTactics = tacticsWithProgress.filter(t => {
        const tacticWeek = t.week_assignment || 0;
        return phase.weeks.includes(tacticWeek);
      });
      
      const completedTactics = phaseTactics.filter(t => t.status === 'completed').length;
      progress[phase.phase] = phaseTactics.length > 0 
        ? (completedTactics / phaseTactics.length) * 100 
        : 0;
    });

    return progress;
  };

  const getCurrentPhase = (): JourneyPhase => {
    for (const phase of JOURNEY_PHASES) {
      if (phase.weeks.includes(selectedWeek)) {
        return phase.phase;
      }
    }
    return 'foundation';
  };

  const getCompletedMilestones = (): string[] => {
    const milestones: string[] = [];
    const completedTactics = tacticsWithProgress.filter(t => t.status === 'completed');
    
    if (completedTactics.length >= 5) milestones.push('First 5 Tactics Completed');
    if (completedTactics.length >= 10) milestones.push('10 Tactics Milestone');
    if (completedTactics.length >= 20) milestones.push('20 Tactics Achievement');
    
    JOURNEY_PHASES.forEach(phase => {
      const phaseTactics = tacticsWithProgress.filter(t => {
        const tacticWeek = t.week_assignment || 0;
        return phase.weeks.includes(tacticWeek);
      });
      const completedInPhase = phaseTactics.filter(t => t.status === 'completed').length;
      
      if (completedInPhase === phaseTactics.length && phaseTactics.length > 0) {
        milestones.push(`${phase.name} Completed`);
      }
    });

    return milestones;
  };

  const phaseProgress = calculatePhaseProgress();
  const currentPhaseType = getCurrentPhase();
  const completedMilestones = getCompletedMilestones();
  
  // Filter tactics - Hybrid approach with hierarchical category support
  const filteredTactics = tacticsWithProgress.filter(tactic => {
    // When category filter is active, show tactics from ALL weeks (grouped later)
    // When category filter is 'all', maintain week-specific view
    const matchesWeek = categoryFilter === 'all'
      ? tactic.week_assignment === selectedWeek
      : true; // Show all weeks when filtering by category

    const matchesSearch = searchQuery === '' ||
      tactic.tactic_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tactic.category.toLowerCase().includes(searchQuery.toLowerCase());

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

    return matchesWeek && matchesSearch && matchesCategory && matchesStatus;
  });
  
  // Group by category (for default week-specific view)
  const tacticsByCategory = filteredTactics.reduce((acc, tactic) => {
    if (!acc[tactic.category]) {
      acc[tactic.category] = [];
    }
    acc[tactic.category].push(tactic);
    return acc;
  }, {} as Record<string, TacticWithProgress[]>);

  // Group by week (for category-filtered cross-week view)
  const tacticsByWeek = categoryFilter !== 'all'
    ? filteredTactics.reduce((acc, tactic) => {
        const week = tactic.week_assignment;
        if (!acc[week]) {
          acc[week] = [];
        }
        acc[week].push(tactic);
        return acc;
      }, {} as Record<number, TacticWithProgress[]>)
    : null;

  // Get unique categories for filter
  const allCategories = [...new Set(tacticsWithProgress.map(t => t.category))].sort();
  
  const currentWeekSummary = weekSummaries.find(w => w.weekNumber === selectedWeek);
  const currentPhase = JOURNEY_PHASES.find(p => p.weeks.includes(selectedWeek));

  // Calculate overall progress
  const overallProgress = Math.round((weekSummaries.reduce((sum, w) => sum + w.completedTactics, 0) /
                           weekSummaries.reduce((sum, w) => sum + w.totalTactics, 0)) * 100) || 0;

  // Progressive week disclosure: Calculate highest unlocked week
  // Users can access current week + next 2 weeks, or any week with in-progress/completed tactics
  const getHighestUnlockedWeek = (): number => {
    // Find the highest week with any progress
    const highestProgressWeek = weekSummaries
      .filter(w => w.completedTactics > 0 || w.inProgressTactics > 0)
      .map(w => w.weekNumber)
      .reduce((max, week) => Math.max(max, week), 0);

    // Allow 2 weeks ahead of highest progress week (or week 3 minimum if no progress)
    return Math.max(3, highestProgressWeek + 2);
  };

  const highestUnlockedWeek = getHighestUnlockedWeek();

  // Filter week summaries to show only unlocked weeks
  const visibleWeekSummaries = weekSummaries.filter(w => w.weekNumber <= highestUnlockedWeek);
  
  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-gradient-hero text-primary-foreground">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-start justify-between gap-4">
            <div>
              {/* Dashboard Navigation */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="mb-3 text-primary-foreground hover:bg-primary-foreground/10 -ml-2"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>

              <h1 className="text-3xl font-bold mb-2">Your Personalized Roadmap 🗺️</h1>
              <p className="text-primary-foreground/80 mb-4">
                {assessment?.readiness_level?.replace(/_/g, ' ').toUpperCase() || 'CUSTOM'} Path • 
                Week {selectedWeek} of {recommendedWeeks}
              </p>
              
              {currentPhase && (
                <div className="flex items-center gap-2 mt-4">
                  <span className="text-3xl">{currentPhase.icon}</span>
                  <div>
                    <h2 className="font-semibold">{currentPhase.name}</h2>
                    <p className="text-sm text-primary-foreground/70">{currentPhase.description}</p>
                  </div>
                </div>
              )}
            </div>
            
            <Card className="p-4 bg-card/10 backdrop-blur border-primary-foreground/20 hidden md:flex">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8" />
                <div>
                  <p className="text-sm text-primary-foreground/70">Overall Progress</p>
                  <p className="text-2xl font-bold">
                    {overallProgress}%
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        {/* Personalization Badge - Shows how roadmap is personalized (hidden on mobile) */}
        <PersonalizationBadge
          totalTactics={343}
          filteredTactics={tactics.length}
          strategy={assessment?.ownership_model}
          populations={assessment?.target_populations}
          budget={assessment?.capital_available}
          immediatePriority={assessment?.immediate_priority}
          className="mb-6 hidden md:block"
        />

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

        {/* Milestones Badge Row */}
        <div className="mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            {milestones.map((milestone, index) => (
              <Badge
                key={index}
                variant={milestone.achieved ? 'default' : 'outline'}
                className={`${
                  milestone.achieved
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-muted/50 text-muted-foreground'
                } flex items-center gap-1`}
              >
                <span className={milestone.achieved ? 'text-amber-600' : ''}>
                  {milestone.icon}
                </span>
                {milestone.name}
                {milestone.achieved && <CheckCircle className="w-3 h-3 ml-1 text-amber-600" />}
              </Badge>
            ))}
          </div>
        </div>

        {/* Compact Week Selector (Always Visible) with Progressive Disclosure */}
        <div className="mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-muted-foreground">Week:</span>
            {visibleWeekSummaries.map(week => (
              <Button
                key={week.weekNumber}
                variant={selectedWeek === week.weekNumber ? "default" : "outline"}
                size="sm"
                className={`h-8 px-3 ${
                  selectedWeek === week.weekNumber
                    ? 'bg-primary text-primary-foreground'
                    : week.progressPercentage === 100
                      ? 'bg-green-50 border-green-300 text-green-700'
                      : week.progressPercentage > 0
                        ? 'bg-amber-50 border-amber-300 text-amber-700'
                        : ''
                }`}
                onClick={() => setSelectedWeek(week.weekNumber)}
              >
                {week.weekNumber}
                {week.isRecommendedStart && selectedWeek !== week.weekNumber && (
                  <span className="ml-1 text-xs">★</span>
                )}
              </Button>
            ))}
            {highestUnlockedWeek < recommendedWeeks && (
              <Button
                variant="ghost"
                size="sm"
                disabled
                className="h-8 px-3 text-muted-foreground cursor-not-allowed"
              >
                <Lock className="w-3 h-3 mr-1" />
                +{recommendedWeeks - highestUnlockedWeek} more weeks
              </Button>
            )}
          </div>
          {highestUnlockedWeek < recommendedWeeks && (
            <p className="text-xs text-muted-foreground mt-2">
              Complete tactics to unlock future weeks. New weeks unlock as you progress.
            </p>
          )}
        </div>

        {/* Collapsible Journey Map & Week Details (hidden on mobile) */}
        <Collapsible open={showJourneyMap} onOpenChange={setShowJourneyMap} className="mb-6 hidden md:block">
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between mb-2">
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Journey Map & Week Details
              </span>
              {showJourneyMap ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <JourneyMap
              currentPhase={currentPhaseType}
              phaseProgress={phaseProgress}
              completedMilestones={completedMilestones}
            />
            {/* Week Navigation Tiles */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {weekSummaries.map(week => (
                <WeekProgressCard
                  key={week.weekNumber}
                  week={week}
                  isActive={selectedWeek === week.weekNumber}
                  onClick={() => setSelectedWeek(week.weekNumber)}
                />
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Main Content with Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content - 3 columns */}
          <div className="lg:col-span-3">
            {/* Filters */}
            <Card className="p-4 mb-6">
              <div className="grid md:grid-cols-3 gap-4">
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
              </div>
            </Card>

            {/* Week Stats - Hidden on mobile */}
            {currentWeekSummary && (
              <Card className="hidden md:block p-6 mb-6 bg-gradient-card">
                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Week Progress</p>
                    <p className="text-2xl font-bold">
                      {currentWeekSummary.completedTactics}/{currentWeekSummary.totalTactics}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Completion</p>
                    <p className="text-2xl font-bold">{currentWeekSummary.progressPercentage.toFixed(0)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Est. Time</p>
                    <p className="text-2xl font-bold">{currentWeekSummary.estimatedHours.toFixed(1)}h</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Categories</p>
                    <p className="text-2xl font-bold">{Object.keys(tacticsByCategory).length}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Tactics Display - Conditional based on filter mode */}
            {categoryFilter !== 'all' && tacticsByWeek ? (
              /* Week-grouped view when category filter is active */
              filteredTactics.length > 0 ? (
                <div className="space-y-6">
                  {/* Header showing cross-week results */}
                  <Card className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border-purple-200 dark:border-purple-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">
                          {categoryFilter} Tactics - All Weeks
                        </h3>
                        <p className="text-sm text-purple-700 dark:text-purple-300">
                          Showing {filteredTactics.length} tactics across {Object.keys(tacticsByWeek).length} weeks
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCategoryFilter('all')}
                        className="text-purple-600 hover:text-purple-700"
                      >
                        Clear Filter
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
                {Object.entries(tacticsByCategory).map(([category, categoryTactics]) => (
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
                              <Lock className="w-3 h-3" />
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
                  }}
                >
                  Clear filters
                </Button>
              </Card>
            )
          )}
          </div>

          {/* Sidebar - 1 column */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-4">
              {/* Strategy Profile (Collapsible) */}
              <Collapsible defaultOpen={true}>
                <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                  <CollapsibleTrigger className="w-full">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Strategy Profile
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-blue-700 hover:text-blue-900"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowUpdateModal(true);
                        }}
                      >
                        <Settings className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center p-2 bg-white/50 rounded">
                        <span className="text-blue-700">Model</span>
                        <Badge className={`capitalize text-xs ${!assessment?.ownership_model ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                          {assessment?.ownership_model?.replace(/_/g, ' ') || 'Not Set'}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white/50 rounded">
                        <span className="text-blue-700">State</span>
                        <Badge variant="secondary" className={`text-xs ${!assessment?.target_state ? 'bg-amber-100 text-amber-800' : ''}`}>
                          <MapPin className="w-3 h-3 mr-1" />
                          {assessment?.target_state || 'Not Set'}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white/50 rounded">
                        <span className="text-blue-700">Priority</span>
                        <Badge variant="outline" className={`capitalize text-xs ${!assessment?.immediate_priority ? 'bg-amber-100 text-amber-800 border-amber-300' : ''}`}>
                          {assessment?.immediate_priority?.replace(/_/g, ' ') || 'Not Set'}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white/50 rounded">
                        <span className="text-blue-700">Budget</span>
                        <span className="text-xs font-semibold text-emerald-600">
                          {formatCostRange(assessment?.budget_min_usd || 0, assessment?.budget_max_usd || 50000)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white/50 rounded">
                        <span className="text-blue-700">Timeline</span>
                        <span className="font-medium text-blue-900 text-xs">{recommendedWeeks} weeks</span>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Business Profile Progress (Collapsible) */}
              {businessProfile && (
                <Collapsible defaultOpen={false}>
                  <Card className="p-4">
                    <CollapsibleTrigger className="w-full">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold flex items-center gap-2">
                          <FileCheck className="w-4 h-4 text-primary" />
                          Business Profile
                        </h4>
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Completeness</span>
                        <span className="font-medium">{businessProfile.profile_completeness || 0}%</span>
                      </div>
                      <Progress value={businessProfile.profile_completeness || 0} className="h-1.5" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3">
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between p-2 bg-muted/50 rounded">
                          <span className="text-muted-foreground">Business Name</span>
                          <span className="font-medium">{businessProfile.business_name || 'Not Set'}</span>
                        </div>
                        <div className="flex justify-between p-2 bg-muted/50 rounded">
                          <span className="text-muted-foreground">Entity Type</span>
                          <span className="font-medium capitalize">{businessProfile.entity_type?.replace(/-/g, ' ') || 'Not Set'}</span>
                        </div>
                        <div className="flex justify-between p-2 bg-muted/50 rounded">
                          <span className="text-muted-foreground">Property Status</span>
                          <span className="font-medium capitalize">{businessProfile.property_status?.replace(/-/g, ' ') || 'Not Started'}</span>
                        </div>
                        <div className="flex justify-between p-2 bg-muted/50 rounded">
                          <span className="text-muted-foreground">License Status</span>
                          <span className="font-medium capitalize">{businessProfile.license_status?.replace(/-/g, ' ') || 'Not Started'}</span>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )}

              {/* Quick Actions */}
              <Card className="p-4">
                <h4 className="font-semibold mb-3">Quick Actions</h4>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setStatusFilter('in_progress')}
                  >
                    View In Progress ({tacticsWithProgress.filter(t => t.status === 'in_progress').length})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      setStatusFilter('all');
                      setCategoryFilter('all');
                      setSearchQuery('');
                    }}
                  >
                    Reset Filters
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Update Strategy Modal */}
      <UpdateStrategyModal
        open={showUpdateModal}
        onOpenChange={setShowUpdateModal}
        currentData={{
          ownershipModel: assessment?.ownership_model,
          targetState: assessment?.target_state,
          propertyStatus: businessProfile?.property_status,
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
    </div>
  );
}

