/**
 * ProtocolDetailPage
 * Phase 27: Full 7-day protocol view
 *
 * Shows:
 * - Original insight summary
 * - All 7 days with completion status
 * - Current day highlighted
 * - Ability to complete current day
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Sparkles,
  Brain,
  CheckCircle2,
  Circle,
  Clock,
  Target,
  ChevronDown,
  ChevronUp,
  Calendar,
  Trophy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/contexts/AuthContext';
import {
  getProtocolById,
  completeProtocolDay,
  skipToDay,
  calculateCurrentProtocolDay,
} from '@/services/mioInsightProtocolService';
import type { MIOInsightProtocolWithProgress, MIOInsightDayTask } from '@/types/protocol';
import { toast } from 'sonner';

export default function ProtocolDetailPage() {
  const { protocolId } = useParams<{ protocolId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [protocol, setProtocol] = useState<MIOInsightProtocolWithProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [completingDay, setCompletingDay] = useState<number | null>(null);

  useEffect(() => {
    loadProtocol();
  }, [protocolId]);

  async function loadProtocol() {
    if (!protocolId) return;

    setLoading(true);
    const data = await getProtocolById(protocolId);
    setProtocol(data);

    // Auto-expand current day
    if (data) {
      setExpandedDay(data.current_day);
    }

    setLoading(false);
  }

  const handleCompleteDay = async (dayNumber: number) => {
    if (!protocol) return;

    setCompletingDay(dayNumber);

    const result = await completeProtocolDay({
      protocol_id: protocol.id,
      day_number: dayNumber,
    });

    setCompletingDay(null);

    if (result.success) {
      toast.success(`Day ${dayNumber} complete!`, {
        description:
          result.protocol_completed
            ? '🎉 You completed the entire protocol!'
            : `${7 - dayNumber} days remaining`,
      });
      loadProtocol(); // Refresh data
    } else {
      toast.error('Failed to complete day', {
        description: result.error,
      });
    }
  };

  const handleSkipToToday = async () => {
    if (!protocol || !protocol.assigned_week_start) return;

    const actualDay = calculateCurrentProtocolDay(protocol.assigned_week_start);
    if (actualDay <= protocol.current_day) return;

    const result = await skipToDay(protocol.id, actualDay);

    if (result.success) {
      toast.info(`Skipped to Day ${actualDay}`, {
        description: `${result.days_skipped} days were auto-skipped`,
      });
      loadProtocol();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Sparkles className="w-12 h-12 text-cyan-400" />
        </motion.div>
      </div>
    );
  }

  if (!protocol) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-6">
        <p className="text-slate-400 mb-4">Protocol not found</p>
        <Button variant="outline" onClick={() => navigate('/mind-insurance')}>
          Back to Mind Insurance
        </Button>
      </div>
    );
  }

  const progressPercent = (protocol.days_completed / 7) * 100;
  const isCompleted = protocol.status === 'completed';
  const isMuted = protocol.muted_by_coach;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800/50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Badge
            variant="outline"
            className={
              isCompleted
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : isMuted
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
            }
          >
            {isCompleted
              ? 'Completed'
              : isMuted
              ? 'Paused by Coach'
              : `Day ${protocol.current_day} of 7`}
          </Badge>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Protocol Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
              {isCompleted ? (
                <Trophy className="w-6 h-6 text-white" />
              ) : (
                <Brain className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{protocol.title}</h1>
              <p className="text-sm text-slate-400 mt-1">
                <Calendar className="w-3 h-3 inline mr-1" />
                Week {protocol.week_number}, {protocol.year}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <Card className="bg-slate-800/30 border-slate-700/30 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Progress</span>
              <span className="text-sm text-white font-medium">
                {protocol.days_completed}/7 days
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
            {protocol.days_skipped > 0 && (
              <p className="text-xs text-slate-500 mt-2">
                {protocol.days_skipped} day(s) skipped
              </p>
            )}
          </Card>

          {/* Insight Summary */}
          <Card className="bg-slate-800/50 border-slate-700/50 p-4">
            <p className="text-sm text-cyan-400 font-medium mb-2">
              This Week's Insight
            </p>
            <p className="text-slate-300">{protocol.insight_summary}</p>
          </Card>
        </motion.div>

        {/* 7-Day List */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-cyan-400" />
            Your 7-Day Protocol
          </h2>

          {protocol.day_tasks.map((task, index) => {
            const dayNumber = task.day;
            const completion = protocol.completions.find(
              (c) => c.day_number === dayNumber
            );
            const isComplete = completion && !completion.was_skipped;
            const wasSkipped = completion?.was_skipped;
            const isCurrent = dayNumber === protocol.current_day && !isCompleted;
            const isFuture = dayNumber > protocol.current_day;
            const isExpanded = expandedDay === dayNumber;

            return (
              <motion.div
                key={dayNumber}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <DayAccordion
                  task={task}
                  dayNumber={dayNumber}
                  isComplete={isComplete}
                  wasSkipped={wasSkipped}
                  isCurrent={isCurrent}
                  isFuture={isFuture}
                  isExpanded={isExpanded}
                  onToggle={() =>
                    setExpandedDay(isExpanded ? null : dayNumber)
                  }
                  onComplete={() => handleCompleteDay(dayNumber)}
                  isCompleting={completingDay === dayNumber}
                  disabled={isMuted || (!isCurrent && !isComplete)}
                />
              </motion.div>
            );
          })}
        </div>

        {/* Neural Principle */}
        {protocol.neural_principle && (
          <Card className="bg-slate-800/30 border-slate-700/30 p-4">
            <p className="text-sm text-cyan-400 font-medium mb-2">
              Neural Rewiring Principle
            </p>
            <p className="text-slate-400 italic">"{protocol.neural_principle}"</p>
          </Card>
        )}

        {/* Muted Warning */}
        {isMuted && (
          <Card className="bg-amber-500/10 border-amber-500/30 p-4">
            <p className="text-amber-400 text-sm">
              This protocol has been paused by your coach.
              {protocol.muted_reason && (
                <span className="block text-amber-300 mt-1">
                  Reason: {protocol.muted_reason}
                </span>
              )}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Day Accordion Component
// ============================================================================

interface DayAccordionProps {
  task: MIOInsightDayTask;
  dayNumber: number;
  isComplete: boolean;
  wasSkipped?: boolean;
  isCurrent: boolean;
  isFuture: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onComplete: () => void;
  isCompleting: boolean;
  disabled: boolean;
}

function DayAccordion({
  task,
  dayNumber,
  isComplete,
  wasSkipped,
  isCurrent,
  isFuture,
  isExpanded,
  onToggle,
  onComplete,
  isCompleting,
  disabled,
}: DayAccordionProps) {
  const getStatusIcon = () => {
    if (isComplete) {
      return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
    }
    if (wasSkipped) {
      return <Circle className="w-5 h-5 text-slate-500" />;
    }
    if (isCurrent) {
      return (
        <div className="w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center">
          <span className="text-xs font-bold text-white">{dayNumber}</span>
        </div>
      );
    }
    return <Circle className="w-5 h-5 text-slate-600" />;
  };

  const getCardStyle = () => {
    if (isComplete) {
      return 'bg-emerald-500/10 border-emerald-500/30';
    }
    if (isCurrent) {
      return 'bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border-cyan-500/30';
    }
    if (wasSkipped) {
      return 'bg-slate-800/20 border-slate-700/20 opacity-60';
    }
    return 'bg-slate-800/30 border-slate-700/30';
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <Card className={`overflow-hidden transition-all ${getCardStyle()}`}>
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 flex items-center justify-between text-left">
            <div className="flex items-center gap-3">
              {getStatusIcon()}
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`font-medium ${
                      isComplete
                        ? 'text-emerald-400'
                        : isCurrent
                        ? 'text-cyan-400'
                        : 'text-white'
                    }`}
                  >
                    Day {dayNumber}: {task.task_title}
                  </span>
                  {isCurrent && !isComplete && (
                    <Badge className="bg-cyan-500/20 text-cyan-400 border-0 text-xs">
                      Today
                    </Badge>
                  )}
                  {wasSkipped && (
                    <Badge className="bg-slate-500/20 text-slate-400 border-0 text-xs">
                      Skipped
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-slate-400">{task.theme}</p>
              </div>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4 border-t border-slate-700/30 pt-4">
            {/* Instructions */}
            <div>
              <p className="text-sm text-cyan-400 font-medium mb-2">
                Instructions
              </p>
              <p className="text-slate-300 whitespace-pre-wrap text-sm">
                {task.task_instructions}
              </p>
            </div>

            {/* Duration */}
            {task.duration_minutes && (
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Clock className="w-4 h-4" />
                ~{task.duration_minutes} minutes
              </div>
            )}

            {/* Success Criteria */}
            {task.success_criteria.length > 0 && (
              <div>
                <p className="text-sm text-cyan-400 font-medium mb-2 flex items-center">
                  <Target className="w-4 h-4 mr-1" />
                  Success Criteria
                </p>
                <ul className="space-y-1">
                  {task.success_criteria.map((criterion, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm text-slate-400"
                    >
                      <CheckCircle2 className="w-3 h-3 text-slate-500 mt-1 flex-shrink-0" />
                      {criterion}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Complete Button */}
            {isCurrent && !isComplete && !disabled && (
              <Button
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500"
                onClick={(e) => {
                  e.stopPropagation();
                  onComplete();
                }}
                disabled={isCompleting}
              >
                {isCompleting ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                  </motion.div>
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                )}
                Mark Day {dayNumber} Complete
              </Button>
            )}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
