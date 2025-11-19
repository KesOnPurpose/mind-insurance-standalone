import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Target,
  Zap,
  CheckCircle2,
  ArrowRight,
  Flame,
  Trophy,
  Clipboard,
  Shield,
  MessageSquare,
  Clock,
  Star,
  Lock,
  AlertCircle,
  DollarSign,
  Users,
  Building,
  FileText,
  Briefcase,
  Home
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProgress } from "@/services/progressService";
import { BusinessProfileSnapshot } from "@/components/dashboard/BusinessProfileSnapshot";
import { usePersonalizedTactics } from "@/hooks/usePersonalizedTactics";
import { WelcomeModal } from "@/components/onboarding/WelcomeModal";
import { OnboardingProgressStepper } from "@/components/onboarding/OnboardingProgressStepper";
import { PersonalizationBadge } from "@/components/PersonalizationBadge";

const DashboardPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: userProgress } = useUserProgress(user?.id || '');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [onboardingData, setOnboardingData] = useState<any>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // Fetch personalized tactics and next recommended tactic
  const {
    tactics,
    nextTactic: dynamicNextTactic,
    isLoading: isTacticsLoading,
    criticalPathTactics,
    blockedTactics,
    assessment,
    totalTacticsCount
  } = usePersonalizedTactics();

  // Fetch user profile and onboarding data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;

      // Fetch user profile
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setUserProfile(profileData);

      // Fetch onboarding data to check if welcome should be shown
      const { data: onboardingRecord } = await supabase
        .from('user_onboarding')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setOnboardingData(onboardingRecord);

      // Show welcome modal if:
      // 1. User has completed assessment (assessment_complete step)
      // 2. User hasn't seen welcome yet
      // 3. This is their first dashboard visit after assessment
      if (onboardingRecord &&
          onboardingRecord.onboarding_step === 'assessment_complete' &&
          !onboardingRecord.has_seen_welcome) {
        setShowWelcomeModal(true);
      }
    };

    fetchProfile();
  }, [user?.id]);

  const currentWeek = userProfile?.current_week || 1;
  const totalWeeks = 12;
  const protectStreak = userProfile?.current_streak || 0;
  const totalPoints = userProfile?.total_points || 0;
  const completedTactics = userProfile?.completed_tactics_count || 0;

  // Smart next tactic selection - prioritize in-progress, critical path, and unblocked tactics
  const getSmartNextTactic = () => {
    if (!tactics || tactics.length === 0) return null;

    const completedIds = new Set(userProgress?.filter(p => p.status === 'completed').map(p => p.tactic_id) || []);
    const inProgressIds = new Set(userProgress?.filter(p => p.status === 'in_progress').map(p => p.tactic_id) || []);

    // Priority 1: Return in-progress tactic (finish what you started)
    const inProgressTactic = tactics.find(t => inProgressIds.has(t.tactic_id));
    if (inProgressTactic) {
      return { tactic: inProgressTactic, isInProgress: true };
    }

    // Priority 2: Critical path tactics that can be started
    const availableCriticalPath = tactics.find(t =>
      !completedIds.has(t.tactic_id) &&
      t.is_critical_path &&
      ('can_start' in t ? t.can_start : true)
    );
    if (availableCriticalPath) {
      return { tactic: availableCriticalPath, isInProgress: false };
    }

    // Priority 3: Any tactic that can be started
    const nextAvailable = tactics.find(t =>
      !completedIds.has(t.tactic_id) &&
      ('can_start' in t ? t.can_start : true)
    );
    if (nextAvailable) {
      return { tactic: nextAvailable, isInProgress: false };
    }

    // Priority 4: Use the hook's recommendation
    if (dynamicNextTactic) {
      return { tactic: dynamicNextTactic, isInProgress: false };
    }

    return null;
  };

  const smartNextTactic = getSmartNextTactic();

  // Calculate days since tactic was started (urgency indicator)
  const getDaysSinceStarted = (tacticId: string) => {
    const progress = userProgress?.find(p => p.tactic_id === tacticId && p.status === 'in_progress');
    if (progress?.started_at) {
      const startDate = new Date(progress.started_at);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - startDate.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return 0;
  };

  // Category icon mapping
  const getCategoryIcon = (category: string) => {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('business') || categoryLower.includes('planning')) return Briefcase;
    if (categoryLower.includes('legal') || categoryLower.includes('compliance')) return FileText;
    if (categoryLower.includes('financial') || categoryLower.includes('finance')) return DollarSign;
    if (categoryLower.includes('property') || categoryLower.includes('location')) return Home;
    if (categoryLower.includes('operations') || categoryLower.includes('staffing')) return Users;
    if (categoryLower.includes('marketing')) return Target;
    return Clipboard;
  };

  // Calculate real week progress from actual tactics data
  const calculateWeekProgress = () => {
    if (!tactics || tactics.length === 0) {
      return [];
    }

    const completedIds = new Set(userProgress?.filter(p => p.status === 'completed').map(p => p.tactic_id) || []);

    // Group tactics by category
    const categoryMap = new Map<string, { completed: number; total: number }>();

    tactics.forEach(tactic => {
      const category = tactic.category || 'Other';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { completed: 0, total: 0 });
      }
      const cat = categoryMap.get(category)!;
      cat.total++;
      if (completedIds.has(tactic.tactic_id)) {
        cat.completed++;
      }
    });

    // Color mapping for categories
    const colorMap: Record<string, string> = {
      'Business Planning': 'bg-blue-500',
      'Legal & Compliance': 'bg-purple-500',
      'Financial': 'bg-green-500',
      'Operations': 'bg-orange-500',
      'Marketing': 'bg-pink-500',
      'Property': 'bg-cyan-500',
      'Staffing': 'bg-yellow-500',
      'Licensure': 'bg-indigo-500'
    };

    // Convert to array and take top 4 categories
    const categories = Array.from(categoryMap.entries())
      .map(([name, data]) => ({
        name,
        completed: data.completed,
        total: data.total,
        color: colorMap[name] || 'bg-gray-500'
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 4);

    return categories;
  };

  const weekCategories = calculateWeekProgress();

  // Real-time subscription for progress updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('dashboard-progress-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gh_user_tactic_progress',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['userProgress'] });
          queryClient.invalidateQueries({ queryKey: ['personalizedTactics'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, user?.id]);

  return (
    <div className="space-y-6">
      {/* Onboarding Progress Stepper - show only during assessment→welcome transition */}
      {onboardingData && onboardingData.onboarding_step === 'assessment_complete' && (
        <OnboardingProgressStepper currentStep={onboardingData.onboarding_step} />
      )}

      {/* Welcome Modal - shows on first dashboard visit after assessment */}
      {onboardingData && user?.id && (
        <WelcomeModal
          isOpen={showWelcomeModal}
          onClose={() => setShowWelcomeModal(false)}
          userProfile={{
            name: onboardingData.business_name,
            readiness_level: onboardingData.readiness_level,
            ownership_model: onboardingData.ownership_model,
            timeline: onboardingData.timeline,
            overall_score: onboardingData.overall_score,
            immediate_priority: onboardingData.immediate_priority,
          }}
          userId={user.id}
        />
      )}

      {/* Hero: Your Next Move */}
      <Card className="p-8 bg-white shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">
              WEEK {currentWeek} OF {totalWeeks}
            </p>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">Your Next Move</h1>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Flame className="w-4 h-4 text-orange-500" />
              {protectStreak} day streak
            </span>
            <span>{completedTactics}/{tactics.length || 403} tactics</span>
            <span className="flex items-center gap-1">
              <Trophy className="w-4 h-4 text-primary" />
              {totalPoints} pts
            </span>
          </div>
        </div>

        {/* Dynamic Next Tactic Card */}
        {isTacticsLoading ? (
          <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-6 border border-primary/20">
            <div className="flex items-start gap-4">
              <Skeleton className="w-12 h-12 rounded-xl" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-7 w-3/4" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-10 w-40" />
              </div>
            </div>
          </div>
        ) : smartNextTactic ? (
          <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-6 border border-primary/20">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
                {(() => {
                  const IconComponent = getCategoryIcon(smartNextTactic.tactic.category || '');
                  return <IconComponent className="w-6 h-6 text-white" />;
                })()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {smartNextTactic.tactic.category}
                  </Badge>
                  {smartNextTactic.tactic.is_critical_path && (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      <Star className="w-3 h-3 mr-1 fill-amber-400" />
                      Critical Path
                    </Badge>
                  )}
                  {smartNextTactic.isInProgress && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <Clock className="w-3 h-3 mr-1" />
                      In Progress
                    </Badge>
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {smartNextTactic.tactic.tactic_name}
                </h2>
                <p className="text-gray-600 text-sm mb-4">
                  {smartNextTactic.tactic.why_it_matters ||
                    `This tactic is part of your personalized ${smartNextTactic.tactic.category?.toLowerCase() || 'group home'} journey.`}
                </p>

                {/* Urgency indicator for in-progress tactics */}
                {smartNextTactic.isInProgress && (
                  <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span className="text-sm font-medium text-amber-800">
                        {getDaysSinceStarted(smartNextTactic.tactic.tactic_id) === 0
                          ? "Started today - Great momentum!"
                          : getDaysSinceStarted(smartNextTactic.tactic.tactic_id) === 1
                            ? "Started yesterday - Keep going!"
                            : `Started ${getDaysSinceStarted(smartNextTactic.tactic.tactic_id)} days ago - Time to finish this!`}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <Link to={`/roadmap?tactic=${smartNextTactic.tactic.tactic_id}`}>
                    <Button className="bg-primary hover:bg-primary/90">
                      {smartNextTactic.isInProgress ? 'Continue This Tactic' : 'Start This Tactic'}
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                  {smartNextTactic.tactic.estimated_time && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {smartNextTactic.tactic.estimated_time}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-2">All Tactics Completed!</h2>
                <p className="text-gray-600 text-sm mb-4">
                  Congratulations! You've completed all your personalized tactics. You're ready to launch your group home business!
                </p>
                <Link to="/roadmap">
                  <Button variant="outline">
                    Review Your Roadmap
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Personalization Badge - Show transparency about how tactics are filtered */}
        {assessment && totalTacticsCount > 0 && (
          <div className="mt-6">
            <PersonalizationBadge
              totalTactics={343}
              filteredTactics={totalTacticsCount}
              strategy={assessment.ownership_model}
              populations={assessment.target_populations}
              budget={assessment.capital_available}
              immediatePriority={assessment.immediate_priority}
            />
          </div>
        )}
      </Card>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Week Progress */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Week {currentWeek}: Foundation & Vision</h3>
              <span className="text-sm text-muted-foreground">
                {weekCategories.reduce((acc, c) => acc + c.completed, 0)}/
                {weekCategories.reduce((acc, c) => acc + c.total, 0)} tactics
              </span>
            </div>

            {/* Overall Week Progress */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
              <div
                className="bg-primary h-3 rounded-full transition-all"
                style={{
                  width: `${(weekCategories.reduce((acc, c) => acc + c.completed, 0) / weekCategories.reduce((acc, c) => acc + c.total, 0)) * 100}%`
                }}
              />
            </div>

            {/* Category Breakdown */}
            <div className="grid grid-cols-2 gap-4">
              {weekCategories.map((category) => (
                <div key={category.name} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{category.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {category.completed}/{category.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${category.color} h-2 rounded-full transition-all`}
                      style={{ width: `${(category.completed / category.total) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t">
              <Link to="/roadmap">
                <Button variant="link" className="text-primary p-0 h-auto font-medium">
                  View Full Roadmap →
                </Button>
              </Link>
            </div>
          </Card>

          {/* Nette AI Quick Access */}
          <Card className="p-6 bg-gradient-to-r from-primary to-primary/80 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Need Help? Ask Nette</h3>
                  <p className="text-white/80 text-sm">Your AI group home coach is ready to answer questions</p>
                </div>
              </div>
              <Link to="/chat">
                <Button className="bg-white text-primary hover:bg-gray-100">
                  Chat with Nette
                </Button>
              </Link>
            </div>
          </Card>

          {/* Cross-Product Link: Mind Insurance */}
          <Card className="p-4 bg-purple-50 border border-purple-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Protect Your Mindset Today</p>
                  <p className="text-xs text-gray-600">
                    {protectStreak === 0
                      ? "You haven't started your PROTECT streak yet"
                      : `${protectStreak} day streak - Keep it going!`}
                  </p>
                </div>
              </div>
              <Link to="/protect">
                <Button variant="link" className="text-purple-600 font-medium p-0 h-auto">
                  Start Practice →
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Right: Business Snapshot */}
        <div className="space-y-6">
          <BusinessProfileSnapshot />

          {/* Quick Stats */}
          <Card className="p-6">
            <h3 className="font-bold mb-4">Your Journey</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Total Progress</span>
                  <span className="font-semibold">{completedTactics}/403</span>
                </div>
                <Progress value={(completedTactics / 403) * 100} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Current Level</span>
                  <span className="font-semibold">{Math.floor(totalPoints / 100)}</span>
                </div>
                <Progress value={totalPoints % 100} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {100 - (totalPoints % 100)} XP to next level
                </p>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="font-bold mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Link to="/roadmap" className="block">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Target className="w-4 h-4 mr-2" />
                  View Roadmap
                </Button>
              </Link>
              <Link to="/model-week" className="block">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Model Week
                </Button>
              </Link>
              <Link to="/chat" className="block">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Zap className="w-4 h-4 mr-2" />
                  Ask Nette AI
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
