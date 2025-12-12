/**
 * Safe Date Utilities
 *
 * Safari/iOS-proof date formatting utilities.
 * These functions handle edge cases where Intl.DateTimeFormat fails
 * with certain timezone values or in specific browser contexts.
 */

/**
 * Get today's date in YYYY-MM-DD format, with Safari-safe fallback
 *
 * @param timezone - Optional timezone string (e.g., 'America/New_York')
 * @returns Date string in YYYY-MM-DD format
 */
export function getSafeTodayDate(timezone?: string): string {
  try {
    // Try to get browser's timezone if none provided
    const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';

    // Validate timezone is a non-empty string
    if (!tz || typeof tz !== 'string' || tz.trim() === '') {
      throw new Error('Invalid timezone');
    }

    return new Date().toLocaleDateString('en-CA', { timeZone: tz });
  } catch (error) {
    // Fallback for Safari/iOS edge cases where Intl.DateTimeFormat fails
    console.warn('[safeDateUtils] Date formatting fallback triggered:', error);
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

/**
 * Get the current hour in 24-hour format, with Safari-safe fallback
 *
 * @param timezone - Optional timezone string
 * @returns Hour as number (0-23)
 */
export function getSafeCurrentHour(timezone?: string): number {
  try {
    const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';

    if (!tz || typeof tz !== 'string' || tz.trim() === '') {
      throw new Error('Invalid timezone');
    }

    const formatter = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      hour12: false,
      timeZone: tz,
    });
    return parseInt(formatter.format(new Date()), 10);
  } catch (error) {
    console.warn('[safeDateUtils] Hour formatting fallback triggered:', error);
    return new Date().getHours();
  }
}

/**
 * Sanitize error messages for user display
 * Converts technical Safari/browser errors to user-friendly messages
 *
 * @param error - Error object or message
 * @returns User-friendly error message
 */
export function sanitizeErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  // Safari-specific errors
  if (
    message.includes("Can't find variable") ||
    message.includes('ReferenceError') ||
    message.includes('undefined is not an object') ||
    message.includes('null is not an object')
  ) {
    return 'There was a temporary issue. Please try again.';
  }

  // Network errors
  if (
    message.includes('NetworkError') ||
    message.includes('Failed to fetch') ||
    message.includes('Network request failed')
  ) {
    return 'Connection issue. Please check your internet and try again.';
  }

  // Timeout errors
  if (message.includes('timeout') || message.includes('Timeout')) {
    return 'The request took too long. Please try again.';
  }

  // Return original message if no sanitization needed
  // (but truncate if too long)
  if (message.length > 100) {
    return message.substring(0, 100) + '...';
  }

  return message;
}

export default {
  getSafeTodayDate,
  getSafeCurrentHour,
  sanitizeErrorMessage,
};
