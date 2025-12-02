// WeeklyInsightsPage - Main hub for MIO & Coach protocols
// Phase 26: Weekly Insights Feature

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Calendar, Brain, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Hub components
import { WeekProgressRing } from '@/components/weekly-insights/hub/WeekProgressRing';
import { StreakDisplay } from '@/components/weekly-insights/hub/StreakDisplay';
import { MIOProtocolCard } from '@/components/weekly-insights/hub/MIOProtocolCard';
import { CoachProtocolCard } from '@/components/weekly-insights/hub/CoachProtocolCard';

// Services
import { getCurrentMIOProtocol, getMIOProtocolStreak } from '@/services/protocolService';
import { getCurrentCoachProtocol } from '@/services/coachProtocolService';

// Types
import type { MIOProtocolWithProgress, CoachProtocolWithTasks, ProtocolDayProgress } from '@/types/protocol';

export default function WeeklyInsightsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // State
  const [mioProtocol, setMioProtocol] = useState<MIOProtocolWithProgress | null>(null);
  const [coachProtocol, setCoachProtocol] = useState<CoachProtocolWithTasks | null>(null);
  const [streak, setStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get current week info
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekNumber = Math.ceil((((now.getTime() - startOfYear.getTime()) / 86400000) + startOfYear.getDay() + 1) / 7);
  const dayOfWeek = now.getDay();
  const currentDayNumber = dayOfWeek === 0 ? 7 : dayOfWeek;

  // Calculate days progress for the ring
  const getDaysProgress = (): ProtocolDayProgress[] => {
    if (!mioProtocol?.progress?.daily_completions) {
      return Array.from({ length: 7 }, (_, i) => ({
        day: i + 1,
        completed: false,
      }));
    }

    return Array.from({ length: 7 }, (_, i) => {
      const day = i + 1;
      const completion = mioProtocol.progress?.daily_completions?.[day.toString()];
      return {
        day,
        completed: completion?.completed ?? false,
        completedAt: completion?.completed_at,
      };
    });
  };

  // Fetch data
  const fetchData = async () => {
    if (!user?.id) return;

    try {
      const [mioResult, coachResult, streakResult] = await Promise.all([
        getCurrentMIOProtocol(user.id),
        getCurrentCoachProtocol(user.id),
        getMIOProtocolStreak(user.id),
      ]);

      setMioProtocol(mioResult);
      setCoachProtocol(coachResult);
      setStreak(streakResult);
    } catch (error) {
      console.error('Error fetching weekly insights:', error);
      toast({
        title: 'Error loading insights',
        description: 'Please try refreshing the page.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchData();
  }, [user?.id]);

  // Refresh handler
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  return (
    <div className="min-h-screen bg-mi-navy">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/mind-insurance')}
              className="text-gray-400 hover:text-white hover:bg-mi-navy-light -ml-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Hub
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-gray-400 hover:text-white hover:bg-mi-navy-light"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Title Row */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">
                Weekly Insights
              </h1>
              <p className="text-gray-400 text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Week {weekNumber} of 52
              </p>
            </div>
            <StreakDisplay streak={streak} size="md" />
          </div>

          {/* Week Progress Ring */}
          <div className="bg-mi-navy-light rounded-xl p-4 border border-gray-800">
            <WeekProgressRing
              days={getDaysProgress()}
              currentDay={currentDayNumber}
            />
          </div>
        </div>

        {/* Protocol Sections */}
        <div className="space-y-6">
          {/* MIO Dynamic Protocol Section */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Brain className="h-5 w-5 text-mi-cyan" />
              <h2 className="text-lg font-semibold text-white">
                MIO Protocol
              </h2>
              <span className="text-xs text-gray-500 bg-mi-navy-light px-2 py-0.5 rounded">
                AI-Generated
              </span>
            </div>
            <MIOProtocolCard
              protocol={mioProtocol}
              isLoading={isLoading}
            />
          </section>

          {/* Coach Content Section */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <User className="h-5 w-5 text-mi-gold" />
              <h2 className="text-lg font-semibold text-white">
                Coach Content
              </h2>
              <span className="text-xs text-gray-500 bg-mi-navy-light px-2 py-0.5 rounded">
                Expert-Curated
              </span>
            </div>
            <CoachProtocolCard
              protocol={coachProtocol}
              isLoading={isLoading}
            />
          </section>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            Complete daily tasks to build your streak and unlock insights
          </p>
        </div>
      </div>
    </div>
  );
}
