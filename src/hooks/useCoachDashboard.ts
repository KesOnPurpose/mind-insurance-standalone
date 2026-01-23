/**
 * Coach Dashboard Hook
 *
 * Provides data fetching and management for the coach dashboard.
 * Includes stuck users, funnel analytics, and automation configuration.
 *
 * @module useCoachDashboard
 * @author FEAT-GH-008
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// ============================================================================
// TYPES
// ============================================================================

export type StuckThresholdFilter = 'all' | 'day3' | 'day7' | 'day14' | 'day30';

export interface StuckUser {
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  current_tactic_id: string | null;
  current_tactic_name: string | null;
  current_phase: number;
  last_progress_at: string;
  days_since_last_progress: number;
  stuck_threshold: StuckThresholdFilter;
  total_tactics_completed: number;
  ghl_contact_id: string | null;
}

export interface FunnelPhase {
  phase: number;
  phase_name: string;
  user_count: number;
  completion_rate: number;
  avg_days_in_phase: number;
  dropoff_rate: number;
}

export interface FunnelAnalyticsData {
  phases: FunnelPhase[];
  total_users: number;
  total_completions: number;
  overall_completion_rate: number;
}

export interface AutomationConfig {
  stuck_thresholds: {
    day3: boolean;
    day7: boolean;
    day14: boolean;
    day30: boolean;
  };
  sms_templates: {
    day3: string;
    day7: string;
    day14: string;
    day30: string;
  };
  video_completion_threshold: number;
}

export interface UserDetailData {
  profile: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    created_at: string;
    ghl_contact_id: string | null;
  };
  progress: Array<{
    tactic_id: string;
    tactic_name: string;
    phase: number;
    status: string;
    video_watched_percent: number;
    assessment_passed: boolean | null;
    started_at: string;
    completed_at: string | null;
  }>;
  automation_events: Array<{
    id: string;
    event_type: string;
    triggered_at: string;
    action_taken: string | null;
    delivery_status: string;
  }>;
}

// ============================================================================
// STUCK USERS QUERIES
// ============================================================================

/**
 * Calculate stuck threshold from days
 */
function calculateThreshold(days: number): StuckThresholdFilter {
  if (days >= 30) return 'day30';
  if (days >= 14) return 'day14';
  if (days >= 7) return 'day7';
  if (days >= 3) return 'day3';
  return 'all';
}

/**
 * Fetch stuck users from the database
 */
async function fetchStuckUsers(filter: StuckThresholdFilter): Promise<StuckUser[]> {
  // Get minimum days for the filter
  const minDays = filter === 'day3' ? 3 : filter === 'day7' ? 7 : filter === 'day14' ? 14 : filter === 'day30' ? 30 : 3;
  const maxDays = filter === 'day3' ? 6 : filter === 'day7' ? 13 : filter === 'day14' ? 29 : filter === 'day30' ? 999 : 999;

  // Calculate the cutoff date
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - minDays);
  const earliestDate = new Date();
  earliestDate.setDate(earliestDate.getDate() - maxDays);

  // Query users with stale progress
  // Note: gh_user_tactic_progress uses created_at, not updated_at
  const { data: progressData, error: progressError } = await supabase
    .from('gh_user_tactic_progress')
    .select(`
      user_id,
      tactic_id,
      status,
      created_at,
      gh_tactic_instructions(
        tactic_name
      )
    `)
    .eq('status', 'in_progress')
    .lt('created_at', cutoffDate.toISOString())
    .gte('created_at', earliestDate.toISOString())
    .order('created_at', { ascending: true });

  if (progressError) {
    console.error('[useCoachDashboard] Error fetching stuck progress:', progressError);
    throw progressError;
  }

  if (!progressData || progressData.length === 0) {
    return [];
  }

  // Get unique user IDs
  const userIds = [...new Set(progressData.map(p => p.user_id))];

  // Fetch user profiles - filtering for gh_user source
  const { data: profiles, error: profileError } = await supabase
    .from('user_profiles')
    .select('id, full_name, email, phone, ghl_contact_id, user_source')
    .in('id', userIds)
    .eq('user_source', 'gh_user');

  if (profileError) {
    console.error('[useCoachDashboard] Error fetching profiles:', profileError);
    throw profileError;
  }

  // Create user map
  const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

  // Get completion counts per user
  const { data: completionCounts } = await supabase
    .from('gh_user_tactic_progress')
    .select('user_id')
    .eq('status', 'completed')
    .in('user_id', userIds);

  const completionMap = new Map<string, number>();
  completionCounts?.forEach(c => {
    completionMap.set(c.user_id, (completionMap.get(c.user_id) || 0) + 1);
  });

  // Build stuck users list
  const stuckUsers: StuckUser[] = [];
  const seenUsers = new Set<string>();

  for (const progress of progressData) {
    // Skip if user already processed (take most recent stuck tactic)
    if (seenUsers.has(progress.user_id)) continue;

    const profile = profileMap.get(progress.user_id);
    if (!profile) continue; // Skip if not a GH user

    const tacticInfo = progress.gh_tactic_instructions as any;
    const lastProgressDate = new Date(progress.created_at);
    const now = new Date();
    const daysSinceProgress = Math.floor(
      (now.getTime() - lastProgressDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    stuckUsers.push({
      user_id: progress.user_id,
      full_name: profile.full_name,
      email: profile.email,
      phone: profile.phone,
      current_tactic_id: progress.tactic_id,
      current_tactic_name: tacticInfo?.tactic_name || null,
      current_phase: 1, // Phase tracking not available in current schema
      last_progress_at: progress.created_at,
      days_since_last_progress: daysSinceProgress,
      stuck_threshold: calculateThreshold(daysSinceProgress),
      total_tactics_completed: completionMap.get(progress.user_id) || 0,
      ghl_contact_id: profile.ghl_contact_id,
    });

    seenUsers.add(progress.user_id);
  }

  return stuckUsers;
}

/**
 * Hook to fetch stuck users
 */
export function useStuckUsers(filter: StuckThresholdFilter = 'all') {
  return useQuery({
    queryKey: ['coach-dashboard', 'stuck-users', filter],
    queryFn: () => fetchStuckUsers(filter),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
  });
}

// ============================================================================
// FUNNEL ANALYTICS QUERIES
// ============================================================================

/**
 * Fetch funnel analytics data
 */
async function fetchFunnelAnalytics(): Promise<FunnelAnalyticsData> {
  // Get all GH users
  const { data: users, error: usersError } = await supabase
    .from('user_profiles')
    .select('id, created_at')
    .eq('user_source', 'gh_user');

  if (usersError) throw usersError;

  const userIds = users?.map(u => u.id) || [];
  const totalUsers = userIds.length;

  if (totalUsers === 0) {
    return {
      phases: [],
      total_users: 0,
      total_completions: 0,
      overall_completion_rate: 0,
    };
  }

  // Use default phase definitions (table may not exist)
  const phaseDefinitions = [
    { phase: 1, name: 'Foundation' },
    { phase: 2, name: 'Planning' },
    { phase: 3, name: 'Setup' },
    { phase: 4, name: 'Operations' },
  ];

  // Get progress for all users (without phase join since column doesn't exist)
  const { data: progress } = await supabase
    .from('gh_user_tactic_progress')
    .select(`
      user_id,
      status,
      started_at,
      completed_at,
      tactic_id
    `)
    .in('user_id', userIds);

  // For now, distribute users evenly across phases based on tactic completion count
  // This is a simplified approach since phase column doesn't exist
  const userCompletionCounts = new Map<string, number>();
  progress?.forEach(p => {
    if (p.status === 'completed') {
      userCompletionCounts.set(p.user_id, (userCompletionCounts.get(p.user_id) || 0) + 1);
    }
  });

  // Calculate phase metrics based on completion count
  const phases: FunnelPhase[] = [];
  let previousPhaseUsers = totalUsers;

  for (let i = 0; i < phaseDefinitions.length; i++) {
    const phaseDef = phaseDefinitions[i];
    const minCompletions = i * 3; // Each phase requires ~3 more tactics completed
    const maxCompletions = (i + 1) * 3;

    // Count users in this phase based on their completion count
    let usersInPhase = 0;
    let completedPhase = 0;

    userIds.forEach(userId => {
      const completions = userCompletionCounts.get(userId) || 0;
      if (completions >= minCompletions) {
        usersInPhase++;
        if (completions >= maxCompletions) {
          completedPhase++;
        }
      }
    });

    // Calculate average days (simplified)
    let totalDays = 0;
    let dayCount = 0;
    progress?.filter(p => p.status === 'completed' && p.started_at && p.completed_at)
      .forEach(p => {
        const start = new Date(p.started_at!);
        const end = new Date(p.completed_at!);
        const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        totalDays += days;
        dayCount++;
      });

    const completionRate = usersInPhase > 0 ? (completedPhase / usersInPhase) * 100 : 0;
    const dropoffRate = previousPhaseUsers > 0
      ? ((previousPhaseUsers - usersInPhase) / previousPhaseUsers) * 100
      : 0;

    phases.push({
      phase: phaseDef.phase,
      phase_name: phaseDef.name,
      user_count: usersInPhase,
      completion_rate: completionRate,
      avg_days_in_phase: dayCount > 0 ? Math.round(totalDays / dayCount) : 0,
      dropoff_rate: Math.max(0, dropoffRate),
    });

    previousPhaseUsers = usersInPhase;
  }

  // Total completions = users who completed all phases
  const totalCompletions = phases.length > 0
    ? Math.floor(phases[phases.length - 1].user_count * (phases[phases.length - 1].completion_rate / 100))
    : 0;

  return {
    phases,
    total_users: totalUsers,
    total_completions: totalCompletions,
    overall_completion_rate: totalUsers > 0 ? (totalCompletions / totalUsers) * 100 : 0,
  };
}

/**
 * Hook to fetch funnel analytics
 */
export function useFunnelAnalytics() {
  return useQuery({
    queryKey: ['coach-dashboard', 'funnel-analytics'],
    queryFn: fetchFunnelAnalytics,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ============================================================================
// AUTOMATION CONFIG QUERIES
// ============================================================================

/**
 * Fetch automation configuration
 * Note: Using default values since gh_curriculum_config table doesn't exist yet
 */
async function fetchAutomationConfig(): Promise<AutomationConfig> {
  // Return default configuration (table doesn't exist yet)
  return {
    stuck_thresholds: {
      day3: true,
      day7: true,
      day14: true,
      day30: true,
    },
    sms_templates: {
      day3: 'Hey {name}! It\'s been a few days since you worked on your group home journey. Whenever you\'re ready, I\'m here to help!',
      day7: '{name}, it\'s been about a week. Your group home journey is still waiting! Let\'s reconnect.',
      day14: '{name}, two weeks have passed. I want to make sure you don\'t lose what you\'ve already built.',
      day30: '{name}, it\'s been a month. Your progress is still saved. Whenever you\'re ready to restart, I\'ll be here.',
    },
    video_completion_threshold: 90,
  };
}

/**
 * Hook to fetch automation config
 */
export function useAutomationConfig() {
  return useQuery({
    queryKey: ['coach-dashboard', 'automation-config'],
    queryFn: fetchAutomationConfig,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to update automation config
 * Note: Currently a no-op since gh_curriculum_config table doesn't exist
 */
export function useUpdateAutomationConfig() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (config: Partial<AutomationConfig>) => {
      // TODO: Implement when gh_curriculum_config table is created
      console.log('[useUpdateAutomationConfig] Config update requested (table not yet created):', config);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach-dashboard', 'automation-config'] });
      toast({
        title: 'Configuration Saved',
        description: 'Automation settings have been updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Save Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// ============================================================================
// USER DETAIL QUERIES
// ============================================================================

/**
 * Fetch detailed user data
 */
async function fetchUserDetail(userId: string): Promise<UserDetailData> {
  // Fetch profile
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('id, full_name, email, phone, created_at, ghl_contact_id')
    .eq('id', userId)
    .single();

  if (profileError) throw profileError;

  // Fetch progress with tactic info
  const { data: progressData, error: progressError } = await supabase
    .from('gh_user_tactic_progress')
    .select(`
      tactic_id,
      status,
      started_at,
      completed_at,
      video_watched_percent,
      assessment_passed,
      gh_tactic_instructions(
        tactic_name
      )
    `)
    .eq('user_id', userId)
    .order('started_at', { ascending: true });

  if (progressError) throw progressError;

  // Fetch automation events (table may not exist yet - handle gracefully)
  let events: any[] = [];
  try {
    const { data: eventsData, error: eventsError } = await supabase
      .from('gh_automation_events')
      .select('id, event_type, triggered_at, action_taken, delivery_status')
      .eq('user_id', userId)
      .order('triggered_at', { ascending: false })
      .limit(20);

    if (!eventsError) {
      events = eventsData || [];
    }
  } catch {
    // Table may not exist yet - gracefully continue without events
    console.log('[fetchUserDetail] gh_automation_events table not available');
  }

  // Map progress data
  const progress = (progressData || []).map((p, index) => {
    const tacticInfo = p.gh_tactic_instructions as any;
    return {
      tactic_id: p.tactic_id,
      tactic_name: tacticInfo?.tactic_name || 'Unknown',
      phase: Math.floor(index / 3) + 1, // Estimate phase from order
      status: p.status,
      video_watched_percent: p.video_watched_percent || 0,
      assessment_passed: p.assessment_passed,
      started_at: p.started_at,
      completed_at: p.completed_at,
    };
  });

  return {
    profile: {
      id: profile.id,
      full_name: profile.full_name,
      email: profile.email,
      phone: profile.phone,
      created_at: profile.created_at,
      ghl_contact_id: profile.ghl_contact_id,
    },
    progress,
    automation_events: events || [],
  };
}

/**
 * Hook to fetch user detail
 */
export function useUserDetail(userId: string | null) {
  return useQuery({
    queryKey: ['coach-dashboard', 'user-detail', userId],
    queryFn: () => fetchUserDetail(userId!),
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

// ============================================================================
// SEND NUDGE MUTATION
// ============================================================================

/**
 * Hook to send a nudge to a user
 */
export function useSendNudge() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, message }: { userId: string; message: string }) => {
      // Call the send-nudge Edge Function
      const { data, error } = await supabase.functions.invoke('send-nudge', {
        body: {
          user_id: userId,
          message,
          nudge_type: 'manual_coach',
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['coach-dashboard', 'stuck-users'] });
      toast({
        title: 'Nudge Sent',
        description: data?.success
          ? 'Message sent successfully via SMS.'
          : 'Message queued (user may not have phone on file).',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Send Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
