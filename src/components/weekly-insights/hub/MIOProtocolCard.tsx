// MIOProtocolCard - AI-generated protocol preview card
// Phase 26: Weekly Insights Feature

import { useNavigate } from 'react-router-dom';
import { Brain, ChevronRight, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { MIOProtocolWithProgress, MIODayTask } from '@/types/protocol';

interface MIOProtocolCardProps {
  protocol: MIOProtocolWithProgress | null;
  isLoading?: boolean;
  className?: string;
}

export function MIOProtocolCard({ protocol, isLoading, className }: MIOProtocolCardProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card className={cn("bg-mi-navy-light border-mi-cyan/20", className)}>
        <CardContent className="p-5">
          <div className="animate-pulse space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-20 h-5 bg-mi-navy rounded" />
              <div className="w-24 h-5 bg-mi-navy rounded" />
            </div>
            <div className="w-3/4 h-6 bg-mi-navy rounded" />
            <div className="w-full h-4 bg-mi-navy rounded" />
            <div className="w-32 h-10 bg-mi-navy rounded mt-4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!protocol) {
    return (
      <Card className={cn("bg-mi-navy-light border-mi-cyan/20 border-dashed", className)}>
        <CardContent className="p-5 flex flex-col items-center justify-center text-center py-8">
          <div className="w-12 h-12 rounded-full bg-mi-cyan/10 flex items-center justify-center mb-3">
            <Brain className="h-6 w-6 text-mi-cyan" />
          </div>
          <h3 className="text-white font-medium mb-1">No Active Protocol</h3>
          <p className="text-gray-400 text-sm mb-4">
            MIO will assign a personalized protocol based on your assessment or chat conversations.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/mind-insurance/chat')}
            className="border-mi-cyan/30 text-mi-cyan hover:bg-mi-cyan/10"
          >
            Talk to MIO
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Get today's task
  const currentDay = protocol.progress?.current_day ?? 1;
  const todayTask = protocol.day_tasks.find(t => t.day === currentDay) as MIODayTask | undefined;
  const isCompleted = protocol.progress?.daily_completions?.[currentDay.toString()]?.completed ?? false;
  const completedDays = protocol.progress
    ? Object.values(protocol.progress.daily_completions).filter(c => c.completed).length
    : 0;

  return (
    <Card className={cn(
      "bg-mi-navy-light border-mi-cyan/30 hover:border-mi-cyan/50 transition-all group",
      className
    )}>
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="bg-mi-cyan/10 text-mi-cyan border-mi-cyan/30 text-xs"
            >
              <Brain className="h-3 w-3 mr-1" />
              AI PROTOCOL
            </Badge>
            <Badge
              variant="outline"
              className="bg-mi-navy text-gray-400 border-gray-600 text-xs"
            >
              Day {currentDay}/7
            </Badge>
          </div>
          <span className="text-mi-cyan text-sm font-medium">
            {completedDays}/7 complete
          </span>
        </div>

        {/* Protocol Title */}
        <h3 className="text-white font-semibold text-lg mb-2 line-clamp-1">
          {protocol.protocol_theme}
        </h3>

        {/* Today's Task Preview */}
        {todayTask && (
          <div className="mb-4">
            <p className="text-gray-400 text-sm mb-1">Today's Focus:</p>
            <p className="text-white/90 text-sm line-clamp-2">
              {todayTask.theme} - {todayTask.morning_task.title}
            </p>
          </div>
        )}

        {/* Action Button */}
        <Button
          onClick={() => navigate(`/mind-insurance/insights/protocol/${protocol.id}`)}
          className={cn(
            "w-full transition-all",
            isCompleted
              ? "bg-mi-navy border border-mi-cyan/30 text-mi-cyan hover:bg-mi-cyan/10"
              : "bg-mi-cyan hover:bg-mi-cyan/90 text-white"
          )}
        >
          {isCompleted ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              View Today's Protocol
            </>
          ) : (
            <>
              <Clock className="mr-2 h-4 w-4" />
              Complete Today's Protocol
            </>
          )}
          <ChevronRight className="ml-auto h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Button>
      </CardContent>
    </Card>
  );
}

export default MIOProtocolCard;
