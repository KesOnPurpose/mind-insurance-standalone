/**
 * AssessmentQuestionCard Component
 * Premium single-question display with phase-specific theming
 *
 * Features:
 * - Phase-specific gradient backgrounds
 * - Radio options with selection animations
 * - Phase badge with icon
 * - Special treatment for Q4 (primary pattern detector)
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Check, BarChart3, Target, TrendingUp, Link2, Zap, Compass } from 'lucide-react';

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
  gradient: string;
  borderColor: string;
  textColor: string;
  badgeColor: string;
}

const PHASE_CONFIGS: Record<Phase, PhaseConfig> = {
  foundation: {
    label: 'FOUNDATION',
    icon: <BarChart3 className="w-4 h-4" />,
    gradient: 'from-violet-900/80 via-violet-800/60 to-slate-900/90',
    borderColor: 'border-violet-500/50',
    textColor: 'text-violet-400',
    badgeColor: 'bg-violet-500/30',
  },
  pattern: {
    label: 'PATTERN DETECTION',
    icon: <Target className="w-4 h-4" />,
    gradient: 'from-amber-900/80 via-amber-800/60 to-slate-900/90',
    borderColor: 'border-amber-500/50',
    textColor: 'text-amber-400',
    badgeColor: 'bg-amber-500/30',
  },
  impact: {
    label: 'IMPACT ASSESSMENT',
    icon: <TrendingUp className="w-4 h-4" />,
    gradient: 'from-cyan-900/80 via-cyan-800/60 to-slate-900/90',
    borderColor: 'border-cyan-500/50',
    textColor: 'text-cyan-400',
    badgeColor: 'bg-cyan-500/30',
  },
};

// Pattern icons for Q4 options
const PATTERN_ICONS: Record<string, React.ReactNode> = {
  a: <Link2 className="w-4 h-4 text-violet-400" />, // Past Prison
  b: <Compass className="w-4 h-4 text-cyan-400" />, // Compass Crisis
  c: <Zap className="w-4 h-4 text-amber-400" />, // Success Sabotage
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
    x: direction === 'forward' ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: string) => ({
    x: direction === 'forward' ? -300 : 300,
    opacity: 0,
  }),
};

// Animation variants for options
const optionVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.2 },
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
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="w-full"
    >
      <Card
        className={`bg-gradient-to-br ${phaseConfig.gradient} ${phaseConfig.borderColor}
          border backdrop-blur-xl p-4 sm:p-6 rounded-2xl shadow-xl shadow-black/30
          ${isKeyQuestion ? 'ring-2 ring-mi-gold/40 shadow-mi-gold/20' : ''}`}
      >
        {/* Phase Badge */}
        <div className="flex items-center justify-between mb-4">
          <div className={`flex items-center gap-2 ${phaseConfig.badgeColor} px-2.5 py-1 rounded-full`}>
            <span className={phaseConfig.textColor}>{phaseConfig.icon}</span>
            <span className={`text-[10px] sm:text-xs font-semibold tracking-wider ${phaseConfig.textColor}`}>
              {phaseConfig.label}
            </span>
          </div>
          <span className="text-[10px] sm:text-xs text-gray-500">
            {questionIndex + 1}/{totalQuestions}
          </span>
        </div>

        {/* Question Title */}
        <h2 className="text-lg sm:text-xl font-bold text-white mb-1.5 leading-snug">
          {question.title}
        </h2>

        {/* Subtitle */}
        {question.subtitle && (
          <p className={`text-xs sm:text-sm mb-4 ${isKeyQuestion ? 'text-mi-gold' : 'text-gray-400'}`}>
            {isKeyQuestion ? 'This is the key question — take your time' : question.subtitle}
          </p>
        )}

        {/* Options */}
        {question.type === 'single' && question.options && (
          <RadioGroup
            value={selectedAnswer || ''}
            onValueChange={onAnswer}
            className="space-y-2"
          >
            <AnimatePresence mode="wait">
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
                      className={`relative flex items-start gap-2.5 p-3 rounded-lg cursor-pointer transition-all duration-200
                        ${
                          isSelected
                            ? `bg-mi-cyan/30 border border-mi-cyan/60 shadow-lg shadow-mi-cyan/20`
                            : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/25'
                        }`}
                      onClick={() => onAnswer(option.id)}
                    >
                      {/* Radio Button */}
                      <div className="mt-0.5 flex-shrink-0">
                        <RadioGroupItem
                          value={option.id}
                          id={`${question.id}-${option.id}`}
                          className={`border-2 ${
                            isSelected ? 'border-mi-cyan text-mi-cyan' : 'border-gray-500'
                          }`}
                        />
                      </div>

                      {/* Pattern Icon (Q4 only) */}
                      {showPatternIcon && (
                        <div className="flex-shrink-0 mt-0.5">{PATTERN_ICONS[option.id]}</div>
                      )}

                      {/* Option Text */}
                      <Label
                        htmlFor={`${question.id}-${option.id}`}
                        className={`flex-1 cursor-pointer text-sm leading-snug ${
                          isSelected ? 'text-white font-medium' : 'text-gray-300'
                        }`}
                      >
                        {option.text}
                      </Label>

                      {/* Selected Checkmark */}
                      <AnimatePresence>
                        {isSelected && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            className="flex-shrink-0"
                          >
                            <div className="w-6 h-6 rounded-full bg-mi-cyan flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </RadioGroup>
        )}
      </Card>
    </motion.div>
  );
}

export default AssessmentQuestionCard;
