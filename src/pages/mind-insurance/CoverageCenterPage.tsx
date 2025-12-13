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
import { Brain, Users, RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

// Coverage Center components
import {
  CoverageHeader,
  ActiveMIOProtocolCard,
  MIOProtocolHistory,
  TransformationMetrics,
  CoverageMilestones,
  ActiveCoachProtocolCard,
  CoachProtocolHistory,
  StreakResetModal,
  StreakProtectedDialog,
} from '@/components/coverage-center';

// Hooks
import { useCoverageStreak } from '@/hooks/useCoverageStreak';
import { useCoverageHistory } from '@/hooks/useCoverageHistory';

// Services
import { getActiveInsightProtocol } from '@/services/mioInsightProtocolService';
import { getUserMilestones } from '@/services/coverageStreakService';

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

  // Local state
  const [activeProtocol, setActiveProtocol] = useState<MIOInsightProtocolWithProgress | null>(null);
  const [milestones, setMilestones] = useState<CoverageMilestoneWithProtocol[]>([]);
  const [coachAssignment, setCoachAssignment] = useState<any>(null);
  const [protocolLoading, setProtocolLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('mio');

  // Modal state
  const [showStreakResetModal, setShowStreakResetModal] = useState(false);
  const [showStreakProtectedDialog, setShowStreakProtectedDialog] = useState(false);

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

  // Initial data fetch
  useEffect(() => {
    if (user?.id && !authLoading) {
      fetchActiveProtocol();
      fetchMilestones();
    }
  }, [user?.id, authLoading, fetchActiveProtocol, fetchMilestones]);

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
    ]);
    toast({
      title: 'Refreshed',
      description: 'Coverage data has been updated.',
    });
  }, [refreshStreak, refreshHistory, fetchActiveProtocol, fetchMilestones, toast]);

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
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <p className="text-muted-foreground">Please sign in to view your coverage.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <CoverageHeader
          currentStreak={currentStreak}
          longestStreak={longestStreak}
          skipTokens={skipTokens}
          milestones={milestones}
          isLoading={isLoading}
          onBack={() => navigate('/mind-insurance')}
          onRefresh={handleRefresh}
        />

        {/* Tabbed Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="mio" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              MIO Coverage
            </TabsTrigger>
            <TabsTrigger
              value="coach"
              className="flex items-center gap-2"
              disabled={!hasCoachProtocol && coachHistory.length === 0}
            >
              <Users className="h-4 w-4" />
              Coach Coverage
              {!hasCoachProtocol && coachHistory.length === 0 && (
                <span className="text-xs text-muted-foreground">(Coming Soon)</span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* MIO Coverage Tab */}
          <TabsContent value="mio" className="space-y-6 mt-6">
            {/* Active Protocol */}
            <ActiveMIOProtocolCard
              protocol={activeProtocol}
              currentStreak={currentStreak}
              isLoading={protocolLoading}
              onStartTask={() => {
                if (activeProtocol) {
                  navigate(`/mind-insurance/protocol/${activeProtocol.id}/day/${activeProtocol.current_day}`);
                }
              }}
              onViewProtocol={() => {
                if (activeProtocol) {
                  navigate(`/mind-insurance/protocol/${activeProtocol.id}`);
                }
              }}
            />

            {/* Milestones */}
            <CoverageMilestones
              currentStreak={currentStreak}
              achievedMilestones={milestones}
            />

            {/* Transformation Metrics */}
            <TransformationMetrics
              metrics={metrics}
              currentStreak={currentStreak}
              longestStreak={longestStreak}
              isLoading={historyLoading}
            />

            {/* Protocol History */}
            <MIOProtocolHistory
              history={mioHistory}
              isLoading={historyLoading}
              hasMore={hasMoreMio}
              onLoadMore={() => loadMore('mio')}
              onViewProtocol={handleViewProtocol}
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
              onViewProtocol={handleViewProtocol}
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
    <div className="min-h-screen bg-background">
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
