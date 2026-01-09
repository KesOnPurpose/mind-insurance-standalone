// Mental Pillar Assessment Hook
// Manages assessment state, navigation, and submission

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  AssessmentQuestion,
  QuestionResponse,
  AssessmentPhase,
  AssessmentSource,
  PillarScores,
  GrowthDeltas,
  MIOFeedback,
  MENTAL_PILLAR_QUESTIONS,
  calculatePillarScores,
  ScenarioQuestion,
  SliderQuestion,
} from '@/types/mental-pillar-assessment';
import {
  saveAssessment,
  triggerMIOFeedback,
  pollForMIOFeedback,
  canUserTakeAssessment,
  determineAssessmentPhase,
  getBaselineAssessment,
  getPendingInvitation,
  getAssessmentStatus,
} from '@/services/mentalPillarAssessmentService';

interface UseMentalPillarAssessmentReturn {
  // State
  phase: AssessmentPhase | null;
  currentStep: number;
  totalSteps: number;
  uiPhase: 'loading' | 'intro' | 'questions' | 'analyzing' | 'results' | 'error';
  currentQuestion: AssessmentQuestion | null;
  answers: Map<string, QuestionResponse>;
  scores: PillarScores | null;
  growthDeltas: GrowthDeltas | null;
  mioFeedback: MIOFeedback | null;
  isLoadingFeedback: boolean;
  error: string | null;
  canTake: boolean;
  attemptsRemaining: number | null;

  // Actions
  startAssessment: () => void;
  answerQuestion: (answerId: string, score: number) => void;
  answerSlider: (value: number, score: number) => void;
  goToNextQuestion: () => void;
  goToPreviousQuestion: () => void;
  submitAssessment: () => Promise<void>;
  retryFeedback: () => void;
  continueToVault: () => void;
}

const LOCAL_STORAGE_KEY = 'mental_pillar_assessment_progress';

export function useMentalPillarAssessment(): UseMentalPillarAssessmentReturn {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Determine source from URL params
  const sourceFromParams = searchParams.get('source') as AssessmentSource | null;
  const invitationId = searchParams.get('invitation_id');
  const source: AssessmentSource = sourceFromParams || 'user_initiated';

  // State
  const [phase, setPhase] = useState<AssessmentPhase | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [uiPhase, setUiPhase] = useState<
    'loading' | 'intro' | 'questions' | 'analyzing' | 'results' | 'error'
  >('loading');
  const [answers, setAnswers] = useState<Map<string, QuestionResponse>>(new Map());
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [scores, setScores] = useState<PillarScores | null>(null);
  const [growthDeltas, setGrowthDeltas] = useState<GrowthDeltas | null>(null);
  const [mioFeedback, setMioFeedback] = useState<MIOFeedback | null>(null);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [canTake, setCanTake] = useState(true);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);

  const totalSteps = MENTAL_PILLAR_QUESTIONS.length;

  // Current question
  const currentQuestion = useMemo(() => {
    if (currentStep < 1 || currentStep > totalSteps) return null;
    return MENTAL_PILLAR_QUESTIONS[currentStep - 1];
  }, [currentStep, totalSteps]);

  // Initialize on mount
  useEffect(() => {
    const initialize = async () => {
      if (!user?.id) {
        setUiPhase('error');
        setError('Please log in to take the assessment.');
        return;
      }

      try {
        // Check eligibility
        const eligibility = await canUserTakeAssessment(user.id, source);
        setCanTake(eligibility.canTake);
        setAttemptsRemaining(eligibility.attemptsRemaining ?? null);

        if (!eligibility.canTake) {
          setUiPhase('error');
          setError(eligibility.reason || 'Unable to take assessment at this time.');
          return;
        }

        // Determine phase
        const assessmentPhase = await determineAssessmentPhase(user.id);
        setPhase(assessmentPhase);

        // Try to restore progress from localStorage
        const savedProgress = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedProgress) {
          try {
            const parsed = JSON.parse(savedProgress);
            if (parsed.userId === user.id && parsed.answers) {
              setAnswers(new Map(Object.entries(parsed.answers)));
              setStartedAt(new Date(parsed.startedAt));
            }
          } catch {
            // Invalid saved state, ignore
          }
        }

        setUiPhase('intro');
      } catch (err) {
        console.error('Error initializing assessment:', err);
        setUiPhase('error');
        setError('Failed to load assessment. Please try again.');
      }
    };

    initialize();
  }, [user?.id, source]);

  // Save progress to localStorage
  useEffect(() => {
    if (user?.id && answers.size > 0 && startedAt) {
      const progress = {
        userId: user.id,
        answers: Object.fromEntries(answers),
        startedAt: startedAt.toISOString(),
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(progress));
    }
  }, [answers, startedAt, user?.id]);

  // Start the assessment
  const startAssessment = useCallback(() => {
    setStartedAt(new Date());
    setCurrentStep(1);
    setUiPhase('questions');
  }, []);

  // Answer a scenario question
  const answerQuestion = useCallback(
    (answerId: string, score: number) => {
      if (!currentQuestion || currentQuestion.type !== 'scenario') return;

      const response: QuestionResponse = {
        question_id: currentQuestion.id,
        answer_id: answerId,
        score,
        competency: currentQuestion.competency,
        answered_at: new Date().toISOString(),
      };

      setAnswers((prev) => {
        const updated = new Map(prev);
        updated.set(currentQuestion.id, response);
        return updated;
      });

      // Auto-advance after short delay
      setTimeout(() => {
        goToNextQuestion();
      }, 400);
    },
    [currentQuestion]
  );

  // Answer a slider question
  const answerSlider = useCallback(
    (value: number, score: number) => {
      if (!currentQuestion || currentQuestion.type !== 'slider') return;

      const response: QuestionResponse = {
        question_id: currentQuestion.id,
        value,
        score,
        competency: currentQuestion.competency,
        answered_at: new Date().toISOString(),
      };

      setAnswers((prev) => {
        const updated = new Map(prev);
        updated.set(currentQuestion.id, response);
        return updated;
      });
    },
    [currentQuestion]
  );

  // Navigate to next question
  const goToNextQuestion = useCallback(() => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    } else if (currentStep === totalSteps) {
      // All questions answered, proceed to submit
      setUiPhase('analyzing');
    }
  }, [currentStep, totalSteps]);

  // Navigate to previous question
  const goToPreviousQuestion = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  // Submit the assessment
  const submitAssessment = useCallback(async () => {
    if (!user?.id || !phase || !startedAt) return;

    try {
      // Calculate scores
      const responses = Array.from(answers.values());
      const calculatedScores = calculatePillarScores(responses);
      setScores(calculatedScores);

      // Get baseline for growth calculation if POST
      let baseline: PillarScores | undefined;
      if (phase === 'post') {
        const baselineAssessment = await getBaselineAssessment(user.id);
        if (baselineAssessment) {
          baseline = baselineAssessment.pillar_scores;
        }
      }

      // Calculate growth deltas
      if (baseline) {
        const deltas: GrowthDeltas = {
          pattern_awareness: calculatedScores.pattern_awareness - baseline.pattern_awareness,
          identity_alignment: calculatedScores.identity_alignment - baseline.identity_alignment,
          belief_mastery: calculatedScores.belief_mastery - baseline.belief_mastery,
          mental_resilience: calculatedScores.mental_resilience - baseline.mental_resilience,
          overall: calculatedScores.overall - baseline.overall,
        };
        setGrowthDeltas(deltas);
      }

      // Save to database
      const result = await saveAssessment({
        userId: user.id,
        phase,
        source,
        sourceContext: invitationId ? { invitation_id: invitationId } : {},
        responses,
        startedAt,
        invitationId: invitationId || undefined,
      });

      if (!result) {
        throw new Error('Failed to save assessment');
      }

      setAssessmentId(result.assessment_id);

      // Clear localStorage
      localStorage.removeItem(LOCAL_STORAGE_KEY);

      // Show results
      setUiPhase('results');

      // Trigger MIO feedback generation
      setIsLoadingFeedback(true);
      const feedbackTriggered = await triggerMIOFeedback(
        result.assessment_id,
        user.id,
        phase,
        calculatedScores,
        baseline,
        growthDeltas || undefined
      );

      if (feedbackTriggered) {
        // Poll for feedback
        const feedback = await pollForMIOFeedback(result.assessment_id);
        if (feedback) {
          setMioFeedback(feedback);
        }
      }

      setIsLoadingFeedback(false);
    } catch (err) {
      console.error('Error submitting assessment:', err);
      setError('Failed to save your assessment. Please try again.');
      setUiPhase('error');
    }
  }, [user?.id, phase, startedAt, answers, source, invitationId, growthDeltas]);

  // Retry loading MIO feedback
  const retryFeedback = useCallback(async () => {
    if (!assessmentId) return;

    setIsLoadingFeedback(true);
    const feedback = await pollForMIOFeedback(assessmentId);
    if (feedback) {
      setMioFeedback(feedback);
    }
    setIsLoadingFeedback(false);
  }, [assessmentId]);

  // Navigate to vault
  const continueToVault = useCallback(() => {
    navigate('/mind-insurance/vault?tab=assessments');
  }, [navigate]);

  // Auto-submit when all questions answered
  useEffect(() => {
    if (uiPhase === 'analyzing' && answers.size === totalSteps) {
      submitAssessment();
    }
  }, [uiPhase, answers.size, totalSteps, submitAssessment]);

  return {
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
    submitAssessment,
    retryFeedback,
    continueToVault,
  };
}

// Hook for checking assessment status (for vault display)
export function useMentalPillarAssessmentStatus() {
  const { user } = useAuth();
  const [status, setStatus] = useState<Awaited<
    ReturnType<typeof getAssessmentStatus>
  > | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const assessmentStatus = await getAssessmentStatus(user.id);
        setStatus(assessmentStatus);
      } catch (err) {
        console.error('Error fetching assessment status:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
  }, [user?.id]);

  return { status, isLoading };
}
