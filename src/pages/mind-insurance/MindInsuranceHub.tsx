import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Shield, Calendar, Trophy, Play, BookOpen, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMindInsuranceProgress } from '@/hooks/useMindInsuranceProgress';
import { TodayProtocolTask, ProtocolTaskModal } from '@/components/mind-insurance/TodayProtocolTask';
import { getTodayProtocolTask } from '@/services/mioInsightProtocolService';
import { getTodayInTimezone } from '@/utils/timezoneUtils';
import type { TodayProtocolTask as TodayProtocolTaskType } from '@/types/protocol';

// V2 Coach Protocols
import { CoachProtocolTabs } from '@/components/mind-insurance/CoachProtocolTabs';
import { useCoachProtocols } from '@/hooks/useCoachProtocols';
import { useCoachProtocolTasks } from '@/hooks/useCoachProtocolTasks';

interface DailyPracticeStatus {
  completed: number;
  total: number;
  points: number;
}

export default function MindInsuranceHub() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: progressData, isLoading: progressLoading } = useMindInsuranceProgress();
  const [practiceStatus, setPracticeStatus] = useState<DailyPracticeStatus>({
    completed: 0,
    total: 7,
    points: 0
  });
  const [hasCoachContent, setHasCoachContent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [protocolTask, setProtocolTask] = useState<TodayProtocolTaskType | null>(null);
  const [showProtocolModal, setShowProtocolModal] = useState(false);

  // V2 Coach Protocols hooks
  const { protocols: coachProtocols, isLoading: protocolsLoading } = useCoachProtocols();
  const {
    todayTasks,
    isLoading: tasksLoading,
    isSaving: tasksSaving,
    completeTaskHandler,
    refetch: refetchTasks,
  } = useCoachProtocolTasks();

  // Check if user has any active coach protocols
  const hasCoachProtocols = coachProtocols.primary !== null || coachProtocols.secondary !== null;

  // Get stats from the hook (calculated from actual practice data)
  const userStats = {
    streak: progressData?.currentStreak || 0,
    totalPoints: progressData?.totalPoints || 0,
    championshipLevel: (progressData?.championshipLevel || 'bronze').toUpperCase()
  };

  useEffect(() => {
    if (user?.id) {
      fetchDailyStatus();
      fetchCoachContent();
      fetchProtocolTask();
    }
  }, [user]);

  const fetchProtocolTask = async () => {
    if (!user?.id) return;

    const task = await getTodayProtocolTask(user.id);
    setProtocolTask(task);

    // Show modal on first open of day if there's an incomplete task
    if (task && !task.is_completed) {
      const lastShownKey = `mio_protocol_modal_${user.id}`;
      const today = getTodayInTimezone();
      const lastShown = localStorage.getItem(lastShownKey);

      if (lastShown !== today) {
        setShowProtocolModal(true);
        localStorage.setItem(lastShownKey, today);
      }
    }
  };

  // Update loading state when progress data loads
  useEffect(() => {
    if (!progressLoading) {
      setLoading(false);
    }
  }, [progressLoading]);

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


  const fetchCoachContent = async () => {
    if (!user?.id) return;

    // Check if there's any active coach protocol for this user
    const { data, error } = await supabase
      .from('coach_protocols')
      .select('id')
      .eq('status', 'published')
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      setHasCoachContent(true);
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

  const progressPercentage = (practiceStatus.completed / practiceStatus.total) * 100;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-mi-navy">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mi-cyan"></div>
      </div>
    );
  }

  return (
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

        {/* Today's Practice Status */}
        <Card className="p-6 bg-mi-navy-light border-mi-cyan/30">
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

        {/* Coach Protocols Section (V2) */}
        {hasCoachProtocols && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-mi-gold" />
              <h2 className="text-lg font-semibold text-white">Coach Protocols</h2>
            </div>
            <CoachProtocolTabs
              protocols={coachProtocols}
              todayTasks={todayTasks}
              onCompleteTask={completeTaskHandler}
              isSaving={tasksSaving}
              isLoading={tasksLoading || protocolsLoading}
              onProtocolComplete={() => {
                // Refetch after protocol completion to update UI
                refetchTasks();
              }}
            />
          </div>
        )}

        {/* Today's Protocol Task (if active - legacy MIO protocols) */}
        {protocolTask && (
          <TodayProtocolTask
            task={protocolTask}
            onComplete={fetchProtocolTask}
          />
        )}

        {/* Protocol Task Modal (first open of day - legacy MIO) */}
        {protocolTask && (
          <ProtocolTaskModal
            task={protocolTask}
            isOpen={showProtocolModal}
            onClose={() => setShowProtocolModal(false)}
            onComplete={() => {
              setShowProtocolModal(false);
              fetchProtocolTask();
            }}
          />
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Streak Tracker */}
          <Card className="p-6 bg-mi-navy-light border-mi-gold/30">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-400">Current Streak</h3>
              <p className="text-3xl font-bold text-mi-gold">{userStats.streak} days</p>
              <p className="text-sm text-gray-400">Keep it going! 🔥</p>
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

        {/* Coach Content Available Banner (only shows when coach has assigned content) */}
        {hasCoachContent && (
          <Card
            className="p-4 bg-mi-navy-light border-amber-500/30 cursor-pointer hover:border-amber-500/50 transition-all"
            onClick={() => navigate('/mind-insurance/insights')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="font-medium text-white">Coach Content Available</p>
                  <p className="text-sm text-gray-400">New expert-curated content for you</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30">
                New
              </Badge>
            </div>
          </Card>
        )}

      </div>
    </div>
  );
}
