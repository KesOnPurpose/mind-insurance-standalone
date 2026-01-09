// External Mental Pillar Assessment Page
// Public assessment for guests at grouphome4newbies.com/mental-assessment

import { useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Brain, ArrowRight, ArrowLeft, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useExternalMentalPillarAssessment } from '@/hooks/useExternalMentalPillarAssessment';
import { MPAssessmentProgress } from '@/components/mental-pillar-assessment/MPAssessmentProgress';
import { MPAssessmentQuestion } from '@/components/mental-pillar-assessment/MPAssessmentQuestion';
import { MPAssessmentSlider } from '@/components/mental-pillar-assessment/MPAssessmentSlider';
import { EmailCollectionStep } from '@/components/external-assessment/EmailCollectionStep';
import { MENTAL_PILLAR_COLORS, ScenarioQuestion, SliderQuestion } from '@/types/mental-pillar-assessment';

export default function ExternalMentalPillarAssessmentPage() {
  const {
    currentStep,
    totalSteps,
    uiPhase,
    currentQuestion,
    answers,
    scores,
    mioFeedback,
    isLoadingFeedback,
    error,
    emailError,
    nameError,
    isSubmitting,
    userWasMatched,
    guestName,
    startAssessment,
    answerQuestion,
    answerSlider,
    goToNextQuestion,
    goToPreviousQuestion,
    submitEmail,
    retryFeedback,
    resetAssessment,
  } = useExternalMentalPillarAssessment();

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
    return 'forward';
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
          <h2 className="text-xl font-semibold text-white mb-2">Something Went Wrong</h2>
          <p className="text-white/60 mb-6">{error}</p>
          <Button onClick={resetAssessment} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
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

          {/* Brand */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="text-violet-400 text-sm font-medium tracking-wider uppercase mb-2"
          >
            Mind Insurance
          </motion.p>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-white mb-4"
          >
            Mental Pillar Assessment
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-white/60 mb-8 leading-relaxed"
          >
            This 10-question assessment measures your current skills across 4 Mental Pillar competencies.
            Discover your baseline and get personalized insights for your journey.
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
            Takes about 3-5 minutes
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

  // Email collection phase
  if (uiPhase === 'email_collection') {
    return (
      <EmailCollectionStep
        onSubmit={submitEmail}
        isSubmitting={isSubmitting}
        emailError={emailError}
        nameError={nameError}
      />
    );
  }

  // Analyzing phase
  if (uiPhase === 'analyzing') {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${MENTAL_PILLAR_COLORS.background.start} 0%, ${MENTAL_PILLAR_COLORS.background.end} 100%)`,
        }}
      >
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Brain
              className="w-16 h-16 mx-auto mb-4"
              style={{ color: MENTAL_PILLAR_COLORS.primary }}
            />
          </motion.div>
          <h2 className="text-xl font-semibold text-white mb-2">Analyzing Your Results</h2>
          <p className="text-white/60">Please wait while we process your assessment...</p>
        </div>
      </div>
    );
  }

  // Results phase
  if (uiPhase === 'results' && scores) {
    return (
      <div
        className="min-h-screen py-8 px-4"
        style={{
          background: `linear-gradient(135deg, ${MENTAL_PILLAR_COLORS.background.start} 0%, ${MENTAL_PILLAR_COLORS.background.end} 100%)`,
        }}
      >
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <p className="text-violet-400 text-sm font-medium tracking-wider uppercase mb-2">
              Mind Insurance
            </p>
            <h1 className="text-3xl font-bold text-white mb-2">
              Your Mental Pillar Results
            </h1>
            {guestName && (
              <p className="text-white/60">
                Great work, {guestName}!
              </p>
            )}
          </motion.div>

          {/* Overall Score */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl p-8 mb-6 text-center"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <p className="text-white/60 text-sm mb-2">Overall Score</p>
            <div
              className="text-6xl font-bold mb-2"
              style={{ color: MENTAL_PILLAR_COLORS.primary }}
            >
              {scores.overall}
            </div>
            <p className="text-white/40 text-sm">out of 100</p>
          </motion.div>

          {/* Pillar Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl p-6 mb-6"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <h3 className="text-white font-semibold mb-4">Your 4 Pillars</h3>
            <div className="space-y-4">
              {[
                { key: 'pattern_awareness', name: 'Pattern Awareness', icon: '🔍', color: '#8b5cf6' },
                { key: 'identity_alignment', name: 'Identity Alignment', icon: '🎯', color: '#06b6d4' },
                { key: 'belief_mastery', name: 'Belief Mastery', icon: '💡', color: '#f59e0b' },
                { key: 'mental_resilience', name: 'Mental Resilience', icon: '🛡️', color: '#10b981' },
              ].map((pillar) => {
                const score = scores[pillar.key as keyof typeof scores];
                return (
                  <div key={pillar.key}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span>{pillar.icon}</span>
                        <span className="text-white/80 text-sm">{pillar.name}</span>
                      </div>
                      <span className="text-white font-semibold">{score}</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${score}%` }}
                        transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: pillar.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* MIO Feedback */}
          {isLoadingFeedback ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl p-6 mb-6 text-center"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <Loader2
                className="w-6 h-6 animate-spin mx-auto mb-2"
                style={{ color: MENTAL_PILLAR_COLORS.primary }}
              />
              <p className="text-white/60 text-sm">Generating personalized insights...</p>
            </motion.div>
          ) : mioFeedback ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-2xl p-6 mb-6"
              style={{
                background: `linear-gradient(135deg, ${MENTAL_PILLAR_COLORS.primary}10 0%, ${MENTAL_PILLAR_COLORS.primaryLight}05 100%)`,
                border: `1px solid ${MENTAL_PILLAR_COLORS.primary}30`,
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-5 h-5" style={{ color: MENTAL_PILLAR_COLORS.primary }} />
                <h3 className="text-white font-semibold">MIO's Insights</h3>
              </div>
              <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">
                {mioFeedback.content}
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl p-6 mb-6 text-center"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <p className="text-white/40 text-sm mb-2">Insights unavailable</p>
              <Button
                variant="outline"
                size="sm"
                onClick={retryFeedback}
                className="text-white/60"
              >
                <RefreshCw className="w-3 h-3 mr-2" />
                Retry
              </Button>
            </motion.div>
          )}

          {/* User Match Notice */}
          {userWasMatched && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="rounded-xl p-4 mb-6 text-center"
              style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
              }}
            >
              <p className="text-emerald-400 text-sm">
                ✓ Your results have been saved to your Mind Insurance account!
              </p>
            </motion.div>
          )}

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center"
          >
            <div
              className="rounded-2xl p-8"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <h3 className="text-xl font-semibold text-white mb-2">
                Get Ready for Your Journey
              </h3>
              <p className="text-white/60 mb-6">
                Your 4-week Mental Pillar journey is designed to strengthen each of these areas.
                Watch for next steps from your coach!
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm bg-violet-500/20 text-violet-300">
                <Brain className="w-4 h-4" />
                Baseline Assessment Complete
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Fallback
  return null;
}
