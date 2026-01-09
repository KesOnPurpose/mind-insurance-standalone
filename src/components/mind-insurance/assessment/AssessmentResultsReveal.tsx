/**
 * AssessmentResultsReveal Component
 * Cinematic results display for Identity Collision Assessment
 *
 * Features:
 * - Analyzing state with spinner
 * - Pattern reveal with spring animation
 * - Confidence counter (0% → final%)
 * - Pattern breakdown bars
 * - Pattern-specific gradients
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Shield, ArrowRight, Sparkles, Link2, Zap, Compass } from 'lucide-react';
import type { AssessmentResult, CollisionPattern, CollisionScores } from '@/services/identityCollisionService';
import { PATTERN_INFO } from '@/services/identityCollisionService';

interface AssessmentResultsRevealProps {
  result: AssessmentResult;
  onContinue: () => void;
  isLoading?: boolean;
}

// Pattern-specific styling - Rich, saturated colors without white overlay
const PATTERN_STYLES: Record<CollisionPattern, {
  gradient: string;
  iconBg: string;
  barColor: string;
  icon: React.ReactNode;
}> = {
  past_prison: {
    gradient: 'from-violet-500/90 via-purple-500/80 to-violet-600/70',
    iconBg: 'bg-violet-400/30',
    barColor: 'bg-violet-500',
    icon: <Link2 className="w-8 h-8 text-violet-400" />,
  },
  success_sabotage: {
    gradient: 'from-amber-500/90 via-orange-500/80 to-amber-600/70',
    iconBg: 'bg-amber-400/30',
    barColor: 'bg-amber-500',
    icon: <Zap className="w-8 h-8 text-amber-400" />,
  },
  compass_crisis: {
    gradient: 'from-cyan-500/90 via-blue-500/80 to-cyan-600/70',
    iconBg: 'bg-cyan-400/30',
    barColor: 'bg-cyan-500',
    icon: <Compass className="w-8 h-8 text-cyan-400" />,
  },
};

// Animated counter hook
function useAnimatedCounter(targetValue: number, duration: number = 1500): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(easeOut * targetValue));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [targetValue, duration]);

  return count;
}

// Analyzing State Component
function AnalyzingState() {
  const [dots, setDots] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev + 1) % 4);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-8">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="relative"
      >
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-mi-cyan to-violet-500 flex items-center justify-center">
          <Brain className="w-12 h-12 text-white" />
        </div>
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-br from-mi-cyan/50 to-violet-500/50"
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.div>

      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-white">
          MIO is analyzing your responses{'.'.repeat(dots)}
        </h2>
        <p className="text-sm text-gray-400">
          Identifying your primary collision pattern
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-mi-cyan"
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Pattern Breakdown Bar Component
function PatternBar({
  pattern,
  score,
  maxScore,
  isPrimary,
  delay,
}: {
  pattern: CollisionPattern;
  score: number;
  maxScore: number;
  isPrimary: boolean;
  delay: number;
}) {
  const patternStyle = PATTERN_STYLES[pattern];
  const patternInfo = PATTERN_INFO[pattern];
  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="space-y-1.5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{patternInfo.icon}</span>
          <span className={`text-sm ${isPrimary ? 'text-white font-medium' : 'text-gray-400'}`}>
            {patternInfo.name}
          </span>
          {isPrimary && (
            <span className="text-xs bg-mi-gold/20 text-mi-gold px-2 py-0.5 rounded-full">
              Primary
            </span>
          )}
        </div>
        <span className={`text-sm ${isPrimary ? 'text-white' : 'text-gray-500'}`}>
          {score}
        </span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${patternStyle.barColor} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ delay: delay + 0.2, duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
}

export function AssessmentResultsReveal({
  result,
  onContinue,
  isLoading = false,
}: AssessmentResultsRevealProps) {
  const [showAnalyzing, setShowAnalyzing] = useState(true);
  const [showResult, setShowResult] = useState(false);

  const patternInfo = PATTERN_INFO[result.primaryPattern];
  const patternStyle = PATTERN_STYLES[result.primaryPattern];
  const animatedConfidence = useAnimatedCounter(showResult ? result.confidence : 0);

  // Calculate max score for percentage bars
  const scores = result.scores;
  const maxPatternScore = Math.max(
    scores.past_prison,
    scores.success_sabotage,
    scores.compass_crisis
  );

  // Simulate analysis time then show results
  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        setShowAnalyzing(false);
        setTimeout(() => setShowResult(true), 300);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // Show analyzing state
  if (showAnalyzing || isLoading) {
    return <AnalyzingState />;
  }

  return (
    <AnimatePresence>
      {showResult && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full space-y-6"
        >
          {/* Main Result Card - Compact design to show Pattern Mix without scrolling */}
          <Card
            className={`bg-gradient-to-br ${patternStyle.gradient} border-2 border-white/20 p-5 rounded-2xl`}
          >
            {/* Pattern Icon and Name - Horizontal layout for compactness */}
            <div className="flex items-center gap-4 mb-4">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 15,
                  delay: 0.2,
                }}
                className={`w-16 h-16 rounded-full ${patternStyle.iconBg} flex items-center justify-center flex-shrink-0`}
              >
                <span className="text-4xl">{patternInfo.icon}</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="flex-1"
              >
                <p className="text-xs text-gray-800 mb-1">Your Collision Pattern</p>
                <h1 className="text-2xl font-bold text-gray-900">
                  {patternInfo.name}
                </h1>
              </motion.div>
            </div>

            {/* Confidence Badge - Inline */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.3 }}
              className="flex justify-center mb-4"
            >
              <div className="px-3 py-1.5 rounded-full flex items-center gap-2 bg-white/20">
                <Sparkles className="w-4 h-4 text-mi-gold" />
                <span className="text-lg font-bold text-gray-900">{animatedConfidence}%</span>
                <span className="text-sm text-gray-700">confidence</span>
              </div>
            </motion.div>

            {/* Short Description Only - Compact */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.4 }}
              className="text-center text-gray-800 text-base leading-relaxed"
            >
              {patternInfo.shortDescription}
            </motion.p>

            {/* Full Description - Hidden by default, collapsed */}
            <motion.details
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.4 }}
              className="mt-4"
            >
              <summary className="text-xs text-gray-700 cursor-pointer hover:text-gray-900 text-center">
                Tap to read more
              </summary>
              <p className="text-sm text-gray-700 leading-relaxed mt-2 bg-white/10 rounded-lg p-3">
                {patternInfo.fullDescription}
              </p>
            </motion.details>

            {/* Impact Area */}
            {result.impactArea && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.4 }}
                className="flex items-center justify-center gap-2 text-sm text-gray-700 mt-3"
              >
                <span>Most affected area:</span>
                <span className="text-gray-900 font-semibold capitalize">
                  {result.impactArea.replace('_', ' ')}
                </span>
              </motion.div>
            )}
          </Card>

          {/* Pattern Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.4 }}
          >
            <Card className="bg-mi-navy-light border-2 border-white/20 p-5 rounded-2xl">
              <h3 className="text-sm font-medium text-gray-400 mb-4">Your Pattern Mix</h3>
              <div className="space-y-4">
                <PatternBar
                  pattern="past_prison"
                  score={scores.past_prison}
                  maxScore={maxPatternScore}
                  isPrimary={result.primaryPattern === 'past_prison'}
                  delay={1.5}
                />
                <PatternBar
                  pattern="success_sabotage"
                  score={scores.success_sabotage}
                  maxScore={maxPatternScore}
                  isPrimary={result.primaryPattern === 'success_sabotage'}
                  delay={1.6}
                />
                <PatternBar
                  pattern="compass_crisis"
                  score={scores.compass_crisis}
                  maxScore={maxPatternScore}
                  isPrimary={result.primaryPattern === 'compass_crisis'}
                  delay={1.7}
                />
              </div>
            </Card>
          </motion.div>

          {/* Continue Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8, duration: 0.4 }}
          >
            <Button
              onClick={onContinue}
              className="w-full h-14 text-lg font-semibold rounded-xl bg-gradient-to-r from-mi-cyan to-mi-cyan/80 hover:from-mi-cyan/90 hover:to-mi-cyan/70 text-white shadow-lg shadow-mi-cyan/30"
            >
              <Shield className="w-5 h-5 mr-2" />
              Continue to Mind Insurance
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default AssessmentResultsReveal;
