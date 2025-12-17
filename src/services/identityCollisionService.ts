/**
 * Identity Collision Assessment Service
 * Handles saving and retrieving Quick Identity Collision Assessment results
 */

import { supabase } from '@/integrations/supabase/client';
import { buildProtocolGenerationContext } from './mioAvatarContextService';

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
    // 0. Ensure user_profile exists (prevents FK errors)
    const { error: profileEnsureError } = await supabase
      .from('user_profiles')
      .upsert({
        id: userId,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id',
        ignoreDuplicates: true,
      });

    if (profileEnsureError) {
      console.warn('[identityCollisionService] Could not ensure user_profile exists:', profileEnsureError);
      // Continue anyway - the profile might already exist
    }

    // 1. Save to identity_collision_assessments table
    // Generate a session ID for this assessment
    const sessionId = crypto.randomUUID();

    const { data: assessmentData, error: assessmentError } = await supabase
      .from('identity_collision_assessments')
      .insert({
        user_id: userId,
        session_id: sessionId,
        dominant_pattern: result.primaryPattern,
        pattern_confidence: result.confidence,
        past_prison_score: result.scores.past_prison,
        success_sabotage_score: result.scores.success_sabotage,
        compass_crisis_score: result.scores.compass_crisis,
        completed_at: new Date().toISOString(),
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

    // 3. Also update avatar_assessments for compatibility with existing system
    // avatar_type format: pattern_temperament (e.g., past_prison_sage)
    const avatarType = `${result.primaryPattern}_sage`;

    // First try to update existing record
    const { data: existingAvatar } = await supabase
      .from('avatar_assessments')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existingAvatar) {
      // Update existing record
      const { error: avatarUpdateError } = await supabase
        .from('avatar_assessments')
        .update({
          avatar_type: avatarType,
          temperament: 'sage',
          primary_pattern: result.primaryPattern,
          past_prison_score: result.scores.past_prison,
          success_sabotage_score: result.scores.success_sabotage,
          compass_crisis_score: result.scores.compass_crisis,
          completed_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (avatarUpdateError) {
        console.error('[identityCollisionService] Error updating avatar_assessments:', avatarUpdateError);
      }
    } else {
      // Insert new record
      const { error: avatarInsertError } = await supabase
        .from('avatar_assessments')
        .insert({
          user_id: userId,
          avatar_type: avatarType,
          temperament: 'sage',
          primary_pattern: result.primaryPattern,
          past_prison_score: result.scores.past_prison,
          success_sabotage_score: result.scores.success_sabotage,
          compass_crisis_score: result.scores.compass_crisis,
          completed_at: new Date().toISOString(),
        });

      if (avatarInsertError) {
        console.error('[identityCollisionService] Error inserting avatar_assessments:', avatarInsertError);
      }
    }

    // 4. Trigger N8n First Protocol Generation webhook (background, non-blocking)
    // This creates the AI-generated 7-day protocol in mio_weekly_protocols table
    triggerFirstProtocolGeneration({
      user_id: userId,
      user_name: await getUserName(userId),
      collision_pattern: result.primaryPattern,
      assessment_id: assessmentData?.id,
    }).catch((err) => {
      console.error('[identityCollisionService] Protocol generation webhook failed:', err);
      // Non-blocking - user flow continues even if webhook fails
    });

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
    fullDescription: 'You pull back right when breakthrough is near. Your amygdala (your brain\'s threat-detection center) associates success with danger—fear of visibility, fear of outgrowing relationships, or fear of not being able to maintain success. This causes you to unconsciously sabotage progress at critical moments.',
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

// ============================================================================
// N8N WEBHOOK INTEGRATION
// ============================================================================

/**
 * Get user's display name from user_profiles
 */
async function getUserName(userId: string): Promise<string> {
  const { data } = await supabase
    .from('user_profiles')
    .select('full_name')
    .eq('id', userId)
    .maybeSingle();

  return data?.full_name || 'there';
}

/**
 * Trigger N8n First Protocol Generation webhook
 * This creates the 7-day protocol in mio_weekly_protocols table
 *
 * Enhanced with avatar_context for progressive personalization (P6.5)
 *
 * @param data - User and assessment data
 * @returns Promise<void>
 *
 * Webhook URL: POST https://n8n-n8n.vq00fr.easypanel.host/webhook/first-protocol-generation
 * See: n8n-workflows/First-Protocol-Generation.json
 */
async function triggerFirstProtocolGeneration(data: {
  user_id: string;
  user_name: string;
  collision_pattern: string;
  assessment_id?: string;
}): Promise<void> {
  const webhookUrl = 'https://n8n-n8n.vq00fr.easypanel.host/webhook/first-protocol-generation';

  console.log('[identityCollisionService] Triggering First Protocol Generation webhook for user:', data.user_id);

  // Build enhanced context with avatar data (if available) for progressive personalization
  let enhancedPayload: Record<string, unknown> = { ...data };

  try {
    const avatarContext = await buildProtocolGenerationContext(data.user_id, data.user_name);

    // Merge avatar context into payload for N8n
    enhancedPayload = {
      ...data,
      // Avatar context (populated if assessments complete, null fields otherwise)
      avatar_context: avatarContext.avatar_context,
      // Practice behavior analysis
      practice_insights: avatarContext.practice_insights,
      // Previous protocol context
      previous_protocol: avatarContext.previous_protocol,
      // Metadata
      assessments_completed: avatarContext.assessments_completed,
      triggered_by: 'identity_collision_completion',
    };

    console.log('[identityCollisionService] Enhanced payload with avatar context:', {
      hasAvatar: !!avatarContext.avatar_context.avatar_name,
      assessmentsCompleted: avatarContext.assessments_completed,
      streakCount: avatarContext.practice_insights.streak_count,
    });
  } catch (contextError) {
    console.warn('[identityCollisionService] Could not build avatar context, using basic payload:', contextError);
    // Continue with basic payload if context building fails
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(enhancedPayload),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Protocol generation failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log('[identityCollisionService] Protocol generated successfully:', result.protocol_id || result);
}

export default {
  calculateCollisionResult,
  saveAssessmentResult,
  getLatestAssessment,
  getUserAssessments,
  PATTERN_INFO,
};
