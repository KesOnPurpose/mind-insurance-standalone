import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Trophy,
  Target,
  TrendingUp,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  Star,
  Award,
  Flame,
  MapPin,
  Building2,
  Users,
  FileCheck,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePersonalizedTactics } from '@/hooks/usePersonalizedTactics';
import { useUserProgress } from '@/services/progressService';
import { JourneyMap } from '@/components/roadmap/JourneyMap';
import { BudgetTracker } from '@/components/roadmap/BudgetTracker';
import { JOURNEY_PHASES } from '@/config/categories';
import { JourneyPhase, TacticWithPrerequisites } from '@/types/tactic';
import { supabase } from '@/integrations/supabase/client';
import { formatCostRange } from '@/services/tacticFilterService';

export function MyJourneyPage() {
  const { user } = useAuth();
  const {
    tactics,
    assessment,
    recommendedWeeks,
    costBreakdown,
    blockedTactics,
    criticalPathTactics
  } = usePersonalizedTactics();
  const { data: progressData } = useUserProgress(user?.id || '');
  const [businessProfile, setBusinessProfile] = useState<any>(null);

  // Fetch business profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;

      const { data } = await supabase
        .from('user_onboarding')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setBusinessProfile(data);
    };

    fetchProfile();
  }, [user?.id]);

  // Calculate comprehensive progress metrics
  const totalTactics = tactics.length;
  const completedTactics = progressData?.filter(p => p.status === 'completed').length || 0;
  const inProgressTactics = progressData?.filter(p => p.status === 'in_progress').length || 0;
  const overallProgress = totalTactics > 0 ? (completedTactics / totalTactics) * 100 : 0;

  // Calculate phase progress
  const phaseProgress: Record<JourneyPhase, number> = JOURNEY_PHASES.reduce((acc, phase) => {
    const phaseTactics = tactics.filter(t => phase.weeks.includes(t.week_assignment || 0));
    const phaseCompleted = phaseTactics.filter(t =>
      progressData?.some(p => p.tactic_id === t.tactic_id && p.status === 'completed')
    ).length;
    acc[phase.phase] = phaseTactics.length > 0 ? (phaseCompleted / phaseTactics.length) * 100 : 0;
    return acc;
  }, {} as Record<JourneyPhase, number>);

  // Determine current phase
  const currentPhaseIndex = JOURNEY_PHASES.findIndex((phase, index) => {
    const progress = phaseProgress[phase.phase];
    return progress < 100 || index === JOURNEY_PHASES.length - 1;
  });
  const currentPhase = JOURNEY_PHASES[currentPhaseIndex]?.phase || 'foundation';

  // Calculate critical path progress
  const criticalTactics = tactics.filter(t => t.is_critical_path);
  const completedCriticalTactics = criticalTactics.filter(t =>
    progressData?.some(p => p.tactic_id === t.tactic_id && p.status === 'completed')
  ).length;
  const criticalPathProgress = criticalTactics.length > 0
    ? (completedCriticalTactics / criticalTactics.length) * 100
    : 0;

  // Get next available critical tactic
  const nextCriticalTactic = criticalTactics.find(t => {
    const isCompleted = progressData?.some(p => p.tactic_id === t.tactic_id && p.status === 'completed');
    const canStart = 'can_start' in t ? (t as TacticWithPrerequisites).can_start : true;
    return !isCompleted && canStart;
  });

  // Calculate category completion
  const categoryProgress = tactics.reduce((acc, tactic) => {
    if (!acc[tactic.category]) {
      acc[tactic.category] = { total: 0, completed: 0 };
    }
    acc[tactic.category].total++;
    if (progressData?.some(p => p.tactic_id === tactic.tactic_id && p.status === 'completed')) {
      acc[tactic.category].completed++;
    }
    return acc;
  }, {} as Record<string, { total: number; completed: number }>);

  // Get recent completions
  const recentCompletions = progressData
    ?.filter(p => p.status === 'completed' && p.completed_at)
    .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())
    .slice(0, 5)
    .map(p => tactics.find(t => t.tactic_id === p.tactic_id))
    .filter(Boolean) || [];

  // Milestones
  const milestones = [
    { name: 'First Tactic Completed', achieved: completedTactics >= 1, icon: <CheckCircle className="w-5 h-5" /> },
    { name: '25% Journey Complete', achieved: overallProgress >= 25, icon: <Target className="w-5 h-5" /> },
    { name: '50% Journey Complete', achieved: overallProgress >= 50, icon: <TrendingUp className="w-5 h-5" /> },
    { name: '10 Tactics Mastered', achieved: completedTactics >= 10, icon: <Trophy className="w-5 h-5" /> },
    { name: 'Critical Path Started', achieved: completedCriticalTactics >= 1, icon: <Star className="w-5 h-5" /> },
    { name: 'Foundation Phase Done', achieved: phaseProgress.foundation >= 100, icon: <Building2 className="w-5 h-5" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/20 rounded-lg">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Overall Progress</p>
              <p className="text-2xl font-bold">{overallProgress.toFixed(0)}%</p>
            </div>
          </div>
          <Progress value={overallProgress} className="h-2 mt-3" />
        </Card>

        <Card className="p-6 bg-gradient-to-br from-amber-100 to-amber-50">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-200 rounded-lg">
              <Star className="w-6 h-6 text-amber-700" />
            </div>
            <div>
              <p className="text-sm text-amber-700">Critical Path</p>
              <p className="text-2xl font-bold text-amber-900">{completedCriticalTactics}/{criticalTactics.length}</p>
            </div>
          </div>
          <Progress value={criticalPathProgress} className="h-2 mt-3" />
        </Card>

        <Card className="p-6 bg-gradient-to-br from-emerald-100 to-emerald-50">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-200 rounded-lg">
              <CheckCircle className="w-6 h-6 text-emerald-700" />
            </div>
            <div>
              <p className="text-sm text-emerald-700">Tactics Completed</p>
              <p className="text-2xl font-bold text-emerald-900">{completedTactics}</p>
            </div>
          </div>
          <p className="text-xs text-emerald-600 mt-2">
            {inProgressTactics} in progress
          </p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-100 to-blue-50">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-200 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-700" />
            </div>
            <div>
              <p className="text-sm text-blue-700">Timeline</p>
              <p className="text-2xl font-bold text-blue-900">{recommendedWeeks} weeks</p>
            </div>
          </div>
          <p className="text-xs text-blue-600 mt-2">
            Personalized to your pace
          </p>
        </Card>
      </div>

      {/* Journey Map */}
      <JourneyMap
        currentPhase={currentPhase}
        phaseProgress={phaseProgress}
        completedMilestones={milestones.filter(m => m.achieved).map(m => m.name)}
      />

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="strategy">Strategy</TabsTrigger>
          <TabsTrigger value="progress">Categories</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Next Priority Tactic */}
            <Card className="p-6 col-span-2">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <ArrowRight className="w-5 h-5 text-primary" />
                Next Priority Tactic
              </h3>
              {nextCriticalTactic ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-amber-50 border-amber-300 text-amber-700">
                      <Star className="w-3 h-3 mr-1" />
                      Critical Path
                    </Badge>
                    <Badge>{nextCriticalTactic.category}</Badge>
                  </div>
                  <h4 className="text-lg font-medium">{nextCriticalTactic.tactic_name}</h4>
                  {nextCriticalTactic.why_it_matters && (
                    <p className="text-sm text-muted-foreground">{nextCriticalTactic.why_it_matters}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm">
                    {nextCriticalTactic.estimated_time && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {nextCriticalTactic.estimated_time}
                      </span>
                    )}
                    {(nextCriticalTactic.cost_min_usd || nextCriticalTactic.cost_max_usd) && (
                      <span className="flex items-center gap-1 text-emerald-600">
                        <DollarSign className="w-4 h-4" />
                        {formatCostRange(nextCriticalTactic.cost_min_usd ?? null, nextCriticalTactic.cost_max_usd ?? null)}
                      </span>
                    )}
                  </div>
                  <Button asChild className="w-full mt-2">
                    <Link to="/roadmap">
                      Start This Tactic
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Trophy className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                  <p className="font-medium">All critical tactics complete!</p>
                  <p className="text-sm text-muted-foreground">You're on the right path</p>
                </div>
              )}
            </Card>

            {/* Budget Tracker */}
            <div>
              <BudgetTracker
                costBreakdown={costBreakdown}
                userBudgetMax={assessment?.budget_max_usd || 50000}
                criticalPathCount={criticalPathTactics}
                blockedTacticsCount={blockedTactics}
              />
            </div>
          </div>

          {/* Recent Completions */}
          {recentCompletions.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                Recent Completions
              </h3>
              <div className="space-y-3">
                {recentCompletions.map((tactic, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-success" />
                      <div>
                        <p className="font-medium text-sm">{tactic?.tactic_name}</p>
                        <p className="text-xs text-muted-foreground">{tactic?.category}</p>
                      </div>
                    </div>
                    {tactic?.is_critical_path && (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 text-xs">
                        Critical
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="strategy" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strategy Profile */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Your Strategy Profile
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">Ownership Model</span>
                  <Badge className="capitalize">
                    {assessment?.ownership_model?.replace(/_/g, ' ') || 'Not Set'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">Target State</span>
                  <Badge variant="secondary">
                    <MapPin className="w-3 h-3 mr-1" />
                    {assessment?.target_state || 'Not Set'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">Budget Range</span>
                  <span className="text-sm font-semibold text-emerald-600">
                    {formatCostRange(assessment?.budget_min_usd || 0, assessment?.budget_max_usd || 50000)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">Readiness Level</span>
                  <Badge variant="outline" className="capitalize">
                    {assessment?.readiness_level?.replace(/_/g, ' ') || 'Foundation'}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Target Populations */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Target Populations
              </h3>
              <div className="flex flex-wrap gap-2">
                {assessment?.target_populations?.map((pop: string, index: number) => (
                  <Badge key={index} variant="secondary" className="capitalize">
                    {pop.replace(/-/g, ' ')}
                  </Badge>
                )) || (
                  <p className="text-sm text-muted-foreground">No populations selected</p>
                )}
              </div>
            </Card>

            {/* Business Profile Snapshot */}
            {businessProfile && (
              <Card className="p-6 col-span-full">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-primary" />
                  Business Profile Progress
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground mb-1">Business Name</p>
                    <p className="font-medium text-sm">{businessProfile.business_name || 'Not Set'}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground mb-1">Entity Type</p>
                    <p className="font-medium text-sm capitalize">{businessProfile.entity_type?.replace(/-/g, ' ') || 'Not Set'}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground mb-1">Property Status</p>
                    <p className="font-medium text-sm capitalize">{businessProfile.property_status?.replace(/-/g, ' ') || 'Not Started'}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground mb-1">License Status</p>
                    <p className="font-medium text-sm capitalize">{businessProfile.license_status?.replace(/-/g, ' ') || 'Not Started'}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Profile Completeness</span>
                    <span className="font-medium">{businessProfile.profile_completeness || 0}%</span>
                  </div>
                  <Progress value={businessProfile.profile_completeness || 0} className="h-2" />
                </div>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="progress" className="mt-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Progress by Category</h3>
            <div className="space-y-4">
              {Object.entries(categoryProgress)
                .sort(([, a], [, b]) => (b.completed / b.total) - (a.completed / a.total))
                .map(([category, progress]) => (
                  <div key={category} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm">{category}</span>
                      <span className="text-sm text-muted-foreground">
                        {progress.completed}/{progress.total} completed
                      </span>
                    </div>
                    <Progress
                      value={(progress.completed / progress.total) * 100}
                      className="h-2"
                    />
                  </div>
                ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="milestones" className="mt-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Milestones & Achievements
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {milestones.map((milestone, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    milestone.achieved
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-muted/50 border-muted'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      milestone.achieved ? 'bg-amber-200 text-amber-700' : 'bg-muted text-muted-foreground'
                    }`}>
                      {milestone.icon}
                    </div>
                    <div>
                      <p className={`font-medium ${!milestone.achieved && 'text-muted-foreground'}`}>
                        {milestone.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {milestone.achieved ? 'Achieved!' : 'Keep going...'}
                      </p>
                    </div>
                    {milestone.achieved && (
                      <CheckCircle className="w-5 h-5 text-amber-600 ml-auto" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default MyJourneyPage;
