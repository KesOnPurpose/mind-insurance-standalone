/**
 * Assessment Storage Utility
 * Handles localStorage backup for assessment progress to prevent data loss
 * Saves after each answer, restores on page load, cleans up after submission
 */

export interface AssessmentProgress {
  userId?: string;
  guestId?: string;
  currentStep: number;
  answers: Record<string, any>;
  timestamp: string;
  assessmentType: string;
}

// Storage key generator
const getStorageKey = (userId?: string): string => {
  if (userId) {
    return `assessment_progress_${userId}`;
  }
  // For guest users, use a stable key based on session
  const guestId = getOrCreateGuestId();
  return `assessment_progress_guest_${guestId}`;
};

// Get or create a stable guest ID for the session
const getOrCreateGuestId = (): string => {
  const GUEST_ID_KEY = 'assessment_guest_id';
  let guestId = localStorage.getItem(GUEST_ID_KEY);

  if (!guestId) {
    // Create a timestamp-based ID that persists for the session
    guestId = Date.now().toString();
    localStorage.setItem(GUEST_ID_KEY, guestId);
  }

  return guestId;
};

// Save assessment progress to localStorage
export const saveAssessmentProgress = (
  currentStep: number,
  answers: Record<string, any>,
  userId?: string,
  assessmentType: string = 'group_home_readiness'
): void => {
  try {
    const progress: AssessmentProgress = {
      userId,
      guestId: !userId ? getOrCreateGuestId() : undefined,
      currentStep,
      answers,
      timestamp: new Date().toISOString(),
      assessmentType
    };

    const key = getStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(progress));
  } catch (error) {
    // Handle localStorage quota exceeded or other errors
    console.error('Failed to save assessment progress:', error);
    // Don't throw - we want the assessment to continue even if storage fails
  }
};

// Load saved assessment progress from localStorage
export const loadAssessmentProgress = (userId?: string): AssessmentProgress | null => {
  try {
    const key = getStorageKey(userId);
    const stored = localStorage.getItem(key);

    if (!stored) {
      return null;
    }

    const progress = JSON.parse(stored) as AssessmentProgress;

    // Validate the loaded data
    if (
      typeof progress.currentStep !== 'number' ||
      typeof progress.answers !== 'object' ||
      !progress.timestamp
    ) {
      console.warn('Invalid assessment progress data in localStorage');
      return null;
    }

    return progress;
  } catch (error) {
    console.error('Failed to load assessment progress:', error);
    // Clear corrupted data
    clearAssessmentProgress(userId);
    return null;
  }
};

// Clear assessment progress from localStorage
export const clearAssessmentProgress = (userId?: string): void => {
  try {
    const key = getStorageKey(userId);
    localStorage.removeItem(key);

    // Also clear guest ID if this was a guest user who completed
    if (!userId) {
      localStorage.removeItem('assessment_guest_id');
    }
  } catch (error) {
    console.error('Failed to clear assessment progress:', error);
  }
};

// Check if there's saved progress and how old it is
export const checkSavedProgress = (userId?: string): {
  hasProgress: boolean;
  minutesAgo?: number;
  timeAgo?: string;
} => {
  const progress = loadAssessmentProgress(userId);

  if (!progress) {
    return { hasProgress: false };
  }

  const savedTime = new Date(progress.timestamp);
  const now = new Date();
  const minutesAgo = Math.floor((now.getTime() - savedTime.getTime()) / (1000 * 60));

  let timeAgo: string;
  if (minutesAgo < 1) {
    timeAgo = 'just now';
  } else if (minutesAgo === 1) {
    timeAgo = '1 minute ago';
  } else if (minutesAgo < 60) {
    timeAgo = `${minutesAgo} minutes ago`;
  } else {
    const hoursAgo = Math.floor(minutesAgo / 60);
    if (hoursAgo === 1) {
      timeAgo = '1 hour ago';
    } else if (hoursAgo < 24) {
      timeAgo = `${hoursAgo} hours ago`;
    } else {
      const daysAgo = Math.floor(hoursAgo / 24);
      if (daysAgo === 1) {
        timeAgo = '1 day ago';
      } else {
        timeAgo = `${daysAgo} days ago`;
      }
    }
  }

  return {
    hasProgress: true,
    minutesAgo,
    timeAgo
  };
};

// Migrate progress from guest to authenticated user
export const migrateGuestProgress = (newUserId: string): void => {
  try {
    // Try to load guest progress
    const guestProgress = loadAssessmentProgress();

    if (guestProgress) {
      // Save under the new user ID
      saveAssessmentProgress(
        guestProgress.currentStep,
        guestProgress.answers,
        newUserId,
        guestProgress.assessmentType
      );

      // Clear the guest progress
      clearAssessmentProgress();
    }
  } catch (error) {
    console.error('Failed to migrate guest progress:', error);
  }
};

// Clean up old assessment progress (older than 7 days)
export const cleanupOldProgress = (): void => {
  try {
    const keys = Object.keys(localStorage);
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    keys.forEach(key => {
      if (key.startsWith('assessment_progress_')) {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const progress = JSON.parse(stored) as AssessmentProgress;
            const savedTime = new Date(progress.timestamp);

            if (savedTime < sevenDaysAgo) {
              localStorage.removeItem(key);
              console.log(`Cleaned up old assessment progress: ${key}`);
            }
          }
        } catch (error) {
          // If we can't parse it, remove it
          localStorage.removeItem(key);
        }
      }
    });
  } catch (error) {
    console.error('Failed to cleanup old progress:', error);
  }
};