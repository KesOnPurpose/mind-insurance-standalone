// Mental Pillar Baseline Assessment Page
// Cinematic one-question-per-page assessment experience

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ArrowRight, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMentalPillarAssessment } from '@/hooks/useMentalPillarAssessment';
import { MPAssessmentProgress } from '@/components/mental-pillar-assessment/MPAssessmentProgress';
import { MPAssessmentQuestion } from '@/components/mental-pillar-assessment/MPAssessmentQuestion';
import { MPAssessmentSlider } from '@/components/mental-pillar-assessment/MPAssessmentSlider';
import { MPAssessmentResults } from '@/components/mental-pillar-assessment/MPAssessmentResults';
import { MENTAL_PILLAR_COLORS, ScenarioQuestion, SliderQuestion } from '@/types/mental-pillar-assessment';
import { useNavigate } from 'react-router-dom';

export default function MentalPillarAssessmentPage() {
  const navigate = useNavigate();
  const {
    phase,
    currentStep,
    totalSteps,
    uiPhase,
    currentQuestion,
    answers,
    scores,
    growthDeltas,
    mioFeedback,
    isLoadingFeedback,
    error,
    canTake,
    attemptsRemaining,
    startAssessment,
    answerQuestion,
    answerSlider,
    goToNextQuestion,
    goToPreviousQuestion,
    retryFeedback,
    continueToVault,
  } = useMentalPillarAssessment();

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (uiPhase !== 'questions') return;

      switch (e.key) {
        case 'ArrowLeft':
          goToPreviousQuestion();
          break;
        case 'Enter':
          if (currentQuestion?.type === 'slider') {
            const currentAnswer = answers.get(currentQuestion.id);
            if (currentAnswer) {
              goToNextQuestion();
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [uiPhase, currentQuestion, answers, goToNextQuestion, goToPreviousQuestion]);

  // Get direction for animations
  const getDirection = useCallback((): 'forward' | 'backward' => {
    return 'forward'; // Default, could track previous step for better animation
  }, []);

  // Loading state
  if (uiPhase === 'loading') {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${MENTAL_PILLAR_COLORS.background.start} 0%, ${MENTAL_PILLAR_COLORS.background.end} 100%)`,
        }}
      >
        <div className="text-center">
          <Loader2
            className="w-10 h-10 animate-spin mx-auto mb-4"
            style={{ color: MENTAL_PILLAR_COLORS.primary }}
          />
          <p className="text-white/60">Loading assessment...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (uiPhase === 'error') {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{
          background: `linear-gradient(135deg, ${MENTAL_PILLAR_COLORS.background.start} 0%, ${MENTAL_PILLAR_COLORS.background.end} 100%)`,
        }}
      >
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Unable to Start Assessment</h2>
          <p className="text-white/60 mb-6">{error}</p>
          <Button onClick={() => navigate(-1)} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Intro screen
  if (uiPhase === 'intro') {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{
          background: `linear-gradient(135deg, ${MENTAL_PILLAR_COLORS.background.start} 0%, ${MENTAL_PILLAR_COLORS.background.end} 100%)`,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg text-center"
        >
          {/* Header */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
            style={{ backgroundColor: `${MENTAL_PILLAR_COLORS.primary}20` }}
          >
            <Brain
              className="w-10 h-10"
              style={{ color: MENTAL_PILLAR_COLORS.primary }}
            />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-white mb-4"
          >
            Mental Pillar{' '}
            {phase === 'pre' ? 'Baseline' : 'Growth'} Assessment
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-white/60 mb-8 leading-relaxed"
          >
            {phase === 'pre' ? (
              <>
                This 10-question assessment measures your current skills across 4 Mental Pillar competencies.
                Take it now to establish your baseline, then again after 4 weeks to see your growth.
              </>
            ) : (
              <>
                You've completed 4 weeks of Mental Pillar work. This assessment will measure your growth
                and show you how far you've come.
              </>
            )}
          </motion.p>

          {/* What we'll measure */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-xl p-6 mb-8 text-left"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <h3 className="text-sm font-medium text-white/70 mb-4">What we'll measure:</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { week: 1, name: 'Pattern Awareness', icon: '🔍' },
                { week: 2, name: 'Identity Alignment', icon: '🎯' },
                { week: 3, name: 'Belief Mastery', icon: '💡' },
                { week: 4, name: 'Mental Resilience', icon: '🛡️' },
              ].map((item) => (
                <div
                  key={item.week}
                  className="flex items-center gap-2 text-sm text-white/80"
                >
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Time estimate */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-white/40 text-sm mb-6"
          >
            ⏱️ Takes about 3-5 minutes
          </motion.p>

          {/* Start button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Button
              onClick={startAssessment}
              className="px-8 py-6 text-lg font-semibold"
              style={{
                background: `linear-gradient(135deg, ${MENTAL_PILLAR_COLORS.primary} 0%, ${MENTAL_PILLAR_COLORS.primaryLight} 100%)`,
              }}
            >
              Begin Assessment
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>

          {/* Attempts remaining */}
          {attemptsRemaining !== null && attemptsRemaining < 3 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-white/30 text-xs mt-4"
            >
              {attemptsRemaining} self-initiated attempts remaining
            </motion.p>
          )}
        </motion.div>
      </div>
    );
  }

  // Questions phase
  if (uiPhase === 'questions' && currentQuestion) {
    const currentAnswer = answers.get(currentQuestion.id);
    const isSlider = currentQuestion.type === 'slider';

    return (
      <div
        className="min-h-screen flex flex-col"
        style={{
          background: `linear-gradient(135deg, ${MENTAL_PILLAR_COLORS.background.start} 0%, ${MENTAL_PILLAR_COLORS.background.end} 100%)`,
        }}
      >
        {/* Progress Header */}
        <MPAssessmentProgress
          currentStep={currentStep}
          totalSteps={totalSteps}
          phase="questions"
        />

        {/* Question Content */}
        <div className="flex-1 flex items-center justify-center py-8">
          {currentQuestion.type === 'scenario' ? (
            <MPAssessmentQuestion
              question={currentQuestion as ScenarioQuestion}
              selectedAnswer={currentAnswer?.answer_id}
              onSelect={answerQuestion}
              direction={getDirection()}
            />
          ) : (
            <MPAssessmentSlider
              question={currentQuestion as SliderQuestion}
              value={currentAnswer?.value}
              onChange={answerSlider}
              direction={getDirection()}
            />
          )}
        </div>

        {/* Navigation Footer */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={goToPreviousQuestion}
              disabled={currentStep === 1}
              className="text-white/60 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            {isSlider && (
              <Button
                onClick={goToNextQuestion}
                disabled={!currentAnswer}
                style={{
                  background: currentAnswer
                    ? `linear-gradient(135deg, ${MENTAL_PILLAR_COLORS.primary} 0%, ${MENTAL_PILLAR_COLORS.primaryLight} 100%)`
                    : undefined,
                }}
              >
                {currentStep === totalSteps ? 'Finish' : 'Next'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Analyzing / Results phase
  if (uiPhase === 'analyzing' || uiPhase === 'results') {
    return (
      <div
        className="min-h-screen"
        style={{
          background: `linear-gradient(135deg, ${MENTAL_PILLAR_COLORS.background.start} 0%, ${MENTAL_PILLAR_COLORS.background.end} 100%)`,
        }}
      >
        {scores && phase && (
          <MPAssessmentResults
            phase={phase}
            scores={scores}
            growthDeltas={growthDeltas || undefined}
            mioFeedback={mioFeedback || undefined}
            isLoadingFeedback={isLoadingFeedback}
            onContinue={continueToVault}
            onRetry={retryFeedback}
          />
        )}
      </div>
    );
  }

  // Fallback
  return null;
}
