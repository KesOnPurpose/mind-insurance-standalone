// Mental Pillar Assessment Scenario Question Card
// Cinematic one-per-page question with animated options

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { ScenarioQuestion, QuestionOption, COMPETENCY_INFO, MENTAL_PILLAR_COLORS } from '@/types/mental-pillar-assessment';

interface MPAssessmentQuestionProps {
  question: ScenarioQuestion;
  selectedAnswer?: string;
  onSelect: (answerId: string, score: number) => void;
  direction: 'forward' | 'backward';
}

export function MPAssessmentQuestion({
  question,
  selectedAnswer,
  onSelect,
  direction,
}: MPAssessmentQuestionProps) {
  const competencyInfo = COMPETENCY_INFO[question.competency];

  const slideVariants = {
    enter: (dir: 'forward' | 'backward') => ({
      x: dir === 'forward' ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: 'forward' | 'backward') => ({
      x: dir === 'forward' ? -300 : 300,
      opacity: 0,
    }),
  };

  const optionVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.2 + i * 0.08,
        duration: 0.3,
        ease: 'easeOut',
      },
    }),
  };

  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={question.id}
        custom={direction}
        variants={slideVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
        className="w-full max-w-2xl mx-auto px-4"
      >
        {/* Question Card */}
        <div
          className="rounded-2xl p-6 sm:p-8 backdrop-blur-xl border shadow-xl"
          style={{
            background: `linear-gradient(135deg, ${competencyInfo.color}15 0%, ${MENTAL_PILLAR_COLORS.background.end}90 100%)`,
            borderColor: `${competencyInfo.color}30`,
            boxShadow: `0 20px 40px ${competencyInfo.color}10`,
          }}
        >
          {/* Competency Badge */}
          <div className="flex items-center gap-2 mb-4">
            <span
              className="px-3 py-1 rounded-full text-xs font-medium"
              style={{
                backgroundColor: `${competencyInfo.color}20`,
                color: competencyInfo.color,
              }}
            >
              {competencyInfo.icon} Week {competencyInfo.week}: {competencyInfo.shortLabel}
            </span>
          </div>

          {/* Question Title */}
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">
            {question.title}
          </h2>

          {/* Scenario */}
          <p className="text-base sm:text-lg text-white/70 mb-8 leading-relaxed">
            {question.scenario}
          </p>

          {/* Options */}
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <OptionButton
                key={option.id}
                option={option}
                index={index}
                isSelected={selectedAnswer === option.id}
                competencyColor={competencyInfo.color}
                onSelect={() => onSelect(option.id, option.score)}
              />
            ))}
          </div>
        </div>

        {/* Keyboard hint */}
        <p className="text-center text-white/30 text-xs mt-4">
          Use arrow keys to navigate, Enter to select
        </p>
      </motion.div>
    </AnimatePresence>
  );
}

interface OptionButtonProps {
  option: QuestionOption;
  index: number;
  isSelected: boolean;
  competencyColor: string;
  onSelect: () => void;
}

function OptionButton({
  option,
  index,
  isSelected,
  competencyColor,
  onSelect,
}: OptionButtonProps) {
  const optionVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.2 + index * 0.08,
        duration: 0.3,
        ease: 'easeOut',
      },
    },
  };

  return (
    <motion.button
      variants={optionVariants}
      initial="hidden"
      animate="visible"
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-xl border transition-all duration-200 group ${
        isSelected
          ? 'border-opacity-60 shadow-lg'
          : 'border-white/10 hover:border-white/20 hover:bg-white/5'
      }`}
      style={
        isSelected
          ? {
              backgroundColor: `${competencyColor}20`,
              borderColor: `${competencyColor}60`,
              boxShadow: `0 0 20px ${competencyColor}20`,
            }
          : {}
      }
    >
      <div className="flex items-start gap-3">
        {/* Radio Circle */}
        <div
          className={`flex-shrink-0 w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center transition-all ${
            isSelected ? 'border-transparent' : 'border-white/30 group-hover:border-white/50'
          }`}
          style={
            isSelected
              ? {
                  backgroundColor: competencyColor,
                  borderColor: competencyColor,
                }
              : {}
          }
        >
          {isSelected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            </motion.div>
          )}
        </div>

        {/* Option Text */}
        <span
          className={`text-sm sm:text-base leading-relaxed ${
            isSelected ? 'text-white font-medium' : 'text-white/70 group-hover:text-white/90'
          }`}
        >
          {option.text}
        </span>
      </div>
    </motion.button>
  );
}
