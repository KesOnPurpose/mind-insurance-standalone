/**
 * AssessmentQuestionCard Component
 * $100M Premium Design - Luxury Assessment Experience
 *
 * Design Philosophy:
 * - Glass morphism with subtle depth
 * - Phase-specific accent colors (not backgrounds)
 * - Elegant micro-interactions
 * - Premium typography and spacing
 * - Subtle glow effects on selection
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Check, BarChart3, Target, TrendingUp, Link2, Zap, Compass, Sparkles } from 'lucide-react';

interface QuestionOption {
  id: string;
  text: string;
  score: number;
  patternIndicators?: Record<string, number>;
}

interface Question {
  id: string;
  title: string;
  subtitle?: string;
  type: 'single' | 'slider';
  options?: QuestionOption[];
}

interface AssessmentQuestionCardProps {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  selectedAnswer: string | null;
  onAnswer: (value: string) => void;
  direction?: 'forward' | 'backward';
}

type Phase = 'foundation' | 'pattern' | 'impact';

interface PhaseConfig {
  label: string;
  icon: React.ReactNode;
  accentColor: string;
  glowColor: string;
  badgeBg: string;
}

const PHASE_CONFIGS: Record<Phase, PhaseConfig> = {
  foundation: {
    label: 'FOUNDATION',
    icon: <BarChart3 className="w-3.5 h-3.5" />,
    accentColor: 'text-violet-400',
    glowColor: 'shadow-violet-500/20',
    badgeBg: 'bg-violet-500/10 border-violet-500/30',
  },
  pattern: {
    label: 'PATTERN DETECTION',
    icon: <Target className="w-3.5 h-3.5" />,
    accentColor: 'text-amber-400',
    glowColor: 'shadow-amber-500/20',
    badgeBg: 'bg-amber-500/10 border-amber-500/30',
  },
  impact: {
    label: 'IMPACT ASSESSMENT',
    icon: <TrendingUp className="w-3.5 h-3.5" />,
    accentColor: 'text-mi-cyan',
    glowColor: 'shadow-mi-cyan/20',
    badgeBg: 'bg-mi-cyan/10 border-mi-cyan/30',
  },
};

// Pattern icons for Q4 options
const PATTERN_ICONS: Record<string, React.ReactNode> = {
  a: <Link2 className="w-4 h-4 text-violet-400" />,
  b: <Compass className="w-4 h-4 text-cyan-400" />,
  c: <Zap className="w-4 h-4 text-amber-400" />,
  d: null,
};

function getPhaseForIndex(index: number): Phase {
  if (index <= 2) return 'foundation';
  if (index <= 5) return 'pattern';
  return 'impact';
}

// Animation variants for card entrance/exit
const cardVariants = {
  enter: (direction: string) => ({
    x: direction === 'forward' ? 100 : -100,
    opacity: 0,
    scale: 0.98,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: string) => ({
    x: direction === 'forward' ? -100 : 100,
    opacity: 0,
    scale: 0.98,
  }),
};

// Animation variants for options - staggered reveal
const optionVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: 0.1 + i * 0.08,
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94]
    },
  }),
};

export function AssessmentQuestionCard({
  question,
  questionIndex,
  totalQuestions,
  selectedAnswer,
  onAnswer,
  direction = 'forward',
}: AssessmentQuestionCardProps) {
  const phase = getPhaseForIndex(questionIndex);
  const phaseConfig = PHASE_CONFIGS[phase];
  const isKeyQuestion = questionIndex === 3; // Q4 is the primary pattern detector

  return (
    <motion.div
      key={question.id}
      custom={direction}
      variants={cardVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
      className="w-full"
    >
      {/* Main Card - Glass morphism effect */}
      <div
        className={`
          relative overflow-hidden
          bg-gradient-to-b from-white/[0.08] to-white/[0.02]
          backdrop-blur-xl
          border border-white/[0.08]
          rounded-3xl
          p-5 sm:p-7
          shadow-2xl shadow-black/40
          ${isKeyQuestion ? 'ring-1 ring-mi-gold/30' : ''}
        `}
      >
        {/* Subtle gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/20 pointer-events-none rounded-3xl" />

        {/* Phase accent line at top */}
        <div className={`absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent ${
          phase === 'foundation' ? 'via-violet-500/60' :
          phase === 'pattern' ? 'via-amber-500/60' :
          'via-mi-cyan/60'
        } to-transparent`} />

        {/* Content */}
        <div className="relative z-10">
          {/* Header - Phase Badge & Progress */}
          <div className="flex items-center justify-between mb-5">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`
                flex items-center gap-2
                ${phaseConfig.badgeBg}
                border
                px-3 py-1.5
                rounded-full
              `}
            >
              <span className={phaseConfig.accentColor}>{phaseConfig.icon}</span>
              <span className={`text-[10px] font-semibold tracking-widest ${phaseConfig.accentColor}`}>
                {phaseConfig.label}
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2"
            >
              <div className="flex gap-1">
                {Array.from({ length: totalQuestions }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                      i < questionIndex ? 'bg-mi-cyan' :
                      i === questionIndex ? 'bg-white' :
                      'bg-white/20'
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          </div>

          {/* Question Title */}
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-xl sm:text-2xl font-semibold text-white mb-2 leading-tight tracking-tight"
          >
            {question.title}
          </motion.h2>

          {/* Subtitle */}
          {question.subtitle && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={`text-sm mb-6 ${
                isKeyQuestion
                  ? 'text-mi-gold/90 flex items-center gap-2'
                  : 'text-white/50'
              }`}
            >
              {isKeyQuestion && <Sparkles className="w-4 h-4" />}
              {isKeyQuestion ? 'This is the key question — take your time' : question.subtitle}
            </motion.p>
          )}

          {/* Options */}
          {question.type === 'single' && question.options && (
            <RadioGroup
              value={selectedAnswer || ''}
              onValueChange={onAnswer}
              className="space-y-3"
            >
              {question.options.map((option, index) => {
                const isSelected = selectedAnswer === option.id;
                const showPatternIcon = isKeyQuestion && PATTERN_ICONS[option.id];

                return (
                  <motion.div
                    key={option.id}
                    custom={index}
                    variants={optionVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <div
                      onClick={() => onAnswer(option.id)}
                      className={`
                        relative group cursor-pointer
                        flex items-center gap-4
                        p-4 rounded-2xl
                        transition-all duration-300 ease-out
                        ${isSelected
                          ? `
                            bg-gradient-to-r from-mi-cyan/20 to-mi-cyan/10
                            border border-mi-cyan/40
                            shadow-lg ${phaseConfig.glowColor}
                          `
                          : `
                            bg-white/[0.03]
                            border border-white/[0.06]
                            hover:bg-white/[0.06]
                            hover:border-white/[0.12]
                          `
                        }
                      `}
                    >
                      {/* Custom Radio Circle */}
                      <div className="flex-shrink-0">
                        <div className={`
                          w-5 h-5 rounded-full
                          border-2 transition-all duration-300
                          flex items-center justify-center
                          ${isSelected
                            ? 'border-mi-cyan bg-mi-cyan'
                            : 'border-white/30 group-hover:border-white/50'
                          }
                        `}>
                          <AnimatePresence>
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                              >
                                <Check className="w-3 h-3 text-mi-navy" strokeWidth={3} />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        {/* Hidden actual radio for accessibility */}
                        <RadioGroupItem
                          value={option.id}
                          id={`${question.id}-${option.id}`}
                          className="sr-only"
                        />
                      </div>

                      {/* Pattern Icon (Q4 only) */}
                      {showPatternIcon && (
                        <div className="flex-shrink-0 opacity-70">
                          {PATTERN_ICONS[option.id]}
                        </div>
                      )}

                      {/* Option Text */}
                      <Label
                        htmlFor={`${question.id}-${option.id}`}
                        className={`
                          flex-1 cursor-pointer text-sm sm:text-base leading-relaxed
                          transition-colors duration-300
                          ${isSelected
                            ? 'text-white font-medium'
                            : 'text-white/70 group-hover:text-white/90'
                          }
                        `}
                      >
                        {option.text}
                      </Label>

                      {/* Selection indicator arrow */}
                      <AnimatePresence>
                        {isSelected && (
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="flex-shrink-0"
                          >
                            <div className="w-8 h-8 rounded-full bg-mi-cyan/20 flex items-center justify-center">
                              <Check className="w-4 h-4 text-mi-cyan" />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </RadioGroup>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default AssessmentQuestionCard;
