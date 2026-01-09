/**
 * SwipeableInsightCards Component
 * 4-part swipeable card UI for MIO insight reveals
 *
 * Structure:
 * 1. The Pattern - What MIO detected
 * 2. Why It Happens - Accessible neuroscience
 * 3. Your Protocol - 7-day actionable plan preview
 * 4. The Question - Perspective shift prompt
 *
 * Uses Embla Carousel for touch-friendly swiping
 */

import * as React from 'react';
import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Lightbulb,
  Shield,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Clock,
  Calendar,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import type { MIOInsightProtocol, MIOInsightDayTask } from '@/types/protocol';

interface SwipeableInsightCardsProps {
  protocol: MIOInsightProtocol;
  onComplete?: () => void;
  showNavigation?: boolean;
  onViewAllDays?: () => void;
}

interface CardConfig {
  id: string;
  title: string;
  shortLabel: string; // For progress indicator
  icon: React.ReactNode;
  gradient: string;
  borderColor: string;
}

const CARD_CONFIGS: CardConfig[] = [
  {
    id: 'pattern',
    title: 'What I Noticed',
    shortLabel: 'Notice',
    icon: <Brain className="w-5 h-5 sm:w-6 sm:h-6" />,
    gradient: 'from-cyan-500/20 to-blue-600/20',
    borderColor: 'border-cyan-500/30',
  },
  {
    id: 'why',
    title: 'Why This Happens',
    shortLabel: 'Why',
    icon: <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6" />,
    gradient: 'from-purple-500/20 to-pink-600/20',
    borderColor: 'border-purple-500/30',
  },
  {
    id: 'coverage',
    title: "Today's Coverage",
    shortLabel: 'Coverage',
    icon: <Shield className="w-5 h-5 sm:w-6 sm:h-6" />,
    gradient: 'from-emerald-500/20 to-teal-600/20',
    borderColor: 'border-emerald-500/30',
  },
  {
    id: 'question',
    title: 'A Question for You',
    shortLabel: 'Reflect',
    icon: <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6" />,
    gradient: 'from-amber-500/20 to-orange-600/20',
    borderColor: 'border-amber-500/30',
  },
];

export function SwipeableInsightCards({
  protocol,
  onComplete,
  showNavigation = true,
  onViewAllDays,
}: SwipeableInsightCardsProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

  // Use simplified versions if available, fall back to full versions
  const insightSummary = protocol.simplified_insight_summary || protocol.insight_summary;
  const whyItMatters = protocol.simplified_why_it_matters || protocol.why_it_matters;
  const neuralPrinciple = protocol.simplified_neural_principle || protocol.neural_principle;
  const dayTasks = protocol.simplified_day_tasks || protocol.day_tasks;

  // Mobile-optimized: Detect touch device for swipe hints
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      setCurrentIndex(api.selectedScrollSnap());
      setCanScrollPrev(api.canScrollPrev());
      setCanScrollNext(api.canScrollNext());
    };

    api.on('select', onSelect);
    onSelect(); // Initial state

    return () => {
      api.off('select', onSelect);
    };
  }, [api]);

  const scrollPrev = useCallback(() => {
    api?.scrollPrev();
  }, [api]);

  const scrollNext = useCallback(() => {
    api?.scrollNext();
  }, [api]);

  const scrollTo = useCallback((index: number) => {
    api?.scrollTo(index);
  }, [api]);

  // Generate a reflective question based on the insight
  const getReflectiveQuestion = (): string => {
    // Check if there's a custom question in the protocol
    if (protocol.raw_analysis?.metadata?.reflective_question) {
      return protocol.raw_analysis.metadata.reflective_question as string;
    }

    // Generate based on pattern type
    const pattern = protocol.raw_analysis?.pattern_context?.primary_pattern || protocol.protocol_type;

    const questions: Record<string, string> = {
      'dropout_risk': "What would happen if you showed up for yourself, even when it's hard?",
      'success_sabotage': "What if success wasn't something you had to earn, but something you're allowed to receive?",
      'past_prison': "What becomes possible when you stop letting your past define your present?",
      'compass_crisis': "What would you do differently if you trusted yourself to know the answer?",
      'breakthrough': "What's the smallest step you could take right now that your future self would thank you for?",
      'pattern_grip': "What if this pattern isn't protecting you anymore - what would you choose instead?",
    };

    return questions[pattern] || "What would change if you fully believed this insight was meant for you?";
  };

  return (
    <div className="w-full space-y-3 sm:space-y-4 touch-pan-x">
      {/* Progress Dots with Labels - Mobile optimized */}
      <div className="flex items-center justify-center gap-1 sm:gap-2 pb-2">
        {CARD_CONFIGS.map((config, index) => (
          <button
            key={config.id}
            onClick={() => scrollTo(index)}
            className="transition-all duration-300 min-h-[44px] flex flex-col items-center justify-center px-1 sm:px-2"
            aria-label={`Go to ${config.title}`}
          >
            <span
              className={`transition-all duration-300 ${
                index === currentIndex
                  ? 'w-6 sm:w-8 h-2 sm:h-2.5 rounded-full bg-cyan-400'
                  : index < currentIndex
                  ? 'w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-cyan-400/60'
                  : 'w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-slate-600'
              }`}
            />
            <span
              className={`text-[9px] sm:text-[10px] mt-1 transition-all duration-300 ${
                index === currentIndex
                  ? 'text-cyan-400 font-medium'
                  : 'text-slate-500'
              }`}
            >
              {config.shortLabel}
            </span>
          </button>
        ))}
      </div>

      {/* Carousel - Touch-optimized with smooth scrolling */}
      <Carousel
        setApi={setApi}
        opts={{
          align: 'center',
          loop: false,
          dragFree: false,
          containScroll: 'trimSnaps',
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4 touch-pan-x">
          {/* Card 1: What I Noticed */}
          <CarouselItem className="pl-2 md:pl-4">
            <InsightCard config={CARD_CONFIGS[0]} isActive={currentIndex === 0}>
              <div className="space-y-3">
                <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
                  {insightSummary}
                </p>
                <p className="text-xs text-cyan-400/70 mt-auto pt-2">
                  ← Swipe to understand why
                </p>
              </div>
            </InsightCard>
          </CarouselItem>

          {/* Card 2: Why This Happens */}
          <CarouselItem className="pl-2 md:pl-4">
            <InsightCard config={CARD_CONFIGS[1]} isActive={currentIndex === 1}>
              <div className="space-y-3">
                <p className="text-slate-300 text-sm leading-relaxed">
                  Your brain learned this pattern to protect you.
                </p>
                <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
                  {whyItMatters}
                </p>
                {neuralPrinciple && (
                  <div className="pt-2 border-t border-slate-700/50">
                    <p className="text-xs text-purple-400 font-medium mb-1">
                      The Science:
                    </p>
                    <p className="text-slate-300 text-xs sm:text-sm">
                      • {neuralPrinciple}
                    </p>
                  </div>
                )}
                <p className="text-xs text-purple-400/70 mt-auto pt-1">
                  ← Swipe for today's coverage
                </p>
              </div>
            </InsightCard>
          </CarouselItem>

          {/* Card 3: Today's Coverage - Day 1 Only */}
          <CarouselItem className="pl-2 md:pl-4">
            <InsightCard config={CARD_CONFIGS[2]} isActive={currentIndex === 2}>
              <TodaysCoverageCard task={dayTasks[0]} totalDays={dayTasks.length} />
            </InsightCard>
          </CarouselItem>

          {/* Card 4: A Question for You */}
          <CarouselItem className="pl-2 md:pl-4">
            <InsightCard config={CARD_CONFIGS[3]} isActive={currentIndex === 3}>
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 text-amber-400" />
                </motion.div>
                <p className="text-lg sm:text-xl text-white font-medium leading-relaxed px-2">
                  {getReflectiveQuestion()}
                </p>
                <p className="text-xs sm:text-sm text-slate-400">
                  Sit with this question today.
                </p>
              </div>
            </InsightCard>
          </CarouselItem>
        </CarouselContent>
      </Carousel>

      {/* Navigation Buttons */}
      {showNavigation && (
        <div className="flex items-center justify-between px-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={scrollPrev}
            disabled={!canScrollPrev}
            className="text-slate-400 hover:text-white disabled:opacity-30 text-xs sm:text-sm"
          >
            <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            Prev
          </Button>

          <span className="text-xs sm:text-sm text-slate-500">
            {currentIndex + 1} of {CARD_CONFIGS.length}
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={scrollNext}
            disabled={!canScrollNext}
            className="text-slate-400 hover:text-white disabled:opacity-30 text-xs sm:text-sm"
          >
            Next
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
          </Button>
        </div>
      )}

      {/* View All 7 Days Button */}
      {onViewAllDays && (
        <div className="px-4 pt-2">
          <Button
            variant="outline"
            onClick={onViewAllDays}
            className="w-full border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-400"
          >
            <Calendar className="w-4 h-4 mr-2" />
            View All 7 Days
          </Button>
        </div>
      )}

      {/* Swipe Hint (only on first card, no button) */}
      <AnimatePresence>
        {currentIndex === 0 && !onViewAllDays && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center"
          >
            <p className="text-xs text-slate-500 flex items-center justify-center gap-2">
              <ChevronLeft className="w-3 h-3" />
              Swipe to explore
              <ChevronRight className="w-3 h-3" />
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// InsightCard Component (individual card wrapper)
// ============================================================================

interface InsightCardProps {
  config: CardConfig;
  isActive: boolean;
  children: React.ReactNode;
}

function InsightCard({ config, isActive, children }: InsightCardProps) {
  return (
    <motion.div
      animate={{ scale: isActive ? 1 : 0.97, opacity: isActive ? 1 : 0.7 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="h-full"
    >
      <Card
        className={`bg-gradient-to-br ${config.gradient} ${config.borderColor} p-3 sm:p-4 h-[240px] sm:h-[260px] flex flex-col overflow-hidden`}
      >
        {/* Card Header - Compact */}
        <div className="flex items-center gap-2 mb-2 sm:mb-3 pb-2 border-b border-slate-700/30">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-800/50 flex items-center justify-center text-white flex-shrink-0">
            {config.icon}
          </div>
          <h3 className="text-sm sm:text-base font-semibold text-white">{config.title}</h3>
        </div>

        {/* Card Content - NO SCROLL, fixed height */}
        <div className="flex-1 overflow-hidden">{children}</div>
      </Card>
    </motion.div>
  );
}

// ============================================================================
// Today's Coverage Card (Day 1 only with bullet points)
// ============================================================================

interface TodaysCoverageCardProps {
  task: MIOInsightDayTask;
  totalDays: number;
}

function TodaysCoverageCard({ task, totalDays }: TodaysCoverageCardProps) {
  // Parse instructions into bullet points (split by newlines or periods)
  const getBulletPoints = (instructions: string): string[] => {
    // Try splitting by newlines first
    let points = instructions.split(/\n+/).filter(p => p.trim().length > 0);

    // If only one point, try splitting by numbered items or bullet points
    if (points.length === 1) {
      points = instructions.split(/(?:\d+\.\s*|\•\s*|-\s*)/).filter(p => p.trim().length > 0);
    }

    // If still only one point, split by sentences but keep it reasonable
    if (points.length === 1 && instructions.length > 100) {
      points = instructions.split(/(?<=[.!?])\s+/).filter(p => p.trim().length > 0);
    }

    // Return max 3 bullet points, truncate long ones
    return points.slice(0, 3).map(p => {
      const trimmed = p.trim();
      return trimmed.length > 60 ? trimmed.substring(0, 57) + '...' : trimmed;
    });
  };

  const bulletPoints = getBulletPoints(task.task_instructions);

  return (
    <div className="space-y-2 h-full flex flex-col">
      {/* Day indicator */}
      <div className="flex items-center justify-between">
        <span className="text-xs sm:text-sm text-emerald-400 font-medium">
          Day {task.day} of {totalDays}
        </span>
        {task.duration_minutes && (
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            ~{task.duration_minutes}m
          </span>
        )}
      </div>

      {/* Task title */}
      <p className="text-white font-medium text-sm sm:text-base">
        "{task.task_title}"
      </p>

      {/* Action bullets */}
      <div className="flex-1">
        <p className="text-xs text-emerald-400/80 mb-1.5">Activate your coverage:</p>
        <ul className="space-y-1.5">
          {bulletPoints.map((point, index) => (
            <li key={index} className="flex items-start gap-2 text-xs sm:text-sm text-slate-300">
              <span className="text-emerald-400 mt-0.5">•</span>
              <span className="line-clamp-2">{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Swipe hint */}
      <p className="text-xs text-emerald-400/70 pt-1">
        ← Swipe for a question
      </p>
    </div>
  );
}

// ============================================================================
// ProtocolDayPreview Component (mini day preview for protocol card)
// ============================================================================

interface ProtocolDayPreviewProps {
  task: MIOInsightDayTask;
  isFirst: boolean;
}

function ProtocolDayPreview({ task, isFirst }: ProtocolDayPreviewProps) {
  return (
    <div
      className={`flex items-start gap-3 p-2 rounded-lg transition-all ${
        isFirst
          ? 'bg-emerald-500/10 border border-emerald-500/30'
          : 'bg-slate-800/30'
      }`}
    >
      {/* Day Number */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
          isFirst
            ? 'bg-emerald-500 text-white'
            : 'bg-slate-700 text-slate-300'
        }`}
      >
        {task.day}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={`font-medium text-sm ${
            isFirst ? 'text-emerald-400' : 'text-white'
          }`}
        >
          {task.task_title}
        </p>
        <p className="text-xs text-slate-400 truncate">{task.theme}</p>
        {task.duration_minutes && (
          <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
            <Clock className="w-3 h-3" />
            {task.duration_minutes}m
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Compact version for embedding in other views
// ============================================================================

interface CompactInsightCardsProps {
  protocol: MIOInsightProtocol;
  onViewFull?: () => void;
}

export function CompactInsightCards({ protocol, onViewFull }: CompactInsightCardsProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [currentIndex, setCurrentIndex] = useState(0);

  const insightSummary = protocol.simplified_insight_summary || protocol.insight_summary;

  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      setCurrentIndex(api.selectedScrollSnap());
    };

    api.on('select', onSelect);
    onSelect();

    return () => {
      api.off('select', onSelect);
    };
  }, [api]);

  return (
    <div className="space-y-3">
      {/* Compact Progress Dots */}
      <div className="flex items-center justify-center gap-1.5">
        {CARD_CONFIGS.map((config, index) => (
          <div
            key={config.id}
            className={`transition-all duration-300 rounded-full ${
              index === currentIndex
                ? 'w-4 h-1.5 bg-cyan-400'
                : 'w-1.5 h-1.5 bg-slate-600'
            }`}
          />
        ))}
      </div>

      <Carousel
        setApi={setApi}
        opts={{ align: 'center', loop: false }}
        className="w-full"
      >
        <CarouselContent>
          <CarouselItem>
            <Card className="bg-cyan-500/10 border-cyan-500/30 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-cyan-400 font-medium">The Pattern</span>
              </div>
              <p className="text-sm text-slate-200 line-clamp-3">
                {insightSummary}
              </p>
            </Card>
          </CarouselItem>

          <CarouselItem>
            <Card className="bg-purple-500/10 border-purple-500/30 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-purple-400 font-medium">Why It Happens</span>
              </div>
              <p className="text-sm text-slate-200 line-clamp-3">
                {protocol.simplified_why_it_matters || protocol.why_it_matters}
              </p>
            </Card>
          </CarouselItem>

          <CarouselItem>
            <Card className="bg-emerald-500/10 border-emerald-500/30 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-emerald-400 font-medium">7-Day Protocol</span>
              </div>
              <p className="text-sm text-slate-200">
                {protocol.day_tasks.length} days of targeted exercises to rewire this pattern.
              </p>
            </Card>
          </CarouselItem>

          <CarouselItem>
            <Card className="bg-amber-500/10 border-amber-500/30 p-4">
              <div className="flex items-center gap-2 mb-2">
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-amber-400 font-medium">Reflect</span>
              </div>
              <p className="text-sm text-slate-200 italic">
                "What becomes possible when this pattern no longer runs you?"
              </p>
            </Card>
          </CarouselItem>
        </CarouselContent>
      </Carousel>

      {onViewFull && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onViewFull}
          className="w-full text-cyan-400 hover:text-cyan-300"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Explore Full Insight
        </Button>
      )}
    </div>
  );
}

export default SwipeableInsightCards;
