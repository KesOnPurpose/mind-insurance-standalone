import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Trophy, Zap, Calendar, ChevronRight, ArrowLeft } from 'lucide-react';
import { TimeWindowSection, type TimeWindow as TimeWindowType } from '@/components/mind-insurance/TimeWindowSection';
import { PracticeCard } from '@/components/mind-insurance/PracticeCard';
import { MIOInsightBanner } from '@/components/mind-insurance/MIOInsightBanner';
import { usePendingInsight } from '@/hooks/usePendingInsight';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useMindInsuranceProgress } from '@/hooks/useMindInsuranceProgress';
import type {
  PracticeType,
  DailyPractice,
  PracticeStatus,
  ChampionshipLevel,
  PracticeStreak
} from '@/types/practices';
import { PRACTICE_CONFIG, DAILY_SCHEDULE } from '@/types/practices';

// Time window configurations
const TIME_WINDOWS: Record<string, TimeWindowType> = {
  CHAMPIONSHIP_SETUP: {
    id: 'CHAMPIONSHIP_SETUP',
    name: 'Championship Setup',
    startTime: '03:00',
    endTime: '10:00',
    description: 'Prime your championship mindset for peak performance'
  },
  NASCAR_PIT_STOP: {
    id: 'NASCAR_PIT_STOP',
    name: 'NASCAR Pit Stop',
    startTime: '10:00',
    endTime: '15:00',
    description: 'Quick mid-day adjustments to stay on track'
  },
  VICTORY_LAP: {
    id: 'VICTORY_LAP',
    name: 'Victory Lap',
    startTime: '15:00',
    endTime: '22:00',
    description: 'Celebrate wins and set tomorrow\'s championship'
  }
};

export default function MindInsurancePracticePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: progressData } = useMindInsuranceProgress();
  const { pendingInsight, clearPendingInsight } = usePendingInsight();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todaysPractices, setTodaysPractices] = useState<DailyPractice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [championshipLevel, setChampionshipLevel] = useState<ChampionshipLevel>('bronze');

  // Get section to auto-expand from URL param (for returning from practice)
  const expandedSection = searchParams.get('section');

  // Get streak from hook (calculated from actual practice data)
  const streak: PracticeStreak | null = progressData ? {
    current_streak: progressData.currentStreak,
    longest_streak: progressData.longestStreak,
    user_id: '',
    id: '',
    last_practice_date: null,
    created_at: '',
    updated_at: ''
  } : null;

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Load user data and practices
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Auth error:', authError);
        navigate('/auth');
        return;
      }

      // Load user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Profile error:', profileError);
      } else {
        setUserProfile(profile);
      }

      // Load today's practices using user's timezone (or browser default)
      // This ensures we query for the correct local date, not UTC
      const userTimezone = profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
      const today = new Date().toLocaleDateString('en-CA', { timeZone: userTimezone });

      const { data: practices, error: practicesError } = await supabase
        .from('daily_practices')
        .select('*')
        .eq('user_id', user.id)
        .eq('practice_date', today);

      if (practicesError) {
        console.error('Practices error:', practicesError);
      } else {
        setTodaysPractices(practices || []);
      }

      // Streak data comes from useMindInsuranceProgress hook (calculated from actual practice data)

      // Calculate championship level based on total points
      const totalPoints = (practices || []).reduce((sum, p) => sum + p.points_earned, 0);
      if (totalPoints >= 70) {
        setChampionshipLevel('platinum');
      } else if (totalPoints >= 50) {
        setChampionshipLevel('gold');
      } else if (totalPoints >= 30) {
        setChampionshipLevel('silver');
      } else {
        setChampionshipLevel('bronze');
      }

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle pull to refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  // Calculate today's points
  const todaysPoints = todaysPractices.reduce((sum, practice) => sum + practice.points_earned, 0);
  const maxPossiblePoints = DAILY_SCHEDULE.reduce((sum, schedule) => sum + schedule.maxPoints, 0);

  // Check if practice is completed
  const isPracticeCompleted = (practiceType: PracticeType): boolean => {
    return todaysPractices.some(p => p.practice_type === practiceType && p.completed);
  };

  // Get practice points earned
  const getPracticePoints = (practiceType: PracticeType): number | undefined => {
    const practice = todaysPractices.find(p => p.practice_type === practiceType);
    return practice?.points_earned;
  };

  // Check if practice is available based on time window
  const isPracticeAvailable = (practiceType: PracticeType): boolean => {
    const currentHour = currentTime.getHours();
    const schedule = DAILY_SCHEDULE.find(s => s.practices.includes(practiceType));

    if (!schedule) return false;

    // Practice is available if we're within the time window or it's already completed
    return (currentHour >= schedule.startHour && currentHour < schedule.endHour) ||
           isPracticeCompleted(practiceType);
  };

  // Navigate to specific practice page
  const handlePracticeClick = (practiceType: PracticeType) => {
    if (!isPracticeAvailable(practiceType) || isPracticeCompleted(practiceType)) {
      return;
    }

    // Map practice types to their routes
    const practiceRoutes: Record<PracticeType, string> = {
      'P': '/mind-insurance/practices/pattern-check',
      'R': '/mind-insurance/practices/reinforce-identity',
      'O': '/mind-insurance/practices/outcome-visualization',
      'T': '/mind-insurance/practices/trigger-reset',
      'E': '/mind-insurance/practices/energy-audit',
      'C': '/mind-insurance/practices/celebrate-wins',
      'T2': '/mind-insurance/practices/tomorrow-setup'
    };

    navigate(practiceRoutes[practiceType]);
  };

  // Get practices for a specific time window
  const getPracticesForWindow = (windowId: string): PracticeType[] => {
    const schedule = DAILY_SCHEDULE.find(s => s.window === windowId);
    return schedule?.practices || [];
  };

  // Get championship level styling
  const getChampionshipLevelStyles = () => {
    switch (championshipLevel) {
      case 'platinum':
        return 'bg-gradient-to-r from-purple-500 to-purple-700 text-white';
      case 'gold':
        return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white';
      case 'silver':
        return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white';
      default:
        return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-mi-navy">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-mi-cyan" />
          <p className="text-gray-400">Loading practice dashboard...</p>
        </div>
      </div>
    );
  }

  // Handle banner view action
  const handleViewInsight = () => {
    clearPendingInsight();
    navigate('/mind-insurance/mio-insights');
  };

  return (
    <div className="min-h-screen bg-mi-navy">
      {/* MIO Insight Banner - shows when insight is pending */}
      {pendingInsight && (
        <MIOInsightBanner
          insight={pendingInsight}
          onView={handleViewInsight}
          onDismiss={clearPendingInsight}
        />
      )}

      <div className={cn(
        "container max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6",
        pendingInsight && "pt-20" // Add padding when banner is shown
      )}>
        {/* Back Button */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-1.5 text-gray-300 hover:text-white hover:bg-mi-navy-light" onClick={() => navigate('/mind-insurance')}>
            <ArrowLeft className="w-4 h-4" />
            Back to Hub
          </Button>
        </div>

        {/* Header Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-mi-cyan">
                Mind Insurance Practice
              </h1>
              <p className="text-gray-400 mt-1">
                Strengthen your mental championship daily
              </p>
            </div>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
              className="rounded-full border-mi-cyan/30 text-mi-cyan hover:bg-mi-cyan/10"
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            </Button>
          </div>

          {/* Compact Stats Strip */}
          <Card className="overflow-hidden bg-mi-navy-light border-mi-cyan/30">
            <CardContent className="p-3">
              <div className="flex items-center justify-between gap-2">
                {/* Today's Points */}
                <div className="flex items-center gap-2 flex-1">
                  <Trophy className="h-4 w-4 text-mi-gold flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400">Points</p>
                    <p className="text-sm font-bold text-white">{todaysPoints}/{maxPossiblePoints}</p>
                  </div>
                </div>

                <div className="h-8 w-px bg-mi-cyan/20" />

                {/* Championship Level */}
                <div className="flex items-center gap-2 flex-1 justify-center">
                  <Zap className="h-4 w-4 text-mi-gold flex-shrink-0" />
                  <Badge className={cn("text-xs px-2 py-0.5", getChampionshipLevelStyles())}>
                    {championshipLevel.toUpperCase()}
                  </Badge>
                </div>

                <div className="h-8 w-px bg-mi-cyan/20" />

                {/* Streak Counter */}
                <div className="flex items-center gap-2 flex-1 justify-end">
                  <Calendar className="h-4 w-4 text-mi-gold flex-shrink-0" />
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Streak</p>
                    <p className="text-sm font-bold text-mi-gold">{streak?.current_streak || 0} days</p>
                  </div>
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-2">
                <div className="w-full bg-mi-cyan/20 rounded-full h-1.5">
                  <div
                    className="bg-mi-cyan h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${(todaysPoints / maxPossiblePoints) * 100}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Time Windows */}
        <div className="space-y-4">
          {/* Championship Setup Window */}
          <TimeWindowSection
            window={TIME_WINDOWS.CHAMPIONSHIP_SETUP}
            practices={getPracticesForWindow('CHAMPIONSHIP_SETUP').map(type => ({
              id: type,
              name: PRACTICE_CONFIG[type].name,
              category: 'morning',
              completed: isPracticeCompleted(type)
            }))}
            currentTime={currentTime}
            defaultOpen={expandedSection === 'CHAMPIONSHIP_SETUP'}
          >
            {getPracticesForWindow('CHAMPIONSHIP_SETUP').map(practiceType => (
              <PracticeCard
                key={practiceType}
                practiceType={practiceType}
                isCompleted={isPracticeCompleted(practiceType)}
                isAvailable={isPracticeAvailable(practiceType)}
                pointsEarned={getPracticePoints(practiceType)}
                onClick={() => handlePracticeClick(practiceType)}
              />
            ))}
          </TimeWindowSection>

          {/* NASCAR Pit Stop Window */}
          <TimeWindowSection
            window={TIME_WINDOWS.NASCAR_PIT_STOP}
            practices={getPracticesForWindow('NASCAR_PIT_STOP').map(type => ({
              id: type,
              name: PRACTICE_CONFIG[type].name,
              category: 'midday',
              completed: isPracticeCompleted(type)
            }))}
            currentTime={currentTime}
            defaultOpen={expandedSection === 'NASCAR_PIT_STOP'}
          >
            {getPracticesForWindow('NASCAR_PIT_STOP').map(practiceType => (
              <PracticeCard
                key={practiceType}
                practiceType={practiceType}
                isCompleted={isPracticeCompleted(practiceType)}
                isAvailable={isPracticeAvailable(practiceType)}
                pointsEarned={getPracticePoints(practiceType)}
                onClick={() => handlePracticeClick(practiceType)}
              />
            ))}
          </TimeWindowSection>

          {/* Victory Lap Window */}
          <TimeWindowSection
            window={TIME_WINDOWS.VICTORY_LAP}
            practices={getPracticesForWindow('VICTORY_LAP').map(type => ({
              id: type,
              name: PRACTICE_CONFIG[type].name,
              category: 'evening',
              completed: isPracticeCompleted(type)
            }))}
            currentTime={currentTime}
            defaultOpen={expandedSection === 'VICTORY_LAP'}
          >
            {getPracticesForWindow('VICTORY_LAP').map(practiceType => (
              <PracticeCard
                key={practiceType}
                practiceType={practiceType}
                isCompleted={isPracticeCompleted(practiceType)}
                isAvailable={isPracticeAvailable(practiceType)}
                pointsEarned={getPracticePoints(practiceType)}
                onClick={() => handlePracticeClick(practiceType)}
              />
            ))}
          </TimeWindowSection>
        </div>

        {/* Quick Navigation */}
        <Card className="bg-mi-navy-light border-mi-cyan/20">
          <CardHeader>
            <h3 className="font-semibold text-lg text-white">Quick Actions</h3>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-between text-gray-300 hover:text-white hover:bg-mi-navy"
              onClick={() => navigate('/mind-insurance')}
            >
              <span>View Progress Analytics</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-between text-gray-300 hover:text-white hover:bg-mi-navy"
              onClick={() => navigate('/settings')}
            >
              <span>Practice Reminder Settings</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}