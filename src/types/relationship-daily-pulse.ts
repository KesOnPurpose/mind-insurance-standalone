/**
 * RIE Phase 1C: Daily Pulse Types
 * Quick 30-second daily emotional check-ins.
 *
 * Maps to: relationship_daily_pulses
 */

import type { RelationshipKPIName } from './relationship-kpis';

// ============================================================================
// Mood Emoji Mapping
// ============================================================================

export interface MoodOption {
  value: number;
  emoji: string;
  label: string;
}

export const MOOD_OPTIONS: MoodOption[] = [
  { value: 1, emoji: '😞', label: 'Struggling' },
  { value: 2, emoji: '😕', label: 'Low' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😊', label: 'Great' },
];

export const CONNECTION_OPTIONS: MoodOption[] = [
  { value: 1, emoji: '💔', label: 'Disconnected' },
  { value: 2, emoji: '🤝', label: 'Distant' },
  { value: 3, emoji: '🤲', label: 'Neutral' },
  { value: 4, emoji: '💛', label: 'Connected' },
  { value: 5, emoji: '❤️', label: 'Deeply Connected' },
];

// ============================================================================
// Table: relationship_daily_pulses
// ============================================================================

export interface RelationshipDailyPulse {
  id: string;
  user_id: string;
  partnership_id: string | null;
  pulse_date: string;
  mood_rating: number;
  connection_rating: number;
  micro_moment: string | null;
  gratitude_note: string | null;
  flagged_kpis: RelationshipKPIName[];
  shared_with_partner: boolean;
  created_at: string;
}

export interface DailyPulseInsert {
  partnership_id?: string | null;
  pulse_date?: string;
  mood_rating: number;
  connection_rating: number;
  micro_moment?: string | null;
  gratitude_note?: string | null;
  flagged_kpis?: RelationshipKPIName[];
  shared_with_partner?: boolean;
}

export interface DailyPulseUpdate {
  mood_rating?: number;
  connection_rating?: number;
  micro_moment?: string | null;
  gratitude_note?: string | null;
  flagged_kpis?: RelationshipKPIName[];
  shared_with_partner?: boolean;
}

// ============================================================================
// Composite / UI Types
// ============================================================================

/** Weekly pulse summary for dashboard widgets */
export interface PulseWeekSummary {
  weekStart: string;
  avgMood: number | null;
  avgConnection: number | null;
  pulseCount: number;
  flaggedKpis: RelationshipKPIName[];
}
