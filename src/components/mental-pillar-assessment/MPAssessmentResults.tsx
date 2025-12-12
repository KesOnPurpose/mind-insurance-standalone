// Mental Pillar Assessment Results Reveal
// Animated results display with MIO feedback

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Loader2, Sparkles, TrendingUp, ArrowRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MPCompetencyGrid } from './MPCompetencyBar';
import {
  PillarScores,
  GrowthDeltas,
  MIOFeedback,
  AssessmentPhase,
  MentalPillarCompetency,
  COMPETENCY_INFO,
  MENTAL_PILLAR_COLORS,
  getFocusAreas,
  getBiggestGrowth,
} from '@/types/mental-pillar-assessment';
import { getScoreInterpretation } from '@/services/mentalPillarAssessmentService';

interface MPAssessmentResultsProps {
  phase: AssessmentPhase;
  scores: PillarScores;
  growthDeltas?: GrowthDeltas;
  mioFeedback?: MIOFeedback;
  isLoadingFeedback: boolean;
  onContinue: () => void;
  onRetry?: () => void;
}

export function MPAssessmentResults({
  phase,
  scores,
  growthDeltas,
  mioFeedback,
  isLoadingFeedback,
  onContinue,
  onRetry,
}: MPAssessmentResultsProps) {
  const [showContent, setShowContent] = useState(false);
  const [analyzingProgress, setAnalyzingProgress] = useState(0);

  // Analyzing animation
  useEffect(() => {
    const timer = setInterval(() => {
      setAnalyzingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => setShowContent(true), 300);
          return 100;
        }
        return prev + 4;
      });
    }, 50);

    return () => clearInterval(timer);
  }, []);

  const focusAreas = getFocusAreas(scores);
  const interpretation = getScoreInterpretation(scores.overall);
  const biggestGrowth = growthDeltas ? getBiggestGrowth(growthDeltas) : null;

  if (!showContent) {
    return <AnalyzingState progress={analyzingProgress} phase={phase} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-2xl mx-auto px-4 py-8"
    >
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-center mb-8"
      >
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
          style={{ backgroundColor: `${MENTAL_PILLAR_COLORS.primary}20` }}
        >
          <Brain
            className="w-8 h-8"
            style={{ color: MENTAL_PILLAR_COLORS.primary }}
          />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          {phase === 'pre' ? 'Your Baseline Results' : 'Your Growth Results'}
        </h1>
        <p className="text-white/60">
          {phase === 'pre'
            ? 'Here\'s where you\'re starting your Mental Pillar journey'
            : 'See how far you\'ve come over 4 weeks'}
        </p>
      </motion.div>

      {/* Overall Score Card */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring' }}
        className="rounded-2xl p-6 mb-6 text-center"
        style={{
          background: `linear-gradient(135deg, ${MENTAL_PILLAR_COLORS.primary}20 0%, ${MENTAL_PILLAR_COLORS.background.end} 100%)`,
          border: `1px solid ${MENTAL_PILLAR_COLORS.primary}30`,
        }}
      >
        <p className="text-sm text-white/50 mb-2">Overall Mental Pillar Score</p>
        <div className="flex items-center justify-center gap-4">
          <motion.span
            className="text-6xl font-bold"
            style={{ color: MENTAL_PILLAR_COLORS.primary }}
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
          >
            {scores.overall}
          </motion.span>
          {growthDeltas && (
            <motion.span
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className={`flex items-center gap-1 text-2xl font-semibold ${
                growthDeltas.overall >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              <TrendingUp className="w-6 h-6" />
              {growthDeltas.overall > 0 ? '+' : ''}
              {growthDeltas.overall}
            </motion.span>
          )}
        </div>
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-3"
        >
          <span
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium"
            style={{
              backgroundColor: `${MENTAL_PILLAR_COLORS.primary}30`,
              color: MENTAL_PILLAR_COLORS.primaryLight,
            }}
          >
            {interpretation.label}
          </span>
          <p className="text-xs text-white/40 mt-2">{interpretation.description}</p>
        </motion.div>
      </motion.div>

      {/* Competency Breakdown */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="rounded-2xl p-6 mb-6"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <h3 className="text-lg font-semibold text-white mb-4">
          Competency Breakdown
        </h3>
        <MPCompetencyGrid
          scores={scores}
          deltas={growthDeltas}
          primaryCompetency={focusAreas[0]}
        />
      </motion.div>

      {/* Focus Areas */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="rounded-2xl p-6 mb-6"
        style={{
          background: `${MENTAL_PILLAR_COLORS.accent}10`,
          border: `1px solid ${MENTAL_PILLAR_COLORS.accent}30`,
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Sparkles
            className="w-5 h-5"
            style={{ color: MENTAL_PILLAR_COLORS.accent }}
          />
          <h3 className="text-lg font-semibold text-white">
            {phase === 'pre' ? 'Your Focus Areas' : 'Biggest Growth'}
          </h3>
        </div>
        {phase === 'pre' ? (
          <div className="flex flex-wrap gap-2">
            {focusAreas.map((area) => {
              const info = COMPETENCY_INFO[area];
              return (
                <span
                  key={area}
                  className="px-3 py-1.5 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: `${info.color}20`,
                    color: info.color,
                  }}
                >
                  {info.icon} {info.label} (Week {info.week})
                </span>
              );
            })}
          </div>
        ) : biggestGrowth ? (
          <div className="flex items-center gap-3">
            <span
              className="px-3 py-1.5 rounded-full text-sm font-medium"
              style={{
                backgroundColor: `${COMPETENCY_INFO[biggestGrowth].color}20`,
                color: COMPETENCY_INFO[biggestGrowth].color,
              }}
            >
              {COMPETENCY_INFO[biggestGrowth].icon}{' '}
              {COMPETENCY_INFO[biggestGrowth].label}
            </span>
            <span className="text-emerald-400 font-semibold">
              +{growthDeltas?.[biggestGrowth]} points
            </span>
          </div>
        ) : null}
        <p className="text-sm text-white/50 mt-2">
          {phase === 'pre'
            ? 'These areas will see the most transformation during the 4-week curriculum.'
            : 'This is where you showed the most improvement. Well done!'}
        </p>
      </motion.div>

      {/* MIO Feedback */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.0 }}
        className="rounded-2xl p-6 mb-8"
        style={{
          background: 'linear-gradient(135deg, rgba(5,195,221,0.1) 0%, rgba(10,22,40,0.9) 100%)',
          border: '1px solid rgba(5,195,221,0.2)',
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-mi-cyan/20 flex items-center justify-center">
            <span className="text-sm">🔮</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">MIO's Insight</h3>
            <p className="text-xs text-mi-cyan/70">Mind Insurance Oracle</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isLoadingFeedback ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3 py-4"
            >
              <Loader2 className="w-5 h-5 text-mi-cyan animate-spin" />
              <span className="text-white/60">MIO is analyzing your results...</span>
            </motion.div>
          ) : mioFeedback ? (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-white/80 leading-relaxed whitespace-pre-wrap"
            >
              {mioFeedback.content}
            </motion.div>
          ) : (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-white/50 py-2"
            >
              <p>MIO is still processing your results.</p>
              {onRetry && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRetry}
                  className="mt-2 text-mi-cyan"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Continue Button */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <Button
          onClick={onContinue}
          className="w-full py-6 text-lg font-semibold"
          style={{
            background: `linear-gradient(135deg, ${MENTAL_PILLAR_COLORS.primary} 0%, ${MENTAL_PILLAR_COLORS.primaryLight} 100%)`,
          }}
        >
          Continue to Your Vault
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </motion.div>
    </motion.div>
  );
}

// Analyzing Animation Component
function AnalyzingState({
  progress,
  phase,
}: {
  progress: number;
  phase: AssessmentPhase;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full max-w-md mx-auto px-4 py-16 text-center"
    >
      {/* Brain Animation */}
      <motion.div
        className="relative w-24 h-24 mx-auto mb-8"
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(from 0deg, ${MENTAL_PILLAR_COLORS.primary}, ${MENTAL_PILLAR_COLORS.primaryLight}, ${MENTAL_PILLAR_COLORS.accent}, ${MENTAL_PILLAR_COLORS.primary})`,
            opacity: 0.3,
          }}
        />
        <div
          className="absolute inset-1 rounded-full flex items-center justify-center"
          style={{ backgroundColor: MENTAL_PILLAR_COLORS.background.start }}
        >
          <Brain
            className="w-10 h-10"
            style={{ color: MENTAL_PILLAR_COLORS.primary }}
          />
        </div>
      </motion.div>

      {/* Progress */}
      <div className="mb-6">
        <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-3">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${MENTAL_PILLAR_COLORS.primary}, ${MENTAL_PILLAR_COLORS.primaryLight})`,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-white/60 text-sm">{Math.round(progress)}%</p>
      </div>

      {/* Message */}
      <h2 className="text-xl font-semibold text-white mb-2">
        MIO is analyzing your responses...
      </h2>
      <p className="text-white/50 text-sm">
        {phase === 'pre'
          ? 'Calculating your baseline Mental Pillar scores'
          : 'Measuring your growth over 4 weeks'}
      </p>

      {/* Animated dots */}
      <div className="flex justify-center gap-1 mt-6">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: MENTAL_PILLAR_COLORS.primary }}
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
