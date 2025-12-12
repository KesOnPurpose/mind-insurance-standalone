// Mental Pillar Assessment Service
// Handles CRUD operations, scoring, and N8n webhook integration

import { supabase } from '@/integrations/supabase/client';
import {
  MentalPillarAssessment,
  MentalPillarAssessmentStatus,
  AssessmentPhase,
  AssessmentSource,
  PillarScores,
  GrowthDeltas,
  QuestionResponse,
  MIOFeedback,
  MentalPillarWebhookPayload,
  calculatePillarScores,
  getFocusAreas,
  getBiggestGrowth,
} from '@/types/mental-pillar-assessment';

// N8n webhook endpoint for MIO feedback generation
const N8N_WEBHOOK_URL = 'https://n8n-n8n.vq00fr.easypanel.host/webhook/mental-pillar-assessment-feedback';

// =============================================
// STATUS & RETRIEVAL
// =============================================

/**
 * Get the current Mental Pillar assessment status for a user
 * Uses the database helper function for comprehensive status
 */
export async function getAssessmentStatus(
  userId: string
): Promise<MentalPillarAssessmentStatus | null> {
  const { data, error } = await supabase.rpc('get_mental_pillar_assessment_status', {
    p_user_id: userId,
  });

  if (error) {
    console.error('Error fetching assessment status:', error);
    return null;
  }

  return data as MentalPillarAssessmentStatus;
}

/**
 * Get a specific assessment by ID
 */
export async function getAssessmentById(
  assessmentId: string
): Promise<MentalPillarAssessment | null> {
  const { data, error } = await supabase
    .from('mental_pillar_assessments')
    .select('*')
    .eq('id', assessmentId)
    .single();

  if (error) {
    console.error('Error fetching assessment:', error);
    return null;
  }

  return data as MentalPillarAssessment;
}

/**
 * Get all assessments for a user
 */
export async function getUserAssessments(
  userId: string
): Promise<MentalPillarAssessment[]> {
  const { data, error } = await supabase
    .from('mental_pillar_assessments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user assessments:', error);
    return [];
  }

  return data as MentalPillarAssessment[];
}

/**
 * Get the baseline (first PRE) assessment for a user
 */
export async function getBaselineAssessment(
  userId: string
): Promise<MentalPillarAssessment | null> {
  const { data, error } = await supabase
    .from('mental_pillar_assessments')
    .select('*')
    .eq('user_id', userId)
    .eq('assessment_phase', 'pre')
    .not('completed_at', 'is', null)
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows returned
    console.error('Error fetching baseline assessment:', error);
  }

  return data as MentalPillarAssessment | null;
}

// =============================================
// SAVE ASSESSMENT
// =============================================

export interface SaveAssessmentParams {
  userId: string;
  phase: AssessmentPhase;
  source: AssessmentSource;
  sourceContext?: Record<string, unknown>;
  responses: QuestionResponse[];
  startedAt: Date;
  invitationId?: string;
}

export interface SaveAssessmentResult {
  assessment_id: string;
  phase: AssessmentPhase;
  scores: PillarScores;
  growth_deltas?: GrowthDeltas;
  focus_areas: string[];
  attempt_number: number;
  time_to_complete_seconds: number;
}

/**
 * Save a completed assessment using the database function
 */
export async function saveAssessment(
  params: SaveAssessmentParams
): Promise<SaveAssessmentResult | null> {
  const {
    userId,
    phase,
    source,
    sourceContext = {},
    responses,
    startedAt,
    invitationId,
  } = params;

  // Calculate scores
  const pillarScores = calculatePillarScores(responses);

  const { data, error } = await supabase.rpc('save_mental_pillar_assessment', {
    p_user_id: userId,
    p_assessment_phase: phase,
    p_source: source,
    p_source_context: sourceContext,
    p_pillar_scores: pillarScores,
    p_responses: responses,
    p_started_at: startedAt.toISOString(),
    p_invitation_id: invitationId || null,
  });

  if (error) {
    console.error('Error saving assessment:', error);
    return null;
  }

  return data as SaveAssessmentResult;
}

// =============================================
// N8N WEBHOOK INTEGRATION
// =============================================

/**
 * Trigger MIO feedback generation via N8n webhook
 */
export async function triggerMIOFeedback(
  assessmentId: string,
  userId: string,
  phase: AssessmentPhase,
  scores: PillarScores,
  baselineScores?: PillarScores,
  growthDeltas?: GrowthDeltas
): Promise<boolean> {
  try {
    // Get user info for personalization
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('full_name, collision_patterns')
      .eq('id', userId)
      .single();

    const userName = userProfile?.full_name || 'there';
    const collisionPattern = userProfile?.collision_patterns?.primary_pattern;

    // Prepare focus areas
    const focusAreas = getFocusAreas(scores);

    // Prepare payload
    const payload: MentalPillarWebhookPayload = {
      user_id: userId,
      assessment_id: assessmentId,
      assessment_phase: phase,
      scores,
      focus_areas: focusAreas,
      user_name: userName,
      identity_collision_pattern: collisionPattern,
    };

    // Add growth-specific data for POST assessments
    if (phase === 'post' && growthDeltas && baselineScores) {
      payload.deltas = growthDeltas;
      payload.baseline_scores = baselineScores;
    }

    // Send to N8n webhook
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('N8n webhook error:', response.status, await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error triggering MIO feedback:', error);
    return false;
  }
}

/**
 * Update assessment with MIO feedback (called by N8n callback or polling)
 */
export async function updateMIOFeedback(
  assessmentId: string,
  feedback: MIOFeedback
): Promise<boolean> {
  const { error } = await supabase.rpc('update_mental_pillar_mio_feedback', {
    p_assessment_id: assessmentId,
    p_mio_feedback: feedback,
  });

  if (error) {
    console.error('Error updating MIO feedback:', error);
    return false;
  }

  return true;
}

/**
 * Poll for MIO feedback (in case webhook callback fails)
 */
export async function pollForMIOFeedback(
  assessmentId: string,
  maxAttempts: number = 10,
  intervalMs: number = 2000
): Promise<MIOFeedback | null> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { data, error } = await supabase
      .from('mental_pillar_assessments')
      .select('mio_feedback')
      .eq('id', assessmentId)
      .single();

    if (error) {
      console.error('Error polling for feedback:', error);
      return null;
    }

    if (data?.mio_feedback) {
      return data.mio_feedback as MIOFeedback;
    }

    // Wait before next attempt
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return null;
}

// =============================================
// ELIGIBILITY & VALIDATION
// =============================================

/**
 * Check if user can take the assessment
 */
export async function canUserTakeAssessment(
  userId: string,
  source: AssessmentSource
): Promise<{
  canTake: boolean;
  reason?: string;
  attemptsRemaining?: number;
  cooldownEndsAt?: string;
}> {
  const status = await getAssessmentStatus(userId);

  if (!status) {
    // First time - can always take
    return { canTake: true, attemptsRemaining: 3 };
  }

  // Coach-assigned or system-triggered can always proceed
  if (source === 'coach_assigned' || source === 'system_day28' || source === 'mio_suggested') {
    return { canTake: true };
  }

  // User-initiated checks
  if (status.user_attempts_remaining <= 0) {
    return {
      canTake: false,
      reason: 'You have used all 3 assessment attempts. Ask your coach for an additional assessment.',
      attemptsRemaining: 0,
    };
  }

  if (status.cooldown_ends_at && new Date(status.cooldown_ends_at) > new Date()) {
    return {
      canTake: false,
      reason: 'Please wait 7 days between assessments for accurate results.',
      attemptsRemaining: status.user_attempts_remaining,
      cooldownEndsAt: status.cooldown_ends_at,
    };
  }

  return {
    canTake: true,
    attemptsRemaining: status.user_attempts_remaining,
  };
}

/**
 * Determine the assessment phase based on user history
 */
export async function determineAssessmentPhase(
  userId: string
): Promise<AssessmentPhase> {
  const status = await getAssessmentStatus(userId);

  // If user has a baseline, next assessment is POST
  if (status?.has_baseline) {
    return 'post';
  }

  // No baseline yet, this is PRE
  return 'pre';
}

// =============================================
// INVITATIONS
// =============================================

/**
 * Check for pending Mental Pillar assessment invitation
 */
export async function getPendingInvitation(
  userId: string
): Promise<{ id: string; reason?: string; invited_by: string } | null> {
  const { data, error } = await supabase
    .from('assessment_invitations')
    .select('id, reason, invited_by')
    .eq('user_id', userId)
    .eq('assessment_type', 'mental_pillar')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking invitation:', error);
  }

  return data;
}

/**
 * Create an assessment invitation (for coaches or system)
 */
export async function createAssessmentInvitation(
  userId: string,
  invitedBy: 'admin' | 'coach' | 'mio_chat' | 'mio_feedback' | 'system',
  invitedByUserId?: string,
  reason?: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('assessment_invitations')
    .insert({
      user_id: userId,
      assessment_type: 'mental_pillar',
      invited_by: invitedBy,
      invited_by_user_id: invitedByUserId,
      reason: reason || 'Mental Pillar Assessment',
      status: 'pending',
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating invitation:', error);
    return null;
  }

  return data.id;
}

// =============================================
// ANALYTICS HELPERS
// =============================================

/**
 * Get growth summary for display
 */
export function getGrowthSummary(deltas: GrowthDeltas): {
  biggestGrowth: { competency: string; delta: number };
  totalGrowth: number;
  averageGrowth: number;
  areasImproved: number;
} {
  const biggestGrowthKey = getBiggestGrowth(deltas);
  const competencyDeltas = [
    deltas.pattern_awareness,
    deltas.identity_alignment,
    deltas.belief_mastery,
    deltas.mental_resilience,
  ];

  const totalGrowth = competencyDeltas.reduce((sum, d) => sum + d, 0);
  const averageGrowth = Math.round(totalGrowth / 4);
  const areasImproved = competencyDeltas.filter((d) => d > 0).length;

  return {
    biggestGrowth: {
      competency: biggestGrowthKey,
      delta: deltas[biggestGrowthKey],
    },
    totalGrowth,
    averageGrowth,
    areasImproved,
  };
}

/**
 * Get score interpretation text
 */
export function getScoreInterpretation(score: number): {
  level: 'developing' | 'emerging' | 'established' | 'advanced';
  label: string;
  description: string;
} {
  if (score < 40) {
    return {
      level: 'developing',
      label: 'Developing',
      description: 'Building foundational awareness — significant growth opportunity ahead',
    };
  } else if (score < 60) {
    return {
      level: 'emerging',
      label: 'Emerging',
      description: 'Skills are forming — consistent practice will accelerate progress',
    };
  } else if (score < 80) {
    return {
      level: 'established',
      label: 'Established',
      description: 'Solid foundation in place — refinement will lead to mastery',
    };
  } else {
    return {
      level: 'advanced',
      label: 'Advanced',
      description: 'Strong mastery demonstrated — maintain and deepen these patterns',
    };
  }
}
