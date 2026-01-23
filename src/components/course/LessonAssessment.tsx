/**
 * FEAT-GH-006-D: LessonAssessment Modal Component
 *
 * Quiz-style assessment modal for tactic completion gates:
 * - Displays assessment questions with radio option selection
 * - Handles submission with loading state and grading
 * - Shows detailed results with pass/fail, score, and answer feedback
 * - Integrates with useLessonAssessment hook for state management
 */

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Trophy,
  RotateCcw,
  Lightbulb,
} from 'lucide-react';
import type {
  LessonAssessment as LessonAssessmentType,
  LessonAssessmentAnswer,
  LessonAssessmentResult,
  LessonAssessmentQuestion,
} from '@/types/assessment';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

interface LessonAssessmentModalProps {
  assessment: LessonAssessmentType;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (answers: LessonAssessmentAnswer[]) => Promise<LessonAssessmentResult | null>;
  isSubmitting: boolean;
  lastResult?: LessonAssessmentResult | null;
  attemptCount: number;
  maxAttempts: number | null;
  hasPassed: boolean;
}

type ModalView = 'questions' | 'results';

// =============================================================================
// QUESTION COMPONENT
// =============================================================================

interface QuestionDisplayProps {
  question: LessonAssessmentQuestion;
  questionNumber: number;
  totalQuestions: number;
  selectedOptionId: string | null;
  onSelectOption: (optionId: string) => void;
  disabled: boolean;
}

function QuestionDisplay({
  question,
  questionNumber,
  totalQuestions,
  selectedOptionId,
  onSelectOption,
  disabled,
}: QuestionDisplayProps) {
  return (
    <div className="space-y-4">
      {/* Question Header */}
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="text-xs">
          Question {questionNumber} of {totalQuestions}
        </Badge>
        {question.points && question.points > 1 && (
          <Badge variant="outline" className="text-xs">
            {question.points} points
          </Badge>
        )}
      </div>

      {/* Question Text */}
      <h3 className="text-lg font-semibold leading-tight">{question.question}</h3>

      {/* Answer Options */}
      <RadioGroup
        value={selectedOptionId || ''}
        onValueChange={onSelectOption}
        disabled={disabled}
        className="space-y-3"
      >
        {question.options.map((option, index) => (
          <div
            key={option.id}
            className={cn(
              'flex items-start space-x-3 rounded-lg border p-4 transition-all cursor-pointer',
              selectedOptionId === option.id
                ? 'border-primary bg-primary/5'
                : 'border-muted hover:border-primary/50',
              disabled && 'opacity-60 cursor-not-allowed'
            )}
            onClick={() => !disabled && onSelectOption(option.id)}
          >
            <RadioGroupItem value={option.id} id={`q${question.id}-opt${index}`} />
            <Label
              htmlFor={`q${question.id}-opt${index}`}
              className="flex-1 cursor-pointer text-sm leading-relaxed"
            >
              {option.text}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}

// =============================================================================
// RESULTS COMPONENT
// =============================================================================

interface ResultsDisplayProps {
  result: LessonAssessmentResult;
  onRetry: () => void;
  onClose: () => void;
  canRetry: boolean;
}

function ResultsDisplay({ result, onRetry, onClose, canRetry }: ResultsDisplayProps) {
  const isPassed = result.passed;

  return (
    <div className="space-y-6">
      {/* Score Banner */}
      <div
        className={cn(
          'rounded-lg p-6 text-center',
          isPassed ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'
        )}
      >
        <div className="flex justify-center mb-3">
          {isPassed ? (
            <Trophy className="w-12 h-12 text-green-600" />
          ) : (
            <AlertCircle className="w-12 h-12 text-red-600" />
          )}
        </div>
        <h3
          className={cn(
            'text-2xl font-bold mb-1',
            isPassed ? 'text-green-800' : 'text-red-800'
          )}
        >
          {isPassed ? 'Congratulations!' : 'Not Quite There'}
        </h3>
        <p className={cn('text-sm', isPassed ? 'text-green-700' : 'text-red-700')}>
          {isPassed
            ? 'You passed the assessment!'
            : `You need ${result.passing_score}% to pass. Keep learning and try again!`}
        </p>
      </div>

      {/* Score Details */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="p-3 rounded-lg bg-muted">
          <p className="text-2xl font-bold text-primary">{result.score}%</p>
          <p className="text-xs text-muted-foreground">Your Score</p>
        </div>
        <div className="p-3 rounded-lg bg-muted">
          <p className="text-2xl font-bold">
            {result.correct_count}/{result.total_questions}
          </p>
          <p className="text-xs text-muted-foreground">Correct</p>
        </div>
        <div className="p-3 rounded-lg bg-muted">
          <p className="text-2xl font-bold">{result.passing_score}%</p>
          <p className="text-xs text-muted-foreground">Required</p>
        </div>
      </div>

      <Separator />

      {/* Answer Review */}
      <div className="space-y-4">
        <h4 className="font-semibold flex items-center gap-2">
          <ClipboardCheck className="w-4 h-4" />
          Answer Review
        </h4>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {result.answers_with_feedback.map((answer, index) => (
              <div
                key={answer.question_id}
                className={cn(
                  'rounded-lg border p-4',
                  answer.is_correct
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {answer.is_correct ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-sm font-medium">
                      {index + 1}. {answer.question_text}
                    </p>
                    <div className="text-sm space-y-1">
                      <p>
                        <span className="text-muted-foreground">Your answer: </span>
                        <span
                          className={cn(
                            'font-medium',
                            answer.is_correct ? 'text-green-700' : 'text-red-700'
                          )}
                        >
                          {answer.selected_option_text}
                        </span>
                      </p>
                      {!answer.is_correct && (
                        <p>
                          <span className="text-muted-foreground">Correct answer: </span>
                          <span className="font-medium text-green-700">
                            {answer.correct_option_text}
                          </span>
                        </p>
                      )}
                    </div>
                    {answer.explanation && (
                      <div className="flex items-start gap-2 mt-2 p-2 bg-white/50 rounded-md">
                        <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground">{answer.explanation}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {canRetry && !isPassed && (
          <Button onClick={onRetry} className="flex-1" variant="default">
            <RotateCcw className="w-4 h-4 mr-2" />
            Try Again
            {result.attempts_remaining !== null && (
              <span className="ml-1 text-xs opacity-80">
                ({result.attempts_remaining} left)
              </span>
            )}
          </Button>
        )}
        <Button onClick={onClose} variant={isPassed ? 'default' : 'outline'} className="flex-1">
          {isPassed ? 'Continue' : 'Close'}
        </Button>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function LessonAssessmentModal({
  assessment,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  lastResult,
  attemptCount,
  maxAttempts,
  hasPassed,
}: LessonAssessmentModalProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [view, setView] = useState<ModalView>(lastResult ? 'results' : 'questions');
  const [result, setResult] = useState<LessonAssessmentResult | null>(lastResult || null);

  const questions = assessment.questions;
  const totalQuestions = questions.length;
  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = Object.keys(answers).length;
  const progressPercent = (answeredCount / totalQuestions) * 100;
  const allAnswered = answeredCount === totalQuestions;

  // Reset state when modal opens
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        onClose();
      } else {
        // Reset for new attempt
        if (!lastResult) {
          setCurrentQuestionIndex(0);
          setAnswers({});
          setView('questions');
          setResult(null);
        }
      }
    },
    [onClose, lastResult]
  );

  // Handle option selection
  const handleSelectOption = useCallback(
    (optionId: string) => {
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: optionId,
      }));
    },
    [currentQuestion?.id]
  );

  // Navigation
  const goToNextQuestion = useCallback(() => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  }, [currentQuestionIndex, totalQuestions]);

  const goToPrevQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  }, [currentQuestionIndex]);

  // Submit assessment
  const handleSubmit = useCallback(async () => {
    const answerArray: LessonAssessmentAnswer[] = Object.entries(answers).map(
      ([questionId, optionId]) => ({
        question_id: questionId,
        selected_option_id: optionId,
      })
    );

    const submitResult = await onSubmit(answerArray);
    if (submitResult) {
      setResult(submitResult);
      setView('results');
    }
  }, [answers, onSubmit]);

  // Retry assessment
  const handleRetry = useCallback(() => {
    setCurrentQuestionIndex(0);
    setAnswers({});
    setView('questions');
    setResult(null);
  }, []);

  // Show results if already passed or result exists
  if (view === 'results' && result) {
    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5" />
              Assessment Results
            </DialogTitle>
            <DialogDescription>{assessment.title}</DialogDescription>
          </DialogHeader>
          <ResultsDisplay
            result={result}
            onRetry={handleRetry}
            onClose={onClose}
            canRetry={result.can_retry}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5" />
            {assessment.title}
          </DialogTitle>
          {assessment.description && (
            <DialogDescription>{assessment.description}</DialogDescription>
          )}
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {answeredCount} of {totalQuestions} answered
            </span>
            <div className="flex items-center gap-2">
              {maxAttempts !== null && (
                <Badge variant="outline" className="text-xs">
                  Attempt {attemptCount + 1}/{maxAttempts}
                </Badge>
              )}
              <Badge variant="secondary" className="text-xs">
                Pass: {assessment.passing_score}%
              </Badge>
            </div>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        <Separator />

        {/* Question Area */}
        <div className="min-h-[300px]">
          {currentQuestion && (
            <QuestionDisplay
              question={currentQuestion}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={totalQuestions}
              selectedOptionId={answers[currentQuestion.id] || null}
              onSelectOption={handleSelectOption}
              disabled={isSubmitting}
            />
          )}
        </div>

        {/* Navigation and Submit */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={goToPrevQuestion}
            disabled={currentQuestionIndex === 0 || isSubmitting}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>

          <div className="flex gap-2">
            {/* Question Dots */}
            <div className="flex items-center gap-1">
              {questions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  disabled={isSubmitting}
                  className={cn(
                    'w-2.5 h-2.5 rounded-full transition-all',
                    idx === currentQuestionIndex
                      ? 'bg-primary scale-125'
                      : answers[q.id]
                        ? 'bg-primary/50'
                        : 'bg-muted-foreground/30'
                  )}
                  aria-label={`Go to question ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {currentQuestionIndex < totalQuestions - 1 ? (
            <Button variant="outline" onClick={goToNextQuestion} disabled={isSubmitting}>
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!allAnswered || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Submit
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export { LessonAssessmentModal as LessonAssessment };
