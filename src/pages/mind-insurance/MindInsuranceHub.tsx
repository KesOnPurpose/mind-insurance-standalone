import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Shield, Calendar, Trophy, FileText, Play, TrendingUp, Brain } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DailyPracticeStatus {
  completed: number;
  total: number;
  points: number;
}

interface UserStats {
  streak: number;
  totalPoints: number;
  championshipLevel: string;
}

export default function MindInsuranceHub() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [practiceStatus, setPracticeStatus] = useState<DailyPracticeStatus>({
    completed: 0,
    total: 7,
    points: 0
  });
  const [userStats, setUserStats] = useState<UserStats>({
    streak: 0,
    totalPoints: 0,
    championshipLevel: 'BRONZE'
  });
  const [latestInsight, setLatestInsight] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchDailyStatus();
      fetchUserStats();
      fetchLatestInsight();
    }
  }, [user]);

  const fetchDailyStatus = async () => {
    if (!user?.id) return;

    const today = new Date().toISOString().split('T')[0];

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

  const fetchUserStats = async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('user_profiles')
      .select('daily_streak_count, total_points, championship_level')
      .eq('id', user.id)
      .single();

    if (!error && data) {
      setUserStats({
        streak: data.daily_streak_count || 0,
        totalPoints: data.total_points || 0,
        championshipLevel: data.championship_level || 'BRONZE'
      });
    }
    setLoading(false);
  };

  const fetchLatestInsight = async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('mio_insights')
      .select('title, insight_type, delivered_at, read_at')
      .eq('user_id', user.id)
      .order('delivered_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      setLatestInsight(data);
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8 text-purple-600" />
            Mind Insurance
          </h1>
          <p className="text-muted-foreground mt-1">
            Your daily PROTECT practice hub
          </p>
        </div>
        <Badge
          variant="outline"
          className={`text-lg px-4 py-2 ${getChampionshipColor(userStats.championshipLevel)}`}
        >
          <Trophy className="w-4 h-4 mr-2" />
          {userStats.championshipLevel}
        </Badge>
      </div>

      {/* Today's Practice Status */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              Today's Practice
            </h2>
            <div className="text-right">
              <p className="text-2xl font-bold text-purple-600">{practiceStatus.points}</p>
              <p className="text-sm text-muted-foreground">points earned</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{practiceStatus.completed} of {practiceStatus.total} completed</span>
              <span className="font-semibold">{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
          </div>

          <Button
            onClick={() => navigate('/mind-insurance/practice')}
            className="w-full bg-purple-600 hover:bg-purple-700"
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
        <Card className="p-6">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Current Streak</h3>
            <p className="text-3xl font-bold">{userStats.streak} days</p>
            <p className="text-sm text-muted-foreground">Keep it going! 🔥</p>
          </div>
        </Card>

        {/* Total Points */}
        <Card className="p-6">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Total Points</h3>
            <p className="text-3xl font-bold">{userStats.totalPoints}</p>
            <p className="text-sm text-muted-foreground">
              {userStats.totalPoints < 150 && 'Next level: 150 points (Silver)'}
              {userStats.totalPoints >= 150 && userStats.totalPoints < 300 && 'Next level: 300 points (Gold)'}
              {userStats.totalPoints >= 300 && userStats.totalPoints < 450 && 'Next level: 450 points (Platinum)'}
              {userStats.totalPoints >= 450 && 'Maximum level achieved!'}
            </p>
          </div>
        </Card>
      </div>

      {/* Latest Insight */}
      {latestInsight && (
        <Card className="p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              Latest Insight
            </h3>
            <div>
              <p className="font-medium">{latestInsight.title}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {latestInsight.read_at ? 'Read' : 'Unread'} •
                {new Date(latestInsight.delivered_at).toLocaleDateString()}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/mind-insurance/insights')}
              className="w-full"
            >
              View Insights
            </Button>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button
          variant="outline"
          onClick={() => navigate('/mind-insurance/insights')}
          className="h-20 flex-col gap-2"
        >
          <FileText className="w-6 h-6" />
          <span>Weekly Insights</span>
        </Button>

        <Button
          variant="outline"
          onClick={() => navigate('/mind-insurance/vault')}
          className="h-20 flex-col gap-2"
        >
          <Shield className="w-6 h-6" />
          <span>Recording Vault</span>
        </Button>

        <Button
          variant="outline"
          onClick={() => navigate('/mind-insurance/championship')}
          className="h-20 flex-col gap-2"
        >
          <TrendingUp className="w-6 h-6" />
          <span>Progress</span>
        </Button>

        <Button
          variant="outline"
          onClick={() => navigate('/avatar-assessment')}
          className="h-20 flex-col gap-2"
        >
          <Brain className="w-6 h-6" />
          <span>Temperament</span>
        </Button>
      </div>
    </div>
  );
}
