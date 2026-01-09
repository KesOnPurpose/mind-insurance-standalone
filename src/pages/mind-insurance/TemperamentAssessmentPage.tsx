/**
 * Internal Wiring Assessment Page (formerly Temperament Assessment)
 * Mind Insurance - Week 2 Feature
 *
 * Standalone assessment that determines user's primary internal wiring type:
 * - Warrior (action-oriented)
 * - Sage (reflection-oriented)
 * - Connector (relationship-oriented)
 * - Builder (systems-oriented)
 *
 * Results are saved to avatar_assessments and user_profiles.
 * This unlocks Layer 3 of the Avatar System.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Service
import {
  TEMPERAMENT_QUESTIONS,
  TEMPERAMENT_INFO,
  calculateTemperamentScores,
  calculateTemperamentResult,
  saveTemperamentAssessment,
  type TemperamentType,
  type TemperamentResult,
} from '@/services/temperamentAssessmentService';

// ============================================================================
// TYPES
// ============================================================================

type AssessmentStage = 'intro' | 'questions' | 'calculating' | 'results';

// ============================================================================
// COMPONENT
// ============================================================================

export default function TemperamentAssessmentPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  // State
  const [stage, setStage] = useState<AssessmentStage>('intro');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, TemperamentType>>({});
  const [result, setResult] = useState<TemperamentResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derived
  const totalQuestions = TEMPERAMENT_QUESTIONS.length;
  const progress = ((currentQuestion + 1) / totalQuestions) * 100;
  const currentQ = TEMPERAMENT_QUESTIONS[currentQuestion];
  const hasCurrentAnswer = currentQ && answers[currentQ.id];
  const isLastQuestion = currentQuestion === totalQuestions - 1;

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleStartAssessment = useCallback(() => {
    setStage('questions');
  }, []);

  const handleSelectAnswer = useCallback((value: TemperamentType) => {
    if (!currentQ) return;
    setAnswers((prev) => ({ ...prev, [currentQ.id]: value }));
  }, [currentQ]);

  const handleNext = useCallback(async () => {
    if (!hasCurrentAnswer) return;

    if (isLastQuestion) {
      // Calculate and save results
      setStage('calculating');
      setIsSubmitting(true);

      try {
        const scores = calculateTemperamentScores(answers);
        const temperamentResult = calculateTemperamentResult(scores);
        setResult(temperamentResult);

        // Save to database
        if (user?.id) {
          const saveResult = await saveTemperamentAssessment(user.id, temperamentResult);
          if (!saveResult.success) {
            console.error('[TemperamentAssessment] Save failed:', saveResult.error);
            toast({
              title: 'Save Failed',
              description: 'Unable to save your results. Please try again.',
              variant: 'destructive',
            });
            // Return to questions - don't show results if save failed
            setIsSubmitting(false);
            setStage('questions');
            return;
          }
        }

        // Show results after brief calculation animation (only if save succeeded)
        setTimeout(() => {
          setStage('results');
          setIsSubmitting(false);
        }, 2000);
      } catch (error) {
        console.error('[TemperamentAssessment] Error:', error);
        toast({
          title: 'Error',
          description: 'Something went wrong. Please try again.',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        setStage('questions');
      }
    } else {
      setCurrentQuestion((prev) => prev + 1);
    }
  }, [hasCurrentAnswer, isLastQuestion, answers, user?.id, toast]);

  const handlePrevious = useCallback(() => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  }, [currentQuestion]);

  const handleComplete = useCallback(() => {
    // Navigate to Coverage Center or MIO Insights
    navigate('/mind-insurance/coverage');
  }, [navigate]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (stage !== 'questions') return;

      if (e.key === 'ArrowRight' && hasCurrentAnswer) {
        handleNext();
      } else if (e.key === 'ArrowLeft' && currentQuestion > 0) {
        handlePrevious();
      } else if (e.key >= '1' && e.key <= '4' && currentQ) {
        const index = parseInt(e.key) - 1;
        if (currentQ.options[index]) {
          handleSelectAnswer(currentQ.options[index].value);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stage, hasCurrentAnswer, currentQuestion, currentQ, handleNext, handlePrevious, handleSelectAnswer]);

  // ============================================================================
  // RENDER: AUTH CHECK
  // ============================================================================

  if (authLoading) {
    return (
      <div className="min-h-screen bg-mi-navy flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-mi-cyan" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-mi-navy flex flex-col items-center justify-center p-4">
        <p className="text-gray-400">Please sign in to continue.</p>
        <Button onClick={() => navigate('/auth')} className="mt-4">
          Sign In
        </Button>
      </div>
    );
  }

  // ============================================================================
  // RENDER: INTRO
  // ============================================================================

  if (stage === 'intro') {
    return (
      <div className="min-h-screen bg-mi-navy">
        <div className="container max-w-2xl mx-auto px-4 py-8">
          {/* Header */}
          <Button
            variant="ghost"
            onClick={() => navigate('/mind-insurance/coverage')}
            className="mb-6 -ml-2 text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Coverage
          </Button>

          {/* Intro Card */}
          <Card className="p-8 bg-mi-navy/50 border-mi-cyan/30">
            <div className="text-center space-y-6">
              <div className="text-6xl mb-4">🧠</div>
              <h1 className="text-3xl font-bold text-white">
                Discover Your Internal Wiring
              </h1>
              <p className="text-gray-300 text-lg max-w-md mx-auto">
                Your internal wiring determines HOW you should practice Mind Insurance.
                This 8-question assessment will reveal your natural wiring type.
              </p>

              {/* Temperament Grid Preview */}
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mt-8">
                {Object.entries(TEMPERAMENT_INFO).map(([key, info]) => (
                  <div
                    key={key}
                    className="p-4 rounded-lg bg-mi-navy/30 border border-gray-700"
                  >
                    <div className="text-2xl mb-2">{info.icon}</div>
                    <div className="text-sm font-semibold text-white">{info.title}</div>
                    <div className="text-xs text-gray-400">{info.coreDriver}</div>
                  </div>
                ))}
              </div>

              <div className="pt-6">
                <Button
                  size="lg"
                  onClick={handleStartAssessment}
                  className="bg-gradient-to-r from-mi-cyan to-mi-gold text-mi-navy font-semibold px-8"
                >
                  Start Assessment
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <p className="text-xs text-gray-500 mt-3">
                  Takes about 3 minutes
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER: CALCULATING
  // ============================================================================

  if (stage === 'calculating') {
    return (
      <div className="min-h-screen bg-mi-navy flex items-center justify-center">
        <div className="text-center space-y-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="mx-auto"
          >
            <div className="text-6xl">🧠</div>
          </motion.div>
          <h2 className="text-2xl font-bold text-white">
            Analyzing Your Internal Wiring...
          </h2>
          <p className="text-gray-400">
            Mapping your natural processing style
          </p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER: RESULTS
  // ============================================================================

  if (stage === 'results' && result) {
    const primaryInfo = TEMPERAMENT_INFO[result.primary];
    const secondaryInfo = result.secondary ? TEMPERAMENT_INFO[result.secondary] : null;

    return (
      <div className="min-h-screen bg-mi-navy">
        <div className="container max-w-2xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="text-6xl mb-4"
            >
              {primaryInfo.icon}
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-bold text-white mb-2"
            >
              You are {primaryInfo.title}
            </motion.h1>
            {secondaryInfo && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-mi-cyan"
              >
                with {secondaryInfo.name} tendencies
              </motion.p>
            )}
          </div>

          {/* Scores Bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mb-8"
          >
            <Card className="p-6 bg-mi-navy/50 border-mi-cyan/30">
              <h3 className="text-sm font-semibold text-gray-400 mb-4">Your Internal Wiring Profile</h3>
              <div className="space-y-3">
                {Object.entries(result.scores)
                  .sort((a, b) => b[1] - a[1])
                  .map(([temp, score]) => {
                    const info = TEMPERAMENT_INFO[temp as TemperamentType];
                    const percentage = (score / totalQuestions) * 100;
                    return (
                      <div key={temp} className="flex items-center gap-3">
                        <span className="text-xl">{info.icon}</span>
                        <span className="w-24 text-sm text-gray-300">{info.name}</span>
                        <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ delay: 0.6, duration: 0.5 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: info.color }}
                          />
                        </div>
                        <span className="text-sm text-gray-400 w-8">{score}/8</span>
                      </div>
                    );
                  })}
              </div>
            </Card>
          </motion.div>

          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card className="p-6 bg-mi-navy/50 border-mi-cyan/30 mb-6">
              <p className="text-gray-300 leading-relaxed">
                {result.description}
              </p>
            </Card>
          </motion.div>

          {/* Primary Temperament Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <Card className="p-6 bg-mi-navy/50 border-mi-cyan/30 mb-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">{primaryInfo.icon}</span>
                {primaryInfo.title} Profile
              </h3>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-mi-cyan mb-1">Your Strength</h4>
                  <p className="text-sm text-gray-300">{primaryInfo.strength}</p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-mi-gold mb-1">Your Vulnerability</h4>
                  <p className="text-sm text-gray-300">{primaryInfo.vulnerability}</p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-green-400 mb-1">Your Mind Insurance Needs</h4>
                  <p className="text-sm text-gray-300">{primaryInfo.mindInsuranceNeeds}</p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="text-center"
          >
            <Button
              size="lg"
              onClick={handleComplete}
              className="bg-gradient-to-r from-mi-cyan to-mi-gold text-mi-navy font-semibold px-8"
            >
              Continue to Coverage Center
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <p className="text-xs text-gray-500 mt-3">
              Your internal wiring unlocks personalized protocol recommendations
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER: QUESTIONS
  // ============================================================================

  return (
    <div className="min-h-screen bg-mi-navy">
      <div className="container max-w-2xl mx-auto px-4 py-8">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <span className="text-sm text-gray-400">
              Question {currentQuestion + 1} of {totalQuestions}
            </span>
          </div>
          <Progress value={progress} className="h-2 bg-gray-700" />
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ?.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-6 bg-mi-navy/50 border-mi-cyan/30 mb-6">
              <h2 className="text-xl font-semibold text-white mb-6">
                {currentQ?.question}
              </h2>

              <div className="space-y-3">
                {currentQ?.options.map((option, index) => {
                  const isSelected = answers[currentQ.id] === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleSelectAnswer(option.value)}
                      className={cn(
                        'w-full p-4 rounded-lg border text-left transition-all',
                        isSelected
                          ? 'border-mi-cyan bg-mi-cyan/10'
                          : 'border-gray-700 hover:border-gray-500 bg-mi-navy/30'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-sm text-gray-500 font-mono">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <div className={cn(
                            'font-medium',
                            isSelected ? 'text-mi-cyan' : 'text-white'
                          )}>
                            {option.label}
                          </div>
                          {option.description && (
                            <div className="text-sm text-gray-400 mt-1">
                              {option.description}
                            </div>
                          )}
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="h-5 w-5 text-mi-cyan flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-end">
          <Button
            onClick={handleNext}
            disabled={!hasCurrentAnswer || isSubmitting}
            className={cn(
              'px-8',
              hasCurrentAnswer
                ? 'bg-gradient-to-r from-mi-cyan to-mi-gold text-mi-navy'
                : 'bg-gray-700 text-gray-400'
            )}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isLastQuestion ? (
              'See Results'
            ) : (
              <>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>

        {/* Keyboard Hint */}
        <p className="text-center text-xs text-gray-500 mt-6">
          Press 1-4 to select, Arrow keys to navigate
        </p>
      </div>
    </div>
  );
}
