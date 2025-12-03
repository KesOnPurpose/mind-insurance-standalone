import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { WelcomeModal } from "@/components/onboarding/WelcomeModal";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { JourneyHeroSection } from "@/components/dashboard/JourneyHeroSection";
import { ReadinessScoresCard } from "@/components/dashboard/ReadinessScoresCard";
import { ProfileSnapshotCard } from "@/components/dashboard/ProfileSnapshotCard";
import { FinancialProjectionsCard } from "@/components/dashboard/FinancialProjectionsCard";

const DashboardPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [onboardingData, setOnboardingData] = useState<any>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

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

      <div className="space-y-4 pb-20 md:pb-4">
        {/* Journey Hero Section - Shows week position, phase, and primary CTAs */}
        <JourneyHeroSection
          protectStreak={protectStreak}
          totalPoints={totalPoints}
          userName={onboardingData?.business_name || userProfile?.full_name}
        />

        {/* Readiness Scores + Profile Snapshot - Grid on desktop, stack on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ReadinessScoresCard />
          <ProfileSnapshotCard />
        </div>

        {/* Financial Projections - Auto-calculated from profile */}
        <FinancialProjectionsCard />

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
