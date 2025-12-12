// CoachProtocolTabs Component
// Displays user's active coach protocols in Primary/Secondary tabs

import { useState, useEffect } from 'react';
import {
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CoachProtocolDayView } from './CoachProtocolDayView';
import { useCoachProtocols } from '@/hooks/useCoachProtocols';
import { useCoachProtocolTasks } from '@/hooks/useCoachProtocolTasks';
import type { AssignmentSlot } from '@/types/coach-protocol';

interface CoachProtocolTabsProps {
  onProtocolComplete?: () => void;
}

export function CoachProtocolTabs({ onProtocolComplete }: CoachProtocolTabsProps) {
  const { protocols, isLoading } = useCoachProtocols();
  const { todayTasks, completeTaskHandler, isSaving, getSlotTasks, isLoading: tasksLoading } = useCoachProtocolTasks();
  const [activeSlot, setActiveSlot] = useState<AssignmentSlot>('primary');
  const [expandedView, setExpandedView] = useState<AssignmentSlot | null>(null);
  const [hasMultipleProtocols, setHasMultipleProtocols] = useState(false);

  // Check if user has any protocols
  const hasProtocols = protocols.primary || protocols.secondary;
  // Track if user only has ONE protocol (for hiding back button)
  const hasSingleProtocol = (protocols.primary && !protocols.secondary) || (!protocols.primary && protocols.secondary);

  // Auto-expand to day view when protocols load (behavioral science: reduce friction)
  // Only show summary if user has BOTH primary AND secondary protocols
  useEffect(() => {
    if (!isLoading && hasProtocols && expandedView === null) {
      const hasBoth = !!(protocols.primary && protocols.secondary);
      setHasMultipleProtocols(hasBoth);

      // If only one protocol, auto-expand to day view immediately
      if (!hasBoth) {
        if (protocols.primary) {
          setExpandedView('primary');
        } else if (protocols.secondary) {
          setExpandedView('secondary');
        }
      }
    }
  }, [isLoading, protocols.primary, protocols.secondary, hasProtocols, expandedView]);

  // Fix: Handle invalid expanded view state in useEffect (not during render)
  // This prevents React state mutation during render which causes infinite loops
  useEffect(() => {
    if (expandedView) {
      const protocolData = expandedView === 'primary' ? protocols.primary : protocols.secondary;
      if (!protocolData && !isLoading) {
        setExpandedView(null);
      }
    }
  }, [expandedView, protocols.primary, protocols.secondary, isLoading]);

  if (isLoading) {
    return (
      <Card className="bg-mi-navy-light border border-mi-gold/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-pulse text-gray-400">
              Loading coach protocols...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasProtocols) {
    return null; // Don't show anything if no protocols assigned
  }

  // If expanded, show full day view
  if (expandedView) {
    const slotData = expandedView === 'primary' ? todayTasks.primary : todayTasks.secondary;
    const protocolData = expandedView === 'primary' ? protocols.primary : protocols.secondary;
    const slotTasksData = getSlotTasks(expandedView);

    // If protocol doesn't exist at all, return null (useEffect will handle collapse)
    // FIXED: No longer mutating state during render - useEffect handles this
    if (!protocolData) {
      return null;
    }

    // If tasks are still loading, show loading state instead of collapsing
    // This fixes the race condition where protocols load before tasks
    if (!slotData || tasksLoading) {
      return (
        <Card className="bg-mi-navy-light border border-mi-gold/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-8">
              <div className="animate-pulse text-gray-400">
                Loading today's tasks...
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <CoachProtocolDayView
        assignment={slotData.assignment}
        protocol={slotData.protocol}
        tasks={slotData.tasks}
        completedTaskIds={slotData.completed_task_ids}
        totalDays={slotData.total_days}
        absoluteDay={slotData.absolute_day}
        onComplete={completeTaskHandler}
        onBack={() => setExpandedView(null)}
        isSaving={isSaving}
        onProtocolComplete={onProtocolComplete}
        weekThemes={slotTasksData.weekTitles}
        tomorrowTheme={slotTasksData.tomorrowTitle}
        hideBackButton={hasSingleProtocol}
      />
    );
  }

  return (
    <Card className="bg-mi-navy-light border border-mi-gold/30">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg text-white">
            <BookOpen className="h-5 w-5 text-mi-gold" />
            Coach Protocols
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs value={activeSlot} onValueChange={(v) => setActiveSlot(v as AssignmentSlot)}>
          <TabsList className="grid w-full grid-cols-2 mb-4 bg-mi-navy/50">
            <TabsTrigger value="primary" disabled={!protocols.primary} className="data-[state=active]:bg-mi-gold/20 data-[state=active]:text-mi-gold text-gray-400">
              <div className="flex items-center gap-2">
                <span>Primary</span>
                {protocols.primary && (
                  <Badge className="text-xs bg-mi-gold/20 text-mi-gold border-mi-gold/30">
                    {getSlotTasks('primary').completedCount}/{getSlotTasks('primary').totalCount}
                  </Badge>
                )}
              </div>
            </TabsTrigger>
            <TabsTrigger value="secondary" disabled={!protocols.secondary} className="data-[state=active]:bg-mi-gold/20 data-[state=active]:text-mi-gold text-gray-400">
              <div className="flex items-center gap-2">
                <span>Secondary</span>
                {protocols.secondary && (
                  <Badge className="text-xs bg-mi-gold/20 text-mi-gold border-mi-gold/30">
                    {getSlotTasks('secondary').completedCount}/{getSlotTasks('secondary').totalCount}
                  </Badge>
                )}
              </div>
            </TabsTrigger>
          </TabsList>

          {/* Primary Protocol Tab */}
          <TabsContent value="primary">
            {protocols.primary ? (
              <ProtocolSlotCard
                protocol={protocols.primary}
                tasks={getSlotTasks('primary')}
                onExpand={() => setExpandedView('primary')}
              />
            ) : (
              <EmptySlot slot="primary" />
            )}
          </TabsContent>

          {/* Secondary Protocol Tab */}
          <TabsContent value="secondary">
            {protocols.secondary ? (
              <ProtocolSlotCard
                protocol={protocols.secondary}
                tasks={getSlotTasks('secondary')}
                onExpand={() => setExpandedView('secondary')}
              />
            ) : (
              <EmptySlot slot="secondary" />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// =============================================
// SUB-COMPONENTS
// =============================================

interface ProtocolSlotCardProps {
  protocol: NonNullable<ReturnType<typeof useCoachProtocols>['protocols']['primary']>;
  tasks: ReturnType<ReturnType<typeof useCoachProtocolTasks>['getSlotTasks']>;
  onExpand: () => void;
}

function ProtocolSlotCard({ protocol, tasks, onExpand }: ProtocolSlotCardProps) {
  const progressPercent = protocol.progress.completion_percentage;
  const isAllTodayComplete = tasks.allCompleted;

  return (
    <div
      className="p-4 rounded-lg bg-mi-navy/50 border border-mi-gold/20 cursor-pointer hover:bg-mi-navy/70 hover:border-mi-gold/40 transition-all"
      onClick={onExpand}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Protocol Title */}
          <h4 className="font-semibold text-base text-white">{protocol.protocol.title}</h4>

          {/* Week/Day Info */}
          <div className="flex items-center gap-3 mt-2 text-sm text-gray-400">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4 text-mi-gold" />
              Week {protocol.assignment.current_week}, Day {protocol.assignment.current_day}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-mi-gold" />
              {protocol.progress.days_remaining} days left
            </div>
          </div>

          {/* Today's Progress */}
          <div className="flex items-center gap-2 mt-3">
            {isAllTodayComplete ? (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <CheckCircle className="h-3 w-3 mr-1" />
                Today Complete
              </Badge>
            ) : (
              <Badge className="bg-mi-gold/20 text-mi-gold border-mi-gold/30">
                {tasks.completedCount}/{tasks.totalCount} tasks today
              </Badge>
            )}
          </div>

          {/* Overall Progress */}
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Overall Progress</span>
              <span className="text-mi-gold">{Math.round(progressPercent)}%</span>
            </div>
            <div className="h-2 bg-mi-gold/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-mi-gold rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        <ChevronRight className="h-5 w-5 text-mi-gold ml-4" />
      </div>
    </div>
  );
}

function EmptySlot({ slot }: { slot: AssignmentSlot }) {
  return (
    <div className="p-6 text-center text-gray-500 bg-mi-navy/30 rounded-lg border border-mi-navy-light">
      <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50 text-mi-gold/50" />
      <p className="text-sm">No {slot} protocol assigned</p>
    </div>
  );
}

export default CoachProtocolTabs;
