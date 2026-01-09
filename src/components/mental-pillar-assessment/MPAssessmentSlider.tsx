// Mental Pillar Assessment Slider Question
// Self-rating slider with real-time visual feedback

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import { SliderQuestion, COMPETENCY_INFO, MENTAL_PILLAR_COLORS } from '@/types/mental-pillar-assessment';

interface MPAssessmentSliderProps {
  question: SliderQuestion;
  value?: number;
  onChange: (value: number, score: number) => void;
  direction: 'forward' | 'backward';
}

export function MPAssessmentSlider({
  question,
  value,
  onChange,
  direction,
}: MPAssessmentSliderProps) {
  const [localValue, setLocalValue] = useState(value ?? 5);
  const competencyInfo = COMPETENCY_INFO[question.competency];

  // Sync with external value
  useEffect(() => {
    if (value !== undefined) {
      setLocalValue(value);
    }
  }, [value]);

  const handleChange = (newValue: number[]) => {
    const val = newValue[0];
    setLocalValue(val);
    // Convert 1-10 to 0-100 score
    const score = val * 10;
    onChange(val, score);
  };

  const getScoreLevel = (val: number) => {
    if (val <= 3) return { level: 'low', label: 'Developing', color: '#f59e0b' };
    if (val <= 5) return { level: 'medium-low', label: 'Emerging', color: '#eab308' };
    if (val <= 7) return { level: 'medium-high', label: 'Established', color: '#84cc16' };
    return { level: 'high', label: 'Advanced', color: '#10b981' };
  };

  const scoreLevel = getScoreLevel(localValue);

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
              {competencyInfo.icon} Self-Assessment
            </span>
          </div>

          {/* Question Title */}
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">
            {question.title}
          </h2>

          {/* Description */}
          <p className="text-base sm:text-lg text-white/70 mb-8 leading-relaxed">
            {question.description}
          </p>

          {/* Large Number Display */}
          <div className="text-center mb-6">
            <motion.div
              key={localValue}
              initial={{ scale: 0.8, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="text-6xl sm:text-7xl font-bold mb-2"
              style={{ color: scoreLevel.color }}
            >
              {localValue}
            </motion.div>
            <motion.div
              key={scoreLevel.label}
              initial={{ y: 5, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium"
              style={{
                backgroundColor: `${scoreLevel.color}20`,
                color: scoreLevel.color,
              }}
            >
              {scoreLevel.label}
            </motion.div>
          </div>

          {/* Slider */}
          <div className="mb-6">
            <Slider
              value={[localValue]}
              onValueChange={handleChange}
              min={question.min}
              max={question.max}
              step={1}
              className="w-full"
            />

            {/* Scale Markers */}
            <div className="flex justify-between mt-2 px-1">
              {Array.from({ length: 10 }, (_, i) => (
                <div
                  key={i + 1}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i + 1 <= localValue ? 'opacity-100' : 'opacity-30'
                  }`}
                  style={{
                    backgroundColor:
                      i + 1 <= localValue
                        ? scoreLevel.color
                        : 'rgba(255,255,255,0.3)',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Labels */}
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-white/50 max-w-[45%]">{question.minLabel}</span>
            <span className="text-white/50 max-w-[45%] text-right">{question.maxLabel}</span>
          </div>
        </div>

        {/* Keyboard hint */}
        <p className="text-center text-white/30 text-xs mt-4">
          Drag the slider or use arrow keys, then press Enter to continue
        </p>
      </motion.div>
    </AnimatePresence>
  );
}
