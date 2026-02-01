/**
 * Practice Service - CRUD Operations for PROTECT Practices
 * Handles all database operations for the Mind Insurance Challenge practice system
 *
 * MIO v3.0 ENHANCEMENT:
 * Now includes session_telemetry for behavioral analysis
 * This enables capabilities 16-33 (keystroke dynamics, pause patterns, etc.)
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  DailyPractice,
  PracticeType,
  PracticeData,
  PracticeStreak,
  PracticeCompletionStatus,
  SessionTelemetry,
  VoiceMetadata,
  EnrichedPracticeData,
  PRACTICE_CONFIG,
  DAILY_SCHEDULE
} from '@/types/practices';

// Type for creating a new practice
export interface CreatePracticeData {
  user_id: string;
  practice_date: string;
  practice_type: PracticeType;
  data: PracticeData;
  completed?: boolean;
  completed_at?: string;
  /** MIO v3.0 - Session telemetry for behavioral analysis */
  session_telemetry?: SessionTelemetry;
  /** MIO v3.0 - Voice metadata from recording (if applicable) */
  voice_metadata?: VoiceMetadata;
}

// Type for user stats
export interface UserStats {
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  totalPractices: number;
  completionRate: number;
  averagePointsPerDay: number;
  championshipLevel: 'bronze' | 'silver' | 'gold' | 'platinum';
  practiceBreakdown: Record<PracticeType, {
    completed: number;
    totalPoints: number;
  }>;
}

/**
 * Get today's practices for a user
 * Returns all practices for the current day in the user's timezone
 */
export async function getTodayPractices(
  userId: string,
  userTimezone: string = 'America/Los_Angeles'
): Promise<DailyPractice[]> {
  try {
    // Get today's date in user's timezone
    const today = new Date().toLocaleDateString('en-CA', {
      timeZone: userTimezone
    }); // Returns YYYY-MM-DD format

    const { data, error } = await supabase
      .from('daily_practices')
      .select('*')
      .eq('user_id', userId)
      .eq('practice_date', today)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching today\'s practices:', error);
      throw error;
    }

    return (data as DailyPractice[]) || [];
  } catch (error) {
    console.error('Failed to get today\'s practices:', error);
    throw error;
  }
}

/**
 * Create a new practice entry
 * Validates data and calculates points before saving
 *
 * MIO v3.0: Now includes session_telemetry for behavioral analysis
 */
export async function createPractice(
  data: CreatePracticeData
): Promise<DailyPractice> {
  try {
    const {
      user_id,
      practice_date,
      practice_type,
      data: practiceData,
      session_telemetry,
      voice_metadata
    } = data;

    // Calculate points based on practice type (no late penalty)
    const points = calculatePracticePoints(practice_type, false);

    // MIO v3.0 - Build enriched practice data with telemetry
    const enrichedData = buildEnrichedPracticeData(
      practiceData,
      session_telemetry,
      voice_metadata
    );

    // Create the practice record
    const practiceRecord = {
      user_id,
      practice_date,
      practice_type,
      data: practiceData, // Original data for backward compatibility
      completed: data.completed ?? true,
      completed_at: data.completed_at ?? new Date().toISOString(),
      points_earned: points,
      is_late: false // Always false - no late penalties
    };

    const { data: newPractice, error } = await supabase
      .from('daily_practices')
      .insert(practiceRecord)
      .select()
      .single();

    if (error) {
      console.error('Error creating practice:', error);
      throw error;
    }

    // MIO v3.0 - Store enriched practice data to mio_practice_feedback if telemetry exists
    if (session_telemetry || voice_metadata) {
      await storePracticeTelemetry(
        user_id,
        newPractice.id,
        practice_type,
        enrichedData
      ).catch(err => {
        // Non-blocking - telemetry storage failure shouldn't fail practice creation
        console.warn('[createPractice] Failed to store telemetry:', err);
      });
    }

    return newPractice as DailyPractice;
  } catch (error) {
    console.error('Failed to create practice:', error);
    throw error;
  }
}

// ============================================================================
// MIO v3.0 - TELEMETRY HELPER FUNCTIONS
// ============================================================================

/**
 * Determine time of day category for circadian analysis
 */
function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/**
 * Build enriched practice data with MIO v3.0 telemetry
 */
function buildEnrichedPracticeData(
  practiceData: PracticeData,
  sessionTelemetry?: SessionTelemetry,
  voiceMetadata?: VoiceMetadata
): EnrichedPracticeData {
  const now = new Date();
  const dayOfWeek = now.getDay();

  const enrichedData: EnrichedPracticeData = {
    practiceData,
    practiceContext: {
      timeOfDay: getTimeOfDay(),
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6
    }
  };

  // Add session telemetry if available
  if (sessionTelemetry) {
    enrichedData.sessionTelemetry = {
      ...sessionTelemetry,
      // Add voice metadata to session telemetry if both exist
      voiceMetadata: voiceMetadata || sessionTelemetry.voiceMetadata
    };
  } else if (voiceMetadata) {
    // Create minimal session telemetry with just voice metadata
    enrichedData.sessionTelemetry = {
      sessionId: `voice-${Date.now()}`,
      deviceType: voiceMetadata.deviceType,
      sessionDurationMs: voiceMetadata.totalSessionTimeMs,
      startTime: voiceMetadata.recordingStartTime,
      endTime: voiceMetadata.recordingEndTime,
      voiceMetadata
    };
  }

  return enrichedData;
}

/**
 * Store practice telemetry to mio_practice_feedback table
 * This feeds into MIO's behavioral analysis capabilities
 */
async function storePracticeTelemetry(
  userId: string,
  practiceId: string,
  practiceType: PracticeType,
  enrichedData: EnrichedPracticeData
): Promise<void> {
  try {
    // Check if there's an existing feedback record for this practice
    const { data: existing } = await supabase
      .from('mio_practice_feedback')
      .select('id, enriched_practice_data')
      .eq('practice_id', practiceId)
      .single();

    if (existing) {
      // Update existing record with telemetry
      const { error } = await supabase
        .from('mio_practice_feedback')
        .update({
          enriched_practice_data: {
            ...(existing.enriched_practice_data as object || {}),
            session_telemetry: enrichedData.sessionTelemetry,
            practice_context: enrichedData.practiceContext
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      // Create new feedback record with telemetry
      const { error } = await supabase
        .from('mio_practice_feedback')
        .insert({
          user_id: userId,
          practice_id: practiceId,
          practice_type: practiceType,
          enriched_practice_data: {
            session_telemetry: enrichedData.sessionTelemetry,
            practice_context: enrichedData.practiceContext
          }
        });

      if (error) throw error;
    }

    console.log('[storePracticeTelemetry] Telemetry stored:', {
      practiceId,
      hasKeystrokeMetrics: !!enrichedData.sessionTelemetry?.keystrokeMetrics,
      hasVoiceMetadata: !!enrichedData.sessionTelemetry?.voiceMetadata,
      cognitiveLoad: enrichedData.sessionTelemetry?.cognitiveLoadScore
    });

  } catch (error) {
    console.error('[storePracticeTelemetry] Failed:', error);
    throw error;
  }
}

/**
 * Update an existing practice
 * Allows partial updates to practice data and completion status
 */
export async function updatePractice(
  id: string,
  updates: Partial<DailyPractice>
): Promise<void> {
  try {
    // If updating completion status, recalculate points
    let updateData: any = { ...updates };

    if (updates.completed !== undefined) {
      // Get the current practice to know its type
      const { data: currentPractice } = await supabase
        .from('daily_practices')
        .select('practice_type')
        .eq('id', id)
        .single();

      if (currentPractice) {
        const practiceType = currentPractice.practice_type as PracticeType;
        // Always use base points (no late penalty)
        updateData.points_earned = calculatePracticePoints(practiceType, false);
        updateData.is_late = false;

        if (updates.completed) {
          updateData.completed_at = new Date().toISOString();
        }
      }
    }

    updateData.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('daily_practices')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating practice:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to update practice:', error);
    throw error;
  }
}

/**
 * Calculate points for a practice based on type
 * Returns base points - no late penalties
 */
export function calculatePracticePoints(
  practiceType: PracticeType,
  _isLate: boolean // Parameter kept for backward compatibility but ignored
): number {
  // Base points for each practice type
  const config = {
    P: 4,
    R: 3,
    O: 3,
    T: 2,
    E: 4,
    C: 2,
    T2: 2
  };

  const points = config[practiceType];
  if (points === undefined) {
    console.warn(`Unknown practice type: ${practiceType}`);
    return 0;
  }

  return points; // Always return base points
}

/**
 * Check if a practice is within its designated time window
 * Returns true if current time is within the practice's scheduled window
 */
export function isWithinTimeWindow(
  practiceType: PracticeType,
  userTimezone: string = 'America/Los_Angeles'
): boolean {
  try {
    const now = new Date();
    const currentHour = parseInt(
      now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        hour12: false,
        timeZone: userTimezone
      }).split(':')[0]
    );

    // Import DAILY_SCHEDULE configuration
    const schedule = [
      {
        window: 'CHAMPIONSHIP_SETUP',
        startHour: 3,
        endHour: 10,
        practices: ['P', 'R', 'O']
      },
      {
        window: 'NASCAR_PIT_STOP',
        startHour: 10,
        endHour: 15,
        practices: ['T', 'E']
      },
      {
        window: 'VICTORY_LAP',
        startHour: 15,
        endHour: 22,
        practices: ['C', 'T2']
      }
    ];

    // Find which window this practice belongs to
    const practiceWindow = schedule.find(window =>
      window.practices.includes(practiceType)
    );

    if (!practiceWindow) {
      console.warn(`Practice type ${practiceType} not found in schedule`);
      return false;
    }

    // Check if current time is within the window
    return currentHour >= practiceWindow.startHour &&
           currentHour < practiceWindow.endHour;
  } catch (error) {
    console.error('Error checking time window:', error);
    return false;
  }
}

/**
 * Get comprehensive user statistics
 * Calculates points, streaks, completion rates, and championship level
 */
export async function getUserStats(userId: string): Promise<UserStats> {
  try {
    // Fetch all user practices
    const { data: practices, error: practicesError } = await supabase
      .from('daily_practices')
      .select('*')
      .eq('user_id', userId)
      .eq('completed', true)
      .order('practice_date', { ascending: false });

    if (practicesError) {
      console.error('Error fetching user practices:', practicesError);
      throw practicesError;
    }

    // Fetch streak data
    const { data: streakData, error: streakError } = await supabase
      .from('practice_streaks')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (streakError && streakError.code !== 'PGRST116') { // Not found is OK
      console.error('Error fetching streak data:', streakError);
    }

    // Calculate statistics
    const totalPractices = practices?.length || 0;
    const totalPoints = practices?.reduce((sum, p) => sum + (p.points_earned || 0), 0) || 0;

    // Get unique days to calculate average
    const uniqueDays = new Set(practices?.map(p => p.practice_date) || []);
    const averagePointsPerDay = uniqueDays.size > 0
      ? Math.round(totalPoints / uniqueDays.size)
      : 0;

    // Calculate completion rate (7 practices per day expected)
    const expectedPracticesPerDay = 7;
    const completionRate = uniqueDays.size > 0
      ? Math.round((totalPractices / (uniqueDays.size * expectedPracticesPerDay)) * 100)
      : 0;

    // Build practice breakdown
    const practiceBreakdown: Record<PracticeType, { completed: number; totalPoints: number }> = {
      P: { completed: 0, totalPoints: 0 },
      R: { completed: 0, totalPoints: 0 },
      O: { completed: 0, totalPoints: 0 },
      T: { completed: 0, totalPoints: 0 },
      E: { completed: 0, totalPoints: 0 },
      C: { completed: 0, totalPoints: 0 },
      T2: { completed: 0, totalPoints: 0 }
    };

    practices?.forEach(practice => {
      const type = practice.practice_type as PracticeType;
      if (practiceBreakdown[type]) {
        practiceBreakdown[type].completed++;
        practiceBreakdown[type].totalPoints += practice.points_earned || 0;
      }
    });

    // Determine championship level based on total points
    let championshipLevel: 'bronze' | 'silver' | 'gold' | 'platinum';
    if (totalPoints >= 10000) {
      championshipLevel = 'platinum';
    } else if (totalPoints >= 5000) {
      championshipLevel = 'gold';
    } else if (totalPoints >= 2500) {
      championshipLevel = 'silver';
    } else {
      championshipLevel = 'bronze';
    }

    return {
      totalPoints,
      currentStreak: streakData?.current_streak || 0,
      longestStreak: streakData?.longest_streak || 0,
      totalPractices,
      completionRate,
      averagePointsPerDay,
      championshipLevel,
      practiceBreakdown
    };
  } catch (error) {
    console.error('Failed to get user stats:', error);
    throw error;
  }
}

/**
 * Get practices for a specific date range
 * Useful for weekly/monthly summaries
 */
export async function getPracticesByDateRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<DailyPractice[]> {
  try {
    const { data, error } = await supabase
      .from('daily_practices')
      .select('*')
      .eq('user_id', userId)
      .gte('practice_date', startDate)
      .lte('practice_date', endDate)
      .order('practice_date', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching practices by date range:', error);
      throw error;
    }

    return (data as DailyPractice[]) || [];
  } catch (error) {
    console.error('Failed to get practices by date range:', error);
    throw error;
  }
}

/**
 * Delete a practice (soft delete by setting deleted_at)
 * Maintains data integrity while removing from active records
 */
export async function deletePractice(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('daily_practices')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('Error deleting practice:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to delete practice:', error);
    throw error;
  }
}

/**
 * Get practice completion status for a specific day
 * Returns detailed breakdown of completed vs missed practices
 */
export async function getDailyCompletionStatus(
  userId: string,
  date: string
): Promise<PracticeCompletionStatus> {
  try {
    const practices = await getPracticesByDateRange(userId, date, date);

    const allPracticeTypes: PracticeType[] = ['P', 'R', 'O', 'T', 'E', 'C', 'T2'];
    const completedPractices = practices
      .filter(p => p.completed)
      .map(p => p.practice_type as PracticeType);

    const missedPractices = allPracticeTypes.filter(
      type => !completedPractices.includes(type)
    );

    const totalPossiblePoints = 80; // Sum of all practice points when on time
    const totalEarnedPoints = practices.reduce(
      (sum, p) => sum + (p.points_earned || 0),
      0
    );

    const completionPercentage = Math.round(
      (completedPractices.length / allPracticeTypes.length) * 100
    );

    // Count completed windows
    const windowsCompleted = [
      ['P', 'R', 'O'].every(p => completedPractices.includes(p as PracticeType)),
      ['T', 'E'].every(p => completedPractices.includes(p as PracticeType)),
      ['C', 'T2'].every(p => completedPractices.includes(p as PracticeType))
    ].filter(Boolean).length;

    return {
      userId,
      date,
      totalPossiblePoints,
      totalEarnedPoints,
      completionPercentage,
      windowsCompleted,
      totalWindows: 3,
      practicesCompleted: completedPractices,
      practicesMissed: missedPractices,
      isFullyComplete: completedPractices.length === allPracticeTypes.length
    };
  } catch (error) {
    console.error('Failed to get daily completion status:', error);
    throw error;
  }
}