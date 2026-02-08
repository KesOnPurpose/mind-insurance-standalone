import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Calendar, Trophy, Play, TrendingUp } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMindInsuranceProgress } from '@/hooks/useMindInsuranceProgress';
import { getTodayInTimezone } from '@/utils/timezoneUtils';
import { MindInsuranceErrorBoundary } from '@/components/mind-insurance/MindInsuranceErrorBoundary';
import { AnimatePresence } from 'framer-motion';

// Protocol Unlock System
import { useUnstartedProtocol } from '@/hooks/useUnstartedProtocol';
import { ProtocolUnlockModal } from '@/components/coverage-center/ProtocolUnlockModal';
import { ProtocolReadyBadge } from '@/components/coverage-center/ProtocolReadyBadge';
import { startProtocol } from '@/services/mioInsightProtocolService';

// Hub Tour System - uses shared context from SidebarLayout
import { useHubTourContext } from '@/contexts/HubTourContext';
import { TourOfferDialog } from '@/components/tour';
import { useSidebar } from '@/components/ui/sidebar';

// Push Notifications
import { PushNotificationPrompt } from '@/components/mind-insurance/notifications/PushNotificationPrompt';

interface DailyPracticeStatus {
  completed: number;
  total: number;
  points: number;
}

/**
 * MindInsuranceHub - Practice Hub for PROTECT Method Only
 *
 * This page is dedicated to the daily PROTECT Method practice.
 * All protocol content (MIO + Coach) has been moved to Coverage Center.
 *
 * Features:
 * - Protocol Unlock Modal (shown when unstarted protocol exists)
 * - Protocol Ready Badge (floating + dot after modal dismissed)
 * - 4-Step Hub Tour (Practice Center, Coverage Center, My Evidence, MIO)
 */
export default function MindInsuranceHub() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { data: progressData, isLoading: progressLoading } = useMindInsuranceProgress();
  const [practiceStatus, setPracticeStatus] = useState<DailyPracticeStatus>({
    completed: 0,
    total: 7,
    points: 0
  });
  const [loading, setLoading] = useState(true);

  // Protocol Unlock System
  const {
    unstartedProtocol,
    activeProtocol,
    hasUnstartedProtocol,
    isNewUser,
    isReturningUser,
    shouldShowModal,
    dismissModal,
    showBadge,
    refreshProtocol,
    setModalDelay,  // Delay modal 30 min after tour
    // Daily modal support
    currentDay,
    shouldShowDailyModal,
    dismissDailyModal,
  } = useUnstartedProtocol();

  // Hub Tour System - uses shared context from SidebarLayout
  const {
    isActive: isTourActive,
    startTour,
    skipTour,
    completeTour,
    hasCompletedTour,
  } = useHubTourContext();

  // Sidebar control for mobile tour (open sidebar for Steps 2-4)
  const { setOpenMobile, isMobile } = useSidebar();

  // State for tour offer after modal
  const [showTourOffer, setShowTourOffer] = useState(false);

  // Get stats from the hook (calculated from actual practice data)
  const userStats = {
    streak: progressData?.currentStreak || 0,
    totalPoints: progressData?.totalPoints || 0,
    championshipLevel: (progressData?.championshipLevel || 'bronze').toUpperCase()
  };

  useEffect(() => {
    if (user?.id) {
      fetchDailyStatus();
    }
  }, [user]);

  // Update loading state when progress data loads
  useEffect(() => {
    if (!progressLoading) {
      setLoading(false);
    }
  }, [progressLoading]);

  // Auto-start tour when arriving from assessment with startTour flag
  useEffect(() => {
    const state = location.state as { startTour?: boolean; justCompletedAssessment?: boolean } | null;
    if (state?.startTour && !hasCompletedTour && !loading) {
      // Small delay for page to fully render before starting tour
      const timeout = setTimeout(() => {
        startTour();
        // Clear the location state to prevent re-triggering on refresh
        window.history.replaceState({}, document.title);
      }, 400);
      return () => clearTimeout(timeout);
    }
  }, [location.state, hasCompletedTour, loading, startTour]);

  const fetchDailyStatus = async () => {
    if (!user?.id) return;

    const today = getTodayInTimezone();

    const { data, error } = await supabase
      .from('daily_practices')
      .select('practice_type, points_earned, completed')
      .eq('user_id', user.id)
      .eq('practice_date', today);

    if (!error && data) {
      const completed = data.filter(p => p.completed).length;
      const points = data.reduce((sum, p) => sum + (p.points_earned || 0), 0);

      setPracticeStatus({
        completed,
        total: 7,
        points
      });
    }
  };

  const getChampionshipColor = (level: string) => {
    switch (level) {
      case 'PLATINUM': return 'text-purple-600';
      case 'GOLD': return 'text-yellow-600';
      case 'SILVER': return 'text-gray-400';
      default: return 'text-amber-700';
    }
  };

  // Handle "Begin Day 1" from Protocol Unlock Modal
  const handleBeginDay1 = async () => {
    if (!unstartedProtocol?.id) return;

    // Start the protocol
    await startProtocol(unstartedProtocol.id);
    await refreshProtocol();

    // Dismiss the modal
    dismissModal();

    // If tour not completed, offer it
    if (!hasCompletedTour) {
      setShowTourOffer(true);
    } else {
      // Navigate directly to Coverage Center
      navigate('/mind-insurance/coverage');
    }
  };

  // Handle "Remind Me Later" from Protocol Unlock Modal
  const handleRemindLater = () => {
    dismissModal();
  };

  // Handle tour start from Tour Offer Dialog
  const handleStartTour = () => {
    setShowTourOffer(false);
    startTour();
  };

  // Handle skip tour from Tour Offer Dialog
  const handleSkipTour = () => {
    setShowTourOffer(false);
    skipTour();
    // Navigate to MIO Insights for first engagement message
    navigate('/mind-insurance/mio-insights', {
      state: { fromTour: true, showFirstEngagement: true }
    });
  };

  // Handle tour completion - close sidebar on mobile, then navigate to MIO Insights
  const handleTourComplete = () => {
    completeTour();

    // Block Protocol Modal for THIS SESSION - shows on next Hub visit instead
    // This prevents overwhelming user with modal immediately after tour
    try {
      sessionStorage.setItem('protocol_modal_blocked_this_session', 'true');
    } catch (e) {
      console.warn('[MindInsuranceHub] Could not set session storage:', e);
    }

    // Also set the 30-min delay as a fallback
    setModalDelay();

    // On mobile, close sidebar before navigating (with delay for animation)
    if (isMobile) {
      setOpenMobile(false);
      // Small delay to allow sidebar close animation
      setTimeout(() => {
        navigate('/mind-insurance/mio-insights', {
          state: { fromTour: true, showFirstEngagement: true }
        });
      }, 300);
    } else {
      // Navigate to MIO Insights after "Meet MIO" step to show first engagement message
      navigate('/mind-insurance/mio-insights', {
        state: { fromTour: true, showFirstEngagement: true }
      });
    }
  };

  // Handle daily modal "Begin Day X"
  const handleBeginDayX = async () => {
    // Dismiss the daily modal and navigate to coverage center
    dismissDailyModal();
    navigate('/mind-insurance/coverage');
  };

  // Handle daily modal "Remind Later"
  const handleDailyRemindLater = () => {
    dismissDailyModal();
  };

  const progressPercentage = (practiceStatus.completed / practiceStatus.total) * 100;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-mi-navy">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mi-cyan"></div>
      </div>
    );
  }

  return (
    <MindInsuranceErrorBoundary fallbackTitle="Error loading Mind Insurance Hub" showHomeButton={false}>
      {/* Protocol Unlock Modal (for unstarted protocols - Day 1) */}
      <ProtocolUnlockModal
        isOpen={shouldShowModal && hasUnstartedProtocol}
        protocol={unstartedProtocol}
        variant={isNewUser ? 'new_user' : 'returning_user'}
        onBeginDay1={handleBeginDay1}
        onRemindLater={handleRemindLater}
        onClose={dismissModal}
      />

      {/* Daily Protocol Modal (for active protocols - Days 2-7) */}
      <ProtocolUnlockModal
        isOpen={shouldShowDailyModal && !shouldShowModal}
        protocol={activeProtocol}
        variant="daily"
        currentDay={currentDay}
        onBeginDay1={handleBeginDayX}
        onRemindLater={handleDailyRemindLater}
        onClose={dismissDailyModal}
      />

      {/* Tour Offer Dialog (after Begin Day 1) */}
      <TourOfferDialog
        isOpen={showTourOffer}
        onStartTour={handleStartTour}
        onSkip={handleSkipTour}
      />

      {/* NOTE: Tour overlay (TourHighlight, TourTooltip, TourSidebarController) */}
      {/* is now rendered in SidebarLayout to persist across page navigation */}

      <div className="min-h-screen bg-mi-navy">
        <div className="container mx-auto p-4 md:p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 text-white">
                <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-mi-cyan flex-shrink-0" />
                Mind Insurance
              </h1>
              <p className="text-sm sm:text-base text-gray-400 mt-1">
                Your daily PROTECT practice hub
              </p>
            </div>
            <Badge
              variant="outline"
              className={`text-sm sm:text-lg px-3 sm:px-4 py-1.5 sm:py-2 border-mi-navy-light w-fit ${getChampionshipColor(userStats.championshipLevel)}`}
            >
              <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              {userStats.championshipLevel}
            </Badge>
          </div>

          {/* Today's Practice Status - Tour Target: practice */}
          <Card
            data-tour-target="practice"
            className="p-6 bg-mi-navy-light border-mi-cyan/30"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center gap-2 text-white">
                  <Calendar className="w-5 h-5 text-mi-cyan" />
                  Today's Practice
                </h2>
                <div className="text-right">
                  <p className="text-2xl font-bold text-mi-gold">{practiceStatus.points}</p>
                  <p className="text-sm text-gray-400">points earned</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-300">
                  <span>{practiceStatus.completed} of {practiceStatus.total} completed</span>
                  <span className="font-semibold text-mi-cyan">{Math.round(progressPercentage)}%</span>
                </div>
                <div className="h-3 w-full bg-mi-cyan/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-mi-cyan rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>

              <Button
                onClick={() => navigate('/mind-insurance/practice')}
                className="w-full bg-mi-cyan hover:bg-mi-cyan-dark text-white"
                size="lg"
              >
                <Play className="w-4 h-4 mr-2" />
                {practiceStatus.completed === 0 ? 'Start Today\'s Practice' : 'Continue Practice'}
              </Button>
            </div>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Streak Tracker */}
            <Card className="p-6 bg-mi-navy-light border-mi-gold/30">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-400">Current Streak</h3>
                <p className="text-3xl font-bold text-mi-gold">{userStats.streak} days</p>
                <p className="text-sm text-gray-400">Keep it going!</p>
              </div>
            </Card>

            {/* Total Points */}
            <Card className="p-6 bg-mi-navy-light border-mi-gold/30">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-400">Total Points</h3>
                <p className="text-3xl font-bold text-mi-gold">{userStats.totalPoints}</p>
                <p className="text-sm text-gray-400">
                  {userStats.totalPoints < 150 && 'Next level: 150 points (Silver)'}
                  {userStats.totalPoints >= 150 && userStats.totalPoints < 300 && 'Next level: 300 points (Gold)'}
                  {userStats.totalPoints >= 300 && userStats.totalPoints < 450 && 'Next level: 450 points (Platinum)'}
                  {userStats.totalPoints >= 450 && 'Maximum level achieved!'}
                </p>
              </div>
            </Card>
          </div>

          {/* Push Notification Banner - Shows if not subscribed */}
          <PushNotificationPrompt variant="banner" />

        </div>
      </div>

      {/* Floating badge (when modal dismissed and tour not active) */}
      <AnimatePresence>
        {showBadge && unstartedProtocol && !isTourActive && (
          <ProtocolReadyBadge
            variant="floating"
            onView={() => navigate('/mind-insurance/coverage')}
          />
        )}
      </AnimatePresence>
    </MindInsuranceErrorBoundary>
  );
}
