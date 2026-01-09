// Mental Pillar Baseline Assessment Types
// Measures 4 competencies mapped to 4-week curriculum

// =============================================
// COMPETENCY TYPES
// =============================================

export type MentalPillarCompetency =
  | 'pattern_awareness'
  | 'identity_alignment'
  | 'belief_mastery'
  | 'mental_resilience';

export type AssessmentPhase = 'pre' | 'post';

export type AssessmentSource =
  | 'user_initiated'
  | 'coach_assigned'
  | 'system_day28'
  | 'mio_suggested';

// =============================================
// SCORE TYPES
// =============================================

export interface PillarScores {
  pattern_awareness: number; // 0-100
  identity_alignment: number; // 0-100
  belief_mastery: number; // 0-100
  mental_resilience: number; // 0-100
  overall: number; // 0-100 (weighted average)
}

export interface GrowthDeltas {
  pattern_awareness: number; // Can be negative
  identity_alignment: number;
  belief_mastery: number;
  mental_resilience: number;
  overall: number;
}

// =============================================
// QUESTION TYPES
// =============================================

export interface QuestionOption {
  id: string;
  text: string;
  score: number; // 25, 50, 75, or 100
  competencyWeight?: Partial<Record<MentalPillarCompetency, number>>;
}

export interface ScenarioQuestion {
  id: string;
  type: 'scenario';
  competency: MentalPillarCompetency;
  week: 1 | 2 | 3 | 4;
  title: string;
  scenario: string;
  options: QuestionOption[];
}

export interface SliderQuestion {
  id: string;
  type: 'slider';
  competency: MentalPillarCompetency;
  week: 1 | 2 | 3 | 4;
  title: string;
  description: string;
  minLabel: string;
  maxLabel: string;
  min: number;
  max: number;
}

export type AssessmentQuestion = ScenarioQuestion | SliderQuestion;

// =============================================
// RESPONSE TYPES
// =============================================

export interface QuestionResponse {
  question_id: string;
  answer_id?: string; // For scenario questions
  value?: number; // For slider questions
  score: number; // Calculated score 0-100
  competency: MentalPillarCompetency;
  answered_at: string;
}

// =============================================
// MIO FEEDBACK TYPES
// =============================================

export interface MIOFeedback {
  content: string;
  generated_at: string;
  focus_areas: MentalPillarCompetency[];
  predicted_challenge_week?: number;
  biggest_growth_area?: MentalPillarCompetency;
  still_needs_work?: MentalPillarCompetency;
}

// =============================================
// ASSESSMENT RECORD TYPES
// =============================================

export interface MentalPillarAssessment {
  id: string;
  user_id: string;
  assessment_phase: AssessmentPhase;
  attempt_number: number;
  source: AssessmentSource;
  source_context: Record<string, unknown>;
  invitation_id?: string;
  pillar_scores: PillarScores;
  baseline_assessment_id?: string;
  growth_deltas?: GrowthDeltas;
  responses: QuestionResponse[];
  mio_feedback?: MIOFeedback;
  confidence_score?: number;
  answer_quality_score?: number;
  started_at: string;
  completed_at?: string;
  time_to_complete_seconds?: number;
  created_at: string;
  updated_at: string;
}

// =============================================
// STATUS TYPES
// =============================================

export interface MentalPillarAssessmentStatus {
  has_baseline: boolean;
  baseline_id?: string;
  baseline_scores?: PillarScores;
  baseline_completed_at?: string;
  latest_id?: string;
  latest_phase?: AssessmentPhase;
  latest_scores?: PillarScores;
  latest_growth?: GrowthDeltas;
  latest_mio_feedback?: MIOFeedback;
  latest_completed_at?: string;
  user_attempts_used: number;
  user_attempts_remaining: number;
  last_attempt_at?: string;
  cooldown_ends_at?: string;
  can_retake_now: boolean;
  has_pending_invitation: boolean;
}

// =============================================
// USER PROFILE INTEGRATION
// =============================================

export interface MentalPillarProgress {
  baseline?: {
    assessment_id: string;
    scores: PillarScores;
    completed_at: string;
    attempt: number;
  };
  latest?: {
    assessment_id: string;
    phase: AssessmentPhase;
    scores: PillarScores;
    growth?: GrowthDeltas;
    completed_at: string;
    attempt: number;
    focus_areas?: MentalPillarCompetency[];
    mio_feedback?: MIOFeedback;
  };
  user_attempts_used: number;
  user_attempts_max: number;
  next_retake_available_at?: string;
}

// =============================================
// UI STATE TYPES
// =============================================

export interface AssessmentState {
  currentStep: number;
  totalSteps: number;
  phase: 'intro' | 'questions' | 'analyzing' | 'results';
  answers: Map<string, QuestionResponse>;
  startedAt: Date;
  isSubmitting: boolean;
  error?: string;
}

export interface AssessmentResultsState {
  assessment: MentalPillarAssessment;
  isLoadingFeedback: boolean;
  feedbackError?: string;
}

// =============================================
// N8N WEBHOOK TYPES
// =============================================

export interface MentalPillarWebhookPayload {
  user_id: string;
  assessment_id: string;
  assessment_phase: AssessmentPhase;
  scores: PillarScores;
  deltas?: GrowthDeltas;
  focus_areas: MentalPillarCompetency[];
  identity_collision_pattern?: string;
  user_name: string;
  baseline_scores?: PillarScores;
}

export interface MentalPillarWebhookResponse {
  success: boolean;
  mio_feedback?: MIOFeedback;
  error?: string;
}

// =============================================
// COMPETENCY METADATA
// =============================================

export interface CompetencyInfo {
  key: MentalPillarCompetency;
  label: string;
  shortLabel: string;
  description: string;
  week: number;
  color: string;
  icon: string;
}

export const COMPETENCY_INFO: Record<MentalPillarCompetency, CompetencyInfo> = {
  pattern_awareness: {
    key: 'pattern_awareness',
    label: 'Pattern Awareness',
    shortLabel: 'Patterns',
    description: 'Ability to notice automatic thoughts, mental loops, and stories before they influence behavior',
    week: 1,
    color: '#8b5cf6', // violet-500
    icon: '🔍',
  },
  identity_alignment: {
    key: 'identity_alignment',
    label: 'Identity Alignment',
    shortLabel: 'Identity',
    description: 'Recognition of old vs emerging identity and handling identity collision moments',
    week: 2,
    color: '#06b6d4', // cyan-500
    icon: '🎯',
  },
  belief_mastery: {
    key: 'belief_mastery',
    label: 'Belief Mastery',
    shortLabel: 'Beliefs',
    description: 'Awareness of limiting beliefs and ability to challenge conditioning',
    week: 3,
    color: '#f59e0b', // amber-500
    icon: '💡',
  },
  mental_resilience: {
    key: 'mental_resilience',
    label: 'Mental Resilience',
    shortLabel: 'Resilience',
    description: 'Stability under pressure, intentional responding, and full integration',
    week: 4,
    color: '#10b981', // emerald-500
    icon: '🛡️',
  },
};

// =============================================
// ASSESSMENT QUESTIONS DATA
// =============================================

export const MENTAL_PILLAR_QUESTIONS: AssessmentQuestion[] = [
  // Pattern Awareness (Week 1) - Questions 1-2
  {
    id: 'q1',
    type: 'scenario',
    competency: 'pattern_awareness',
    week: 1,
    title: 'The Short Message',
    scenario: 'A coworker sends you a short, blunt message. What happens in your mind FIRST?',
    options: [
      {
        id: 'q1_a',
        text: 'I immediately assume something is wrong and start worrying about what I did',
        score: 25,
      },
      {
        id: 'q1_b',
        text: 'I notice a slight tension but quickly create a story about why they might be upset',
        score: 50,
      },
      {
        id: 'q1_c',
        text: 'I notice my mind starting to react, pause, and remind myself this might just be their communication style',
        score: 75,
      },
      {
        id: 'q1_d',
        text: 'I read it neutrally, recognizing that a short message is just information — not a threat',
        score: 100,
      },
    ],
  },
  {
    id: 'q2',
    type: 'scenario',
    competency: 'pattern_awareness',
    week: 1,
    title: 'The Racing Mind',
    scenario: "You're in the middle of a stressful day and notice your mind racing. You typically...",
    options: [
      {
        id: 'q2_a',
        text: 'Get swept into the overwhelm — the racing thoughts feel impossible to stop',
        score: 25,
      },
      {
        id: 'q2_b',
        text: 'Try to push through and ignore the racing thoughts, hoping they go away',
        score: 50,
      },
      {
        id: 'q2_c',
        text: 'Notice the racing, take a breath, and try to slow down before continuing',
        score: 75,
      },
      {
        id: 'q2_d',
        text: 'Recognize the pattern immediately, use breath to interrupt, and choose my next focus intentionally',
        score: 100,
      },
    ],
  },

  // Identity Alignment (Week 2) - Questions 3-4
  {
    id: 'q3',
    type: 'scenario',
    competency: 'identity_alignment',
    week: 2,
    title: 'The Public Compliment',
    scenario: 'Someone compliments your work publicly. Your internal reaction is...',
    options: [
      {
        id: 'q3_a',
        text: 'Discomfort — I deflect, minimize, or feel like I don\'t deserve it',
        score: 25,
      },
      {
        id: 'q3_b',
        text: 'Awkwardness — I say thanks but inside I\'m questioning if they really mean it',
        score: 50,
      },
      {
        id: 'q3_c',
        text: 'Gratitude with slight hesitation — I accept it but notice old doubts trying to surface',
        score: 75,
      },
      {
        id: 'q3_d',
        text: 'Genuine acceptance — I receive it fully, knowing my work reflects who I\'m becoming',
        score: 100,
      },
    ],
  },
  {
    id: 'q4',
    type: 'scenario',
    competency: 'identity_alignment',
    week: 2,
    title: 'The Meeting Moment',
    scenario: "You're about to speak up in a meeting but feel hesitation. You...",
    options: [
      {
        id: 'q4_a',
        text: 'Stay silent — the hesitation feels like a signal that I shouldn\'t speak',
        score: 25,
      },
      {
        id: 'q4_b',
        text: 'Force myself to speak but feel shaky and unsure afterward',
        score: 50,
      },
      {
        id: 'q4_c',
        text: 'Recognize the hesitation as my old identity, pause, and speak from a calmer place',
        score: 75,
      },
      {
        id: 'q4_d',
        text: 'Feel the hesitation, acknowledge it as a collision moment, and speak with confidence anyway',
        score: 100,
      },
    ],
  },

  // Belief Mastery (Week 3) - Questions 5-6
  {
    id: 'q5',
    type: 'scenario',
    competency: 'belief_mastery',
    week: 3,
    title: 'The Critical Feedback',
    scenario: 'You receive critical feedback on something you worked hard on. The belief that surfaces is...',
    options: [
      {
        id: 'q5_a',
        text: '"I knew it — I\'m not good enough for this"',
        score: 25,
      },
      {
        id: 'q5_b',
        text: '"Maybe they\'re right — I probably shouldn\'t have tried"',
        score: 50,
      },
      {
        id: 'q5_c',
        text: 'I notice a limiting belief surfacing but can separate it from the actual feedback',
        score: 75,
      },
      {
        id: 'q5_d',
        text: '"This is information, not identity" — I extract what\'s useful without making it about my worth',
        score: 100,
      },
    ],
  },
  {
    id: 'q6',
    type: 'scenario',
    competency: 'belief_mastery',
    week: 3,
    title: 'The Help Question',
    scenario: "You notice you're holding back from asking for help. This is because...",
    options: [
      {
        id: 'q6_a',
        text: 'I believe asking for help means I\'m weak or incapable',
        score: 25,
      },
      {
        id: 'q6_b',
        text: 'I\'m worried about how others will perceive me if I admit I need support',
        score: 50,
      },
      {
        id: 'q6_c',
        text: 'I recognize this is old conditioning, though it still influences my decisions sometimes',
        score: 75,
      },
      {
        id: 'q6_d',
        text: 'I can clearly see this pattern as conditioning from my past — not my true identity',
        score: 100,
      },
    ],
  },

  // Mental Resilience (Week 4) - Questions 7-8
  {
    id: 'q7',
    type: 'scenario',
    competency: 'mental_resilience',
    week: 4,
    title: 'The Sharp Response',
    scenario: "Someone speaks to you sharply when you're already stressed. You...",
    options: [
      {
        id: 'q7_a',
        text: 'React immediately — their tone triggers my own sharp response',
        score: 25,
      },
      {
        id: 'q7_b',
        text: 'Hold back my reaction but feel it building inside, affecting my mood',
        score: 50,
      },
      {
        id: 'q7_c',
        text: 'Pause before responding, take a breath, and choose a calmer tone',
        score: 75,
      },
      {
        id: 'q7_d',
        text: 'Let my identity answer, not my emotions — I respond with intention regardless of their tone',
        score: 100,
      },
    ],
  },
  {
    id: 'q8',
    type: 'scenario',
    competency: 'mental_resilience',
    week: 4,
    title: 'The Overwhelm Wave',
    scenario: 'Multiple unexpected demands hit you at once. Your mind...',
    options: [
      {
        id: 'q8_a',
        text: 'Spirals into overwhelm — everything feels urgent and impossible',
        score: 25,
      },
      {
        id: 'q8_b',
        text: 'Gets scattered — I try to do everything at once and end up stressed',
        score: 50,
      },
      {
        id: 'q8_c',
        text: 'Notices the overwhelm, resets with a breath, and starts prioritizing',
        score: 75,
      },
      {
        id: 'q8_d',
        text: 'Stays centered — I recognize this as a test, reset quickly, and respond with clarity',
        score: 100,
      },
    ],
  },

  // Slider Questions 9-10
  {
    id: 'q9',
    type: 'slider',
    competency: 'pattern_awareness',
    week: 1,
    title: 'Pattern Catching',
    description: 'How often do you catch your mental patterns BEFORE they influence your behavior?',
    minLabel: 'Rarely — patterns usually run before I notice',
    maxLabel: 'Almost always — I catch them in real-time',
    min: 1,
    max: 10,
  },
  {
    id: 'q10',
    type: 'slider',
    competency: 'identity_alignment',
    week: 2,
    title: 'Identity Shifting',
    description: 'When your old identity shows up, how quickly can you shift to your aligned self?',
    minLabel: 'Very slowly — old identity often takes over',
    maxLabel: 'Very quickly — I can shift almost instantly',
    min: 1,
    max: 10,
  },
];

// =============================================
// SCORING HELPERS
// =============================================

export function calculateCompetencyScore(
  responses: QuestionResponse[],
  competency: MentalPillarCompetency
): number {
  const competencyResponses = responses.filter(r => r.competency === competency);
  if (competencyResponses.length === 0) return 0;

  const totalScore = competencyResponses.reduce((sum, r) => sum + r.score, 0);
  return Math.round(totalScore / competencyResponses.length);
}

export function calculatePillarScores(responses: QuestionResponse[]): PillarScores {
  const pattern_awareness = calculateCompetencyScore(responses, 'pattern_awareness');
  const identity_alignment = calculateCompetencyScore(responses, 'identity_alignment');
  const belief_mastery = calculateCompetencyScore(responses, 'belief_mastery');
  const mental_resilience = calculateCompetencyScore(responses, 'mental_resilience');

  // Weighted average for overall (equal weights)
  const overall = Math.round(
    (pattern_awareness + identity_alignment + belief_mastery + mental_resilience) / 4
  );

  return {
    pattern_awareness,
    identity_alignment,
    belief_mastery,
    mental_resilience,
    overall,
  };
}

export function calculateGrowthDeltas(
  currentScores: PillarScores,
  baselineScores: PillarScores
): GrowthDeltas {
  return {
    pattern_awareness: currentScores.pattern_awareness - baselineScores.pattern_awareness,
    identity_alignment: currentScores.identity_alignment - baselineScores.identity_alignment,
    belief_mastery: currentScores.belief_mastery - baselineScores.belief_mastery,
    mental_resilience: currentScores.mental_resilience - baselineScores.mental_resilience,
    overall: currentScores.overall - baselineScores.overall,
  };
}

export function getFocusAreas(scores: PillarScores): MentalPillarCompetency[] {
  const competencies: { key: MentalPillarCompetency; score: number }[] = [
    { key: 'pattern_awareness', score: scores.pattern_awareness },
    { key: 'identity_alignment', score: scores.identity_alignment },
    { key: 'belief_mastery', score: scores.belief_mastery },
    { key: 'mental_resilience', score: scores.mental_resilience },
  ];

  // Sort by score ascending (lowest first)
  competencies.sort((a, b) => a.score - b.score);

  // Return lowest 2 competencies
  return competencies.slice(0, 2).map(c => c.key);
}

export function getBiggestGrowth(deltas: GrowthDeltas): MentalPillarCompetency {
  const competencies: { key: MentalPillarCompetency; delta: number }[] = [
    { key: 'pattern_awareness', delta: deltas.pattern_awareness },
    { key: 'identity_alignment', delta: deltas.identity_alignment },
    { key: 'belief_mastery', delta: deltas.belief_mastery },
    { key: 'mental_resilience', delta: deltas.mental_resilience },
  ];

  competencies.sort((a, b) => b.delta - a.delta);
  return competencies[0].key;
}

// =============================================
// COLOR SCHEME
// =============================================

export const MENTAL_PILLAR_COLORS = {
  primary: '#7c3aed', // Deep Violet
  primaryLight: '#a78bfa', // Soft Purple
  accent: '#fac832', // Mind Gold
  background: {
    start: '#0A1628', // Navy
    end: '#1e1b4b', // Dark violet
  },
  success: '#10b981', // Emerald (growth)
  competencies: {
    pattern_awareness: '#8b5cf6',
    identity_alignment: '#06b6d4',
    belief_mastery: '#f59e0b',
    mental_resilience: '#10b981',
  },
} as const;
