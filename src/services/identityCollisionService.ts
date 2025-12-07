/**
 * Identity Collision Assessment Service
 * Handles saving and retrieving Quick Identity Collision Assessment results
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

export type CollisionPattern = 'past_prison' | 'success_sabotage' | 'compass_crisis';

export interface CollisionScores {
  past_prison: number;
  success_sabotage: number;
  compass_crisis: number;
  total_impact: number;
}

export interface AssessmentAnswer {
  questionId: string;
  answer: string;
  score: number;
  patternIndicators?: Partial<Record<CollisionPattern, number>>;
}

export interface AssessmentResult {
  primaryPattern: CollisionPattern;
  scores: CollisionScores;
  confidence: number;
  impactArea: string;
  impactIntensity: number;
  answers: AssessmentAnswer[];
}

export interface SaveAssessmentRequest {
  userId: string;
  result: AssessmentResult;
}

export interface SaveAssessmentResponse {
  success: boolean;
  assessmentId?: string;
  error?: string;
}

// ============================================================================
// SCORING ALGORITHM
// ============================================================================

/**
 * Calculate collision pattern from assessment answers
 * Q4 is the PRIMARY pattern detector
 * Q2, Q5 provide secondary signals for success_sabotage
 */
export function calculateCollisionResult(answers: AssessmentAnswer[]): AssessmentResult {
  const scores: CollisionScores = {
    past_prison: 0,
    success_sabotage: 0,
    compass_crisis: 0,
    total_impact: 0,
  };

  let impactArea = '';
  let impactIntensity = 5;

  // Process each answer and accumulate pattern scores
  answers.forEach((answer) => {
    // Add to total impact score
    scores.total_impact += answer.score;

    // Add pattern-specific scores
    if (answer.patternIndicators) {
      Object.entries(answer.patternIndicators).forEach(([pattern, points]) => {
        if (pattern in scores) {
          scores[pattern as CollisionPattern] += points || 0;
        }
      });
    }

    // Extract impact area from Q7
    if (answer.questionId === 'q7') {
      impactArea = answer.answer;
    }

    // Extract impact intensity from Q8
    if (answer.questionId === 'q8') {
      impactIntensity = parseInt(answer.answer, 10) || 5;
    }
  });

  // Determine primary pattern (highest score)
  const patternScores = [
    { pattern: 'past_prison' as CollisionPattern, score: scores.past_prison },
    { pattern: 'success_sabotage' as CollisionPattern, score: scores.success_sabotage },
    { pattern: 'compass_crisis' as CollisionPattern, score: scores.compass_crisis },
  ];

  patternScores.sort((a, b) => b.score - a.score);
  const primaryPattern = patternScores[0].pattern;
  const highestScore = patternScores[0].score;

  // Calculate confidence (percentage of highest vs total)
  const totalPatternScore = scores.past_prison + scores.success_sabotage + scores.compass_crisis;
  const confidence = totalPatternScore > 0
    ? Math.round((highestScore / totalPatternScore) * 100)
    : 50;

  return {
    primaryPattern,
    scores,
    confidence,
    impactArea,
    impactIntensity,
    answers,
  };
}

// ============================================================================
// SAVE OPERATIONS
// ============================================================================

/**
 * Save identity collision assessment results to Supabase
 * Saves to both identity_collision_assessments and updates user_profiles.collision_patterns
 */
export async function saveAssessmentResult(
  request: SaveAssessmentRequest
): Promise<SaveAssessmentResponse> {
  const { userId, result } = request;

  try {
    // 1. Save to identity_collision_assessments table
    const { data: assessmentData, error: assessmentError } = await supabase
      .from('identity_collision_assessments')
      .insert({
        user_id: userId,
        dominant_pattern: result.primaryPattern,
        pattern_confidence: result.confidence,
        responses: {
          answers: result.answers,
          impact_area: result.impactArea,
          impact_intensity: result.impactIntensity,
          scores: result.scores,
        },
      })
      .select('id')
      .single();

    if (assessmentError) {
      console.error('[identityCollisionService] Error saving assessment:', assessmentError);
      return { success: false, error: assessmentError.message };
    }

    // 2. Update user_profiles.collision_patterns for quick access
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        collision_patterns: {
          primary_pattern: result.primaryPattern,
          confidence: result.confidence,
          impact_area: result.impactArea,
          impact_intensity: result.impactIntensity,
          scores: result.scores,
          assessed_at: new Date().toISOString(),
        },
      })
      .eq('id', userId);

    if (profileError) {
      console.error('[identityCollisionService] Error updating user_profiles:', profileError);
      // Don't fail if profile update fails - assessment is already saved
    }

    // 3. Also save to avatar_assessments for compatibility with existing system
    const { error: avatarError } = await supabase
      .from('avatar_assessments')
      .upsert({
        user_id: userId,
        primary_pattern: result.primaryPattern.toUpperCase().replace(/_/g, ' '),
        past_prison_score: result.scores.past_prison,
        success_sabotage_score: result.scores.success_sabotage,
        compass_crisis_score: result.scores.compass_crisis,
        completed_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false,
      });

    if (avatarError) {
      console.error('[identityCollisionService] Error upserting avatar_assessments:', avatarError);
      // Don't fail if this fails - main assessment is saved
    }

    return {
      success: true,
      assessmentId: assessmentData?.id,
    };
  } catch (error) {
    console.error('[identityCollisionService] Unexpected error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// ============================================================================
// GET OPERATIONS
// ============================================================================

/**
 * Get the most recent assessment for a user
 */
export async function getLatestAssessment(userId: string): Promise<AssessmentResult | null> {
  const { data, error } = await supabase
    .from('identity_collision_assessments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const responses = data.responses as Record<string, unknown> | null;

  return {
    primaryPattern: (data.dominant_pattern || 'past_prison') as CollisionPattern,
    scores: (responses?.scores as CollisionScores) || {
      past_prison: 0,
      success_sabotage: 0,
      compass_crisis: 0,
      total_impact: 0,
    },
    confidence: data.pattern_confidence || 50,
    impactArea: (responses?.impact_area as string) || '',
    impactIntensity: (responses?.impact_intensity as number) || 5,
    answers: (responses?.answers as AssessmentAnswer[]) || [],
  };
}

/**
 * Get all assessments for a user (for vault history)
 */
export async function getUserAssessments(userId: string, limit = 20): Promise<AssessmentResult[]> {
  const { data, error } = await supabase
    .from('identity_collision_assessments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data.map((row) => {
    const responses = row.responses as Record<string, unknown> | null;
    return {
      primaryPattern: (row.dominant_pattern || 'past_prison') as CollisionPattern,
      scores: (responses?.scores as CollisionScores) || {
        past_prison: 0,
        success_sabotage: 0,
        compass_crisis: 0,
        total_impact: 0,
      },
      confidence: row.pattern_confidence || 50,
      impactArea: (responses?.impact_area as string) || '',
      impactIntensity: (responses?.impact_intensity as number) || 5,
      answers: (responses?.answers as AssessmentAnswer[]) || [],
    };
  });
}

// ============================================================================
// PATTERN DESCRIPTIONS
// ============================================================================

export const PATTERN_INFO: Record<CollisionPattern, {
  name: string;
  shortDescription: string;
  fullDescription: string;
  icon: string;
  color: string;
}> = {
  past_prison: {
    name: 'Past Prison',
    shortDescription: 'Your past is creating invisible barriers',
    fullDescription: 'Your past experiences, upbringing, or environment are creating invisible barriers that hold you back from your potential. You carry guilt, limiting beliefs, or identity ceilings from your history that unconsciously dictate what you believe is possible for you.',
    icon: '🔗',
    color: '#8b5cf6', // Purple
  },
  success_sabotage: {
    name: 'Success Sabotage',
    shortDescription: 'You pull back when breakthrough is near',
    fullDescription: 'You pull back right when breakthrough is near. Your amygdala associates success with danger—fear of visibility, fear of outgrowing relationships, or fear of not being able to maintain success. This causes you to unconsciously sabotage progress at critical moments.',
    icon: '⚡',
    color: '#f59e0b', // Amber
  },
  compass_crisis: {
    name: 'Compass Crisis',
    shortDescription: 'Unclear direction creates paralysis',
    fullDescription: 'You lack clear direction or feel pulled in multiple directions. Without a defined path, you struggle with decision paralysis, constant comparison to others who seem more certain, and difficulty committing fully to any single direction.',
    icon: '🧭',
    color: '#06b6d4', // Cyan
  },
};

export default {
  calculateCollisionResult,
  saveAssessmentResult,
  getLatestAssessment,
  getUserAssessments,
  PATTERN_INFO,
};
