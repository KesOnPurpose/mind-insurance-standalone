// External Mental Pillar Assessment Types
// For guest/public assessment flow at grouphome4newbies.com/mental-assessment

import {
  PillarScores,
  QuestionResponse,
  MIOFeedback,
  MentalPillarCompetency,
} from './mental-pillar-assessment';

// =============================================
// EXTERNAL ASSESSMENT TYPES
// =============================================

export interface ExternalAssessmentResult {
  assessment_id: string;
  user_matched: boolean;
  user_id: string | null;
  overwrote_existing: boolean;
  time_to_complete_seconds: number;
}

export interface ExternalAssessmentData {
  guest_session_id: string;
  guest_email: string;
  guest_name: string;
  pillar_scores: PillarScores;
  responses: QuestionResponse[];
  started_at: Date;
}

// =============================================
// UI PHASE TYPES
// =============================================

export type ExternalAssessmentUIPhase =
  | 'loading'
  | 'intro'
  | 'questions'
  | 'email_collection'
  | 'analyzing'
  | 'results'
  | 'error';

// =============================================
// GUEST SESSION
// =============================================

export interface GuestSession {
  session_id: string;
  created_at: string;
  email?: string;
  name?: string;
}

// =============================================
// HOOK STATE
// =============================================

export interface ExternalAssessmentState {
  uiPhase: ExternalAssessmentUIPhase;
  currentStep: number; // 1-10
  answers: Map<string, QuestionResponse>;
  startedAt: Date | null;
  scores: PillarScores | null;
  mioFeedback: MIOFeedback | null;
  guestSession: GuestSession | null;
  assessmentId: string | null;
  userWasMatched: boolean;
  error: string | null;
  isSubmitting: boolean;
  isLoadingFeedback: boolean;
}

// =============================================
// MIO WEBHOOK PAYLOAD (Extended for External)
// =============================================

export interface ExternalMIOWebhookPayload {
  assessment_id: string;
  assessment_phase: 'pre';
  scores: PillarScores;
  focus_areas: MentalPillarCompetency[];
  user_name: string;
  identity_collision_pattern: string;
  is_external: true;
  guest_email: string;
  user_id?: string;
}

// =============================================
// EMAIL COLLECTION
// =============================================

export interface EmailCollectionData {
  email: string;
  name: string;
}

export interface EmailCollectionErrors {
  email?: string;
  name?: string;
}
