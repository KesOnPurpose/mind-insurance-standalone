import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, TrendingUp } from 'lucide-react';
import { usePersonalizedTactics } from '@/hooks/usePersonalizedTactics';
import { useStartTactic, useCompleteTactic, calculateWeekProgress, useUserProgress } from '@/services/progressService';
import { WeekProgressCard } from '@/components/roadmap/WeekProgressCard';
import { TacticCard } from '@/components/roadmap/TacticCard';
import { TacticWithProgress, WeekSummary, JourneyPhase } from '@/types/tactic';
import { JOURNEY_PHASES } from '@/config/categories';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { JourneyMap } from '@/components/roadmap/JourneyMap';
import { useAuth } from '@/contexts/AuthContext';
import { updateBusinessProfile } from '@/services/businessProfileService';
import { BusinessProfile } from '@/types/assessment';
import { toast } from 'sonner';

export default function RoadmapPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const { 
    tactics, 
    assessment, 
    recommendedWeeks, 
    startingWeek,
    isLoading,
    hasAssessment 
  } = usePersonalizedTactics();

  const { data: progressData } = useUserProgress(user?.id || '');
  const startTactic = useStartTactic();
  const completeTactic = useCompleteTactic();
  
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
  
  // Redirect to assessment if not completed
  useEffect(() => {
    if (!isLoading && !hasAssessment) {
      navigate('/assessment');
    }
  }, [isLoading, hasAssessment, navigate]);
  
  // Set initial week to recommended starting week
  useEffect(() => {
    if (startingWeek && selectedWeek === 1) {
      setSelectedWeek(startingWeek);
    }
  }, [startingWeek]);

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
  
  // Filter tactics
  const filteredTactics = tacticsWithProgress.filter(tactic => {
    const matchesWeek = tactic.week_assignment === selectedWeek;
    const matchesSearch = searchQuery === '' || 
      tactic.tactic_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tactic.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || tactic.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || tactic.status === statusFilter;
    
    return matchesWeek && matchesSearch && matchesCategory && matchesStatus;
  });
  
  // Group by category
  const tacticsByCategory = filteredTactics.reduce((acc, tactic) => {
    if (!acc[tactic.category]) {
      acc[tactic.category] = [];
    }
    acc[tactic.category].push(tactic);
    return acc;
  }, {} as Record<string, TacticWithProgress[]>);
  
  // Get unique categories for filter
  const allCategories = [...new Set(tacticsWithProgress.map(t => t.category))].sort();
  
  const currentWeekSummary = weekSummaries.find(w => w.weekNumber === selectedWeek);
  const currentPhase = JOURNEY_PHASES.find(p => p.weeks.includes(selectedWeek));
  
  // Calculate overall progress
  const overallProgress = Math.round((weekSummaries.reduce((sum, w) => sum + w.completedTactics, 0) / 
                           weekSummaries.reduce((sum, w) => sum + w.totalTactics, 0)) * 100) || 0;
  
  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-gradient-hero text-primary-foreground">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-start justify-between gap-4">
            <div>
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
            
            <Card className="p-4 bg-card/10 backdrop-blur border-primary-foreground/20">
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
        {/* Journey Map */}
        <div className="mb-8">
          <JourneyMap 
            currentPhase={currentPhaseType}
            phaseProgress={phaseProgress}
            completedMilestones={completedMilestones}
          />
        </div>

        {/* Week Navigation */}
        <div className="mb-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {weekSummaries.map(week => (
            <WeekProgressCard
              key={week.weekNumber}
              week={week}
              isActive={selectedWeek === week.weekNumber}
              onClick={() => setSelectedWeek(week.weekNumber)}
            />
          ))}
        </div>
        
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
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {allCategories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
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
        
        {/* Week Stats */}
        {currentWeekSummary && (
          <Card className="p-6 mb-6 bg-gradient-card">
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
        
        {/* Tactics by Category */}
        {Object.keys(tacticsByCategory).length > 0 ? (
          <Accordion type="multiple" className="space-y-4">
            {Object.entries(tacticsByCategory).map(([category, categoryTactics]) => (
              <AccordionItem key={category} value={category}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <span className="font-semibold">{category}</span>
                    <span className="text-sm text-muted-foreground">
                      {categoryTactics.filter(t => t.status === 'completed').length}/
                      {categoryTactics.length} completed
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-3">
                    {categoryTactics.map(tactic => (
                      <TacticCard
                        key={tactic.tactic_id}
                        tactic={tactic}
                        onStart={(id) => {
                          if (!user?.id) return;
                          startTactic.mutate({ 
                            userId: user.id, 
                            tacticId: id 
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
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">
              No tactics found matching your filters.
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
        )}
      </div>
    </div>
  );
}
