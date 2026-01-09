// CoachProtocolTabs Component
// Displays user's active coach protocols in Primary/Secondary tabs
//
// Premium Glass-Morphism Styling: CYAN accents (differentiates from MIO's gold)
// Visual Language: Coach protocols = Cyan, MIO protocols = Gold

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  ChevronRight,
  Sparkles,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CoachProtocolDayView } from './CoachProtocolDayView';
import { useCoachProtocols } from '@/hooks/useCoachProtocols';
import { useCoachProtocolTasks } from '@/hooks/useCoachProtocolTasks';
import { cn } from '@/lib/utils';
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
      <Card className={cn(
        "overflow-hidden",
        "bg-mi-navy/80 backdrop-blur-xl",
        "border border-mi-cyan/20",
        "shadow-[0_8px_32px_rgba(5,195,221,0.1)]"
      )}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-3">
            <motion.div
              className="w-5 h-5 rounded-full bg-mi-cyan/30"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span className="text-gray-400">Loading coach protocols...</span>
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
        <Card className={cn(
          "overflow-hidden",
          "bg-mi-navy/80 backdrop-blur-xl",
          "border border-mi-cyan/20",
          "shadow-[0_8px_32px_rgba(5,195,221,0.1)]"
        )}>
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-3 py-8">
              <motion.div
                className="w-5 h-5 rounded-full bg-mi-cyan/30"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span className="text-gray-400">Loading today's tasks...</span>
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
    <Card className={cn(
      "relative overflow-hidden",
      // Premium glass-morphism effect
      "bg-mi-navy/80 backdrop-blur-xl",
      "border border-mi-cyan/20",
      "shadow-[0_8px_32px_rgba(5,195,221,0.15),0_0_60px_rgba(5,195,221,0.08)]"
    )}>
      {/* Animated gradient border glow */}
      <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
        <div className="absolute inset-[-2px] bg-gradient-to-br from-mi-cyan/20 via-transparent to-cyan-400/20 opacity-50" />
      </div>

      <CardHeader className="pb-2 relative z-10">
        {/* Background gradient mesh */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-gradient-to-br from-mi-cyan/15 to-transparent blur-2xl" />
          <div className="absolute -bottom-5 -right-5 w-32 h-32 rounded-full bg-cyan-400/10 blur-xl" />
        </div>

        <div className="flex items-center justify-between relative z-10">
          <CardTitle className="flex items-center gap-2 text-lg text-white">
            <div className={cn(
              "p-1.5 rounded-lg",
              "bg-gradient-to-br from-mi-cyan/30 to-cyan-400/20",
              "border border-mi-cyan/30"
            )}>
              <Users className="h-4 w-4 text-mi-cyan" />
            </div>
            <span className="text-mi-cyan">Coach Protocols</span>
          </CardTitle>
          <Sparkles className="h-4 w-4 text-mi-cyan/50" />
        </div>
      </CardHeader>
      <CardContent className="pt-0 relative z-10">
        <Tabs value={activeSlot} onValueChange={(v) => setActiveSlot(v as AssignmentSlot)}>
          <TabsList className={cn(
            "grid w-full grid-cols-2 mb-4",
            "bg-white/5 backdrop-blur-sm",
            "border border-mi-cyan/10"
          )}>
            <TabsTrigger
              value="primary"
              disabled={!protocols.primary}
              className={cn(
                "data-[state=active]:bg-mi-cyan/20 data-[state=active]:text-mi-cyan",
                "data-[state=active]:shadow-[0_0_10px_rgba(5,195,221,0.3)]",
                "text-gray-400 transition-all duration-300"
              )}
            >
              <div className="flex items-center gap-2">
                <span>Primary</span>
                {protocols.primary && (
                  <Badge className="text-xs bg-mi-cyan/20 text-mi-cyan border-mi-cyan/30">
                    {getSlotTasks('primary').completedCount}/{getSlotTasks('primary').totalCount}
                  </Badge>
                )}
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="secondary"
              disabled={!protocols.secondary}
              className={cn(
                "data-[state=active]:bg-mi-cyan/20 data-[state=active]:text-mi-cyan",
                "data-[state=active]:shadow-[0_0_10px_rgba(5,195,221,0.3)]",
                "text-gray-400 transition-all duration-300"
              )}
            >
              <div className="flex items-center gap-2">
                <span>Secondary</span>
                {protocols.secondary && (
                  <Badge className="text-xs bg-mi-cyan/20 text-mi-cyan border-mi-cyan/30">
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
    <motion.div
      className={cn(
        "p-4 rounded-xl cursor-pointer transition-all",
        // Premium glass card
        "bg-white/5 backdrop-blur-sm",
        "border border-mi-cyan/20",
        "hover:bg-white/8 hover:border-mi-cyan/40",
        "hover:shadow-[0_4px_20px_rgba(5,195,221,0.15)]",
        "group"
      )}
      onClick={onExpand}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Protocol Title */}
          <h4 className="font-semibold text-base text-white group-hover:text-mi-cyan transition-colors">
            {protocol.protocol.title}
          </h4>

          {/* Week/Day Info */}
          <div className="flex items-center gap-3 mt-2 text-sm text-gray-400">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4 text-mi-cyan" />
              Week {protocol.assignment.current_week}, Day {protocol.assignment.current_day}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-cyan-400" />
              {protocol.progress.days_remaining} days left
            </div>
          </div>

          {/* Today's Progress */}
          <div className="flex items-center gap-2 mt-3">
            {isAllTodayComplete ? (
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                <CheckCircle className="h-3 w-3 mr-1" />
                Today Complete
              </Badge>
            ) : (
              <Badge className="bg-mi-cyan/20 text-mi-cyan border-mi-cyan/30">
                {tasks.completedCount}/{tasks.totalCount} tasks today
              </Badge>
            )}
          </div>

          {/* Overall Progress - Cyan gradient */}
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Overall Progress</span>
              <span className="text-mi-cyan font-medium">{Math.round(progressPercent)}%</span>
            </div>
            <div className="h-2 bg-mi-cyan/10 rounded-full overflow-hidden border border-mi-cyan/20">
              <motion.div
                className="h-full bg-gradient-to-r from-mi-cyan to-cyan-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>

        <ChevronRight className="h-5 w-5 text-mi-cyan ml-4 group-hover:translate-x-1 transition-transform" />
      </div>
    </motion.div>
  );
}

function EmptySlot({ slot }: { slot: AssignmentSlot }) {
  return (
    <div className={cn(
      "p-6 text-center rounded-xl",
      "bg-white/5 backdrop-blur-sm",
      "border border-mi-cyan/10 border-dashed"
    )}>
      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-mi-cyan/10 flex items-center justify-center">
        <BookOpen className="h-6 w-6 text-mi-cyan/50" />
      </div>
      <p className="text-sm text-gray-500">No {slot} protocol assigned</p>
    </div>
  );
}

export default CoachProtocolTabs;
