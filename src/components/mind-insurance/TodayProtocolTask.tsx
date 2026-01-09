/**
 * TodayProtocolTask Component
 * Phase 27: Daily protocol task display for MindInsuranceHub
 * Phase 28: Added journal/reflection capture before completion
 * Phase 29: Added swipeable card UI for mobile-friendly task viewing
 * Phase 30: Updated to 4-card structure matching InsightRevealPage
 * Phase 31: Reordered cards (Why first) + added bullet formatting
 *
 * Features:
 * - Persistent button showing current day's task
 * - Swipeable modal with 4 cards:
 *   1. Why This Matters - Weekly insight context (FIRST for context)
 *   2. What to Do - Task instructions with bullet formatting
 *   3. Success Criteria - Completion checklist
 *   4. Reflection - Journal input
 * - Journal textarea for reflections (Phase 28)
 * - "Mark Complete" functionality
 * - Progress indicator (Day X of 7)
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Clock,
  Target,
  X,
  Play,
  Shield,
  PenLine,
  Brain,
  Calendar,
  Cloud,
  CloudOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// Dialog removed - using custom full-screen modal for 2025 design
import { Progress } from '@/components/ui/progress';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import type { TodayProtocolTask as TodayProtocolTaskType, ProtocolReflection } from '@/types/protocol';
import { completeProtocolDay } from '@/services/mioInsightProtocolService';
import { toast } from 'sonner';
import { ProtocolJournalInput } from './ProtocolJournalInput';

// Helper function to parse text into bullet points for better readability
function formatAsBullets(text: string): string[] {
  if (!text) return [];

  // Split by common delimiters: numbered lists, bullet points, or sentences
  const lines = text
    .split(/(?:\d+\.\s*|\n-\s*|\n•\s*|\n\*\s*|\.\s+(?=[A-Z]))/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  // If we got meaningful splits, return them
  if (lines.length > 1) {
    return lines;
  }

  // Otherwise, try splitting by newlines
  const newlinesSplit = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (newlinesSplit.length > 1) {
    return newlinesSplit;
  }

  // If still just one block, split by sentences for longer text
  if (text.length > 150) {
    const sentences = text
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
    if (sentences.length > 1) {
      return sentences;
    }
  }

  // Return as single item if no good split found
  return [text];
}

interface TodayProtocolTaskProps {
  task: TodayProtocolTaskType;
  onComplete?: () => void;
  showOnMount?: boolean; // For modal on first open of day
}

export function TodayProtocolTask({
  task,
  onComplete,
  showOnMount = false,
}: TodayProtocolTaskProps) {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(showOnMount);
  const [isCompleting, setIsCompleting] = useState(false);
  const [reflectionText, setReflectionText] = useState('');
  const modalOpenTimeRef = useRef<number>(Date.now());

  // Carousel state for swipeable cards
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

  // Expandable bullet state for tap-to-expand drill-down
  const [expandedBullet, setExpandedBullet] = useState<number | null>(null);

  // Draft saving state for Daily Journal mode
  const [draftStatus, setDraftStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const DRAFT_KEY = `mio_reflection_draft_${task.protocol_id}_${task.day_number}`;

  // Always 4 cards: What to Do, Why This Matters, Success Criteria, Reflection
  const hasSuccessCriteria = Array.isArray(task.task.success_criteria) && task.task.success_criteria.length > 0;
  const totalCards = 4;

  const progressPercent = (task.days_completed / 7) * 100;

  // Carousel navigation callbacks
  useEffect(() => {
    if (!carouselApi) return;

    const onSelect = () => {
      setCurrentCardIndex(carouselApi.selectedScrollSnap());
      setCanScrollPrev(carouselApi.canScrollPrev());
      setCanScrollNext(carouselApi.canScrollNext());
      // Reset expanded bullet when swiping away from Card 2
      setExpandedBullet(null);
    };

    carouselApi.on('select', onSelect);
    onSelect();

    return () => {
      carouselApi.off('select', onSelect);
    };
  }, [carouselApi]);

  const scrollToCard = useCallback((index: number) => {
    carouselApi?.scrollTo(index);
  }, [carouselApi]);

  // Reset carousel and expanded state when modal opens
  useEffect(() => {
    if (isModalOpen && carouselApi) {
      carouselApi.scrollTo(0);
      setExpandedBullet(null);
    }
  }, [isModalOpen, carouselApi]);

  // Load draft from localStorage when modal opens (Daily Journal mode)
  useEffect(() => {
    if (isModalOpen && !task.is_completed) {
      const savedDraft = localStorage.getItem(DRAFT_KEY);
      if (savedDraft && savedDraft.trim()) {
        setReflectionText(savedDraft);
        // Show "Draft restored" indicator and toast
        setDraftStatus('saved');
        toast.info('Draft restored', {
          description: 'Your previous thoughts have been loaded.',
          duration: 3000,
        });
        setTimeout(() => setDraftStatus('idle'), 2000);
      }
    }
  }, [isModalOpen, task.is_completed, DRAFT_KEY]);

  // Auto-save to localStorage on reflection text change (debounced)
  useEffect(() => {
    if (!isModalOpen || task.is_completed) return;

    // Only save if there's actual content
    if (!reflectionText.trim()) {
      // Clear draft if user empties the field
      localStorage.removeItem(DRAFT_KEY);
      return;
    }

    setDraftStatus('saving');
    const timer = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, reflectionText);
      setDraftStatus('saved');
      // Reset to idle after showing "Saved" for 2 seconds
      setTimeout(() => setDraftStatus('idle'), 2000);
    }, 1000); // Debounce 1 second

    return () => clearTimeout(timer);
  }, [reflectionText, isModalOpen, task.is_completed, DRAFT_KEY]);

  // Reset reflection and track time when modal opens
  const handleOpenModal = () => {
    setIsModalOpen(true);
    modalOpenTimeRef.current = Date.now();
  };

  const handleComplete = async () => {
    setIsCompleting(true);

    // Build reflection data if user wrote something
    const responseData: ProtocolReflection | undefined = reflectionText.trim()
      ? {
          reflection_text: reflectionText.trim(),
          submitted_at: new Date().toISOString(),
          word_count: reflectionText.trim().split(/\s+/).length,
          time_spent_writing_seconds: Math.floor(
            (Date.now() - modalOpenTimeRef.current) / 1000
          ),
        }
      : undefined;

    const result = await completeProtocolDay({
      protocol_id: task.protocol_id,
      day_number: task.day_number,
      response_data: responseData,
      notes: reflectionText.trim() || undefined,
    });

    setIsCompleting(false);

    if (result.success) {
      const hasReflection = !!reflectionText.trim();
      toast.success(`Day ${task.day_number} complete!`, {
        description:
          result.protocol_completed
            ? '🎉 Protocol completed! Amazing work!'
            : hasReflection
            ? `Great reflection! ${7 - task.day_number} days to go`
            : `${7 - task.day_number} days to go`,
      });
      // Clear draft from localStorage on successful completion
      localStorage.removeItem(DRAFT_KEY);
      setIsModalOpen(false);
      setReflectionText(''); // Reset for next time
      onComplete?.();
    } else {
      toast.error('Failed to complete task', {
        description: result.error,
      });
    }
  };

  const handleViewProtocol = () => {
    navigate(`/mind-insurance/protocol/${task.protocol_id}`);
  };

  return (
    <>
      {/* Compact Card Button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card
          className={`p-4 cursor-pointer transition-all hover:border-cyan-500/50 ${
            task.is_completed
              ? 'bg-mi-navy-light border-emerald-500/30'
              : 'bg-mi-navy-light border-cyan-500/30'
          }`}
          onClick={handleOpenModal}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Icon */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  task.is_completed
                    ? 'bg-emerald-500/20'
                    : 'bg-cyan-500/20'
                }`}
              >
                {task.is_completed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">
                    Today's Protocol
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      task.is_completed
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                    }`}
                  >
                    Day {task.day_number}/7
                  </Badge>
                </div>
                <p className="text-sm text-slate-400 truncate">
                  {task.task.task_title}
                </p>
              </div>
            </div>

            <ChevronRight className="w-5 h-5 text-slate-400" />
          </div>

          {/* Progress Bar */}
          <div className="mt-3">
            <Progress value={progressPercent} className="h-1" />
          </div>
        </Card>
      </motion.div>

      {/* Modern Full-Screen Swipe Modal (2025 Design) */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl"
          >
            {/* Compact Header */}
            <div className="absolute top-0 left-0 right-0 z-10 px-4 pt-4 pb-2 bg-gradient-to-b from-slate-950 via-slate-950/80 to-transparent">
              <div className="flex items-center justify-between max-w-lg mx-auto">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800/60 backdrop-blur-sm text-slate-400 hover:text-white hover:bg-slate-700/60 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="text-center flex-1 px-4">
                  <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 backdrop-blur-sm">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Day {task.day_number} of 7
                  </Badge>
                </div>
                <button
                  onClick={handleViewProtocol}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800/60 backdrop-blur-sm text-slate-400 hover:text-white hover:bg-slate-700/60 transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              {/* Title */}
              <div className="text-center mt-3 max-w-lg mx-auto">
                <h2 className="text-lg font-bold text-white line-clamp-1">{task.task.task_title}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{task.task.theme}</p>
              </div>
            </div>

            {/* Swipe Progress Indicator - Pill Style with Micro-Labels */}
            <div className="absolute top-[120px] left-0 right-0 z-10 flex flex-col items-center">
              {/* Pill dots */}
              <div className="flex items-center justify-center gap-2">
                {Array.from({ length: totalCards }).map((_, index) => (
                  <motion.button
                    key={index}
                    onClick={() => scrollToCard(index)}
                    className="p-2"
                    whileTap={{ scale: 0.9 }}
                  >
                    <motion.div
                      animate={{
                        width: index === currentCardIndex ? 24 : 8,
                        backgroundColor: index === currentCardIndex
                          ? 'rgb(34, 211, 238)'
                          : index < currentCardIndex
                          ? 'rgba(34, 211, 238, 0.5)'
                          : 'rgb(71, 85, 105)'
                      }}
                      className="h-2 rounded-full"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  </motion.button>
                ))}
              </div>
              {/* Micro-labels */}
              <div className="flex justify-center gap-6 mt-1">
                {['Pattern', 'Coverage', 'Success', 'Reflect'].map((label, i) => (
                  <span
                    key={label}
                    className={`text-[10px] transition-colors ${
                      i === currentCardIndex ? 'text-cyan-400' : 'text-slate-600'
                    }`}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Main Card Area - Full Screen Swipe */}
            <div className="absolute inset-0 pt-[150px] pb-[100px] px-4 flex items-center justify-center">
              <Carousel
                setApi={setCarouselApi}
                opts={{
                  align: 'center',
                  loop: false,
                  skipSnaps: false,
                  dragFree: false,
                }}
                className="w-full max-w-lg"
              >
                <CarouselContent className="-ml-4">
                  {/* Card 1: This Week's Pattern (FIRST - provides context) */}
                  <CarouselItem className="pl-4">
                    <motion.div
                      animate={{
                        scale: currentCardIndex === 0 ? 1 : 0.92,
                        opacity: currentCardIndex === 0 ? 1 : 0.5,
                      }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      className="h-full"
                    >
                      <div className="bg-slate-900/80 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-5 h-[320px] sm:h-[360px] flex flex-col shadow-2xl shadow-purple-500/5">
                        {/* Card Header */}
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/30 to-pink-600/30 flex items-center justify-center">
                            <Brain className="w-6 h-6 text-purple-400" />
                          </div>
                          <h3 className="text-lg font-bold text-white">This Week's Pattern</h3>
                        </div>
                        {/* Card Content - Fixed height, no scroll */}
                        <div className="flex-1 overflow-hidden space-y-3">
                          <div className="p-3 rounded-2xl bg-purple-500/5 border border-purple-500/10">
                            <p className="text-xs text-purple-400 font-medium uppercase tracking-wide mb-1">
                              MIO Detected
                            </p>
                            <p className="text-slate-300 text-sm leading-relaxed line-clamp-3">
                              {task.insight_summary}
                            </p>
                          </div>
                          {task.task.context_reminder ? (
                            <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/30">
                              <p className="text-xs text-cyan-400 font-medium uppercase tracking-wide mb-1">
                                Today's Connection
                              </p>
                              <p className="text-slate-400 text-sm leading-relaxed line-clamp-2">
                                {task.task.context_reminder}
                              </p>
                            </div>
                          ) : (
                            <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/30">
                              <p className="text-xs text-cyan-400 font-medium uppercase tracking-wide mb-1">
                                Day {task.day_number} Focus
                              </p>
                              <p className="text-slate-400 text-sm leading-relaxed line-clamp-2">
                                {task.task.theme}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </CarouselItem>

                  {/* Card 2: Today's Coverage (with expandable bullets - tap to read more) */}
                  <CarouselItem className="pl-4">
                    <motion.div
                      animate={{
                        scale: currentCardIndex === 1 ? 1 : 0.92,
                        opacity: currentCardIndex === 1 ? 1 : 0.5,
                      }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      className="h-full"
                    >
                      <div className="bg-slate-900/80 backdrop-blur-xl border border-cyan-500/30 rounded-3xl p-5 h-[320px] sm:h-[360px] flex flex-col shadow-2xl shadow-cyan-500/5">
                        {/* Card Header */}
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-blue-600/30 flex items-center justify-center">
                            <Shield className="w-6 h-6 text-cyan-400" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-white">Today's Coverage</h3>
                            <p className="text-xs text-slate-500">Activate your protection</p>
                          </div>
                          {task.task.duration_minutes && (
                            <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 text-xs">
                              <Clock className="w-3 h-3 mr-1" />
                              {task.task.duration_minutes}m
                            </Badge>
                          )}
                        </div>
                        {/* Card Content - MAX 3 bullets, scrollable when expanded */}
                        <div className={`flex-1 space-y-2 ${expandedBullet !== null ? 'overflow-y-auto' : 'overflow-hidden'}`}>
                          {formatAsBullets(task.task.task_instructions).slice(0, 3).map((point, idx) => (
                            <motion.div
                              key={idx}
                              layout
                              className={`flex items-start gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${
                                expandedBullet === idx
                                  ? 'bg-cyan-500/10 border border-cyan-500/30'
                                  : 'bg-cyan-500/5 border border-cyan-500/10 hover:bg-cyan-500/8'
                              }`}
                              onClick={() => setExpandedBullet(expandedBullet === idx ? null : idx)}
                            >
                              <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-bold text-cyan-400">{idx + 1}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <motion.p
                                  layout
                                  className={`text-sm text-slate-300 leading-relaxed ${
                                    expandedBullet === idx ? '' : 'line-clamp-2'
                                  }`}
                                >
                                  {point}
                                </motion.p>
                                {/* Tap to read more hint - only show if truncated and not expanded */}
                                {expandedBullet !== idx && point.length > 80 && (
                                  <span className="text-[10px] text-cyan-400/60 mt-1 block">Tap to read more</span>
                                )}
                              </div>
                              {/* Close icon when expanded */}
                              {expandedBullet === idx && (
                                <X className="w-4 h-4 text-slate-500 flex-shrink-0" />
                              )}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  </CarouselItem>

                  {/* Card 3: You'll Know It Worked When... */}
                  <CarouselItem className="pl-4">
                    <motion.div
                      animate={{
                        scale: currentCardIndex === 2 ? 1 : 0.92,
                        opacity: currentCardIndex === 2 ? 1 : 0.5,
                      }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      className="h-full"
                    >
                      <div className="bg-slate-900/80 backdrop-blur-xl border border-emerald-500/30 rounded-3xl p-5 h-[320px] sm:h-[360px] flex flex-col shadow-2xl shadow-emerald-500/5">
                        {/* Card Header */}
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-teal-600/30 flex items-center justify-center">
                            <Target className="w-6 h-6 text-emerald-400" />
                          </div>
                          <h3 className="text-base font-bold text-white">You'll Know It Worked When...</h3>
                        </div>
                        {/* Card Content - Fixed height, no scroll */}
                        <div className="flex-1 overflow-hidden space-y-2">
                          {hasSuccessCriteria ? (
                            task.task.success_criteria.slice(0, 3).map((criterion, idx) => (
                              <div
                                key={idx}
                                className="flex items-start gap-3 p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10"
                              >
                                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                                <span className="text-sm text-slate-300 line-clamp-2">{criterion}</span>
                              </div>
                            ))
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center py-4">
                              <Target className="w-10 h-10 text-emerald-400/50 mb-3" />
                              <p className="text-slate-400 text-sm">Complete today's task mindfully.</p>
                              <p className="text-slate-500 text-xs mt-1">Be present and intentional.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </CarouselItem>

                  {/* Card 4: Reflection (Daily Journal Mode) */}
                  <CarouselItem className="pl-4">
                    <motion.div
                      animate={{
                        scale: currentCardIndex === 3 ? 1 : 0.92,
                        opacity: currentCardIndex === 3 ? 1 : 0.5,
                      }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      className="h-full"
                    >
                      <div className="bg-slate-900/80 backdrop-blur-xl border border-amber-500/30 rounded-3xl p-5 pb-6 min-h-[320px] sm:min-h-[360px] flex flex-col shadow-2xl shadow-amber-500/5">
                        {/* Card Header */}
                        <div className="flex items-center justify-between gap-3 mb-3 flex-shrink-0">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/30 to-orange-600/30 flex items-center justify-center">
                              <PenLine className="w-6 h-6 text-amber-400" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-white">
                                {task.is_completed ? 'Completed' : 'Daily Journal'}
                              </h3>
                              {/* Auto-save status - always visible when not completed */}
                              {!task.is_completed && (
                                <AnimatePresence mode="wait">
                                  {draftStatus === 'saving' ? (
                                    <motion.p
                                      key="saving"
                                      initial={{ opacity: 0, y: -5 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: 5 }}
                                      className="text-xs text-amber-400/60 flex items-center gap-1"
                                    >
                                      <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                                      >
                                        <Cloud className="w-3 h-3" />
                                      </motion.div>
                                      Saving...
                                    </motion.p>
                                  ) : draftStatus === 'saved' ? (
                                    <motion.p
                                      key="saved"
                                      initial={{ opacity: 0, y: -5 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: 5 }}
                                      className="text-xs text-emerald-400 flex items-center gap-1"
                                    >
                                      <CheckCircle2 className="w-3 h-3" />
                                      Draft saved
                                    </motion.p>
                                  ) : (
                                    <motion.p
                                      key="idle"
                                      initial={{ opacity: 0, y: -5 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: 5 }}
                                      className="text-xs text-slate-500"
                                    >
                                      Auto-saves as you type
                                    </motion.p>
                                  )}
                                </AnimatePresence>
                              )}
                            </div>
                          </div>
                        </div>
                        {/* Card Content - No overflow hidden, let content flow naturally */}
                        <div className="flex-1 flex flex-col">
                          {task.is_completed ? (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', delay: 0.2 }}
                              >
                                <CheckCircle2 className="w-14 h-14 text-emerald-400 mb-3" />
                              </motion.div>
                              <p className="text-emerald-400 font-bold text-lg">Day {task.day_number} Complete!</p>
                              <p className="text-sm text-slate-400 mt-1">Great work on today's task.</p>
                            </div>
                          ) : (
                            <div className="flex-1 flex flex-col space-y-3">
                              <div className="flex-1">
                                <ProtocolJournalInput
                                  value={reflectionText}
                                  onChange={setReflectionText}
                                  successCriteria={Array.isArray(task.task.success_criteria) ? task.task.success_criteria : []}
                                  maxWords={500}
                                  minRows={5}
                                />
                              </div>
                              {/* Prominent auto-save message below textarea */}
                              <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800/50 border border-slate-700/30 flex-shrink-0">
                                <Cloud className="w-4 h-4 text-slate-500 flex-shrink-0" />
                                <span className="text-xs text-slate-400">
                                  Your thoughts are saved automatically. Come back anytime to add more.
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </CarouselItem>
                </CarouselContent>
              </Carousel>
            </div>

            {/* Swipe Hint - Only on first card */}
            <AnimatePresence>
              {currentCardIndex === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute bottom-[110px] left-0 right-0 flex justify-center"
                >
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/60 backdrop-blur-sm text-slate-500 text-xs">
                    <ChevronLeft className="w-3 h-3" />
                    <span>Swipe to explore</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom Action Bar - Glassmorphism */}
            <div className="absolute bottom-0 left-0 right-0 p-4 pb-6 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent">
              <div className="max-w-lg mx-auto space-y-2">
                {task.is_completed ? (
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 h-12 rounded-2xl bg-slate-800/60 backdrop-blur-sm border-slate-700 hover:bg-slate-700/60"
                      onClick={handleViewProtocol}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      View All 7 Days
                    </Button>
                    <Button
                      variant="ghost"
                      className="h-12 rounded-2xl px-6"
                      onClick={() => setIsModalOpen(false)}
                    >
                      Close
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-3">
                      <Button
                        className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/20"
                        onClick={handleComplete}
                        disabled={isCompleting}
                      >
                        {isCompleting ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          >
                            <Sparkles className="w-5 h-5 mr-2" />
                          </motion.div>
                        ) : (
                          <CheckCircle2 className="w-5 h-5 mr-2" />
                        )}
                        Mark Complete
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full h-10 rounded-2xl bg-slate-800/40 backdrop-blur-sm border-slate-700/50 hover:bg-slate-700/40 text-slate-400"
                      onClick={handleViewProtocol}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      View All 7 Days
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ============================================================================
// Protocol Task Modal (for first-open-of-day popup)
// ============================================================================

interface ProtocolTaskModalProps {
  task: TodayProtocolTaskType;
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export function ProtocolTaskModal({
  task,
  isOpen,
  onClose,
  onComplete,
}: ProtocolTaskModalProps) {
  const navigate = useNavigate();
  const [isCompleting, setIsCompleting] = useState(false);
  const [reflectionText, setReflectionText] = useState('');
  const modalOpenTimeRef = useRef<number>(Date.now());

  // Reset reflection and track time when modal opens
  useEffect(() => {
    if (isOpen) {
      modalOpenTimeRef.current = Date.now();
      setReflectionText('');
    }
  }, [isOpen]);

  const handleComplete = async () => {
    setIsCompleting(true);

    // Build reflection data if user wrote something
    const responseData: ProtocolReflection | undefined = reflectionText.trim()
      ? {
          reflection_text: reflectionText.trim(),
          submitted_at: new Date().toISOString(),
          word_count: reflectionText.trim().split(/\s+/).length,
          time_spent_writing_seconds: Math.floor(
            (Date.now() - modalOpenTimeRef.current) / 1000
          ),
        }
      : undefined;

    const result = await completeProtocolDay({
      protocol_id: task.protocol_id,
      day_number: task.day_number,
      response_data: responseData,
      notes: reflectionText.trim() || undefined,
    });

    setIsCompleting(false);

    if (result.success) {
      const hasReflection = !!reflectionText.trim();
      toast.success(`Day ${task.day_number} complete!`, {
        description:
          result.protocol_completed
            ? '🎉 Protocol completed! Amazing work!'
            : hasReflection
            ? `Great reflection! ${7 - task.day_number} days to go`
            : `${7 - task.day_number} days to go`,
      });
      onClose();
      onComplete?.();
    } else {
      toast.error('Failed to complete task', {
        description: result.error,
      });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <Badge
                  variant="outline"
                  className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  Today's Protocol Task
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <h2 className="text-xl font-bold text-white">
                {task.task.task_title}
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Day {task.day_number} of 7 • {task.protocol_title}
              </p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Theme */}
              <div>
                <p className="text-sm text-cyan-400 font-medium mb-1">
                  Today's Focus
                </p>
                <p className="text-slate-300">{task.task.theme}</p>
              </div>

              {/* Instructions */}
              <div>
                <p className="text-sm text-cyan-400 font-medium mb-2">
                  Instructions
                </p>
                <Card className="bg-slate-800/50 border-slate-700/50 p-4">
                  <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {task.task.task_instructions}
                  </p>
                </Card>
              </div>

              {/* Duration & Criteria */}
              <div className="flex flex-wrap gap-4">
                {task.task.duration_minutes && (
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <Clock className="w-4 h-4" />
                    ~{task.task.duration_minutes} min
                  </div>
                )}
                {task.task.success_criteria.length > 0 && (
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <Target className="w-4 h-4" />
                    {task.task.success_criteria.length} criteria
                  </div>
                )}
              </div>

              {/* Journal Input (Phase 28) */}
              {!task.is_completed && (
                <div className="pt-4 border-t border-slate-800">
                  <ProtocolJournalInput
                    value={reflectionText}
                    onChange={setReflectionText}
                    successCriteria={task.task.success_criteria}
                    maxWords={500}
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-slate-800 flex gap-3">
              <Button
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500"
                onClick={handleComplete}
                disabled={isCompleting || task.is_completed}
              >
                {task.is_completed ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Completed
                  </>
                ) : isCompleting ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                  </motion.div>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Mark Complete
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={onClose}>
                Later
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default TodayProtocolTask;
