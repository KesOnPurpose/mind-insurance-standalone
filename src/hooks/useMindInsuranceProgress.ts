import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface MindInsuranceProgress {
  currentStreak: number;
  longestStreak: number;
  weeklyPractices: number;
  weeklyGoal: number;
  patternAwareness: number;
  recentWin: string | null;
  totalPoints: number;
  championshipLevel: string;
}

/**
 * Calculate streak from an array of practice dates
 * Returns { currentStreak, longestStreak }
 */
function calculateStreaksFromDates(practiceDates: string[]): { currentStreak: number; longestStreak: number } {
  if (!practiceDates.length) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Get unique dates and sort descending (newest first)
  const uniqueDates = [...new Set(practiceDates)].sort().reverse();

  // Get today's date in YYYY-MM-DD format
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Calculate current streak (consecutive days from today or yesterday)
  let currentStreak = 0;
  const checkDate = new Date(today);

  // Check if the most recent practice is today or yesterday
  const mostRecentDate = uniqueDates[0];
  const daysSinceLastPractice = Math.floor(
    (today.getTime() - new Date(mostRecentDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  // If last practice was more than 1 day ago, streak is broken
  if (daysSinceLastPractice > 1) {
    currentStreak = 0;
  } else {
    // Start from today and count backwards
    for (let i = 0; i < 365; i++) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (uniqueDates.includes(dateStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (i === 0) {
        // If no practice today, check if yesterday had one (streak continues)
        checkDate.setDate(checkDate.getDate() - 1);
        const yesterdayStr = checkDate.toISOString().split('T')[0];
        if (uniqueDates.includes(yesterdayStr)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      } else {
        break;
      }
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 1;

  // Sort dates ascending for longest streak calculation
  const sortedAsc = [...uniqueDates].sort();

  for (let i = 1; i < sortedAsc.length; i++) {
    const prevDate = new Date(sortedAsc[i - 1]);
    const currDate = new Date(sortedAsc[i]);
    const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  return { currentStreak, longestStreak };
}

/**
 * Fetch Mind Insurance progress data for the sidebar panel
 * Returns streak, weekly progress, pattern awareness, and recent wins
 *
 * STREAKS ARE CALCULATED FROM ACTUAL PRACTICE DATA (not broken user_profiles columns)
 */
export function useMindInsuranceProgress() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['mindInsuranceProgress', user?.id],
    queryFn: async (): Promise<MindInsuranceProgress> => {
      if (!user?.id) throw new Error('User not authenticated');

      // Fetch all completed practice dates for streak calculation
      const { data: allPractices } = await supabase
        .from('daily_practices')
        .select('practice_date, points_earned')
        .eq('user_id', user.id)
        .eq('completed', true)
        .order('practice_date', { ascending: false });

      // Calculate streaks from actual practice data
      const practiceDates = allPractices?.map(p => p.practice_date) || [];
      const { currentStreak, longestStreak } = calculateStreaksFromDates(practiceDates);

      // Calculate total points
      const totalPoints = allPractices?.reduce((sum, p) => sum + (p.points_earned || 0), 0) || 0;

      // Determine championship level based on points
      let championshipLevel = 'bronze';
      if (totalPoints >= 10000) championshipLevel = 'platinum';
      else if (totalPoints >= 5000) championshipLevel = 'gold';
      else if (totalPoints >= 2500) championshipLevel = 'silver';

      // Get weekly practices count (current calendar week)
      const today = new Date();
      const dayOfWeek = today.getDay();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - dayOfWeek);
      startOfWeek.setHours(0, 0, 0, 0);
      const startOfWeekStr = startOfWeek.toISOString().split('T')[0];

      const weeklyPractices = allPractices?.filter(p => p.practice_date >= startOfWeekStr).length || 0;

      // Calculate pattern awareness from P-type practices completed in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

      const { data: patternPractices } = await supabase
        .from('daily_practices')
        .select('practice_date')
        .eq('user_id', user.id)
        .eq('practice_type', 'P')
        .eq('completed', true)
        .gte('practice_date', thirtyDaysAgoStr);

      const uniquePatternDays = new Set(patternPractices?.map(p => p.practice_date) || []);
      const patternAwareness = Math.min(100, Math.round((uniquePatternDays.size / 30) * 100));

      // Get recent win from latest completed C (Celebrate Wins) practice
      const { data: recentCelebration } = await supabase
        .from('daily_practices')
        .select('data')
        .eq('user_id', user.id)
        .eq('practice_type', 'C')
        .eq('completed', true)
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Extract win text from celebration data
      let recentWin: string | null = null;
      if (recentCelebration?.data) {
        const celebrationData = recentCelebration.data as Record<string, unknown>;
        recentWin = (celebrationData.win as string) ||
                    (celebrationData.celebration as string) ||
                    (celebrationData.text as string) ||
                    null;
      }

      return {
        currentStreak,
        longestStreak,
        weeklyPractices,
        weeklyGoal: 49, // 7 practices per day * 7 days
        patternAwareness,
        recentWin,
        totalPoints,
        championshipLevel,
      };
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes - refresh frequently for practice updates
    refetchOnWindowFocus: true, // Refresh when user returns to app
  });
}

export default useMindInsuranceProgress;
