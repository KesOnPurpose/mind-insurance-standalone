// CoachProtocolTabs Component
// Displays user's active coach protocols in Primary/Secondary tabs

import React, { useState } from 'react';
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
import { Progress } from '@/components/ui/progress';
import { CoachProtocolDayView } from './CoachProtocolDayView';
import { useCoachProtocols } from '@/hooks/useCoachProtocols';
import { useCoachProtocolTasks } from '@/hooks/useCoachProtocolTasks';
import type { AssignmentSlot } from '@/types/coach-protocol';

interface CoachProtocolTabsProps {
  onProtocolComplete?: () => void;
}

export function CoachProtocolTabs({ onProtocolComplete }: CoachProtocolTabsProps) {
  const { protocols, isLoading } = useCoachProtocols();
  const { todayTasks, completeTaskHandler, isSaving, getSlotTasks } = useCoachProtocolTasks();
  const [activeSlot, setActiveSlot] = useState<AssignmentSlot>('primary');
  const [expandedView, setExpandedView] = useState<AssignmentSlot | null>(null);

  // Check if user has any protocols
  const hasProtocols = protocols.primary || protocols.secondary;

  if (isLoading) {
    return (
      <Card className="border-l-4 border-l-[#fac832]">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">
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

    if (!slotData || !protocolData) {
      setExpandedView(null);
      return null;
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
      />
    );
  }

  return (
    <Card className="border-l-4 border-l-[#fac832]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5 text-[#fac832]" />
            Coach Protocols
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs value={activeSlot} onValueChange={(v) => setActiveSlot(v as AssignmentSlot)}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="primary" disabled={!protocols.primary}>
              <div className="flex items-center gap-2">
                <span>Primary</span>
                {protocols.primary && (
                  <Badge variant="secondary" className="text-xs">
                    {getSlotTasks('primary').completedCount}/{getSlotTasks('primary').totalCount}
                  </Badge>
                )}
              </div>
            </TabsTrigger>
            <TabsTrigger value="secondary" disabled={!protocols.secondary}>
              <div className="flex items-center gap-2">
                <span>Secondary</span>
                {protocols.secondary && (
                  <Badge variant="secondary" className="text-xs">
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
      className="p-4 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
      onClick={onExpand}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Protocol Title */}
          <h4 className="font-semibold text-base">{protocol.protocol.title}</h4>

          {/* Week/Day Info */}
          <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Week {protocol.assignment.current_week}, Day {protocol.assignment.current_day}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {protocol.progress.days_remaining} days left
            </div>
          </div>

          {/* Today's Progress */}
          <div className="flex items-center gap-2 mt-3">
            {isAllTodayComplete ? (
              <Badge className="bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Today Complete
              </Badge>
            ) : (
              <Badge variant="outline">
                {tasks.completedCount}/{tasks.totalCount} tasks today
              </Badge>
            )}
          </div>

          {/* Overall Progress */}
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Overall Progress</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        </div>

        <ChevronRight className="h-5 w-5 text-muted-foreground ml-4" />
      </div>
    </div>
  );
}

function EmptySlot({ slot }: { slot: AssignmentSlot }) {
  return (
    <div className="p-6 text-center text-muted-foreground bg-muted/30 rounded-lg">
      <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
      <p className="text-sm">No {slot} protocol assigned</p>
    </div>
  );
}

export default CoachProtocolTabs;
