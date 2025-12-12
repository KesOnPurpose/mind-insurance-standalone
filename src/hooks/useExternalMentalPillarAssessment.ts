// External Mental Pillar Assessment Hook
// Manages guest assessment state, navigation, email collection, and submission

import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  AssessmentQuestion,
  QuestionResponse,
  PillarScores,
  MIOFeedback,
  MENTAL_PILLAR_QUESTIONS,
  calculatePillarScores,
} from '@/types/mental-pillar-assessment';
import {
  ExternalAssessmentUIPhase,
  GuestSession,
} from '@/types/external-assessment';
import {
  getOrCreateGuestSession,
  updateGuestSession,
  clearGuestSession,
  saveAssessmentProgress,
  loadAssessmentProgress,
  clearAssessmentProgress,
  saveExternalAssessment,
  triggerExternalMIOFeedback,
  pollForMIOFeedback,
  validateEmail,
  validateName,
} from '@/services/externalAssessmentService';

interface UseExternalMentalPillarAssessmentReturn {
  // State
  currentStep: number;
  totalSteps: number;
  uiPhase: ExternalAssessmentUIPhase;
  currentQuestion: AssessmentQuestion | null;
  answers: Map<string, QuestionResponse>;
  scores: PillarScores | null;
  mioFeedback: MIOFeedback | null;
  isLoadingFeedback: boolean;
  error: string | null;
  guestEmail: string | null;
  guestName: string | null;
  isSubmitting: boolean;
  userWasMatched: boolean;
  emailError: string | null;
  nameError: string | null;

  // Actions
  startAssessment: () => void;
  answerQuestion: (answerId: string, score: number) => void;
  answerSlider: (value: number, score: number) => void;
  goToNextQuestion: () => void;
  goToPreviousQuestion: () => void;
  submitEmail: (email: string, name: string) => Promise<void>;
  retryFeedback: () => void;
  resetAssessment: () => void;
}

export function useExternalMentalPillarAssessment(): UseExternalMentalPillarAssessmentReturn {
  // State
  const [uiPhase, setUiPhase] = useState<ExternalAssessmentUIPhase>('intro');
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Map<string, QuestionResponse>>(new Map());
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [scores, setScores] = useState<PillarScores | null>(null);
  const [mioFeedback, setMioFeedback] = useState<MIOFeedback | null>(null);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guestSession, setGuestSession] = useState<GuestSession | null>(null);
  const [guestEmail, setGuestEmail] = useState<string | null>(null);
  const [guestName, setGuestName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userWasMatched, setUserWasMatched] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  const totalSteps = MENTAL_PILLAR_QUESTIONS.length;

  // Current question
  const currentQuestion = useMemo(() => {
    if (currentStep < 1 || currentStep > totalSteps) return null;
    return MENTAL_PILLAR_QUESTIONS[currentStep - 1];
  }, [currentStep, totalSteps]);

  // Initialize on mount
  useEffect(() => {
    const initialize = () => {
      // Get or create guest session
      const session = getOrCreateGuestSession();
      setGuestSession(session);

      // Try to restore progress
      const savedProgress = loadAssessmentProgress();
      if (savedProgress && savedProgress.answers) {
        try {
          const restoredAnswers = new Map<string, QuestionResponse>();
          Object.entries(savedProgress.answers).forEach(([key, value]) => {
            restoredAnswers.set(key, value as QuestionResponse);
          });

          if (restoredAnswers.size > 0) {
            setAnswers(restoredAnswers);
            setStartedAt(new Date(savedProgress.startedAt));
            // Resume from where they left off
            setCurrentStep(savedProgress.currentStep);
            setUiPhase('questions');
            return;
          }
        } catch {
          // Invalid saved state, start fresh
        }
      }

      setUiPhase('intro');
    };

    initialize();
  }, []);

  // Save progress to localStorage whenever answers change
  useEffect(() => {
    if (answers.size > 0 && startedAt && currentStep > 0) {
      const answersObj: Record<string, QuestionResponse> = {};
      answers.forEach((value, key) => {
        answersObj[key] = value;
      });

      saveAssessmentProgress({
        currentStep,
        answers: answersObj,
        startedAt: startedAt.toISOString(),
      });
    }
  }, [answers, startedAt, currentStep]);

  // Start the assessment
  const startAssessment = useCallback(() => {
    setStartedAt(new Date());
    setCurrentStep(1);
    setUiPhase('questions');
    setError(null);
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
        if (currentStep < totalSteps) {
          setCurrentStep((prev) => prev + 1);
        } else {
          // All questions answered, go to email collection
          setUiPhase('email_collection');
        }
      }, 400);
    },
    [currentQuestion, currentStep, totalSteps]
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
      // All questions answered, go to email collection
      setUiPhase('email_collection');
    }
  }, [currentStep, totalSteps]);

  // Navigate to previous question
  const goToPreviousQuestion = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  // Submit email and save assessment
  const submitEmail = useCallback(
    async (email: string, name: string) => {
      // Clear previous errors
      setEmailError(null);
      setNameError(null);

      // Validate
      if (!validateName(name)) {
        setNameError('Please enter your name (at least 2 characters)');
        return;
      }

      if (!validateEmail(email)) {
        setEmailError('Please enter a valid email address');
        return;
      }

      if (!guestSession || !startedAt) {
        setError('Session error. Please refresh and try again.');
        return;
      }

      setIsSubmitting(true);
      setUiPhase('analyzing');

      try {
        // Update guest session with email/name
        updateGuestSession(email, name);
        setGuestEmail(email);
        setGuestName(name);

        // Calculate scores
        const responses = Array.from(answers.values());
        const calculatedScores = calculatePillarScores(responses);
        setScores(calculatedScores);

        // Save to database
        const result = await saveExternalAssessment({
          guest_session_id: guestSession.session_id,
          guest_email: email,
          guest_name: name,
          pillar_scores: calculatedScores,
          responses,
          started_at: startedAt,
        });

        setAssessmentId(result.assessment_id);
        setUserWasMatched(result.user_matched);

        // Clear localStorage progress (keep session for potential retake)
        clearAssessmentProgress();

        // Show results
        setUiPhase('results');
        setIsSubmitting(false);

        // Trigger MIO feedback generation
        setIsLoadingFeedback(true);
        const feedbackTriggered = await triggerExternalMIOFeedback(
          result.assessment_id,
          email,
          name,
          calculatedScores,
          result.user_id || undefined
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
        setIsSubmitting(false);
      }
    },
    [guestSession, startedAt, answers]
  );

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

  // Reset assessment (start over)
  const resetAssessment = useCallback(() => {
    clearGuestSession();
    clearAssessmentProgress();
    setUiPhase('intro');
    setCurrentStep(0);
    setAnswers(new Map());
    setStartedAt(null);
    setScores(null);
    setMioFeedback(null);
    setAssessmentId(null);
    setError(null);
    setGuestEmail(null);
    setGuestName(null);
    setUserWasMatched(false);
    setEmailError(null);
    setNameError(null);

    // Create new session
    const session = getOrCreateGuestSession();
    setGuestSession(session);
  }, []);

  return {
    currentStep,
    totalSteps,
    uiPhase,
    currentQuestion,
    answers,
    scores,
    mioFeedback,
    isLoadingFeedback,
    error,
    guestEmail,
    guestName,
    isSubmitting,
    userWasMatched,
    emailError,
    nameError,
    startAssessment,
    answerQuestion,
    answerSlider,
    goToNextQuestion,
    goToPreviousQuestion,
    submitEmail,
    retryFeedback,
    resetAssessment,
  };
}
