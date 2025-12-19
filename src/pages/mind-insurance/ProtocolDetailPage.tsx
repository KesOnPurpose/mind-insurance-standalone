/**
 * ProtocolDetailPage
 * Phase 27: Full 7-day protocol view with Premium Glass-morphism
 *
 * Shows:
 * - Original insight summary
 * - All 7 days with completion status
 * - Current day highlighted with gold accents
 * - Ability to complete current day
 *
 * Styling: Premium glass-morphism matching Tour/Protocol Unlock Modal
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  Lightbulb,
  PenLine,
  Cloud,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/contexts/AuthContext';
import { MindInsuranceErrorBoundary } from '@/components/mind-insurance/MindInsuranceErrorBoundary';
import {
  getProtocolById,
  completeProtocolDay,
  skipToDay,
  calculateCurrentProtocolDay,
  updateProtocolReflection,
} from '@/services/mioInsightProtocolService';
import type { MIOInsightProtocolWithProgress, MIOInsightDayTask, MIOProtocolCompletion } from '@/types/protocol';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function ProtocolDetailPage() {
  const { protocolId } = useParams<{ protocolId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [protocol, setProtocol] = useState<MIOInsightProtocolWithProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [completingDay, setCompletingDay] = useState<number | null>(null);

  // Store reflection text for each day (keyed by day number)
  const reflectionTextsRef = useRef<Record<number, string>>({});

  useEffect(() => {
    loadProtocol();
  }, [protocolId]);

  async function loadProtocol() {
    if (!protocolId) return;

    setLoading(true);
    const data = await getProtocolById(protocolId);
    setProtocol(data);

    // Auto-expand day from query param (if provided), otherwise current day
    if (data) {
      const dayParam = searchParams.get('day');
      const targetDay = dayParam ? parseInt(dayParam, 10) : data.current_day;
      // Validate day is between 1-7
      setExpandedDay(targetDay >= 1 && targetDay <= 7 ? targetDay : data.current_day);
    }

    setLoading(false);
  }

  const handleCompleteDay = async (dayNumber: number) => {
    if (!protocol) return;

    setCompletingDay(dayNumber);

    // Get reflection text from the ref
    const reflectionText = reflectionTextsRef.current[dayNumber] || '';

    const result = await completeProtocolDay({
      protocol_id: protocol.id,
      day_number: dayNumber,
      response_data: reflectionText
        ? {
            reflection_text: reflectionText,
            submitted_at: new Date().toISOString(),
            word_count: reflectionText.split(/\s+/).filter(Boolean).length,
          }
        : undefined,
      notes: reflectionText || undefined,
    });

    setCompletingDay(null);

    if (result.success) {
      // Clear the draft from localStorage
      const DRAFT_KEY = `mio_reflection_draft_${protocol.id}_${dayNumber}`;
      localStorage.removeItem(DRAFT_KEY);
      // Clear from ref
      delete reflectionTextsRef.current[dayNumber];

      toast.success(`Day ${dayNumber} complete!`, {
        description:
          result.protocol_completed
            ? 'You completed the entire protocol!'
            : `${7 - dayNumber} days remaining`,
      });
      loadProtocol(); // Refresh data
    } else {
      toast.error('Failed to complete day', {
        description: result.error,
      });
    }
  };

  // Callback for DayAccordion to update reflection text
  const handleReflectionChange = useCallback((dayNumber: number, text: string) => {
    reflectionTextsRef.current[dayNumber] = text;
  }, []);

  const handleSkipToToday = async () => {
    if (!protocol || !protocol.created_at) return;

    // Use created_at for day calculation (not assigned_week_start which is Monday of week)
    const actualDay = calculateCurrentProtocolDay(protocol.created_at);
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
      <div className="min-h-screen bg-mi-navy flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Sparkles className="w-12 h-12 text-mi-cyan" />
        </motion.div>
      </div>
    );
  }

  if (!protocol) {
    return (
      <div className="min-h-screen bg-mi-navy flex flex-col items-center justify-center p-6">
        <p className="text-gray-400 mb-4">Protocol not found</p>
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
    <MindInsuranceErrorBoundary fallbackTitle="Error loading Protocol Details" showHomeButton>
    <div className="min-h-screen bg-mi-navy pb-24">
      {/* Header - Premium Glass */}
      <div className={cn(
        "sticky top-0 z-10",
        "bg-mi-navy/80 backdrop-blur-xl",
        "border-b border-mi-cyan/20",
        "shadow-[0_4px_20px_rgba(5,195,221,0.1)]"
      )}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-white hover:bg-white/5"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Badge
            variant="outline"
            className={cn(
              isCompleted
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : isMuted
                ? 'bg-mi-gold/10 text-mi-gold border-mi-gold/30'
                : 'bg-mi-cyan/10 text-mi-cyan border-mi-cyan/30'
            )}
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
            {/* Premium gradient icon */}
            <div className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0",
              "bg-gradient-to-br from-mi-cyan via-mi-cyan to-mi-gold",
              "shadow-lg shadow-mi-cyan/30"
            )}>
              {isCompleted ? (
                <Trophy className="w-7 h-7 text-white drop-shadow-lg" />
              ) : (
                <Brain className="w-7 h-7 text-white drop-shadow-lg" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{protocol.title}</h1>
              <p className="text-sm text-gray-400 mt-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Week {protocol.week_number}, {protocol.year}
              </p>
            </div>
          </div>

          {/* Progress Bar - Glass Style */}
          <div className={cn(
            "rounded-2xl p-4",
            "bg-white/5 backdrop-blur-sm",
            "border border-mi-cyan/20"
          )}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Progress</span>
              <span className="text-sm font-medium">
                <span className="text-mi-gold">{protocol.days_completed}</span>
                <span className="text-gray-400">/7 days</span>
              </span>
            </div>
            <div className="h-2 w-full bg-mi-navy rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-mi-cyan to-mi-gold rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
            {protocol.days_skipped > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                {protocol.days_skipped} day(s) skipped
              </p>
            )}
          </div>

          {/* Insight Summary - Glass Style */}
          <div className={cn(
            "rounded-2xl p-4",
            "bg-white/5 backdrop-blur-sm",
            "border border-mi-cyan/20"
          )}>
            <p className="text-sm font-medium mb-2 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-mi-gold" />
              <span className="text-mi-gold">This Week's Insight</span>
            </p>
            <p className="text-gray-300">{protocol.insight_summary}</p>
          </div>
        </motion.div>

        {/* 7-Day List */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-mi-gold" />
            <span className="text-mi-gold">Your 7-Day Protocol</span>
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
                  protocolId={protocol.id}
                  completion={completion}
                  onReflectionChange={handleReflectionChange}
                  onRefresh={loadProtocol}
                />
              </motion.div>
            );
          })}
        </div>

        {/* Neural Principle - Glass Style */}
        {protocol.neural_principle && (
          <div className={cn(
            "rounded-2xl p-4",
            "bg-white/5 backdrop-blur-sm",
            "border border-mi-gold/20"
          )}>
            <p className="text-sm font-medium mb-2 flex items-center gap-2">
              <Brain className="w-4 h-4 text-mi-gold" />
              <span className="text-mi-gold">Neural Rewiring Principle</span>
            </p>
            <p className="text-gray-400 italic">"{protocol.neural_principle}"</p>
          </div>
        )}

        {/* Muted Warning */}
        {isMuted && (
          <div className={cn(
            "rounded-2xl p-4",
            "bg-mi-gold/10 backdrop-blur-sm",
            "border border-mi-gold/30"
          )}>
            <p className="text-mi-gold text-sm">
              This protocol has been paused by your coach.
              {protocol.muted_reason && (
                <span className="block text-amber-300 mt-1">
                  Reason: {protocol.muted_reason}
                </span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
    </MindInsuranceErrorBoundary>
  );
}

// ============================================================================
// Day Accordion Component - Premium Glass-morphism
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
  protocolId: string;
  completion: MIOProtocolCompletion | undefined;
  onReflectionChange: (dayNumber: number, text: string) => void;
  onRefresh: () => void;
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
  protocolId,
  completion,
  onReflectionChange,
  onRefresh,
}: DayAccordionProps) {
  // Reflection state
  const [reflectionText, setReflectionText] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isEditingReflection, setIsEditingReflection] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const DRAFT_KEY = `mio_reflection_draft_${protocolId}_${dayNumber}`;

  // Load existing reflection or draft when accordion expands
  useEffect(() => {
    if (isExpanded) {
      // Check for existing saved reflection first
      const existingReflection = completion?.response_data?.reflection_text as string | undefined;
      if (existingReflection) {
        setReflectionText(existingReflection);
        return;
      }

      // Check localStorage for draft
      try {
        const draft = localStorage.getItem(DRAFT_KEY);
        if (draft) {
          setReflectionText(draft);
          // Notify parent of the loaded draft
          onReflectionChange(dayNumber, draft);
        }
      } catch (err) {
        console.error('Failed to load draft:', err);
      }
    }
  }, [isExpanded, completion, DRAFT_KEY, dayNumber, onReflectionChange]);

  // Auto-save to localStorage with debounce
  useEffect(() => {
    // Only auto-save if day is not complete and there's content
    if (isComplete || !reflectionText) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSaveStatus('saving');

    saveTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, reflectionText);
        // Notify parent of the change
        onReflectionChange(dayNumber, reflectionText);
        setSaveStatus('saved');
        // Reset status after 2 seconds
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (err) {
        console.error('Failed to save draft:', err);
        setSaveStatus('idle');
      }
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [reflectionText, isComplete, DRAFT_KEY, dayNumber, onReflectionChange]);

  // Handle saving edited reflection for completed days
  const handleSaveEditedReflection = async () => {
    if (!completion?.id || !reflectionText) return;

    setIsSavingEdit(true);
    const result = await updateProtocolReflection(completion.id, reflectionText);
    setIsSavingEdit(false);

    if (result.success) {
      toast.success('Reflection updated');
      setIsEditingReflection(false);
      onRefresh(); // Refresh to get updated data
    } else {
      toast.error('Failed to save changes', {
        description: result.error,
      });
    }
  };

  const getStatusIcon = () => {
    if (isComplete) {
      return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
    }
    if (wasSkipped) {
      return <Circle className="w-5 h-5 text-gray-500" />;
    }
    if (isCurrent) {
      return (
        <div className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center",
          "bg-gradient-to-br from-mi-cyan to-mi-gold",
          "shadow-md shadow-mi-cyan/30"
        )}>
          <span className="text-xs font-bold text-white">{dayNumber}</span>
        </div>
      );
    }
    return <Circle className="w-5 h-5 text-gray-600" />;
  };

  const getCardStyle = () => {
    if (isComplete) {
      return 'bg-emerald-500/10 backdrop-blur-sm border-emerald-500/30';
    }
    if (isCurrent) {
      return cn(
        'bg-mi-navy/80 backdrop-blur-xl',
        'border-mi-cyan/30',
        'shadow-[0_0_20px_rgba(5,195,221,0.15),0_0_40px_rgba(245,166,35,0.1)]'
      );
    }
    if (wasSkipped) {
      return 'bg-white/5 backdrop-blur-sm border-gray-700/30 opacity-60';
    }
    return 'bg-white/5 backdrop-blur-sm border-white/10';
  };

  const existingReflection = completion?.response_data?.reflection_text as string | undefined;

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <div className={cn(
        "overflow-hidden transition-all rounded-2xl border",
        getCardStyle()
      )}>
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 flex items-center justify-between text-left">
            <div className="flex items-center gap-3">
              {getStatusIcon()}
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "font-medium",
                      isComplete
                        ? 'text-emerald-400'
                        : isCurrent
                        ? 'text-white'
                        : 'text-gray-300'
                    )}
                  >
                    Day {dayNumber}: {task.task_title}
                  </span>
                  {isCurrent && !isComplete && (
                    <Badge className={cn(
                      "text-xs border-0",
                      "bg-gradient-to-r from-mi-cyan/20 to-mi-gold/20",
                      "text-mi-gold"
                    )}>
                      Today
                    </Badge>
                  )}
                  {wasSkipped && (
                    <Badge className="bg-gray-500/20 text-gray-400 border-0 text-xs">
                      Skipped
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-400">{task.theme}</p>
              </div>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4 border-t border-white/10 pt-4">
            {/* Context Reminder - Premium Glass */}
            {task.context_reminder && (
              <div className={cn(
                "rounded-xl p-4",
                "bg-mi-cyan/10 backdrop-blur-sm",
                "border border-mi-cyan/30"
              )}>
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                    "bg-mi-cyan/20"
                  )}>
                    <Lightbulb className="w-4 h-4 text-mi-cyan" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-1 text-mi-cyan">
                      Remember Why You're Here
                    </p>
                    <p className="text-sm text-gray-300">
                      {task.context_reminder}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Instructions - Gold accent */}
            <div>
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-mi-gold" />
                <span className="text-mi-gold">Instructions</span>
              </p>
              <p className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
                {task.task_instructions}
              </p>
            </div>

            {/* Duration */}
            {task.duration_minutes && (
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Clock className="w-4 h-4 text-mi-cyan" />
                ~{task.duration_minutes} minutes
              </div>
            )}

            {/* Success Criteria - Gold accents */}
            {Array.isArray(task.success_criteria) && task.success_criteria.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-mi-gold" />
                  <span className="text-mi-gold">Success Criteria</span>
                </p>
                <ul className="space-y-2">
                  {task.success_criteria.map((criterion, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 text-sm text-gray-300"
                    >
                      <CheckCircle2 className="w-4 h-4 text-mi-cyan mt-0.5 flex-shrink-0" />
                      {criterion}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Reflection Section - Premium Glass */}
            <div className={cn(
              "pt-4 border-t border-white/10"
            )}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium flex items-center gap-2">
                  <PenLine className="w-4 h-4 text-mi-gold" />
                  <span className="text-mi-gold">Your Reflection</span>
                </p>
                {/* Save status indicator */}
                <AnimatePresence mode="wait">
                  {saveStatus === 'saving' && (
                    <motion.span
                      key="saving"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-xs text-gray-500 flex items-center gap-1"
                    >
                      <Cloud className="w-3 h-3 animate-pulse" /> Saving...
                    </motion.span>
                  )}
                  {saveStatus === 'saved' && (
                    <motion.span
                      key="saved"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-xs text-emerald-400 flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3" /> Saved
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              <textarea
                value={reflectionText}
                onChange={(e) => setReflectionText(e.target.value)}
                placeholder="Write your thoughts, insights, and reflections here..."
                className={cn(
                  "w-full min-h-[120px] p-4 rounded-xl text-sm resize-y transition-all",
                  "bg-white/5 backdrop-blur-sm",
                  "border border-mi-cyan/20",
                  "text-gray-300 placeholder:text-gray-500",
                  "focus:border-mi-gold/50 focus:outline-none focus:ring-1 focus:ring-mi-gold/30"
                )}
                disabled={isComplete && !isEditingReflection}
              />

              {/* For completed days - show edit button if they have a reflection */}
              {isComplete && existingReflection && !isEditingReflection && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingReflection(true)}
                  className="mt-2 text-gray-400 hover:text-white hover:bg-white/5"
                >
                  <PenLine className="w-3 h-3 mr-1" />
                  Edit Reflection
                </Button>
              )}

              {/* Save button for editing completed reflections */}
              {isComplete && isEditingReflection && (
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    onClick={handleSaveEditedReflection}
                    disabled={isSavingEdit}
                    className={cn(
                      "bg-mi-gold hover:bg-amber-500 text-mi-navy font-semibold"
                    )}
                  >
                    {isSavingEdit ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="mr-1"
                        >
                          <Sparkles className="w-3 h-3" />
                        </motion.div>
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsEditingReflection(false);
                      // Reset to original
                      setReflectionText(existingReflection || '');
                    }}
                    disabled={isSavingEdit}
                    className="text-gray-400 hover:text-white hover:bg-white/5"
                  >
                    Cancel
                  </Button>
                </div>
              )}

              {/* Auto-save message for incomplete days */}
              {!isComplete && (
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <Cloud className="w-3 h-3" />
                  Your thoughts are saved automatically
                </p>
              )}
            </div>

            {/* Complete Button - Premium Gradient */}
            {isCurrent && !isComplete && !disabled && (
              <Button
                className={cn(
                  "w-full h-12 font-semibold",
                  "bg-gradient-to-r from-mi-cyan via-mi-cyan to-cyan-400",
                  "hover:from-mi-cyan-dark hover:via-mi-cyan hover:to-cyan-500",
                  "text-white",
                  "shadow-lg shadow-mi-cyan/30",
                  "border border-mi-cyan/50",
                  "transition-all duration-300",
                  "hover:shadow-xl hover:shadow-mi-cyan/40",
                  "hover:scale-[1.02]"
                )}
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
      </div>
    </Collapsible>
  );
}
