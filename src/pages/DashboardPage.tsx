import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProgress } from "@/services/progressService";
import { usePersonalizedTactics } from "@/hooks/usePersonalizedTactics";
import { WelcomeModal } from "@/components/onboarding/WelcomeModal";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { JourneyHeroSection } from "@/components/dashboard/JourneyHeroSection";
import { NextActionCard } from "@/components/dashboard/NextActionCard";

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

  const protectStreak = userProfile?.current_streak || 0;
  const totalPoints = userProfile?.total_points || 0;

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
    <SidebarLayout>
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

      <div className="space-y-6">
        {/* Journey Hero Section - Shows week position, phase, and primary CTAs */}
        <JourneyHeroSection
          protectStreak={protectStreak}
          totalPoints={totalPoints}
          userName={onboardingData?.business_name || userProfile?.full_name}
        />

        {/* Next Action Card - Enhanced tactic recommendation */}
        <NextActionCard
          tactic={smartNextTactic?.tactic || null}
          isInProgress={smartNextTactic?.isInProgress || false}
          daysSinceStarted={smartNextTactic ? getDaysSinceStarted(smartNextTactic.tactic.tactic_id) : 0}
          isLoading={isTacticsLoading}
        />

        {/* Nette AI Quick Access - Primary CTA */}
        <Card className="p-4 sm:p-6 bg-gradient-to-r from-primary to-primary/80 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base sm:text-lg">Need Help? Ask Nette</h3>
                <p className="text-white/80 text-xs sm:text-sm">Your AI group home coach is ready to answer questions</p>
              </div>
            </div>
            <Link to="/chat" className="sm:flex-shrink-0">
              <Button className="bg-white text-primary hover:bg-gray-100 w-full sm:w-auto">
                Chat with Nette
              </Button>
            </Link>
          </div>
        </Card>

        {/* Mind Insurance - Secondary CTA */}
        <Card className="p-4 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Protect Your Mindset Today</p>
                <p className="text-xs text-muted-foreground">
                  {protectStreak === 0
                    ? "You haven't started your PROTECT streak yet"
                    : `${protectStreak} day streak - Keep it going!`}
                </p>
              </div>
            </div>
            <Link to="/mind-insurance">
              <Button variant="link" className="text-purple-600 dark:text-purple-400 font-medium p-0 h-auto">
                Start Practice →
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </SidebarLayout>
  );
};

export default DashboardPage;
