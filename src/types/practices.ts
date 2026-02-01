/**
 * PROTECT Practices Type Definitions
 * Mind Insurance Challenge - Core Practice System
 */

// Core Practice Types
export type PracticeType = 'P' | 'R' | 'O' | 'T' | 'E' | 'C' | 'T2';

export type ChampionshipLevel = 'bronze' | 'silver' | 'gold' | 'platinum';

export type TimeWindow = 'CHAMPIONSHIP_SETUP' | 'NASCAR_PIT_STOP' | 'VICTORY_LAP';

// Practice Data Interface - All fields for PROTECT practices
export interface PracticeData {
  // Pattern Check (P) - Catch identity collisions
  caught_pattern?: boolean;
  collision_type?: string;
  custom_pattern?: string;
  situation_description?: string;
  reframe_description?: string;

  // Reinforce Identity (R) - Champion declaration
  identity_statement?: string;
  recording_id?: string;
  recording_duration?: number;

  // Outcome Visualization (O) - Future self imagery
  outcome_description?: string;
  background_audio?: string;
  meditation_completed?: boolean;

  // Trigger Reset (T) - Reprogram responses
  trigger_description?: string;
  intensity_level?: number;
  old_response?: string;
  reset_method?: string;
  new_response?: string;

  // Energy Audit (E) - Optimize championship fuel
  energy_level?: number;
  energy_drains?: string[];
  energy_boosters?: string[];
  eliminate_commitment?: string;
  add_commitment?: string;
  optimize_commitment?: string;
  energy_insights?: string;

  // Celebrate Wins (C) - Victory acknowledgment
  championship_win?: string;
  micro_victory?: string;
  future_self_evidence?: string;
  championship_gratitude?: string;
  victory_celebration?: string;

  // Tomorrow Setup (T2) - Championship preparation
  tomorrow_goal?: string;
  morning_routine?: string;
  trigger_prevention?: string;
  success_visualization?: string;
  mindset_declaration?: string;
}

// Daily Practice Record
export interface DailyPractice {
  id: string;
  user_id: string;
  practice_date: string; // ISO date format
  practice_type: PracticeType;
  completed: boolean;
  completed_at?: string; // ISO timestamp
  points_earned: number;
  is_late: boolean;
  data: PracticeData;
  created_at: string;
  updated_at?: string;
}

// Voice Recording for identity reinforcement
export interface VoiceRecording {
  id: string;
  user_id: string;
  practice_id?: string;
  recording_url: string;
  recording_duration: number; // in seconds
  transcription_text?: string;
  recording_type: 'identity' | 'celebration' | 'other';
  created_at: string;
}

// ============================================================================
// MIO v3.0 - SESSION TELEMETRY TYPES (Capabilities 16-33)
// ============================================================================

/**
 * Voice metadata captured during recording (Capability 29)
 * Used by MIO to detect confidence, hesitation, and emotional patterns
 */
export interface VoiceMetadata {
  durationSeconds: number;
  restartCount: number;
  pauseTimestamps: number[];
  pauseCount: number;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  recordingStartTime: string;
  recordingEndTime: string;
  totalSessionTimeMs: number;
  audioFormat: string;
  estimatedSpeechRate?: 'slow' | 'normal' | 'fast';
  confidenceIndicators: string[];
  hesitationRatio: number;
}

/**
 * Keystroke metrics from typing patterns (Capability 16)
 */
export interface KeystrokeMetrics {
  totalKeystrokes: number;
  avgDwellTimeMs: number;
  avgFlightTimeMs: number;
  rhythmConsistency: number;
  typingSignature: string;
}

/**
 * Pause patterns during practice completion (Capability 17)
 */
export interface PausePatterns {
  totalPauses: number;
  avgPauseDurationMs: number;
  microHesitationCount: number;
  thinkingPauseCount: number;
  extendedPauseCount: number;
  pauseBeforeTriggers: string[];
  longestPauseContext: string;
}

/**
 * Session telemetry for behavioral analysis
 * Captured invisibly during practice completion
 */
export interface SessionTelemetry {
  sessionId: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  sessionDurationMs: number;
  startTime: string;
  endTime: string;

  // Typing behavior (Capabilities 16-18)
  keystrokeMetrics?: KeystrokeMetrics;
  pausePatterns?: PausePatterns;
  correctionRate?: number;

  // Response timing (Capability 19)
  fieldLatencies?: {
    fieldId: string;
    latencyMs: number;
  }[];

  // Session energy (Capability 21)
  sessionEnergy?: {
    startEnergy: number;
    midEnergy: number;
    endEnergy: number;
    trajectoryType: string;
  };

  // Cognitive load score (Capability 26)
  cognitiveLoadScore?: number;
  cognitiveLoadIndicators?: string[];

  // Voice metadata if recording was made (Capability 29)
  voiceMetadata?: VoiceMetadata;
}

/**
 * Extended practice data including MIO v3.0 telemetry
 * This is what gets stored in enriched_practice_data JSONB
 */
export interface EnrichedPracticeData {
  // Original practice data
  practiceData: PracticeData;

  // MIO v3.0 - Session telemetry for behavioral analysis
  sessionTelemetry?: SessionTelemetry;

  // Context about the practice session
  practiceContext?: {
    challengeDay?: number;
    reportWeek?: number;
    streakDay?: number;
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    isWeekend: boolean;
  };
}

// Practice Streak Tracking
export interface PracticeStreak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_practice_date: string;
  streak_broken?: boolean;
  updated_at: string;
}

// Practice Status for UI State
export interface PracticeStatus {
  type: PracticeType;
  completed: boolean;
  points: number;
  isLate: boolean; // Kept for backward compatibility, always false
  isAvailable: boolean;
  deadline: Date;
}

// Time Window Status
export interface TimeWindowStatus {
  name: string;
  window: TimeWindow;
  practices: PracticeStatus[];
  isActive: boolean;
  isMissed: boolean;
  timeRemaining: string;
  totalPoints: number;
  earnedPoints: number;
  startTime: string;
  endTime: string;
}

// Practice Metadata
export interface PracticeMetadata {
  type: PracticeType;
  name: string;
  description: string;
  points: number; // Simplified - no late penalty
  estimatedDuration: number; // in minutes
  requiredFields: (keyof PracticeData)[];
  optionalFields?: (keyof PracticeData)[];
}

// Practice Configuration Map
export const PRACTICE_CONFIG: Record<PracticeType, PracticeMetadata> = {
  P: {
    type: 'P',
    name: 'Pattern Check',
    description: 'Catch identity collisions and reframe them',
    points: 4,
    estimatedDuration: 5,
    requiredFields: ['caught_pattern', 'collision_type', 'situation_description', 'reframe_description'],
    optionalFields: ['custom_pattern']
  },
  R: {
    type: 'R',
    name: 'Reinforce Identity',
    description: 'Record your champion declaration',
    points: 3,
    estimatedDuration: 3,
    requiredFields: ['identity_statement', 'recording_id', 'recording_duration']
  },
  O: {
    type: 'O',
    name: 'Outcome Visualization',
    description: 'Visualize your champion future',
    points: 3,
    estimatedDuration: 10,
    requiredFields: ['outcome_description', 'meditation_completed'],
    optionalFields: ['background_audio']
  },
  T: {
    type: 'T',
    name: 'Trigger Reset',
    description: 'Reprogram automatic responses',
    points: 2,
    estimatedDuration: 7,
    requiredFields: ['trigger_description', 'intensity_level', 'old_response', 'reset_method', 'new_response']
  },
  E: {
    type: 'E',
    name: 'Energy Audit',
    description: 'Optimize your championship fuel',
    points: 4,
    estimatedDuration: 8,
    requiredFields: ['energy_level', 'energy_drains', 'energy_boosters', 'eliminate_commitment', 'add_commitment'],
    optionalFields: ['optimize_commitment', 'energy_insights']
  },
  C: {
    type: 'C',
    name: 'Celebrate Wins',
    description: 'Acknowledge your victories',
    points: 2,
    estimatedDuration: 5,
    requiredFields: ['championship_win', 'micro_victory', 'future_self_evidence'],
    optionalFields: ['championship_gratitude', 'victory_celebration']
  },
  T2: {
    type: 'T2',
    name: 'Tomorrow Setup',
    description: 'Prepare for championship success',
    points: 2,
    estimatedDuration: 5,
    requiredFields: ['tomorrow_goal', 'morning_routine', 'trigger_prevention'],
    optionalFields: ['success_visualization', 'mindset_declaration']
  }
};

// Practice Schedule Configuration
export interface PracticeSchedule {
  window: TimeWindow;
  startHour: number;
  endHour: number;
  practices: PracticeType[];
  maxPoints: number;
}

export const DAILY_SCHEDULE: PracticeSchedule[] = [
  {
    window: 'CHAMPIONSHIP_SETUP',
    startHour: 3,
    endHour: 10,
    practices: ['P', 'R', 'O'],
    maxPoints: 10 // P(4) + R(3) + O(3)
  },
  {
    window: 'NASCAR_PIT_STOP',
    startHour: 10,
    endHour: 15,
    practices: ['T', 'E'],
    maxPoints: 6 // T(2) + E(4)
  },
  {
    window: 'VICTORY_LAP',
    startHour: 15,
    endHour: 22,
    practices: ['C', 'T2'],
    maxPoints: 4 // C(2) + T2(2)
  }
];

// Practice Completion Status
export interface PracticeCompletionStatus {
  userId: string;
  date: string;
  totalPossiblePoints: number;
  totalEarnedPoints: number;
  completionPercentage: number;
  windowsCompleted: number;
  totalWindows: number;
  practicesCompleted: PracticeType[];
  practicesMissed: PracticeType[];
  isFullyComplete: boolean;
}

// Weekly Practice Summary
export interface WeeklyPracticeSummary {
  userId: string;
  weekNumber: number;
  startDate: string;
  endDate: string;
  totalPoints: number;
  averageCompletionRate: number;
  bestDay: string;
  worstDay: string;
  mostConsistentPractice: PracticeType;
  leastConsistentPractice: PracticeType;
  streakDays: number;
}

// Practice Analytics
export interface PracticeAnalytics {
  userId: string;
  periodStart: string;
  periodEnd: string;
  totalPractices: number;
  completionRate: number;
  averagePoints: number;
  practiceBreakdown: Record<PracticeType, {
    completed: number;
    missed: number;
    completionRate: number;
    averagePoints: number;
  }>;
  timeWindowPerformance: Record<TimeWindow, {
    completionRate: number;
    averagePoints: number;
  }>;
  trends: {
    improving: boolean;
    consistencyScore: number;
    projectedChampionshipLevel: ChampionshipLevel;
  };
}

// Practice Reminder Settings
export interface PracticeReminderSettings {
  userId: string;
  enabledReminders: {
    championshipSetup: boolean;
    nascarPitStop: boolean;
    victoryLap: boolean;
  };
  reminderTiming: {
    championshipSetup: number; // minutes before window
    nascarPitStop: number;
    victoryLap: number;
  };
  notificationChannels: {
    push: boolean;
    email: boolean;
    sms: boolean;
  };
  customReminders?: {
    time: string;
    message: string;
    enabled: boolean;
  }[];
}

// Practice Validation Result
export interface PracticeValidationResult {
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
  missingRequiredFields?: (keyof PracticeData)[];
  invalidFieldValues?: Partial<Record<keyof PracticeData, string>>;
}

// Export utility function type for practice validation
export type ValidatePracticeData = (
  practiceType: PracticeType,
  data: Partial<PracticeData>
) => PracticeValidationResult;

// Export utility function type for point calculation
// Note: isLate parameter kept for backward compatibility but ignored
export type CalculatePracticePoints = (
  practiceType: PracticeType,
  isLate: boolean
) => number;