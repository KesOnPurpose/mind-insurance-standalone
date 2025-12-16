import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Flame, Brain, Shield, MessageSquare,
  TrendingUp, ChevronDown, FolderArchive,
  TrendingDown, Minus, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { MIOInsightsPinnedItem } from '@/components/chat/MIOInsightsPinnedItem';
import { ConversationFolder } from '@/components/chat/ConversationFolder';
import { useMindInsuranceProgress } from '@/hooks/useMindInsuranceProgress';
import { useIdentityCollisionGrip } from '@/hooks/useIdentityCollisionGrip';
import { useConversationsContext } from '@/contexts/ConversationsContext';
import { getThreadWithDetails, ThreadWithUnread } from '@/services/mioInsightsThreadService';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/ui/sidebar';
import type { GripStrength } from '@/types/coverage';

// Navigation items for Mind Insurance - ordered by importance/usage
// Note: MIO Insights is NOT here because it's in the "Recent Conversations" section
// as a pinned card with alerts, unread count, and message preview
const MI_NAV_ITEMS = [
  { path: '/mind-insurance/coverage', label: 'Coverage Center', icon: TrendingUp },
  { path: '/mind-insurance', label: 'Practice Center', icon: Shield },
  { path: '/mind-insurance/vault', label: 'My Evidence', icon: FolderArchive },
];

/**
 * MindInsurancePanel - Complete sidebar panel for Mind Insurance
 *
 * Structure:
 * 1. Ask MIO Button + Recent Conversations (MIO Insights pinned + MIO folder)
 * 2. Mind Insurance Navigation (Practice Hub, Championship, etc.)
 * 3. Your Progress (collapsible, collapsed by default on mobile)
 */
// Grip configuration for sidebar display
const GRIP_CONFIG: Record<GripStrength, { label: string; color: string; bgColor: string; icon: typeof TrendingDown }> = {
  weakening: { label: 'Weakening', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', icon: TrendingDown },
  stable: { label: 'Stable', color: 'text-mi-gold', bgColor: 'bg-mi-gold/10', icon: Minus },
  tightening: { label: 'Tightening', color: 'text-red-400', bgColor: 'bg-red-500/10', icon: TrendingUp },
};

export function MindInsurancePanel() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { data: practiceData, isLoading } = useMindInsuranceProgress();
  const { gripStrength, isLoading: gripLoading } = useIdentityCollisionGrip();
  const { conversations } = useConversationsContext();
  const { setOpenMobile, isMobile } = useSidebar();

  // Track if this is the initial mount (skip closing on mount)
  const isInitialMount = useRef(true);

  // MIO Insights data
  const [mioInsightsData, setMIOInsightsData] = useState<ThreadWithUnread | null>(null);
  const [mioInsightsLoading, setMIOInsightsLoading] = useState(true);

  // Stats collapsed state - default collapsed on mobile
  const [statsOpen, setStatsOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return false;
  });

  // Filter MIO conversations
  const mioConversations = conversations.filter(c => c.coach_type === 'mio');

  // Fetch MIO Insights thread data
  useEffect(() => {
    async function fetchMIOInsights() {
      if (!user?.id) {
        setMIOInsightsLoading(false);
        return;
      }

      try {
        const data = await getThreadWithDetails(user.id);
        setMIOInsightsData(data);
      } catch (err) {
        console.error('[MindInsurancePanel] Error fetching MIO Insights:', err);
      } finally {
        setMIOInsightsLoading(false);
      }
    }

    fetchMIOInsights();
  }, [user?.id]);

  // Default practice data values
  const data = practiceData || {
    currentStreak: 0,
    weeklyPractices: 0,
    weeklyGoal: 49,
    patternAwareness: 0,
  };

  // Close sidebar only when pathname CHANGES (not on initial mount)
  // This pattern separates navigation from sidebar closing, avoiding timing issues
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (isMobile) {
      setOpenMobile(false);
    }
  }, [location.pathname, isMobile, setOpenMobile]);

  // Simple navigate - useEffect handles closing after route change
  const handleNavigate = (path: string) => {
    navigate(path);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col h-full px-2 py-2 space-y-3">
        <Skeleton className="h-10 w-full rounded-lg bg-mi-navy" />
        <Skeleton className="h-16 w-full rounded-lg bg-mi-navy" />
        <Skeleton className="h-32 w-full rounded-lg bg-mi-navy" />
        <Skeleton className="h-24 w-full rounded-lg bg-mi-navy" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Ask MIO Button */}
      <div className="px-2 py-2">
        <Button
          onClick={() => handleNavigate('/mind-insurance/chat')}
          className="w-full justify-start gap-2 bg-mi-cyan hover:bg-mi-cyan/90 text-white"
        >
          <MessageSquare className="h-4 w-4" />
          Ask MIO
        </Button>
      </div>

      {/* Conversations Section */}
      <div className="px-2 py-2 flex-1 overflow-y-auto">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
          Recent Conversations
        </p>

        {/* MIO Insights Pinned */}
        <MIOInsightsPinnedItem
          thread={mioInsightsData?.thread || null}
          lastMessage={mioInsightsData?.lastMessage}
          unreadCount={mioInsightsData?.unreadCount || 0}
          isActive={location.pathname === '/mind-insurance/mio-insights'}
          isLoading={mioInsightsLoading}
          onClick={() => handleNavigate('/mind-insurance/mio-insights')}
        />

        {/* MIO Conversations Folder - Expanded by Default */}
        {mioConversations.length > 0 && (
          <div className="mt-2">
            <ConversationFolder
              coachType="mio"
              conversations={mioConversations}
              activeConversationId={null}
              isDefaultOpen={false}
              onSelectConversation={(id) => handleNavigate(`/mind-insurance/chat?conversation=${id}`)}
              onRenameConversation={async () => true}
              onArchiveConversation={async () => true}
            />
          </div>
        )}
      </div>

      {/* Mind Insurance Navigation */}
      <div className="px-2 py-2 border-t border-white/10">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
          Mind Insurance
        </p>
        <nav className="space-y-1">
          {MI_NAV_ITEMS.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => handleNavigate(path)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-mi-cyan/20 text-mi-cyan border-l-2 border-mi-cyan"
                    : "text-gray-400 hover:bg-mi-navy-light hover:text-white"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Progress Stats - Collapsible */}
      {/* P6 Redesign: Enhanced with Identity Collision Grip and Pattern Awareness as primary */}
      <div className="px-2 py-2 border-t border-white/10">
        <Collapsible open={statsOpen} onOpenChange={setStatsOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full text-xs font-medium text-gray-500 uppercase tracking-wider py-1 hover:text-gray-400 transition-colors">
            Your Progress
            <ChevronDown className={cn("h-4 w-4 transition-transform", statsOpen && "rotate-180")} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2">
            {/* Identity Collision Grip - NEW: P6 Hero Metric */}
            {!gripLoading && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={cn(
                      "flex items-center justify-between rounded-lg px-3 py-2 cursor-help",
                      GRIP_CONFIG[gripStrength].bgColor
                    )}>
                      <div className="flex items-center gap-2">
                        <Brain className={cn("h-4 w-4", GRIP_CONFIG[gripStrength].color)} />
                        <span className="text-sm text-gray-300">Collision Grip</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {(() => {
                          const GripIcon = GRIP_CONFIG[gripStrength].icon;
                          return <GripIcon className={cn("h-3 w-3", GRIP_CONFIG[gripStrength].color)} />;
                        })()}
                        <span className={cn("text-sm font-bold", GRIP_CONFIG[gripStrength].color)}>
                          {GRIP_CONFIG[gripStrength].label}
                        </span>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-[200px] bg-mi-navy-light border-mi-cyan/20">
                    <p className="text-xs">
                      {gripStrength === 'weakening' && "The old you is losing its grip. Keep going!"}
                      {gripStrength === 'stable' && "The battle is even. One more practice tips the scale."}
                      {gripStrength === 'tightening' && "Identity Collision is fighting back. Return to the protocol."}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Pattern Awareness - PRIMARY METRIC (larger display) */}
            <div className="flex items-center justify-between bg-purple-500/10 rounded-lg px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-400" />
                <span className="text-sm text-gray-300">Awareness</span>
              </div>
              <span className="text-base font-bold text-purple-400">{data.patternAwareness}%</span>
            </div>

            {/* Streak */}
            <div className="flex items-center justify-between bg-mi-navy-light rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-mi-gold" />
                <span className="text-sm text-gray-300">Streak</span>
              </div>
              <span className="text-sm font-bold text-mi-gold">{data.currentStreak} days</span>
            </div>

            {/* Weekly Completion */}
            <div className="flex items-center justify-between bg-mi-navy-light rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-mi-cyan" />
                <span className="text-sm text-gray-300">Completion</span>
              </div>
              <span className="text-sm font-bold text-mi-cyan">{data.weeklyPractices}/{data.weeklyGoal}</span>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}

export default MindInsurancePanel;
