/**
 * RKPI Module: Utility Functions
 * Score display, color coding, week calculation, trend helpers.
 */

import type {
  RelationshipKPIName,
  ScoreCategory,
  TrendDirection,
  RelationshipCheckIn,
  KPIDefinition,
} from '@/types/relationship-kpis';
import { KPI_DEFINITIONS } from '@/types/relationship-kpis';

// ============================================================================
// Score Color & Category
// ============================================================================

export interface ScoreStyle {
  bg: string;
  text: string;
  border: string;
  label: string;
}

const SCORE_STYLES: Record<ScoreCategory, ScoreStyle> = {
  critical: {
    bg: 'bg-red-500/20',
    text: 'text-red-400',
    border: 'border-red-500/30',
    label: 'Critical',
  },
  needs_attention: {
    bg: 'bg-orange-500/20',
    text: 'text-orange-400',
    border: 'border-orange-500/30',
    label: 'Needs Attention',
  },
  good: {
    bg: 'bg-yellow-500/20',
    text: 'text-yellow-400',
    border: 'border-yellow-500/30',
    label: 'Good',
  },
  excellent: {
    bg: 'bg-emerald-500/20',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    label: 'Excellent',
  },
  unknown: {
    bg: 'bg-gray-500/20',
    text: 'text-gray-400',
    border: 'border-gray-500/30',
    label: 'Unknown',
  },
};

/** Get the score category from a 1-10 score */
export function getScoreCategory(score: number): ScoreCategory {
  if (score >= 9) return 'excellent';
  if (score >= 7) return 'good';
  if (score >= 4) return 'needs_attention';
  if (score >= 1) return 'critical';
  return 'unknown';
}

/** Get color/style info for a score */
export function getScoreStyle(score: number): ScoreStyle {
  return SCORE_STYLES[getScoreCategory(score)];
}

/** Get style by category directly */
export function getCategoryStyle(category: ScoreCategory): ScoreStyle {
  return SCORE_STYLES[category];
}

/** Format score for display (e.g., "7.5" or "—" for null) */
export function formatScore(score: number | null): string {
  if (score === null || score === undefined) return '—';
  return Number.isInteger(score) ? score.toString() : score.toFixed(1);
}

// ============================================================================
// Week Calculation (matches SQL: IYYY-WNN)
// ============================================================================

/** Get ISO week number for a date */
function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/** Get ISO year for week numbering */
function getISOYear(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  return d.getUTCFullYear();
}

/** Get current week in YYYY-WNN format (matches SQL calculate_relationship_week_number) */
export function getCurrentWeek(date: Date = new Date()): string {
  const year = getISOYear(date);
  const week = getISOWeek(date);
  return `${year}-W${week.toString().padStart(2, '0')}`;
}

// ============================================================================
// Trend Helpers
// ============================================================================

/** Calculate trend direction from two scores */
export function getTrendDirection(current: number, previous: number): TrendDirection {
  const diff = current - previous;
  if (diff > 0.5) return 'improving';
  if (diff < -0.5) return 'declining';
  return 'stable';
}

/** Get trend arrow character */
export function getTrendArrow(direction: TrendDirection | null): string {
  switch (direction) {
    case 'improving': return '↑';
    case 'declining': return '↓';
    case 'stable': return '→';
    default: return '—';
  }
}

/** Get trend color class */
export function getTrendColor(direction: TrendDirection | null): string {
  switch (direction) {
    case 'improving': return 'text-emerald-400';
    case 'declining': return 'text-red-400';
    case 'stable': return 'text-gray-400';
    default: return 'text-gray-500';
  }
}

// ============================================================================
// Streak & Check-In Helpers
// ============================================================================

/** Calculate consecutive week streak from check-in history (sorted newest first) */
export function getStreakFromHistory(checkIns: RelationshipCheckIn[]): number {
  if (checkIns.length === 0) return 0;

  const completedWeeks = checkIns
    .filter((ci) => ci.status === 'completed')
    .map((ci) => ci.check_in_week)
    .sort()
    .reverse();

  if (completedWeeks.length === 0) return 0;

  const currentWeek = getCurrentWeek();
  let streak = 0;
  let expectedWeek = currentWeek;

  for (const week of completedWeeks) {
    if (week === expectedWeek) {
      streak++;
      expectedWeek = getPreviousWeek(expectedWeek);
    } else if (streak === 0 && week === getPreviousWeek(currentWeek)) {
      // Allow starting streak from last week if current week not done yet
      streak = 1;
      expectedWeek = getPreviousWeek(week);
    } else {
      break;
    }
  }

  return streak;
}

/** Get the previous week string (YYYY-WNN) */
function getPreviousWeek(weekStr: string): string {
  const [yearStr, weekPart] = weekStr.split('-W');
  let year = parseInt(yearStr, 10);
  let week = parseInt(weekPart, 10);

  week--;
  if (week < 1) {
    year--;
    // ISO weeks: last week of previous year is typically 52 or 53
    const dec31 = new Date(year, 11, 31);
    week = getISOWeek(dec31);
  }

  return `${year}-W${week.toString().padStart(2, '0')}`;
}

/** Check if a check-in has been completed this week */
export function isCheckInDueThisWeek(checkIns: RelationshipCheckIn[]): boolean {
  const currentWeek = getCurrentWeek();
  return !checkIns.some(
    (ci) => ci.check_in_week === currentWeek && ci.status === 'completed'
  );
}

// ============================================================================
// KPI Lookup Helpers
// ============================================================================

/** Get KPI definition by name */
export function getKPIDefinition(name: RelationshipKPIName): KPIDefinition {
  return KPI_DEFINITIONS.find((d) => d.name === name) ?? KPI_DEFINITIONS[0];
}

/** Get KPI label by name */
export function getKPILabel(name: RelationshipKPIName): string {
  return getKPIDefinition(name).label;
}

/** Calculate overall score from a record of scores */
export function calculateOverallScore(
  scores: Partial<Record<RelationshipKPIName, number>>
): number | null {
  const values = Object.values(scores).filter((v): v is number => v !== undefined && v !== null);
  if (values.length === 0) return null;
  const sum = values.reduce((a, b) => a + b, 0);
  return Math.round((sum / values.length) * 10) / 10;
}

// ============================================================================
// localStorage Draft Persistence
// ============================================================================

const DRAFT_KEY = 'rkpi_check_in_draft';

export function saveDraft<T>(data: T): void {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

export function loadDraft<T>(): T | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // silently fail
  }
}
