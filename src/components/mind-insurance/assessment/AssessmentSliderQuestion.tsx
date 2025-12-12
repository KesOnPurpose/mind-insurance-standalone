/**
 * AssessmentSliderQuestion Component
 * Premium slider for impact intensity (Q8)
 *
 * Features:
 * - Large numeric display
 * - Color gradient track (green → yellow → red)
 * - Dynamic impact label
 * - Smooth animations
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { TrendingUp, AlertCircle } from 'lucide-react';

interface SliderConfig {
  min: number;
  max: number;
  minLabel: string;
  maxLabel: string;
}

interface AssessmentSliderQuestionProps {
  questionIndex: number;
  totalQuestions: number;
  title: string;
  subtitle?: string;
  sliderConfig: SliderConfig;
  value: number;
  onValueChange: (value: number) => void;
  direction?: 'forward' | 'backward';
}

// Impact level labels based on value
function getImpactLevel(value: number): { label: string; color: string; bgColor: string } {
  if (value <= 3) {
    return {
      label: 'Minor Impact',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/20',
    };
  }
  if (value <= 5) {
    return {
      label: 'Moderate Impact',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
    };
  }
  if (value <= 7) {
    return {
      label: 'Significant Impact',
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/20',
    };
  }
  return {
    label: 'Critical — Needs Attention',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
  };
}

// Get gradient color for the slider track based on current value
function getTrackGradient(value: number): string {
  const percentage = ((value - 1) / 9) * 100;
  return `linear-gradient(to right,
    #10b981 0%,
    #fbbf24 50%,
    #ef4444 100%)`;
}

// Card animation variants
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

export function AssessmentSliderQuestion({
  questionIndex,
  totalQuestions,
  title,
  subtitle,
  sliderConfig,
  value,
  onValueChange,
  direction = 'forward',
}: AssessmentSliderQuestionProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const impactLevel = getImpactLevel(value);

  // Animate the display value
  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  return (
    <motion.div
      custom={direction}
      variants={cardVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="w-full"
    >
      <Card className="bg-gradient-to-br from-cyan-900/80 via-cyan-800/60 to-slate-900/90 border-cyan-500/50 border backdrop-blur-xl p-4 sm:p-6 rounded-2xl shadow-xl shadow-black/30">
        {/* Phase Badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 bg-cyan-500/30 px-2.5 py-1 rounded-full">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] sm:text-xs font-semibold tracking-wider text-cyan-400">
              IMPACT ASSESSMENT
            </span>
          </div>
          <span className="text-[10px] sm:text-xs text-gray-500">
            {questionIndex + 1}/{totalQuestions}
          </span>
        </div>

        {/* Question Title */}
        <h2 className="text-lg sm:text-xl font-bold text-white mb-1.5 leading-snug">
          {title}
        </h2>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-xs sm:text-sm text-gray-400 mb-4">{subtitle}</p>
        )}

        {/* Large Number Display */}
        <div className="flex flex-col items-center mb-6">
          <motion.div
            key={displayValue}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="relative"
          >
            <span className="text-5xl sm:text-6xl font-bold text-white">
              {displayValue}
            </span>
            {/* Glow effect based on value */}
            <div
              className={`absolute inset-0 blur-2xl opacity-30 ${
                displayValue <= 3
                  ? 'bg-emerald-500'
                  : displayValue <= 5
                  ? 'bg-yellow-500'
                  : displayValue <= 7
                  ? 'bg-orange-500'
                  : 'bg-red-500'
              }`}
            />
          </motion.div>

          {/* Impact Level Badge */}
          <AnimatePresence mode="wait">
            <motion.div
              key={impactLevel.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={`mt-4 px-4 py-2 rounded-full flex items-center gap-2 ${impactLevel.bgColor}`}
            >
              {value >= 8 && <AlertCircle className="w-4 h-4 text-red-400" />}
              <span className={`text-sm font-medium ${impactLevel.color}`}>
                {impactLevel.label}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Slider */}
        <div className="space-y-4 px-2">
          {/* Custom styled slider track */}
          <div className="relative">
            <Slider
              value={[value]}
              onValueChange={(values) => onValueChange(values[0])}
              min={sliderConfig.min}
              max={sliderConfig.max}
              step={1}
              className="[&_[role=slider]]:w-8 [&_[role=slider]]:h-8 [&_[role=slider]]:border-4 [&_[role=slider]]:border-white [&_[role=slider]]:bg-mi-cyan [&_[role=slider]]:shadow-lg"
            />
            {/* Gradient overlay for track */}
            <div
              className="absolute top-1/2 left-0 right-0 h-2 -translate-y-1/2 rounded-full pointer-events-none -z-10"
              style={{ background: getTrackGradient(value) }}
            />
          </div>

          {/* Min/Max Labels */}
          <div className="flex justify-between items-start text-sm">
            <div className="text-left">
              <span className="text-gray-500">{sliderConfig.min}</span>
              <p className="text-xs text-gray-600 mt-1">{sliderConfig.minLabel}</p>
            </div>
            <div className="text-center text-gray-500">|</div>
            <div className="text-right">
              <span className="text-gray-500">{sliderConfig.max}</span>
              <p className="text-xs text-gray-600 mt-1">{sliderConfig.maxLabel}</p>
            </div>
          </div>
        </div>

        {/* Scale markers */}
        <div className="flex justify-between px-2 mt-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className={`w-1 h-1 rounded-full ${
                i + 1 <= value ? 'bg-white/50' : 'bg-white/10'
              }`}
            />
          ))}
        </div>
      </Card>
    </motion.div>
  );
}

export default AssessmentSliderQuestion;
