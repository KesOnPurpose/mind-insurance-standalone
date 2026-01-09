// External Mental Pillar Assessment Service
// Handles guest assessment saves, MIO feedback, and session management

import { supabase } from '@/integrations/supabase/client';
import {
  ExternalAssessmentResult,
  ExternalAssessmentData,
  GuestSession,
  ExternalMIOWebhookPayload,
} from '@/types/external-assessment';
import {
  PillarScores,
  MIOFeedback,
  getFocusAreas,
} from '@/types/mental-pillar-assessment';

// N8n webhook endpoint for MIO feedback generation
const N8N_WEBHOOK_URL = 'https://n8n-n8n.vq00fr.easypanel.host/webhook/mental-pillar-assessment-feedback';

// LocalStorage keys
const GUEST_SESSION_KEY = 'external_assessment_guest_session';
const ASSESSMENT_PROGRESS_KEY = 'external_assessment_progress';

// =============================================
// GUEST SESSION MANAGEMENT
// =============================================

/**
 * Get or create a guest session for the external assessment
 */
export function getOrCreateGuestSession(): GuestSession {
  const stored = localStorage.getItem(GUEST_SESSION_KEY);

  if (stored) {
    try {
      return JSON.parse(stored) as GuestSession;
    } catch {
      // Invalid stored session, create new
    }
  }

  const session: GuestSession = {
    session_id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    created_at: new Date().toISOString(),
  };

  localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(session));
  return session;
}

/**
 * Update guest session with email and name
 */
export function updateGuestSession(email: string, name: string): GuestSession {
  const session = getOrCreateGuestSession();
  session.email = email;
  session.name = name;
  localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(session));
  return session;
}

/**
 * Clear guest session (after successful completion or on manual reset)
 */
export function clearGuestSession(): void {
  localStorage.removeItem(GUEST_SESSION_KEY);
  localStorage.removeItem(ASSESSMENT_PROGRESS_KEY);
}

// =============================================
// PROGRESS PERSISTENCE
// =============================================

export interface AssessmentProgress {
  currentStep: number;
  answers: Record<string, unknown>;
  startedAt: string;
}

/**
 * Save assessment progress to localStorage
 */
export function saveAssessmentProgress(progress: AssessmentProgress): void {
  localStorage.setItem(ASSESSMENT_PROGRESS_KEY, JSON.stringify(progress));
}

/**
 * Load assessment progress from localStorage
 */
export function loadAssessmentProgress(): AssessmentProgress | null {
  const stored = localStorage.getItem(ASSESSMENT_PROGRESS_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as AssessmentProgress;
  } catch {
    return null;
  }
}

/**
 * Clear assessment progress
 */
export function clearAssessmentProgress(): void {
  localStorage.removeItem(ASSESSMENT_PROGRESS_KEY);
}

// =============================================
// SAVE ASSESSMENT
// =============================================

/**
 * Save external assessment to database
 * Handles email matching and PRE baseline overwrite
 */
export async function saveExternalAssessment(
  data: ExternalAssessmentData
): Promise<ExternalAssessmentResult> {
  const { data: result, error } = await supabase.rpc(
    'save_external_mental_pillar_assessment',
    {
      p_guest_session_id: data.guest_session_id,
      p_guest_email: data.guest_email,
      p_guest_name: data.guest_name,
      p_pillar_scores: data.pillar_scores,
      p_responses: data.responses,
      p_started_at: data.started_at.toISOString(),
    }
  );

  if (error) {
    console.error('Error saving external assessment:', error);
    throw new Error('Failed to save assessment. Please try again.');
  }

  return result as ExternalAssessmentResult;
}

// =============================================
// MIO FEEDBACK
// =============================================

/**
 * Trigger MIO feedback generation via N8n webhook
 */
export async function triggerExternalMIOFeedback(
  assessmentId: string,
  guestEmail: string,
  guestName: string,
  scores: PillarScores,
  userId?: string
): Promise<boolean> {
  const focusAreas = getFocusAreas(scores);

  const payload: ExternalMIOWebhookPayload = {
    assessment_id: assessmentId,
    assessment_phase: 'pre',
    scores,
    focus_areas: focusAreas,
    user_name: guestName || 'there',
    identity_collision_pattern: 'unknown', // External users don't have collision pattern yet
    is_external: true,
    guest_email: guestEmail,
    user_id: userId,
  };

  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return response.ok;
  } catch (error) {
    console.error('Error triggering MIO feedback:', error);
    return false;
  }
}

/**
 * Poll for MIO feedback until it's available or max attempts reached
 */
export async function pollForMIOFeedback(
  assessmentId: string,
  maxAttempts: number = 15,
  intervalMs: number = 2000
): Promise<MIOFeedback | null> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Wait before checking (except first attempt)
    if (attempt > 0) {
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    const { data, error } = await supabase
      .from('mental_pillar_assessments')
      .select('mio_feedback')
      .eq('id', assessmentId)
      .single();

    if (error) {
      console.error('Error polling for MIO feedback:', error);
      continue;
    }

    if (data?.mio_feedback) {
      return data.mio_feedback as MIOFeedback;
    }
  }

  return null;
}

// =============================================
// RETRIEVE ASSESSMENT
// =============================================

/**
 * Get external assessment by ID (for results display)
 */
export async function getExternalAssessment(assessmentId: string) {
  const { data, error } = await supabase
    .from('mental_pillar_assessments')
    .select('*')
    .eq('id', assessmentId)
    .single();

  if (error) {
    console.error('Error fetching external assessment:', error);
    return null;
  }

  return data;
}

// =============================================
// EMAIL VALIDATION
// =============================================

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate name (at least 2 characters)
 */
export function validateName(name: string): boolean {
  return name.trim().length >= 2;
}
