import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Trophy,
  Flame,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Clock,
  Star,
  Award,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMindInsuranceProgress } from '@/hooks/useMindInsuranceProgress';

interface ChampionshipStats {
  currentStreak: number;
  completionPercentage: number;
  daysPracticed: number;
  totalPoints: number;
  todayPoints: number;
  todayCompleted: boolean;
  championshipLevel: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  levelProgress: number;
  qualifiesForRefund: boolean;
}

interface PracticeHistoryItem {
  id: string;
  practice_type: string;
  points_earned: number;
  completed_at: string;
  practice_name: string;
}

// Component for individual stat cards
const StatsCard = ({
  icon: Icon,
  value,
  label,
  variant = 'default',
  suffix = ''
}: {
  icon: React.ElementType;
  value: number | string;
  label: string;
  variant?: 'default' | 'primary' | 'success';
  suffix?: string;
}) => {
  const borderClass = variant === 'primary' ? 'border-mi-cyan/50' :
                      variant === 'success' ? 'border-green-500/50' :
                      'border-mi-navy-light';
  const iconColor = variant === 'primary' ? 'text-mi-cyan' :
                    variant === 'success' ? 'text-green-500' :
                    'text-mi-gold';

  return (
    <Card className={`p-4 border-2 ${borderClass} bg-mi-navy-light transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Icon className={`w-5 h-5 mb-2 ${iconColor}`} />
          <div className="text-2xl font-bold text-white">
            {value}{suffix}
          </div>
          <div className="text-sm text-gray-400 mt-1">
            {label}
          </div>
        </div>
      </div>
    </Card>
  );
};

// Component for the 30-day commitment grid
const DailyCommitmentGrid = ({
  currentDay,
  completedDays
}: {
  currentDay: number;
  completedDays: boolean[];
}) => {
  return (
    <Card className="p-6 bg-mi-navy-light border-mi-cyan/20">
      <div className="flex items-center gap-3 mb-4">
        <Calendar className="w-6 h-6 text-mi-cyan" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white">Daily Commitment Tracker</h3>
          <p className="text-sm text-gray-400">
            {currentDay} of 30 Commitments Met
          </p>
        </div>
      </div>

      <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
        {Array.from({ length: 30 }, (_, i) => {
          const dayNum = i + 1;
          const isCompleted = completedDays[i];
          const isCurrent = dayNum === currentDay;
          const isFuture = dayNum > currentDay;

          return (
            <div
              key={dayNum}
              className={`
                aspect-square rounded-lg flex items-center justify-center
                border-2 transition-all text-sm font-medium
                ${isCompleted ? 'bg-green-500 border-green-500 text-white' :
                  isCurrent ? 'bg-mi-cyan border-mi-cyan text-white animate-pulse' :
                  isFuture ? 'bg-mi-navy border-mi-navy-light text-gray-500' :
                  'bg-red-500/20 border-red-500/50 text-red-400'}
              `}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                dayNum
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default function ChampionshipPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: progressData } = useMindInsuranceProgress();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ChampionshipStats>({
    currentStreak: 0,
    completionPercentage: 0,
    daysPracticed: 0,
    totalPoints: 0,
    todayPoints: 0,
    todayCompleted: false,
    championshipLevel: 'BRONZE',
    levelProgress: 0,
    qualifiesForRefund: false
  });
  const [practiceHistory, setPracticeHistory] = useState<PracticeHistoryItem[]>([]);
  const [completedDays, setCompletedDays] = useState<boolean[]>(new Array(30).fill(false));

  useEffect(() => {
    if (user?.id && progressData) {
      fetchChampionshipData();
    }
  }, [user, progressData]);

  const fetchChampionshipData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Fetch user profile and streak data
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Fetch today's practices
      const today = new Date().toISOString().split('T')[0];
      const { data: todayPractices, error: todayError } = await supabase
        .from('daily_practices')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`);

      if (todayError) throw todayError;

      // Fetch practice history (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: historyData, error: historyError } = await supabase
        .from('daily_practices')
        .select('*')
        .eq('user_id', user.id)
        .eq('completed', true)
        .gte('completed_at', sevenDaysAgo.toISOString())
        .order('completed_at', { ascending: false })
        .limit(10);

      if (historyError) throw historyError;

      // Fetch all completed days for the grid
      const startDate = profileData?.challenge_start_date || new Date().toISOString();
      const { data: allPractices, error: allError } = await supabase
        .from('daily_practices')
        .select('created_at, completed')
        .eq('user_id', user.id)
        .gte('created_at', startDate);

      if (allError) throw allError;

      // Process data
      const todayPoints = todayPractices?.reduce((sum, p) => sum + (p.points_earned || 0), 0) || 0;
      const todayCompleted = todayPoints >= 20;
      // Use progressData from hook for accurate streak (calculated from practice data)
      const totalPoints = progressData?.totalPoints || profileData?.total_points || 0;
      const currentStreak = progressData?.currentStreak || 0;
      const challengeStartDate = new Date(startDate);
      const currentDay = Math.min(
        Math.ceil((new Date().getTime() - challengeStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1,
        30
      );
      const daysPracticed = profileData?.days_completed || 0;

      // Calculate completion percentage
      const expectedPoints = currentDay * 20;
      const completionPercentage = Math.round((totalPoints / expectedPoints) * 100);

      // Determine championship level
      let championshipLevel: ChampionshipStats['championshipLevel'] = 'BRONZE';
      let levelProgress = 0;

      if (totalPoints >= 450) {
        championshipLevel = 'PLATINUM';
        levelProgress = 100;
      } else if (totalPoints >= 300) {
        championshipLevel = 'GOLD';
        levelProgress = ((totalPoints - 300) / 150) * 100;
      } else if (totalPoints >= 150) {
        championshipLevel = 'SILVER';
        levelProgress = ((totalPoints - 150) / 150) * 100;
      } else {
        championshipLevel = 'BRONZE';
        levelProgress = (totalPoints / 150) * 100;
      }

      // Check if qualifies for refund (420 points)
      const qualifiesForRefund = totalPoints >= 420;

      // Process completed days for the grid
      const completedDaysArray = new Array(30).fill(false);
      const practicesByDay = new Map<string, boolean>();

      allPractices?.forEach(practice => {
        const practiceDate = new Date(practice.created_at).toISOString().split('T')[0];
        if (!practicesByDay.has(practiceDate) || practice.completed) {
          practicesByDay.set(practiceDate, practice.completed);
        }
      });

      for (let i = 0; i < 30; i++) {
        const checkDate = new Date(challengeStartDate);
        checkDate.setDate(checkDate.getDate() + i);
        const dateStr = checkDate.toISOString().split('T')[0];
        completedDaysArray[i] = practicesByDay.get(dateStr) || false;
      }

      // Format practice history
      const formattedHistory: PracticeHistoryItem[] = historyData?.map(practice => ({
        id: practice.id,
        practice_type: practice.practice_type,
        points_earned: practice.points_earned || 0,
        completed_at: practice.completed_at,
        practice_name: getPracticeName(practice.practice_type)
      })) || [];

      setStats({
        currentStreak,
        completionPercentage,
        daysPracticed,
        totalPoints,
        todayPoints,
        todayCompleted,
        championshipLevel,
        levelProgress,
        qualifiesForRefund
      });

      setPracticeHistory(formattedHistory);
      setCompletedDays(completedDaysArray);

    } catch (error) {
      console.error('Error fetching championship data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPracticeName = (practiceType: string): string => {
    const names: Record<string, string> = {
      'pattern_check': 'Pattern Check',
      'reinforce_identity': 'Reinforce Identity',
      'outcome_visualization': 'Outcome Visualization',
      'trigger_reset': 'Trigger Reset',
      'energy_audit': 'Energy Audit',
      'celebrate_wins': 'Celebrate Wins',
      'tomorrow_setup': 'Tomorrow Setup'
    };
    return names[practiceType] || practiceType;
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'PLATINUM': return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'GOLD': return 'bg-gradient-to-r from-yellow-400 to-orange-500';
      case 'SILVER': return 'bg-gradient-to-r from-gray-300 to-gray-500';
      default: return 'bg-gradient-to-r from-orange-600 to-red-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mi-navy">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mi-cyan mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading championship data...</p>
        </div>
      </div>
    );
  }

  const currentDay = Math.min(
    Math.ceil((new Date().getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) + 1,
    30
  );

  return (
    <div className="min-h-screen bg-mi-navy p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <Trophy className="w-8 h-8 text-mi-gold" />
              Championship
            </h1>
            <p className="text-gray-400 mt-1">Track your 30-day journey to mastery</p>
          </div>
          <Button
            onClick={() => navigate('/mind-insurance')}
            variant="outline"
            className="border-mi-cyan/50 text-mi-cyan hover:bg-mi-cyan/10"
          >
            Back to Hub
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard
            icon={Flame}
            value={stats.currentStreak}
            label="Current Streak"
            variant="primary"
          />
          <StatsCard
            icon={TrendingUp}
            value={stats.completionPercentage}
            suffix="%"
            label="Completion"
            variant={stats.completionPercentage >= 80 ? 'success' : 'default'}
          />
          <StatsCard
            icon={Calendar}
            value={stats.daysPracticed}
            label="Days Practiced"
          />
          <StatsCard
            icon={Star}
            value={stats.totalPoints}
            label="Total Points"
            variant="primary"
          />
        </div>

        {/* Today's Practice Card */}
        <Card className={`p-6 border-2 bg-mi-navy-light ${
          stats.todayCompleted ? 'border-green-500' : 'border-mi-cyan/50'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {stats.todayCompleted ? (
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              ) : (
                <Clock className="w-8 h-8 text-mi-cyan animate-pulse" />
              )}
              <div>
                <h3 className="text-xl font-semibold text-white">
                  {stats.todayCompleted ? 'Day Complete!' : "Today's Practice"}
                </h3>
                <p className="text-sm text-gray-400">
                  {stats.todayCompleted
                    ? 'Great job! You earned all 20 points today.'
                    : 'Complete your daily practices to maintain your streak'}
                </p>
              </div>
            </div>
            {!stats.todayCompleted && (
              <Button
                onClick={() => navigate('/mind-insurance')}
                className="bg-mi-cyan hover:bg-mi-cyan-dark text-white"
              >
                Continue Practice
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Progress</span>
              <span className="font-semibold text-mi-cyan">
                {stats.todayPoints} / 20 points
              </span>
            </div>
            <div className="h-3 w-full bg-mi-cyan/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-mi-cyan rounded-full transition-all duration-300"
                style={{ width: `${(stats.todayPoints / 20) * 100}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Championship Level Tracker */}
        <Card className="p-6 bg-mi-navy-light border-mi-gold/30">
          <div className="flex items-center gap-3 mb-6">
            <Award className="w-6 h-6 text-mi-gold" />
            <h3 className="text-xl font-semibold text-white">Championship Level</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge
                  className={`px-3 py-1 text-white ${getLevelColor(stats.championshipLevel)}`}
                >
                  {stats.championshipLevel}
                </Badge>
                <span className="text-gray-400 text-sm">
                  {stats.totalPoints} points earned
                </span>
              </div>
              {stats.qualifiesForRefund && (
                <Badge variant="outline" className="border-green-500 text-green-500">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Money-Back Qualified
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-400">
                <span>Level Progress</span>
                <span>{Math.round(stats.levelProgress)}%</span>
              </div>
              <div className="h-2 w-full bg-mi-gold/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-mi-gold rounded-full transition-all duration-300"
                  style={{ width: `${stats.levelProgress}%` }}
                />
              </div>
            </div>

            {/* Level Milestones */}
            <div className="grid grid-cols-4 gap-2 mt-4">
              {(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'] as const).map((level, index) => {
                const pointsRequired = [0, 150, 300, 450][index];
                const isAchieved = stats.totalPoints >= pointsRequired;
                const isCurrent = stats.championshipLevel === level;

                return (
                  <div
                    key={level}
                    className={`text-center p-2 rounded-lg border ${
                      isCurrent ? 'border-mi-cyan bg-mi-cyan/10' :
                      isAchieved ? 'border-green-500 bg-green-500/10' :
                      'border-mi-navy bg-mi-navy/50'
                    }`}
                  >
                    <div className={`text-xs font-medium ${
                      isCurrent ? 'text-mi-cyan' :
                      isAchieved ? 'text-green-500' :
                      'text-gray-500'
                    }`}>
                      {level}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {pointsRequired}pts
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* 30-Day Grid */}
        <DailyCommitmentGrid
          currentDay={currentDay}
          completedDays={completedDays}
        />

        {/* Practice History */}
        <Card className="p-6 bg-mi-navy-light border-mi-cyan/20">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-white">
            <Clock className="w-5 h-5 text-mi-cyan" />
            Recent Practice History
          </h3>

          {practiceHistory.length > 0 ? (
            <div className="space-y-3">
              {practiceHistory.map((practice) => (
                <div
                  key={practice.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-mi-navy/50 hover:bg-mi-navy transition-colors border border-mi-cyan/10"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <div>
                      <p className="font-medium text-sm text-white">{practice.practice_name}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(practice.completed_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-mi-cyan/20 text-mi-cyan border-mi-cyan/30">
                    +{practice.points_earned} pts
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p>No practice history yet</p>
              <p className="text-sm mt-2">Complete your first practice to start tracking!</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}