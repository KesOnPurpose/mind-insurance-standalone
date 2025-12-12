/**
 * Identity Collision Assessment Page - $100M Premium UX Redesign
 *
 * Features:
 * - One question per page with cinematic transitions
 * - Journey progress visualization
 * - Phase-specific theming (Foundation, Pattern, Impact)
 * - Premium slider for impact intensity
 * - Cinematic results reveal with pattern breakdown
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  AssessmentJourneyProgress,
  AssessmentQuestionCard,
  AssessmentSliderQuestion,
  AssessmentResultsReveal,
  AssessmentIntroScreens,
} from '@/components/mind-insurance/assessment';
import {
  calculateCollisionResult,
  saveAssessmentResult,
  type AssessmentAnswer,
  type AssessmentResult,
  type CollisionPattern,
} from '@/services/identityCollisionService';

// ============================================================================
// QUESTION DEFINITIONS
// ============================================================================

interface QuestionOption {
  id: string;
  text: string;
  score: number;
  patternIndicators?: Partial<Record<CollisionPattern, number>>;
}

interface Question {
  id: string;
  title: string;
  subtitle?: string;
  type: 'single' | 'slider';
  options?: QuestionOption[];
  sliderConfig?: {
    min: number;
    max: number;
    minLabel: string;
    maxLabel: string;
  };
}

const QUESTIONS: Question[] = [
  {
    id: 'q1',
    title: 'How would you describe the gap between your effort and your results?',
    subtitle: 'Think about the last 6-12 months',
    type: 'single',
    options: [
      { id: 'a', text: "Major gap — I work incredibly hard but results don't match", score: 10 },
      { id: 'b', text: "Significant gap — There's a clear disconnect", score: 7 },
      { id: 'c', text: 'Moderate gap — Some inconsistency', score: 4 },
      { id: 'd', text: 'Minimal gap — Effort and results align well', score: 1 },
    ],
  },
  {
    id: 'q2',
    title: 'Which statement best describes your relationship with taking action?',
    subtitle: 'Select the one that resonates most',
    type: 'single',
    options: [
      {
        id: 'a',
        text: 'I often get stuck in analysis paralysis and overthinking',
        score: 10,
        patternIndicators: { past_prison: 8 },
      },
      {
        id: 'b',
        text: 'I take action in inconsistent bursts, then fade',
        score: 7,
        patternIndicators: { compass_crisis: 5 },
      },
      {
        id: 'c',
        text: 'I start strong but sabotage myself near success',
        score: 8,
        patternIndicators: { success_sabotage: 10 },
      },
      {
        id: 'd',
        text: "I'm generally consistent with execution",
        score: 2,
      },
    ],
  },
  {
    id: 'q3',
    title: 'How often do you think "I should be further along by now"?',
    subtitle: 'Be honest with yourself',
    type: 'single',
    options: [
      { id: 'a', text: "Daily — It's a constant thought", score: 10, patternIndicators: { compass_crisis: 5, past_prison: 3 } },
      { id: 'b', text: 'Weekly — Comes up regularly', score: 7, patternIndicators: { compass_crisis: 3, past_prison: 2 } },
      { id: 'c', text: 'Monthly — Occasional thought', score: 4, patternIndicators: { compass_crisis: 1 } },
      { id: 'd', text: "Rarely — I'm at peace with my progress", score: 1 },
    ],
  },
  {
    id: 'q4',
    title: 'Which internal conflict resonates MOST with your experience?',
    subtitle: 'This is the key pattern detector — choose carefully',
    type: 'single',
    options: [
      {
        id: 'a',
        text: "I feel held back by my past, upbringing, or background. There's guilt or limiting beliefs from where I came from.",
        score: 10,
        patternIndicators: { past_prison: 15 },
      },
      {
        id: 'b',
        text: 'I lack clear direction or feel pulled in multiple directions. I struggle with decision paralysis and comparison.',
        score: 10,
        patternIndicators: { compass_crisis: 15 },
      },
      {
        id: 'c',
        text: 'I pull back right when breakthrough is near. I unconsciously sabotage progress at critical moments.',
        score: 10,
        patternIndicators: { success_sabotage: 15 },
      },
      {
        id: 'd',
        text: "I feel generally aligned and don't strongly identify with any of these patterns.",
        score: 2,
      },
    ],
  },
  {
    id: 'q5',
    title: 'What happens when you try to implement new strategies or habits?',
    subtitle: 'Think about your typical pattern',
    type: 'single',
    options: [
      {
        id: 'a',
        text: 'Initial excitement fades fast, and I return to old patterns',
        score: 8,
        patternIndicators: { past_prison: 5, compass_crisis: 3 },
      },
      {
        id: 'b',
        text: "Stop-start cycle — I can't maintain consistency",
        score: 6,
        patternIndicators: { compass_crisis: 5 },
      },
      {
        id: 'c',
        text: 'I execute well but unconsciously sabotage the results',
        score: 9,
        patternIndicators: { success_sabotage: 8 },
      },
      {
        id: 'd',
        text: 'Generally consistent with implementation',
        score: 2,
      },
    ],
  },
  {
    id: 'q6',
    title: 'How do you feel about your decision-making?',
    type: 'single',
    options: [
      {
        id: 'a',
        text: 'I second-guess myself constantly after decisions',
        score: 8,
        patternIndicators: { past_prison: 5, compass_crisis: 3 },
      },
      {
        id: 'b',
        text: "I often feel like an impostor who doesn't deserve success",
        score: 7,
        patternIndicators: { past_prison: 5, success_sabotage: 3 },
      },
      {
        id: 'c',
        text: "It depends heavily on context and who's around",
        score: 5,
        patternIndicators: { compass_crisis: 3 },
      },
      {
        id: 'd',
        text: "I'm generally confident in my decisions",
        score: 2,
      },
    ],
  },
  {
    id: 'q7',
    title: 'What area of life is this pattern most affecting?',
    subtitle: 'Where do you feel the impact most strongly?',
    type: 'single',
    options: [
      { id: 'career', text: 'Career / Business', score: 0 },
      { id: 'relationships', text: 'Relationships', score: 0 },
      { id: 'health', text: 'Health / Wellness', score: 0 },
      { id: 'growth', text: 'Personal Growth', score: 0 },
      { id: 'financial', text: 'Financial', score: 0 },
    ],
  },
  {
    id: 'q8',
    title: 'How much are these internal conflicts impacting your life?',
    subtitle: 'Consider the barriers you identified earlier',
    type: 'slider',
    sliderConfig: {
      min: 1,
      max: 10,
      minLabel: 'Minor frustration',
      maxLabel: 'Critical — needs urgent attention',
    },
  },
];

// ============================================================================
// LOCALSTORAGE HELPERS
// ============================================================================

const STORAGE_KEY = 'identity_collision_assessment_progress';
const STEP_KEY = 'identity_collision_assessment_step';
const INTRO_COMPLETED_KEY = 'identity_collision_intro_completed';

function saveProgress(answers: Record<string, string>, step: number) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
    localStorage.setItem(STEP_KEY, step.toString());
  } catch (e) {
    console.warn('Could not save progress to localStorage:', e);
  }
}

function loadProgress(): { answers: Record<string, string>; step: number } {
  try {
    const savedAnswers = localStorage.getItem(STORAGE_KEY);
    const savedStep = localStorage.getItem(STEP_KEY);
    return {
      answers: savedAnswers ? JSON.parse(savedAnswers) : {},
      step: savedStep ? parseInt(savedStep, 10) : 0,
    };
  } catch (e) {
    return { answers: {}, step: 0 };
  }
}

function clearProgress() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STEP_KEY);
  } catch (e) {
    console.warn('Could not clear localStorage:', e);
  }
}

function hasCompletedIntro(): boolean {
  try {
    return localStorage.getItem(INTRO_COMPLETED_KEY) === 'true';
  } catch (e) {
    return false;
  }
}

function setIntroCompleted() {
  try {
    localStorage.setItem(INTRO_COMPLETED_KEY, 'true');
  } catch (e) {
    console.warn('Could not save intro completion to localStorage:', e);
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const IdentityCollisionAssessmentPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // State
  const [showIntro, setShowIntro] = useState(() => !hasCompletedIntro());
  const [introStep, setIntroStep] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [showResults, setShowResults] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Load saved progress on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('reset') === 'true') {
      clearProgress();
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }

    const saved = loadProgress();
    if (Object.keys(saved.answers).length > 0) {
      setAnswers(saved.answers);
      setCurrentStep(saved.step);
    }
  }, []);

  // Save progress on change
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      saveProgress(answers, currentStep);
    }
  }, [answers, currentStep]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (assessmentResult: AssessmentResult) => {
      if (!user?.id) throw new Error('User not authenticated');
      return saveAssessmentResult({ userId: user.id, result: assessmentResult });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['identityCollisionStatus'] });
      clearProgress();
    },
  });

  // Current question
  const currentQuestion = QUESTIONS[currentStep];
  const isLastQuestion = currentStep === QUESTIONS.length - 1;
  const hasCurrentAnswer = Boolean(answers[currentQuestion?.id]);

  // Navigation handlers
  const goToNextStep = useCallback(() => {
    if (currentStep < QUESTIONS.length - 1) {
      setDirection('forward');
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep]);

  const goToPreviousStep = useCallback(() => {
    if (currentStep > 0) {
      setDirection('backward');
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  // Handle answer
  const handleAnswer = useCallback(
    (value: string) => {
      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));

      // Auto-advance after short delay (except for slider)
      if (currentQuestion.type !== 'slider' && currentStep < QUESTIONS.length - 1) {
        setTimeout(() => {
          goToNextStep();
        }, 400);
      }
    },
    [currentQuestion, currentStep, goToNextStep]
  );

  // Handle slider change (no auto-advance)
  const handleSliderChange = useCallback(
    (value: number) => {
      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value.toString() }));
    },
    [currentQuestion]
  );

  // Handle submit
  const handleSubmit = async () => {
    setSaveError(null);

    const formattedAnswers: AssessmentAnswer[] = QUESTIONS.map((question) => {
      const answerValue = answers[question.id];

      if (question.type === 'slider') {
        return {
          questionId: question.id,
          answer: answerValue,
          score: parseInt(answerValue, 10) || 5,
        };
      }

      const selectedOption = question.options?.find((opt) => opt.id === answerValue);
      return {
        questionId: question.id,
        answer: answerValue,
        score: selectedOption?.score || 0,
        patternIndicators: selectedOption?.patternIndicators,
      };
    });

    const assessmentResult = calculateCollisionResult(formattedAnswers);

    try {
      const response = await saveMutation.mutateAsync(assessmentResult);

      if (!response.success) {
        throw new Error(response.error || 'Failed to save assessment');
      }

      setResult(assessmentResult);
      setShowResults(true);
    } catch (error) {
      console.error('[Assessment] Save failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setSaveError(errorMessage);
      toast({
        title: 'Unable to save assessment',
        description: 'Please try again. If the problem persists, contact support.',
        variant: 'destructive',
      });
    }
  };

  // Handle continue after results
  const handleContinue = () => {
    const from = location.state?.from?.pathname || '/mind-insurance';
    navigate(from, { replace: true });
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showResults) return;

      if (e.key === 'ArrowRight' && hasCurrentAnswer && !isLastQuestion) {
        goToNextStep();
      } else if (e.key === 'ArrowLeft' && currentStep > 0) {
        goToPreviousStep();
      } else if (e.key === 'Enter' && isLastQuestion && hasCurrentAnswer) {
        handleSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, hasCurrentAnswer, isLastQuestion, showResults, goToNextStep, goToPreviousStep]);

  // Intro screen handlers (7 screens: 0-6)
  const handleIntroNext = useCallback(() => {
    if (introStep < 6) {
      setIntroStep((prev) => prev + 1);
    } else {
      setIntroCompleted();
      setShowIntro(false);
    }
  }, [introStep]);

  const handleIntroSkip = useCallback(() => {
    setIntroCompleted();
    setShowIntro(false);
  }, []);

  // Show intro screens for first-time users
  if (showIntro) {
    return (
      <AssessmentIntroScreens
        currentStep={introStep}
        onNext={handleIntroNext}
        onSkip={handleIntroSkip}
      />
    );
  }

  // Show results
  if (showResults && result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mi-navy via-mi-navy-light to-[#0d1a2d] p-4">
        <div className="container mx-auto max-w-lg pt-8">
          <AssessmentResultsReveal
            result={result}
            onContinue={handleContinue}
            isLoading={saveMutation.isPending}
          />
        </div>
      </div>
    );
  }

  // Render assessment
  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-mi-navy via-mi-navy-light to-[#0d1a2d] flex flex-col overflow-hidden">
      {/* Journey Progress Header */}
      <div className="flex-shrink-0 bg-mi-navy/90 backdrop-blur-lg border-b border-white/10">
        <AssessmentJourneyProgress currentStep={currentStep} totalSteps={QUESTIONS.length} />
      </div>

      {/* Question Content */}
      <div className="flex-1 flex flex-col justify-center px-3 sm:px-4 py-4 overflow-y-auto">
        <div className="w-full max-w-md sm:max-w-lg mx-auto">
          <AnimatePresence mode="wait" custom={direction}>
            {currentQuestion.type === 'slider' ? (
              <AssessmentSliderQuestion
                key={currentQuestion.id}
                questionIndex={currentStep}
                totalQuestions={QUESTIONS.length}
                title={currentQuestion.title}
                subtitle={currentQuestion.subtitle}
                sliderConfig={currentQuestion.sliderConfig!}
                value={parseInt(answers[currentQuestion.id] || '5', 10)}
                onValueChange={handleSliderChange}
                direction={direction}
              />
            ) : (
              <AssessmentQuestionCard
                key={currentQuestion.id}
                question={currentQuestion}
                questionIndex={currentStep}
                totalQuestions={QUESTIONS.length}
                selectedAnswer={answers[currentQuestion.id] || null}
                onAnswer={handleAnswer}
                direction={direction}
              />
            )}
          </AnimatePresence>

          {/* Error Message */}
          {saveError && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-400 font-medium mb-1">Unable to save your assessment</p>
                  <p className="text-red-400/70 text-sm mb-3">
                    There was an issue saving your results. Please try again.
                  </p>
                  <Button
                    onClick={handleSubmit}
                    disabled={saveMutation.isPending}
                    size="sm"
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    {saveMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Retrying...
                      </>
                    ) : (
                      'Try Again'
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex-shrink-0 bg-mi-navy/90 backdrop-blur-lg border-t border-white/10 p-3 sm:p-4">
        <div className="max-w-md sm:max-w-lg mx-auto flex items-center justify-between gap-3">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={goToPreviousStep}
            disabled={currentStep === 0}
            className="text-gray-400 hover:text-white disabled:opacity-30"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back
          </Button>

          {/* Next / Submit Button */}
          {isLastQuestion ? (
            <Button
              onClick={handleSubmit}
              disabled={!hasCurrentAnswer || saveMutation.isPending}
              className="flex-1 max-w-xs h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-mi-gold to-mi-gold/80 hover:from-mi-gold/90 hover:to-mi-gold/70 text-black disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Reveal My Pattern'
              )}
            </Button>
          ) : (
            <Button
              onClick={goToNextStep}
              disabled={!hasCurrentAnswer}
              className="text-gray-400 hover:text-white disabled:opacity-30"
            >
              Next
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default IdentityCollisionAssessmentPage;
