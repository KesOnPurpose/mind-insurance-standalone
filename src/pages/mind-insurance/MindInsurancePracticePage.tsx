import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Trophy, Zap, Calendar, ChevronRight, ArrowLeft } from 'lucide-react';
import { TimeWindowSection, type TimeWindow as TimeWindowType } from '@/components/mind-insurance/TimeWindowSection';
import { PracticeCard } from '@/components/mind-insurance/PracticeCard';
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
  const { data: progressData } = useMindInsuranceProgress();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todaysPractices, setTodaysPractices] = useState<DailyPractice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [championshipLevel, setChampionshipLevel] = useState<ChampionshipLevel>('bronze');

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

      // Load today's practices
      const today = new Date().toISOString().split('T')[0];
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading practice dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Back Button */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => navigate('/mind-insurance')}>
          <ArrowLeft className="w-4 h-4" />
          Back to Hub
        </Button>
      </div>

      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Mind Insurance Practice
            </h1>
            <p className="text-muted-foreground mt-1">
              Strengthen your mental championship daily
            </p>
          </div>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
            className="rounded-full"
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Today's Points */}
          <Card className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today's Points</p>
                  <p className="text-2xl font-bold">
                    {todaysPoints} / {maxPossiblePoints}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(todaysPoints / maxPossiblePoints) * 100}%` }}
                    />
                  </div>
                </div>
                <Trophy className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          {/* Championship Level */}
          <Card className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Championship Level</p>
                  <Badge className={cn("mt-2", getChampionshipLevelStyles())}>
                    {championshipLevel.toUpperCase()}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    Keep pushing forward!
                  </p>
                </div>
                <Zap className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          {/* Streak Counter */}
          <Card className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Current Streak</p>
                  <p className="text-2xl font-bold">
                    {streak?.current_streak || 0} days
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Best: {streak?.longest_streak || 0} days
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
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
      <Card className="border-primary/20">
        <CardHeader>
          <h3 className="font-semibold text-lg">Quick Actions</h3>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-between"
            onClick={() => navigate('/mind-insurance')}
          >
            <span>View Progress Analytics</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-between"
            onClick={() => navigate('/settings')}
          >
            <span>Practice Reminder Settings</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}