/**
 * RKPI Page: RelationshipDashboard
 * Main dashboard showing overall score, KPI heat map, trend chart,
 * recent check-ins, partner status, weekly connection prompt,
 * Phase 1A Vertex Model, Phase 1B Solo User, Phase 1C Daily Pulse,
 * and Phase 2 Marriage Seasons components.
 */

import { useNavigate } from 'react-router-dom';
import { Heart, Plus, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useRelationshipKpis } from '@/hooks/useRelationshipKpis';
import { useRelationship } from '@/contexts/RelationshipContext';
import { useRelationshipSeparation } from '@/contexts/RelationshipSeparationContext';
import { useRelationshipSolo } from '@/contexts/RelationshipSoloContext';
import { OverallScoreCard } from '@/components/relationship-kpis/dashboard/OverallScoreCard';
import { KPIHeatMap } from '@/components/relationship-kpis/dashboard/KPIHeatMap';
import { TrendChart } from '@/components/relationship-kpis/dashboard/TrendChart';
import { RecentCheckIns } from '@/components/relationship-kpis/dashboard/RecentCheckIns';
import { PartnerStatusCard } from '@/components/relationship-kpis/dashboard/PartnerStatusCard';
import { VertexGauge } from '@/components/relationship/separation/VertexGauge';
import { SeparationBreakdown } from '@/components/relationship/separation/SeparationBreakdown';
import { VertexTrendLine } from '@/components/relationship/separation/VertexTrendLine';
import { SoloProgressCard } from '@/components/relationship/solo/SoloProgressCard';
import { SoloOnboarding } from '@/components/relationship/solo/SoloOnboarding';
import { BecomeTheChangeTracker } from '@/components/relationship/solo/BecomeTheChangeTracker';
import { DailyPulseCard } from '@/components/relationship/daily-pulse/DailyPulseCard';
import { ActiveSeasonCard } from '@/components/relationship/seasons/ActiveSeasonCard';
import { SeasonSuggestionCard } from '@/components/relationship/seasons/SeasonSuggestionCard';

export default function RelationshipDashboard() {
  const navigate = useNavigate();
  const {
    overallScore,
    currentStreak,
    checkInDueThisWeek,
    isLoading,
    heatMap,
  } = useRelationshipKpis();

  const {
    recentCheckIns,
    weeklyPrompt,
    startCheckIn,
  } = useRelationship();

  const {
    separationAngle,
    latestAssessment,
    assessmentHistory,
    isLoading: separationLoading,
  } = useRelationshipSeparation();

  const {
    isSoloUser,
    onboardingCompleted,
    isLoading: soloLoading,
  } = useRelationshipSolo();

  // Get previous score for trend comparison
  const completedCheckIns = recentCheckIns.filter((ci) => ci.status === 'completed');
  const previousScore = completedCheckIns.length > 1 ? completedCheckIns[1].overall_score : null;
  const latestWeek = completedCheckIns.length > 0 ? completedCheckIns[0].check_in_week : null;

  const handleStartCheckIn = async () => {
    await startCheckIn();
    navigate('/relationship-kpis/check-in');
  };

  // Loading state
  if (isLoading || separationLoading || soloLoading) {
    return (
      <div className="min-h-screen bg-mi-navy p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Heart className="h-6 w-6 text-rose-400" />
            <h1 className="text-xl font-semibold text-white">Relationship KPIs</h1>
          </div>
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-rose-400" />
          </div>
        </div>
      </div>
    );
  }

  // Empty state — no check-ins at all
  if (completedCheckIns.length === 0) {
    return (
      <div className="min-h-screen bg-mi-navy p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Heart className="h-6 w-6 text-rose-400" />
            <h1 className="text-xl font-semibold text-white">Relationship KPIs</h1>
          </div>
          <Card className="border-rose-500/20 bg-mi-navy-light shadow-lg">
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-rose-400" />
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">
                Start Your First Check-In
              </h2>
              <p className="text-sm text-white/50 max-w-md mx-auto mb-6">
                Rate 10 key relationship areas weekly to track your growth,
                spot patterns, and strengthen your partnership.
              </p>
              <Button
                className="bg-rose-500 hover:bg-rose-600 text-white"
                onClick={handleStartCheckIn}
              >
                <Plus className="h-4 w-4 mr-2" />
                Begin Weekly Check-In
              </Button>
            </CardContent>
          </Card>

          {/* Still show partner status even with no check-ins */}
          <div className="mt-4">
            <PartnerStatusCard />
          </div>
        </div>
      </div>
    );
  }

  // Dashboard with data
  return (
    <div className="min-h-screen bg-mi-navy p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-rose-400" />
            <h1 className="text-xl font-semibold text-white">Relationship KPIs</h1>
          </div>
          <Button
            size="sm"
            className="bg-rose-500 hover:bg-rose-600 text-white"
            onClick={handleStartCheckIn}
          >
            <Plus className="h-4 w-4 mr-1" />
            Check-In
          </Button>
        </div>

        {/* Phase 1B: Solo User Onboarding (show if solo but not onboarded) */}
        {isSoloUser && !onboardingCompleted && (
          <SoloOnboarding />
        )}

        {/* Phase 1B: Solo Progress Card */}
        {isSoloUser && onboardingCompleted && (
          <SoloProgressCard />
        )}

        {/* Overall score */}
        <OverallScoreCard
          overallScore={overallScore}
          previousScore={previousScore}
          currentStreak={currentStreak}
          checkInDueThisWeek={checkInDueThisWeek}
        />

        {/* Phase 1C: Daily Pulse (15-second daily check-in) */}
        <DailyPulseCard />

        {/* Phase 2: Active Marriage Season */}
        <ActiveSeasonCard />

        {/* Phase 3: Season Suggestion Engine */}
        <SeasonSuggestionCard />

        {/* Phase 1A: Vertex Model — Gauge + Breakdown side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <VertexGauge angle={separationAngle} />
          <SeparationBreakdown assessment={latestAssessment} />
        </div>

        {/* Phase 1A: Vertex Trend Line */}
        <VertexTrendLine assessments={assessmentHistory} />

        {/* KPI Heat Map */}
        <KPIHeatMap heatMap={heatMap} latestWeek={latestWeek} />

        {/* Trend Chart + Partner Status (side by side on desktop) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TrendChart recentCheckIns={recentCheckIns} />
          <PartnerStatusCard />
        </div>

        {/* Recent Check-Ins */}
        <RecentCheckIns checkIns={recentCheckIns} />

        {/* Phase 1B: Become the Change Tracker (solo users only) */}
        {isSoloUser && onboardingCompleted && (
          <BecomeTheChangeTracker />
        )}

        {/* Weekly Connection Prompt */}
        {weeklyPrompt && (
          <Card className="border-rose-500/20 bg-mi-navy-light shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-rose-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="h-4 w-4 text-rose-400" />
                </div>
                <div>
                  <p className="text-xs text-rose-400 font-medium mb-1 uppercase tracking-wide">
                    Connection Prompt
                  </p>
                  <p className="text-sm text-white/80 leading-relaxed">
                    {weeklyPrompt.prompt_text}
                  </p>
                  <p className="text-xs text-white/30 mt-2 capitalize">
                    {weeklyPrompt.prompt_category} &middot; {weeklyPrompt.intimacy_level}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
