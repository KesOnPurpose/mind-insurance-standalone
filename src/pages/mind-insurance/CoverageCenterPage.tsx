/**
 * CoverageCenterPage
 * Coverage Center - $100M Mind Insurance Feature
 *
 * Main page for Coverage Center - the centralized protocol hub.
 * Features:
 * - Coverage Streak and Skip Tokens display
 * - Tabbed interface for MIO and Coach protocols
 * - Protocol history and transformation metrics
 * - Milestone achievements
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Users, RefreshCw, Loader2, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

// Coverage Center components
// P6 Redesign: Removed TransformationMetrics, CoverageMilestones from main content
// These metrics are now in sidebar (MindInsurancePanel) to reduce visual overload
// Added IdentityCollisionGrip as hero transformation evidence component
import {
  CoverageHeader,
  ActiveMIOProtocolCard,
  MIOProtocolHistory,
  MIOProtocolHistoryCompact,
  ActiveCoachProtocolCard,
  CoachProtocolHistory,
  StreakResetModal,
  StreakProtectedDialog,
  AssessmentsTab,
  IdentityCollisionGrip,
} from '@/components/coverage-center';

// Hooks
import { useCoverageStreak } from '@/hooks/useCoverageStreak';
import { useCoverageHistory } from '@/hooks/useCoverageHistory';
import { useTemperamentStatus } from '@/hooks/useTemperamentStatus';
import { useSubPatternStatus } from '@/hooks/useSubPatternStatus';
import { useIdentityCollisionStatus } from '@/hooks/useIdentityCollisionStatus';
import { useMentalPillarAssessmentStatus } from '@/hooks/useMentalPillarAssessment';
import { useIdentityCollisionGrip } from '@/hooks/useIdentityCollisionGrip';

// Services
import { getActiveInsightProtocol } from '@/services/mioInsightProtocolService';
import { getUserMilestones } from '@/services/coverageStreakService';
import { getUserActiveProtocols } from '@/services/coachProtocolV2Service';

// Types
import type { MIOInsightProtocolWithProgress } from '@/types/protocol';
import type { CoverageMilestoneWithProtocol } from '@/types/coverage';

// ============================================================================
// COMPONENT
// ============================================================================

export default function CoverageCenterPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  // Streak and token state from hook
  const {
    streak,
    fullStreak,
    isLoading: streakLoading,
    isAtRisk,
    canUseToken,
    useToken,
    refresh: refreshStreak,
  } = useCoverageStreak();

  // History state from hook
  const {
    mioHistory,
    coachHistory,
    metrics,
    isLoading: historyLoading,
    hasMoreMio,
    hasMoreCoach,
    loadMore,
    refresh: refreshHistory,
  } = useCoverageHistory();

  // Temperament status
  const {
    data: temperamentStatus,
    isLoading: temperamentLoading,
  } = useTemperamentStatus();

  // Sub-pattern status
  const {
    data: subPatternStatus,
    isLoading: subPatternLoading,
  } = useSubPatternStatus();

  // Collision status (for primary pattern)
  const {
    data: collisionStatus,
    isLoading: collisionLoading,
  } = useIdentityCollisionStatus(user?.id);

  // Mental Pillar status
  const {
    status: mentalPillarStatus,
    isLoading: mentalPillarLoading,
  } = useMentalPillarAssessmentStatus();

  // Identity Collision Grip (P6 Hero Component)
  const {
    gripStrength,
    triggersCaughtThisWeek,
    weekOverWeekChange,
    patternName,
    isLoading: gripLoading,
  } = useIdentityCollisionGrip();

  // Local state
  const [activeProtocol, setActiveProtocol] = useState<MIOInsightProtocolWithProgress | null>(null);
  const [milestones, setMilestones] = useState<CoverageMilestoneWithProtocol[]>([]);
  const [coachAssignment, setCoachAssignment] = useState<any>(null);
  const [protocolLoading, setProtocolLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('mio');

  // Modal state
  const [showStreakResetModal, setShowStreakResetModal] = useState(false);
  const [showStreakProtectedDialog, setShowStreakProtectedDialog] = useState(false);

  // Protocol history expanded state
  const [showFullHistory, setShowFullHistory] = useState(false);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchActiveProtocol = useCallback(async () => {
    if (!user?.id) return;

    setProtocolLoading(true);
    try {
      const protocol = await getActiveInsightProtocol(user.id);
      setActiveProtocol(protocol);
    } catch (err) {
      console.error('[CoverageCenterPage] Error fetching active protocol:', err);
    } finally {
      setProtocolLoading(false);
    }
  }, [user?.id]);

  const fetchMilestones = useCallback(async () => {
    if (!user?.id) return;

    try {
      const data = await getUserMilestones(user.id);
      setMilestones(data);
    } catch (err) {
      console.error('[CoverageCenterPage] Error fetching milestones:', err);
    }
  }, [user?.id]);

  const fetchCoachAssignment = useCallback(async () => {
    if (!user?.id) return;

    try {
      const protocols = await getUserActiveProtocols(user.id);
      // Use primary assignment if available, otherwise secondary
      const activeAssignment = protocols.primary || protocols.secondary;
      if (activeAssignment) {
        setCoachAssignment({
          ...activeAssignment.assignment,
          protocol: activeAssignment.protocol,
          progress: activeAssignment.progress,
        });
      } else {
        setCoachAssignment(null);
      }
    } catch (err) {
      console.error('[CoverageCenterPage] Error fetching coach assignment:', err);
      setCoachAssignment(null);
    }
  }, [user?.id]);

  // Initial data fetch
  useEffect(() => {
    if (user?.id && !authLoading) {
      fetchActiveProtocol();
      fetchMilestones();
      fetchCoachAssignment();
    }
  }, [user?.id, authLoading, fetchActiveProtocol, fetchMilestones, fetchCoachAssignment]);

  // Show streak at-risk modal
  useEffect(() => {
    if (isAtRisk && canUseToken && streak && streak.current_streak > 0) {
      setShowStreakResetModal(true);
    }
  }, [isAtRisk, canUseToken, streak]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      refreshStreak(),
      refreshHistory(),
      fetchActiveProtocol(),
      fetchMilestones(),
      fetchCoachAssignment(),
    ]);
    toast({
      title: 'Refreshed',
      description: 'Coverage data has been updated.',
    });
  }, [refreshStreak, refreshHistory, fetchActiveProtocol, fetchMilestones, fetchCoachAssignment, toast]);

  const handleUseToken = useCallback(async () => {
    const result = await useToken();
    if (result.success) {
      setShowStreakResetModal(false);
      setShowStreakProtectedDialog(true);
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to use skip token.',
        variant: 'destructive',
      });
    }
  }, [useToken, toast]);

  const handleLetStreakReset = useCallback(() => {
    setShowStreakResetModal(false);
    toast({
      title: 'Coverage Lapsed',
      description: 'Complete today\'s protocol to start a new streak.',
    });
  }, [toast]);

  const handleViewProtocol = useCallback((protocolId: string) => {
    navigate(`/mind-insurance/protocol/${protocolId}`);
  }, [navigate]);

  // ============================================================================
  // DERIVED STATE
  // ============================================================================

  const hasCoachProtocol = coachHistory.some((p) => p.status === 'active');
  const currentStreak = streak?.current_streak || 0;
  const longestStreak = streak?.longest_streak || 0;
  const skipTokens = streak?.skip_tokens || 0;
  const isLoading = authLoading || streakLoading || protocolLoading;

  // ============================================================================
  // RENDER
  // ============================================================================

  // Loading state
  if (authLoading) {
    return <CoverageCenterSkeleton />;
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 bg-mi-navy">
        <p className="text-gray-400">Please sign in to view your coverage.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mi-navy">
      <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <CoverageHeader
          currentStreak={currentStreak}
          longestStreak={longestStreak}
          skipTokens={skipTokens}
          milestones={milestones}
          protocolDaysCompleted={activeProtocol?.days_completed ?? 0}
          protocolTotalDays={activeProtocol?.total_days ?? 7}
          isLoading={isLoading}
          onBack={() => navigate('/mind-insurance')}
          onRefresh={handleRefresh}
        />

        {/* Tabbed Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-mi-navy-light border border-mi-cyan/20">
            <TabsTrigger
              value="mio"
              className="flex items-center gap-2 text-gray-400 data-[state=active]:bg-mi-cyan data-[state=active]:text-white data-[state=active]:shadow-none text-xs sm:text-sm"
            >
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">MIO</span> Coverage
            </TabsTrigger>
            <TabsTrigger
              value="assessments"
              className="flex items-center gap-2 text-gray-400 data-[state=active]:bg-mi-cyan data-[state=active]:text-white data-[state=active]:shadow-none text-xs sm:text-sm"
            >
              <ClipboardList className="h-4 w-4" />
              Assessments
            </TabsTrigger>
            <TabsTrigger
              value="coach"
              className="flex items-center gap-2 text-gray-400 data-[state=active]:bg-mi-cyan data-[state=active]:text-white data-[state=active]:shadow-none disabled:text-gray-600 text-xs sm:text-sm"
              disabled={!hasCoachProtocol && coachHistory.length === 0}
            >
              <Users className="h-4 w-4" />
              Coach
              {!hasCoachProtocol && coachHistory.length === 0 && (
                <span className="text-xs text-gray-600 hidden sm:inline">(Soon)</span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* MIO Coverage Tab */}
          {/* P6 Redesign: Simplified - Hero component shows transformation evidence
              CoverageMilestones and TransformationMetrics moved to sidebar */}
          <TabsContent value="mio" className="space-y-6 mt-6">
            {/* Hero: Identity Collision Grip - Transformation Evidence */}
            <IdentityCollisionGrip
              gripStrength={gripStrength}
              patternName={patternName}
              triggersCaughtThisWeek={triggersCaughtThisWeek}
              weekOverWeekChange={weekOverWeekChange}
              currentStreak={currentStreak}
              hasTodaysPractice={activeProtocol?.is_today_completed ?? false}
              daysCompleted={activeProtocol?.days_completed ?? 0}
              isLoading={gripLoading}
            />

            {/* Active Protocol */}
            <ActiveMIOProtocolCard
              protocol={activeProtocol}
              currentStreak={currentStreak}
              isLoading={protocolLoading}
              onStartTask={() => {
                if (activeProtocol) {
                  // Use query param - ProtocolDetailPage auto-expands the day
                  navigate(`/mind-insurance/protocol/${activeProtocol.id}?day=${activeProtocol.current_day}`);
                }
              }}
              onViewProtocol={() => {
                if (activeProtocol) {
                  navigate(`/mind-insurance/protocol/${activeProtocol.id}`);
                }
              }}
            />

            {/* Protocol History - Compact by default, expands on click */}
            {showFullHistory ? (
              <MIOProtocolHistory
                history={mioHistory}
                isLoading={historyLoading}
                hasMore={hasMoreMio}
                onLoadMore={() => loadMore('mio')}
                onViewProtocol={handleViewProtocol}
                onCollapse={() => setShowFullHistory(false)}
              />
            ) : (
              <MIOProtocolHistoryCompact
                history={mioHistory}
                isLoading={historyLoading}
                onExpand={() => setShowFullHistory(true)}
              />
            )}
          </TabsContent>

          {/* Assessments Tab */}
          <TabsContent value="assessments" className="space-y-6 mt-6">
            <AssessmentsTab
              collisionStatus={collisionStatus}
              temperamentStatus={temperamentStatus}
              subPatternStatus={subPatternStatus}
              mentalPillarStatus={mentalPillarStatus ? {
                hasBaseline: !!mentalPillarStatus.baselineDate,
                baselineDate: mentalPillarStatus.baselineDate,
              } : null}
              isLoading={collisionLoading || temperamentLoading || subPatternLoading || mentalPillarLoading}
            />
          </TabsContent>

          {/* Coach Coverage Tab */}
          <TabsContent value="coach" className="space-y-6 mt-6">
            {/* Active Coach Protocol */}
            <ActiveCoachProtocolCard
              assignment={coachAssignment}
              isLoading={historyLoading}
            />

            {/* Coach Protocol History */}
            <CoachProtocolHistory
              history={coachHistory}
              isLoading={historyLoading}
              hasMore={hasMoreCoach}
              onLoadMore={() => loadMore('coach')}
              // onViewProtocol removed - Coach detail page not implemented yet
            />
          </TabsContent>
        </Tabs>

        {/* Modals */}
        <StreakResetModal
          isOpen={showStreakResetModal}
          onClose={() => setShowStreakResetModal(false)}
          currentStreak={currentStreak}
          skipTokens={skipTokens}
          onUseToken={handleUseToken}
          onLetStreakReset={handleLetStreakReset}
        />

        <StreakProtectedDialog
          isOpen={showStreakProtectedDialog}
          onClose={() => setShowStreakProtectedDialog(false)}
          streakCount={currentStreak}
          tokensRemaining={Math.max(0, skipTokens - 1)}
        />
      </div>
    </div>
  );
}

// ============================================================================
// SKELETON
// ============================================================================

function CoverageCenterSkeleton() {
  return (
    <div className="min-h-screen bg-mi-navy">
      <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header skeleton */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-9 w-9" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        </div>

        {/* Tabs skeleton */}
        <Skeleton className="h-10 w-full" />

        {/* Content skeleton */}
        <div className="space-y-6">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
