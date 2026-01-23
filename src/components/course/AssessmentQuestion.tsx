/**
 * FEAT-GH-006-E: AssessmentQuestion Component
 *
 * Reusable component for displaying a single assessment question:
 * - Shows question text and number
 * - Radio group for single-choice answers
 * - Highlighted selection indicator
 * - Support for correct/incorrect feedback display
 */

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Lightbulb } from 'lucide-react';
import type { LessonAssessmentQuestion, LessonAssessmentOption } from '@/types/assessment';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

interface AssessmentQuestionProps {
  /** The question to display */
  question: LessonAssessmentQuestion;
  /** Current question number (1-indexed) */
  questionNumber: number;
  /** Total number of questions */
  totalQuestions: number;
  /** Currently selected option ID */
  selectedOptionId: string | null;
  /** Callback when an option is selected */
  onSelectOption: (optionId: string) => void;
  /** Whether the question is disabled (e.g., during submission) */
  disabled?: boolean;
  /** Show feedback mode (after submission) */
  showFeedback?: boolean;
  /** Correct option ID (only used in feedback mode) */
  correctOptionId?: string;
  /** Explanation text (shown in feedback mode) */
  explanation?: string;
}

interface OptionItemProps {
  option: LessonAssessmentOption;
  questionId: string;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  disabled: boolean;
  showFeedback: boolean;
  isCorrect?: boolean;
  wasSelected?: boolean;
}

// =============================================================================
// OPTION ITEM COMPONENT
// =============================================================================

function OptionItem({
  option,
  questionId,
  index,
  isSelected,
  onSelect,
  disabled,
  showFeedback,
  isCorrect,
  wasSelected,
}: OptionItemProps) {
  // Determine styling based on feedback state
  const getOptionStyles = () => {
    if (!showFeedback) {
      // Normal selection mode
      return cn(
        'flex items-start space-x-3 rounded-lg border p-4 transition-all',
        isSelected
          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
          : 'border-muted hover:border-primary/50 hover:bg-muted/50',
        disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
      );
    }

    // Feedback mode
    if (isCorrect) {
      // This is the correct answer
      return cn(
        'flex items-start space-x-3 rounded-lg border-2 p-4',
        'border-green-500 bg-green-50'
      );
    }

    if (wasSelected && !isCorrect) {
      // This was selected but is wrong
      return cn(
        'flex items-start space-x-3 rounded-lg border-2 p-4',
        'border-red-500 bg-red-50'
      );
    }

    // Unselected, not correct
    return 'flex items-start space-x-3 rounded-lg border p-4 border-muted opacity-50';
  };

  return (
    <div
      className={getOptionStyles()}
      onClick={() => !disabled && !showFeedback && onSelect()}
    >
      {!showFeedback ? (
        <RadioGroupItem value={option.id} id={`q${questionId}-opt${index}`} />
      ) : (
        <div className="flex-shrink-0 mt-0.5">
          {isCorrect ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : wasSelected ? (
            <XCircle className="w-5 h-5 text-red-600" />
          ) : (
            <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
          )}
        </div>
      )}
      <Label
        htmlFor={`q${questionId}-opt${index}`}
        className={cn(
          'flex-1 text-sm leading-relaxed',
          !showFeedback && 'cursor-pointer',
          showFeedback && isCorrect && 'text-green-800 font-medium',
          showFeedback && wasSelected && !isCorrect && 'text-red-800'
        )}
      >
        {option.text}
      </Label>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function AssessmentQuestion({
  question,
  questionNumber,
  totalQuestions,
  selectedOptionId,
  onSelectOption,
  disabled = false,
  showFeedback = false,
  correctOptionId,
  explanation,
}: AssessmentQuestionProps) {
  return (
    <div className="space-y-4">
      {/* Question Header */}
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="text-xs font-medium">
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
        disabled={disabled || showFeedback}
        className="space-y-3"
      >
        {question.options.map((option, index) => (
          <OptionItem
            key={option.id}
            option={option}
            questionId={question.id}
            index={index}
            isSelected={selectedOptionId === option.id}
            onSelect={() => onSelectOption(option.id)}
            disabled={disabled}
            showFeedback={showFeedback}
            isCorrect={showFeedback && option.id === correctOptionId}
            wasSelected={showFeedback && option.id === selectedOptionId}
          />
        ))}
      </RadioGroup>

      {/* Explanation (in feedback mode) */}
      {showFeedback && explanation && (
        <div className="flex items-start gap-2 p-3 mt-4 rounded-lg bg-amber-50 border border-amber-200">
          <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800 mb-1">Explanation</p>
            <p className="text-sm text-amber-700">{explanation}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// COMPACT VERSION FOR RESULTS REVIEW
// =============================================================================

interface AssessmentQuestionReviewProps {
  questionNumber: number;
  questionText: string;
  selectedOptionText: string;
  correctOptionText: string;
  isCorrect: boolean;
  explanation?: string;
}

export function AssessmentQuestionReview({
  questionNumber,
  questionText,
  selectedOptionText,
  correctOptionText,
  isCorrect,
  explanation,
}: AssessmentQuestionReviewProps) {
  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {isCorrect ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600" />
          )}
        </div>
        <div className="flex-1 space-y-2">
          <p className="text-sm font-medium">
            {questionNumber}. {questionText}
          </p>
          <div className="text-sm space-y-1">
            <p>
              <span className="text-muted-foreground">Your answer: </span>
              <span
                className={cn('font-medium', isCorrect ? 'text-green-700' : 'text-red-700')}
              >
                {selectedOptionText}
              </span>
            </p>
            {!isCorrect && (
              <p>
                <span className="text-muted-foreground">Correct answer: </span>
                <span className="font-medium text-green-700">{correctOptionText}</span>
              </p>
            )}
          </div>
          {explanation && (
            <div className="flex items-start gap-2 mt-2 p-2 bg-white/50 rounded-md">
              <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">{explanation}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export default AssessmentQuestion;
