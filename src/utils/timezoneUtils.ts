/**
 * Timezone Utilities for Mind Insurance
 *
 * Ensures consistent date handling across the app using the user's timezone
 * instead of UTC, which can cause date mismatches for users in different timezones.
 */

/**
 * Get today's date string in YYYY-MM-DD format using the specified timezone
 * Falls back to browser's timezone if none provided
 */
export function getTodayInTimezone(timezone?: string | null): string {
  const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  return new Date().toLocaleDateString('en-CA', { timeZone: tz });
}

/**
 * Get a date string in YYYY-MM-DD format for a specific Date object
 * using the specified timezone
 */
export function formatDateInTimezone(date: Date, timezone?: string | null): string {
  const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  return date.toLocaleDateString('en-CA', { timeZone: tz });
}

/**
 * Get the browser's default timezone
 */
export function getBrowserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Get a date N days ago in YYYY-MM-DD format using the specified timezone
 */
export function getDateDaysAgoInTimezone(daysAgo: number, timezone?: string | null): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return formatDateInTimezone(date, timezone);
}

/**
 * Get the start of the current week (Sunday) in YYYY-MM-DD format
 */
export function getStartOfWeekInTimezone(timezone?: string | null): string {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);
  return formatDateInTimezone(startOfWeek, timezone);
}
