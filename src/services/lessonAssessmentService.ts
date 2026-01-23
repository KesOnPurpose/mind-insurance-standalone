/**
 * FEAT-GH-006-B: Lesson Assessment Service
 *
 * Handles all database operations for lesson assessments (quizzes):
 * - Fetching assessment questions for a tactic
 * - Submitting assessment attempts
 * - Calculating scores and pass/fail status
 * - Retrieving attempt history
 *
 * Tables used:
 * - gh_lesson_assessments (assessment configuration)
 * - gh_user_assessment_attempts (user attempts)
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  LessonAssessment,
  LessonAssessmentAttempt,
  LessonAssessmentAnswer,
  LessonAssessmentResult,
  LessonAssessmentAnswerFeedback,
} from '@/types/assessment';

// =============================================================================
// TYPES
// =============================================================================

export interface LessonAssessmentServiceResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface SubmitAssessmentOptions {
  userId: string;
  tacticId: string;
  assessmentId: string;
  answers: LessonAssessmentAnswer[];
}

// =============================================================================
// GET ASSESSMENT FOR TACTIC
// =============================================================================

/**
 * Get the lesson assessment for a specific tactic
 * Returns null if no assessment exists for this tactic
 */
export async function getAssessmentForTactic(
  tacticId: string
): Promise<LessonAssessmentServiceResult<LessonAssessment | null>> {
  try {
    const { data, error } = await supabase
      .from('gh_lesson_assessments')
      .select('*')
      .eq('tactic_id', tacticId)
      .maybeSingle();

    if (error) {
      console.error('[lessonAssessmentService] Error fetching assessment:', error);
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: true, data: null };
    }

    // Parse questions JSONB field
    const assessment: LessonAssessment = {
      id: data.id,
      tactic_id: data.tactic_id,
      title: data.title || 'Knowledge Check',
      description: data.description,
      questions: data.questions || [],
      passing_score: data.passing_score || 70,
      max_attempts: data.max_attempts ?? -1,
      time_limit_minutes: data.time_limit_minutes,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };

    return { success: true, data: assessment };
  } catch (error) {
    console.error('[lessonAssessmentService] Failed to get assessment:', error);
    return { success: false, error: String(error) };
  }
}

// =============================================================================
// GET USER ATTEMPTS
// =============================================================================

/**
 * Get all attempts for a user on a specific tactic's assessment
 */
export async function getAssessmentAttempts(
  userId: string,
  tacticId: string
): Promise<LessonAssessmentServiceResult<LessonAssessmentAttempt[]>> {
  try {
    const { data, error } = await supabase
      .from('gh_user_assessment_attempts')
      .select('*')
      .eq('user_id', userId)
      .eq('tactic_id', tacticId)
      .order('attempt_number', { ascending: false });

    if (error) {
      console.error('[lessonAssessmentService] Error fetching attempts:', error);
      return { success: false, error: error.message };
    }

    const attempts: LessonAssessmentAttempt[] = (data || []).map((row) => ({
      id: row.id,
      user_id: row.user_id,
      tactic_id: row.tactic_id,
      assessment_id: row.assessment_id,
      attempt_number: row.attempt_number,
      answers: row.answers || [],
      score: row.score,
      passed: row.passed,
      started_at: row.started_at,
      completed_at: row.completed_at,
      time_spent_seconds: row.time_spent_seconds,
    }));

    return { success: true, data: attempts };
  } catch (error) {
    console.error('[lessonAssessmentService] Failed to get attempts:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Get the most recent passing attempt for a user on a tactic
 */
export async function getPassingAttempt(
  userId: string,
  tacticId: string
): Promise<LessonAssessmentServiceResult<LessonAssessmentAttempt | null>> {
  try {
    const { data, error } = await supabase
      .from('gh_user_assessment_attempts')
      .select('*')
      .eq('user_id', userId)
      .eq('tactic_id', tacticId)
      .eq('passed', true)
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[lessonAssessmentService] Error fetching passing attempt:', error);
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: true, data: null };
    }

    const attempt: LessonAssessmentAttempt = {
      id: data.id,
      user_id: data.user_id,
      tactic_id: data.tactic_id,
      assessment_id: data.assessment_id,
      attempt_number: data.attempt_number,
      answers: data.answers || [],
      score: data.score,
      passed: data.passed,
      started_at: data.started_at,
      completed_at: data.completed_at,
      time_spent_seconds: data.time_spent_seconds,
    };

    return { success: true, data: attempt };
  } catch (error) {
    console.error('[lessonAssessmentService] Failed to get passing attempt:', error);
    return { success: false, error: String(error) };
  }
}

// =============================================================================
// SUBMIT ASSESSMENT
// =============================================================================

/**
 * Submit an assessment attempt and calculate the score
 */
export async function submitAssessmentAttempt(
  options: SubmitAssessmentOptions
): Promise<LessonAssessmentServiceResult<LessonAssessmentResult>> {
  const { userId, tacticId, assessmentId, answers } = options;

  try {
    // 1. Fetch the assessment to get correct answers
    const assessmentResult = await getAssessmentForTactic(tacticId);
    if (!assessmentResult.success || !assessmentResult.data) {
      return { success: false, error: 'Assessment not found' };
    }

    const assessment = assessmentResult.data;

    // 2. Get current attempt count
    const attemptsResult = await getAssessmentAttempts(userId, tacticId);
    const currentAttemptCount = attemptsResult.success ? (attemptsResult.data?.length || 0) : 0;

    // 3. Check if user can still attempt (max_attempts check)
    if (assessment.max_attempts !== -1 && currentAttemptCount >= assessment.max_attempts) {
      return {
        success: false,
        error: `Maximum attempts (${assessment.max_attempts}) reached`,
      };
    }

    // 4. Grade the answers
    const gradedAnswers: LessonAssessmentAnswer[] = [];
    const answersWithFeedback: LessonAssessmentAnswerFeedback[] = [];
    let correctCount = 0;

    for (const answer of answers) {
      const question = assessment.questions.find((q) => q.id === answer.question_id);
      if (!question) continue;

      const isCorrect = answer.selected_option_id === question.correctOptionId;
      if (isCorrect) correctCount++;

      gradedAnswers.push({
        ...answer,
        is_correct: isCorrect,
      });

      const selectedOption = question.options.find((o) => o.id === answer.selected_option_id);
      const correctOption = question.options.find((o) => o.id === question.correctOptionId);

      answersWithFeedback.push({
        question_id: question.id,
        question_text: question.question,
        selected_option_id: answer.selected_option_id,
        selected_option_text: selectedOption?.text || '',
        correct_option_id: question.correctOptionId,
        correct_option_text: correctOption?.text || '',
        is_correct: isCorrect,
        explanation: question.explanation,
      });
    }

    // 5. Calculate score and pass/fail
    const totalQuestions = assessment.questions.length;
    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const passed = score >= assessment.passing_score;
    const attemptNumber = currentAttemptCount + 1;

    // 6. Save attempt to database
    const now = new Date().toISOString();
    const { data: insertedAttempt, error: insertError } = await supabase
      .from('gh_user_assessment_attempts')
      .insert({
        user_id: userId,
        tactic_id: tacticId,
        assessment_id: assessmentId,
        attempt_number: attemptNumber,
        answers: gradedAnswers,
        score,
        passed,
        started_at: now, // Could be passed from UI for accuracy
        completed_at: now,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[lessonAssessmentService] Error saving attempt:', insertError);
      return { success: false, error: insertError.message };
    }

    // 7. Calculate remaining attempts
    const attemptsRemaining =
      assessment.max_attempts === -1 ? null : Math.max(0, assessment.max_attempts - attemptNumber);

    // 8. Return result
    const result: LessonAssessmentResult = {
      attempt_id: insertedAttempt.id,
      score,
      passed,
      correct_count: correctCount,
      total_questions: totalQuestions,
      passing_score: assessment.passing_score,
      answers_with_feedback: answersWithFeedback,
      can_retry: !passed && (assessment.max_attempts === -1 || attemptNumber < assessment.max_attempts),
      attempts_remaining: attemptsRemaining,
    };

    return { success: true, data: result };
  } catch (error) {
    console.error('[lessonAssessmentService] Failed to submit assessment:', error);
    return { success: false, error: String(error) };
  }
}

// =============================================================================
// CHECK ASSESSMENT STATUS
// =============================================================================

/**
 * Check if a user has passed the assessment for a tactic
 */
export async function hasPassedAssessment(
  userId: string,
  tacticId: string
): Promise<boolean> {
  const result = await getPassingAttempt(userId, tacticId);
  return result.success && result.data !== null;
}

/**
 * Get assessment completion status for a tactic
 * Used by completion gates
 */
export async function getAssessmentStatus(
  userId: string,
  tacticId: string
): Promise<{
  hasAssessment: boolean;
  passed: boolean;
  attempts: number;
  maxAttempts: number | null;
  bestScore: number;
}> {
  // Check if tactic has an assessment
  const assessmentResult = await getAssessmentForTactic(tacticId);
  if (!assessmentResult.success || !assessmentResult.data) {
    return {
      hasAssessment: false,
      passed: true, // No assessment = automatically passed
      attempts: 0,
      maxAttempts: null,
      bestScore: 0,
    };
  }

  const assessment = assessmentResult.data;

  // Get all attempts
  const attemptsResult = await getAssessmentAttempts(userId, tacticId);
  const attempts = attemptsResult.success ? attemptsResult.data || [] : [];

  // Calculate best score and check if passed
  const passed = attempts.some((a) => a.passed);
  const bestScore = attempts.length > 0 ? Math.max(...attempts.map((a) => a.score)) : 0;

  return {
    hasAssessment: true,
    passed,
    attempts: attempts.length,
    maxAttempts: assessment.max_attempts === -1 ? null : assessment.max_attempts,
    bestScore,
  };
}
