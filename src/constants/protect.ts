// P.R.O.T.E.C.T. Methodology Constants - Adapted for React Web

export const PRACTICE_TYPES = {
  PATTERN_CHECK: 'P',
  REINFORCE_IDENTITY: 'R',
  OUTCOME_VISUALIZATION: 'O',
  TRIGGER_RESET: 'T',
  ENERGY_AUDIT: 'E',
  CELEBRATE_WINS: 'C',
  TOMORROW_SETUP: 'T2',
} as const;

export const POINTS_CONFIG = {
  [PRACTICE_TYPES.PATTERN_CHECK]: 4,
  [PRACTICE_TYPES.REINFORCE_IDENTITY]: 3,
  [PRACTICE_TYPES.OUTCOME_VISUALIZATION]: 3,
  [PRACTICE_TYPES.TRIGGER_RESET]: 2,
  [PRACTICE_TYPES.ENERGY_AUDIT]: 4,
  [PRACTICE_TYPES.CELEBRATE_WINS]: 2,
  [PRACTICE_TYPES.TOMORROW_SETUP]: 2,
} as const;

export const TOTAL_DAILY_POINTS = 20;
export const TOTAL_CHALLENGE_POINTS = 600; // 30 days * 20 points
export const MONEY_BACK_THRESHOLD = 0.8; // 80%
export const MONEY_BACK_POINTS = TOTAL_CHALLENGE_POINTS * MONEY_BACK_THRESHOLD; // 480 points

export const TIME_WINDOWS = {
  CHAMPIONSHIP_SETUP: {
    name: 'Championship Setup',
    practices: [PRACTICE_TYPES.PATTERN_CHECK, PRACTICE_TYPES.REINFORCE_IDENTITY, PRACTICE_TYPES.OUTCOME_VISUALIZATION],
    startHour: 3,
    endHour: 10,
    label: 'MORNING (3-10 AM)',
    description: 'Set up your day for championship performance',
  },
  NASCAR_PIT_STOP: {
    name: 'NASCAR Pit Stop',
    practices: [PRACTICE_TYPES.TRIGGER_RESET, PRACTICE_TYPES.ENERGY_AUDIT],
    startHour: 10,
    endHour: 15,
    label: 'MIDDAY (10 AM-3 PM)',
    description: 'Reset and recharge during your midday pit stop',
  },
  VICTORY_LAP: {
    name: 'Victory Lap',
    practices: [PRACTICE_TYPES.CELEBRATE_WINS, PRACTICE_TYPES.TOMORROW_SETUP],
    startHour: 15,
    endHour: 22,
    label: 'EVENING (3-10 PM)',
    description: 'Celebrate wins and prepare for tomorrow\'s championship',
  },
} as const;

export const CHAMPIONSHIP_LEVELS = {
  BRONZE: { min: 0, max: 150, name: 'Bronze', color: '#CD7F32' },
  SILVER: { min: 151, max: 300, name: 'Silver', color: '#C0C0C0' },
  GOLD: { min: 301, max: 450, name: 'Gold', color: '#FFD700' },
  PLATINUM: { min: 451, max: 600, name: 'Platinum', color: '#E5E4E2' },
} as const;

export const COLLISION_TYPES = [
  { value: 'past_prison', label: 'Past Prison' },
  { value: 'compass_crisis', label: 'Compass Crisis' },
  { value: 'success_sabotage', label: 'Success Sabotage' },
] as const;

export const RESET_METHODS = [
  { value: '4-7-8_breathing', label: '4-7-8 Breathing', description: 'Breathe in for 4, hold for 7, out for 8' },
  { value: 'body_reset', label: 'Body Reset', description: 'Physical movement to reset state' },
  { value: 'reframe_question', label: 'Reframe Question', description: 'Ask empowering questions' },
] as const;

export const BACKGROUND_AUDIO_OPTIONS = [
  { value: '1', label: 'Relaxing Meditation 1', icon: '🌿', url: 'https://hpyodaugrkctagkrfofj.supabase.co/storage/v1/object/public/audiosrelax/1.mp3' },
  { value: '2', label: 'Calming Sounds 2', icon: '🌊', url: 'https://hpyodaugrkctagkrfofj.supabase.co/storage/v1/object/public/audiosrelax/2.mp3' },
  { value: '3', label: 'Peaceful Meditation 3', icon: '🎵', url: 'https://hpyodaugrkctagkrfofj.supabase.co/storage/v1/object/public/audiosrelax/3.mp3' },
  { value: '4', label: 'Tranquil Ambience 4', icon: '🧘', url: 'https://hpyodaugrkctagkrfofj.supabase.co/storage/v1/object/public/audiosrelax/4.mp3' },
  { value: 'silence', label: 'Silence', icon: '🤫', url: null },
] as const;

export const VICTORY_CELEBRATIONS = [
  { value: 'victory_pose', label: 'Victory Pose', icon: '🏆', description: 'Strike a power pose for 30 seconds' },
  { value: 'champion_affirmation', label: 'Champion Affirmation', icon: '💪', description: 'Say "I am a champion" 3 times' },
  { value: 'victory_dance', label: 'Victory Dance', icon: '🎵', description: 'Dance for 30 seconds' },
  { value: 'self_high_five', label: 'Self High-Five', icon: '🙌', description: 'Give yourself a high-five' },
  { value: 'champion_breath', label: 'Champion Breath', icon: '💨', description: 'Take 3 deep champion breaths' },
] as const;

export const ENERGY_DRAINS_QUICK_PICKS = [
  'Social media',
  'Negative self-talk',
  'Poor sleep',
  'Unhealthy food',
  'Toxic relationships',
  'Procrastination',
  'Multitasking',
  'Lack of boundaries',
] as const;

export const ENERGY_BOOSTERS_QUICK_PICKS = [
  'Morning sunlight',
  'Deep breathing',
  'Exercise',
  'Healthy meals',
  'Quality sleep',
  'Positive affirmations',
  'Nature time',
  'Meditation',
] as const;

export const AUDIO_DURATIONS = {
  IDENTITY_RECORDING: 30, // seconds - recommended minimum (not mandatory)
  IDENTITY_RECORDING_MAX: 120, // seconds - hidden max limit (2 minutes)
  MEDITATION: 30, // seconds
} as const;

export const PRACTICE_LABELS = {
  [PRACTICE_TYPES.PATTERN_CHECK]: 'Pattern Check',
  [PRACTICE_TYPES.REINFORCE_IDENTITY]: 'Reinforce Identity',
  [PRACTICE_TYPES.OUTCOME_VISUALIZATION]: 'Outcome Visualization',
  [PRACTICE_TYPES.TRIGGER_RESET]: 'Trigger Reset',
  [PRACTICE_TYPES.ENERGY_AUDIT]: 'Energy Audit',
  [PRACTICE_TYPES.CELEBRATE_WINS]: 'Celebrate Wins',
  [PRACTICE_TYPES.TOMORROW_SETUP]: 'Tomorrow Setup',
} as const;

export const PRACTICE_DESCRIPTIONS = {
  [PRACTICE_TYPES.PATTERN_CHECK]: 'Identify and reframe negative thought patterns',
  [PRACTICE_TYPES.REINFORCE_IDENTITY]: 'Write and record your I AM statement',
  [PRACTICE_TYPES.OUTCOME_VISUALIZATION]: 'Visualize your desired outcome',
  [PRACTICE_TYPES.TRIGGER_RESET]: 'Interrupt old patterns with championship responses',
  [PRACTICE_TYPES.ENERGY_AUDIT]: 'Track and optimize your energy levels',
  [PRACTICE_TYPES.CELEBRATE_WINS]: 'Acknowledge your victories and progress',
  [PRACTICE_TYPES.TOMORROW_SETUP]: 'Prepare your mind and strategy for tomorrow',
} as const;

export const MILESTONES = [
  { days: 3, name: 'Weak Warrior', description: 'Completed your first 3 days' },
  { days: 7, name: 'Momentum Builder', description: 'One week of transformation' },
  { days: 14, name: 'Streak Master', description: 'Two weeks of consistency' },
  { days: 21, name: 'Habit Hero', description: 'Three weeks of new identity' },
  { days: 30, name: 'Championship Complete', description: 'Full 30-day transformation' },
] as const;

// N8N Webhook for audio transcription
export const N8N_WEBHOOK_URL = 'https://purposewaze.app.n8n.cloud/webhook/audioreceiver';

// Type definitions for TypeScript usage
export type PracticeType = typeof PRACTICE_TYPES[keyof typeof PRACTICE_TYPES];
export type TimeWindowKey = keyof typeof TIME_WINDOWS;
export type ChampionshipLevel = keyof typeof CHAMPIONSHIP_LEVELS;
export type CollisionType = typeof COLLISION_TYPES[number]['value'];
export type ResetMethod = typeof RESET_METHODS[number]['value'];
export type VictoryCelebration = typeof VICTORY_CELEBRATIONS[number]['value'];